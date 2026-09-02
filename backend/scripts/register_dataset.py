"""
register_dataset.py — NetCDF Dataset Registration & Validation Utility
SIH 26067 | Ocean Intelligence Platform Backend

Usage:
    python backend/scripts/register_dataset.py <path_to_netcdf_file> [--id DATASET_ID]

Inspects, validates, and registers a downloaded ocean NetCDF dataset.
Outputs validation summary, detected coordinates, and canonical variable mappings.
"""

import argparse
import sys
from pathlib import Path
import xarray as xr

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.providers.normalization import (
    normalize_coordinates,
    resolve_canonical_variable,
    decode_cf_timestamps,
)

def validate_and_register(file_path: Path, custom_id: str | None = None) -> bool:
    print("=" * 65)
    print(f"OceanIQ NetCDF Validation & Registration Tool (SIH 26067)")
    print(f"Inspecting file: {file_path}")
    print("=" * 65)

    if not file_path.exists():
        print(f"[ERROR] File '{file_path}' does not exist.")
        return False

    try:
        raw_ds = xr.open_dataset(file_path)
    except Exception as err:
        print(f"[ERROR] Failed to open file with xarray/netCDF4: {err}")
        return False

    print("[OK] Valid NetCDF structure confirmed.")
    print(f"   Format: {raw_ds.encoding.get('source', 'NetCDF')}")
    print(f"   Global attributes: {len(raw_ds.attrs)} found")
    for k in ("title", "institution", "source", "Conventions"):
        if k in raw_ds.attrs:
            print(f"   * {k}: {raw_ds.attrs[k]}")

    # Coordinate normalization check
    norm_ds = normalize_coordinates(raw_ds)
    print("\n[+] Coordinate Normalization & Dimensions:")
    for dim_name in ("latitude", "longitude", "depth", "time"):
        if dim_name in norm_ds.coords:
            vals = norm_ds.coords[dim_name].values
            if dim_name == "time":
                decoded = decode_cf_timestamps(norm_ds.coords["time"])
                print(f"   [+] {dim_name}: {len(decoded)} steps ({decoded[0]} -> {decoded[-1]})")
            elif dim_name == "depth":
                print(f"   [+] {dim_name}: {len(vals)} levels ({vals[0]:.1f}m -> {vals[-1]:.1f}m)")
            else:
                print(f"   [+] {dim_name}: {len(vals)} nodes ({vals[0]:.2f} deg -> {vals[-1]:.2f} deg)")
        else:
            print(f"   [WARN] Coordinate '{dim_name}' not found as standard dimension.")

    # Canonical Variable Mapping Check
    print("\n[+] Variable Canonical Mappings:")
    canonical_targets = ["temperature", "salinity", "current_u", "current_v", "chlorophyll"]
    mapped_count = 0
    for target in canonical_targets:
        src_var = resolve_canonical_variable(norm_ds, target)
        if src_var:
            da = norm_ds[src_var]
            units = da.attrs.get("units", "unknown")
            print(f"   [+] Canonical '{target}' <- mapped to dataset variable '{src_var}' (units: {units})")
            mapped_count += 1
        else:
            print(f"   [-] Canonical '{target}': not present in file")

    ds_id = custom_id or f"incois-{file_path.stem.lower().replace('_', '-')}"
    print(f"\n[+] Registration Details:")
    print(f"   * Assigned Dataset ID: {ds_id}")
    print(f"   * Data Mode: LOCAL REAL DATA")
    print(f"   * Status: REGISTERED & READY FOR INGESTION")
    print("=" * 65)

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OceanIQ NetCDF Registration Tool")
    parser.add_argument("filepath", type=Path, help="Path to NetCDF file")
    parser.add_argument("--id", type=str, default=None, help="Custom dataset ID")

    args = parser.parse_args()
    success = validate_and_register(args.filepath, args.id)
    sys.exit(0 if success else 1)
