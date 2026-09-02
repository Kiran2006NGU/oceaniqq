"""
routers/aqua_vis.py — AQUA-VIS Fast JSON Endpoints
SIH 26067 | AQUA-VIS 3D Ocean Intelligence Platform

GET /api/grid
GET /api/instruments
GET /api/variables
"""

import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(tags=["AQUA-VIS Endpoints"])

PROCESSED_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"
GRID_FILE = PROCESSED_DIR / "grid_slices.json"
ARGO_FILE = PROCESSED_DIR / "argo_floats.json"

_grid_cache = None
_argo_cache = None

def load_grid_data():
    global _grid_cache
    if _grid_cache is None:
        if not GRID_FILE.exists():
            from scripts.ingest_model import ingest_and_downsample_netcdf
            ingest_and_downsample_netcdf()
        with open(GRID_FILE, "r", encoding="utf-8") as f:
            _grid_cache = json.load(f)
    return _grid_cache

def load_argo_data():
    global _argo_cache
    if _argo_cache is None:
        if not ARGO_FILE.exists():
            from scripts.mock_argo import generate_argo_floats
            generate_argo_floats()
        with open(ARGO_FILE, "r", encoding="utf-8") as f:
            _argo_cache = json.load(f)
    return _argo_cache

@router.get("/grid")
@router.get("/v1/grid")
async def get_aqua_grid(
    variable: str = Query("temperature", description="Variable ID: temperature | salinity | current_u | current_v"),
    depth: float = Query(0.0, description="Depth level in metres"),
):
    """
    Returns downsampled 2D spatial grid slices for the 3D Globe Canvas texture.
    """
    data = load_grid_data()
    meta = data.get("metadata", {})
    available_depths = meta.get("depths", [0.0])

    # Nearest depth matching
    nearest_depth = min(available_depths, key=lambda d: abs(d - depth))
    key = f"{variable}_{int(nearest_depth)}"

    slice_data = data.get("slices", {}).get(key)
    if not slice_data:
        # Fallback to temperature at depth 0
        fallback_key = f"temperature_0"
        slice_data = data.get("slices", {}).get(fallback_key, {
            "variable": variable,
            "depth": 0.0,
            "values": [],
            "min": 0.0,
            "max": 30.0,
            "unit": "°C",
        })

    return {
        "metadata": meta,
        "slice": slice_data,
    }

@router.get("/instruments")
@router.get("/v1/instruments")
async def get_aqua_instruments(
    type: Optional[str] = Query(None, description="Platform type filter: argo | glider | ctd"),
    region: Optional[str] = Query(None, description="Region filter"),
):
    """
    Returns 50 realistic Argo floats with 3D multi-depth dive profiles.
    """
    floats = load_argo_data()
    if type:
        floats = [f for f in floats if f.get("type") == type.lower()]
    if region:
        floats = [f for f in floats if region.lower() in f.get("region", "").lower()]
    return floats

@router.get("/variables")
@router.get("/v1/variables")
async def get_aqua_variables():
    """
    Returns variable catalog and colormap mappings for AQUA-VIS.
    """
    return [
        {
            "id": "temperature",
            "name": "Sea Water Potential Temperature (thetao)",
            "unit": "°C",
            "min": -2.0,
            "max": 34.0,
            "colormap": "thermal",
            "standard_name": "sea_water_potential_temperature",
        },
        {
            "id": "salinity",
            "name": "Sea Water Practical Salinity (so)",
            "unit": "PSU",
            "min": 30.0,
            "max": 40.0,
            "colormap": "haline",
            "standard_name": "sea_water_practical_salinity",
        },
        {
            "id": "current_u",
            "name": "Zonal Velocity Component (uo)",
            "unit": "m/s",
            "min": -2.5,
            "max": 2.5,
            "colormap": "velocity",
            "standard_name": "eastward_sea_water_velocity",
        },
        {
            "id": "current_v",
            "name": "Meridional Velocity Component (vo)",
            "unit": "m/s",
            "min": -2.5,
            "max": 2.5,
            "colormap": "velocity",
            "standard_name": "northward_sea_water_velocity",
        },
    ]
