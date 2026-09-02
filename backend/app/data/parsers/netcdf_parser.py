"""
backend/app/data/parsers/netcdf_parser.py — NetCDF Ingestion Parser
SIH 26067 | Ocean Intelligence Platform Backend

Extracts variables, dimensions, coordinates, and attributes from NetCDF-3 / NetCDF-4 files
using xarray, returning normalized metadata and tabular/gridded data structures.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional
import numpy as np
import pandas as pd
import xarray as xr

from app.providers.normalization import (
    CANONICAL_VARIABLE_MAP,
    decode_cf_timestamps,
    normalize_coordinates,
    resolve_canonical_variable,
)

logger = logging.getLogger(__name__)


class NetCDFParser:
    """Parser for NetCDF4 oceanographic data files (gridded models or profile points)."""

    def parse_file(self, filepath: Path) -> dict[str, Any]:
        """
        Open and inspect a NetCDF file, returning detected dimensions, coordinates,
        variables, metadata, and a sample dataframe representation.
        """
        if not filepath.exists():
            raise FileNotFoundError(f"NetCDF file not found: {filepath}")

        with xr.open_dataset(filepath) as raw_ds:
            ds = normalize_coordinates(raw_ds)

            dims = {str(k): int(v) for k, v in ds.sizes.items()}
            
            # Detect coordinates
            coords_info: dict[str, Any] = {}
            if "latitude" in ds.coords:
                lats = [float(x) for x in ds.coords["latitude"].values]
                coords_info["latitude"] = {
                    "min": float(min(lats)),
                    "max": float(max(lats)),
                    "count": len(lats),
                    "sample": [round(x, 4) for x in lats[:5]],
                }
            if "longitude" in ds.coords:
                lons = [float(x) for x in ds.coords["longitude"].values]
                coords_info["longitude"] = {
                    "min": float(min(lons)),
                    "max": float(max(lons)),
                    "count": len(lons),
                    "sample": [round(x, 4) for x in lons[:5]],
                }
            if "depth" in ds.coords:
                depths = [float(x) for x in ds.coords["depth"].values]
                coords_info["depth"] = {
                    "min": float(min(depths)),
                    "max": float(max(depths)),
                    "levels": [round(x, 2) for x in depths],
                    "count": len(depths),
                }
            if "time" in ds.coords:
                times_iso = decode_cf_timestamps(ds.coords["time"])
                coords_info["time"] = {
                    "start": times_iso[0] if times_iso else None,
                    "end": times_iso[-1] if times_iso else None,
                    "count": len(times_iso),
                    "sample": times_iso[:3],
                }

            # Inspect variables
            variables_info: list[dict[str, Any]] = []
            for var_name, da in ds.data_vars.items():
                canonical = resolve_canonical_variable(ds, str(var_name)) or str(var_name)
                units = str(da.attrs.get("units", da.attrs.get("unit", "")))
                long_name = str(da.attrs.get("long_name", var_name))
                std_name = str(da.attrs.get("standard_name", ""))
                
                # Check min/max safely
                try:
                    v_min = float(da.min().values) if da.size > 0 else None
                    v_max = float(da.max().values) if da.size > 0 else None
                except Exception:
                    v_min, v_max = None, None

                variables_info.append({
                    "name": str(var_name),
                    "canonical_name": canonical,
                    "long_name": long_name,
                    "standard_name": std_name,
                    "units": units,
                    "dimensions": [str(d) for d in da.dims],
                    "valid_min": round(v_min, 4) if v_min is not None and not np.isnan(v_min) else None,
                    "valid_max": round(v_max, 4) if v_max is not None and not np.isnan(v_max) else None,
                })

            # Check if this is a gridded dataset or discrete profile dataset
            is_gridded = ("latitude" in ds.dims or "lat" in ds.dims) and ("longitude" in ds.dims or "lon" in ds.dims)

            return {
                "format": "NetCDF",
                "is_gridded": is_gridded,
                "dimensions": dims,
                "coordinates": coords_info,
                "variables": variables_info,
                "attributes": {str(k): str(v) for k, v in ds.attrs.items()},
            }
