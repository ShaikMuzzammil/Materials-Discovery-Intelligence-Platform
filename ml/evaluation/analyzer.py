"""Dataset analysis utilities.

Computes statistics, distributions, correlations, outliers, and feature importance
for any of the 7 domain datasets.
"""
from __future__ import annotations
import logging
from typing import Optional
import numpy as np
import pandas as pd

from django.conf import settings
from ml.datasets.loaders import load_domain_dataset, get_domain_info, DOMAIN_REGISTRY

log = logging.getLogger(__name__)


def analyze_dataset(domain: str) -> dict:
    """Compute comprehensive statistics for a domain's dataset.

    Returns:
        {
            "domain": str,
            "n_samples": int,
            "n_columns": int,
            "columns": list,
            "numeric_columns": list,
            "categorical_columns": list,
            "missing_values": dict,
            "statistics": {  # per numeric column
                "mean": ..., "std": ..., "min": ..., "max": ...,
                "median": ..., "q25": ..., "q75": ..., "skew": ..., "kurtosis": ...
            },
            "categorical_distributions": {  # per categorical column
                "unique_count": int, "top_values": [(value, count), ...]
            },
            "correlations": {  # pairwise correlations between numeric columns
                "col1_col2": float
            },
            "outliers": {  # per numeric column, IQR-based
                "col": {"count": int, "percent": float, "values": [...]}
            },
            "target_distributions": {  # histograms for target columns
                "col": {"bins": [...], "counts": [...]}
            }
        }
    """
    df = load_domain_dataset(domain)
    if df.empty:
        return {"domain": domain, "error": "Dataset not found"}

    domain_info = get_domain_info(domain)
    targets = domain_info["targets"]

    # Identify column types
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    categorical_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]

    # Missing values
    missing = {col: int(df[col].isna().sum()) for col in df.columns if df[col].isna().sum() > 0}

    # Statistics for numeric columns
    stats = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        stats[col] = {
            "mean": float(series.mean()),
            "std": float(series.std()),
            "min": float(series.min()),
            "max": float(series.max()),
            "median": float(series.median()),
            "q25": float(series.quantile(0.25)),
            "q75": float(series.quantile(0.75)),
            "skew": float(series.skew()),
            "kurtosis": float(series.kurtosis()),
            "n_unique": int(series.nunique()),
        }

    # Categorical distributions
    cat_dist = {}
    for col in categorical_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        value_counts = series.value_counts().head(10)
        cat_dist[col] = {
            "unique_count": int(series.nunique()),
            "top_values": [(str(k), int(v)) for k, v in value_counts.items()],
        }

    # Correlations (only for numeric columns, top 10 by abs value)
    correlations = {}
    if len(numeric_cols) >= 2:
        try:
            corr_matrix = df[numeric_cols].corr()
            # Get top 10 correlations by absolute value
            corr_pairs = []
            for i in range(len(numeric_cols)):
                for j in range(i + 1, len(numeric_cols)):
                    corr_pairs.append((
                        numeric_cols[i], numeric_cols[j],
                        float(corr_matrix.iloc[i, j])
                    ))
            corr_pairs.sort(key=lambda x: -abs(x[2]))
            for c1, c2, c in corr_pairs[:15]:
                correlations[f"{c1}__{c2}"] = round(c, 4)
        except Exception as e:
            log.warning("Correlation computation failed: %s", e)

    # Outliers (IQR method)
    outliers = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 4:
            continue
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outliers_mask = (series < lower) | (series > upper)
        n_outliers = int(outliers_mask.sum())
        if n_outliers > 0:
            outliers[col] = {
                "count": n_outliers,
                "percent": round(100 * n_outliers / len(series), 2),
                "bounds": [float(lower), float(upper)],
                "sample_values": [float(x) for x in series[outliers_mask].head(5)],
            }

    # Target distributions (histograms for charts)
    target_distributions = {}
    for t in targets:
        if t in df.columns and pd.api.types.is_numeric_dtype(df[t]):
            series = df[t].dropna()
            if len(series) > 0:
                counts, bins = np.histogram(series, bins=15)
                target_distributions[t] = {
                    "bins": [round(float(b), 2) for b in bins],
                    "counts": [int(c) for c in counts],
                    "mean": float(series.mean()),
                    "median": float(series.median()),
                    "std": float(series.std()),
                }

    # Feature-target correlations (for understanding which features matter)
    feature_target_corr = {}
    feature_cols = domain_info.get("feature_columns", [])
    for feat in feature_cols:
        if feat not in df.columns:
            continue
        for t in targets:
            if t not in df.columns:
                continue
            if pd.api.types.is_numeric_dtype(df[feat]) and pd.api.types.is_numeric_dtype(df[t]):
                try:
                    corr = float(df[feat].corr(df[t]))
                    if not np.isnan(corr):
                        feature_target_corr[f"{feat}__{t}"] = round(corr, 4)
                except Exception:
                    pass

    return {
        "domain": domain,
        "name": domain_info["name"],
        "description": domain_info["description"],
        "n_samples": len(df),
        "n_columns": len(df.columns),
        "columns": list(df.columns),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "missing_values": missing,
        "statistics": stats,
        "categorical_distributions": cat_dist,
        "correlations": correlations,
        "outliers": outliers,
        "target_distributions": target_distributions,
        "feature_target_corr": feature_target_corr,
        "targets": targets,
    }


def get_dataset_quality_score(domain: str) -> dict:
    """Compute a quality score for a dataset (0-100) based on multiple criteria."""
    analysis = analyze_dataset(domain)
    if "error" in analysis:
        return {"domain": domain, "score": 0, "error": analysis["error"]}

    n_samples = analysis["n_samples"]
    n_missing = sum(analysis["missing_values"].values())
    total_cells = n_samples * analysis["n_columns"]
    missing_pct = (n_missing / total_cells * 100) if total_cells else 100

    n_targets_with_data = len(analysis["target_distributions"])
    n_targets = len(analysis["targets"])

    # Scoring (0-100)
    score = 0
    score += min(40, n_samples / 5)  # 40 pts for samples (200+ samples = max)
    score += 30 * (1 - missing_pct / 100)  # 30 pts for completeness
    score += 30 * (n_targets_with_data / max(n_targets, 1))  # 30 pts for targets

    grade = "F"
    if score >= 90: grade = "A+"
    elif score >= 80: grade = "A"
    elif score >= 70: grade = "B+"
    elif score >= 60: grade = "B"
    elif score >= 50: grade = "C"
    elif score >= 40: grade = "D"

    return {
        "domain": domain,
        "score": round(score, 1),
        "grade": grade,
        "n_samples": n_samples,
        "missing_pct": round(missing_pct, 2),
        "targets_coverage": round(100 * n_targets_with_data / max(n_targets, 1), 1),
        "issues": [
            f"Only {n_samples} samples" if n_samples < 100 else None,
            f"{missing_pct:.1f}% missing values" if missing_pct > 5 else None,
            f"Only {n_targets_with_data}/{n_targets} targets have data" if n_targets_with_data < n_targets else None,
        ],
    }


def compare_datasets() -> list[dict]:
    """Compare all 7 domain datasets side-by-side."""
    out = []
    for domain in DOMAIN_REGISTRY:
        analysis = analyze_dataset(domain)
        quality = get_dataset_quality_score(domain)
        out.append({
            "domain": domain,
            "name": analysis.get("name", domain),
            "n_samples": analysis.get("n_samples", 0),
            "n_columns": analysis.get("n_columns", 0),
            "n_targets": len(analysis.get("targets", [])),
            "score": quality.get("score", 0),
            "grade": quality.get("grade", "F"),
            "missing_pct": quality.get("missing_pct", 0),
        })
    return out


if __name__ == "__main__":
    # Smoke test
    for d in DOMAIN_REGISTRY:
        a = analyze_dataset(d)
        q = get_dataset_quality_score(d)
        print(f"\n=== {d} ===")
        print(f"  Samples: {a['n_samples']}, Columns: {a['n_columns']}")
        print(f"  Quality: {q['score']}/100 ({q['grade']})")
        if a["target_distributions"]:
            t = list(a["target_distributions"].keys())[0]
            td = a["target_distributions"][t]
            print(f"  {t}: mean={td['mean']:.2f}, std={td['std']:.2f}")
