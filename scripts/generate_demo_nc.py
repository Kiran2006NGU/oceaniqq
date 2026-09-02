"""
generate_demo_nc.py — Create a small demo NetCDF dataset for development
SIH 26067 | Ocean Intelligence Platform

⚠️  DEMO / SIMULATED DATA
Values are procedurally generated for demonstration only.
Not affiliated with INCOIS, MoES, or any operational forecast system.

Usage:
    python scripts/generate_demo_nc.py

Output:
    backend/data/demo/demo_ocean.nc

Dataset dimensions:
    time   : 5  (2026-08-28 00/06/12/18Z, 2026-08-29 00Z)
    depth  : 9  (0, 10, 25, 50, 100, 200, 500, 1000, 2000 m)
    lat    : 30 (-25 to 30 °N)
    lon    : 40 (40 to 105 °E)

Variables:
    temperature  (°C)
    salinity     (PSU)
    chlorophyll  (mg m⁻³)
    u            (m/s)  eastward current
    v            (m/s)  northward current
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np

try:
    import netCDF4 as nc
except ImportError:
    print("ERROR: netCDF4 not installed. Run: pip install netCDF4", file=sys.stderr)
    sys.exit(1)

# ── Output path ────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT   = SCRIPT_DIR.parent
OUT_PATH    = REPO_ROOT / "backend" / "data" / "demo" / "demo_ocean.nc"
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# ── Grid definition ────────────────────────────────────────────────────────────

LATS   = np.linspace(-25, 30, 30, dtype=np.float32)    # 30 points
LONS   = np.linspace(40, 105, 40, dtype=np.float32)    # 40 points
DEPTHS = np.array([0, 10, 25, 50, 100, 200, 500, 1000, 2000], dtype=np.float32)  # 9 levels

# 5 time steps: 00, 06, 12, 18 UTC on 2026-08-28 + 00 UTC on 2026-08-29
# Store as "hours since 2026-08-28 00:00:00"
TIMES_HOURS = np.array([0, 6, 12, 18, 24], dtype=np.float64)
TIME_UNITS  = "hours since 2026-08-28 00:00:00"
CALENDAR    = "gregorian"

# ── Deterministic field generators ────────────────────────────────────────────
#
# These mirror the logic in mockOceanData.ts so both data sources produce
# consistent-looking data.

def _temperature(lat: float, lon: float, depth: float, t: float) -> float:
    lat_factor = max(0.0, 1 - abs(lat) / 35)
    base = 5 + lat_factor * 25
    wave1 = 2.0 * math.sin((lon * math.pi) / 90 + t * 0.4)
    wave2 = 1.2 * math.cos((lat * math.pi) / 30 + (lon * math.pi) / 120)
    wave3 = 0.8 * math.sin((lat * math.pi) / 20 + (lon * math.pi) / 60 + t * 0.6)
    depth_cool = (
        0 if depth < 50
        else -(depth - 50) * 0.055 if depth < 300
        else -13.75 - (depth - 300) * 0.006
    )
    return max(-2.0, min(34.0, base + wave1 + wave2 + wave3 + depth_cool))


def _salinity(lat: float, lon: float, depth: float, t: float) -> float:
    sal = 35.0
    a_lat = max(0.0, 1 - abs(lat - 17) / 8)
    a_lon = max(0.0, 1 - abs(lon - 65) / 10)
    sal += 1.8 * a_lat * a_lon
    b_lat = max(0.0, 1 - abs(lat - 12) / 8)
    b_lon = max(0.0, 1 - abs(lon - 88) / 10)
    sal -= 2.2 * b_lat * b_lon
    if lat < -5:
        sal -= 0.3 * max(0.0, (-lat - 5) / 20)
    sal += 0.4 * math.sin((lon * math.pi) / 90 + t * 0.3)
    sal += 0.2 * math.cos((lat * math.pi) / 40)
    if depth > 100:
        sal += min(0.5, (depth - 100) / 3000)
    return max(30.0, min(40.0, sal))


def _chlorophyll(lat: float, lon: float, depth: float, t: float) -> float:
    chl = 0.08
    a_c = max(0.0, 1 - math.sqrt(((lat - 15) ** 2) / 64 + ((lon - 60) ** 2) / 144))
    chl += 2.5 * a_c
    b_c = max(0.0, 1 - math.sqrt(((lat - 13) ** 2) / 36 + ((lon - 84) ** 2) / 100))
    chl += 1.8 * b_c
    s_c = max(0.0, 1 - math.sqrt(((lat + 12) ** 2) / 49 + ((lon - 70) ** 2) / 196))
    chl += 1.2 * s_c
    chl += 0.3 * max(0.0, math.sin((lon * math.pi) / 60 + (lat * math.pi) / 30 + t * 0.8))
    chl *= 0.8 + 0.4 * max(0.0, math.sin(t * 1.2))
    if depth > 10:
        chl *= math.exp(-(depth - 10) / 70)
    return max(0.01, min(5.0, chl))


def _current_u(lat: float, lon: float, depth: float, t: float) -> float:
    sec     = -0.45 * max(0.0, math.cos((lat * math.pi) / 15))
    monsoon = 0.3 * math.sin((lon * math.pi) / 60 + t * 0.5) * math.cos((lat * math.pi) / 30)
    eddy    = 0.25 * math.sin((lon * math.pi) / 45 + (lat * math.pi) / 25 + t * 0.7)
    return max(-2.0, min(2.0, (sec + monsoon + eddy) * math.exp(-depth / 350)))


def _current_v(lat: float, lon: float, depth: float, t: float) -> float:
    s_lat  = max(0.0, 1 - abs(lat - 7) / 10)
    s_lon  = max(0.0, 1 - abs(lon - 48) / 8)
    somali = 0.9 * s_lat * s_lon * math.cos(t * 0.4)
    merid  = 0.2 * math.sin((lon * math.pi) / 60 + t * 0.6)
    wave   = 0.15 * math.cos((lat * math.pi) / 20 + (lon * math.pi) / 40)
    return max(-2.0, min(2.0, (somali + merid + wave) * math.exp(-depth / 350)))


# ── Build arrays ───────────────────────────────────────────────────────────────

nt, nd, nlat, nlon = len(TIMES_HOURS), len(DEPTHS), len(LATS), len(LONS)

print(f"Building arrays: {nt} times × {nd} depths × {nlat} lats × {nlon} lons")

temp_arr = np.zeros((nt, nd, nlat, nlon), dtype=np.float32)
sal_arr  = np.zeros((nt, nd, nlat, nlon), dtype=np.float32)
chl_arr  = np.zeros((nt, nd, nlat, nlon), dtype=np.float32)
u_arr    = np.zeros((nt, nd, nlat, nlon), dtype=np.float32)
v_arr    = np.zeros((nt, nd, nlat, nlon), dtype=np.float32)

for ti, th in enumerate(TIMES_HOURS):
    t = (th / 6) * (math.pi / 2)   # phase angle matching frontend
    for di, depth in enumerate(DEPTHS):
        for li, lat in enumerate(LATS):
            for lj, lon in enumerate(LONS):
                temp_arr[ti, di, li, lj] = _temperature(float(lat), float(lon), float(depth), t)
                sal_arr[ti,  di, li, lj] = _salinity(float(lat), float(lon), float(depth), t)
                chl_arr[ti,  di, li, lj] = _chlorophyll(float(lat), float(lon), float(depth), t)
                u_arr[ti,    di, li, lj] = _current_u(float(lat), float(lon), float(depth), t)
                v_arr[ti,    di, li, lj] = _current_v(float(lat), float(lon), float(depth), t)

print("Arrays built. Writing NetCDF...")

# ── Write NetCDF file ──────────────────────────────────────────────────────────

ds = nc.Dataset(str(OUT_PATH), "w", format="NETCDF4")

# Dimensions
ds.createDimension("time",  nt)
ds.createDimension("depth", nd)
ds.createDimension("lat",   nlat)
ds.createDimension("lon",   nlon)

# Coordinate variables
t_var = ds.createVariable("time",  "f8", ("time",))
t_var.units     = TIME_UNITS
t_var.calendar  = CALENDAR
t_var.long_name = "time"
t_var[:] = TIMES_HOURS

d_var = ds.createVariable("depth", "f4", ("depth",))
d_var.units     = "m"
d_var.long_name = "depth below sea surface"
d_var.positive  = "down"
d_var[:] = DEPTHS

lat_var = ds.createVariable("lat", "f4", ("lat",))
lat_var.units         = "degrees_north"
lat_var.long_name     = "latitude"
lat_var.standard_name = "latitude"
lat_var[:] = LATS

lon_var = ds.createVariable("lon", "f4", ("lon",))
lon_var.units         = "degrees_east"
lon_var.long_name     = "longitude"
lon_var.standard_name = "longitude"
lon_var[:] = LONS

# Data variables
def _add_var(name, data, long_name, standard_name, units, valid_min, valid_max):
    v = ds.createVariable(name, "f4", ("time", "depth", "lat", "lon"),
                           zlib=True, complevel=4, fill_value=9.96921e+36)
    v.long_name     = long_name
    v.standard_name = standard_name
    v.units         = units
    v.valid_min     = valid_min
    v.valid_max     = valid_max
    v[:] = data

_add_var("temperature", temp_arr,
         "sea water temperature", "sea_water_temperature",
         "degC", -2.0, 34.0)

_add_var("salinity", sal_arr,
         "sea water practical salinity", "sea_water_practical_salinity",
         "PSU", 30.0, 40.0)

_add_var("chlorophyll", chl_arr,
         "mass concentration of chlorophyll-a", "mass_concentration_of_chlorophyll_a_in_sea_water",
         "mg m-3", 0.0, 5.0)

_add_var("u", u_arr,
         "eastward sea water velocity", "eastward_sea_water_velocity",
         "m s-1", -2.0, 2.0)

_add_var("v", v_arr,
         "northward sea water velocity", "northward_sea_water_velocity",
         "m s-1", -2.0, 2.0)

# Global attributes (CF conventions)
ds.title         = "Demo Ocean Model — Indian Ocean"
ds.institution   = "SIH 26067 | Ocean Intelligence Platform (Demo)"
ds.source        = "Procedurally generated demo data"
ds.summary       = (
    "DEMO / SIMULATED DATA. "
    "Values are procedurally generated for development and demonstration only. "
    "Not affiliated with INCOIS, MoES, or any operational forecast system."
)
ds.comment       = "DEMO / SIMULATED DATA — NOT OPERATIONAL"
ds.is_demo       = "true"
ds.conventions   = "CF-1.8"
ds.Conventions   = "CF-1.8"
ds.history       = "Created by generate_demo_nc.py for SIH 26067 Phase 3 development"
ds.geospatial_lat_min  = float(LATS.min())
ds.geospatial_lat_max  = float(LATS.max())
ds.geospatial_lon_min  = float(LONS.min())
ds.geospatial_lon_max  = float(LONS.max())
ds.geospatial_vertical_min = float(DEPTHS.min())
ds.geospatial_vertical_max = float(DEPTHS.max())
ds.geospatial_vertical_units = "m"
ds.geospatial_vertical_positive = "down"

ds.close()

size_kb = OUT_PATH.stat().st_size / 1024
print(f"\nOK  Written: {OUT_PATH}")
print(f"   Size: {size_kb:.1f} KB")
print(f"   Dimensions: time={nt}, depth={nd}, lat={nlat}, lon={nlon}")
print(f"   Variables: temperature, salinity, chlorophyll, u, v")
print(f"   Domain: lat [{LATS.min():.0f}, {LATS.max():.0f}]°N, lon [{LONS.min():.0f}, {LONS.max():.0f}]°E")
