"""
models/ocean.py — Pydantic response models with Scientific Provenance
SIH 26067 | Ocean Intelligence Platform Backend

All API responses are typed here. These models are serialized to JSON
by FastAPI automatically.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ── Health ─────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "SIH 26067 Ocean Backend"
    version: str
    data_source: str


# ── Provenance & Quality Control ───────────────────────────────────────────────

class ProvenanceInfo(BaseModel):
    """Scientific data provenance and traceability metadata."""
    provider: str                      # e.g. "INCOIS", "Argo GDAC", "Synthetic Demo"
    dataset_id: str                    # e.g. "incois-hycom-real", "demo-ocean"
    source_file: str                   # e.g. "INCOIS_HYCOM_IndianOcean_20260828.nc"
    model_name: Optional[str] = None   # e.g. "HYCOM v2.2", "ROMS Indian Ocean"
    institution: Optional[str] = None  # e.g. "INCOIS, Ministry of Earth Sciences, Govt. of India"
    resolution: Optional[str] = None   # e.g. "0.08° (~9 km) × 34 vertical levels"
    processing: list[str] = Field(default_factory=list)  # e.g. ["nearest_time", "nearest_depth", "bbox_subset"]
    quality_status: str = "verified"   # "verified_real", "synthetic_demo", "qc_passed"
    is_real_data: bool = False


# ── Dataset catalog ────────────────────────────────────────────────────────────

class DatasetInfo(BaseModel):
    """Lightweight entry for the dataset list endpoint."""
    id: str
    name: str
    provider: str
    format: str = "NetCDF"
    variables: list[str]
    dimensions: dict[str, int]
    description: Optional[str] = None
    is_demo: bool = False
    is_real_data: bool = False
    status: str = "LOCAL_DATASET"      # "DEMO", "LOCAL_REAL_DATA", "REMOTE"


class VariableMeta(BaseModel):
    """CF-style metadata for a single variable within a dataset."""
    name: str
    long_name: Optional[str] = None
    standard_name: Optional[str] = None
    units: Optional[str] = None
    valid_min: Optional[float] = None
    valid_max: Optional[float] = None


class DatasetDetail(BaseModel):
    """Full metadata for a single dataset."""
    id: str
    name: str
    provider: str
    format: str = "NetCDF"
    dimensions: dict[str, int]
    coordinates: dict[str, list[float]]
    variables: list[VariableMeta]
    time_range: Optional[dict[str, str]] = None  # {"start": ISO, "end": ISO}
    depth_range: Optional[dict[str, float]] = None  # {"min": 0, "max": 2000}
    spatial_bounds: Optional[dict[str, float]] = None
    global_attributes: dict[str, str] = Field(default_factory=dict)
    provenance: Optional[ProvenanceInfo] = None
    is_demo: bool = False
    is_real_data: bool = False


# ── Variables endpoint ─────────────────────────────────────────────────────────

class VariableInfo(BaseModel):
    """Display metadata for a single ocean variable."""
    id: str
    display_name: str
    unit: str
    min_value: float
    max_value: float
    description: str
    standard_name: Optional[str] = None
    colormap: str


# ── Times / Depths ─────────────────────────────────────────────────────────────

class ModelTimeStep(BaseModel):
    index: int
    iso_string: str
    label: str        # "12:00"
    date_label: str   # "28 Aug 2026"


class TimesResponse(BaseModel):
    dataset_id: str
    times: list[ModelTimeStep]


class DepthsResponse(BaseModel):
    dataset_id: str
    depths: list[float]
    units: str = "m"


# ── Ocean field ────────────────────────────────────────────────────────────────

class OceanFieldResponse(BaseModel):
    """2-D variable slice suitable for per-vertex colour mapping."""
    dataset: str
    variable: str
    unit: str
    depth: float
    time: str
    latitudes: list[float]
    longitudes: list[float]
    values: list[Optional[float]]
    nlat: int
    nlon: int
    valid_min: float
    valid_max: float
    provenance: Optional[ProvenanceInfo] = None


# ── Point query ────────────────────────────────────────────────────────────────

class OceanValueResponse(BaseModel):
    latitude: float
    longitude: float
    depth: float
    variable: str
    value: Optional[float]
    unit: str
    time: str
    dataset: str
    nearest_lat: Optional[float] = None
    nearest_lon: Optional[float] = None
    provenance: Optional[ProvenanceInfo] = None


# ── Depth profile ──────────────────────────────────────────────────────────────

class ProfilePoint(BaseModel):
    depth: float
    value: Optional[float]


class OceanProfileResponse(BaseModel):
    latitude: float
    longitude: float
    variable: str
    unit: str
    time: str
    dataset: str
    profile: list[ProfilePoint]
    provenance: Optional[ProvenanceInfo] = None


# ── Observations ───────────────────────────────────────────────────────────────

class ObservationResponse(BaseModel):
    id: str
    type: str                   # "argo" | "glider" | "ctd"
    platform_id: str
    latitude: float
    longitude: float
    timestamp: str              # ISO 8601
    current_depth: float
    temperature: float
    salinity: float
    chlorophyll: float
    region: str
    is_demo: bool = True
    qc_flag: int = 1            # 1 = Good, 2 = Probably Good, 3 = Suspect, 4 = Bad
    quality_status: str = "qc_passed"
    provenance: Optional[ProvenanceInfo] = None


class ObservationProfilePoint(BaseModel):
    depth: float
    temperature: Optional[float] = None
    salinity: Optional[float] = None
    chlorophyll: Optional[float] = None
    qc_flag: int = 1


class ObservationProfileResponse(BaseModel):
    observation_id: str
    latitude: float
    longitude: float
    variable_units: dict[str, str] = Field(
        default_factory=lambda: {
            "temperature": "°C",
            "salinity": "PSU",
            "chlorophyll": "mg m⁻³",
        }
    )
    profile: list[ObservationProfilePoint]
    is_demo: bool = True
    provenance: Optional[ProvenanceInfo] = None
