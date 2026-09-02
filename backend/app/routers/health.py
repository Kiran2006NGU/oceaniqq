"""
routers/health.py — Health check endpoint
SIH 26067 | Ocean Intelligence Platform Backend

GET /api/v1/health
"""

from fastapi import APIRouter, Depends

from app.models.ocean import HealthResponse
from app.services.netcdf_service import NetCDFService, get_netcdf_service
from app.services.ocean_service import OceanService

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(
    netcdf: NetCDFService = Depends(get_netcdf_service),
) -> HealthResponse:
    """
    Health check — confirms the backend is running and datasets are accessible.
    """
    svc = OceanService(netcdf)
    return svc.get_health()
