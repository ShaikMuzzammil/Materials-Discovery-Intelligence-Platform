"""Universal ML model trainer for all 7 domains.

Supports: random_forest, gradient_boosting, xgboost, lightgbm, linear, ridge, lasso, mlp
"""
from __future__ import annotations
import json
import logging
import pickle
import time
from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd
from dataclasses import dataclass, asdict

from django.conf import settings
from ml.datasets.loaders import load_domain_dataset, get_domain_info, DOMAIN_REGISTRY
from ml.features.featurizers import featurize

log = logging.getLogger(__name__)

# Supported algorithms
ALGORITHMS = ["random_forest", "gradient_boosting", "xgboost", "lightgbm", "linear", "ridge", "lasso", "mlp"]


@dataclass
class TrainResult:
    domain: str
    target: str
    algorithm: str
    metrics: dict
    n_samples: int
    n_features: int
    duration_seconds: float
    model_path: str
    success: bool = True
    error: str = ""


def build_feature_matrix(domain: str) -> tuple[pd.DataFrame, dict[str, pd.Series]]:
    """Load dataset and build (X, targets) for a given domain."""
    df = load_domain_dataset(domain)
    if df.empty:
        raise ValueError(f"No dataset available for domain '{domain}'")

    domain_info = get_domain_info(domain)
    feature_columns = domain_info["feature_columns"]
    targets = domain_info["targets"]

    # Build feature matrix
    feature_rows = []
    for _, row in df.iterrows():
        kwargs = {}
        for col in feature_columns:
            if col in df.columns:
                # Convert NaN/None to safe defaults
                val = row[col]
                if pd.isna(val):
                    if col == "molecular_weight":
                        val = 100000.0
                    elif col == "particle_size_nm":
                        val = 1000.0
                    elif "temp" in col:
                        val = 25.0
                    else:
                        val = ""
                kwargs[col] = val
        try:
            feats = featurize(domain, **kwargs)
            feature_rows.append(feats)
        except Exception as e:
            log.warning("Failed to featurize row %s: %s", kwargs, e)
            feature_rows.append({})

    X = pd.DataFrame(feature_rows).fillna(0.0)
    # Ensure all numeric
    for c in X.columns:
        X[c] = pd.to_numeric(X[c], errors="coerce").fillna(0.0)

    target_dict = {}
    for t in targets:
        if t in df.columns:
            target_dict[t] = pd.to_numeric(df[t], errors="coerce").fillna(df[t].median(numeric_only=True) or 0)

    return X, target_dict


def get_model(algorithm: str, target: str = None):
    """Instantiate a model for a given algorithm."""
    if algorithm == "random_forest":
        from sklearn.ensemble import RandomForestRegressor
        return RandomForestRegressor(n_estimators=300, max_depth=12, random_state=42, n_jobs=-1)
    elif algorithm == "gradient_boosting":
        from sklearn.ensemble import GradientBoostingRegressor
        return GradientBoostingRegressor(n_estimators=300, max_depth=4, learning_rate=0.05, random_state=42)
    elif algorithm == "xgboost":
        try:
            from xgboost import XGBRegressor
            return XGBRegressor(n_estimators=400, max_depth=6, learning_rate=0.05, random_state=42, n_jobs=-1)
        except ImportError:
            log.warning("xgboost not installed; using gradient_boosting")
            from sklearn.ensemble import GradientBoostingRegressor
            return GradientBoostingRegressor(n_estimators=300, max_depth=4, learning_rate=0.05, random_state=42)
    elif algorithm == "lightgbm":
        try:
            from lightgbm import LGBMRegressor
            return LGBMRegressor(n_estimators=400, max_depth=6, learning_rate=0.05, random_state=42, n_jobs=-1, verbose=-1)
        except ImportError:
            log.warning("lightgbm not installed; using gradient_boosting")
            from sklearn.ensemble import GradientBoostingRegressor
            return GradientBoostingRegressor(n_estimators=300, max_depth=4, learning_rate=0.05, random_state=42)
    elif algorithm == "linear":
        from sklearn.linear_model import LinearRegression
        return LinearRegression()
    elif algorithm == "ridge":
        from sklearn.linear_model import Ridge
        return Ridge(alpha=1.0, random_state=42)
    elif algorithm == "lasso":
        from sklearn.linear_model import Lasso
        return Lasso(alpha=0.1, random_state=42, max_iter=5000)
    elif algorithm == "mlp":
        from sklearn.neural_network import MLPRegressor
        return MLPRegressor(hidden_layer_sizes=(128, 64, 32), activation="relu",
                           solver="adam", alpha=0.001, batch_size=32,
                           learning_rate="adaptive", max_iter=500,
                           random_state=42, early_stopping=True)
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}. Available: {ALGORITHMS}")


def train_model(domain: str, target: str, algorithm: str = "random_forest",
                save: bool = True) -> TrainResult:
    """Train a single model for one (domain, target) pair."""
    started = time.time()
    try:
        from sklearn.model_selection import train_test_split, cross_val_score
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
        from sklearn.preprocessing import StandardScaler

        X, targets = build_feature_matrix(domain)
        if target not in targets:
            raise ValueError(f"Target '{target}' not in dataset for domain '{domain}'")

        y = targets[target]
        # Drop rows with NaN target
        mask = ~y.isna()
        X = X[mask].reset_index(drop=True)
        y = y[mask].reset_index(drop=True)

        if len(X) < 5:
            raise ValueError(f"Too few samples ({len(X)}) to train")

        # For algorithms that need scaling
        needs_scaling = algorithm in ["ridge", "lasso", "mlp", "linear"]
        if needs_scaling:
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
        else:
            scaler = None
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

        model = get_model(algorithm, target)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        metrics = {
            "rmse": float(np.sqrt(mean_squared_error(y_test, preds))),
            "mae": float(mean_absolute_error(y_test, preds)),
            "r2": float(r2_score(y_test, preds)),
        }
        try:
            cv_scores = cross_val_score(model, X_scaled if needs_scaling else X, y, cv=5, scoring="r2")
            metrics["cv_r2_mean"] = float(cv_scores.mean())
            metrics["cv_r2_std"] = float(cv_scores.std())
        except Exception:
            metrics["cv_r2_mean"] = metrics["r2"]
            metrics["cv_r2_std"] = 0.0

        # Feature importance (for tree-based models)
        feature_importance = {}
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            top_indices = np.argsort(importances)[::-1][:15]
            feature_importance = {
                str(X.columns[i]): float(importances[i])
                for i in top_indices
            }
        elif hasattr(model, "coef_"):
            coefs = np.abs(model.coef_) if hasattr(model.coef_, "__len__") else np.abs([model.coef_])
            top_indices = np.argsort(coefs)[::-1][:15]
            feature_importance = {
                str(X.columns[i]): float(coefs[i])
                for i in top_indices
            }
        metrics["top_features"] = feature_importance

        duration = time.time() - started
        model_path = ""
        if save:
            save_dir = Path(settings.ML_SETTINGS["MODELS_DIR"]) / domain
            save_dir.mkdir(parents=True, exist_ok=True)
            model_path = str(save_dir / f"{target}_{algorithm}.pkl")
            with open(model_path, "wb") as f:
                pickle.dump({
                    "model": model,
                    "scaler": scaler,
                    "feature_columns": list(X.columns),
                    "target": target,
                    "algorithm": algorithm,
                    "domain": domain,
                    "metrics": metrics,
                    "trained_on": f"{len(X)} samples × {X.shape[1]} features",
                    "trained_at": time.time(),
                }, f)
            log.info("Saved %s/%s/%s model → %s", domain, target, algorithm, model_path)

        return TrainResult(
            domain=domain, target=target, algorithm=algorithm,
            metrics=metrics, n_samples=len(X), n_features=X.shape[1],
            duration_seconds=round(duration, 2),
            model_path=model_path, success=True,
        )
    except Exception as e:
        log.exception("Training failed for %s/%s/%s", domain, target, algorithm)
        return TrainResult(
            domain=domain, target=target, algorithm=algorithm,
            metrics={}, n_samples=0, n_features=0,
            duration_seconds=round(time.time() - started, 2),
            model_path="", success=False, error=str(e),
        )


def load_model_bundle(domain: str, target: str, algorithm: str = "random_forest") -> dict:
    """Load a trained model bundle from disk (train on-the-fly if missing)."""
    model_path = Path(settings.ML_SETTINGS["MODELS_DIR"]) / domain / f"{target}_{algorithm}.pkl"
    if not model_path.exists():
        log.info("Model %s/%s/%s not found – training on the fly", domain, target, algorithm)
        train_model(domain, target, algorithm, save=True)
    with open(model_path, "rb") as f:
        return pickle.load(f)


def predict(domain: str, target: str, **input_kwargs) -> dict:
    """Run a prediction for a given (domain, target) pair."""
    algorithm = input_kwargs.pop("algorithm", "random_forest")
    bundle = load_model_bundle(domain, target, algorithm)
    model = bundle["model"]
    scaler = bundle.get("scaler")
    feature_cols = bundle["feature_columns"]

    feats = featurize(domain, **input_kwargs)
    X = pd.DataFrame([[feats.get(c, 0.0) for c in feature_cols]], columns=feature_cols)
    if scaler is not None:
        X = scaler.transform(X)
    pred = float(model.predict(X)[0])

    rmse = bundle.get("metrics", {}).get("rmse", 0.0)
    return {
        "domain": domain,
        "target": target,
        "algorithm": algorithm,
        "prediction": round(pred, 4),
        "confidence_low": round(pred - 1.96 * rmse, 4),
        "confidence_high": round(pred + 1.96 * rmse, 4),
        "metrics": bundle.get("metrics", {}),
        "input": input_kwargs,
    }


def train_all_models_for_domain(domain: str, algorithms: list[str] = None) -> list[TrainResult]:
    """Train every (target, algorithm) combo for one domain."""
    if algorithms is None:
        algorithms = ["random_forest"]  # default
    domain_info = get_domain_info(domain)
    targets = domain_info["targets"]
    results = []
    for target in targets:
        for algo in algorithms:
            r = train_model(domain, target, algo, save=True)
            results.append(r)
    return results


def train_all_models(algorithms: list[str] = None) -> dict[str, list[TrainResult]]:
    """Train every (domain, target, algorithm) combo. Returns dict keyed by domain."""
    if algorithms is None:
        algorithms = ["random_forest"]
    results = {}
    for domain in DOMAIN_REGISTRY:
        log.info("=== Training models for domain: %s ===", domain)
        results[domain] = train_all_models_for_domain(domain, algorithms)
    return results


def list_trained_models() -> list[dict]:
    """List all trained model bundles on disk."""
    models_dir = Path(settings.ML_SETTINGS["MODELS_DIR"])
    out = []
    if not models_dir.exists():
        return out
    for pkl in models_dir.rglob("*.pkl"):
        try:
            with open(pkl, "rb") as f:
                bundle = pickle.load(f)
            out.append({
                "domain": bundle.get("domain", ""),
                "target": bundle.get("target", ""),
                "algorithm": bundle.get("algorithm", ""),
                "metrics": bundle.get("metrics", {}),
                "trained_on": bundle.get("trained_on", ""),
                "path": str(pkl),
                "size_kb": round(pkl.stat().st_size / 1024, 1),
            })
        except Exception as e:
            log.warning("Failed to load %s: %s", pkl, e)
    return out


if __name__ == "__main__":
    # CLI: python -m ml.models.universal_trainer
    results = train_all_models()
    for domain, domain_results in results.items():
        print(f"\n=== {domain} ===")
        for r in domain_results:
            status = "✓" if r.success else "✗"
            r2 = r.metrics.get("r2", "N/A")
            print(f"  {status} {r.target:30s} ({r.algorithm:20s}) R²={r2}")
