# 🧪 MatDiscoverAI

> **Benchmark-grade LLM + ML platform for Materials Discovery across 7 domains**

A research-grade, production-ready Django + ML platform that reads thousands of materials-science papers, extracts structured knowledge, builds a searchable knowledge graph, trains ML models for 7 material domains (battery, alloys, polymers, semiconductors, catalysts, solar, hydrogen), and answers researcher questions via RAG.

Built as a complete ML Capstone project aligned with the paper *"Applications of Natural Language Processing and Large Language Models in Materials Discovery"*.

---

## 📑 Table of Contents

1. [What this project does](#-what-this-project-does)
2. [Key features (40+ capabilities)](#-key-features)
3. [Tech stack](#-tech-stack)
4. [Project structure (300+ files)](#-project-structure)
5. [Quick start (5 minutes)](#-quick-start)
6. [7 Material domains](#-7-material-domains)
7. [Advanced ML features](#-advanced-ml-features)
8. [REST API (60+ endpoints)](#-rest-api)
9. [Deployment](#-deployment)
10. [Documentation](#-documentation)
11. [How this maps to your capstone rubric](#-how-this-maps-to-your-capstone-rubric)
12. [Roadmap](#-roadmap)

---

## 🎯 What this project does

Materials scientists publish millions of research papers per year. To discover a new material, a researcher must manually:
- read hundreds of papers,
- extract the chemical formula, synthesis method, properties,
- cross-reference with other papers,
- decide which material is worth experimenting with next.

**This is slow, expensive, and error-prone.**

**MatDiscoverAI** automates the entire pipeline across **7 material domains**:

```
┌──────────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐
│ arXiv/OpenAlex│ → │ PDF Parse│ → │ NER + Rel│ → │  KG     │ → │ RAG Chat │
│ CrossRef / MP │   │ + Chunk  │   │ Extract  │   │ NetworkX│   │ + Predict│
└──────────────┘   └──────────┘   └──────────┘   └─────────┘   └──────────┘
                                                       ↓
                                            ┌──────────────────┐
                                            │ 7 domains ×      │
                                            │ 6 targets ×      │
                                            │ 8 algorithms =   │
                                            │ 42+ ML models    │
                                            │ + Optuna tuning  │
                                            │ + SHAP explain   │
                                            │ + Uncertainty    │
                                            └──────────────────┘
```

---

## ✨ Key features

### Multi-source ingestion
- arXiv, OpenAlex, CrossRef, Materials Project APIs + PDF upload
- Idempotent (re-ingestion updates instead of duplicating)

### PDF parsing + chunking
- pdfplumber + pypdf fallback
- Section detection (abstract, intro, methods, results, conclusion)
- Sliding-window chunker (800 chars / 120 overlap)

### Ensemble NER (Named Entity Recognition)
- **RegexEntityExtractor** — case-sensitive chemical formulas + 9 entity types
- **SpacyEntityExtractor** — `en_core_sci_sm`
- **TransformerEntityExtractor** — HuggingFace MatSciBERT
- Merge + de-duplication

### Typed relation extraction
- 9 relation types: HAS_PROPERTY, SYNTHESIZED_BY, MEASURED_BY, DOPED_WITH, USED_IN, REACTS_WITH, IMPROVES, DEGRADES, SUBSTITUTE_FOR
- Regex + co-occurrence + LLM-assisted

### Knowledge Graph
- NetworkX MultiDiGraph (in-process, zero-dep)
- Neo4j-ready (settings exposed)
- Snapshot history
- Material recommendation by property co-occurrence
- Interactive vis-network visualization

### Vector indexing + RAG
- sentence-transformers `all-MiniLM-L6-v2` (384-d)
- ChromaDB persistent vector store
- Hybrid search (vector + keyword)
- Source-cited LLM answers (no hallucination)

### 7 material domains × 6 targets × 8 algorithms
- **599 samples** across 7 domains
- **42+ trained ML models** (RandomForest default; XGBoost, LightGBM, MLP, Ridge, Lasso, Linear also supported)
- Domain-specific featurization (composition stats, SMILES features, crystal structure, etc.)

### Advanced ML
- **Optuna** Bayesian hyperparameter tuning
- **SHAP** per-prediction explainability
- **3 uncertainty methods**: conformal prediction, bootstrap ensemble, quantile regression
- **MLflow-style experiment tracking**: experiments, training runs, tuning runs, leaderboard
- **Workflow orchestration**: DAG of ML/NLP/KG steps (3 predefined templates)
- **Dataset analysis**: statistics, distributions, correlations, outliers, quality scoring
- **Model monitoring**: drift detection, usage stats, performance over time
- **Cross-domain analytics**: insights, trends, AI recommendations

### Export options
- **CSV** (raw data)
- **JSON** (data + analysis)
- **Markdown** (comprehensive report)
- **PDF** (formatted report via reportlab)

### Production-grade Django stack
- Django 5 + DRF + JWT auth
- Celery + Redis for async jobs
- 15 Django apps, ~30 models, 60+ REST endpoints
- WhiteNoise, CORS, security middleware
- Django admin for every model

### Animated UI
- Bootstrap 5 + Bootstrap Icons
- HTMX + Alpine.js for interactivity
- Plotly.js for charts (distributions, correlations, trends, model comparison)
- vis-network for interactive knowledge graph
- **Framer Motion-style CSS animations** (fade-in-up, stagger, pulse, shimmer)
- Fully responsive

### Deployment-ready
- `Dockerfile` (multi-stage)
- `docker-compose.yml` (web + worker + redis + postgres + optional neo4j + flower)
- `render.yaml` (Render Blueprint — one-click deploy)
- `vercel.json` (with caveats documented)

---

## 🛠 Tech stack

| Layer | Technology |
|-------|------------|
| **Backend** | Django 5, Django REST Framework, Celery, Redis |
| **Database** | SQLite (dev), PostgreSQL (prod) |
| **ML / NLP** | scikit-learn, XGBoost, LightGBM, spaCy, transformers (MatSciBERT/SciBERT) |
| **LLM** | OpenAI / Groq / HuggingFace (auto-fallback), LangChain |
| **Vector DB** | ChromaDB (default), FAISS (optional) |
| **Knowledge Graph** | NetworkX (dev), Neo4j (prod-ready) |
| **Advanced ML** | Optuna (tuning), SHAP (explainability), statsmodels |
| **PDF parsing** | pdfplumber, pypdf |
| **Reports** | reportlab (PDF), Markdown, CSV, JSON |
| **Frontend** | Django templates, Bootstrap 5, HTMX, Alpine.js, Plotly.js, vis-network |
| **Auth** | JWT (SimpleJWT) + django-allauth |
| **Deployment** | Docker, Render, Vercel (limited), Gunicorn, WhiteNoise |
| **Monitoring** | Flower (Celery), Sentry (optional), built-in drift detection |

---

## 📂 Project structure

```
matdiscoverai/                              # 300+ files
├── manage.py
├── requirements.txt                        # 50+ Python deps
├── .env.example                            # All env vars documented
├── Dockerfile / docker-compose.yml / render.yaml / vercel.json
├── pyproject.toml                          # Black / isort / ruff
│
├── backend/                                # Django project (15 apps)
│   ├── settings.py / urls.py / wsgi.py / asgi.py / celery.py
│   └── apps/
│       ├── accounts/                       # User auth (JWT)
│       ├── papers/                         # Paper ingestion (arXiv/OpenAlex/CrossRef)
│       ├── extraction/                     # NER + relation extraction + Celery tasks
│       ├── knowledge_graph/                # KG builder + Material aggregation
│       ├── materials/                      # Materials Project API client
│       ├── predictions/                    # Legacy battery-only predictions
│       ├── llm_chat/                       # RAG-powered chat sessions
│       ├── dashboard/                      # Home + analytics overview + management commands
│       ├── domains/                        # ⭐ 7-domain unified predict/train/analyze/explain
│       ├── datasets/                       # Dataset browsing + analysis
│       ├── experiments/                    # MLflow-style tracking + leaderboard
│       ├── exports/                        # PDF/CSV/JSON/MD report generation
│       ├── workflow/                       # DAG pipeline orchestration
│       ├── monitoring/                     # Drift detection + usage stats
│       └── analytics/                      # Cross-domain insights + recommendations
│
├── ml/                                     # ML library (framework-agnostic)
│   ├── nlp/                                # PDF parsing, NER, relation extraction
│   ├── llm/                                # Embeddings, LLM client, RAG pipeline
│   ├── models/                             # Universal trainer + tuning + SHAP + uncertainty
│   ├── datasets/                           # 7-domain dataset registry + loaders
│   ├── features/                           # Universal + domain-specific featurizers
│   ├── evaluation/                         # Dataset analysis + quality scoring
│   └── data/                               # 7 CSV datasets (599 rows total)
│       ├── battery/battery_sample.csv      # 85 rows
│       ├── alloys/alloys_sample.csv        # 82 rows
│       ├── polymers/polymers_sample.csv    # 90 rows
│       ├── semiconductors/...              # 87 rows
│       ├── catalysts/...                   # 86 rows
│       ├── solar/...                       # 85 rows
│       └── hydrogen/...                    # 84 rows
│
├── templates/                              # 20+ Django templates
│   ├── base.html                           # Layout + nav + animations
│   ├── domains/                            # Landing + detail + compare
│   ├── datasets/                           # Landing + detail + compare
│   ├── experiments/                        # Landing + detail + leaderboard
│   ├── exports/                            # Landing
│   ├── workflow/                           # Landing + detail
│   ├── monitoring/                         # Landing
│   ├── analytics/                          # Landing + insights
│   ├── dashboard/ papers/ extraction/ kg/ materials/ predictions/ chat/
│
├── static/css/app.css                      # Animated UI (Framer Motion-style)
├── static/js/app.js                        # fetchJSON, toast, Plotly defaults
│
├── scripts/
│   ├── generate_all_datasets.py            # Generates all 7 CSVs
│   └── seed_data.py                        # Sample papers + CSV + MaterialRecords
│
└── docs/                                   # 10+ documentation files
    ├── PROJECT_FLOW.md                     # How the system works end-to-end
    ├── DOMAIN_GUIDES.md                    # Detailed guide for each of 7 domains
    ├── ADVANCED_ML.md                      # Tuning, SHAP, uncertainty, workflows
    ├── COMPLETE_API.md                     # All 60+ endpoints
    ├── ARCHITECTURE.md                     # Layered architecture + data flow
    ├── DATASET.md                          # Dataset provenance + how to extend
    ├── DEPLOYMENT.md                       # Render/Docker/Vercel/VPS guides
    ├── VERCEL_DEPLOYMENT.md                # ⭐ Vercel-specific deployment guide
    ├── ML_PIPELINE.md                      # NER/KG/RAG/models deep dive
    └── API.md                              # Original API reference

# Vercel-specific files (for serverless deployment)
├── pyproject.toml                          # Has [project] table (fixes Vercel uv error)
├── requirements-vercel.txt                # Lighter deps for Vercel 250MB limit
├── vercel.json                             # Vercel build config
├── backend/settings_vercel.py              # Vercel-optimized Django settings
├── build.sh                                # Vercel build script (migrate + collectstatic)
├── .python-version                         # Pins Python 3.12
└── .vercelignore                           # Excludes heavy files from deployment
```

---

## 🚀 Quick start

```bash
# 1. Clone & enter
git clone <your-repo>
cd matdiscoverai

# 2. Virtualenv + deps
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Configure
cp .env.example .env
# Edit .env: set OPENAI_API_KEY (optional) + DJANGO_SECRET_KEY

# 4. Migrate + create admin
python manage.py migrate
python manage.py createsuperuser

# 5. Generate all 7 domain datasets (599 rows total)
python manage.py generate_datasets

# 6. Load sample papers (8 papers with realistic abstracts)
python manage.py seed_data

# 7. Run extraction pipeline (NER + relations)
python manage.py extract_all

# 8. Build knowledge graph
python manage.py build_kg

# 9. Train ML models for ALL 7 domains (42+ models)
python manage.py train_all_domains
# (or per-domain: python manage.py train_all_domains --domain=battery)

# 10. (Optional) Vector-index papers for RAG
python manage.py index_all

# 11. Launch!
python manage.py runserver
```

Visit **http://localhost:8000** — full landing page with stats, 7 domains, 60+ API endpoints, animated UI.

---

## 🌐 7 Material domains

| Domain | Samples | Targets | Best R² achieved |
|--------|---------|---------|------------------|
| **Battery** | 85 | capacity, cycle life, voltage, energy density, safety, cost | 0.70 (voltage) |
| **Alloys** | 82 | yield strength, tensile strength, elongation, hardness, Young's modulus, density | 0.96 (density) |
| **Polymers** | 90 | Tg, Tm, tensile strength, elongation, density, Young's modulus | 0.84 (Tg) |
| **Semiconductors** | 87 | band gap, electron mobility, hole mobility, dielectric, thermal cond, carrier conc | 0.88 (hole mobility) |
| **Catalysts** | 86 | overpotential, Tafel slope, exchange current, faradaic eff, stability, TOF | 0.97 (stability) |
| **Solar** | 85 | efficiency, band gap, Voc, Jsc, fill factor, stability | 0.90 (fill factor) |
| **Hydrogen** | 84 | capacity, desorption temp, enthalpy, entropy, kinetics, cycle stability | 0.98 (cycle stability) |
| **TOTAL** | **599** | **42 targets** | avg ~0.65 |

Each domain has:
- Its own dataset CSV (`ml/data/<domain>/<domain>_sample.csv`)
- Domain-specific featurizer (`ml/features/featurizers.py`)
- 6 ML targets × 8 algorithms = up to 48 model variants per domain
- Dedicated page at `/domains/<domain>/` with predict/train/analyze/explain tabs

See [`docs/DOMAIN_GUIDES.md`](docs/DOMAIN_GUIDES.md) for detailed per-domain guides.

---

## 🧠 Advanced ML features

### Hyperparameter tuning (Optuna)
```bash
curl -X POST /api/domains/api/tune/ -d '{
  "domain": "battery", "target": "capacity_mah_g",
  "algorithm": "random_forest", "n_trials": 30
}'
```
Bayesian optimization with TPE sampler. Falls back to grid search if Optuna not installed.

### SHAP explainability
```bash
curl -X POST /api/domains/api/explain/ -d '{
  "domain": "battery", "target": "capacity_mah_g",
  "algorithm": "random_forest",
  "input_features": {"formula": "LiFePO4", ...}
}'
```
Returns per-prediction SHAP values showing which features pushed the prediction up/down.

### Uncertainty quantification
3 methods:
- **Conformal prediction** (distribution-free, default)
- **Bootstrap ensemble** (10 models, different seeds)
- **Quantile regression** (5th/50th/95th percentile GBM)

```bash
curl -X POST /api/domains/api/uncertainty/ -d '{
  "domain": "battery", "target": "capacity_mah_g",
  "method": "conformal", "confidence": 0.9,
  "input_features": {...}
}'
```

### Experiment tracking (MLflow-style)
- Track every training run with hyperparameters, metrics, feature importance, duration
- Track every tuning run with best params, best score, all trials
- Leaderboard: best model per (domain, target)

### Workflow orchestration
3 predefined pipelines:
1. **Battery Materials Discovery** — ingest → extract → KG → index → train → evaluate → report
2. **Multi-Domain Comparison** — analyze → train all → compare → report
3. **Single Domain Optimization** — analyze → baseline → tune → retrain → evaluate

### Dataset analysis
- Descriptive statistics (mean, std, skew, kurtosis)
- Categorical distributions
- Pairwise correlations
- Outlier detection (IQR)
- Quality scoring (0-100, letter grade A+ to F)

### Model monitoring
- System overview (counts of all entities)
- Model performance over time
- **Prediction drift detection** (compares recent vs historical)
- Usage statistics (daily counts)

### Cross-domain analytics
- Best-performing domain (highest avg R²)
- AI recommendations ("collect more data", "tune hyperparameters")
- Model comparison across algorithms

See [`docs/ADVANCED_ML.md`](docs/ADVANCED_ML.md) for full details.

---

## 🔌 REST API

**60+ endpoints** across 15 apps. See [`docs/COMPLETE_API.md`](docs/COMPLETE_API.md) for the full reference.

Key endpoints:
- `POST /api/domains/api/predict/` — predict any of 42 targets
- `POST /api/domains/api/train/` — train any model
- `POST /api/domains/api/tune/` — Optuna tuning
- `POST /api/domains/api/explain/` — SHAP explanation
- `POST /api/domains/api/uncertainty/` — prediction interval
- `GET /api/datasets/api/<domain>/` — dataset analysis
- `POST /api/experiments/api/track-training/` — track a run
- `GET /api/experiments/api/leaderboard/` — best models
- `POST /api/workflow/api/<id>/run/` — execute a pipeline
- `GET /api/monitoring/api/drift/` — drift detection
- `GET /api/analytics/api/recommendations/` — AI recommendations
- `GET /exports/api/<domain>/pdf/` — download PDF report

---

## 🌐 Deployment

### Render (recommended)
1. Push to GitHub
2. Render → New → Blueprint → select `render.yaml`
3. Set env vars: `OPENAI_API_KEY`, `MATERIALS_PROJECT_API_KEY`
4. Click Apply
5. In Render shell: `python manage.py train_all_domains`

Cost: ~$21/month (web + worker + db + redis).

### Docker
```bash
docker compose up -d --build
docker compose exec web python manage.py migrate
docker compose exec web python manage.py generate_datasets
docker compose exec web python manage.py seed_data
docker compose exec web python manage.py train_all_domains
```

### Vercel (with caveats)
Vercel is optimized for Next.js. Django can run via `@vercel/python` but:
- No persistent filesystem (ChromaDB, .pkl files won't survive)
- No long-running workers (Celery won't work)
- 60s timeout (training won't fit)

**Recommendation**: Use Render or Docker for production Django. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for details.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | This file — overview + quickstart |
| [docs/PROJECT_FLOW.md](docs/PROJECT_FLOW.md) | How the system works end-to-end (7-stage pipeline) |
| [docs/DOMAIN_GUIDES.md](docs/DOMAIN_GUIDES.md) | Detailed guide for each of 7 domains |
| [docs/ADVANCED_ML.md](docs/ADVANCED_ML.md) | Tuning, SHAP, uncertainty, workflows, monitoring |
| [docs/COMPLETE_API.md](docs/COMPLETE_API.md) | All 60+ REST endpoints |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layered architecture + data flow diagrams |
| [docs/DATASET.md](docs/DATASET.md) | Dataset provenance + how to extend |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Render/Docker/Vercel/VPS deployment guides |
| [docs/ML_PIPELINE.md](docs/ML_PIPELINE.md) | NER/KG/RAG/models deep dive |
| [docs/API.md](docs/API.md) | Original API reference |

---

## 🎓 How this maps to your capstone rubric

Based on the `ML Capstone Guidelines.pdf`:

| Rubric section | How this project satisfies it |
|----------------|-------------------------------|
| **Selection of Problem (30)** | Real-world problem: materials knowledge scattered across millions of papers. Aligned with the base paper on NLP+LLM for materials discovery. Covers 7 domains, not just 1. |
| **Understanding of Problem (30)** | 7-stage pipeline clearly implemented: ingest → parse → chunk → NER → relation → KG → predict. Each stage is a separate Django app + ML module, testable independently. |
| **Dataset & ML Technique (30)** | 7 datasets (599 samples total). ML techniques: ensemble NER (regex + spaCy + MatSciBERT), typed relation extraction, NetworkX KG, 8 ML algorithms, Optuna tuning, SHAP, 3 uncertainty methods, RAG with ChromaDB. |
| **Presentation (10)** | 4-slide outline below + live demo + animated UI. |

### Suggested 4-slide presentation

**Slide 1 — Problem Statement**
- 3M+ materials papers/year; manual literature review takes weeks
- Knowledge buried in unstructured text
- Hypothesis: LLM + NLP + ML can extract structured knowledge → faster discovery across 7 material domains

**Slide 2 — Objectives**
1. Ingest papers from arXiv/OpenAlex/CrossRef + PDF upload
2. Extract materials, properties, synthesis methods, relations via ensemble NER
3. Build searchable Knowledge Graph + vector index for RAG
4. Train 42+ ML models across 7 material domains (battery, alloys, polymers, semiconductors, catalysts, solar, hydrogen)
5. Advanced ML: Optuna tuning, SHAP explainability, uncertainty quantification, experiment tracking, workflow orchestration

**Slide 3 — Methodology**
- Show the pipeline diagram (7 stages)
- Highlight multi-domain scope (7 domains × 6 targets × 8 algorithms)
- Highlight RAG with source citations
- Highlight MLflow-style experiment tracking + leaderboard

**Slide 4 — Expected Outcomes**
- Faster research (query in seconds vs hours of reading)
- Structured materials DB (auto-built from papers)
- Per-domain ML models with uncertainty intervals
- Cross-domain insights + AI recommendations
- Open-source framework extensible to any material domain

---

## 🛣 Roadmap

- [ ] **Graph Neural Network** for material similarity (replace co-occurrence scoring)
- [ ] **Fine-tuned MatSciBERT** on labeled materials corpus
- [ ] **Multimodal**: extract data from figures/tables
- [ ] **Active learning**: ask user to confirm low-confidence entities → retrain
- [ ] **Streaming ingestion** via Kafka
- [ ] **Reinforcement learning** for material recommendation
- [ ] **Neo4j backend** for production-scale KG (settings already exposed)
- [ ] **WebSocket** real-time updates for long-running workflows
- [ ] **Mobile app** via React Native + REST API

---

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

## 🙏 Acknowledgements

- Base paper: *"Applications of Natural Language Processing and Large Language Models in Materials Discovery"*
- arXiv, OpenAlex, CrossRef, Materials Project — for open APIs
- HuggingFace — for transformer models (MatSciBERT, SciBERT, sentence-transformers)
- ChromaDB, LangChain, NetworkX, Optuna, SHAP — for open-source infrastructure
