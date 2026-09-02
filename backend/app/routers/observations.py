"""
routers/observations.py — In-situ observation endpoints
SIH 26067 | Ocean Intelligence Platform Backend

GET /api/v1/observations
GET /api/v1/observations/{obs_id}/profile
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.ocean import ObservationProfileResponse, ObservationResponse
from app.services.dataset_registry import DatasetRegistry, get_dataset_registry
from app.services.ocean_service import OceanService
from app.utils.netcdf_utils import validate_observation_id

router = APIRouter(tags=["Observations"])

VALID_OBS_TYPES = {"argo", "glider", "ctd", "bgc", "adcp"}


def get_ocean_service(
    registry: DatasetRegistry = Depends(get_dataset_registry),
) -> OceanService:
    return OceanService(registry=registry)


@router.get("/observations", response_model=list[ObservationResponse])
async def get_observations(
    type: Optional[str] = Query(None, description="Filter by platform type: argo|glider|ctd"),
    is_real_data: Optional[bool] = Query(None, description="Filter for authentic Argo in-situ observations"),
    svc: OceanService = Depends(get_ocean_service),
) -> list[ObservationResponse]:
    """
    Return in-situ observation platforms (Argo Floats, Gliders, CTD).
    Includes quality control flags and provenance metadata.
    """
    if type and type.lower() not in VALID_OBS_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid observation type '{type}'. Valid: {sorted(VALID_OBS_TYPES)}",
        )

    return svc.get_observations(
        platform_type=type.lower() if type else None,
        is_real_data=is_real_data,
    )


@router.get("/observations/{obs_id}/profile", response_model=ObservationProfileResponse)
async def get_observation_profile(
    obs_id: str,
    svc: OceanService = Depends(get_ocean_service),
) -> ObservationProfileResponse:
    """
    Return the depth profile (temperature, salinity, chlorophyll vs depth)
    for a specific observation platform.
    """
    validate_observation_id(obs_id)

    try:
        return svc.get_observation_profile(obs_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
