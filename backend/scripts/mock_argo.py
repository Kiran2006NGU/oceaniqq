"""
mock_argo.py — Generate 50 Realistic In-Situ Argo Floats & Dive Profiles
SIH 26067 | AQUA-VIS 3D Ocean Intelligence Platform

Generates 50 globally distributed Argo floats with special focus on the Indian Ocean basin.
Each float contains:
- WMO platform identifier, coordinates, deployment date, operating status
- High-resolution multi-depth vertical dive profile (0m to 2000m) measuring:
  * Temperature (°C) with realistic thermocline decay
  * Salinity (PSU) with halocline structure
  * Quality control status (QC flag = 1: Good)
"""

import json
import math
from pathlib import Path
import numpy as np

# Output file
PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_ARGO_FILE = PROCESSED_DIR / "argo_floats.json"

# Realistic float distribution seeds (Lat, Lon, Region)
FLOAT_SEEDS = [
    # Arabian Sea
    (15.2, 65.4, "Arabian Sea Central", 29.2, 36.4),
    (18.5, 68.2, "Arabian Sea North", 28.6, 36.8),
    (11.8, 62.5, "Arabian Sea West", 28.9, 36.1),
    (8.5, 71.0, "Lakshadweep Basin", 29.5, 35.8),
    (14.0, 58.0, "Gulf of Aden Approaches", 28.2, 36.5),
    (21.0, 63.5, "Oman Coastal Current", 27.8, 36.9),
    (12.5, 69.5, "Goa Deep Offshore", 29.1, 35.9),
    (7.0, 66.0, "Carlsberg Ridge", 28.8, 35.6),

    # Bay of Bengal
    (12.5, 85.0, "Bay of Bengal Central", 29.6, 33.4),
    (16.0, 88.5, "Bay of Bengal North", 29.8, 32.1),
    (9.2, 83.0, "Sri Lanka Basin", 29.2, 34.0),
    (14.8, 82.5, "Andhra Coast Deep", 29.4, 33.2),
    (18.2, 89.8, "Ganges Fan Outflow", 29.0, 31.8),
    (10.5, 87.5, "Central Bengal Abyssal Plain", 29.3, 33.8),
    (7.5, 85.5, "East Sri Lanka Current", 29.0, 34.2),

    # Andaman Sea
    (11.0, 93.5, "Andaman Basin", 29.4, 32.9),
    (7.8, 95.0, "Great Nicobar Trench", 29.1, 33.2),
    (13.2, 94.2, "North Andaman Shelf", 29.5, 32.5),
    (9.0, 97.0, "Malacca Strait Gateway", 29.6, 32.7),

    # Equatorial & Southern Indian Ocean
    (2.0, 78.0, "Equatorial Indian Ocean", 28.8, 34.8),
    (-4.5, 65.0, "Seychelles Chagos Thermocline Ridge", 27.5, 35.1),
    (-8.0, 75.0, "Chagos Archipelago", 26.8, 35.2),
    (-12.5, 60.0, "Mascarene Basin", 25.5, 35.4),
    (-16.0, 72.0, "Central Indian Basin", 24.2, 35.5),
    (-5.0, 88.0, "Ninetyeast Ridge North", 27.8, 34.9),
    (-10.0, 92.0, "Ninetyeast Ridge Central", 26.2, 35.2),
    (-15.0, 85.0, "Mid-Indian Ocean", 24.8, 35.4),
    (-2.0, 60.0, "Somali Current Southern Arc", 27.9, 35.2),
    (-6.5, 52.0, "Amirante Trench", 27.2, 35.3),

    # Southern Ocean & Agulhas Region
    (-25.0, 48.0, "Madagascar Ridge", 21.5, 35.6),
    (-30.0, 38.0, "Agulhas Return Current", 18.2, 35.5),
    (-35.0, 55.0, "Southwest Indian Ridge", 14.5, 35.2),
    (-40.0, 70.0, "Kerguelen Plateau Approaches", 9.8, 34.6),
    (-45.0, 80.0, "Antarctic Circumpolar Current", 5.2, 34.1),

    # Global Atlantic & Pacific Reference Floats
    (25.0, -45.0, "North Atlantic Gyre", 24.5, 36.8),
    (15.0, -35.0, "Tropical North Atlantic", 27.2, 36.0),
    (-15.0, -10.0, "South Atlantic Subtropical", 23.5, 35.8),
    (32.0, -140.0, "North Pacific Subtropical", 22.0, 35.2),
    (12.0, -160.0, "Central Tropical Pacific", 28.5, 34.8),
    (-18.0, -120.0, "South Pacific Gyre", 25.2, 35.6),
    (0.0, -140.0, "Equatorial Pacific Cold Tongue", 26.5, 35.1),
    (38.0, -70.0, "Gulf Stream Meander", 21.0, 36.2),
    (-32.0, 155.0, "East Australian Current", 19.5, 35.4),
    (28.0, 135.0, "Kuroshio Extension", 23.8, 34.7),
    (5.0, 125.0, "Mindanao Current", 29.0, 34.5),
    (-5.0, 115.0, "Indonesian Throughflow", 28.8, 34.2),
    (-22.0, 110.0, "Leeuwin Current Offshore", 22.8, 35.6),
    (18.0, -65.0, "Caribbean Sea", 28.2, 36.2),
    (35.0, 15.0, "Mediterranean Ionian Sea", 24.0, 38.5),
]

DEPTH_LEVELS = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1250, 1500, 1750, 2000]

def generate_argo_floats():
    print("[AQUA-VIS Pipeline] Generating 50 realistic Argo floats & 3D dive paths...")

    floats_list = []
    base_wmo = 2903300

    for idx, (lat, lon, region, sst, sss) in enumerate(FLOAT_SEEDS):
        wmo_id = f"WMO-{base_wmo + idx}"
        float_id = f"ARGO_{base_wmo + idx}"

        # Generate realistic vertical dive profile
        profile = []
        for d in DEPTH_LEVELS:
            # Thermocline decay
            t_decay = math.exp(-d / 360.0)
            temp = round(3.8 + (sst - 3.8) * t_decay + 0.08 * math.sin(d / 80.0), 2)

            # Halocline
            s_decay = math.exp(-d / 420.0)
            sal = round(34.72 + (sss - 34.72) * s_decay + 0.04 * math.cos(d / 90.0), 2)

            # Oxygen & chlorophyll
            chl = round(0.45 * math.exp(-((d - 35.0)**2) / 1600.0), 3) if d <= 200 else 0.005

            profile.append({
                "depth": float(d),
                "temperature": temp,
                "salinity": sal,
                "chlorophyll": chl,
                "qc_flag": 1,
            })

        floats_list.append({
            "id": float_id,
            "platform_id": wmo_id,
            "type": "argo",
            "latitude": round(float(lat), 3),
            "longitude": round(float(lon), 3),
            "current_depth": round(float(5.0 + (idx % 15)), 1),
            "max_depth": 2000.0,
            "temperature": sst,
            "salinity": sss,
            "chlorophyll": round(0.12 + 0.04 * (idx % 5), 2),
            "region": region,
            "deployment_date": "2024-03-15",
            "cycle_number": 42 + (idx % 30),
            "status": "OPERATIONAL",
            "qc_status": "qc_passed_argo_gdac",
            "profile": profile,
            "trajectory_points": [
                {"lat": round(lat - 0.25, 3), "lon": round(lon - 0.35, 3), "cycle": 40},
                {"lat": round(lat - 0.12, 3), "lon": round(lon - 0.18, 3), "cycle": 41},
                {"lat": round(lat, 3), "lon": round(lon, 3), "cycle": 42},
            ],
        })

    with open(OUTPUT_ARGO_FILE, "w", encoding="utf-8") as f:
        json.dump(floats_list, f, indent=2)

    print(f"[AQUA-VIS Pipeline] Successfully exported {len(floats_list)} Argo floats to {OUTPUT_ARGO_FILE} ({OUTPUT_ARGO_FILE.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    generate_argo_floats()
