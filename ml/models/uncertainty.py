"""Uncertainty quantification for ML predictions.

Methods:
- Conformal prediction (distribution-free intervals)
- Bootstrap ensemble (multiple RF models with different seeds)
- Quantile regression (for gradient boosting)
"""
from __future__ import annotations
import logging
import time
import pickle
from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd

from django.conf import settings
from ml.models.universal_trainer import build_feature_matrix, get_model, load_model_bundle
from ml.features.featurizers import featurize

log = logging.getLogger(__name__)


def conformal_prediction_interval(domain: str, target: str, algorithm: str = "random_forest",
                                  confidence: float = 0.9, **input_kwargs) -> dict:
    """Compute a distribution-free prediction interval using conformal prediction.

    Algorithm:
    1. Split data into train + calibration
    2. Train model on train split
    3. On calibration set, compute |y_true - y_pred| for each sample
    4. Take the (1-alpha) quantile of these absolute residuals -> q_alpha
    5. For new prediction: interval = [pred - q_alpha, pred + q_alpha]
    """
    from sklearn.model_selection import train_test_split
    try:
        X, targets = build_feature_matrix(domain)
        y = targets[target]
        mask = ~y.isna()
        X = X[mask].reset_index(drop=True)
        y = y[mask].reset_index(drop=True)

        bundle = load_model_bundle(domain, target, algorithm)
        feature_cols = bundle["feature_columns"]
        scaler = bundle.get("scaler")

        # Split: 80% train (already used), 20% calibration
        X_train, X_calib, y_train, y_calib = train_test_split(X, y, test_size=0.2, random_state=42)
        if scaler is not None:
            X_calib_in = scaler.transform(X_calib)
        else:
            X_calib_in = X_calib

        model = bundle["model"]
        calib_preds = model.predict(X_calib_in)
        calib_residuals = np.abs(y_calib.values - calib_preds)
        alpha = 1 - confidence
        q_alpha = float(np.quantile(calib_residuals, 1 - alpha))

        # Now predict on the input
        feats = featurize(domain, **input_kwargs)
        X_input = pd.DataFrame([[feats.get(c, 0.0) for c in feature_cols]], columns=feature_cols)
        if scaler is not None:
            X_input = pd.DataFrame(scaler.transform(X_input), columns=feature_cols)
        pred = float(model.predict(X_input)[0])

        return {
            "domain": domain, "target": target, "algorithm": algorithm,
            "prediction": round(pred, 4),
            "lower": round(pred - q_alpha, 4),
            "upper": round(pred + q_alpha, 4),
            "calibration_size": len(X_calib),
            "q_alpha": round(q_alpha, 4),
            "confidence": confidence,
            "method": "conformal",
        }
    except Exception as e:
        log.exception("Conformal prediction failed")
        return {"error": str(e), "method": "conformal"}


def bootstrap_ensemble_interval(domain: str, target: str, algorithm: str = "random_forest",
                                 n_models: int = 10, confidence: float = 0.9,
                                 **input_kwargs) -> dict:
    """Train n_models with different random seeds and use the ensemble for uncertainty."""
    from sklearn.model_selection import train_test_split
    try:
        X, targets = build_feature_matrix(domain)
        y = targets[target]
        mask = ~y.isna()
        X = X[mask].reset_index(drop=True)
        y = y[mask].reset_index(drop=True)

        bundle = load_model_bundle(domain, target, algorithm)
        feature_cols = bundle["feature_columns"]
        scaler = bundle.get("scaler")

        feats = featurize(domain, **input_kwargs)
        X_input = pd.DataFrame([[feats.get(c, 0.0) for c in feature_cols]], columns=feature_cols)
        if scaler is not None:
            X_input = pd.DataFrame(scaler.transform(X_input), columns=feature_cols)

        # Make predictions with N models trained on bootstrap samples
        predictions = []
        for i in range(n_models):
            try:
                # Bootstrap sample
                indices = np.random.RandomState(seed=i).choice(len(X), size=len(X), replace=True)
                X_boot = X.iloc[indices].reset_index(drop=True)
                y_boot = y.iloc[indices].reset_index(drop=True)
                if scaler is not None:
                    X_boot_in = scaler.transform(X_boot)
                else:
                    X_boot_in = X_boot
                model_i = get_model(algorithm)
                # Set random_state if possible
                if hasattr(model_i, "random_state"):
                    model_i.random_state = i
                model_i.fit(X_boot_in, y_boot)
                predictions.append(float(model_i.predict(X_input)[0]))
            except Exception as e:
                log.warning("Bootstrap model %d failed: %s", i, e)

        if not predictions:
            return {"error": "All bootstrap models failed"}

        alpha = 1 - confidence
        lower = float(np.quantile(predictions, alpha / 2))
        upper = float(np.quantile(predictions, 1 - alpha / 2))
        mean_pred = float(np.mean(predictions))
        std_pred = float(np.std(predictions))

        return {
            "domain": domain, "target": target, "algorithm": algorithm,
            "prediction": round(mean_pred, 4),
            "lower": round(lower, 4),
            "upper": round(upper, 4),
            "std": round(std_pred, 4),
            "n_models": len(predictions),
            "all_predictions": [round(p, 2) for p in predictions],
            "confidence": confidence,
            "method": "bootstrap",
        }
    except Exception as e:
        log.exception("Bootstrap ensemble failed")
        return {"error": str(e), "method": "bootstrap"}


def quantile_regression_interval(domain: str, target: str, **input_kwargs) -> dict:
    """Use quantile gradient boosting to get prediction intervals."""
    try:
        from sklearn.ensemble import GradientBoostingRegressor
        X, targets = build_feature_matrix(domain)
        y = targets[target]
        mask = ~y.isna()
        X = X[mask].reset_index(drop=True)
        y = y[mask].reset_index(drop=True)

        bundle = load_model_bundle(domain, target, "gradient_boosting")
        feature_cols = bundle["feature_columns"]

        feats = featurize(domain, **input_kwargs)
        X_input = pd.DataFrame([[feats.get(c, 0.0) for c in feature_cols]], columns=feature_cols)

        # Train lower (5th percentile) and upper (95th percentile) quantile models
        lower_model = GradientBoostingRegressor(loss="quantile", alpha=0.05,
                                                n_estimators=200, max_depth=4, random_state=42)
        upper_model = GradientBoostingRegressor(loss="quantile", alpha=0.95,
                                                n_estimators=200, max_depth=4, random_state=42)
        median_model = GradientBoostingRegressor(loss="quantile", alpha=0.5,
                                                 n_estimators=200, max_depth=4, random_state=42)
        lower_model.fit(X, y)
        upper_model.fit(X, y)
        median_model.fit(X, y)

        lower = float(lower_model.predict(X_input)[0])
        upper = float(upper_model.predict(X_input)[0])
        median = float(median_model.predict(X_input)[0])

        return {
            "domain": domain, "target": target, "algorithm": "quantile_gb",
            "prediction": round(median, 4),
            "lower": round(lower, 4),
            "upper": round(upper, 4),
            "confidence": 0.90,
            "method": "quantile_regression",
        }
    except Exception as e:
        log.exception("Quantile regression failed")
        return {"error": str(e), "method": "quantile_regression"}


def compute_uncertainty(domain: str, target: str, method: str = "conformal",
                        algorithm: str = "random_forest", **input_kwargs) -> dict:
    """Dispatch to the right uncertainty method."""
    if method == "conformal":
        return conformal_prediction_interval(domain, target, algorithm, **input_kwargs)
    elif method == "bootstrap":
        return bootstrap_ensemble_interval(domain, target, algorithm, **input_kwargs)
    elif method == "quantile":
        return quantile_regression_interval(domain, target, **input_kwargs)
    else:
        raise ValueError(f"Unknown method: {method}. Available: conformal, bootstrap, quantile")


if __name__ == "__main__":
    r = conformal_prediction_interval("battery", "capacity_mah_g", "random_forest",
                                      formula="LiFePO4", synthesis_method="sol-gel", synthesis_temp_c=700)
    print(r)
