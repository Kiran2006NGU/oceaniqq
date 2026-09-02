"""
services/__init__.py — Backend Services Package
SIH 26067 | Ocean Intelligence Platform Backend
"""

from app.services.dataset_registry import DatasetRegistry, get_dataset_registry
from app.services.netcdf_service import NetCDFService, get_netcdf_service
from app.services.ocean_service import OceanService

__all__ = [
    "DatasetRegistry",
    "get_dataset_registry",
    "NetCDFService",
    "get_netcdf_service",
    "OceanService",
]
