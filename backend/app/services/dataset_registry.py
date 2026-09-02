"""
services/dataset_registry.py — Dataset Registry & Provider Factory
SIH 26067 | Ocean Intelligence Platform Backend

Manages dataset registration, discovery, provider instantiation, and in-process caching.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from app.config import DATA_DIR, DEMO_DATA_DIR
from app.models.ocean import DatasetInfo
from app.providers.base_provider import BaseOceanProvider
from app.providers.demo_provider import DemoOceanProvider
from app.providers.incois_provider import INCOISOceanProvider
from app.providers.observation_provider import ObservationProvider

logger = logging.getLogger(__name__)

REAL_DATA_DIR = DATA_DIR / "real"


class DatasetRegistry:
    """
    Central registry and provider cache for ocean datasets.
    """

    def __init__(self):
        self._providers: dict[str, BaseOceanProvider] = {}
        self._observation_provider: ObservationProvider = ObservationProvider()
        self._initialized = False

    def initialize(self) -> None:
        """Discover and register all available datasets."""
        if self._initialized:
            return

        # 1. Always register default Demo Synthetic dataset
        demo_file = DEMO_DATA_DIR / "demo_ocean.nc"
        if demo_file.exists():
            self._providers["demo-ocean"] = DemoOceanProvider("demo-ocean")
            logger.info("Registered demo dataset: demo-ocean")

        # 2. Discover Real Datasets in backend/data/real/
        REAL_DATA_DIR.mkdir(parents=True, exist_ok=True)
        for nc_path in REAL_DATA_DIR.glob("*.nc"):
            stem = nc_path.stem
            # Clean dataset ID (lowercase, hyphenated)
            ds_id = f"incois-{stem.lower().replace('_', '-')}"
            try:
                provider = INCOISOceanProvider(
                    dataset_id=ds_id,
                    filepath=nc_path,
                    name=f"INCOIS Ocean Model ({stem})",
                    provider_name="INCOIS",
                )
                self._providers[ds_id] = provider
                # Also alias "incois-hycom-real" if it's an INCOIS file
                if "hycom" in stem.lower() or "incois" in stem.lower():
                    self._providers["incois-hycom-real"] = provider
                logger.info("Discovered and registered real dataset: %s from %s", ds_id, nc_path.name)
            except Exception as err:
                logger.warning("Failed to initialize real dataset %s: %s", nc_path, err)

        self._initialized = True

    def get_provider(self, dataset_id: str = "demo-ocean") -> BaseOceanProvider:
        self.initialize()

        if dataset_id in self._providers:
            return self._providers[dataset_id]

        # Alias lookup
        if dataset_id in ("real", "incois", "incois-real", "incois-hycom"):
            for k, p in self._providers.items():
                if p.is_real_data:
                    return p

        # Fallback to demo
        if "demo-ocean" in self._providers:
            logger.warning("Dataset '%s' not found, falling back to 'demo-ocean'", dataset_id)
            return self._providers["demo-ocean"]

        # If not even demo is loaded, instantiate default demo provider
        demo_p = DemoOceanProvider("demo-ocean")
        self._providers["demo-ocean"] = demo_p
        return demo_p

    def list_datasets(self) -> list[DatasetInfo]:
        self.initialize()
        results: list[DatasetInfo] = []

        seen_ids = set()
        for ds_id, provider in self._providers.items():
            # Skip duplicate aliases
            if provider.dataset_id in seen_ids and ds_id != provider.dataset_id:
                continue
            seen_ids.add(provider.dataset_id)

            try:
                detail = provider.get_dataset_detail()
                results.append(
                    DatasetInfo(
                        id=provider.dataset_id,
                        name=provider.name,
                        provider=provider.provider_name,
                        format="NetCDF-4",
                        variables=[v.name for v in detail.variables],
                        dimensions=detail.dimensions,
                        description="Local Real Ocean NetCDF Model Dataset" if provider.is_real_data else "Synthetic Demonstration NetCDF Dataset",
                        is_demo=not provider.is_real_data,
                        is_real_data=provider.is_real_data,
                        status="LOCAL_REAL_DATA" if provider.is_real_data else "DEMO",
                    )
                )
            except Exception as err:
                logger.warning("Failed to summarize dataset '%s': %s", ds_id, err)

        return results

    def get_observation_provider(self) -> ObservationProvider:
        return self._observation_provider


# Global singleton instance
_registry = DatasetRegistry()


def get_dataset_registry() -> DatasetRegistry:
    return _registry
