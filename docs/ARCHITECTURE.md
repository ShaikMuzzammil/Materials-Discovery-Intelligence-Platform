# Architecture

This document explains the system architecture of MatDiscoverAI in depth.

## High-level architecture

The system follows a **layered architecture** with clear separation of concerns:

```
┌──────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                            │
│  Django templates (Bootstrap 5 + HTMX + Alpine + Plotly + vis)   │
└──────────────────────────────────────────────────────────────────┘
                                ▲
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                 │
│  Django REST Framework (JWT auth, pagination, filtering)         │
└──────────────────────────────────────────────────────────────────┘
                                ▲
┌──────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                           │
│  8 Django apps:                                                   │
│  accounts · papers · extraction · knowledge_graph               │
│  materials · predictions · llm_chat · dashboard                  │
└──────────────────────────────────────────────────────────────────┘
                                ▲
┌──────────────────────────────────────────────────────────────────┐
│                          ML LAYER                                 │
│  Framework-agnostic Python package `ml/`                         │
│  nlp/ · llm/ · models/ · knowledge_graph/                        │
└──────────────────────────────────────────────────────────────────┘
                                ▲
┌──────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE                              │
│  PostgreSQL · Redis · ChromaDB · Celery · Neo4j (optional)      │
└──────────────────────────────────────────────────────────────────┘
```

## Layer responsibilities

### 1. Presentation layer
- **Django templates** with Bootstrap 5 (no React/Vue build step)
- **HTMX** for partial page updates (e.g., chat messages, async task triggers)
- **Alpine.js** for lightweight client-side reactivity
- **Plotly.js** for charts (entity distribution, relation pie, paper status)
- **vis-network** for interactive knowledge graph visualization
- All static assets served via **WhiteNoise** (no nginx needed for static)

### 2. API layer
- **Django REST Framework** with:
  - JWT authentication (SimpleJWT)
  - Session authentication (for browsable API + admin)
  - PageNumberPagination (20/page)
  - DjangoFilterBackend + SearchFilter + OrderingFilter
  - Browsable API renderer for development
- All endpoints under `/api/`
- CORS configured via `django-cors-headers`

### 3. Application layer
Each Django app encapsulates one domain:

| App | Responsibility |
|-----|----------------|
| `accounts` | Custom User model (email-based), JWT auth, researcher profile |
| `papers` | Paper ingestion from arXiv/OpenAlex/CrossRef, PaperChunk storage, IngestionJob tracking |
| `extraction` | NER + relation extraction orchestration, ExtractionRun auditing |
| `knowledge_graph` | KG builder, Material aggregation, GraphSnapshot history |
| `materials` | Materials Project API client + MaterialRecord cache |
| `predictions` | ML inference, PredictionRequest audit log, ModelRegistry |
| `llm_chat` | RAG chat sessions, ChatMessage history |
| `dashboard` | Home + analytics overview + stats API |

Each app has the standard Django structure:
- `models.py` — data models
- `serializers.py` — DRF serializers
- `views.py` — viewsets + template views
- `urls.py` — URL routing
- `services.py` — business logic (where appropriate)
- `tasks.py` — Celery tasks (where async work is needed)
- `admin.py` — Django admin registration

### 4. ML layer
The `ml/` package is **deliberately decoupled from Django**. It can be imported from any Python script or notebook without a Django server running:

```python
# Standalone usage
from ml.models.train_property_predictor import predict_property
from ml.nlp.ner_extractor import EnsembleEntityExtractor
from ml.llm.rag_pipeline import answer_question
```

Sub-packages:
- `ml/nlp/` — PDF parsing, NER, relation extraction
- `ml/llm/` — embeddings, LLM client, RAG pipeline
- `ml/models/` — ML model training + inference
- `ml/knowledge_graph/` — KG ML extensions (reserved)

### 5. Infrastructure
- **PostgreSQL** (prod) / **SQLite** (dev) — primary database
- **Redis** — Celery broker + result backend
- **ChromaDB** — vector store for RAG (persistent local files)
- **Neo4j** (optional) — production-scale knowledge graph
- **Celery** — async task execution (paper ingestion, extraction, indexing)

## Data flow

### Paper ingestion flow
```
User clicks "Ingest from arXiv" → POST /api/papers/api/jobs/
  → IngestionJob created (status=queued)
  → Celery task `run_ingestion_job.delay(job_id)`
    → search_arxiv(query, max_results)
      → HTTP GET to arxiv.org/api/query
      → Parse Atom XML
      → For each entry: Paper.objects.update_or_create(...)
    → Update job.papers_added, status=completed
  → Return job ID to client
  → Client polls /api/papers/api/jobs/<id>/ for status
```

### Extraction flow
```
User clicks "Run extraction" on paper detail page
  → POST /api/papers/api/<id>/extract/
  → Celery task `extract_paper_entities.delay(paper_id)`
    → parse_paper_text(paper)
      → If paper.raw_pdf: parse_pdf(path)
      → Elif paper.pdf_url: download + parse_pdf(bytes)
      → Else: use paper.abstract
    → chunk_and_persist(paper, text)
      → split_into_sections(text)
      → For each section: chunk_text(section, 800, 120)
      → Create PaperChunk rows
    → extract_entities(paper, text)
      → EnsembleEntityExtractor().extract(text)
        → RegexEntityExtractor.extract(text)
        → (optional) SpacyEntityExtractor.extract(text)
        → (optional) TransformerEntityExtractor.extract(text)
      → _dedup_overlapping(candidates)
      → For each candidate: Entity.objects.create(...)
    → extract_relations(paper, entities, text)
      → RegexRelationExtractor.extract(text, entities)
      → For each candidate: Relation.objects.create(...)
    → Update paper.status='extracted'
    → Create ExtractionRun audit record
```

### Knowledge graph build flow
```
User clicks "Build graph" → POST /api/kg/api/build/
  → build_graph_from_papers(save_snapshot=True)
    → For each Entity: G.add_node(normalized, type, papers=set())
    → For each Relation: G.add_edge(subject, obj, relation_type, confidence)
    → Convert sets to lists (JSON-serializable)
    → GraphSnapshot.objects.create(graph_json=...)
    → _sync_materials_from_graph(G)
      → For each MATERIAL/CHEMICAL_FORMULA node:
        → Material.objects.update_or_create(name=...)
        → material.mentioned_in.add(*papers)
```

### RAG chat flow
```
User asks "What is the capacity of LiFePO4?"
  → POST /api/chat/api/ask/ { question, use_rag: true, top_k: 5 }
  → ChatSession.objects.get_or_create(session_key=...)
  → ChatMessage.objects.create(role='user', content=question)
  → answer_question(question, top_k=5)
    → retrieve(question, top_k=5)
      → embed_text(question) → 384-d vector
      → chroma_collection.query(query_embeddings=[vec], n_results=5)
      → Return [{text, metadata, distance}]
    → Build prompt: "Use ONLY the following retrieved context..."
    → LLM.complete(prompt)
    → Return {answer, sources}
  → ChatMessage.objects.create(role='assistant', content=answer, sources=[...])
  → Return {session_key, answer, sources}
  → Frontend renders chat bubble + cited sources
```

### ML prediction flow
```
User submits prediction form
  → POST /api/predictions/api/predict/ {target, formula, synthesis_method, ...}
  → predict_property(target, formula, ...)
    → load_model(target, algorithm)
      → If .pkl exists: pickle.load()
      → Else: train_model(target, algorithm, save=True) → pickle.load()
    → featurize_composition(formula, method, temp)
      → parse_formula(formula) → element counts
      → Compute fractions for 27 elements
      → Compute mean/std atomic number
      → 8 one-hot synthesis method flags
      → Normalized temperature
      → 38-d feature dict
    → pd.DataFrame([feats])[feature_columns]
    → model.predict(X)[0] → scalar
    → CI = pred ± 1.96 × RMSE
  → PredictionRequest.objects.create(...)
  → Return {prediction, confidence_low, confidence_high, metrics, duration_ms}
```

## Design decisions

### Why Django (not FastAPI/Flask)?
- **Batteries-included**: ORM, admin, auth, migrations, templates, sessions
- **Admin panel** = free CRUD UI for all 25+ models
- **DRF** = mature REST framework with auth, pagination, filtering
- **Templates** = no React/Vue build step; faster iteration for research UI
- **Async** via Celery works seamlessly

### Why ChromaDB (not Pinecone/Weaviate)?
- **Local-first**: persistent SQLite-backed; no external service required
- **Free**: no API costs for development
- **Python-native**: integrates cleanly with sentence-transformers
- **Easy to swap**: minimal interface; can replace with FAISS/Pinecone in `rag_pipeline.py`

### Why NetworkX (not Neo4j by default)?
- **Zero-dependency**: ships with `pip install networkx`
- **In-process**: no Docker/external service needed for dev
- **Sufficient scale**: handles 100k+ nodes/edges comfortably
- **Neo4j-ready**: settings already expose `NEO4J_URI`; set `KG_SETTINGS.USE_NEO4J=True` to switch

### Why ensemble NER?
- **Regex**: zero-cost baseline, catches formulas like `LiFePO4`, temperatures, capacity values
- **spaCy**: general scientific NER, broader coverage
- **Transformer (MatSciBERT)**: domain-specific, highest accuracy but heavy
- **Merge**: keep highest-confidence candidate per span → best of all three

### Why scikit-learn (not PyTorch)?
- **Tabular data**: composition features are tabular, not images/text
- **Small dataset**: 40 sample rows; deep learning would overfit
- **Interpretability**: tree-based models give feature importance
- **Production stability**: scikit-learn API hasn't broken in years

### Why JWT (not session-only)?
- **API-first**: enables future mobile app / external integrations
- **Stateless**: works behind load balancers without shared session store
- **Both supported**: session auth still works for browsable API + admin

## Scalability considerations

### Horizontal scaling
- **Web tier**: stateless (sessions in DB/Redis) → scale via gunicorn workers
- **Worker tier**: Celery workers scale independently; add more for higher throughput
- **Database**: PostgreSQL handles 100GB+ easily; add read replicas for analytics

### Bottlenecks
1. **PDF parsing** — CPU-bound; mitigate by chunking across Celery workers
2. **Transformer NER** — GPU recommended for >1000 papers; CPU works for dev
3. **LLM API calls** — rate-limit via Celery's `rate_limit='10/m'` per task
4. **ChromaDB queries** — sub-100ms for <1M chunks; scale via sharding for larger corpora

### Production hardening checklist
- [x] `DJANGO_DEBUG=False` in production
- [x] `SECURE_SSL_REDIRECT=True`
- [x] `SESSION_COOKIE_SECURE=True`
- [x] `CSRF_COOKIE_SECURE=True`
- [x] Strong `DJANGO_SECRET_KEY` (50+ random chars)
- [x] `ALLOWED_HOSTS` properly scoped
- [x] CORS restricted to known origins
- [x] Sentry for error tracking (optional)
- [x] Gunicorn with 4+ workers
- [ ] Rate limiting on auth endpoints (add `django-ratelimit`)
- [ ] HTTPS-only cookies (already enforced when `DEBUG=False`)

## Testing strategy

(Stub — extend as the project matures)

- **Unit tests** for `ml/nlp/`, `ml/llm/`, `ml/models/` — pure Python, no Django
- **Integration tests** for each Django app's views + serializers
- **End-to-end tests** for the full pipeline: ingest → extract → KG → predict → chat
- **Fixtures**: sample papers + entities in `tests/fixtures/`
