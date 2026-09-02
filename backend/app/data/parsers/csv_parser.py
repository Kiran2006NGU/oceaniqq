"""
backend/app/data/parsers/csv_parser.py — Delimited Text (CSV/TSV/TXT) Parser
SIH 26067 | Ocean Intelligence Platform Backend

Robust parser for tabular ocean observations (e.g. Argo float lists, Glider transects,
CTD station profiles) with automatic delimiter detection and comment stripping.
"""

from __future__ import annotations

import csv
import io
import logging
from pathlib import Path
from typing import Any, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Common oceanographic missing value markers
MISSING_VALUE_MARKERS = [
    "-9999",
    "-9999.0",
    "-999.0",
    "-999",
    "9999",
    "9999.0",
    "NaN",
    "NAN",
    "nan",
    "NA",
    "na",
    "null",
    "NULL",
    "None",
    "none",
    "ND",
    "",
]


class DelimitedTextParser:
    """Parser for CSV, TSV, and delimited text files with sniffing."""

    def detect_delimiter(self, sample_text: str) -> str:
        """Sniff delimiter from sample text, falling back to comma."""
        try:
            # Filter out empty or pure comment lines from the sample
            valid_lines = [
                line for line in sample_text.splitlines()
                if line.strip() and not line.strip().startswith(("#", "//", "%", "*"))
            ]
            sample = "\n".join(valid_lines[:20])
            if not sample:
                return ","
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample, delimiters=",\t;| ")
            return dialect.delimiter
        except Exception:
            # Fallback heuristic
            if "\t" in sample_text and sample_text.count("\t") > sample_text.count(","):
                return "\t"
            if ";" in sample_text and sample_text.count(";") > sample_text.count(","):
                return ";"
            if "|" in sample_text:
                return "|"
            return ","

    def parse_file(self, filepath: Path, custom_delimiter: Optional[str] = None) -> pd.DataFrame:
        """
        Parse a delimited file into a pandas DataFrame.
        Handles leading comments, variable delimiters, and missing values.
        """
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")

        # Read first few KB to sniff delimiter and comments
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            sample = "".join(f.readline() for _ in range(50))

        delimiter = custom_delimiter or self.detect_delimiter(sample)
        logger.info("Parsing delimited file %s with delimiter '%s'", filepath.name, delimiter if delimiter != '\t' else '\\t')

        # Read with pandas
        try:
            df = pd.read_csv(
                filepath,
                sep=delimiter if delimiter != " " else r"\s+",
                comment="#",
                na_values=MISSING_VALUE_MARKERS,
                skip_blank_lines=True,
                on_bad_lines="skip",
                encoding="utf-8",
                engine="python",
            )
        except Exception as exc:
            # Try fallback without comments
            df = pd.read_csv(
                filepath,
                sep=r"[\t,;|\s]+",
                na_values=MISSING_VALUE_MARKERS,
                skip_blank_lines=True,
                on_bad_lines="skip",
                encoding="utf-8",
                engine="python",
            )

        # Clean column names (strip whitespace and lower/preserve)
        df.columns = [str(c).strip() for c in df.columns]
        return df

    def parse_text_stream(self, content_bytes: bytes, filename: str = "upload.csv") -> pd.DataFrame:
        """Parse raw bytes/string stream."""
        text = content_bytes.decode("utf-8", errors="replace")
        delimiter = self.detect_delimiter(text[:4096])

        buffer = io.StringIO(text)
        try:
            df = pd.read_csv(
                buffer,
                sep=delimiter if delimiter != " " else r"\s+",
                comment="#",
                na_values=MISSING_VALUE_MARKERS,
                skip_blank_lines=True,
                on_bad_lines="skip",
                engine="python",
            )
        except Exception:
            buffer.seek(0)
            df = pd.read_csv(
                buffer,
                sep=r"[\t,;|\s]+",
                na_values=MISSING_VALUE_MARKERS,
                skip_blank_lines=True,
                on_bad_lines="skip",
                engine="python",
            )

        df.columns = [str(c).strip() for c in df.columns]
        return df
