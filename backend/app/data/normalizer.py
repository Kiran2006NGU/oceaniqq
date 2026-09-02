"""
backend/app/data/normalizer.py — Common Dataset Normalizer & Unit Converter
SIH 26067 | Ocean Intelligence Platform Backend

Normalizes heterogeneous ocean datasets into the common internal schema:
  - latitude (float, -90 to 90)
  - longitude (float, -180 to 180)
  - depth (float, positive downward in metres, 0 = surface)
  - time (ISO 8601 UTC string)
  - variable (canonical name: temperature, salinity, chlorophyll, etc.)
  - value (numeric float)
  - unit (canonical unit string)
  - source (str)
  - platform_id (str)
  - qc_flag (int)

Provides safe unit conversion across standard scientific oceanographic units.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Optional, Union
import numpy as np
import pandas as pd

from app.providers.normalization import CANONICAL_VARIABLE_MAP

logger = logging.getLogger(__name__)

# Column name alias dictionaries
LAT_ALIASES = ["latitude", "lat", "lat_rho", "y", "latitude_degrees_north", "lat_deg", "nav_lat", "latitude_dd"]
LON_ALIASES = ["longitude", "lon", "lon_rho", "x", "long", "longitude_degrees_east", "lon_deg", "nav_lon", "longitude_dd"]
DEPTH_ALIASES = ["depth", "depth_m", "deptht", "dep", "z", "level", "lev", "pressure", "pres", "pres_dbar", "dbar", "depth_metres"]
TIME_ALIASES = ["time", "timestamp", "datetime", "date", "time_utc", "juld", "observation_date", "date_time", "dt"]
PLATFORM_ALIASES = ["platform_id", "platform", "wmo", "wmo_id", "station", "station_id", "float_id", "glider_id", "id", "name"]
QC_ALIASES = ["qc_flag", "qc", "quality_flag", "quality", "flag", "temp_qc", "psal_qc"]

# Standard canonical units for OceanIQ variables
CANONICAL_UNITS: dict[str, str] = {
    "temperature": "°C",
    "salinity": "PSU",
    "chlorophyll": "mg m⁻³",
    "current_u": "m/s",
    "current_v": "m/s",
    "current_w": "m/s",
    "current_velocity": "m/s",
}


def find_column_by_aliases(columns: list[str], aliases: list[str]) -> Optional[str]:
    """Find matching column name case-insensitively from a list of aliases."""
    col_map = {c.lower().strip().replace(" ", "_"): c for c in columns}
    for alias in aliases:
        a_clean = alias.lower().strip().replace(" ", "_")
        if a_clean in col_map:
            return col_map[a_clean]
    return None


def clean_unit_string(unit: Optional[str]) -> str:
    """Normalize unit string representation."""
    if not unit or unit == "None":
        return ""
    u = str(unit).strip().replace("degC", "°C").replace("degrees_celsius", "°C").replace("deg C", "°C")
    u = u.replace("degree_celsius", "°C").replace("Celsius", "°C")
    u = u.replace("psu", "PSU").replace("practical_salinity_unit", "PSU").replace("1e-3", "PSU")
    u = u.replace("mg/m3", "mg m⁻³").replace("mg/m^3", "mg m⁻³").replace("mg m-3", "mg m⁻³")
    u = u.replace("meter/sec", "m/s").replace("meters/second", "m/s").replace("m s-1", "m/s").replace("m/sec", "m/s")
    return u


def check_unit_compatibility(unit_a: str, unit_b: str, variable: str) -> tuple[bool, str]:
    """
    Check if two units are compatible for a given ocean variable.
    Returns (is_compatible, explanation_or_normalized_unit).
    """
    ua = clean_unit_string(unit_a).lower()
    ub = clean_unit_string(unit_b).lower()

    if not ua or not ub:
        # Default to canonical unit if missing
        return True, CANONICAL_UNITS.get(variable, "")

    # Direct match
    if ua == ub:
        return True, clean_unit_string(unit_a)

    if variable == "temperature":
        temp_units = {"°c", "c", "celsius", "k", "kelvin", "f", "fahrenheit", "deg_c"}
        if ua in temp_units and ub in temp_units:
            return True, "°C"
        return False, f"Incompatible temperature units: '{unit_a}' vs '{unit_b}'"

    if variable == "salinity":
        sal_units = {"psu", "ppt", "g/kg", "1", "dimensionless", "practical salinity", "psu-78"}
        if ua in sal_units and ub in sal_units:
            return True, "PSU"
        return False, f"Incompatible salinity units: '{unit_a}' vs '{unit_b}'"

    if variable == "chlorophyll":
        chl_units = {"mg m⁻³", "mg/m3", "mg/m^3", "mg m-3", "ug/l", "ug l-1", "mg/l", "microgram/l"}
        if ua in chl_units and ub in chl_units:
            return True, "mg m⁻³"
        return False, f"Incompatible chlorophyll units: '{unit_a}' vs '{unit_b}'"

    if variable in ("current_u", "current_v", "current_w", "current_velocity", "velocity"):
        vel_units = {"m/s", "m s-1", "m/sec", "cm/s", "cm s-1", "knots", "kt", "knot"}
        if ua in vel_units and ub in vel_units:
            return True, "m/s"
        return False, f"Incompatible velocity units: '{unit_a}' vs '{unit_b}'"

    return False, f"Unknown or incompatible units: '{unit_a}' vs '{unit_b}' for variable '{variable}'"


def convert_value_to_canonical(val: Optional[float], from_unit: str, variable: str) -> Optional[float]:
    """
    Converts a single value to the canonical unit for the given variable.
    """
    if val is None or np.isnan(val) or np.isinf(val):
        return None

    unit = clean_unit_string(from_unit).lower()

    if variable == "temperature":
        if unit in ("k", "kelvin"):
            return round(val - 273.15, 3)
        if unit in ("f", "fahrenheit"):
            return round((val - 32.0) * 5.0 / 9.0, 3)
        return round(val, 3)

    if variable == "salinity":
        # PSU, ppt, g/kg are all 1:1 on practical ocean scales
        return round(val, 3)

    if variable == "chlorophyll":
        if unit in ("mg/l", "milligram/l"):
            # 1 mg/L = 1000 mg/m³
            return round(val * 1000.0, 4)
        return round(val, 4)

    if variable in ("current_u", "current_v", "current_w", "current_velocity", "velocity"):
        if unit in ("cm/s", "cm s-1", "cm/sec"):
            return round(val / 100.0, 4)
        if unit in ("knots", "kt", "knot"):
            return round(val * 0.514444, 4)
        return round(val, 4)

    return round(val, 4)


class OceanDataNormalizer:
    """Normalizes tabular ocean records into the canonical internal schema."""

    def normalize_dataframe(
        self,
        df: pd.DataFrame,
        source_name: str = "Uploaded Dataset",
        target_variable: Optional[str] = None,
        default_platform_id: Optional[str] = None,
    ) -> tuple[pd.DataFrame, dict[str, Any]]:
        """
        Normalize an arbitrary DataFrame:
        1. Identify coordinates (lat, lon, depth, time)
        2. Identify data variable columns
        3. Standardize ranges and units
        4. Output common schema DataFrame + metadata dictionary
        """
        if df.empty:
            raise ValueError("Input dataset is empty (0 records)")

        cols = list(df.columns)

        lat_col = find_column_by_aliases(cols, LAT_ALIASES)
        lon_col = find_column_by_aliases(cols, LON_ALIASES)
        depth_col = find_column_by_aliases(cols, DEPTH_ALIASES)
        time_col = find_column_by_aliases(cols, TIME_ALIASES)
        platform_col = find_column_by_aliases(cols, PLATFORM_ALIASES)
        qc_col = find_column_by_aliases(cols, QC_ALIASES)

        # Detect candidate data variables
        detected_vars: dict[str, str] = {}  # {canonical_name: original_col}
        for col in cols:
            if col in (lat_col, lon_col, depth_col, time_col, platform_col, qc_col):
                continue
            col_lower = col.lower().strip().replace(" ", "_")
            if col_lower in CANONICAL_VARIABLE_MAP:
                detected_vars[CANONICAL_VARIABLE_MAP[col_lower]] = col
            else:
                # Check substrings
                for src, canon in CANONICAL_VARIABLE_MAP.items():
                    if src in col_lower and canon not in detected_vars:
                        detected_vars[canon] = col
                        break

        # Build normalized rows
        norm_df = pd.DataFrame()

        # 1. Latitude
        if lat_col:
            norm_df["latitude"] = pd.to_numeric(df[lat_col], errors="coerce")
        else:
            # If dataset has no latitude (e.g. fixed mooring), assign default 0.0
            norm_df["latitude"] = 0.0

        # 2. Longitude: Convert 0..360 to -180..180 if needed
        if lon_col:
            lons = pd.to_numeric(df[lon_col], errors="coerce")
            norm_df["longitude"] = lons.apply(lambda x: (((x + 180) % 360) - 180) if pd.notnull(x) else np.nan)
        else:
            norm_df["longitude"] = 0.0

        # 3. Depth: Ensure positive downward (0 = surface, 100 = 100m depth)
        if depth_col:
            depths = pd.to_numeric(df[depth_col], errors="coerce")
            norm_df["depth"] = depths.abs()
        else:
            norm_df["depth"] = 0.0

        # 4. Time: Standardize to ISO 8601 UTC string
        if time_col:
            try:
                ts_series = pd.to_datetime(df[time_col], utc=True, errors="coerce")
                norm_df["time"] = ts_series.dt.strftime("%Y-%m-%dT%H:%M:%SZ").fillna("2026-08-28T12:00:00Z")
            except Exception:
                norm_df["time"] = "2026-08-28T12:00:00Z"
        else:
            norm_df["time"] = "2026-08-28T12:00:00Z"

        # 5. Platform ID
        if platform_col:
            norm_df["platform_id"] = df[platform_col].astype(str).fillna(default_platform_id or "IN_SITU_01")
        else:
            norm_df["platform_id"] = default_platform_id or "IN_SITU_01"

        # 6. QC Flag
        if qc_col:
            norm_df["qc_flag"] = pd.to_numeric(df[qc_col], errors="coerce").fillna(1).astype(int)
        else:
            norm_df["qc_flag"] = 1

        norm_df["source"] = source_name

        # Copy over detected variable columns into norm_df
        for canon_var, orig_col in detected_vars.items():
            norm_df[canon_var] = pd.to_numeric(df[orig_col], errors="coerce")

        # Metadata summary
        lat_valid = norm_df["latitude"].dropna()
        lon_valid = norm_df["longitude"].dropna()
        depth_valid = norm_df["depth"].dropna()

        meta = {
            "record_count": len(norm_df),
            "detected_variables": list(detected_vars.keys()),
            "variable_column_mapping": detected_vars,
            "has_spatial_coords": lat_col is not None and lon_col is not None,
            "has_depth": depth_col is not None,
            "has_time": time_col is not None,
            "spatial_bounds": {
                "lat_min": float(lat_valid.min()) if not lat_valid.empty else None,
                "lat_max": float(lat_valid.max()) if not lat_valid.empty else None,
                "lon_min": float(lon_valid.min()) if not lon_valid.empty else None,
                "lon_max": float(lon_valid.max()) if not lon_valid.empty else None,
            },
            "depth_range": {
                "min": float(depth_valid.min()) if not depth_valid.empty else 0.0,
                "max": float(depth_valid.max()) if not depth_valid.empty else 0.0,
            },
        }

        return norm_df, meta
