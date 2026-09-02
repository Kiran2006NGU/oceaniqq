"""
backend/app/data/parsers/text_parser.py — ASCII/TXT Ocean Data Parser
SIH 26067 | Ocean Intelligence Platform Backend

Specialized parser for scientific ASCII files, fixed-width CTD profiles,
and whitespace/custom-delimited ocean station measurements.
"""

from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Optional
import pandas as pd

from app.data.parsers.csv_parser import DelimitedTextParser

logger = logging.getLogger(__name__)


class TextOceanParser:
    """Parser for whitespace-delimited, fixed-width or custom ASCII ocean text files."""

    def __init__(self):
        self.delimited_parser = DelimitedTextParser()

    def parse_file(self, filepath: Path) -> pd.DataFrame:
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")

        # Try standard delimited parsing first
        try:
            df = self.delimited_parser.parse_file(filepath)
            if len(df.columns) >= 2 and len(df) > 0:
                return df
        except Exception:
            pass

        # Fallback: line-by-line inspection to find header and data rows
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()

        data_lines: list[str] = []
        header_candidate: Optional[str] = None

        for line in lines:
            trimmed = line.strip()
            if not trimmed:
                continue
            if trimmed.startswith(("#", "//", "%", "*")):
                # Possible header inside comments e.g. # depth, temp, sal
                clean_comment = trimmed.lstrip("#/%* ").strip()
                if any(w in clean_comment.lower() for w in ["lat", "depth", "temp", "sal", "pressure"]):
                    header_candidate = clean_comment
                continue

            # First non-comment line could be header if it has letters
            if header_candidate is None and any(c.isalpha() for c in trimmed):
                header_candidate = trimmed
                continue

            data_lines.append(trimmed)

        if not data_lines:
            raise ValueError("No numeric data rows found in text file")

        content = ""
        if header_candidate:
            content += header_candidate + "\n"
        content += "\n".join(data_lines)

        return self.delimited_parser.parse_text_stream(content.encode("utf-8"))
