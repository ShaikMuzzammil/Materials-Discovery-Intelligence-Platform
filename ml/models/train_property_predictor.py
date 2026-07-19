"""Battery material property predictor.

Trains a regressor to predict target properties (capacity, cycle life, voltage,
energy density, safety score, cost) from composition + process features.

Supported algorithms:
- Random Forest (default)
- XGBoost (if installed)
- Gradient Boosting (sklearn)
- Linear Regression (baseline)

Features used:
- Element fractions (Li, Co, Mn, Ni, Fe, P, O, S, C, Na, K, Mg, Ca, Al, Si, Ti, V, Cr, Cu, Zn, Mo, W)
- Composition stats (mean atomic number, std atomic number, n_elements)
- Process flags (sol-gel, hydrothermal, solid-state, ball milling, ...)
- Synthesis temperature (°C, normalized)
"""
from __future__ import annotations
import json
import logging
import pickle
from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd
from dataclasses import dataclass, asdict

from django.conf import settings

log = logging.getLogger(__name__)

# Common elements in battery materials
ELEMENTS = [
    "Li", "Na", "K", "Mg", "Ca", "Al", "Si", "Ti", "V", "Cr", "Mn", "Fe",
    "Co", "Ni", "Cu", "Zn", "Mo", "W", "Sn", "Pb", "C", "N", "P", "S", "O", "F", "Cl",
]

SYNTHESIS_METHODS = [
    "sol-gel", "hydrothermal", "solid-state", "ball-milling",
    "co-precipitation", "spray-drying", "electrospinning", "combustion",
]

ATOMIC_NUMBERS = {
    "H": 1, "Li": 3, "Be": 4, "B": 5, "C": 6, "N": 7, "O": 8, "F": 9, "Na": 11,
    "Mg": 12, "Al": 13, "Si": 14, "P": 15, "S": 16, "Cl": 17, "K": 19, "Ca": 20,
    "Ti": 22, "V": 23, "Cr": 24, "Mn": 25, "Fe": 26, "Co": 27, "Ni": 28, "Cu": 29,
    "Zn": 30, "Mo": 42, "Sn": 50, "W": 74, "Pb": 82,
}


@dataclass
class CompositionFeatures:
    """Feature dict for a single material composition."""
    element_fractions: dict
    n_elements: int
    mean_atomic_number: float
    std_atomic_number: float
    synthesis_method: str
    synthesis_temperature_c: float


def parse_formula(formula: str) -> dict[str, float]:
    """Very small chemical-formula parser. Returns element -> count.

    Examples:
        'LiFePO4' -> {'Li':1, 'Fe':1, 'P':1, 'O':4}
        'LiCoO2'  -> {'Li':1, 'Co':1, 'O':2}
        'Li1.2Mn0.6Ni0.2O2' -> {'Li':1.2, 'Mn':0.6, 'Ni':0.2, 'O':2}
    """
    import re
    pattern = r"([A-Z][a-z]?)(\d*\.?\d*)"
    counts: dict[str, float] = {}
    for el, num in re.findall(pattern, formula):
        if el not in ATOMIC_NUMBERS and el != "H":
            continue
        n = float(num) if num else 1.0
        counts[el] = counts.get(el, 0) + n
    return counts


def featurize_composition(formula: str, synthesis_method: str = "solid-state",
                          synthesis_temp_c: float = 700.0) -> dict:
    """Convert a chemical formula + process info into a flat feature dict."""
    counts = parse_formula(formula)
    total = sum(counts.values()) or 1.0
    fractions = {el: counts.get(el, 0) / total for el in ELEMENTS}

    atomic_nums = [ATOMIC_NUMBERS[el] for el in counts if el in ATOMIC_NUMBERS]
    mean_an = float(np.mean(atomic_nums)) if atomic_nums else 0.0
    std_an = float(np.std(atomic_nums)) if atomic_nums else 0.0

    feats: dict = {}
    feats.update({f"frac_{el}": fractions[el] for el in ELEMENTS})
    feats["n_elements"] = len(counts)
    feats["mean_atomic_number"] = mean_an
    feats["std_atomic_number"] = std_an
    feats["synthesis_temp_c"] = float(synthesis_temp_c)
    feats["synthesis_temp_norm"] = float(synthesis_temp_c) / 1500.0
    for m in SYNTHESIS_METHODS:
        feats[f"synth_{m.replace('-', '_')}"] = 1.0 if m == synthesis_method else 0.0
    return feats


def load_dataset(csv_path: Optional[Path] = None) -> pd.DataFrame:
    """Load the battery materials dataset."""
    if csv_path is None:
        csv_path = Path(settings.ML_SETTINGS["DATA_DIR"]) / "battery_materials_sample.csv"
    df = pd.read_csv(csv_path)
    return df


def build_feature_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, pd.Series]]:
    """Convert dataset rows into feature matrix X and target columns y."""
    feature_rows = []
    for _, row in df.iterrows():
        feats = featurize_composition(
            row["formula"],
            synthesis_method=row.get("synthesis_method", "solid-state"),
            synthesis_temp_c=row.get("synthesis_temp_c", 700.0),
        )
        feature_rows.append(feats)
    X = pd.DataFrame(feature_rows).fillna(0.0)

    targets = {}
    for t in ["capacity_mah_g", "cycle_life", "voltage_v",
              "energy_density_wh_kg", "safety_score", "cost_usd_kg"]:
        if t in df.columns:
            targets[t] = df[t].fillna(df[t].median())
    return X, targets


def train_model(target: str = "capacity_mah_g", algorithm: str = "random_forest",
                save: bool = True) -> dict:
    """Train a regressor for a single target. Returns metrics dict."""
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
    import numpy as np

    df = load_dataset()
    X, targets = build_feature_matrix(df)
    if target not in targets:
        raise ValueError(f"Target '{target}' not in dataset columns")

    y = targets[target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if algorithm == "random_forest":
        model = RandomForestRegressor(n_estimators=300, max_depth=12, random_state=42, n_jobs=-1)
    elif algorithm == "gradient_boosting":
        model = GradientBoostingRegressor(n_estimators=300, max_depth=4, random_state=42)
    elif algorithm == "xgboost":
        try:
            from xgboost import XGBRegressor
            model = XGBRegressor(n_estimators=400, max_depth=6, learning_rate=0.05, random_state=42)
        except ImportError:
            log.warning("xgboost not installed – falling back to gradient_boosting")
            model = GradientBoostingRegressor(n_estimators=300, max_depth=4, random_state=42)
            algorithm = "gradient_boosting"
    elif algorithm == "linear":
        model = LinearRegression()
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    metrics = {
        "rmse": float(np.sqrt(mean_squared_error(y_test, preds))),
        "mae": float(mean_absolute_error(y_test, preds)),
        "r2": float(r2_score(y_test, preds)),
    }
    cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2")
    metrics["cv_r2_mean"] = float(cv_scores.mean())
    metrics["cv_r2_std"] = float(cv_scores.std())

    if save:
        save_dir = Path(settings.ML_SETTINGS["MODELS_DIR"])
        save_dir.mkdir(parents=True, exist_ok=True)
        model_path = save_dir / f"{target}_{algorithm}.pkl"
        with open(model_path, "wb") as f:
            pickle.dump({
                "model": model,
                "feature_columns": list(X.columns),
                "target": target,
                "algorithm": algorithm,
                "metrics": metrics,
                "trained_on": str(df.shape),
            }, f)
        log.info("Saved model to %s", model_path)

    return {"target": target, "algorithm": algorithm, "metrics": metrics,
            "n_samples": int(len(df)), "n_features": int(X.shape[1])}


def load_model(target: str, algorithm: str = "random_forest"):
    """Load a trained model from disk."""
    model_path = Path(settings.ML_SETTINGS["MODELS_DIR"]) / f"{target}_{algorithm}.pkl"
    if not model_path.exists():
        log.info("Model %s/%s not found – training on the fly", target, algorithm)
        train_model(target=target, algorithm=algorithm, save=True)
    with open(model_path, "rb") as f:
        bundle = pickle.load(f)
    return bundle


def predict_property(target: str, formula: str, synthesis_method: str = "solid-state",
                     synthesis_temp_c: float = 700.0, algorithm: str = "random_forest") -> dict:
    """Predict a single property for a given formula + process."""
    bundle = load_model(target, algorithm)
    model = bundle["model"]
    feature_cols = bundle["feature_columns"]

    feats = featurize_composition(formula, synthesis_method, synthesis_temp_c)
    # ensure column order
    X = pd.DataFrame([[feats.get(c, 0.0) for c in feature_cols]], columns=feature_cols)
    pred = float(model.predict(X)[0])

    # crude confidence interval via training-set residuals (if available)
    metrics = bundle.get("metrics", {})
    rmse = metrics.get("rmse", 0.0)
    return {
        "target": target,
        "formula": formula,
        "prediction": round(pred, 3),
        "confidence_low": round(pred - 1.96 * rmse, 3),
        "confidence_high": round(pred + 1.96 * rmse, 3),
        "algorithm": algorithm,
        "metrics": metrics,
    }


def train_all_models() -> list[dict]:
    """Train models for all targets (default algorithm: random_forest)."""
    results = []
    for target in settings.ML_SETTINGS["PROPERTY_TARGETS"]:
        try:
            r = train_model(target=target, algorithm="random_forest", save=True)
            results.append(r)
        except Exception as e:
            log.exception("Failed to train %s: %s", target, e)
            results.append({"target": target, "error": str(e)})
    return results


if __name__ == "__main__":
    # CLI: python -m ml.models.train_property_predictor
    print(train_all_models())
