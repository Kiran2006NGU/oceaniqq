"""
routers/datasets.py — Dataset catalog endpoints
SIH 26067 | Ocean Intelligence Platform Backend

GET /api/v1/datasets
GET /api/v1/datasets/{dataset_id}
"""

from fastapi import APIRouter, Depends, HTTPException

from app.models.ocean import DatasetDetail, DatasetInfo
from app.services.netcdf_service import NetCDFService, get_netcdf_service
from app.services.ocean_service import OceanService
from app.utils.netcdf_utils import validate_dataset_id

router = APIRouter(tags=["Datasets"])


@router.get("/datasets", response_model=list[DatasetInfo])
async def list_datasets(
    netcdf: NetCDFService = Depends(get_netcdf_service),
) -> list[DatasetInfo]:
    """
    Return the list of available NetCDF datasets with basic metadata.
    """
    svc = OceanService(netcdf)
    return svc.list_datasets()


@router.get("/datasets/{dataset_id}", response_model=DatasetDetail)
async def get_dataset(
    dataset_id: str,
    netcdf: NetCDFService = Depends(get_netcdf_service),
) -> DatasetDetail:
    """
    Return full metadata for a single dataset including dimensions, coordinates,
    variables, time range, depth range, and spatial bounds.
    """
    validate_dataset_id(dataset_id)

    if not netcdf.dataset_exists(dataset_id):
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")

    svc = OceanService(netcdf)
    try:
        return svc.get_dataset_detail(dataset_id)
    except (KeyError, FileNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error reading dataset: {exc}") from exc
