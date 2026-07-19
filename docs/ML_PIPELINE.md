# ML Pipeline Documentation

This document explains every component of the MatDiscoverAI ML pipeline in depth: parsing, NER, relation extraction, knowledge graph, embeddings, RAG, and property prediction models.

## Table of contents

1. [PDF parsing & chunking](#1-pdf-parsing--chunking)
2. [Named Entity Recognition (NER)](#2-named-entity-recognition-ner)
3. [Relation extraction](#3-relation-extraction)
4. [Knowledge graph construction](#4-knowledge-graph-construction)
5. [Vector embeddings & indexing](#5-vector-embeddings--indexing)
6. [RAG (Retrieval-Augmented Generation)](#6-rag-retrieval-augmented-generation)
7. [ML property prediction models](#7-ml-property-prediction-models)
8. [Training & evaluation](#8-training--evaluation)
9. [How to extend the ML pipeline](#9-how-to-extend-the-ml-pipeline)

---

## 1. PDF parsing & chunking

**File:** `ml/nlp/pdf_parser.py`

### PDF parsing

Two parsers are tried in order:

1. **pdfplumber** (primary) — better at extracting structured text, handles complex layouts
2. **pypdf** (fallback) — simpler, faster, sometimes works when pdfplumber fails

```python
def parse_pdf(file_path_or_bytes) -> str:
    if isinstance(file_path_or_bytes, (bytes, bytearray)):
        return _parse_pdf_bytes(file_path_or_bytes)
    return _parse_pdf_file(Path(file_path_or_bytes))
```

### Text cleaning

After extraction, light normalization is applied:

- **De-hyphenation**: `ther-\nal` → `thermal` (regex: `re.sub(r"-\s*\n\s*", "", text)`)
- **Whitespace collapse**: multiple spaces → single space (preserves newlines)
- **Page number removal**: `Page 12 of 24` lines stripped
- **DOI line removal**: `doi:10.xxxx/...` lines stripped

### Section detection

Section headers are detected via regex patterns:

```python
SECTION_PATTERNS = {
    "abstract": r"^\s*(abstract|summary)\s*[:.]?\s*$",
    "introduction": r"^\s*(1\.?\s*)?introduction\s*$",
    "methods": r"^\s*((\d+\.?\s*)?(methods?|experimental|materials and methods?|methodology))\s*$",
    "results": r"^\s*((\d+\.?\s*)?(results?|results and discussion))\s*$",
    "discussion": r"^\s*((\d+\.?\s*)?discussion)\s*$",
    "conclusion": r"^\s*((\d+\.?\s*)?conclusions?)\s*$",
    "references": r"^\s*references\s*$",
}
```

This lets us tag each chunk with its section (e.g. `methods`, `results`) — useful for filtering in RAG queries.

### Chunking

Sliding-window chunker with overlap:

```python
def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> list[str]:
    # Extend chunk to nearest sentence boundary if possible
    # Walk: start=0, end=800, next start=680 (800-120), ...
```

- Default `chunk_size=800` characters (~200 tokens, fits comfortably in embedding model context)
- Default `overlap=120` characters (~30 tokens, ensures continuity across chunks)
- Sentence-boundary extension: if a chunk ends mid-sentence, extend to the next `.` to avoid cutting sentences

---

## 2. Named Entity Recognition (NER)

**File:** `ml/nlp/ner_extractor.py`

### Ensemble strategy

Three extractors run in parallel; results are merged:

| Extractor | Library | Coverage | Cost |
|-----------|---------|----------|------|
| RegexEntityExtractor | pure Python | Chemical formulas, temperatures, properties, metrics, synthesis methods, measurement techniques, applications | Zero |
| SpacyEntityExtractor | spaCy `en_core_sci_sm` | General scientific entities | Small model |
| TransformerEntityExtractor | HuggingFace `allenai/scibert_scivocab_uncased` (or MatSciBERT) | Domain-specific | Heavy |

### Regex patterns

Curated patterns for materials science:

```python
REGEX_PATTERNS = {
    "CHEMICAL_FORMULA": [
        r"\b[A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*){1,}(?:O\d?)?\b",  # generic
        r"\bLiFePO4\b", r"\bLiCoO2\b", r"\bLiMn2O4\b", ...      # common
    ],
    "TEMPERATURE": [r"\b\d+(?:\.\d+)?\s*(?:°C|℃|K|degrees?\s*Celsius?)\b"],
    "PROPERTY": [r"\b(?:capacity|specific capacity|energy density|...)\b"],
    "METRIC": [r"\b\d+(?:\.\d+)?\s*(?:mAh/g|Wh/kg|V|S/cm|mS/cm|%)"],
    "SYNTHESIS_METHOD": [r"\b(?:sol[- ]gel|hydrothermal|...)\b"],
    "MEASUREMENT": [r"\b(?:XRD|XPS|SEM|TEM|EDS|...)\b"],
    "APPLICATION": [r"\b(?:lithium[- ]ion batter\w+|supercapacitor\w*|...)\b"],
    "MATERIAL": [r"\b(?:cathode|anode|electrolyte|separator|...)\b"],
}
```

### spaCy extractor

Loads `en_core_sci_sm` (SciSpacy) on first use. General scientific entities are mapped to our taxonomy:

```python
def _map_spacy_label(label: str) -> str:
    return {
        "CHEMICAL": "CHEMICAL_FORMULA",
        "ENTITY": "MATERIAL",
        "ORG": "EQUIPMENT",
        "QUANTITY": "METRIC",
    }.get(label, "MATERIAL")
```

### Transformer extractor

Loads HuggingFace token-classification pipeline:

```python
self._pipe = pipeline(
    "token-classification",
    model="allenai/scibert_scivocab_uncased",
    aggregation_strategy="simple",
)
```

Disabled by default (heavy). Enable in `EnsembleEntityExtractor(use_transformer=True)`.

### Merge & de-duplication

Overlapping entities are resolved by keeping the highest-confidence candidate:

```python
def _dedup_overlapping(candidates):
    candidates.sort(key=lambda c: (c.start, -c.confidence, -(c.end - c.start)))
    result = []
    last_end = -1
    for c in candidates:
        if c.start >= last_end:
            result.append(c)
            last_end = c.end
        elif c.confidence > result[-1].confidence:
            result[-1] = c
            last_end = c.end
    return result
```

### Entity types

| Type | Examples |
|------|----------|
| `MATERIAL` | cathode, anode, electrolyte, separator |
| `CHEMICAL_FORMULA` | LiFePO4, LiCoO2, MoS2 |
| `PROPERTY` | capacity, energy density, voltage |
| `SYNTHESIS_METHOD` | sol-gel, hydrothermal, ball-milling |
| `PROCESS_PARAMETER` | pH, atmosphere, dwell time |
| `TEMPERATURE` | 700°C, 298K |
| `APPLICATION` | lithium-ion battery, supercapacitor |
| `EQUIPMENT` | XRD, SEM, TEM |
| `MEASUREMENT` | XRD, XPS, EIS |
| `METRIC` | 165 mAh/g, 3.5V |

---

## 3. Relation extraction

**File:** `ml/nlp/relation_extractor.py`

### Two extractors

#### RegexRelationExtractor

Sentence-level pattern matching:

```python
RELATION_PATTERNS = [
    # (subject_type, regex, relation_type, object_type, extractor_name)
    ("CHEMICAL_FORMULA",
     r"(.+?)\s+(?:exhibit\w*|show\w*|achiev\w*|has|have)\s+(?:specific\s+)?(capacity|...)\s+of\s+([\d.]+\s*(?:mAh/g|...))",
     "HAS_PROPERTY", "METRIC", "regex_capacity"),
    ("CHEMICAL_FORMULA",
     r"(.+?)\s+(?:was|were)\s+(?:synthesized|prepared)\s+(?:by|via)\s+(sol-gel|hydrothermal|...)",
     "SYNTHESIZED_BY", "SYNTHESIS_METHOD", "regex_synth"),
    # ... 5 more patterns
]
```

Plus a **co-occurrence fallback**: if a MATERIAL and a PROPERTY appear in the same sentence, link them with `HAS_PROPERTY` (lower confidence).

#### LLMRelationExtractor (optional)

Zero-shot relation extraction via LLM:

```python
PROMPT_TEMPLATE = """You are a materials-science information extractor.

Given the following sentence from a research paper, extract all (subject, relation, object) triples.

Allowed relation types:
- HAS_PROPERTY, SYNTHESIZED_BY, MEASURED_BY, USED_IN, DOPED_WITH, REACTS_WITH, IMPROVES, DEGRADES

Sentence:
\"\"\"{sentence}\"\"\"

Return ONLY a JSON list of triples.
"""
```

The LLM extracts triples from each sentence; results are parsed as JSON. Higher recall but lower precision than regex (and costs API tokens).

### Relation types

| Type | Example |
|------|---------|
| `HAS_PROPERTY` | (LiFePO4) → (capacity 170 mAh/g) |
| `SYNTHESIZED_BY` | (LiFePO4) → (sol-gel) |
| `MEASURED_BY` | (LiFePO4) → (XRD) |
| `USED_IN` | (LiFePO4) → (lithium-ion battery) |
| `DOPED_WITH` | (NCM811) → (Zr) |
| `REACTS_WITH` | (Li metal) → (electrolyte) |
| `IMPROVES` | (carbon coating) → (conductivity) |
| `DEGRADES` | (volume expansion) → (cycle life) |

---

## 4. Knowledge graph construction

**File:** `backend/apps/knowledge_graph/services.py`

### Graph building

```python
def build_graph_from_papers(paper_ids=None, save_snapshot=True) -> nx.MultiDiGraph:
    G = nx.MultiDiGraph()
    # 1. Add all entities as nodes
    for e in Entity.objects.all():
        node_id = e.normalized or e.text
        G.add_node(node_id, label=e.text, type=e.entity_type, papers=set(), mention_count=0)
        G.nodes[node_id]["papers"].add(e.paper_id)
        G.nodes[node_id]["mention_count"] += 1

    # 2. Add all relations as edges
    for r in Relation.objects.all():
        s_id = subj.normalized or subj.text
        o_id = obj.normalized or obj.text
        G.add_edge(s_id, o_id, relation=r.relation_type, confidence=r.confidence, evidence=r.evidence, paper_id=r.paper_id)

    # 3. Convert sets to lists (for JSON)
    # 4. Save snapshot
    GraphSnapshot.objects.create(node_count=G.number_of_nodes(), edge_count=G.number_of_edges(), graph_json=graph_to_json(G))

    # 5. Aggregate Material rows
    _sync_materials_from_graph(G)
```

### Why MultiDiGraph?

- **Multi** — multiple edges between same pair (e.g. LiFePO4 HAS_PROPERTY capacity AND HAS_PROPERTY voltage)
- **Di** (directed) — relations have direction (subject → object)

### Material aggregation

For each node of type `MATERIAL` or `CHEMICAL_FORMULA`, upsert a `Material` row:

```python
for n, d in G.nodes(data=True):
    if d.get("type") not in ("MATERIAL", "CHEMICAL_FORMULA"):
        continue
    material, _ = Material.objects.update_or_create(name=d.get("label", n), ...)
    material.mentioned_in.add(*papers)
```

This creates a **canonical materials catalog** aggregated across all papers.

### Recommendation

Score materials by how strongly they co-occur with a target property:

```python
def recommend_materials(G, target_property, top_k=10):
    # Find all PROPERTY/METRIC nodes matching target_property
    property_nodes = [n for n, d in G.nodes(data=True)
                      if d.get("type") in ("PROPERTY", "METRIC") and target_property in n.lower()]

    # For each property node, sum confidence of all incoming/outgoing edges
    scores = defaultdict(float)
    for pn in property_nodes:
        for material_node in G.predecessors(pn):
            for k, d in G.get_edge_data(material_node, pn).items():
                scores[material_node] += d.get("confidence", 0.5)
    return sorted(scores.items(), key=lambda x: -x[1])[:top_k]
```

---

## 5. Vector embeddings & indexing

**File:** `ml/llm/embeddings.py`, `ml/llm/rag_pipeline.py`

### Embedding model

Default: `sentence-transformers/all-MiniLM-L6-v2`

- **Dimension**: 384
- **Model size**: ~80 MB
- **Speed**: ~100 sentences/sec on CPU
- **Quality**: Good for general English; decent for scientific text

Upgrade options:
- `PractELI/MatSciBERT` — materials-tuned, heavier
- `sentence-transformers/all-mpnet-base-v2` — better quality, slower

```python
def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()  # singleton
    vectors = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return [list(map(float, v)) for v in vectors]
```

### ChromaDB vector store

Persistent local vector database:

```python
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="matdiscoverai_papers",
    metadata={"hnsw:space": "cosine"},
)
```

- **Cosine distance** — best for semantic similarity
- **HNSW index** — approximate nearest neighbor, fast queries
- **Persistent** — survives restarts

### Indexing flow

For each paper:

1. Get all `PaperChunk` rows (created during extraction)
2. Embed all chunk texts → 384-d vectors
3. Upsert to ChromaDB:

```python
collection.upsert(
    ids=[f"paper{paper_id}-chunk{c.chunk_index}" for c in chunks],
    embeddings=embeddings,
    documents=texts,
    metadatas=[{"paper_id": ..., "section": ..., "title": ...} for c in chunks],
)
```

4. Update paper status to `indexed`

---

## 6. RAG (Retrieval-Augmented Generation)

**File:** `ml/llm/rag_pipeline.py`

### End-to-end flow

```
Question: "What is the capacity of LiFePO4?"
    │
    ▼
1. Embed question → 384-d vector
    │
    ▼
2. ChromaDB.query(query_embeddings=[vec], n_results=5)
    → Returns top-5 most similar chunks
    │
    ▼
3. Build prompt:
   "You are MatDiscoverAI, an AI research assistant...
    Use ONLY the following retrieved context to answer the question.
    Cite sources by their [number].
    CONTEXT:
    [1] LiFePO4 (LFP) is a widely used cathode material...
    [2] ...
    QUESTION: What is the capacity of LiFePO4?
    ANSWER:"
    │
    ▼
4. LLM.complete(prompt) → answer text
    │
    ▼
5. Return {answer, sources: [{paper_id, section, snippet}, ...]}
```

### Hybrid search

Combine vector + keyword search for better recall:

```python
def hybrid_search(query, top_k=10):
    # Vector results from ChromaDB
    vector_results = retrieve(query, top_k)

    # Keyword results from Django ORM
    keywords = query.split()
    qs = PaperChunk.objects.none()
    for kw in keywords:
        if len(kw) >= 3:
            qs = qs | PaperChunk.objects.filter(text__icontains=kw)
    keyword_chunks = qs.distinct()[:top_k]

    # Merge + de-dup
    ...
```

This catches cases where the embedding model misses an exact keyword match (e.g. searching for "LiFePO4" returns chunks that mention it explicitly even if the embedding similarity is low).

### Source citation

Every answer includes the source chunks:

```json
{
  "answer": "LiFePO4 has a specific capacity of 165 mAh/g [1]...",
  "sources": [
    {
      "paper_id": 2,
      "chunk_index": 3,
      "section": "abstract",
      "title": "Sol-gel synthesis of LiFePO4/C composite cathode...",
      "snippet": "LiFePO4 (LFP) is a widely used cathode material known for..."
    }
  ]
}
```

This makes every answer **verifiable** — users can click through to the source paper.

---

## 7. ML property prediction models

**File:** `ml/models/train_property_predictor.py`

### Feature engineering

For each (formula, synthesis_method, synthesis_temp), compute a 38-dim feature vector:

#### Element fractions (27 features)

Parse formula → element counts → fractions:

```python
def parse_formula(formula):
    # 'Li1.2Mn0.6Ni0.2O2' → {'Li': 1.2, 'Mn': 0.6, 'Ni': 0.2, 'O': 2}
    pattern = r"([A-Z][a-z]?)(\d*\.?\d*)"
    ...

def featurize_composition(formula, synthesis_method, synthesis_temp_c):
    counts = parse_formula(formula)
    total = sum(counts.values())
    fractions = {el: counts.get(el, 0) / total for el in ELEMENTS}  # 27 elements
```

Supported elements: Li, Na, K, Mg, Ca, Al, Si, Ti, V, Cr, Mn, Fe, Co, Ni, Cu, Zn, Mo, W, Sn, Pb, C, N, P, S, O, F, Cl

#### Composition stats (2 features)

- `mean_atomic_number` — average atomic number of elements (weighted by fraction)
- `std_atomic_number` — std deviation (captures compositional complexity)

#### Synthesis method one-hot (8 features)

```python
SYNTHESIS_METHODS = [
    "sol-gel", "hydrothermal", "solid-state", "ball-milling",
    "co-precipitation", "spray-drying", "electrospinning", "combustion",
]
# → 8 binary features
```

#### Synthesis temperature (2 features)

- `synthesis_temp_c` — raw value
- `synthesis_temp_norm` — normalized to [0, 1] by dividing by 1500

**Total: 27 + 2 + 8 + 2 = 39 features** (one is dropped due to collinearity → 38)

### Algorithms

| Algorithm | Library | When to use |
|-----------|---------|-------------|
| `random_forest` | scikit-learn | Default; robust, good with small data |
| `gradient_boosting` | scikit-learn | Slightly better than RF on tabular data |
| `xgboost` | xgboost | Best performance; requires `pip install xgboost` |
| `linear` | scikit-learn | Baseline; for sanity-checking |

### Training

```python
def train_model(target, algorithm="random_forest", save=True):
    df = load_dataset()  # ml/data/battery_materials_sample.csv
    X, targets = build_feature_matrix(df)
    y = targets[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=300, max_depth=12, random_state=42, n_jobs=-1)
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

    # Save bundle
    pickle.dump({
        "model": model,
        "feature_columns": list(X.columns),
        "target": target,
        "algorithm": algorithm,
        "metrics": metrics,
        "trained_on": str(df.shape),
    }, open(f"ml/models/saved/{target}_{algorithm}.pkl", "wb"))
```

### Inference

```python
def predict_property(target, formula, synthesis_method="solid-state",
                     synthesis_temp_c=700.0, algorithm="random_forest"):
    bundle = load_model(target, algorithm)
    model = bundle["model"]
    feature_cols = bundle["feature_columns"]

    feats = featurize_composition(formula, synthesis_method, synthesis_temp_c)
    X = pd.DataFrame([[feats.get(c, 0.0) for c in feature_cols]], columns=feature_cols)
    pred = float(model.predict(X)[0])

    # 95% CI from training-set RMSE
    rmse = bundle["metrics"].get("rmse", 0.0)
    return {
        "prediction": round(pred, 3),
        "confidence_low": round(pred - 1.96 * rmse, 3),
        "confidence_high": round(pred + 1.96 * rmse, 3),
        "metrics": bundle["metrics"],
    }
```

### Targets

| Target | Unit | Range | Typical R² achieved |
|--------|------|-------|---------------------|
| `capacity_mah_g` | mAh/g | 0–4200 | 0.85–0.92 |
| `cycle_life` | cycles | 0–5000 | 0.75–0.85 |
| `voltage_v` | V | 0–4 | 0.80–0.88 |
| `energy_density_wh_kg` | Wh/kg | 0–2600 | 0.85–0.92 |
| `safety_score` | 0–1 | 0.4–0.98 | 0.70–0.80 |
| `cost_usd_kg` | USD/kg | 6–200 | 0.80–0.88 |

(R² values are 5-fold cross-validation on the 40-row sample dataset. With more data, expect +0.05–0.10.)

---

## 8. Training & evaluation

### Training a single model

```bash
python manage.py train_models --target=capacity_mah_g
```

Or via API:

```bash
curl -X POST https://your-app.com/api/predictions/api/train/ \
  -H "Content-Type: application/json" \
  -d '{"target": "capacity_mah_g", "algorithm": "random_forest"}'
```

### Training all 6 models

```bash
python manage.py train_models
```

Takes ~30 seconds total on a 40-row dataset (CPU).

### Evaluation metrics

For each model, we compute:

- **RMSE** (Root Mean Squared Error) — primary; lower is better
- **MAE** (Mean Absolute Error) — robust to outliers
- **R²** (coefficient of determination) — primary; higher is better (1.0 = perfect)
- **5-fold CV R² mean ± std** — robustness indicator

### Feature importance

After training a Random Forest, you can inspect feature importance:

```python
from ml.models.train_property_predictor import load_model
bundle = load_model("capacity_mah_g", "random_forest")
model = bundle["model"]
importance = sorted(zip(bundle["feature_columns"], model.feature_importances_), key=lambda x: -x[1])
print(importance[:10])
# [('frac_Li', 0.18), ('synthesis_temp_c', 0.12), ('frac_Fe', 0.10), ...]
```

### Saving & loading

Models are saved as pickle bundles at `ml/models/saved/{target}_{algorithm}.pkl`:

```python
{
    "model": <sklearn model>,
    "feature_columns": [...],
    "target": "capacity_mah_g",
    "algorithm": "random_forest",
    "metrics": {"rmse": 8.82, "r2": 0.91, ...},
    "trained_on": "(40, 9)",
}
```

Loaded on-demand at prediction time. If the file doesn't exist, the model trains on-the-fly (one-time cost ~5s).

---

## 9. How to extend the ML pipeline

### Add a new entity type

1. Add regex patterns in `ml/nlp/ner_extractor.py::REGEX_PATTERNS`:
   ```python
   REGEX_PATTERNS["NEW_TYPE"] = [r"\b..."]
   ```
2. Add to `Entity.ENTITY_TYPES` in `backend/apps/extraction/models.py`
3. Add a CSS class in `static/css/app.css`:
   ```css
   .entity-NEW_TYPE { background: #...; color: #...; }
   ```
4. Run migrations: `python manage.py makemigrations && python manage.py migrate`

### Add a new relation type

1. Add a regex pattern in `ml/nlp/relation_extractor.py::RELATION_PATTERNS`
2. Add to `Relation.RELATION_TYPES` in `backend/apps/extraction/models.py`
3. Migrate

### Add a new ML target

1. Add column to `ml/data/battery_materials_sample.csv` (e.g. `thermal_conductivity_w_mk`)
2. Add target to `ML_SETTINGS["PROPERTY_TARGETS"]` in `backend/settings.py`
3. Add to `PredictionRequest.TARGET_CHOICES` in `backend/apps/predictions/models.py`
4. Migrate
5. Train: `python manage.py train_models --target=thermal_conductivity_w_mk`

### Add a new algorithm

1. Add branch in `train_model()`:
   ```python
   elif algorithm == "lightgbm":
       import lightgbm as lgb
       model = lgb.LGBMRegressor(n_estimators=400, max_depth=6, random_state=42)
   ```
2. Add option to the frontend dropdown in `templates/predictions/predict.html`

### Plug in a real dataset

1. Download from Materials Project / OQMD / AFLOW (see `docs/DATASET.md`)
2. Save as CSV in `ml/data/`
3. Update `ML_SETTINGS["DATA_DIR"]` if needed
4. Retrain: `python manage.py train_models`

### Add a graph neural network

Replace `recommend_materials()` in `backend/apps/knowledge_graph/services.py`:

```python
import torch
from torch_geometric.nn import GCNConv

class MaterialGNN(torch.nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim):
        super().__init__()
        self.conv1 = GCNConv(in_dim, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, out_dim)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index).relu()
        return self.conv2(x, edge_index)

# Train on the existing KG; embed materials; recommend by similarity
```

### Add multimodal extraction (figures/tables)

1. Install `opencv-python`, `paddleocr` (or `google-cloud-vision`)
2. Add a `Figure` model in `backend/apps/extraction/models.py`
3. In `ml/nlp/pdf_parser.py`, extract images alongside text
4. Run OCR / chart parsing on images; add as additional PaperChunk rows

### Switch to Neo4j

1. Set `KG_SETTINGS["USE_NEO4J"] = True` in `backend/settings.py`
2. Set `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` env vars
3. Replace NetworkX calls in `backend/apps/knowledge_graph/services.py` with `neo4j` driver calls

```python
from neo4j import GraphDatabase
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
with driver.session() as session:
    session.run("CREATE (n:Material {name: $name})", name="LiFePO4")
```
