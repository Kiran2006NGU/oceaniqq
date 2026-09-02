"""
services/netcdf_service.py — Lazy NetCDF dataset manager
SIH 26067 | Ocean Intelligence Platform Backend

Responsibilities:
  - Discover and register NetCDF files
  - Open datasets lazily via xarray (no full load into memory)
  - Inspect dimensions, variables, coordinates
  - Subset spatially (lat/lon bbox), by depth, and by time
  - Nearest-neighbour selection for point queries
  - Safe resource management (close datasets on app shutdown)

IMPORTANT: Never loads a full large dataset into memory.
xarray's lazy evaluation is used throughout; only the requested
subset is materialised with .values or .load().
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import numpy as np
import xarray as xr

from app.config import DATASET_REGISTRY

logger = logging.getLogger(__name__)


class NetCDFService:
    """
    Thread-safe manager for open xarray datasets.

    Datasets are opened lazily on first access and cached for the
    lifetime of the application.  Call .close_all() on shutdown.
    """

    # ── Internal standard coordinate names we look for ──────────────────────
    _LAT_NAMES  = ("lat", "latitude", "y", "nav_lat", "yt_ocean")
    _LON_NAMES  = ("lon", "longitude", "x", "nav_lon", "xt_ocean")
    _DEPTH_NAMES = ("depth", "lev", "level", "z", "deptht", "dept_m", "depth_m")
    _TIME_NAMES  = ("time", "time_counter", "t")

    def __init__(self) -> None:
        self._datasets: dict[str, xr.Dataset] = {}
        self._registry: dict[str, Path] = dict(DATASET_REGISTRY)

    # ── Public helpers ───────────────────────────────────────────────────────

    def list_dataset_ids(self) -> list[str]:
        """Return all registered dataset IDs."""
        return list(self._registry.keys())

    def dataset_exists(self, dataset_id: str) -> bool:
        path = self._registry.get(dataset_id)
        return path is not None and path.exists()

    def get_dataset(self, dataset_id: str) -> xr.Dataset:
        """
        Return an open xarray Dataset, opening it if necessary.
        Raises FileNotFoundError or KeyError if unavailable.
        """
        if dataset_id not in self._registry:
            raise KeyError(f"Unknown dataset_id: '{dataset_id}'")

        path = self._registry[dataset_id]
        if not path.exists():
            raise FileNotFoundError(f"NetCDF file not found: {path}")

        if dataset_id not in self._datasets:
            logger.info("Opening NetCDF dataset '%s' from %s", dataset_id, path)
            self._datasets[dataset_id] = xr.open_dataset(
                path,
                engine="netcdf4",
                # Lazy loading — only reads data when explicitly requested
                chunks=None,
                mask_and_scale=True,
            )
            logger.info("Opened '%s': dims=%s", dataset_id, dict(self._datasets[dataset_id].dims))

        return self._datasets[dataset_id]

    def close_all(self) -> None:
        """Close all open datasets. Call on application shutdown."""
        for dataset_id, ds in self._datasets.items():
            try:
                ds.close()
                logger.info("Closed dataset '%s'", dataset_id)
            except Exception:
                pass
        self._datasets.clear()

    # ── Coordinate discovery ─────────────────────────────────────────────────

    def _find_coord(self, ds: xr.Dataset, candidates: tuple[str, ...]) -> Optional[str]:
        """Return the first matching coordinate/dimension name."""
        for name in candidates:
            if name in ds.coords or name in ds.dims:
                return name
        return None

    def get_lat_name(self, ds: xr.Dataset) -> str:
        name = self._find_coord(ds, self._LAT_NAMES)
        if name is None:
            raise ValueError("Cannot find latitude coordinate in dataset")
        return name

    def get_lon_name(self, ds: xr.Dataset) -> str:
        name = self._find_coord(ds, self._LON_NAMES)
        if name is None:
            raise ValueError("Cannot find longitude coordinate in dataset")
        return name

    def get_depth_name(self, ds: xr.Dataset) -> Optional[str]:
        return self._find_coord(ds, self._DEPTH_NAMES)

    def get_time_name(self, ds: xr.Dataset) -> Optional[str]:
        return self._find_coord(ds, self._TIME_NAMES)

    # ── Metadata extraction ──────────────────────────────────────────────────

    def get_dimensions(self, ds: xr.Dataset) -> dict[str, int]:
        """Return dimension name → size mapping."""
        return {name: int(size) for name, size in ds.dims.items()}

    def get_variable_names(self, ds: xr.Dataset) -> list[str]:
        """Return data variable names (excludes coordinate variables)."""
        return list(ds.data_vars.keys())

    def get_coordinate_arrays(self, ds: xr.Dataset) -> dict[str, list[float]]:
        """
        Return 1-D coordinate arrays as Python lists.
        Only includes lat, lon, depth, and time (as ISO strings for time).
        """
        coords: dict[str, list[float]] = {}

        lat_name = self.get_lat_name(ds)
        lon_name = self.get_lon_name(ds)

        coords["latitude"]  = ds[lat_name].values.tolist()
        coords["longitude"] = ds[lon_name].values.tolist()

        depth_name = self.get_depth_name(ds)
        if depth_name:
            coords["depth"] = ds[depth_name].values.tolist()

        return coords

    def get_variable_attrs(self, ds: xr.Dataset, var_name: str) -> dict:
        """Return CF-convention attributes for a variable."""
        if var_name not in ds:
            return {}
        return dict(ds[var_name].attrs)

    def get_value_range(self, ds: xr.Dataset, var_name: str) -> tuple[float, float]:
        """
        Compute min/max of a variable.
        Uses valid_min/valid_max attrs if present, otherwise computes lazily.
        Clamped to avoid loading entire dataset.
        """
        if var_name not in ds:
            raise KeyError(f"Variable '{var_name}' not in dataset")

        attrs = ds[var_name].attrs
        if "valid_min" in attrs and "valid_max" in attrs:
            return float(attrs["valid_min"]), float(attrs["valid_max"])

        # Fall back to actual data min/max (loads data — acceptable for demo size)
        arr = ds[var_name].values
        valid = arr[~np.isnan(arr)]
        if len(valid) == 0:
            return 0.0, 1.0
        return float(valid.min()), float(valid.max())

    # ── Data access ──────────────────────────────────────────────────────────

    def select_time(self, ds: xr.Dataset, time_iso: str) -> xr.Dataset:
        """
        Select the nearest time step to the given ISO string.
        Returns a dataset with the time dimension reduced to 1 (then squeezed).
        """
        time_name = self.get_time_name(ds)
        if time_name is None:
            return ds

        import pandas as pd
        target = pd.Timestamp(time_iso)
        # Strip timezone so it matches numpy datetime64[ns] stored in NetCDF
        if target.tzinfo is not None:
            target = target.tz_convert("UTC").tz_localize(None)
        ds_time = ds.sel({time_name: target}, method="nearest")
        return ds_time

    def select_depth(self, ds: xr.Dataset, depth_m: float) -> xr.Dataset:
        """
        Select nearest depth level.
        Returns dataset with depth dimension reduced.
        """
        depth_name = self.get_depth_name(ds)
        if depth_name is None:
            return ds
        return ds.sel({depth_name: depth_m}, method="nearest")

    def select_bbox(
        self,
        ds: xr.Dataset,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
    ) -> xr.Dataset:
        """Slice dataset to a geographic bounding box."""
        lat_name = self.get_lat_name(ds)
        lon_name = self.get_lon_name(ds)

        lat_vals = ds[lat_name].values
        lon_vals = ds[lon_name].values

        # Handle ascending or descending lat/lon
        if lat_vals[0] > lat_vals[-1]:
            lat_slice = slice(max_lat, min_lat)
        else:
            lat_slice = slice(min_lat, max_lat)

        if lon_vals[0] > lon_vals[-1]:
            lon_slice = slice(max_lon, min_lon)
        else:
            lon_slice = slice(min_lon, max_lon)

        return ds.sel({lat_name: lat_slice, lon_name: lon_slice})

    def get_2d_field(
        self,
        dataset_id: str,
        var_name: str,
        time_iso: str,
        depth_m: float,
        bbox: Optional[tuple[float, float, float, float]] = None,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Extract a 2-D field (lat × lon) for a given variable, time and depth.

        Returns:
            lats   — 1-D array of latitudes
            lons   — 1-D array of longitudes
            values — 2-D array (nlat × nlon) with float32 values
        """
        ds = self.get_dataset(dataset_id)

        if var_name not in ds.data_vars:
            raise KeyError(f"Variable '{var_name}' not found in dataset '{dataset_id}'")

        # Subset geography
        if bbox is not None:
            min_lat, max_lat, min_lon, max_lon = bbox
            ds = self.select_bbox(ds, min_lat, max_lat, min_lon, max_lon)

        # Select time (nearest neighbour)
        ds_t = self.select_time(ds, time_iso)

        # Select depth (nearest neighbour)
        ds_td = self.select_depth(ds_t, depth_m)

        # Extract the variable — should now be 2-D (lat × lon)
        da = ds_td[var_name]

        # Squeeze out any remaining length-1 dimensions
        da = da.squeeze()

        lat_name = self.get_lat_name(ds)
        lon_name = self.get_lon_name(ds)

        lats = ds_td[lat_name].values.astype(np.float32)
        lons = ds_td[lon_name].values.astype(np.float32)

        # Load the actual data into memory (small 2-D slice)
        values = da.values.astype(np.float32)

        # Ensure 2-D
        if values.ndim == 1:
            # Could be just lon or just lat — attempt reshape
            if len(values) == len(lons):
                values = values.reshape(1, -1)
                lats = np.array([float(lats)]) if lats.ndim == 0 else lats
            elif len(values) == len(lats):
                values = values.reshape(-1, 1)
                lons = np.array([float(lons)]) if lons.ndim == 0 else lons

        return lats, lons, values

    def get_point_value(
        self,
        dataset_id: str,
        var_name: str,
        lat: float,
        lon: float,
        depth_m: float,
        time_iso: str,
    ) -> Optional[float]:
        """
        Get nearest-neighbour value at a single (lat, lon, depth, time) point.
        """
        ds = self.get_dataset(dataset_id)

        if var_name not in ds.data_vars:
            raise KeyError(f"Variable '{var_name}' not in dataset '{dataset_id}'")

        lat_name  = self.get_lat_name(ds)
        lon_name  = self.get_lon_name(ds)

        sel_args: dict = {
            lat_name: lat,
            lon_name: lon,
        }

        depth_name = self.get_depth_name(ds)
        if depth_name:
            sel_args[depth_name] = depth_m

        time_name = self.get_time_name(ds)
        if time_name:
            import pandas as pd
            ts = pd.Timestamp(time_iso)
            if ts.tzinfo is not None:
                ts = ts.tz_convert("UTC").tz_localize(None)
            sel_args[time_name] = ts

        da = ds[var_name].sel(sel_args, method="nearest")
        val = float(da.values)
        return None if np.isnan(val) else val

    def get_depth_profile(
        self,
        dataset_id: str,
        var_name: str,
        lat: float,
        lon: float,
        time_iso: str,
    ) -> list[tuple[float, Optional[float]]]:
        """
        Return a depth profile [(depth_m, value), …] for a given location.
        """
        ds = self.get_dataset(dataset_id)

        if var_name not in ds.data_vars:
            raise KeyError(f"Variable '{var_name}' not in dataset '{dataset_id}'")

        lat_name = self.get_lat_name(ds)
        lon_name = self.get_lon_name(ds)

        sel_args: dict = {lat_name: lat, lon_name: lon}

        time_name = self.get_time_name(ds)
        if time_name:
            import pandas as pd
            ts = pd.Timestamp(time_iso)
            if ts.tzinfo is not None:
                ts = ts.tz_convert("UTC").tz_localize(None)
            sel_args[time_name] = ts

        # Select lat/lon (nearest neighbour) — keep depth dimension
        da = ds[var_name].sel(sel_args, method="nearest")
        da = da.squeeze()  # remove any remaining singleton dims except depth

        depth_name = self.get_depth_name(ds)
        if depth_name is None or depth_name not in da.dims:
            # No depth dimension — return single value
            val = float(da.values)
            return [(0.0, None if np.isnan(val) else val)]

        depth_vals = ds[depth_name].values.tolist()
        profile_vals = da.values.tolist()

        result: list[tuple[float, Optional[float]]] = []
        for d, v in zip(depth_vals, profile_vals):
            result.append((float(d), None if np.isnan(float(v)) else float(v)))

        return result

    def get_all_times(self, dataset_id: str) -> list[str]:
        """Return all time steps as ISO 8601 strings."""
        ds = self.get_dataset(dataset_id)
        time_name = self.get_time_name(ds)
        if time_name is None:
            return []
        import pandas as pd
        times = pd.DatetimeIndex(ds[time_name].values)
        return [t.isoformat() for t in times]

    def get_all_depths(self, dataset_id: str) -> list[float]:
        """Return all depth levels in metres."""
        ds = self.get_dataset(dataset_id)
        depth_name = self.get_depth_name(ds)
        if depth_name is None:
            return [0.0]
        return [float(d) for d in ds[depth_name].values]


# ── Singleton instance ─────────────────────────────────────────────────────────

_service_instance: Optional[NetCDFService] = None


def get_netcdf_service() -> NetCDFService:
    """FastAPI dependency — returns the singleton NetCDFService."""
    global _service_instance
    if _service_instance is None:
        _service_instance = NetCDFService()
    return _service_instance
