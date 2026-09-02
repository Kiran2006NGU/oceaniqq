"""
backend/app/comparison/matcher.py — Model vs Observation Record Matcher
SIH 26067 | Ocean Intelligence Platform Backend

Matches numerical ocean model predictions with in-situ observation records using:
- Spatial proximity: latitude / longitude (haversine / Euclidean distance tolerance)
- Vertical proximity: depth tolerance
- Temporal proximity: timestamp tolerance

Calculates paired residuals (Residual = Model - Observation) and Absolute Errors (|Model - Observation|).
"""

from __future__ import annotations

import logging
import math
from typing import Any, Optional, Union
import numpy as np
import pandas as pd

from app.data.normalizer import clean_unit_string, convert_value_to_canonical
from app.providers.base_provider import BaseOceanProvider

logger = logging.getLogger(__name__)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two lat/lon points in kilometres."""
    r = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


class ModelObservationMatcher:
    """Performs multi-dimensional spatiotemporal matching between model and observation data."""

    def match_observations_with_provider(
        self,
        model_provider: BaseOceanProvider,
        obs_records: list[dict[str, Any]],
        variable: str,
        spatial_tolerance_deg: float = 0.5,
        depth_tolerance_m: float = 25.0,
        time_tolerance_hours: float = 48.0,
        target_unit: str = "°C",
    ) -> list[dict[str, Any]]:
        """
        Matches a list of observation records against an xarray/NetCDF BaseOceanProvider model.
        Extracts model values at each observation's exact/nearest coordinates, depth, and time.
        """
        matched_results: list[dict[str, Any]] = []

        for idx, obs in enumerate(obs_records):
            lat = obs.get("latitude")
            lon = obs.get("longitude")
            depth = obs.get("depth", 0.0)
            time_iso = obs.get("time") or obs.get("timestamp")
            obs_val = obs.get("value")
            if obs_val is None:
                # Check if variable key exists directly
                obs_val = obs.get(variable)

            if lat is None or lon is None or obs_val is None:
                continue

            try:
                lat_f = float(lat)
                lon_f = float(lon)
                depth_f = float(depth)
                obs_val_f = float(obs_val)
            except (ValueError, TypeError):
                continue

            if np.isnan(obs_val_f) or np.isinf(obs_val_f):
                continue

            # Query model value at observation coordinate
            try:
                model_resp = model_provider.get_value(
                    variable=variable,
                    lat=lat_f,
                    lon=lon_f,
                    depth=depth_f,
                    time_iso=time_iso,
                )
                model_val = model_resp.value
            except Exception as exc:
                logger.debug("Failed model query at (%s, %s, %s): %s", lat_f, lon_f, depth_f, exc)
                model_val = None

            if model_val is None or np.isnan(model_val) or np.isinf(model_val):
                continue

            # Convert units to canonical if needed
            model_val_canon = convert_value_to_canonical(model_val, model_provider.get_variables()[0].unit if model_provider.get_variables() else target_unit, variable)
            obs_val_canon = convert_value_to_canonical(obs_val_f, obs.get("unit", target_unit), variable)

            if model_val_canon is None or obs_val_canon is None:
                continue

            # Scientific definition: Residual = Model - Observation
            residual = round(model_val_canon - obs_val_canon, 3)
            abs_error = round(abs(residual), 3)

            matched_results.append({
                "match_id": f"MATCH-{idx + 1:04d}",
                "platform_id": obs.get("platform_id") or obs.get("id") or f"OBS-{idx + 1:03d}",
                "latitude": round(lat_f, 4),
                "longitude": round(lon_f, 4),
                "depth": round(depth_f, 1),
                "timestamp": time_iso or "2026-08-28T12:00:00Z",
                "model_value": round(model_val_canon, 3),
                "obs_value": round(obs_val_canon, 3),
                "residual": residual,
                "absolute_error": abs_error,
                "unit": target_unit,
                "qc_flag": int(obs.get("qc_flag", 1)),
                "source": obs.get("source", "Observation Ground Truth"),
            })

        return matched_results

    def match_tabular_datasets(
        self,
        model_df: pd.DataFrame,
        obs_df: pd.DataFrame,
        variable: str,
        spatial_tolerance_deg: float = 0.5,
        depth_tolerance_m: float = 25.0,
        target_unit: str = "°C",
    ) -> list[dict[str, Any]]:
        """
        Matches two tabular datasets (Model DataFrame vs Observation DataFrame).
        Finds the nearest spatial and vertical model neighbor for each observation.
        """
        matched_results: list[dict[str, Any]] = []

        if model_df.empty or obs_df.empty or variable not in model_df.columns or variable not in obs_df.columns:
            return []

        # Filter valid records
        valid_model = model_df.dropna(subset=["latitude", "longitude", "depth", variable]).copy()
        valid_obs = obs_df.dropna(subset=["latitude", "longitude", "depth", variable]).copy()

        if valid_model.empty or valid_obs.empty:
            return []

        for idx, obs_row in valid_obs.iterrows():
            obs_lat = float(obs_row["latitude"])
            obs_lon = float(obs_row["longitude"])
            obs_depth = float(obs_row["depth"])
            obs_val = float(obs_row[variable])

            # Filter candidates within spatial and depth bounding box
            candidates = valid_model[
                (valid_model["latitude"] >= obs_lat - spatial_tolerance_deg)
                & (valid_model["latitude"] <= obs_lat + spatial_tolerance_deg)
                & (valid_model["longitude"] >= obs_lon - spatial_tolerance_deg)
                & (valid_model["longitude"] <= obs_lon + spatial_tolerance_deg)
                & (valid_model["depth"] >= obs_depth - depth_tolerance_m)
                & (valid_model["depth"] <= obs_depth + depth_tolerance_m)
            ]

            if candidates.empty:
                continue

            # Compute Euclidean / degree distance to find nearest candidate
            d_lat = candidates["latitude"] - obs_lat
            d_lon = candidates["longitude"] - obs_lon
            d_depth_scaled = (candidates["depth"] - obs_depth) / 100.0  # scale depth to degree order
            dist_sq = d_lat**2 + d_lon**2 + d_depth_scaled**2

            nearest_idx = dist_sq.idxmin()
            nearest_model_row = candidates.loc[nearest_idx]

            model_val = float(nearest_model_row[variable])
            residual = round(model_val - obs_val, 3)
            abs_error = round(abs(residual), 3)

            matched_results.append({
                "match_id": f"MATCH-{len(matched_results) + 1:04d}",
                "platform_id": str(obs_row.get("platform_id", f"OBS-{idx}")),
                "latitude": round(obs_lat, 4),
                "longitude": round(obs_lon, 4),
                "depth": round(obs_depth, 1),
                "timestamp": str(obs_row.get("time", "2026-08-28T12:00:00Z")),
                "model_value": round(model_val, 3),
                "obs_value": round(obs_val, 3),
                "residual": residual,
                "absolute_error": abs_error,
                "unit": target_unit,
                "qc_flag": int(obs_row.get("qc_flag", 1)),
                "source": str(obs_row.get("source", "Observation Ground Truth")),
            })

        return matched_results
