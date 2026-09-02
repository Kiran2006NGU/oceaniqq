"""
providers/base_provider.py — Abstract Base Ocean Data Provider
SIH 26067 | Ocean Intelligence Platform Backend

Defines the contract that all dataset providers (Demo synthetic, INCOIS HYCOM,
ROMS, Argo in-situ) must fulfill.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.models.ocean import (
    DatasetDetail,
    DepthsResponse,
    OceanFieldResponse,
    OceanProfileResponse,
    OceanValueResponse,
    ProvenanceInfo,
    TimesResponse,
    VariableInfo,
)


class BaseOceanProvider(ABC):
    """
    Abstract interface for Ocean Data Providers.
    Decouples storage/format specifics from FastAPI controllers.
    """

    def __init__(self, dataset_id: str, name: str, provider_name: str, is_real_data: bool = False):
        self.dataset_id = dataset_id
        self.name = name
        self.provider_name = provider_name
        self.is_real_data = is_real_data

    @abstractmethod
    def get_dataset_detail(self) -> DatasetDetail:
        """Return full metadata manifest for this dataset."""
        ...

    @abstractmethod
    def get_times(self) -> TimesResponse:
        """Return list of available temporal timestamps."""
        ...

    @abstractmethod
    def get_depths(self) -> DepthsResponse:
        """Return list of available vertical depth levels."""
        ...

    @abstractmethod
    def get_variables(self) -> list[VariableInfo]:
        """Return variable catalogue with units and valid value ranges."""
        ...

    @abstractmethod
    def get_field(
        self,
        variable: str,
        depth: float,
        time_iso: Optional[str] = None,
        bbox: Optional[tuple[float, float, float, float]] = None,
        max_grid_points: int = 2500,
    ) -> OceanFieldResponse:
        """
        Extract a 2-D spatial field slice at the requested depth and time.
        """
        ...

    @abstractmethod
    def get_value(
        self,
        variable: str,
        lat: float,
        lon: float,
        depth: float,
        time_iso: Optional[str] = None,
    ) -> OceanValueResponse:
        """
        Query a single nearest-grid-node value with provenance metadata.
        """
        ...

    @abstractmethod
    def get_profile(
        self,
        variable: str,
        lat: float,
        lon: float,
        time_iso: Optional[str] = None,
    ) -> OceanProfileResponse:
        """
        Extract vertical water-column profile at given coordinates.
        """
        ...

    def get_provenance(self, source_file: str, processing_steps: list[str]) -> ProvenanceInfo:
        """Helper to construct scientific traceability metadata."""
        return ProvenanceInfo(
            provider=self.provider_name,
            dataset_id=self.dataset_id,
            source_file=source_file,
            model_name=self.name,
            institution="INCOIS / MoES" if self.is_real_data else "OceanIQ Synthetic Pipeline",
            resolution="0.08° (~9 km)" if self.is_real_data else "~0.25° (~28 km)",
            processing=processing_steps,
            quality_status="verified_real" if self.is_real_data else "synthetic_demo",
            is_real_data=self.is_real_data,
        )
