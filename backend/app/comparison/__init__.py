"""
backend/app/comparison/__init__.py — Comparison Engine Package
SIH 26067 | Ocean Intelligence Platform Backend
"""

from app.comparison.classifier import AccuracyClassifier, DEFAULT_ACCURACY_THRESHOLDS
from app.comparison.matcher import ModelObservationMatcher
from app.comparison.metrics import calculate_comparison_metrics

__all__ = [
    "AccuracyClassifier",
    "DEFAULT_ACCURACY_THRESHOLDS",
    "ModelObservationMatcher",
    "calculate_comparison_metrics",
]
