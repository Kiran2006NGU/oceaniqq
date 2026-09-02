"""
backend/scripts/test_comparison.py — Automated Backend Test Suite
SIH 26067 | Ocean Intelligence Platform Backend
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
import numpy as np
from app.data.parsers.csv_parser import DelimitedTextParser
from app.data.parsers.json_parser import JSONParser
from app.data.parsers.netcdf_parser import NetCDFParser
from app.data.parsers.text_parser import TextOceanParser
from app.data.normalizer import OceanDataNormalizer, convert_value_to_canonical, check_unit_compatibility
from app.data.validator import OceanDataValidator
from app.comparison.matcher import ModelObservationMatcher
from app.comparison.metrics import calculate_comparison_metrics
from app.comparison.classifier import AccuracyClassifier
from app.config import DEMO_DATA_DIR


def test_unit_conversions():
    print("Testing unit conversions...")
    # Kelvin -> Celsius
    assert convert_value_to_canonical(300.15, "K", "temperature") == 27.0
    # Fahrenheit -> Celsius
    assert convert_value_to_canonical(86.0, "F", "temperature") == 30.0
    # cm/s -> m/s
    assert convert_value_to_canonical(50.0, "cm/s", "current_velocity") == 0.5
    # knots -> m/s
    assert round(convert_value_to_canonical(10.0, "knots", "current_velocity"), 2) == 5.14
    # Compatibility
    compat, msg = check_unit_compatibility("°C", "K", "temperature")
    assert compat is True
    compat, msg = check_unit_compatibility("°C", "PSU", "temperature")
    assert compat is False
    print("[PASS] Unit conversions passed")


def test_csv_parser_and_normalizer():
    print("Testing CSV parser and normalizer...")
    csv_content = b"""# CTD Station Sample
lat,lon,depth,temp,salinity,platform
12.5,80.2,5.0,28.5,34.2,ARGO_TEST_01
12.5,80.2,25.0,27.8,34.5,ARGO_TEST_01
12.5,80.2,50.0,24.1,34.9,ARGO_TEST_01
12.5,80.2,100.0,18.5,35.2,ARGO_TEST_01
"""
    parser = DelimitedTextParser()
    df = parser.parse_text_stream(csv_content)
    assert len(df) == 4
    assert "temp" in df.columns

    normalizer = OceanDataNormalizer()
    norm_df, meta = normalizer.normalize_dataframe(df, "Test CSV")
    assert "temperature" in norm_df.columns
    assert "salinity" in norm_df.columns
    assert "latitude" in norm_df.columns
    assert "depth" in norm_df.columns
    assert norm_df.loc[0, "temperature"] == 28.5
    print("[PASS] CSV parser and normalizer passed")


def test_json_parser():
    print("Testing JSON parser...")
    geojson_data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [85.5, 14.2, 10.0]},
                "properties": {"temperature": 29.1, "salinity": 33.4, "platform_id": "WMO_99999"}
            }
        ]
    }
    parser = JSONParser()
    df = parser.parse_json_object(geojson_data)
    assert len(df) == 1
    assert df.loc[0, "longitude"] == 85.5
    assert df.loc[0, "latitude"] == 14.2
    assert df.loc[0, "temperature"] == 29.1
    print("[PASS] JSON parser passed")


def test_netcdf_parser():
    print("Testing NetCDF parser with demo NetCDF...")
    demo_file = DEMO_DATA_DIR / "demo_ocean.nc"
    if demo_file.exists():
        parser = NetCDFParser()
        meta = parser.parse_file(demo_file)
        assert meta["format"] == "NetCDF"
        assert "temperature" in [v["canonical_name"] for v in meta["variables"]]
        print("[PASS] NetCDF parser passed with demo_ocean.nc")


def test_matcher_and_metrics():
    print("Testing Matcher, Metrics, and Classifier...")
    # Model: 28.5, Obs: 29.0 -> Residual = 28.5 - 29.0 = -0.5, Abs = 0.5
    model_df = pd.DataFrame([
        {"latitude": 10.0, "longitude": 80.0, "depth": 0.0, "temperature": 28.5},
        {"latitude": 10.0, "longitude": 80.0, "depth": 50.0, "temperature": 25.0},
        {"latitude": 10.0, "longitude": 80.0, "depth": 100.0, "temperature": 20.0},
    ])
    obs_df = pd.DataFrame([
        {"latitude": 10.01, "longitude": 80.01, "depth": 0.0, "temperature": 29.0, "platform_id": "FLOAT-01"},
        {"latitude": 10.01, "longitude": 80.01, "depth": 50.0, "temperature": 25.2, "platform_id": "FLOAT-01"},
        {"latitude": 10.01, "longitude": 80.01, "depth": 100.0, "temperature": 20.6, "platform_id": "FLOAT-01"},
    ])

    matcher = ModelObservationMatcher()
    matched = matcher.match_tabular_datasets(model_df, obs_df, "temperature", spatial_tolerance_deg=0.5, depth_tolerance_m=10.0)
    assert len(matched) == 3

    # Check first record: Residual = Model - Obs = 28.5 - 29.0 = -0.5
    assert matched[0]["residual"] == -0.5
    assert matched[0]["absolute_error"] == 0.5

    # Compute metrics
    metrics = calculate_comparison_metrics(matched)
    # Residuals: -0.5, -0.2, -0.6 -> Mean Bias = -0.433
    assert metrics["matched_count"] == 3
    assert round(metrics["mean_bias"], 2) == -0.43
    assert round(metrics["mae"], 2) == 0.43
    assert round(metrics["rmse"], 2) == 0.47

    # Classifier
    classifier = AccuracyClassifier()
    status = classifier.classify_error(metrics["mae"], "temperature")
    # MAE = 0.43 <= 0.50 -> status should be GOOD
    assert status["status"] == "GOOD"
    assert status["icon"] == "GOOD" or "GOOD" in status["status"]
    print("[PASS] Matcher, Metrics, and Classifier passed successfully!")


if __name__ == "__main__":
    test_unit_conversions()
    test_csv_parser_and_normalizer()
    test_json_parser()
    test_netcdf_parser()
    test_matcher_and_metrics()
    print("\nALL BACKEND COMPARISON TESTS PASSED PERFECTLY!")
