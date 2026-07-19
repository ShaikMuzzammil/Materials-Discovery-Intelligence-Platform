# REST API Reference

Complete reference for all MatDiscoverAI REST API endpoints. All endpoints are prefixed with `/api/`. JWT-authenticated where noted.

## Table of contents

1. [Authentication](#1-authentication)
2. [Papers](#2-papers)
3. [Extraction](#3-extraction)
4. [Knowledge Graph](#4-knowledge-graph)
5. [Materials](#5-materials)
6. [Predictions](#6-predictions)
7. [LLM Chat](#7-llm-chat)
8. [Dashboard](#8-dashboard)

---

## 1. Authentication

### Register

```
POST /api/auth/register/
```

**Request body:**
```json
{
  "email": "researcher@university.edu",
  "full_name": "Dr. Jane Smith",
  "institution": "MIT",
  "research_domain": "battery",
  "password": "secure-password-123",
  "password_confirm": "secure-password-123"
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "researcher@university.edu",
  "full_name": "Dr. Jane Smith",
  "institution": "MIT",
  "research_domain": "battery",
  "orcid_id": "",
  "api_tokens_credits": 1000,
  "email_verified": false,
  "date_joined": "2026-07-19T10:00:00Z"
}
```

### Get JWT token

```
POST /api/auth/token/
```

**Request body:**
```json
{
  "email": "researcher@university.edu",
  "password": "secure-password-123"
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Use the access token in subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh token

```
POST /api/auth/refresh/
```

**Request body:**
```json
{ "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

### Get current user

```
GET /api/auth/me/
Authorization: Bearer <token>
```

### Update current user

```
PATCH /api/auth/me/
Authorization: Bearer <token>
```

```json
{ "full_name": "Dr. Jane Smith-Updated" }
```

---

## 2. Papers

### List papers

```
GET /api/papers/api/
```

**Query params:**
- `source` — filter by source (`arxiv`, `openalex`, `crossref`, `manual`)
- `status` — filter by status (`pending`, `fetched`, `parsed`, `extracted`, `indexed`, `failed`)
- `doi` — filter by DOI
- `search` — search title/abstract/authors
- `ordering` — `published_at`, `created_at`, `title`
- `page` — page number (default 1)
- `page_size` — items per page (default 20)

**Response (200):**
```json
{
  "count": 8,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "source": "manual",
      "source_id": "",
      "doi": "10.1016/j.jpowsour.2023.123456",
      "title": "High-capacity Li-rich cathode Li1.2Mn0.6Ni0.2O2...",
      "authors": "...",
      "abstract": "Lithium-rich layered oxides...",
      "published_at": null,
      "journal": "",
      "pdf_url": "",
      "keywords": ["Li-rich", "cathode"],
      "domains": ["battery", "cathode"],
      "status": "extracted",
      "ingestion_error": "",
      "created_at": "2026-07-19T10:00:00Z",
      "updated_at": "2026-07-19T10:05:00Z"
    }
  ]
}
```

### Retrieve a paper

```
GET /api/papers/api/{id}/
```

### Create a paper (manual)

```
POST /api/papers/api/
Authorization: Bearer <token>
```

```json
{
  "title": "My new paper",
  "abstract": "Abstract text...",
  "doi": "10.1000/my-doi",
  "source": "manual",
  "domains": ["battery"],
  "keywords": ["keyword1", "keyword2"]
}
```

### Trigger async extraction

```
POST /api/papers/api/{id}/extract/
```

**Response:**
```json
{
  "task_id": "a1b2c3d4-...",
  "paper_id": 1,
  "status": "queued"
}
```

### Trigger async vector indexing

```
POST /api/papers/api/{id}/index/
```

### Start ingestion job (arXiv / OpenAlex)

```
POST /api/papers/api/jobs/
```

**Request body:**
```json
{
  "query_type": "arxiv_search",
  "query_text": "lithium battery cathode",
  "max_results": 20
}
```

**Response (201):**
```json
{
  "id": 1,
  "query_type": "arxiv_search",
  "query_text": "lithium battery cathode",
  "max_results": 20,
  "status": "running",
  "papers_added": 0,
  "error_log": "",
  "celery_task_id": "abc123",
  "created_at": "2026-07-19T10:00:00Z",
  "finished_at": null
}
```

### Check ingestion job status

```
GET /api/papers/api/jobs/{id}/
```

---

## 3. Extraction

### List entities

```
GET /api/extraction/api/entities/
```

**Query params:**
- `paper` — filter by paper ID
- `entity_type` — filter by type (e.g. `CHEMICAL_FORMULA`, `PROPERTY`)
- `extractor` — filter by extractor (`regex`, `spacy`, `transformer`)
- `search` — search entity text

**Response:**
```json
{
  "count": 234,
  "results": [
    {
      "id": 1,
      "paper": 1,
      "text": "LiFePO4",
      "entity_type": "CHEMICAL_FORMULA",
      "normalized": "LiFePO4",
      "start_char": 234,
      "end_char": 241,
      "confidence": 0.7,
      "extractor": "regex",
      "created_at": "2026-07-19T10:05:00Z"
    }
  ]
}
```

### List relations

```
GET /api/extraction/api/relations/
```

**Query params:**
- `paper`, `relation_type`, `extractor`

**Response:**
```json
{
  "count": 56,
  "results": [
    {
      "id": 1,
      "paper": 1,
      "subject": 5,
      "subject_text": "LiFePO4",
      "subject_type": "CHEMICAL_FORMULA",
      "obj": 12,
      "object_text": "165 mAh/g",
      "object_type": "METRIC",
      "relation_type": "HAS_PROPERTY",
      "confidence": 0.6,
      "evidence": "The modified cathode achieves a capacity retention of 92% after 200 cycles...",
      "extractor": "regex_capacity",
      "created_at": "2026-07-19T10:05:00Z"
    }
  ]
}
```

### Run extraction synchronously

```
POST /api/extraction/api/run/{paper_id}/
```

**Response:**
```json
{
  "paper_id": 1,
  "ok": true,
  "chunks": 12,
  "entities": 47,
  "relations": 18,
  "duration_seconds": 2.34
}
```

### Queue async extraction

```
POST /api/extraction/api/run-async/{paper_id}/
```

---

## 4. Knowledge Graph

### Build the knowledge graph

```
POST /api/kg/api/build/
```

**Response:**
```json
{
  "nodes": 234,
  "edges": 56,
  "snapshot_created": true
}
```

### Get latest graph (JSON)

```
GET /api/kg/api/graph/
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "LiFePO4",
      "label": "LiFePO4",
      "type": "CHEMICAL_FORMULA",
      "mention_count": 5,
      "papers": [1, 2, 5]
    }
  ],
  "edges": [
    {
      "source": "LiFePO4",
      "target": "165 mAh/g",
      "key": 0,
      "relation": "HAS_PROPERTY",
      "confidence": 0.6,
      "paper_id": 1
    }
  ]
}
```

### Get subgraph around a node

```
GET /api/kg/api/subgraph/?node=LiFePO4&depth=2
```

### Recommend materials

```
GET /api/kg/api/recommend/?property=capacity
```

**Response:**
```json
[
  {
    "material": "LiFePO4",
    "label": "LiFePO4",
    "type": "CHEMICAL_FORMULA",
    "score": 3.2,
    "mention_count": 5
  }
]
```

### List canonical materials

```
GET /api/kg/api/materials/
```

---

## 5. Materials

### List cached material records

```
GET /api/materials/api/
```

**Query params:**
- `source`, `is_stable`
- `search` — search formula / formula_pretty / elements
- `ordering` — `formula`, `band_gap`, `density`, `cached_at`

### Fetch from Materials Project

```
GET /api/materials/api/fetch-mp/{formula}/
```

**Example:** `GET /api/materials/api/fetch-mp/LiFePO4/`

Fetches from Materials Project API and caches locally. Requires `MATERIALS_PROJECT_API_KEY` env var.

### Compare materials

```
GET /api/materials/api/compare/?formulas=LiFePO4,LiCoO2,LiMn2O4
```

**Response:**
```json
[
  {
    "formula": "LiFePO4",
    "mp_id": "mp-1101",
    "band_gap": 0.3,
    "density": 3.6,
    "formation_energy": -2.34,
    "theoretical_capacity": 170,
    "average_voltage": 3.45,
    "energy_density": 580,
    "is_stable": true,
    "elements": ["Li", "Fe", "P", "O"]
  }
]
```

---

## 6. Predictions

### List prediction history

```
GET /api/predictions/api/
```

### Run a prediction

```
POST /api/predictions/api/predict/
```

**Request body:**
```json
{
  "target": "capacity_mah_g",
  "formula": "LiFePO4",
  "synthesis_method": "sol-gel",
  "synthesis_temp_c": 700,
  "algorithm": "random_forest"
}
```

**Target options:**
- `capacity_mah_g` — Specific capacity (mAh/g)
- `cycle_life` — Cycle life (cycles)
- `voltage_v` — Average voltage (V)
- `energy_density_wh_kg` — Energy density (Wh/kg)
- `safety_score` — Safety score (0-1)
- `cost_usd_kg` — Cost (USD/kg)

**Algorithm options:** `random_forest`, `gradient_boosting`, `xgboost`, `linear`

**Response:**
```json
{
  "target": "capacity_mah_g",
  "formula": "LiFePO4",
  "prediction": 162.5,
  "confidence_low": 145.2,
  "confidence_high": 179.8,
  "algorithm": "random_forest",
  "metrics": {
    "rmse": 8.82,
    "mae": 6.45,
    "r2": 0.91,
    "cv_r2_mean": 0.87,
    "cv_r2_std": 0.04
  },
  "log_id": 42,
  "duration_ms": 23
}
```

### Train a model

```
POST /api/predictions/api/train/
```

**Request body:**
```json
{
  "target": "all",
  "algorithm": "random_forest"
}
```

**Response:**
```json
{
  "ok": true,
  "results": [
    {
      "target": "capacity_mah_g",
      "algorithm": "random_forest",
      "metrics": { "rmse": 8.82, "r2": 0.91 },
      "n_samples": 40,
      "n_features": 38
    }
  ]
}
```

---

## 7. LLM Chat

### Ask a question (RAG)

```
POST /api/chat/api/ask/
```

**Request body:**
```json
{
  "question": "What is the specific capacity of LiFePO4?",
  "session_key": "abc-123-def",
  "use_rag": true,
  "top_k": 5
}
```

**Response:**
```json
{
  "session_key": "abc-123-def",
  "answer": "Based on the indexed papers, LiFePO4 has a specific capacity of approximately 165 mAh/g [1], with some sources reporting values between 150-170 mAh/g depending on synthesis method [2][3]...",
  "sources": [
    {
      "paper_id": 2,
      "chunk_index": 3,
      "section": "abstract",
      "title": "Sol-gel synthesis of LiFePO4/C composite cathode...",
      "snippet": "LiFePO4 (LFP) is a widely used cathode material known for its excellent safety, long cycle life exceeding 2000 cycles, and low cost..."
    }
  ]
}
```

### Get chat history

```
GET /api/chat/api/history/{session_key}/
```

**Response:**
```json
{
  "id": 1,
  "title": "What is the specific capacity of LiFePO4?",
  "session_key": "abc-123-def",
  "created_at": "2026-07-19T10:00:00Z",
  "updated_at": "2026-07-19T10:05:00Z",
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "What is the specific capacity of LiFePO4?",
      "sources": [],
      "tokens_used": 0,
      "created_at": "2026-07-19T10:00:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Based on the indexed papers...",
      "sources": [...],
      "tokens_used": 245,
      "created_at": "2026-07-19T10:00:01Z"
    }
  ]
}
```

---

## 8. Dashboard

### Get aggregate stats

```
GET /api/dashboard/stats/
```

**Response:**
```json
{
  "papers": 8,
  "entities": 234,
  "relations": 56,
  "materials": 12,
  "predictions": 42,
  "entity_types": [
    { "entity_type": "CHEMICAL_FORMULA", "count": 89 },
    { "entity_type": "PROPERTY", "count": 45 }
  ],
  "relation_types": [
    { "relation_type": "HAS_PROPERTY", "count": 23 }
  ],
  "papers_by_source": [
    { "source": "manual", "count": 8 }
  ],
  "papers_by_status": [
    { "status": "extracted", "count": 8 }
  ]
}
```

---

## Rate limits

No explicit rate limits in the current implementation. For production, add `django-ratelimit`:

```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='10/m', method='POST')
@api_view(["POST"])
def ask_view(request):
    ...
```

Recommended limits:
- Auth endpoints: 5 requests/minute
- Chat / predictions: 30 requests/minute
- Extraction: 5 requests/minute (CPU-intensive)
- Read endpoints: 100 requests/minute

## Errors

All errors follow this format:

```json
{
  "detail": "Error message",
  "code": "error_code"
}
```

Common HTTP status codes:
- `200 OK` — successful GET / PATCH
- `201 Created` — successful POST
- `400 Bad Request` — validation error
- `401 Unauthorized` — missing/invalid JWT
- `403 Forbidden` — authenticated but not allowed
- `404 Not Found` — resource doesn't exist
- `429 Too Many Requests` — rate limit exceeded
- `500 Internal Server Error` — server error (check Sentry)
