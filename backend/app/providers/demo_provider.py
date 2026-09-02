"""
providers/demo_provider.py — Synthetic Demo Ocean Data Provider
SIH 26067 | Ocean Intelligence Platform Backend

Uses INCOISOceanProvider core on demo_ocean.nc with is_real_data=False and Demo labels.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from app.config import DEMO_DATA_DIR
from app.providers.incois_provider import INCOISOceanProvider


class DemoOceanProvider(INCOISOceanProvider):
    """
    Provider for the built-in synthetic demo NetCDF dataset.
    """

    def __init__(self, dataset_id: str = "demo-ocean", filepath: Optional[Path] = None):
        target_path = filepath or (DEMO_DATA_DIR / "demo_ocean.nc")
        super().__init__(
            dataset_id=dataset_id,
            filepath=target_path,
            name="Demo Indian Ocean Model (Synthetic)",
            provider_name="OceanIQ Demo Pipeline",
        )
        self.is_real_data = False
