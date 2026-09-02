"""
utils/netcdf_utils.py — Shared validation and helper utilities
SIH 26067 | Ocean Intelligence Platform Backend

Functions:
  - validate_dataset_id  : whitelist check against registered IDs
  - validate_variable    : check against known variable names
  - validate_lat/lon     : range checks
  - validate_depth       : non-negative check
  - validate_observation_id : basic format check
  - parse_bbox           : parse "min_lat,max_lat,min_lon,max_lon" string
"""

from __future__ import annotations

import re
from typing import Optional

from fastapi import HTTPException

# ── Validation ─────────────────────────────────────────────────────────────────

# Dataset IDs are alphanumeric + hyphens, max 64 chars
_DATASET_ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9\-_]{0,62}$")

# Observation IDs are alphanumeric + hyphens/underscores, max 64 chars
_OBS_ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9\-_]{0,62}$")


def validate_dataset_id(dataset_id: str) -> None:
    """
    Raise HTTP 422 if the dataset_id contains illegal characters.
    This prevents path traversal / filesystem exposure.
    """
    if not dataset_id or not _DATASET_ID_RE.match(dataset_id):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Invalid dataset_id '{dataset_id}'. "
                "Must be alphanumeric with hyphens/underscores, max 64 chars."
            ),
        )


def validate_observation_id(obs_id: str) -> None:
    """Raise HTTP 422 if the observation ID contains illegal characters."""
    if not obs_id or not _OBS_ID_RE.match(obs_id):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid observation id '{obs_id}'.",
        )


def validate_variable(variable: str, valid_set: set[str]) -> None:
    """Raise HTTP 422 if the variable name is not in the allowed set."""
    if variable not in valid_set:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown variable '{variable}'. Valid: {sorted(valid_set)}",
        )


def validate_lat(lat: float) -> None:
    """Raise HTTP 422 if latitude is out of range."""
    if not (-90.0 <= lat <= 90.0):
        raise HTTPException(
            status_code=422,
            detail=f"Latitude {lat} out of range [-90, 90].",
        )


def validate_lon(lon: float) -> None:
    """Raise HTTP 422 if longitude is out of range."""
    if not (-180.0 <= lon <= 360.0):
        raise HTTPException(
            status_code=422,
            detail=f"Longitude {lon} out of range [-180, 360].",
        )


def validate_depth(depth: float) -> None:
    """Raise HTTP 422 if depth is negative."""
    if depth < 0:
        raise HTTPException(
            status_code=422,
            detail=f"Depth {depth} must be >= 0 (metres, positive down).",
        )


# ── BBox parsing ───────────────────────────────────────────────────────────────

def parse_bbox(bbox_str: Optional[str]) -> Optional[tuple[float, float, float, float]]:
    """Parse a bbox string into a float tuple. Returns None if bbox_str is empty/None."""
    if not bbox_str:
        return None
    try:
        parts = [float(p.strip()) for p in bbox_str.split(",")]
    except ValueError as exc:
        raise ValueError(f"bbox must be 4 comma-separated floats: '{bbox_str}'") from exc

    if len(parts) != 4:
        raise ValueError(f"bbox must have exactly 4 values, got {len(parts)}: '{bbox_str}'")

    min_lat, max_lat, min_lon, max_lon = parts

    if not (-90 <= min_lat <= 90) or not (-90 <= max_lat <= 90):
        raise ValueError(f"Latitude values out of range [-90, 90]: {min_lat}, {max_lat}")
    if not (-180 <= min_lon <= 360) or not (-180 <= max_lon <= 360):
        raise ValueError(f"Longitude values out of range [-180, 360]: {min_lon}, {max_lon}")
    if min_lat >= max_lat:
        raise ValueError(f"min_lat ({min_lat}) must be less than max_lat ({max_lat})")
    if min_lon >= max_lon:
        raise ValueError(f"min_lon ({min_lon}) must be less than max_lon ({max_lon})")

    return min_lat, max_lat, min_lon, max_lon


# ── Downsampling ───────────────────────────────────────────────────────────────

def downsample_grid(
    lats: list[float],
    lons: list[float],
    values: list[Optional[float]],
    max_points: int = 2000,
) -> tuple[list[float], list[float], list[Optional[float]]]:
    """
    Downsample a flat lat×lon grid if it exceeds max_points.
    Selects every Nth row and column to stay under the limit.

    Returns new (lats, lons, values) tuple.
    """
    nlat = len(lats)
    nlon = len(lons)
    total = nlat * nlon

    if total <= max_points:
        return lats, lons, values

    # Compute stride
    import math
    stride = max(1, int(math.sqrt(total / max_points)))

    new_lats = lats[::stride]
    new_lons = lons[::stride]
    new_values: list[Optional[float]] = []

    for i in range(0, nlat, stride):
        for j in range(0, nlon, stride):
            new_values.append(values[i * nlon + j])

    return new_lats, new_lons, new_values
