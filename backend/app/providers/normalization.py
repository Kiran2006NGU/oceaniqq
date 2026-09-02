"""
providers/normalization.py — NetCDF Coordinate & Variable Normalization Layer
SIH 26067 | Ocean Intelligence Platform Backend

Normalizes heterogeneous oceanographic data (e.g. INCOIS HYCOM, ROMS, Argo GDAC)
into canonical OceanIQ standards without altering the original files.
"""

from __future__ import annotations

import logging
from typing import Optional
import numpy as np
import pandas as pd
import xarray as xr

logger = logging.getLogger(__name__)

# ── Canonical Variable Mapping Dictionary ──────────────────────────────────────
# Maps standard CF names, INCOIS short names, and NEMO/HYCOM/ROMS names to OceanIQ standard names

CANONICAL_VARIABLE_MAP: dict[str, str] = {
    # Temperature
    "temperature": "temperature",
    "temp": "temperature",
    "thetao": "temperature",
    "sea_water_potential_temperature": "temperature",
    "sea_water_temperature": "temperature",
    "sst": "temperature",
    
    # Salinity
    "salinity": "salinity",
    "salt": "salinity",
    "so": "salinity",
    "sea_water_salinity": "salinity",
    "sea_water_practical_salinity": "salinity",
    "sss": "salinity",

    # Chlorophyll
    "chlorophyll": "chlorophyll",
    "chl": "chlorophyll",
    "chla": "chlorophyll",
    "mass_concentration_of_chlorophyll_a_in_sea_water": "chlorophyll",

    # Zonal Velocity (Eastward)
    "current_u": "current_u",
    "u": "current_u",
    "uo": "current_u",
    "u_east": "current_u",
    "eastward_sea_water_velocity": "current_u",

    # Meridional Velocity (Northward)
    "current_v": "current_v",
    "v": "current_v",
    "vo": "current_v",
    "v_north": "current_v",
    "northward_sea_water_velocity": "current_v",

    # Vertical Velocity
    "current_w": "current_w",
    "w": "current_w",
    "wo": "current_w",
    "upward_sea_water_velocity": "current_w",

    # Current Velocity Magnitude
    "current_velocity": "current_velocity",
    "velocity": "current_velocity",
}

# Dimension name aliases
LAT_ALIASES = ["latitude", "lat", "nav_lat", "lat_rho", "y"]
LON_ALIASES = ["longitude", "lon", "nav_lon", "lon_rho", "x"]
DEPTH_ALIASES = ["depth", "deptht", "lev", "level", "z", "s_rho"]
TIME_ALIASES = ["time", "time_counter", "ocean_time", "times"]


def detect_dimension_name(ds: xr.Dataset, aliases: list[str]) -> Optional[str]:
    """Find the first matching dimension or coordinate name in the dataset."""
    for alias in aliases:
        if alias in ds.coords or alias in ds.dims:
            return alias
    return None


def resolve_canonical_variable(ds: xr.Dataset, canonical_name: str) -> Optional[str]:
    """
    Given an OceanIQ canonical name (e.g. 'temperature'), find the actual
    variable name present in the NetCDF dataset (e.g. 'thetao' or 'temp').
    """
    # 1. Direct match
    if canonical_name in ds.data_vars:
        return canonical_name

    # 2. Check through mapping table
    for source_name, target_name in CANONICAL_VARIABLE_MAP.items():
        if target_name == canonical_name and source_name in ds.data_vars:
            return source_name

    # 3. Check standard_name attribute
    for var_name, da in ds.data_vars.items():
        std_name = str(da.attrs.get("standard_name", "")).lower()
        if std_name in CANONICAL_VARIABLE_MAP and CANONICAL_VARIABLE_MAP[std_name] == canonical_name:
            return var_name

    return None


def normalize_coordinates(ds: xr.Dataset) -> xr.Dataset:
    """
    Normalizes dataset coordinates:
    - Renames lat/lon/depth/time dimensions to standard names
    - Converts 0..360 longitudes to -180..180 if required
    - Ensures latitudes are monotonically increasing
    - Ensures depths are positive downward (0 = surface)
    """
    rename_map = {}

    lat_dim = detect_dimension_name(ds, LAT_ALIASES)
    if lat_dim and lat_dim != "latitude":
        rename_map[lat_dim] = "latitude"

    lon_dim = detect_dimension_name(ds, LON_ALIASES)
    if lon_dim and lon_dim != "longitude":
        rename_map[lon_dim] = "longitude"

    depth_dim = detect_dimension_name(ds, DEPTH_ALIASES)
    if depth_dim and depth_dim != "depth":
        rename_map[depth_dim] = "depth"

    time_dim = detect_dimension_name(ds, TIME_ALIASES)
    if time_dim and time_dim != "time":
        rename_map[time_dim] = "time"

    if rename_map:
        ds = ds.rename(rename_map)

    # 1. Normalize Longitude: Convert 0..360 to -180..180 if needed
    if "longitude" in ds.coords:
        lons = ds.coords["longitude"].values
        if np.any(lons > 180):
            logger.info("Normalizing longitude coordinates from 0..360 to -180..180")
            ds = ds.assign_coords(longitude=(((ds.coords["longitude"] + 180) % 360) - 180))
            ds = ds.sortby("longitude")

    # 2. Normalize Latitude: Ascending sort (-90 to 90)
    if "latitude" in ds.coords:
        lats = ds.coords["latitude"].values
        if len(lats) > 1 and lats[0] > lats[-1]:
            logger.info("Sorting latitude coordinates to ascending order")
            ds = ds.sortby("latitude")

    # 3. Normalize Depth: Absolute value (positive downward)
    if "depth" in ds.coords:
        depths = ds.coords["depth"].values
        if np.any(depths < 0):
            logger.info("Normalizing negative depths to positive downward values")
            ds = ds.assign_coords(depth=np.abs(ds.coords["depth"]))
            ds = ds.sortby("depth")

    return ds


def decode_cf_timestamps(times_coord: xr.DataArray) -> list[str]:
    """
    Converts CF time coordinates into an ISO 8601 UTC string list.
    Handles numpy datetime64, pandas Timestamp, and cftime objects.
    """
    iso_list: list[str] = []
    vals = times_coord.values

    # Scalar check
    if np.ndim(vals) == 0:
        vals = [vals]

    for val in vals:
        try:
            if isinstance(val, (np.datetime64, pd.Timestamp)):
                ts = pd.to_datetime(val, utc=True)
                iso_list.append(ts.strftime("%Y-%m-%dT%H:%M:%SZ"))
            elif hasattr(val, "strftime"):
                # cftime object
                iso_list.append(val.strftime("%Y-%m-%dT%H:%M:%SZ"))
            else:
                ts = pd.to_datetime(val, utc=True)
                iso_list.append(ts.strftime("%Y-%m-%dT%H:%M:%SZ"))
        except Exception as err:
            logger.warning("Failed to decode time value %s: %s", val, err)
            iso_list.append("2026-08-28T12:00:00Z")

    return iso_list
