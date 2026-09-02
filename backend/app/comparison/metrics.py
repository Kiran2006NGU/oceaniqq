"""
backend/app/comparison/metrics.py — Statistical Validation Metrics
SIH 26067 | Ocean Intelligence Platform Backend

Computes scientific verification statistics between numerical model outputs and observations:
- Signed Mean Bias: (1/N) * sum(M - O)
- Mean Absolute Error (MAE): (1/N) * sum(|M - O|)
- Root Mean Square Error (RMSE): sqrt((1/N) * sum((M - O)^2))
- Pearson Correlation Coefficient (r)
- Min / Max Residual
- Matched Observation Count
"""

from __future__ import annotations

import logging
import math
from typing import Any, Optional
import numpy as np

logger = logging.getLogger(__name__)


def calculate_comparison_metrics(matched_records: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Computes summary validation metrics across a list of matched records.
    Each record must have 'model_value' and 'obs_value' (or 'residual').
    """
    if not matched_records:
        return {
            "matched_count": 0,
            "mean_bias": None,
            "mae": None,
            "rmse": None,
            "correlation": None,
            "min_residual": None,
            "max_residual": None,
            "mean_model_value": None,
            "mean_obs_value": None,
        }

    residuals: list[float] = []
    abs_errors: list[float] = []
    model_vals: list[float] = []
    obs_vals: list[float] = []

    for r in matched_records:
        m = r.get("model_value")
        o = r.get("obs_value")
        if m is not None and o is not None:
            try:
                mf, of = float(m), float(o)
                if not (np.isnan(mf) or np.isnan(of) or np.isinf(mf) or np.isinf(of)):
                    res = mf - of
                    residuals.append(res)
                    abs_errors.append(abs(res))
                    model_vals.append(mf)
                    obs_vals.append(of)
            except (ValueError, TypeError):
                continue

    n = len(residuals)
    if n == 0:
        return {
            "matched_count": 0,
            "mean_bias": None,
            "mae": None,
            "rmse": None,
            "correlation": None,
            "min_residual": None,
            "max_residual": None,
            "mean_model_value": None,
            "mean_obs_value": None,
        }

    mean_bias = float(np.mean(residuals))
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(np.square(residuals))))
    min_res = float(np.min(residuals))
    max_res = float(np.max(residuals))
    mean_model = float(np.mean(model_vals))
    mean_obs = float(np.mean(obs_vals))

    # Pearson correlation coefficient
    corr = None
    if n > 1:
        std_m = np.std(model_vals)
        std_o = np.std(obs_vals)
        if std_m > 1e-8 and std_o > 1e-8:
            corr_val = float(np.corrcoef(model_vals, obs_vals)[0, 1])
            if not np.isnan(corr_val):
                corr = round(corr_val, 3)

    return {
        "matched_count": n,
        "mean_bias": round(mean_bias, 3),
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "correlation": corr,
        "min_residual": round(min_res, 3),
        "max_residual": round(max_res, 3),
        "mean_model_value": round(mean_model, 3),
        "mean_obs_value": round(mean_obs, 3),
    }
