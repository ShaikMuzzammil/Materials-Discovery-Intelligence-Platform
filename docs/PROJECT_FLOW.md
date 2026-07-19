# Project Flow – How MatDiscoverAI Works

This document explains the complete end-to-end flow of MatDiscoverAI, from raw data to research insights.

## Table of Contents

1. [The 7-Stage Pipeline](#the-7-stage-pipeline)
2. [Data Flow Diagram](#data-flow-diagram)
3. [User Journeys](#user-journeys)
4. [Component Interaction](#component-interaction)
5. [Request Lifecycle](#request-lifecycle)

---

## The 7-Stage Pipeline

MatDiscoverAI transforms unstructured scientific literature into actionable materials knowledge through 7 stages:

### Stage 1: Ingestion (Data Collection)
**Apps involved:** `papers`, `materials`
**External APIs:** arXiv, OpenAlex, CrossRef, Materials Project

The system pulls research papers from multiple open APIs:
- **arXiv** — preprints in physics/chemistry/materials science (free, no key)
- **OpenAlex** — 240M+ works from all disciplines (free, polite email recommended)
- **CrossRef** — DOI-based metadata lookup (free)
- **Materials Project** — computed material properties (free API key)

Each paper is stored as a `Paper` row with title, abstract, authors, DOI, PDF URL, and processing status.

### Stage 2: Parsing (PDF → Text)
**Modules:** `ml/nlp/pdf_parser.py`

When extraction is triggered, the system:
1. Downloads the PDF (if `pdf_url` is set)
2. Extracts text using `pdfplumber` (primary) or `pypdf` (fallback)
3. Cleans the text (de-hyphenation, page number removal, DOI stripping)
4. Detects sections (abstract, intro, methods, results, conclusion)
5. Splits into ~200-token chunks with 30-token overlap
6. Persists each chunk as a `PaperChunk` row

### Stage 3: Named Entity Recognition (NER)
**Modules:** `ml/nlp/ner_extractor.py`

Three extractors run in ensemble:
- **RegexEntityExtractor** — curated patterns for chemical formulas, temperatures, properties, metrics, synthesis methods, measurement techniques
- **SpacyEntityExtractor** — loads `en_core_sci_sm` for general scientific entities (optional)
- **TransformerEntityExtractor** — HuggingFace `MatSciBERT` for domain-specific entities (optional, heavy)

Results are merged with overlap de-duplication, keeping the highest-confidence candidate per span.

**Entity types recognized:**
- `CHEMICAL_FORMULA` (LiFePO4, Na3V2(PO4)2F3)
- `PROPERTY` (capacity, band gap, yield strength)
- `SYNTHESIS_METHOD` (sol-gel, hydrothermal, ball-milling)
- `TEMPERATURE` (700°C, 298K)
- `MEASUREMENT` (XRD, XPS, SEM, TEM)
- `METRIC` (165 mAh/g, 1.42 eV)
- `MATERIAL` (cathode, anode, electrolyte)
- `APPLICATION` (lithium-ion battery, solar cell)

### Stage 4: Relation Extraction
**Modules:** `ml/nlp/relation_extractor.py`

Extracts typed triples (subject, relation, object) from sentences:
- `HAS_PROPERTY`: (LiFePO4) → (165 mAh/g)
- `SYNTHESIZED_BY`: (LiFePO4) → (sol-gel)
- `MEASURED_BY`: (LiFePO4) → (XRD)
- `DOPED_WITH`: (NCM811) → (Zr)
- `USED_IN`: (LiFePO4) → (lithium-ion battery)

Two methods:
- **RegexRelationExtractor** — sentence-level pattern matching + co-occurrence fallback
- **LLMRelationExtractor** — zero-shot LLM extraction (optional)

### Stage 5: Knowledge Graph Construction
**Modules:** `backend/apps/knowledge_graph/services.py`

Aggregates all entities + relations across all papers into a NetworkX MultiDiGraph:
- **Nodes** = entities (labeled by type, with mention count)
- **Edges** = relations (labeled by type, weighted by confidence)

Snapshots are persisted as JSON for fast retrieval. The graph enables:
- Subgraph exploration around a material
- Material recommendation by property co-occurrence
- Cross-paper knowledge discovery

### Stage 6: Vector Indexing (for RAG)
**Modules:** `ml/llm/embeddings.py`, `ml/llm/rag_pipeline.py`

Each paper chunk is embedded using `sentence-transformers/all-MiniLM-L6-v2` (384-d vectors) and stored in ChromaDB:
- Collection: `matdiscoverai_papers`
- Distance: cosine
- HNSW index for fast approximate nearest neighbor search

This enables semantic search: "What is the capacity of LiFePO4?" returns chunks that mention capacity + LiFePO4, even if the exact words differ.

### Stage 7: ML Prediction + RAG Chat
**Modules:** `ml/models/universal_trainer.py`, `ml/llm/rag_pipeline.py`

#### ML Prediction
For each of the 7 domains, 6 ML targets are trained:
- **Features**: composition (element fractions, atomic stats) + process parameters (synthesis method one-hot, temperature)
- **Algorithms**: Random Forest (default), Gradient Boosting, XGBoost, LightGBM, MLP, Ridge, Lasso, Linear
- **Total models**: 7 domains × 6 targets × 1+ algorithms = **42+ trained models**

Users can:
- Predict a property for a new formula
- Compare algorithms for the same target
- Tune hyperparameters with Optuna (Bayesian optimization)
- Get uncertainty intervals (conformal prediction, bootstrap ensemble, quantile regression)
- Explain predictions with SHAP

#### RAG Chat
The chat interface:
1. Embeds the user's question
2. Retrieves top-K relevant chunks from ChromaDB
3. Builds a prompt with retrieved context + question
4. Sends to LLM (OpenAI/Groq/HuggingFace)
5. Returns the answer with source citations

---

## Data Flow Diagram

```
                    ┌─────────────────────────────────────────┐
                    │           EXTERNAL DATA SOURCES         │
                    └─────────────────────────────────────────┘
                                       │
            ┌──────────┬──────────┬────┴────────┬──────────────┐
            ▼          ▼          ▼             ▼              ▼
        ┌──────┐  ┌────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐
        │ arXiv│  │OpenAlex│  │CrossRef │  │ MatProj │  │ PDF upload│
        └──┬───┘  └───┬────┘  └────┬────┘  └────┬────┘  └─────┬────┘
           │          │            │            │             │
           └──────────┴───────┬────┘            │             │
                              ▼                 │             │
                    ┌─────────────────┐         │             │
                    │  papers app     │         │             │
                    │  (Paper model)  │         │             │
                    └────────┬────────┘         │             │
                             │                  ▼             │
                             │          ┌──────────────┐      │
                             │          │ materials app│      │
                             │          │(MaterialRecord)│    │
                             │          └──────────────┘      │
                             ▼                                │
                    ┌─────────────────┐                       │
                    │ extraction app  │                       │
                    │  (parse + NER)  │                       │
                    └────────┬────────┘                       │
                             │                                │
              ┌──────────────┼──────────────┐                 │
              ▼              ▼              ▼                 │
        ┌──────────┐  ┌──────────┐  ┌────────────┐            │
        │  Entity  │  │ Relation │  │ PaperChunk │            │
        │  (NER)   │  │ (typed)  │  │ (chunks)   │            │
        └────┬─────┘  └────┬─────┘  └─────┬──────┘            │
             │             │              │                   │
             │             ▼              │                   │
             │      ┌──────────────┐      │                   │
             │      │knowledge_graph│      │                   │
             │      │  (NetworkX)   │      │                   │
             │      └──────────────┘      │                   │
             │                            ▼                   │
             │                    ┌──────────────┐            │
             │                    │  embeddings  │            │
             │                    │(sentence-tf) │            │
             │                    └──────┬───────┘            │
             │                           │                    │
             │                           ▼                    │
             │                    ┌──────────────┐            │
             │                    │   ChromaDB   │            │
             │                    │  (vector DB) │            │
             │                    └──────┬───────┘            │
             │                           │                    │
             │                           ▼                    │
             │                    ┌──────────────┐            │
             │                    │   RAG chat   │◄───────────┘
             │                    │  (LLM + sources)│
             │                    └──────────────┘
             ▼
    ┌──────────────────┐
    │   domains app    │
    │  (ML prediction) │
    │  7 domains ×     │
    │  6 targets ×     │
    │  8 algorithms    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  experiments app │
    │  (tracking)      │
    └──────────────────┘
```

---

## User Journeys

### Journey 1: Researcher exploring battery materials
1. Visit `/domains/battery/` to see all battery ML models
2. Enter `LiFePO4` formula + `sol-gel` synthesis method + `700°C` temperature
3. Click "Predict" → get predicted capacity (e.g., 157 mAh/g) with R², RMSE, 95% CI
4. View SHAP explanation showing which elements drove the prediction
5. Click "Explain" tab to see top contributing features
6. Download a PDF report of the analysis

### Journey 2: Materials scientist comparing alloys
1. Visit `/domains/alloys/` 
2. Train models for yield_strength_mpa, tensile_strength_mpa, etc.
3. Try different formulas (Ti-6Al-4V, Fe-0.4C-1.5Mn, Al-4.5Cu)
4. Compare predicted vs known values
5. Use hyperparameter tuning to improve R²
6. Export comparison as CSV

### Journey 3: Researcher asking questions
1. Visit `/chat/`
2. Ask: "What is the capacity of LiFePO4?"
3. System retrieves relevant chunks from indexed papers
4. LLM generates answer with citations: "LiFePO4 has capacity of ~165 mAh/g [1][2]"
5. User clicks source links to verify

### Journey 4: ML engineer running workflows
1. Visit `/workflow/`
2. Select "Battery Materials Discovery Pipeline" template
3. Click "Create & Run"
4. Pipeline executes: ingest → extract → KG build → index → train → evaluate → report
5. Monitor progress in real-time
6. Download the final report

### Journey 5: Data analyst exploring datasets
1. Visit `/datasets/`
2. Compare quality scores across all 7 domains
3. Drill into `battery` dataset
4. View statistics, distributions, correlations, outliers
5. Download as CSV/JSON/Markdown/PDF

---

## Component Interaction

### Django Apps (15 total)

| App | Role | Dependencies |
|-----|------|--------------|
| `accounts` | User auth (JWT) | — |
| `papers` | Paper ingestion | requests, pdfplumber |
| `extraction` | NER + relations | ml/nlp, ml/llm |
| `knowledge_graph` | KG builder | networkx, ml/knowledge_graph |
| `materials` | Materials Project API | requests |
| `predictions` | Battery-specific predictions (legacy) | ml/models |
| `llm_chat` | RAG chat | ml/llm |
| `dashboard` | Home + overview | all apps |
| `domains` | **7-domain unified predict/train/analyze** | ml/* |
| `datasets` | Dataset browsing + analysis | ml/datasets, ml/evaluation |
| `experiments` | MLflow-style tracking | ml/models |
| `exports` | PDF/CSV/JSON/MD reports | reportlab |
| `workflow` | Pipeline orchestration | all apps |
| `monitoring` | Drift detection, usage stats | — |
| `analytics` | Cross-domain insights | ml/evaluation |

### ML Modules

| Module | Role |
|--------|------|
| `ml/nlp/pdf_parser.py` | PDF → text + chunking |
| `ml/nlp/ner_extractor.py` | Ensemble NER (regex + spaCy + transformer) |
| `ml/nlp/relation_extractor.py` | Regex + LLM relation extraction |
| `ml/llm/embeddings.py` | sentence-transformers wrapper |
| `ml/llm/chat.py` | LLM client (OpenAI/Groq/HF) |
| `ml/llm/rag_pipeline.py` | ChromaDB + retrieval + RAG |
| `ml/datasets/loaders.py` | 7-domain dataset registry |
| `ml/features/featurizers.py` | Universal + domain-specific featurization |
| `ml/models/universal_trainer.py` | Train + predict for any domain |
| `ml/models/tuning.py` | Optuna hyperparameter optimization |
| `ml/models/explainability.py` | SHAP + permutation importance |
| `ml/models/uncertainty.py` | Conformal + bootstrap + quantile intervals |
| `ml/evaluation/analyzer.py` | Dataset statistics + quality scoring |

---

## Request Lifecycle

### Example: User predicts LiFePO4 capacity

```
1. User visits /domains/battery/
   → GET request → Django routes to domains.domain_detail_view
   → Renders templates/domains/detail.html with domain info + trained models

2. User fills form (formula=LiFePO4, target=capacity_mah_g, ...) and clicks Predict
   → POST /api/domains/api/predict/
   → Django routes to domains.predict_view
   → PredictRequestSerializer validates input
   → Calls ml.models.universal_trainer.predict(domain, target, **kwargs)
     → load_model_bundle("battery", "capacity_mah_g", "random_forest")
       → Loads ml/models/saved/battery/capacity_mah_g_random_forest.pkl
       → (If missing, trains on the fly)
     → featurize_battery("LiFePO4", "sol-gel", 700)
       → parse_formula → element counts → fractions
       → 94-dim feature vector (27 element fractions + stats + one-hots + temp)
     → model.predict(X) → scalar prediction
     → CI = pred ± 1.96 × RMSE
   → Returns JSON {prediction: 157.2, confidence_low: 120, confidence_high: 195, metrics: {r2: 0.565, rmse: 19}}

3. Frontend renders result + automatically calls /api/domains/api/explain/
   → explain_prediction(domain, target, algorithm, input_features)
   → Tries SHAP TreeExplainer (works for RF/GBM/XGBoost/LightGBM)
   → Returns top 15 feature contributions with SHAP values
   → Frontend renders horizontal bar chart

Total latency: ~200ms (model load cached) to ~5s (first-time training)
```

This is repeated for any of the 7 domains × 6 targets × 8 algorithms = 168 prediction configurations.

---

## Key Design Decisions

### Why 7 separate domains instead of 1 unified model?
Each material domain has fundamentally different features:
- **Battery**: synthesis method, temperature
- **Alloys**: processing method, heat treatment
- **Polymers**: SMILES, molecular weight
- **Semiconductors**: crystal structure, doping type
- **Catalysts**: catalyst type, support material
- **Solar**: cell type, deposition method
- **Hydrogen**: storage mechanism, particle size

A single model would require massive feature engineering and would perform worse than specialized models.

### Why unified `domains` app instead of 7 separate apps?
The 7 domains share 90% of the logic (train, predict, analyze, explain). Duplicating this 7 times would be a maintenance nightmare. The unified app uses a `DOMAIN_REGISTRY` dict to dispatch to the right featurizer/dataset.

### Why ensemble NER?
- Regex catches exact patterns (formulas, units) with high precision
- spaCy catches general scientific entities
- Transformer (MatSciBERT) catches domain-specific entities with high recall
- Merging gives best of all three

### Why ChromaDB for vector storage?
- Local-first (no external service required for dev)
- Persistent (survives restarts)
- Python-native (integrates with sentence-transformers)
- Easy to swap for Pinecone/Weaviate in production

### Why Optuna for hyperparameter tuning?
- Bayesian optimization (TPE sampler) — more efficient than grid search
- Pruning of bad trials — saves compute
- Easy to extend to multi-objective optimization
