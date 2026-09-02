"""
providers/incois_provider.py — INCOIS / Real NetCDF Ocean Data Provider
SIH 26067 | Ocean Intelligence Platform Backend

Ingests real ocean model NetCDF files (e.g. INCOIS HYCOM, ROMS, NEMO) with:
1. Coordinate normalization (Lat/Lon/Depth/Time)
2. CF variable normalization (thetao -> temperature, so -> salinity, etc.)
3. Scientific provenance & QC tracking
"""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd
import xarray as xr

from app.models.ocean import (
    DatasetDetail,
    DepthsResponse,
    ModelTimeStep,
    OceanFieldResponse,
    OceanProfileResponse,
    OceanValueResponse,
    ProfilePoint,
    TimesResponse,
    VariableInfo,
    VariableMeta,
)
from app.providers.base_provider import BaseOceanProvider
from app.providers.normalization import (
    decode_cf_timestamps,
    normalize_coordinates,
    resolve_canonical_variable,
)

logger = logging.getLogger(__name__)

INCOIS_VARIABLE_CATALOGUE: dict[str, VariableInfo] = {
    "temperature": VariableInfo(
        id="temperature",
        display_name="Sea Water Potential Temperature (thetao)",
        unit="°C",
        min_value=-2.0,
        max_value=34.0,
        description="Sea water potential temperature from ocean model",
        standard_name="sea_water_potential_temperature",
        colormap="thermal",
    ),
    "salinity": VariableInfo(
        id="salinity",
        display_name="Sea Water Practical Salinity (so)",
        unit="PSU",
        min_value=30.0,
        max_value=40.0,
        description="Practical salinity in practical salinity units (PSU)",
        standard_name="sea_water_practical_salinity",
        colormap="haline",
    ),
    "current_u": VariableInfo(
        id="current_u",
        display_name="Zonal Current Velocity (uo)",
        unit="m/s",
        min_value=-2.5,
        max_value=2.5,
        description="Eastward sea water velocity component",
        standard_name="eastward_sea_water_velocity",
        colormap="velocity",
    ),
    "current_v": VariableInfo(
        id="current_v",
        display_name="Meridional Current Velocity (vo)",
        unit="m/s",
        min_value=-2.5,
        max_value=2.5,
        description="Northward sea water velocity component",
        standard_name="northward_sea_water_velocity",
        colormap="velocity",
    ),
    "current_velocity": VariableInfo(
        id="current_velocity",
        display_name="Total Current Speed (V)",
        unit="m/s",
        min_value=0.0,
        max_value=3.0,
        description="Vector magnitude of horizontal current velocity (sqrt(u^2 + v^2))",
        standard_name="magnitude_sea_water_velocity",
        colormap="velocity",
    ),
    "chlorophyll": VariableInfo(
        id="chlorophyll",
        display_name="Chlorophyll-a Biomass",
        unit="mg m⁻³",
        min_value=0.0,
        max_value=5.0,
        description="Chlorophyll-a mass concentration in sea water",
        standard_name="mass_concentration_of_chlorophyll_a_in_sea_water",
        colormap="algae",
    ),
}


class INCOISOceanProvider(BaseOceanProvider):
    """
    Provider for real NetCDF datasets produced by or formatted for INCOIS models.
    """

    def __init__(
        self,
        dataset_id: str,
        filepath: Path,
        name: str = "INCOIS HYCOM Indian Ocean",
        provider_name: str = "INCOIS",
    ):
        super().__init__(dataset_id=dataset_id, name=name, provider_name=provider_name, is_real_data=True)
        self.filepath = filepath
        self._ds: Optional[xr.Dataset] = None

    def _get_dataset(self) -> xr.Dataset:
        if self._ds is None:
            if not self.filepath.exists():
                raise FileNotFoundError(f"Real dataset file not found: {self.filepath}")
            raw = xr.open_dataset(self.filepath)
            self._ds = normalize_coordinates(raw)
        return self._ds

    def get_dataset_detail(self) -> DatasetDetail:
        ds = self._get_dataset()
        dims = {str(k): int(v) for k, v in ds.sizes.items()}

        var_metas: list[VariableMeta] = []
        for var_name, da in ds.data_vars.items():
            valid_min = float(da.min().values) if da.size > 0 else None
            valid_max = float(da.max().values) if da.size > 0 else None
            var_metas.append(
                VariableMeta(
                    name=str(var_name),
                    long_name=str(da.attrs.get("long_name", var_name)),
                    standard_name=str(da.attrs.get("standard_name", "")),
                    units=str(da.attrs.get("units", "")),
                    valid_min=round(valid_min, 3) if valid_min is not None else None,
                    valid_max=round(valid_max, 3) if valid_max is not None else None,
                )
            )

        coords_summary: dict[str, list[float]] = {}
        if "latitude" in ds.coords:
            lats = ds.coords["latitude"].values
            coords_summary["latitude"] = [round(float(lats[0]), 2), round(float(lats[-1]), 2)]
        if "longitude" in ds.coords:
            lons = ds.coords["longitude"].values
            coords_summary["longitude"] = [round(float(lons[0]), 2), round(float(lons[-1]), 2)]
        if "depth" in ds.coords:
            depths = [round(float(d), 1) for d in ds.coords["depth"].values]
            coords_summary["depth"] = depths

        time_range = None
        if "time" in ds.coords:
            decoded_times = decode_cf_timestamps(ds.coords["time"])
            if decoded_times:
                time_range = {"start": decoded_times[0], "end": decoded_times[-1]}

        spatial_bounds = None
        if "latitude" in ds.coords and "longitude" in ds.coords:
            spatial_bounds = {
                "lat_min": float(ds.coords["latitude"].min().values),
                "lat_max": float(ds.coords["latitude"].max().values),
                "lon_min": float(ds.coords["longitude"].min().values),
                "lon_max": float(ds.coords["longitude"].max().values),
            }

        provenance = self.get_provenance(
            source_file=self.filepath.name,
            processing_steps=["coordinate_normalization", "cf_time_decoding"],
        )

        return DatasetDetail(
            id=self.dataset_id,
            name=self.name,
            provider=self.provider_name,
            format="NetCDF-4",
            dimensions=dims,
            coordinates=coords_summary,
            variables=var_metas,
            time_range=time_range,
            spatial_bounds=spatial_bounds,
            global_attributes={str(k): str(v) for k, v in ds.attrs.items()},
            provenance=provenance,
            is_demo=False,
            is_real_data=True,
        )

    def get_times(self) -> TimesResponse:
        ds = self._get_dataset()
        if "time" not in ds.coords:
            return TimesResponse(
                dataset_id=self.dataset_id,
                times=[
                    ModelTimeStep(
                        index=0,
                        iso_string="2026-08-28T12:00:00Z",
                        label="12:00",
                        date_label="28 Aug 2026",
                    )
                ],
            )

        decoded = decode_cf_timestamps(ds.coords["time"])
        steps: list[ModelTimeStep] = []
        for idx, iso_str in enumerate(decoded):
            try:
                dt = pd.to_datetime(iso_str)
                label = dt.strftime("%H:%M")
                date_label = dt.strftime("%d %b %Y")
            except Exception:
                label = f"T+{idx * 6}h"
                date_label = "28 Aug 2026"

            steps.append(
                ModelTimeStep(
                    index=idx,
                    iso_string=iso_str,
                    label=label,
                    date_label=date_label,
                )
            )

        return TimesResponse(dataset_id=self.dataset_id, times=steps)

    def get_depths(self) -> DepthsResponse:
        ds = self._get_dataset()
        if "depth" not in ds.coords:
            return DepthsResponse(dataset_id=self.dataset_id, depths=[0.0], units="m")

        depths = [round(float(d), 1) for d in ds.coords["depth"].values]
        return DepthsResponse(dataset_id=self.dataset_id, depths=depths, units="m")

    def get_variables(self) -> list[VariableInfo]:
        ds = self._get_dataset()
        available: list[VariableInfo] = []

        for canonical_name, info in INCOIS_VARIABLE_CATALOGUE.items():
            if canonical_name == "current_velocity":
                # Current velocity is available if both u and v exist
                u_src = resolve_canonical_variable(ds, "current_u")
                v_src = resolve_canonical_variable(ds, "current_v")
                if u_src and v_src:
                    available.append(info)
            else:
                src_name = resolve_canonical_variable(ds, canonical_name)
                if src_name:
                    available.append(info)

        return available or list(INCOIS_VARIABLE_CATALOGUE.values())

    def get_field(
        self,
        variable: str,
        depth: float,
        time_iso: Optional[str] = None,
        bbox: Optional[tuple[float, float, float, float]] = None,
        max_grid_points: int = 2500,
    ) -> OceanFieldResponse:
        ds = self._get_dataset()

        # Handle composite current velocity
        if variable in ("current_velocity", "velocity"):
            u_src = resolve_canonical_variable(ds, "current_u")
            v_src = resolve_canonical_variable(ds, "current_v")
            if not u_src or not v_src:
                raise ValueError("Dataset does not contain U and V current components for velocity magnitude")
            
            u_field = self.get_field("current_u", depth, time_iso, bbox, max_grid_points)
            v_field = self.get_field("current_v", depth, time_iso, bbox, max_grid_points)

            vel_values: list[Optional[float]] = []
            for u_val, v_val in zip(u_field.values, v_field.values):
                if u_val is None or v_val is None:
                    vel_values.append(None)
                else:
                    vel = math.sqrt(u_val * u_val + v_val * v_val)
                    vel_values.append(round(vel, 3))

            valid_vels = [v for v in vel_values if v is not None]
            v_min = float(min(valid_vels)) if valid_vels else 0.0
            v_max = float(max(valid_vels)) if valid_vels else 2.5

            provenance = self.get_provenance(
                source_file=self.filepath.name,
                processing_steps=["vector_magnitude_calculation", "nearest_depth", "nearest_time"],
            )

            return OceanFieldResponse(
                dataset=self.dataset_id,
                variable="current_velocity",
                unit="m/s",
                depth=depth,
                time=time_iso or (u_field.time),
                latitudes=u_field.latitudes,
                longitudes=u_field.longitudes,
                values=vel_values,
                nlat=u_field.nlat,
                nlon=u_field.nlon,
                valid_min=round(v_min, 3),
                valid_max=round(v_max, 3),
                provenance=provenance,
            )

        src_var_name = resolve_canonical_variable(ds, variable)
        if not src_var_name:
            raise ValueError(f"Variable '{variable}' not found in real dataset '{self.dataset_id}'")

        da = ds[src_var_name]

        # 1. Depth selection (nearest)
        if "depth" in da.dims:
            da = da.sel(depth=depth, method="nearest")

        # 2. Time selection (nearest)
        selected_time_str = "2026-08-28T12:00:00Z"
        if "time" in da.dims:
            if time_iso:
                try:
                    t_val = pd.to_datetime(time_iso)
                    if isinstance(da.coords["time"].values[0], (np.datetime64, pd.Timestamp)):
                        time_target = np.datetime64(t_val.tz_localize(None) if t_val.tzinfo else t_val)
                        da = da.sel(time=time_target, method="nearest")
                    else:
                        da = da.sel(time=time_iso, method="nearest")
                    selected_time_str = time_iso
                except Exception:
                    da = da.isel(time=0)
            else:
                da = da.isel(time=0)

        # 3. Spatial BBox subsetting
        if bbox:
            min_lat, min_lon, max_lat, max_lon = bbox
            if "latitude" in da.dims:
                da = da.sel(latitude=slice(min_lat, max_lat))
            if "longitude" in da.dims:
                da = da.sel(longitude=slice(min_lon, max_lon))

        # 4. Downsampling if larger than max_grid_points
        lats = [float(x) for x in da.coords["latitude"].values]
        lons = [float(x) for x in da.coords["longitude"].values]
        total_pts = len(lats) * len(lons)

        if total_pts > max_grid_points and len(lats) > 4 and len(lons) > 4:
            stride_lat = max(1, math.ceil(len(lats) / math.isqrt(max_grid_points)))
            stride_lon = max(1, math.ceil(len(lons) / math.isqrt(max_grid_points)))
            da = da.isel(latitude=slice(None, None, stride_lat), longitude=slice(None, None, stride_lon))
            lats = [float(x) for x in da.coords["latitude"].values]
            lons = [float(x) for x in da.coords["longitude"].values]

        data_array = da.values
        flat_values: list[Optional[float]] = []
        for val in data_array.flatten():
            if np.isnan(val) or np.isinf(val):
                flat_values.append(None)
            else:
                flat_values.append(round(float(val), 3))

        valid_vals = [v for v in flat_values if v is not None]
        v_min = float(min(valid_vals)) if valid_vals else 0.0
        v_max = float(max(valid_vals)) if valid_vals else 1.0

        unit = str(da.attrs.get("units", "unit"))
        provenance = self.get_provenance(
            source_file=self.filepath.name,
            processing_steps=["nearest_depth", "nearest_time", "bbox_subset", "spatial_downsample"],
        )

        return OceanFieldResponse(
            dataset=self.dataset_id,
            variable=variable,
            unit=unit,
            depth=depth,
            time=selected_time_str,
            latitudes=[round(x, 3) for x in lats],
            longitudes=[round(x, 3) for x in lons],
            values=flat_values,
            nlat=len(lats),
            nlon=len(lons),
            valid_min=round(v_min, 3),
            valid_max=round(v_max, 3),
            provenance=provenance,
        )

    def get_value(
        self,
        variable: str,
        lat: float,
        lon: float,
        depth: float,
        time_iso: Optional[str] = None,
    ) -> OceanValueResponse:
        ds = self._get_dataset()

        # Velocity magnitude computation
        if variable in ("current_velocity", "velocity"):
            u_resp = self.get_value("current_u", lat, lon, depth, time_iso)
            v_resp = self.get_value("current_v", lat, lon, depth, time_iso)
            val = None
            if u_resp.value is not None and v_resp.value is not None:
                val = round(math.sqrt(u_resp.value**2 + v_resp.value**2), 3)

            provenance = self.get_provenance(
                source_file=self.filepath.name,
                processing_steps=["nearest_grid_node_interpolation", "vector_magnitude"],
            )

            return OceanValueResponse(
                latitude=lat,
                longitude=lon,
                depth=depth,
                variable="current_velocity",
                value=val,
                unit="m/s",
                time=time_iso or "2026-08-28T12:00:00Z",
                dataset=self.dataset_id,
                nearest_lat=u_resp.nearest_lat,
                nearest_lon=u_resp.nearest_lon,
                provenance=provenance,
            )

        src_var_name = resolve_canonical_variable(ds, variable)
        if not src_var_name:
            raise ValueError(f"Variable '{variable}' not found in real dataset '{self.dataset_id}'")

        da = ds[src_var_name]

        # Nearest point selection
        kwargs = {}
        if "latitude" in da.dims:
            kwargs["latitude"] = lat
        if "longitude" in da.dims:
            kwargs["longitude"] = lon
        if "depth" in da.dims:
            kwargs["depth"] = depth
        if "time" in da.dims:
            if time_iso:
                try:
                    t_val = pd.to_datetime(time_iso)
                    if isinstance(da.coords["time"].values[0], (np.datetime64, pd.Timestamp)):
                        kwargs["time"] = np.datetime64(t_val.tz_localize(None) if t_val.tzinfo else t_val)
                    else:
                        kwargs["time"] = time_iso
                except Exception:
                    pass
            if "time" not in kwargs:
                da = da.isel(time=0)

        point_da = da.sel(method="nearest", **kwargs).squeeze()
        raw_val = float(point_da.values)
        val = None if np.isnan(raw_val) or np.isinf(raw_val) else round(raw_val, 3)

        nearest_lat = float(point_da.coords["latitude"].values) if "latitude" in point_da.coords else lat
        nearest_lon = float(point_da.coords["longitude"].values) if "longitude" in point_da.coords else lon
        unit = str(da.attrs.get("units", ""))

        provenance = self.get_provenance(
            source_file=self.filepath.name,
            processing_steps=["nearest_grid_node_interpolation"],
        )

        return OceanValueResponse(
            latitude=lat,
            longitude=lon,
            depth=depth,
            variable=variable,
            value=val,
            unit=unit,
            time=time_iso or "2026-08-28T12:00:00Z",
            dataset=self.dataset_id,
            nearest_lat=round(nearest_lat, 3),
            nearest_lon=round(nearest_lon, 3),
            provenance=provenance,
        )

    def get_profile(
        self,
        variable: str,
        lat: float,
        lon: float,
        time_iso: Optional[str] = None,
    ) -> OceanProfileResponse:
        ds = self._get_dataset()
        src_var_name = resolve_canonical_variable(ds, variable)
        if not src_var_name and variable not in ("current_velocity", "velocity"):
            raise ValueError(f"Variable '{variable}' not found in real dataset '{self.dataset_id}'")

        depths_resp = self.get_depths()
        points: list[ProfilePoint] = []

        for d in depths_resp.depths:
            val_resp = self.get_value(variable, lat, lon, d, time_iso)
            points.append(ProfilePoint(depth=d, value=val_resp.value))

        cfg = INCOIS_VARIABLE_CATALOGUE.get(variable)
        unit = cfg.unit if cfg else "unit"

        provenance = self.get_provenance(
            source_file=self.filepath.name,
            processing_steps=["vertical_column_extraction", "nearest_node_interpolation"],
        )

        return OceanProfileResponse(
            latitude=lat,
            longitude=lon,
            variable=variable,
            unit=unit,
            time=time_iso or "2026-08-28T12:00:00Z",
            dataset=self.dataset_id,
            profile=points,
            provenance=provenance,
        )
