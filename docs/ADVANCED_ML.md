# Advanced ML Features

This document covers the advanced ML capabilities of MatDiscoverAI beyond basic prediction.

## Table of Contents

1. [Hyperparameter Tuning (Optuna)](#1-hyperparameter-tuning-optuna)
2. [Model Explainability (SHAP)](#2-model-explainability-shap)
3. [Uncertainty Quantification](#3-uncertainty-quantification)
4. [Experiment Tracking](#4-experiment-tracking)
5. [Workflow Orchestration](#5-workflow-orchestration)
6. [Dataset Analysis](#6-dataset-analysis)
7. [Model Monitoring](#7-model-monitoring)
8. [Cross-Domain Analytics](#8-cross-domain-analytics)

---

## 1. Hyperparameter Tuning (Optuna)

### Overview
MatDiscoverAI uses [Optuna](https://optuna.org) for Bayesian hyperparameter optimization. Optuna's TPE (Tree-structured Parzen Estimator) sampler is more efficient than grid search, finding better hyperparameters in fewer trials.

### Supported algorithms + search spaces

| Algorithm | Hyperparameters | Search space |
|-----------|-----------------|--------------|
| `random_forest` | n_estimators, max_depth, min_samples_split, min_samples_leaf, max_features | 5×6×3×3×5 = 1350 combinations |
| `gradient_boosting` | n_estimators, max_depth, learning_rate, subsample, min_samples_split | 4×5×4×4×3 = 960 |
| `xgboost` | n_estimators, max_depth, learning_rate, subsample, colsample_bytree, gamma, reg_alpha, reg_lambda | 5×6×4×4×4×4×4×3 = ~46k |
| `lightgbm` | n_estimators, max_depth, learning_rate, num_leaves, subsample, colsample_bytree, reg_alpha, reg_lambda | 5×5×4×4×4×4×3×3 = ~28k |
| `ridge` | alpha | 6 values |
| `lasso` | alpha, max_iter | 5×3 = 15 |
| `mlp` | hidden_layer_sizes, activation, alpha, learning_rate, batch_size | 5×2×3×2×3 = 180 |

### Usage

**Via API:**
```bash
curl -X POST http://localhost:8000/api/domains/api/tune/ \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "battery",
    "target": "capacity_mah_g",
    "algorithm": "random_forest",
    "n_trials": 30,
    "use_optuna": true
  }'
```

**Via Python:**
```python
from ml.models.tuning import tune_model
result = tune_model("battery", "capacity_mah_g", "random_forest", n_trials=30)
print(f"Best params: {result.best_params}")
print(f"Best R²: {result.best_score:.3f}")
```

### Example output
```json
{
  "domain": "battery",
  "target": "capacity_mah_g",
  "algorithm": "random_forest",
  "best_params": {
    "n_estimators": 500,
    "max_depth": 16,
    "min_samples_split": 2,
    "min_samples_leaf": 1,
    "max_features": 0.5
  },
  "best_score": 0.68,
  "n_trials": 30,
  "duration_seconds": 45.3
}
```

### Fallback: Grid Search
If Optuna is not installed, the system falls back to `sklearn.model_selection.GridSearchCV` with a reduced search space.

---

## 2. Model Explainability (SHAP)

### Overview
[SHAP (SHapley Additive exPlanations)](https://github.com/shap/shap) provides per-prediction feature attributions based on game theory. For each prediction, SHAP tells you how much each feature contributed to pushing the prediction away from the baseline (mean prediction).

### Supported explainers

| Algorithm | Explainer | Notes |
|-----------|-----------|-------|
| `random_forest`, `gradient_boosting`, `xgboost`, `lightgbm` | `shap.TreeExplainer` | Fast, exact for trees |
| `linear`, `ridge`, `lasso` | `shap.LinearExplainer` | Fast |
| `mlp` | `shap.KernelExplainer` | Slow (kernel-based) |
| Any (fallback) | `sklearn.inspection.permutation_importance` | Global importance only |

### Usage

**Per-prediction explanation:**
```bash
curl -X POST http://localhost:8000/api/domains/api/explain/ \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "battery",
    "target": "capacity_mah_g",
    "algorithm": "random_forest",
    "input_features": {
      "formula": "LiFePO4",
      "synthesis_method": "sol-gel",
      "synthesis_temp_c": 700
    }
  }'
```

**Response:**
```json
{
  "base_value": 580.5,
  "prediction": 157.2,
  "method": "shap",
  "contributions": [
    {"feature": "frac_Li", "value": 0.25, "shap": -120.3, "direction": "down"},
    {"feature": "frac_Fe", "value": 0.25, "shap": -90.1, "direction": "down"},
    {"feature": "frac_P", "value": 0.25, "shap": -75.5, "direction": "down"},
    {"feature": "frac_O", "value": 1.0, "shap": -60.2, "direction": "down"},
    {"feature": "synth_sol_gel", "value": 1.0, "shap": +45.7, "direction": "up"},
    ...
  ]
}
```

**Interpretation:** LiFePO4 has 4×0.25=1 atom of Li, Fe, P each and 4 atoms of O. The SHAP values show that:
- The Li/Fe/P/O composition pushes the prediction DOWN from the baseline (580 → 157)
- The sol-gel synthesis method pushes it UP slightly

This matches domain knowledge: LiFePO4 has lower capacity than the average battery material (which includes high-capacity Si, Li-S, etc.).

**Global feature importance:**
```bash
curl http://localhost:8000/api/domains/api/battery/capacity_mah_g/importance/
```

Returns the top 20 most important features across the entire training set.

---

## 3. Uncertainty Quantification

### Overview
Point predictions are insufficient for real-world decision-making. MatDiscoverAI provides 3 methods for computing prediction intervals:

### Methods

#### Conformal Prediction (default)
- **Distribution-free** — no assumptions about the model or data distribution
- **Algorithm:**
  1. Split data into train + calibration (80/20)
  2. Train model on train split
  3. On calibration set, compute |y_true - y_pred| for each sample
  4. Take the (1-alpha) quantile of these absolute residuals → q_alpha
  5. For new prediction: interval = [pred - q_alpha, pred + q_alpha]
- **Coverage guarantee:** The true value falls in the interval with probability ≥ 1-alpha

#### Bootstrap Ensemble
- **Algorithm:**
  1. Train N models (default 10) with different random seeds on bootstrap samples
  2. For a new input, get N predictions
  3. Interval = [alpha/2 quantile, 1-alpha/2 quantile]
- **Pros:** Captures model uncertainty
- **Cons:** Slower (N model fits)

#### Quantile Regression
- **Algorithm:**
  1. Train 3 gradient boosting models with quantile loss: alpha=0.05, 0.5, 0.95
  2. The 5th and 95th percentile models give the interval
- **Pros:** No calibration set needed
- **Cons:** Only works with gradient boosting

### Usage

```bash
curl -X POST http://localhost:8000/api/domains/api/uncertainty/ \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "battery",
    "target": "capacity_mah_g",
    "algorithm": "random_forest",
    "method": "conformal",
    "confidence": 0.9,
    "input_features": {
      "formula": "LiFePO4",
      "synthesis_method": "sol-gel",
      "synthesis_temp_c": 700
    }
  }'
```

**Response:**
```json
{
  "domain": "battery",
  "target": "capacity_mah_g",
  "algorithm": "random_forest",
  "prediction": 157.2,
  "lower": 138.5,
  "upper": 175.9,
  "calibration_size": 17,
  "q_alpha": 18.7,
  "confidence": 0.9,
  "method": "conformal"
}
```

**Interpretation:** With 90% confidence, the true capacity of LiFePO4 (synthesized via sol-gel at 700°C) falls in [138.5, 175.9] mAh/g. The actual value (~165) falls within this interval.

---

## 4. Experiment Tracking

### Overview
MLflow-style tracking of every training run, hyperparameter tuning run, and model performance metric.

### Models
- **Experiment** — a logical grouping (e.g. "Battery capacity optimization")
- **TrainingRun** — a single training execution (domain, target, algorithm, hyperparameters, metrics, model path, duration)
- **HyperparameterTuningRun** — a single tuning execution (best params, best score, all trials)

### Usage

**Track a training run:**
```bash
curl -X POST http://localhost:8000/api/experiments/api/track-training/ \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "battery",
    "target": "capacity_mah_g",
    "algorithm": "random_forest"
  }'
```

**Track a tuning run:**
```bash
curl -X POST http://localhost:8000/api/experiments/api/track-tuning/ \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "battery",
    "target": "capacity_mah_g",
    "algorithm": "random_forest",
    "n_trials": 30
  }'
```

**Get the leaderboard:**
```bash
curl http://localhost:8000/api/experiments/api/leaderboard/
```

Returns the best model per (domain, target) combination, ranked by R².

---

## 5. Workflow Orchestration

### Overview
Pipelines of ML/NLP/KG steps that can be executed end-to-end with a single click.

### Predefined templates

#### Battery Materials Discovery Pipeline
1. Ingest papers from arXiv (query: "lithium battery cathode", max 20)
2. Extract entities + relations
3. Build knowledge graph
4. Vector-index papers for RAG
5. Train ML models (all battery targets)
6. Evaluate models
7. Generate report

#### Multi-Domain Comparison Pipeline
1. Analyze all 7 datasets
2. Train models for all 7 domains
3. Compare model performance
4. Generate comparison report

#### Single Domain Optimization Pipeline
1. Analyze dataset
2. Train baseline model
3. Hyperparameter tuning (30 trials)
4. Retrain with best params
5. Compare before/after

### Usage

**Create from template:**
```bash
curl -X POST http://localhost:8000/api/workflow/api/create-from-template/ \
  -H "Content-Type: application/json" \
  -d '{"template_key": "battery_discovery"}'
```

**Run the workflow:**
```bash
curl -X POST http://localhost:8000/api/workflow/api/1/run/
```

**Check status:**
```bash
curl http://localhost:8000/api/workflow/api/runs/1/
```

### Step types supported
- `ingestion` — fetch papers from arXiv/OpenAlex
- `extraction` — NER + relation extraction
- `kg_build` — build knowledge graph
- `vector_index` — embed chunks into ChromaDB
- `training` — train ML models
- `tuning` — hyperparameter optimization
- `evaluation` — evaluate models
- `analysis` — dataset analysis
- `comparison` — cross-domain comparison
- `report` — generate Markdown/PDF report

---

## 6. Dataset Analysis

### Overview
Comprehensive statistical analysis of every dataset, including:
- Descriptive statistics (mean, std, min, max, median, quartiles, skew, kurtosis)
- Categorical distributions (top values per column)
- Pairwise correlations (top 15 by absolute value)
- Outlier detection (IQR method)
- Target distributions (histograms)
- Feature-target correlations
- Quality scoring (0-100)

### Quality score formula
```
score = (40 × min(1, n_samples/200)) +
        (30 × (1 - missing_pct/100)) +
        (30 × targets_with_data/total_targets)
```

Grades:
- A+: 90-100
- A: 80-89
- B+: 70-79
- B: 60-69
- C: 50-59
- D: 40-49
- F: <40

### Usage

**Analyze a single dataset:**
```bash
curl http://localhost:8000/api/datasets/api/battery/
```

**Compare all datasets:**
```bash
curl http://localhost:8000/api/datasets/api/compare/
```

**Download statistics:**
```bash
curl http://localhost:8000/api/datasets/api/battery/stats/
```

---

## 7. Model Monitoring

### Overview
Real-time monitoring of model performance, prediction drift, and system usage.

### Endpoints

**System overview:**
```bash
curl http://localhost:8000/api/monitoring/api/overview/
```
Returns counts of all entities + recent activity (last 24h).

**Model performance over time:**
```bash
curl http://localhost:8000/api/monitoring/api/models/
```
Returns the last 50 training runs with R², RMSE, duration.

**Prediction drift detection:**
```bash
curl http://localhost:8000/api/monitoring/api/drift/
```
Compares recent predictions (last 7 days) vs historical. Returns:
- `status`: "stable" or "drift_detected"
- `drift_score`: |recent_mean - hist_mean| / hist_std
- If drift_score > 0.5, drift is detected

**Usage stats:**
```bash
curl http://localhost:8000/api/monitoring/api/usage/?days=30
```
Returns daily counts of papers added, predictions made, chat messages.

---

## 8. Cross-Domain Analytics

### Overview
Find patterns across all 7 material domains.

### Endpoints

**Cross-domain insights:**
```bash
curl http://localhost:8000/api/analytics/api/insights/
```
Returns:
- Total datasets, models, samples, targets
- Best-performing domain (highest avg R²)
- Domain R² averages
- Quality grades per domain

**Trends:**
```bash
curl http://localhost:8000/api/analytics/api/trends/
```
Returns:
- Papers per domain over time
- Predictions per target
- Entities per type

**Recommendations:**
```bash
curl http://localhost:8000/api/analytics/api/recommendations/
```
Returns AI-driven recommendations:
- "Collect more data" for models with R² < 0.5
- "Train models" for domains with no models
- "Tune hyperparameters" for models with 0.5 < R² < 0.85

**Model comparison:**
```bash
curl http://localhost:8000/api/analytics/api/model-comparison/
```
Returns, for each (domain, target), all trained algorithms and their metrics, with the best one highlighted.

---

## Summary

MatDiscoverAI provides a complete ML research platform:

| Feature | Method | Endpoint |
|---------|--------|----------|
| Train models | sklearn / XGBoost / LightGBM | `/api/domains/api/train/` |
| Predict properties | Any of 8 algorithms | `/api/domains/api/predict/` |
| Tune hyperparameters | Optuna (Bayesian) | `/api/domains/api/tune/` |
| Explain predictions | SHAP | `/api/domains/api/explain/` |
| Uncertainty intervals | Conformal / Bootstrap / Quantile | `/api/domains/api/uncertainty/` |
| Track experiments | MLflow-style | `/api/experiments/api/` |
| Orchestrate pipelines | DAG of steps | `/api/workflow/api/` |
| Analyze datasets | Statistics + quality | `/api/datasets/api/` |
| Monitor models | Drift + usage | `/api/monitoring/api/` |
| Cross-domain insights | Aggregated analytics | `/api/analytics/api/` |
| Export reports | PDF / CSV / JSON / MD | `/exports/api/` |

Total: **42+ trained ML models across 7 domains × 6 targets**, with 8 algorithm choices, Bayesian hyperparameter tuning, SHAP explainability, 3 uncertainty methods, experiment tracking, workflow orchestration, and comprehensive analytics.
