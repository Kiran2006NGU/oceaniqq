"""
backend/app/routers/comparison.py — Model vs Observation Comparison API
SIH 26067 | Ocean Intelligence Platform Backend

Endpoints:
- POST /api/v1/comparison/upload: Ingest NetCDF, CSV, TSV, TXT, JSON files
- GET  /api/v1/comparison/datasets: List model and observation datasets
- GET  /api/v1/comparison/variables: Auto-detect common variables between 2 datasets
- POST /api/v1/comparison/calculate: Execute spatiotemporal matching & metrics computation
- GET  /api/v1/comparison/thresholds: Get configurable accuracy thresholds
"""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import Any, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from app.comparison.classifier import AccuracyClassifier, DEFAULT_ACCURACY_THRESHOLDS
from app.comparison.matcher import ModelObservationMatcher
from app.comparison.metrics import calculate_comparison_metrics
from app.data.normalizer import CANONICAL_UNITS, OceanDataNormalizer, check_unit_compatibility
from app.data.parsers.csv_parser import DelimitedTextParser
from app.data.parsers.json_parser import JSONParser
from app.data.parsers.netcdf_parser import NetCDFParser
from app.data.parsers.text_parser import TextOceanParser
from app.data.validator import OceanDataValidator
from app.providers.incois_provider import INCOISOceanProvider
from app.services.dataset_registry import DatasetRegistry, get_dataset_registry
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/comparison", tags=["Model vs Observation Comparison"])


# ── In-Memory Upload Store ──────────────────────────────────────────────────────

class UploadedDatasetEntry:
    def __init__(
        self,
        id: str,
        name: str,
        dataset_type: str,  # "model" | "observation"
        format: str,
        df: Optional[pd.DataFrame] = None,
        filepath: Optional[Path] = None,
        metadata: Optional[dict[str, Any]] = None,
        provider: Optional[Any] = None,
    ):
        self.id = id
        self.name = name
        self.dataset_type = dataset_type
        self.format = format
        self.df = df
        self.filepath = filepath
        self.metadata = metadata or {}
        self.provider = provider


UPLOADED_STORE: dict[str, UploadedDatasetEntry] = {}


# ── Request / Response Schemas ─────────────────────────────────────────────────

class CompareRequest(BaseModel):
    model_dataset_id: str
    observation_dataset_id: str
    variable: str
    spatial_tolerance_deg: float = Field(0.5, description="Spatial matching radius in degrees (lat/lon)")
    depth_tolerance_m: float = Field(25.0, description="Depth matching tolerance in metres")
    time_tolerance_hours: float = Field(48.0, description="Temporal matching tolerance in hours")
    selected_depth: Optional[float] = None
    custom_thresholds: Optional[dict[str, dict[str, float]]] = None


class ThresholdConfig(BaseModel):
    good_max: float
    moderate_max: float


# ── Upload Endpoint ────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_comparison_file(
    file: UploadFile = File(...),
    dataset_type: str = Form("observation", description="Dataset role: 'model' or 'observation'"),
    custom_name: Optional[str] = Form(None),
) -> dict[str, Any]:
    """
    Ingest user-uploaded file (NetCDF .nc/.nc4, CSV, TSV, TXT, or JSON).
    Parses, validates, normalizes into common schema, and caches dataset for comparison.
    """
    orig_name = file.filename or "uploaded_data"
    ext = Path(orig_name).suffix.lower()

    if ext not in (".nc", ".nc4", ".csv", ".tsv", ".txt", ".json", ".geojson"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported: NetCDF (.nc, .nc4), CSV (.csv), TSV (.tsv), Text (.txt), and JSON (.json).",
        )

    # Save to a temporary file
    temp_dir = Path(tempfile.gettempdir()) / "oceaniq_uploads"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_id = f"upload-{uuid.uuid4().hex[:8]}"
    saved_path = temp_dir / f"{temp_id}_{orig_name}"

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to write uploaded file: {exc}")

    normalizer = OceanDataNormalizer()
    validator = OceanDataValidator()

    # Parse according to format
    try:
        if ext in (".nc", ".nc4"):
            nc_parser = NetCDFParser()
            parsed_nc = nc_parser.parse_file(saved_path)

            # Register as INCOISOceanProvider if model, or extract dataframe if discrete
            provider = INCOISOceanProvider(
                dataset_id=temp_id,
                filepath=saved_path,
                name=custom_name or f"Uploaded NetCDF ({orig_name})",
                provider_name="User Upload",
            )

            variables = [v["canonical_name"] for v in parsed_nc["variables"]]
            
            entry = UploadedDatasetEntry(
                id=temp_id,
                name=custom_name or f"Uploaded NetCDF ({orig_name})",
                dataset_type=dataset_type,
                format="NetCDF-4",
                filepath=saved_path,
                provider=provider,
                metadata=parsed_nc,
            )
            UPLOADED_STORE[temp_id] = entry

            return {
                "dataset_id": temp_id,
                "name": entry.name,
                "dataset_type": dataset_type,
                "format": "NetCDF-4",
                "record_count": parsed_nc["dimensions"].get("time", 1) * parsed_nc["dimensions"].get("depth", 1) * parsed_nc["dimensions"].get("latitude", 1),
                "detected_variables": variables,
                "coordinates": parsed_nc["coordinates"],
                "spatial_bounds": parsed_nc["coordinates"].get("latitude"),
                "depth_range": parsed_nc["coordinates"].get("depth"),
                "is_valid": True,
                "errors": [],
                "warnings": [],
            }

        elif ext in (".csv", ".tsv"):
            csv_parser = DelimitedTextParser()
            raw_df = csv_parser.parse_file(saved_path)
        elif ext in (".json", ".geojson"):
            json_parser = JSONParser()
            raw_df = json_parser.parse_file(saved_path)
        else:
            txt_parser = TextOceanParser()
            raw_df = txt_parser.parse_file(saved_path)

        # Normalize tabular data
        norm_df, meta = normalizer.normalize_dataframe(raw_df, source_name=orig_name)
        val_result = validator.validate_dataframe(norm_df)

        if not val_result["is_valid"]:
            # Clean up temp file on fatal validation error
            try:
                saved_path.unlink()
            except Exception:
                pass
            raise HTTPException(
                status_code=422,
                detail=f"Dataset validation failed: {'; '.join(val_result['errors'])}",
            )

        entry = UploadedDatasetEntry(
            id=temp_id,
            name=custom_name or f"Uploaded {ext.upper().lstrip('.')} ({orig_name})",
            dataset_type=dataset_type,
            format=ext.upper().lstrip("."),
            df=norm_df,
            filepath=saved_path,
            metadata=meta,
        )
        UPLOADED_STORE[temp_id] = entry

        # Preview records (up to 10)
        preview_records = norm_df.head(10).to_dict(orient="records")

        return {
            "dataset_id": temp_id,
            "name": entry.name,
            "dataset_type": dataset_type,
            "format": entry.format,
            "record_count": meta["record_count"],
            "detected_variables": meta["detected_variables"],
            "spatial_bounds": meta["spatial_bounds"],
            "depth_range": meta["depth_range"],
            "preview_records": preview_records,
            "is_valid": val_result["is_valid"],
            "errors": val_result["errors"],
            "warnings": val_result["warnings"],
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Upload parsing failed for %s: %s", orig_name, exc, exc_info=True)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse and validate file '{orig_name}': {str(exc)}",
        )


# ── Dataset Catalog Endpoint ───────────────────────────────────────────────────

@router.get("/datasets")
async def list_comparison_datasets(
    registry: DatasetRegistry = Depends(get_dataset_registry),
) -> dict[str, list[dict[str, Any]]]:
    """
    Returns available model and observation datasets (both pre-loaded and uploaded).
    """
    models: list[dict[str, Any]] = []
    observations: list[dict[str, Any]] = []

    # 1. Pre-loaded model datasets from registry
    for d in registry.list_datasets():
        models.append({
            "id": d.id,
            "name": d.name,
            "provider": d.provider,
            "format": d.format,
            "variables": d.variables,
            "is_real_data": d.is_real_data,
            "is_uploaded": False,
            "description": d.description,
        })

    # 2. Pre-loaded In-situ Observation platforms
    obs_p = registry.get_observation_provider()
    raw_obs_list = obs_p.get_observations()

    # Add default grouped observation catalogs
    observations.append({
        "id": "argo-incois-gdac",
        "name": "Indian Ocean Argo GDAC Profiles (Real In-Situ)",
        "provider": "INCOIS / Argo GDAC",
        "format": "In-Situ CTD",
        "variables": ["temperature", "salinity", "chlorophyll"],
        "is_real_data": True,
        "is_uploaded": False,
        "count": len([o for o in raw_obs_list if not o.is_demo and o.type == "argo"]),
        "description": "Autonomous profiling floats in Arabian Sea & Bay of Bengal",
    })
    observations.append({
        "id": "glider-incois-fleet",
        "name": "Autonomous Ocean Gliders Transect",
        "provider": "INCOIS Glider Facility",
        "format": "High-Res Sawtooth",
        "variables": ["temperature", "salinity", "chlorophyll"],
        "is_real_data": False,
        "is_uploaded": False,
        "count": 2,
        "description": "High-resolution glider profiles",
    })
    observations.append({
        "id": "ctd-incois-stations",
        "name": "Research Vessel CTD Cast Stations",
        "provider": "MoES / INCOIS",
        "format": "Shipboard CTD",
        "variables": ["temperature", "salinity", "chlorophyll"],
        "is_real_data": False,
        "is_uploaded": False,
        "count": 2,
        "description": "Hydrographic standard CTD cast stations",
    })

    # 3. Add any user-uploaded datasets
    for uid, uentry in UPLOADED_STORE.items():
        item = {
            "id": uentry.id,
            "name": uentry.name,
            "provider": "User Upload",
            "format": uentry.format,
            "variables": uentry.metadata.get("detected_variables", ["temperature", "salinity"]),
            "is_real_data": True,
            "is_uploaded": True,
            "record_count": uentry.metadata.get("record_count", 0),
        }
        if uentry.dataset_type == "model":
            models.append(item)
        else:
            observations.append(item)

    return {
        "models": models,
        "observations": observations,
    }


# ── Common Variables Endpoint ──────────────────────────────────────────────────

@router.get("/variables")
async def get_common_variables(
    model_id: str = Query(..., description="Model dataset ID"),
    obs_id: str = Query(..., description="Observation dataset ID"),
    registry: DatasetRegistry = Depends(get_dataset_registry),
) -> dict[str, Any]:
    """
    Detects variables available in both the model and observation dataset.
    """
    # 1. Model variables
    model_vars: set[str] = set()
    if model_id in UPLOADED_STORE:
        model_vars = set(UPLOADED_STORE[model_id].metadata.get("detected_variables", []))
    else:
        try:
            m_provider = registry.get_provider(model_id)
            model_vars = {v.id for v in m_provider.get_variables()}
        except Exception:
            model_vars = {"temperature", "salinity", "current_u", "current_v", "current_velocity"}

    # 2. Observation variables
    obs_vars: set[str] = set()
    if obs_id in UPLOADED_STORE:
        obs_vars = set(UPLOADED_STORE[obs_id].metadata.get("detected_variables", []))
    else:
        # Standard in-situ platforms support T, S, Chlorophyll
        obs_vars = {"temperature", "salinity", "chlorophyll"}

    # Intersection
    common = sorted(list(model_vars.intersection(obs_vars)))
    if not common:
        # Fallback to temperature if empty
        common = ["temperature"]

    return {
        "model_id": model_id,
        "obs_id": obs_id,
        "common_variables": common,
        "default_variable": common[0] if common else "temperature",
    }


# ── Configurable Thresholds Endpoint ───────────────────────────────────────────

@router.get("/thresholds")
async def get_thresholds() -> dict[str, Any]:
    """Return application-defined accuracy thresholds for all variables."""
    return {
        "thresholds": DEFAULT_ACCURACY_THRESHOLDS,
        "canonical_units": CANONICAL_UNITS,
        "description": "Application-defined quality tolerance thresholds for model vs observation validation.",
    }


# ── Comparison Calculation Endpoint ────────────────────────────────────────────

@router.post("/calculate")
async def calculate_comparison(
    req: CompareRequest,
    registry: DatasetRegistry = Depends(get_dataset_registry),
) -> dict[str, Any]:
    """
    Executes model vs observation comparison workflow:
    1. Resolve model & observation data sources
    2. Validate unit compatibility
    3. Match spatiotemporal points (lat/lon, depth, time)
    4. Compute residuals: Residual = Model - Observed, Absolute Error = |Residual|
    5. Compute summary stats: Bias, MAE, RMSE, Pearson r, count
    6. Classify status (🟢 GOOD / 🟡 MODERATE / 🔴 POOR)
    7. Generate profile curve and residual series for visualization
    """
    variable = req.variable.lower()
    canonical_unit = CANONICAL_UNITS.get(variable, "°C")

    # 1. Resolve Observation Records
    obs_records: list[dict[str, Any]] = []

    if req.observation_dataset_id in UPLOADED_STORE:
        u_obs = UPLOADED_STORE[req.observation_dataset_id]
        if u_obs.df is not None:
            if variable in u_obs.df.columns:
                obs_records = u_obs.df.dropna(subset=[variable]).to_dict(orient="records")
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Variable '{variable}' not present in uploaded observation dataset '{u_obs.name}'.",
                )
    else:
        # Load from ObservationProvider
        obs_p = registry.get_observation_provider()
        all_obs = obs_p.get_observations()

        if req.observation_dataset_id == "argo-incois-gdac":
            selected_obs_list = [o for o in all_obs if o.type == "argo"]
        elif req.observation_dataset_id == "glider-incois-fleet":
            selected_obs_list = [o for o in all_obs if o.type == "glider"]
        elif req.observation_dataset_id == "ctd-incois-stations":
            selected_obs_list = [o for o in all_obs if o.type == "ctd"]
        else:
            # Single specific observation ID
            selected_obs_list = [o for o in all_obs if o.id == req.observation_dataset_id]
            if not selected_obs_list:
                selected_obs_list = all_obs

        # Expand vertical profiles for matching
        for obs_item in selected_obs_list:
            try:
                prof_resp = obs_p.get_observation_profile(obs_item.id)
                for pt in prof_resp.profile:
                    val = getattr(pt, variable, None)
                    if val is not None:
                        obs_records.append({
                            "platform_id": obs_item.id,
                            "latitude": obs_item.latitude,
                            "longitude": obs_item.longitude,
                            "depth": pt.depth,
                            "time": obs_item.timestamp,
                            "value": val,
                            "unit": canonical_unit,
                            "qc_flag": pt.qc_flag,
                            "source": obs_item.provenance.provider if obs_item.provenance else "INCOIS In-Situ",
                        })
            except Exception:
                # Fallback to surface value
                s_val = getattr(obs_item, variable, None)
                if s_val is not None:
                    obs_records.append({
                        "platform_id": obs_item.id,
                        "latitude": obs_item.latitude,
                        "longitude": obs_item.longitude,
                        "depth": obs_item.current_depth,
                        "time": obs_item.timestamp,
                        "value": s_val,
                        "unit": canonical_unit,
                        "qc_flag": obs_item.qc_flag,
                        "source": "INCOIS Surface In-Situ",
                    })

    if not obs_records:
        raise HTTPException(
            status_code=400,
            detail=f"No observation records found with variable '{variable}'.",
        )

    # 2. Resolve Model Source & Perform Matching
    matcher = ModelObservationMatcher()
    matched_points: list[dict[str, Any]] = []

    if req.model_dataset_id in UPLOADED_STORE:
        u_model = UPLOADED_STORE[req.model_dataset_id]
        if u_model.provider is not None:
            # NetCDF provider
            matched_points = matcher.match_observations_with_provider(
                model_provider=u_model.provider,
                obs_records=obs_records,
                variable=variable,
                spatial_tolerance_deg=req.spatial_tolerance_deg,
                depth_tolerance_m=req.depth_tolerance_m,
                time_tolerance_hours=req.time_tolerance_hours,
                target_unit=canonical_unit,
            )
        elif u_model.df is not None:
            # Tabular model dataset
            obs_df = pd.DataFrame(obs_records)
            matched_points = matcher.match_tabular_datasets(
                model_df=u_model.df,
                obs_df=obs_df,
                variable=variable,
                spatial_tolerance_deg=req.spatial_tolerance_deg,
                depth_tolerance_m=req.depth_tolerance_m,
                target_unit=canonical_unit,
            )
    else:
        # Pre-loaded model provider from registry
        model_provider = registry.get_provider(req.model_dataset_id)
        matched_points = matcher.match_observations_with_provider(
            model_provider=model_provider,
            obs_records=obs_records,
            variable=variable,
            spatial_tolerance_deg=req.spatial_tolerance_deg,
            depth_tolerance_m=req.depth_tolerance_m,
            time_tolerance_hours=req.time_tolerance_hours,
            target_unit=canonical_unit,
        )

    if not matched_points:
        return {
            "matched": False,
            "message": f"No matching observation points found within spatial tolerance ±{req.spatial_tolerance_deg}°, depth tolerance ±{req.depth_tolerance_m}m, and temporal tolerance ±{req.time_tolerance_hours}h.",
            "metrics": {
                "matched_count": 0,
                "mean_bias": None,
                "mae": None,
                "rmse": None,
                "correlation": None,
            },
            "status": {
                "status": "UNKNOWN",
                "label": "No Matched Data",
                "icon": "⚪",
                "color": "slate",
                "description": "Adjust matching spatial/depth tolerance or select another dataset.",
            },
            "matched_records": [],
            "profile_series": [],
            "residual_series": [],
        }

    # 3. Compute Metrics
    metrics = calculate_comparison_metrics(matched_points)

    # 4. Classify Accuracy Status
    classifier = AccuracyClassifier(req.custom_thresholds)
    status = classifier.classify_error(metrics["mae"], variable)

    # 5. Build Profile Series (X = value, Y = depth inverted)
    # Group by depth or take representative profile
    depth_groups: dict[float, list[dict[str, Any]]] = {}
    for p in matched_points:
        d = p["depth"]
        depth_groups.setdefault(d, []).append(p)

    profile_series: list[dict[str, Any]] = []
    for d in sorted(depth_groups.keys()):
        group = depth_groups[d]
        m_mean = float(np.mean([x["model_value"] for x in group]))
        o_mean = float(np.mean([x["obs_value"] for x in group]))
        res_mean = float(np.mean([x["residual"] for x in group]))
        profile_series.append({
            "depth": round(d, 1),
            "model_value": round(m_mean, 2),
            "obs_value": round(o_mean, 2),
            "residual": round(res_mean, 2),
            "count": len(group),
        })

    # 6. Build Residual Diverging Series (Residual vs Depth)
    residual_series: list[dict[str, Any]] = []
    for p in matched_points:
        residual_series.append({
            "id": p["match_id"],
            "depth": p["depth"],
            "latitude": p["latitude"],
            "longitude": p["longitude"],
            "timestamp": p["timestamp"],
            "residual": p["residual"],
            "absolute_error": p["absolute_error"],
            "model_value": p["model_value"],
            "obs_value": p["obs_value"],
        })

    # Sort residuals by depth
    residual_series.sort(key=lambda x: x["depth"])

    # First point sample for compact summary
    sample_point = matched_points[0] if matched_points else None

    return {
        "matched": True,
        "model_dataset_id": req.model_dataset_id,
        "observation_dataset_id": req.observation_dataset_id,
        "variable": variable,
        "unit": canonical_unit,
        "metrics": metrics,
        "status": status,
        "sample_point": sample_point,
        "matched_records": matched_points[:100],  # return first 100 for inspection list
        "total_matched_count": len(matched_points),
        "profile_series": profile_series,
        "residual_series": residual_series,
        "matching_parameters": {
            "spatial_tolerance_deg": req.spatial_tolerance_deg,
            "depth_tolerance_m": req.depth_tolerance_m,
            "time_tolerance_hours": req.time_tolerance_hours,
        },
    }
