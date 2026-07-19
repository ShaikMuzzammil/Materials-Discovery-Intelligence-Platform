# Complete API Reference

This document lists every REST API endpoint in MatDiscoverAI.

## Table of Contents

1. [Authentication](#1-authentication)
2. [Domains (7 material domains)](#2-domains)
3. [Datasets](#3-datasets)
4. [Papers](#4-papers)
5. [Extraction](#5-extraction)
6. [Knowledge Graph](#6-knowledge-graph)
7. [Materials](#7-materials)
8. [Predictions (legacy battery-only)](#8-predictions-legacy)
9. [LLM Chat (RAG)](#9-llm-chat-rag)
10. [Experiments](#10-experiments)
11. [Workflow](#11-workflow)
12. [Monitoring](#12-monitoring)
13. [Analytics](#13-analytics)
14. [Dashboard](#14-dashboard)
15. [Exports](#15-exports)

---

## 1. Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/token/` | Get JWT access + refresh tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user (requires auth) |
| PATCH | `/api/auth/me/` | Update current user |

---

## 2. Domains

The unified API for all 7 material domains.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains/api/` | List all 7 domains with info |
| GET | `/api/domains/api/<domain>/info/` | Get domain info + quality score |
| POST | `/api/domains/api/predict/` | Predict a property |
| POST | `/api/domains/api/train/` | Train a model |
| POST | `/api/domains/api/tune/` | Hyperparameter tuning |
| POST | `/api/domains/api/explain/` | SHAP explanation |
| POST | `/api/domains/api/uncertainty/` | Prediction interval |
| GET | `/api/domains/api/<domain>/analyze/` | Dataset analysis |
| GET | `/api/domains/api/compare-datasets/` | Compare all datasets |
| GET | `/api/domains/api/models/` | List all trained models |
| GET | `/api/domains/api/<domain>/<target>/importance/` | Global feature importance |

### Predict request body
```json
{
  "domain": "battery",
  "target": "capacity_mah_g",
  "algorithm": "random_forest",
  "formula": "LiFePO4",
  "synthesis_method": "sol-gel",
  "synthesis_temp_c": 700
}
```

### Predict response
```json
{
  "domain": "battery",
  "target": "capacity_mah_g",
  "algorithm": "random_forest",
  "prediction": 157.2,
  "confidence_low": 120.5,
  "confidence_high": 193.9,
  "metrics": {
    "rmse": 19.05,
    "mae": 14.2,
    "r2": 0.565,
    "cv_r2_mean": 0.42,
    "cv_r2_std": 0.15
  },
  "input": {...},
  "duration_ms": 245
}
```

---

## 3. Datasets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/datasets/api/` | List all datasets |
| GET | `/api/datasets/api/<domain>/` | Dataset detail + analysis |
| GET | `/api/datasets/api/<domain>/stats/` | Statistics only |
| GET | `/api/datasets/api/<domain>/quality/` | Quality score |
| GET | `/api/datasets/api/<domain>/download/` | Download as CSV |
| GET | `/api/datasets/api/compare/` | Compare all datasets |

---

## 4. Papers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/papers/api/` | List papers (filter: source, status, doi) |
| POST | `/api/papers/api/` | Create paper manually |
| GET | `/api/papers/api/<id>/` | Retrieve paper |
| POST | `/api/papers/api/<id>/extract/` | Trigger extraction |
| POST | `/api/papers/api/<id>/index/` | Trigger vector indexing |
| POST | `/api/papers/api/jobs/` | Start arXiv/OpenAlex ingestion |

---

## 5. Extraction

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/extraction/api/entities/` | List entities |
| GET | `/api/extraction/api/relations/` | List relations |
| GET | `/api/extraction/api/runs/` | List extraction runs |
| POST | `/api/extraction/api/run/<paper_id>/` | Run extraction sync |
| POST | `/api/extraction/api/run-async/<paper_id>/` | Queue extraction |

---

## 6. Knowledge Graph

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kg/api/build/` | Build KG from extracted entities |
| GET | `/api/kg/api/graph/` | Get latest graph JSON |
| GET | `/api/kg/api/subgraph/?node=X&depth=2` | Get subgraph around a node |
| GET | `/api/kg/api/recommend/?property=capacity` | Recommend materials |
| GET | `/api/kg/api/materials/` | List canonical materials |
| GET | `/api/kg/api/snapshots/` | List KG snapshots |

---

## 7. Materials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/materials/api/` | List cached MaterialRecords |
| GET | `/api/materials/api/<id>/` | Retrieve a material record |
| GET | `/api/materials/api/fetch-mp/<formula>/` | Fetch from Materials Project |
| GET | `/api/materials/api/compare/?formulas=A,B,C` | Compare materials |

---

## 8. Predictions (legacy)

The original battery-only prediction endpoints. Use `/api/domains/api/predict/` for new code.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/predictions/api/` | List prediction history |
| POST | `/api/predictions/api/predict/` | Predict (battery only) |
| POST | `/api/predictions/api/train/` | Train model |
| GET | `/api/predictions/api/models/` | List registered models |

---

## 9. LLM Chat (RAG)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/api/ask/` | Ask a question (RAG) |
| GET | `/api/chat/api/history/<session_key>/` | Get chat history |

### Ask request
```json
{
  "question": "What is the capacity of LiFePO4?",
  "session_key": "abc-123",
  "use_rag": true,
  "top_k": 5
}
```

### Ask response
```json
{
  "session_key": "abc-123",
  "answer": "LiFePO4 has a specific capacity of approximately 165 mAh/g [1]...",
  "sources": [
    {
      "paper_id": 2,
      "chunk_index": 3,
      "section": "abstract",
      "title": "Sol-gel synthesis of LiFePO4/C composite cathode...",
      "snippet": "LiFePO4 (LFP) is a widely used cathode material..."
    }
  ]
}
```

---

## 10. Experiments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/experiments/api/experiments/` | List experiments |
| POST | `/api/experiments/api/experiments/` | Create experiment |
| GET | `/api/experiments/api/experiments/<id>/` | Get experiment |
| GET | `/api/experiments/api/runs/` | List training runs |
| GET | `/api/experiments/api/runs/<id>/` | Get run details |
| POST | `/api/experiments/api/track-training/` | Train + track |
| POST | `/api/experiments/api/track-tuning/` | Tune + track |
| GET | `/api/experiments/api/leaderboard/` | Best models per (domain, target) |

---

## 11. Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflow/api/templates/` | List predefined templates |
| GET | `/api/workflow/api/` | List workflows |
| GET | `/api/workflow/api/<id>/` | Get workflow + runs |
| POST | `/api/workflow/api/create-from-template/` | Create from template |
| POST | `/api/workflow/api/<id>/run/` | Execute workflow |
| GET | `/api/workflow/api/runs/<id>/` | Get run details |

---

## 12. Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/monitoring/api/overview/` | System overview |
| GET | `/api/monitoring/api/models/` | Model performance over time |
| GET | `/api/monitoring/api/drift/` | Prediction drift detection |
| GET | `/api/monitoring/api/usage/?days=30` | Usage statistics |

---

## 13. Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/api/insights/` | Cross-domain insights |
| GET | `/api/analytics/api/trends/` | Trend data |
| GET | `/api/analytics/api/recommendations/` | AI recommendations |
| GET | `/api/analytics/api/model-comparison/` | Compare algorithms per target |

---

## 14. Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats/` | Aggregate stats for charts |

---

## 15. Exports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exports/api/<domain>/csv/` | Download CSV |
| GET | `/exports/api/<domain>/json/` | Download JSON (with analysis) |
| GET | `/exports/api/<domain>/markdown/` | Download Markdown report |
| GET | `/exports/api/<domain>/pdf/` | Download PDF report |
| GET | `/exports/api/comparison/markdown/` | Download all-domains comparison |

---

## Count summary

- **Total endpoints:** 60+
- **Domain-specific:** 11 (under `/api/domains/`)
- **Auth:** 5
- **Papers/Extraction/KG/Materials:** 18
- **Datasets:** 6
- **Experiments:** 8
- **Workflow:** 6
- **Monitoring:** 4
- **Analytics:** 4
- **Exports:** 5
- **Dashboard:** 1
- **Chat:** 2
- **Legacy predictions:** 4

All endpoints accept JSON and return JSON (except exports which return file downloads).
All POST endpoints are open (no auth required) for demo purposes; in production, add JWT auth.
