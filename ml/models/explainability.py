"""Model explainability using SHAP (or permutation importance as fallback).

Provides per-prediction feature attributions + global feature importance.
"""
from __future__ import annotations
import logging
import time
from typing import Optional
import numpy as np
import pandas as pd

from django.conf import settings
from ml.models.universal_trainer import load_model_bundle, build_feature_matrix
from ml.datasets.loaders import get_domain_info

log = logging.getLogger(__name__)


def explain_prediction(domain: str, target: str, algorithm: str = "random_forest",
                       input_features: dict = None, sample_index: int = 0) -> dict:
    """Explain a single prediction with SHAP values (or permutation importance fallback).

    Returns:
        {
            "base_value": float,             # mean prediction
            "prediction": float,             # actual prediction
            "contributions": [               # top 10 contributing features
                {"feature": str, "value": float, "shap": float, "direction": "up"/"down"}
            ],
            "method": "shap" / "permutation",
        }
    """
    bundle = load_model_bundle(domain, target, algorithm)
    model = bundle["model"]
    feature_cols = bundle["feature_columns"]
    scaler = bundle.get("scaler")

    # Build input
    if input_features is None:
        X, _ = build_feature_matrix(domain)
        X_input = X.iloc[[sample_index]]
    else:
        X_input = pd.DataFrame([[input_features.get(c, 0.0) for c in feature_cols]], columns=feature_cols)
    if scaler is not None:
        X_input = pd.DataFrame(scaler.transform(X_input), columns=feature_cols)

    prediction = float(model.predict(X_input)[0])

    # Try SHAP first
    try:
        import shap
        if hasattr(model, "predict") and algorithm in ["random_forest", "gradient_boosting", "xgboost", "lightgbm"]:
            # TreeExplainer works for tree-based models
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_input)
            if isinstance(shap_values, list):
                shap_values = shap_values[0]
            shap_arr = shap_values[0] if hasattr(shap_values, "__len__") else np.array([shap_values])
            base_value = float(explainer.expected_value[0] if hasattr(explainer.expected_value, "__len__") else explainer.expected_value)

            contributions = []
            for i, (feat, val, sv) in enumerate(zip(feature_cols, X_input.iloc[0], shap_arr)):
                contributions.append({
                    "feature": str(feat),
                    "value": float(val),
                    "shap": float(sv),
                    "direction": "up" if sv > 0 else "down",
                    "abs_shap": abs(float(sv)),
                })
            contributions.sort(key=lambda x: -x["abs_shap"])
            return {
                "base_value": base_value,
                "prediction": prediction,
                "contributions": contributions[:15],
                "method": "shap",
                "domain": domain,
                "target": target,
                "algorithm": algorithm,
            }
    except ImportError:
        log.info("shap not installed; using permutation importance")
    except Exception as e:
        log.warning("SHAP failed: %s; using permutation", e)

    # Fallback: permutation importance (global, not per-sample)
    return _permutation_importance(domain, target, algorithm, prediction)


def _permutation_importance(domain: str, target: str, algorithm: str, prediction: float) -> dict:
    """Compute global feature importance via permutation."""
    from sklearn.inspection import permutation_importance
    from sklearn.model_selection import train_test_split
    try:
        X, targets = build_feature_matrix(domain)
        y = targets[target]
        mask = ~y.isna()
        X = X[mask].reset_index(drop=True)
        y = y[mask].reset_index(drop=True)

        bundle = load_model_bundle(domain, target, algorithm)
        model = bundle["model"]
        feature_cols = bundle["feature_columns"]
        scaler = bundle.get("scaler")

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        if scaler is not None:
            X_test_in = scaler.transform(X_test)
        else:
            X_test_in = X_test

        result = permutation_importance(model, X_test_in, y_test, n_repeats=5, random_state=42, n_jobs=-1)
        contributions = []
        for i, (feat, imp) in enumerate(zip(feature_cols, result.importances_mean)):
            contributions.append({
                "feature": str(feat),
                "value": 0.0,
                "shap": float(imp),
                "direction": "up" if imp > 0 else "down",
                "abs_shap": abs(float(imp)),
            })
        contributions.sort(key=lambda x: -x["abs_shap"])

        # base_value = mean of training target
        base_value = float(y_train.mean())
        return {
            "base_value": base_value,
            "prediction": prediction,
            "contributions": contributions[:15],
            "method": "permutation",
            "domain": domain,
            "target": target,
            "algorithm": algorithm,
        }
    except Exception as e:
        log.exception("Permutation importance failed")
        return {
            "base_value": 0.0,
            "prediction": prediction,
            "contributions": [],
            "method": "none",
            "error": str(e),
        }


def global_feature_importance(domain: str, target: str, algorithm: str = "random_forest") -> dict:
    """Get global feature importance (from model attribute or SHAP summary)."""
    bundle = load_model_bundle(domain, target, algorithm)
    model = bundle["model"]
    feature_cols = bundle["feature_columns"]

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_) if hasattr(model.coef_, "__len__") else np.abs([model.coef_])
    else:
        return _permutation_importance(domain, target, algorithm, 0.0)

    indices = np.argsort(importances)[::-1][:20]
    return {
        "domain": domain,
        "target": target,
        "algorithm": algorithm,
        "top_features": [
            {"feature": str(feature_cols[i]), "importance": float(importances[i])}
            for i in indices
        ],
        "method": "model_attribute",
    }


if __name__ == "__main__":
    result = explain_prediction("battery", "capacity_mah_g", "random_forest")
    print(f"Method: {result['method']}")
    print(f"Base: {result['base_value']:.2f}, Prediction: {result['prediction']:.2f}")
    for c in result["contributions"][:5]:
        print(f"  {c['feature']:25s} = {c['value']:.3f}  SHAP={c['shap']:+.3f} ({c['direction']})")
