"""
ingest_model.py — NetCDF Ocean Model Ingestion & Dynamic Downsampling
SIH 26067 | AQUA-VIS 3D Ocean Intelligence Platform

Reads Copernicus Marine GLOBAL_ANALYSISFORECAST_PHY_001_024 / INCOIS NetCDF files,
dynamically downsamples high-resolution 0.083° global grids (~8.8 million points)
to responsive ~40,000 point JSON depth slices, and exports lightweight JSON payloads.
"""

import argparse
import json
import sys
from pathlib import Path
import numpy as np
import xarray as xr

# Paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
REAL_DATA_DIR = BACKEND_DIR / "data" / "real"
PROCESSED_DIR = BACKEND_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_GRID_FILE = PROCESSED_DIR / "grid_slices.json"

def ingest_and_downsample_netcdf(custom_filepath: Path | None = None):
    print("=" * 65)
    print("AQUA-VIS Data Ingestion & Downsampling Pipeline (SIH 26067)")
    print("=" * 65)

    if custom_filepath and custom_filepath.exists():
        source_nc = custom_filepath
    else:
        # Prioritize Copernicus Marine CMEMS file if present
        cmems_files = list(REAL_DATA_DIR.glob("*cmems*.nc"))
        if cmems_files:
            source_nc = cmems_files[0]
        else:
            nc_candidates = list(REAL_DATA_DIR.glob("*.nc"))
            if nc_candidates:
                source_nc = nc_candidates[0]
            else:
                demo_nc = BACKEND_DIR / "data" / "demo" / "demo_ocean.nc"
                if demo_nc.exists():
                    source_nc = demo_nc
                else:
                    raise FileNotFoundError("No NetCDF files found in backend/data/real/ or backend/data/demo/")

    print(f"[AQUA-VIS] Ingesting NetCDF dataset: {source_nc.name}")
    print(f"[AQUA-VIS] Source file size: {source_nc.stat().st_size / (1024 * 1024):.1f} MB")

    raw_ds = xr.open_dataset(source_nc)

    # Normalize coordinate names
    coord_map = {}
    for d in raw_ds.dims:
        dl = str(d).lower()
        if dl in ("lat", "latitude", "y"): coord_map[d] = "latitude"
        elif dl in ("lon", "longitude", "x"): coord_map[d] = "longitude"
        elif dl in ("depth", "deptht", "lev", "level", "z"): coord_map[d] = "depth"
        elif dl in ("time", "times", "time_counter"): coord_map[d] = "time"

    ds = raw_ds.rename(coord_map)

    lats = ds["latitude"].values
    lons = ds["longitude"].values
    total_pts = len(lats) * len(lons)
    print(f"[AQUA-VIS] Original raw grid: {len(lats)} lat x {len(lons)} lon ({total_pts:,} total points)")

    # Dynamic downsampling: stride to achieve ~40,000 points per slice
    stride_lat = 1
    stride_lon = 1
    if total_pts > 45000:
        # Aim for ~200 x 200 grid (~40,000 points)
        stride_lat = max(1, int(np.ceil(len(lats) / 180)))
        stride_lon = max(1, int(np.ceil(len(lons) / 240)))
        ds = ds.isel(latitude=slice(None, None, stride_lat), longitude=slice(None, None, stride_lon))
        lats = ds["latitude"].values
        lons = ds["longitude"].values

    final_pts = len(lats) * len(lons)
    print(f"[AQUA-VIS] Downsampled grid: {len(lats)} lat x {len(lons)} lon ({final_pts:,} points, stride: {stride_lat}x{stride_lon})")

    # Find canonical variables
    var_map = {}
    for target, aliases in [
        ("temperature", ["thetao", "temp", "temperature", "sea_water_potential_temperature"]),
        ("salinity", ["so", "salt", "salinity", "sea_water_practical_salinity"]),
        ("current_u", ["uo", "u", "current_u", "eastward_sea_water_velocity"]),
        ("current_v", ["vo", "v", "current_v", "northward_sea_water_velocity"]),
    ]:
        for alias in aliases:
            if alias in ds.data_vars:
                var_map[target] = alias
                print(f"   [+] Mapped '{target}' <- '{alias}'")
                break

    depths = [float(d) for d in ds["depth"].values] if "depth" in ds else [0.0]

    payload = {
        "metadata": {
            "source_file": source_nc.name,
            "title": str(raw_ds.attrs.get("title", "Copernicus Marine GLOBAL_ANALYSISFORECAST_PHY_001_024")),
            "institution": str(raw_ds.attrs.get("institution", "Mercator Ocean International / Copernicus Marine")),
            "source": str(raw_ds.attrs.get("source", "MOI GLO12 Global Ocean Analysis")),
            "nlat": len(lats),
            "nlon": len(lons),
            "latitudes": [round(float(x), 3) for x in lats],
            "longitudes": [round(float(x), 3) for x in lons],
            "depths": [round(float(d), 1) for d in depths],
            "is_real_data": True,
            "product_id": "GLOBAL_ANALYSISFORECAST_PHY_001_024",
        },
        "slices": {},
    }

    # Extract slices
    for var_iq, var_nc in var_map.items():
        da = ds[var_nc]
        if "time" in da.dims:
            da = da.isel(time=0)

        for d_val in depths:
            slice_da = da.sel(depth=d_val, method="nearest") if "depth" in da.dims else da
            arr = slice_da.values
            flat_vals = []
            for v in arr.flatten():
                if np.isnan(v) or np.isinf(v):
                    flat_vals.append(None)
                else:
                    flat_vals.append(round(float(v), 3))

            valid_v = [x for x in flat_vals if x is not None]
            v_min = float(min(valid_v)) if valid_v else 0.0
            v_max = float(max(valid_v)) if valid_v else 1.0

            key = f"{var_iq}_{int(d_val)}"
            payload["slices"][key] = {
                "variable": var_iq,
                "depth": d_val,
                "values": flat_vals,
                "min": round(v_min, 3),
                "max": round(v_max, 3),
                "unit": str(slice_da.attrs.get("units", "unit")),
            }

    with open(OUTPUT_GRID_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))

    print(f"\n[OK] Successfully ingested and exported grid to {OUTPUT_GRID_FILE}")
    print(f"     Payload size: {OUTPUT_GRID_FILE.stat().st_size / 1024:.1f} KB")
    print("=" * 65)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AQUA-VIS Model Ingestor")
    parser.add_argument("--file", type=Path, default=None, help="Path to NetCDF file")
    args = parser.parse_args()
    ingest_and_downsample_netcdf(args.file)
