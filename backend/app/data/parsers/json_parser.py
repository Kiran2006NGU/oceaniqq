"""
backend/app/data/parsers/json_parser.py — JSON Ingestion Parser
SIH 26067 | Ocean Intelligence Platform Backend

Ingests ocean observations from JSON files (list of records, GeoJSON FeatureCollections,
nested profile lists, or column dictionaries) into a tabular representation.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any
import pandas as pd

logger = logging.getLogger(__name__)


class JSONParser:
    """Parser for JSON and GeoJSON formatted ocean observation files."""

    def parse_file(self, filepath: Path) -> pd.DataFrame:
        if not filepath.exists():
            raise FileNotFoundError(f"JSON file not found: {filepath}")

        with open(filepath, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        return self.parse_json_object(raw_data)

    def parse_json_object(self, data: Any) -> pd.DataFrame:
        """Converts diverse JSON structures into a flat pandas DataFrame."""
        # 1. Plain list of record dicts
        if isinstance(data, list):
            if not data:
                return pd.DataFrame()
            if isinstance(data[0], dict):
                return pd.json_normalize(data)
            raise ValueError("JSON list must contain objects/records")

        # 2. GeoJSON FeatureCollection
        if isinstance(data, dict) and data.get("type") == "FeatureCollection":
            features = data.get("features", [])
            records = []
            for feat in features:
                props = feat.get("properties", {}) or {}
                geom = feat.get("geometry", {}) or {}
                coords = geom.get("coordinates", [])
                rec = dict(props)
                if len(coords) >= 2:
                    rec.setdefault("longitude", coords[0])
                    rec.setdefault("latitude", coords[1])
                if len(coords) >= 3:
                    rec.setdefault("depth", coords[2])
                records.append(rec)
            return pd.DataFrame(records)

        # 3. Dict with container key (records / data / observations / profiles / items)
        if isinstance(data, dict):
            for key in ["records", "data", "observations", "profiles", "items", "measurements", "points"]:
                if key in data and isinstance(data[key], list):
                    nested = data[key]
                    if nested and isinstance(nested[0], dict):
                        df = pd.json_normalize(nested)
                        # Inherit top-level metadata if present
                        for top_k, top_v in data.items():
                            if top_k != key and isinstance(top_v, (str, int, float, bool)):
                                if top_k not in df.columns:
                                    df[top_k] = top_v
                        return df

            # 4. Column-oriented dictionary {"latitude": [...], "longitude": [...]}
            if all(isinstance(v, list) for v in data.values()):
                return pd.DataFrame(data)

            # 5. Single observation object
            return pd.DataFrame([data])

        raise ValueError("Unsupported JSON structure for ocean data")
