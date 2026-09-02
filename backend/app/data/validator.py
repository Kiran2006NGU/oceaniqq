"""
backend/app/data/validator.py — Ocean Data Validation & QC Layer
SIH 26067 | Ocean Intelligence Platform Backend

Validates dimensions, coordinates, physical ranges, and unit compatibility
for ocean model and in-situ observation datasets without crashing on corrupt inputs.
"""

from __future__ import annotations

import logging
from typing import Any, Optional
import numpy as np
import pandas as pd

from app.data.normalizer import check_unit_compatibility

logger = logging.getLogger(__name__)

# Physical oceanographic plausibility ranges
PHYSICAL_RANGES: dict[str, tuple[float, float]] = {
    "temperature": (-3.0, 45.0),       # °C
    "salinity": (0.0, 48.0),            # PSU
    "chlorophyll": (0.0, 100.0),        # mg/m³
    "current_u": (-10.0, 10.0),         # m/s
    "current_v": (-10.0, 10.0),         # m/s
    "current_w": (-2.0, 2.0),           # m/s
    "current_velocity": (0.0, 15.0),    # m/s
}


class OceanDataValidator:
    """Validates data structures, coordinate consistency, and physical bounds."""

    def validate_dataframe(
        self,
        df: pd.DataFrame,
        variable: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Validates normalized DataFrame records.
        Returns validation status, errors, warnings, and record statistics.
        """
        errors: list[str] = []
        warnings: list[str] = []

        if df.empty:
            return {
                "is_valid": False,
                "errors": ["Dataset contains 0 records."],
                "warnings": [],
                "valid_records_count": 0,
                "total_records_count": 0,
            }

        total_records = len(df)

        # 1. Coordinate Validation
        if "latitude" not in df.columns or df["latitude"].isna().all():
            errors.append("Missing required coordinate column: 'latitude' is not found or is entirely null.")
        else:
            lats = pd.to_numeric(df["latitude"], errors="coerce")
            invalid_lats = df[(lats < -90) | (lats > 90)]
            if len(invalid_lats) > 0:
                errors.append(f"{len(invalid_lats)} records have invalid latitudes outside [-90°, +90°].")

        if "longitude" not in df.columns or df["longitude"].isna().all():
            errors.append("Missing required coordinate column: 'longitude' is not found or is entirely null.")
        else:
            lons = pd.to_numeric(df["longitude"], errors="coerce")
            invalid_lons = df[(lons < -180) | (lons > 180)]
            if len(invalid_lons) > 0:
                errors.append(f"{len(invalid_lons)} records have invalid longitudes outside [-180°, +180°].")

        if "depth" in df.columns:
            depths = pd.to_numeric(df["depth"], errors="coerce")
            invalid_depths = df[(depths < 0) | (depths > 11000)]
            if len(invalid_depths) > 0:
                warnings.append(f"{len(invalid_depths)} records have unusual depth values (< 0m or > 11,000m).")

        # 2. Variable Bounds Validation
        if variable and variable in df.columns:
            vals = pd.to_numeric(df[variable], errors="coerce")
            valid_vals = vals.dropna()
            if valid_vals.empty:
                errors.append(f"No valid numeric data found for selected variable '{variable}'.")
            else:
                bounds = PHYSICAL_RANGES.get(variable)
                if bounds:
                    min_allowed, max_allowed = bounds
                    out_of_bounds = df[(vals < min_allowed) | (vals > max_allowed)]
                    if len(out_of_bounds) > 0:
                        warnings.append(
                            f"{len(out_of_bounds)} records for '{variable}' fall outside standard physical bounds ({min_allowed} to {max_allowed})."
                        )

        # 3. Missing Value Stats
        valid_records = total_records
        if variable and variable in df.columns:
            valid_records = int(df[variable].dropna().count())

        is_valid = len(errors) == 0 and valid_records > 0

        return {
            "is_valid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "valid_records_count": valid_records,
            "total_records_count": total_records,
        }

    def validate_comparison_inputs(
        self,
        model_unit: str,
        obs_unit: str,
        variable: str,
    ) -> tuple[bool, Optional[str]]:
        """
        Validate unit compatibility before initiating matching/comparison.
        """
        is_compat, msg = check_unit_compatibility(model_unit, obs_unit, variable)
        if not is_compat:
            return False, msg
        return True, None
