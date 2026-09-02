"""
backend/app/comparison/classifier.py — Accuracy Status Classifier
SIH 26067 | Ocean Intelligence Platform Backend

Classifies model prediction accuracy against observations into standard indicators:
  🟢 GOOD: Model closely matches in-situ observations within tight operational tolerance.
  🟡 MODERATE: Model prediction is within acceptable envelope but shows notable bias.
  🔴 POOR: Model significantly departs from observed ground truth.

All thresholds are application-defined and configurable.
"""

from __future__ import annotations

from typing import Any, Optional

# Default application-defined validation thresholds (MAE / Absolute Error based)
DEFAULT_ACCURACY_THRESHOLDS: dict[str, dict[str, float]] = {
    "temperature": {
        "good_max": 0.50,       # MAE <= 0.50 °C -> GOOD
        "moderate_max": 1.50,   # MAE <= 1.50 °C -> MODERATE, > 1.50 -> POOR
    },
    "salinity": {
        "good_max": 0.20,       # MAE <= 0.20 PSU -> GOOD
        "moderate_max": 0.60,   # MAE <= 0.60 PSU -> MODERATE, > 0.60 -> POOR
    },
    "chlorophyll": {
        "good_max": 0.15,       # MAE <= 0.15 mg/m³ -> GOOD
        "moderate_max": 0.50,   # MAE <= 0.50 mg/m³ -> MODERATE, > 0.50 -> POOR
    },
    "current_u": {
        "good_max": 0.15,       # MAE <= 0.15 m/s -> GOOD
        "moderate_max": 0.35,   # MAE <= 0.35 m/s -> MODERATE, > 0.35 -> POOR
    },
    "current_v": {
        "good_max": 0.15,
        "moderate_max": 0.35,
    },
    "current_w": {
        "good_max": 0.02,
        "moderate_max": 0.05,
    },
    "current_velocity": {
        "good_max": 0.15,
        "moderate_max": 0.35,
    },
}


class AccuracyClassifier:
    """Classifies model-vs-observation errors against configurable thresholds."""

    def __init__(self, custom_thresholds: Optional[dict[str, dict[str, float]]] = None):
        self.thresholds = dict(DEFAULT_ACCURACY_THRESHOLDS)
        if custom_thresholds:
            for var, cfg in custom_thresholds.items():
                self.thresholds[var] = cfg

    def get_thresholds_for_variable(self, variable: str) -> dict[str, float]:
        return self.thresholds.get(variable, {"good_max": 0.5, "moderate_max": 1.5})

    def classify_error(self, error_value: Optional[float], variable: str) -> dict[str, Any]:
        """
        Classifies an individual error or summary MAE/RMSE.
        Returns label ("GOOD" | "MODERATE" | "POOR"), icon ("🟢" | "🟡" | "🔴"),
        color ("emerald" | "amber" | "red"), and descriptive explanation.
        """
        if error_value is None:
            return {
                "status": "UNKNOWN",
                "label": "Unknown",
                "icon": "⚪",
                "color": "slate",
                "threshold_info": "No valid error metrics computed",
            }

        cfg = self.get_thresholds_for_variable(variable)
        good_limit = cfg["good_max"]
        mod_limit = cfg["moderate_max"]

        abs_err = abs(error_value)

        if abs_err <= good_limit:
            return {
                "status": "GOOD",
                "label": "Good Agreement",
                "icon": "🟢",
                "color": "emerald",
                "description": f"Model error ({abs_err:.2f}) is within optimal tolerance (≤ {good_limit:.2f})",
                "thresholds": {"good_max": good_limit, "moderate_max": mod_limit},
                "is_application_defined": True,
            }
        elif abs_err <= mod_limit:
            return {
                "status": "MODERATE",
                "label": "Moderate Discrepancy",
                "icon": "🟡",
                "color": "amber",
                "description": f"Model error ({abs_err:.2f}) is acceptable but noticeable (between {good_limit:.2f} and {mod_limit:.2f})",
                "thresholds": {"good_max": good_limit, "moderate_max": mod_limit},
                "is_application_defined": True,
            }
        else:
            return {
                "status": "POOR",
                "label": "Poor / High Discrepancy",
                "icon": "🔴",
                "color": "red",
                "description": f"Model error ({abs_err:.2f}) exceeds acceptable tolerance (> {mod_limit:.2f})",
                "thresholds": {"good_max": good_limit, "moderate_max": mod_limit},
                "is_application_defined": True,
            }
