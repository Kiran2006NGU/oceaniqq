"""
verify_full_system.py — Complete End-to-End Test Suite for Model vs Observation Comparison
SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
"""

import io
import json
import sys
from pathlib import Path
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1/comparison"


def test_datasets_catalog():
    print("\n--- 1. Testing Datasets Catalog (/datasets) ---")
    res = requests.get(f"{BASE_URL}/datasets")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "models" in data and "observations" in data
    assert len(data["models"]) >= 2
    assert len(data["observations"]) >= 2
    print(f"PASS: Found {len(data['models'])} models and {len(data['observations'])} observation datasets.")


def test_variables_detection():
    print("\n--- 2. Testing Common Variable Auto-Detection (/variables) ---")
    res = requests.get(f"{BASE_URL}/variables?model_id=demo-ocean&obs_id=argo-incois-gdac")
    assert res.status_code == 200
    data = res.json()
    assert "temperature" in data["common_variables"]
    assert "salinity" in data["common_variables"]
    print(f"PASS: Auto-detected common variables: {data['common_variables']}")


def test_multi_format_ingestion():
    print("\n--- 3. Testing Multi-Format Ingestion (/upload) ---")

    # A. CSV with comments and missing values
    csv_content = """# Cruise CTD Survey Arabian Sea
platform_id,latitude,longitude,depth,time,temperature,salinity,chlorophyll,qc_flag
CRUISE_01,15.2,67.8,0.0,2026-08-28T06:00:00Z,29.1,36.2,0.22,1
CRUISE_01,15.2,67.8,10.0,2026-08-28T06:00:00Z,28.7,36.2,0.25,1
CRUISE_01,15.2,67.8,50.0,2026-08-28T06:00:00Z,25.3,36.4,0.19,1
CRUISE_01,15.2,67.8,100.0,2026-08-28T06:00:00Z,19.2,35.9,0.08,1
CRUISE_01,15.2,67.8,200.0,2026-08-28T06:00:00Z,-9999,35.2,-9999,4
"""
    files = {"file": ("test_cruise.csv", csv_content.encode("utf-8"), "text/csv")}
    res = requests.post(f"{BASE_URL}/upload", files=files, data={"dataset_type": "observation", "custom_name": "Arabian Sea CSV Cruise"})
    assert res.status_code == 200, f"CSV upload failed: {res.text}"
    csv_resp = res.json()
    assert csv_resp["is_valid"] is True
    assert "temperature" in csv_resp["detected_variables"]
    print(f"PASS: CSV Ingestion parsed {csv_resp['record_count']} records, format: {csv_resp['format']}")

    # B. TSV Ingestion
    tsv_content = "lat\tlon\tdepth\ttime\ttemp\tsal\n14.5\t66.2\t5.0\t2026-08-28T12:00:00Z\t28.9\t36.1\n14.5\t66.2\t50.0\t2026-08-28T12:00:00Z\t26.4\t36.3\n"
    files = {"file": ("test_glider.tsv", tsv_content.encode("utf-8"), "text/tab-separated-values")}
    res = requests.post(f"{BASE_URL}/upload", files=files, data={"dataset_type": "observation", "custom_name": "Glider TSV"})
    assert res.status_code == 200
    tsv_resp = res.json()
    assert tsv_resp["is_valid"] is True
    print(f"PASS: TSV Ingestion detected {tsv_resp['format']} with {tsv_resp['record_count']} records.")

    # C. GeoJSON Ingestion
    geojson_content = json.dumps({
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [68.0, 15.0]},
                "properties": {
                    "depth": 0.0,
                    "temperature": 29.2,
                    "salinity": 36.3,
                    "platform_id": "GEOJSON_STN_1",
                    "time": "2026-08-28T12:00:00Z"
                }
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [68.0, 15.0]},
                "properties": {
                    "depth": 25.0,
                    "temperature": 27.8,
                    "salinity": 36.3,
                    "platform_id": "GEOJSON_STN_1",
                    "time": "2026-08-28T12:00:00Z"
                }
            }
        ]
    })
    files = {"file": ("stations.geojson", geojson_content.encode("utf-8"), "application/geo+json")}
    res = requests.post(f"{BASE_URL}/upload", files=files, data={"dataset_type": "observation"})
    assert res.status_code == 200
    geo_resp = res.json()
    assert geo_resp["is_valid"] is True
    print(f"PASS: GeoJSON Ingestion detected {geo_resp['format']} with {geo_resp['record_count']} records.")

    # D. Invalid file handling (Graceful rejection / error reporting without crashing)
    corrupt_content = "NOT_A_VALID_DATASET_SOMETHING_RANDOM_WITHOUT_COORDINATES\n12345,abcdef"
    files = {"file": ("corrupt.txt", corrupt_content.encode("utf-8"), "text/plain")}
    res = requests.post(f"{BASE_URL}/upload", files=files, data={"dataset_type": "observation"})
    assert res.status_code in [400, 422], f"Expected 400 or 422 rejection, got {res.status_code}"
    err_detail = res.json().get("detail", "")
    assert len(err_detail) > 0
    print(f"PASS: Corrupt file gracefully rejected with HTTP {res.status_code}: {err_detail}")

    return csv_resp["dataset_id"]


def test_comparison_calculation(uploaded_obs_id: str):
    print("\n--- 4. Testing Comparison Calculation Engine (/calculate) ---")

    payload = {
        "model_dataset_id": "demo-ocean",
        "observation_dataset_id": uploaded_obs_id,
        "variable": "temperature",
        "spatial_tolerance_deg": 1.0,
        "depth_tolerance_m": 25.0,
        "time_tolerance_hours": 48.0,
    }

    res = requests.post(f"{BASE_URL}/calculate", json=payload)
    assert res.status_code == 200, f"Calculation failed: {res.text}"
    data = res.json()

    # Verify Spatiotemporal Matching
    assert data["matched"] is True
    assert data["total_matched_count"] > 0
    print(f"PASS: Matched {data['total_matched_count']} observation points with Model.")

    # Verify Residuals Formula: Residual = Model - Obs, Absolute Error = |Residual|
    sample = data["matched_records"][0]
    expected_res = round(sample["model_value"] - sample["obs_value"], 3)
    assert abs(sample["residual"] - expected_res) < 0.01, f"Expected residual {expected_res}, got {sample['residual']}"
    assert abs(sample["absolute_error"] - abs(expected_res)) < 0.01
    print(f"PASS: Residual verification verified: M({sample['model_value']}) - O({sample['obs_value']}) = {sample['residual']} {data['unit']}")

    # Verify Summary Statistics
    metrics = data["metrics"]
    assert "mean_bias" in metrics and "mae" in metrics and "rmse" in metrics
    print(f"PASS: Metrics: MAE={metrics['mae']}, RMSE={metrics['rmse']}, Mean Bias={metrics['mean_bias']}, Correlation={metrics.get('correlation')}")

    # Verify Accuracy Status Classification (🟢/🟡/🔴)
    status = data["status"]
    assert status["status"] in ["GOOD", "MODERATE", "POOR"]
    assert status["is_application_defined"] is True
    print(f"PASS: Accuracy Classification: {status['status']} ({status['label']}) — {status['description']}")

    # Verify Profile & Diverging Residual Series
    assert len(data["profile_series"]) > 0
    assert len(data["residual_series"]) > 0
    print(f"PASS: Profile chart series has {len(data['profile_series'])} points; Residual series has {len(data['residual_series'])} points.")


def test_thresholds_endpoint():
    print("\n--- 5. Testing Configurable Thresholds (/thresholds) ---")
    res = requests.get(f"{BASE_URL}/thresholds")
    assert res.status_code == 200
    data = res.json()
    assert "temperature" in data["thresholds"]
    assert "salinity" in data["thresholds"]
    print(f"PASS: Configurable thresholds verified: Temp good_max={data['thresholds']['temperature']['good_max']} °C")


if __name__ == "__main__":
    print("==================================================================")
    print("SIH 26067 | OceanIQ Model vs Observation Verification Test Suite")
    print("==================================================================")
    test_datasets_catalog()
    test_variables_detection()
    uploaded_id = test_multi_format_ingestion()
    test_comparison_calculation(uploaded_id)
    test_thresholds_endpoint()
    print("\n==================================================================")
    print("[SUCCESS] ALL FULL-SYSTEM COMPARISON TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================================")
