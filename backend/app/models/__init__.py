# backend/app/models/__init__.py
from .ocean import (
    HealthResponse,
    DatasetInfo,
    DatasetDetail,
    VariableInfo,
    TimesResponse,
    DepthsResponse,
    OceanFieldResponse,
    OceanValueResponse,
    ProfilePoint,
    OceanProfileResponse,
    ObservationResponse,
    ObservationProfileResponse,
)

__all__ = [
    "HealthResponse",
    "DatasetInfo",
    "DatasetDetail",
    "VariableInfo",
    "TimesResponse",
    "DepthsResponse",
    "OceanFieldResponse",
    "OceanValueResponse",
    "ProfilePoint",
    "OceanProfileResponse",
    "ObservationResponse",
    "ObservationProfileResponse",
]
