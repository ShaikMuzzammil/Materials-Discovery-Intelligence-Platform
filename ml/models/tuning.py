"""Hyperparameter tuning with Optuna.

Finds optimal hyperparameters for a given (domain, target, algorithm) combo.
Falls back to a grid search if Optuna is not installed.
"""
from __future__ import annotations
import logging
import time
from pathlib import Path
from dataclasses import dataclass, asdict
import pickle
import numpy as np

from django.conf import settings
from ml.datasets.loaders import get_domain_info
from ml.models.universal_trainer import build_feature_matrix, get_model, ALGORITHMS

log = logging.getLogger(__name__)


# Hyperparameter search spaces per algorithm
SEARCH_SPACES = {
    "random_forest": {
        "n_estimators": [100, 200, 300, 500, 800],
        "max_depth": [6, 8, 12, 16, 20, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
        "max_features": ["sqrt", "log2", 0.5, 0.8, 1.0],
    },
    "gradient_boosting": {
        "n_estimators": [100, 200, 300, 500],
        "max_depth": [3, 4, 5, 6, 8],
        "learning_rate": [0.01, 0.05, 0.1, 0.2],
        "subsample": [0.7, 0.8, 0.9, 1.0],
        "min_samples_split": [2, 5, 10],
    },
    "xgboost": {
        "n_estimators": [100, 200, 300, 500, 800],
        "max_depth": [3, 4, 5, 6, 8, 10],
        "learning_rate": [0.01, 0.05, 0.1, 0.2],
        "subsample": [0.7, 0.8, 0.9, 1.0],
        "colsample_bytree": [0.7, 0.8, 0.9, 1.0],
        "gamma": [0, 0.1, 0.2, 0.5],
        "reg_alpha": [0, 0.01, 0.1, 1.0],
        "reg_lambda": [0.1, 1.0, 5.0],
    },
    "lightgbm": {
        "n_estimators": [100, 200, 300, 500, 800],
        "max_depth": [-1, 6, 8, 12, 16],
        "learning_rate": [0.01, 0.05, 0.1, 0.2],
        "num_leaves": [31, 50, 100, 200],
        "subsample": [0.7, 0.8, 0.9, 1.0],
        "colsample_bytree": [0.7, 0.8, 0.9, 1.0],
        "reg_alpha": [0, 0.1, 1.0],
        "reg_lambda": [0, 0.1, 1.0],
    },
    "ridge": {
        "alpha": [0.001, 0.01, 0.1, 1.0, 10.0, 100.0],
    },
    "lasso": {
        "alpha": [0.0001, 0.001, 0.01, 0.1, 1.0],
        "max_iter": [1000, 5000, 10000],
    },
    "mlp": {
        "hidden_layer_sizes": [(64,), (128, 64), (128, 64, 32), (256, 128, 64), (64, 32, 16)],
        "activation": ["relu", "tanh"],
        "alpha": [0.0001, 0.001, 0.01],
        "learning_rate": ["constant", "adaptive"],
        "batch_size": [16, 32, 64],
    },
}


@dataclass
class TuneResult:
    domain: str
    target: str
    algorithm: str
    best_params: dict
    best_score: float
    n_trials: int
    duration_seconds: float
    success: bool = True
    error: str = ""


def _build_model_with_params(algorithm: str, params: dict):
    """Instantiate a model with specific hyperparameters."""
    if algorithm == "random_forest":
        from sklearn.ensemble import RandomForestRegressor
        return RandomForestRegressor(random_state=42, n_jobs=-1, **params)
    elif algorithm == "gradient_boosting":
        from sklearn.ensemble import GradientBoostingRegressor
        return GradientBoostingRegressor(random_state=42, **params)
    elif algorithm == "xgboost":
        try:
            from xgboost import XGBRegressor
            return XGBRegressor(random_state=42, n_jobs=-1, **params)
        except ImportError:
            from sklearn.ensemble import GradientBoostingRegressor
            return GradientBoostingRegressor(random_state=42)
    elif algorithm == "lightgbm":
        try:
            from lightgbm import LGBMRegressor
            return LGBMRegressor(random_state=42, n_jobs=-1, verbose=-1, **params)
        except ImportError:
            from sklearn.ensemble import GradientBoostingRegressor
            return GradientBoostingRegressor(random_state=42)
    elif algorithm == "ridge":
        from sklearn.linear_model import Ridge
        return Ridge(random_state=42, **params)
    elif algorithm == "lasso":
        from sklearn.linear_model import Lasso
        return Lasso(random_state=42, **params)
    elif algorithm == "mlp":
        from sklearn.neural_network import MLPRegressor
        return MLPRegressor(max_iter=500, random_state=42, early_stopping=True, **params)
    elif algorithm == "linear":
        from sklearn.linear_model import LinearRegression
        return LinearRegression()
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")


def tune_with_optuna(domain: str, target: str, algorithm: str, n_trials: int = 30) -> TuneResult:
    """Use Optuna for Bayesian hyperparameter optimization."""
    try:
        import optuna
        from sklearn.model_selection import cross_val_score
        from sklearn.preprocessing import StandardScaler
        optuna.logging.set_verbosity(optuna.logging.WARNING)
    except ImportError:
        log.warning("optuna not installed; using grid search fallback")
        return tune_with_grid_search(domain, target, algorithm)

    started = time.time()
    try:
        X, targets = build_feature_matrix(domain)
        if target not in targets:
            raise ValueError(f"Target '{target}' not in dataset for domain '{domain}'")
        y = targets[target]
        mask = ~y.isna()
        X = X[mask].reset_index(drop=True)
        y = y[mask].reset_index(drop=True)

        space = SEARCH_SPACES.get(algorithm, {})

        def objective(trial):
            params = {}
            for k, v in space.items():
                if isinstance(v, list):
                    if all(isinstance(x, (int, float, type(None))) and not isinstance(x, bool) for x in v):
                        # numeric or None
                        if any(x is None for x in v):
                            # include None as an option
                            choice = trial.suggest_categorical(k, v)
                        else:
                            choice = trial.suggest_categorical(k, v)
                        params[k] = choice
                    elif all(isinstance(x, tuple) for x in v):
                        # tuple-valued options
                        params[k] = trial.suggest_categorical(k, v)
                    else:
                        params[k] = trial.suggest_categorical(k, v)
                else:
                    params[k] = v
            try:
                model = _build_model_with_params(algorithm, params)
                needs_scaling = algorithm in ["ridge", "lasso", "mlp"]
                X_input = StandardScaler().fit_transform(X) if needs_scaling else X
                scores = cross_val_score(model, X_input, y, cv=5, scoring="r2")
                return float(scores.mean())
            except Exception as e:
                log.warning("Trial failed: %s", e)
                return -1.0

        study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=42))
        study.optimize(objective, n_trials=n_trials, show_progress_bar=False)

        return TuneResult(
            domain=domain, target=target, algorithm=algorithm,
            best_params=dict(study.best_params),
            best_score=float(study.best_value),
            n_trials=n_trials,
            duration_seconds=round(time.time() - started, 2),
        )
    except Exception as e:
        log.exception("Optuna tuning failed")
        return TuneResult(
            domain=domain, target=target, algorithm=algorithm,
            best_params={}, best_score=0.0, n_trials=0,
            duration_seconds=round(time.time() - started, 2),
            success=False, error=str(e),
        )


def tune_with_grid_search(domain: str, target: str, algorithm: str) -> TuneResult:
    """Fallback grid search when Optuna isn't available."""
    from sklearn.model_selection import GridSearchCV
    from sklearn.preprocessing import StandardScaler
    started = time.time()
    try:
        X, targets = build_feature_matrix(domain)
        y = targets[target]
        mask = ~y.isna()
        X = X[mask].reset_index(drop=True)
        y = y[mask].reset_index(drop=True)
        space = SEARCH_SPACES.get(algorithm, {})

        needs_scaling = algorithm in ["ridge", "lasso", "mlp"]
        X_input = StandardScaler().fit_transform(X) if needs_scaling else X

        base_model = get_model(algorithm)
        # Use a small grid to keep it fast
        small_grid = {k: v[:3] if len(v) > 3 else v for k, v in space.items()}
        gs = GridSearchCV(base_model, small_grid, cv=5, scoring="r2", n_jobs=-1)
        gs.fit(X_input, y)

        return TuneResult(
            domain=domain, target=target, algorithm=algorithm,
            best_params=gs.best_params_,
            best_score=float(gs.best_score_),
            n_trials=len(gs.cv_results_["params"]),
            duration_seconds=round(time.time() - started, 2),
        )
    except Exception as e:
        log.exception("Grid search failed")
        return TuneResult(
            domain=domain, target=target, algorithm=algorithm,
            best_params={}, best_score=0.0, n_trials=0,
            duration_seconds=round(time.time() - started, 2),
            success=False, error=str(e),
        )


def tune_model(domain: str, target: str, algorithm: str = "random_forest",
               n_trials: int = 30, use_optuna: bool = True) -> TuneResult:
    """Tune hyperparameters for a single (domain, target, algorithm) combo."""
    if use_optuna:
        return tune_with_optuna(domain, target, algorithm, n_trials)
    return tune_with_grid_search(domain, target, algorithm)


if __name__ == "__main__":
    # Smoke test
    r = tune_model("battery", "capacity_mah_g", "random_forest", n_trials=5)
    print(f"Best params: {r.best_params}")
    print(f"Best R²: {r.best_score:.3f}")
