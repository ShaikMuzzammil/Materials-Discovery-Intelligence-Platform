# Dataset Documentation

This document describes every dataset used by MatDiscoverAI, where it comes from, how to extend it, and how to plug in real APIs.

## Datasets overview

| Dataset | Location | Size | Purpose | Source |
|---------|----------|------|---------|--------|
| Battery materials CSV | `ml/data/battery_materials_sample.csv` | 40 rows | Train ML property predictors | Synthetic, based on literature values |
| Sample papers | `scripts/seed_data.py` (in-code) | 8 papers | Demo extraction + KG + RAG | Synthetic abstracts, realistic content |
| MaterialRecords | `material_records` table | 6 rows | Demo material comparison | Synthesized from common knowledge |
| arXiv papers | `papers` table (runtime) | on-demand | Live research ingestion | arXiv API (free) |
| OpenAlex works | `papers` table (runtime) | on-demand | Live research ingestion | OpenAlex API (free) |
| CrossRef works | `papers` table (runtime) | on-demand | DOI lookup | CrossRef API (free) |
| Materials Project records | `material_records` table (runtime) | on-demand | Live material properties | Materials Project API (free key required) |

---

## 1. Battery materials sample CSV

### Location
`ml/data/battery_materials_sample.csv`

### Schema

| Column | Type | Unit | Range | Description |
|--------|------|------|-------|-------------|
| `formula` | string | — | — | Chemical formula (e.g. `Li1.2Mn0.6Ni0.2O2`) |
| `synthesis_method` | string | — | one of 12 | See method list below |
| `synthesis_temp_c` | float | °C | 25–3000 | Synthesis temperature |
| `capacity_mah_g` | float | mAh/g | 0–4200 | Specific discharge capacity |
| `cycle_life` | int | cycles | 0–5000 | Cycles to 80% capacity retention |
| `voltage_v` | float | V | 0–4.0 | Average discharge voltage vs Li/Li+ |
| `energy_density_wh_kg` | float | Wh/kg | 0–2600 | Cell-level energy density |
| `safety_score` | float | 0–1 | 0.4–0.98 | Heuristic safety score (LiFePO4=0.95, Li metal=0.4) |
| `cost_usd_kg` | float | USD/kg | 6–200 | Material cost |

### Synthesis methods
`sol-gel`, `solid-state`, `hydrothermal`, `co-precipitation`, `ball-milling`, `spray-drying`, `electrospinning`, `combustion`, `pyrolysis`, `evaporation`, `mechanochemical`, `in-situ polymerization`

### Materials covered (40 rows)

**Cathodes (Li-ion):**
- LiFePO4 (3 synthesis variants)
- LiCoO2 (2 variants)
- LiMn2O4 (2 variants)
- LiNi0.8Co0.1Mn0.1O2 (NCM811, 2 variants)
- LiNi0.6Co0.2Mn0.2O2 (NCM622)
- LiNi0.5Co0.2Mn0.3O2 (NCM532)
- Li1.2Mn0.6Ni0.2O2 (Li-rich, 2 variants)
- Li4Ti5O12 (LTO, 2 variants)
- V2O5 (2 variants)
- V2O5-rGO
- LiV3O8
- LiTi2(PO4)3

**Anodes (Li-ion):**
- Si (nano, PANI binder)
- Si-C composite
- Graphite
- Hard carbon
- Li metal
- SnO2
- MoS2 (2 variants)
- MoS2-rGO
- TiO2 (anatase + bronze)

**Cathodes (Na-ion):**
- Na3V2(PO4)2F3 (NVPF)
- Na3V2(PO4)3
- Na0.7Fe0.4Mn0.6O2
- Hard carbon (Na)

**Electrolytes:**
- Li7La3Zr2O12 (LLZO)
- Li6.4La3Zr1.4Ta0.6O12 (Ta-LLZO)
- Li2S-P2S5 glass
- Li3InCl6

**Li-S:**
- PANI-S
- S-KB
- Co-N-C/S

### How values were derived

Values are **synthesized but realistic**, drawn from:
- Theoretical capacities computed from Faraday's law: `C = nF / (3.6 × M)` where n = electrons transferred, F = 96485 C/mol, M = molar mass
- Cycle life, voltage, safety scores: typical values reported in literature reviews
- Energy density: `C × V` (capacity × voltage)
- Cost: 2024 market estimates from battery materials price trackers

**This is a synthetic dataset for demo purposes.** For real research, replace this CSV with data from:
- **Materials Project** (https://nextgen.materialsproject.org) — free API
- **OQMD** (http://oqmd.org) — Open Quantum Materials Database
- **AFLOW** (https://aflowlib.org) — high-throughput DFT database
- **Battery Data Genome** (https://batterydatagenerator.com)
- **Toyota Research Institute** battery datasets (published on GitHub)

### How to extend

Add new rows to `ml/data/battery_materials_sample.csv`:

```csv
LiFePO4,sol-gel,700,165,2000,3.45,580,0.95,15
YourNewFormula,sol-gel,800,180,1500,3.6,648,0.85,20
```

Then retrain:
```bash
python manage.py train_models
```

### How to replace with a real dataset

1. Download from Materials Project:
   ```python
   # scripts/download_mp.py
   import requests
   API_KEY = "your-mp-api-key"
   headers = {"X-API-KEY": API_KEY}
   # Search for battery materials
   resp = requests.get(
       "https://api.materialsproject.org/materials/search",
       headers=headers,
       params={"_fields": "formula_pretty,theoretical_capacity,average_voltage", "_limit": 1000}
   )
   ```

2. Save as CSV in `ml/data/` and update `ML_SETTINGS.DATA_DIR` if needed.

---

## 2. Sample papers

### Location
Defined inline in `scripts/seed_data.py` → `SAMPLE_PAPERS` list.

### Structure

Each paper is a dict with:
- `title` — paper title
- `abstract` — full abstract (500-1500 chars)
- `source` — always `"manual"` for seed data
- `doi` — fake but realistic-looking DOI
- `domains` — list of `["battery", "cathode"]` etc.
- `keywords` — list of keywords

### Papers included (8 total)

1. **Li-rich cathode Li1.2Mn0.6Ni0.2O2** — high capacity, surface modification, 250 mAh/g
2. **LiFePO4/C composite** — sol-gel synthesis, 165 mAh/g, rate capability
3. **Si anode with PANI binder** — 3000 mAh/g, 500 cycles, volume expansion
4. **LLZO solid electrolyte** — Ta-doped, 8×10⁻⁴ S/cm, dendrite suppression
5. **Na3V2(PO4)2F3 cathode** — Na-ion, 128 mAh/g, 500 Wh/kg, grid storage
6. **MoS2/rGO anode** — 1100 mAh/g, hydrothermal synthesis
7. **NCM811 Zr-doped** — thermal stability, 200 mAh/g, 89% retention @ 500 cycles
8. **Li-S with Co-N-C catalyst** — 1200 Wh/kg cell-level, polysulfide trapping

Each abstract contains:
- Realistic chemical formulas (regex NER picks these up)
- Realistic capacities, voltages, temperatures
- Synthesis methods (sol-gel, hydrothermal, etc.)
- Measurement techniques (XRD, XPS, SEM, TEM, EIS, CV)

This means **the entire pipeline works end-to-end on first launch** — extraction will find 50+ entities per paper, relations will be extracted, KG will have ~200 nodes, predictions will work on the formulas mentioned.

### How to add more papers

Edit `scripts/seed_data.py` → append to `SAMPLE_PAPERS`:

```python
SAMPLE_PAPERS = [
    # ... existing papers ...
    {
        "title": "Your new paper title",
        "abstract": "Abstract with formulas like LiFePO4 and temperatures like 700°C...",
        "source": "manual",
        "doi": "10.1000/your-doi",
        "domains": ["battery", "cathode"],
        "keywords": ["your", "keywords"],
    },
]
```

Then:
```bash
python manage.py seed_data
python manage.py extract_all
python manage.py build_kg
```

### How to ingest real papers

```bash
# From arXiv (no API key needed)
python manage.py ingest_arxiv "lithium battery cathode" --max 20

# From OpenAlex (no API key, polite email recommended)
# Set OPENALEX_EMAIL in .env first

# From CrossRef by DOI
# Use the API: POST /api/papers/api/jobs/ with query_type="doi_batch"
```

---

## 3. External data sources

### arXiv API
- **URL**: http://export.arxiv.org/api/query
- **Auth**: none required
- **Rate limit**: 1 request per 3 seconds (be polite)
- **Returns**: Atom XML feed with title, abstract, authors, PDF URL
- **Documentation**: https://info.arxiv.org/help/api/index.html

Implementation: `backend/apps/papers/services.py` → `search_arxiv()`

### OpenAlex API
- **URL**: https://api.openalex.org/works
- **Auth**: none (polite email in User-Agent recommended)
- **Rate limit**: 100k requests/day, 10/sec
- **Returns**: JSON with full metadata + inverted-index abstracts
- **Documentation**: https://docs.openalex.org

Implementation: `backend/apps/papers/services.py` → `search_openalex()`

### CrossRef API
- **URL**: https://api.crossref.org/works/{DOI}
- **Auth**: none (polite email in User-Agent recommended)
- **Rate limit**: 50/sec with polite email
- **Returns**: JSON with full metadata
- **Documentation**: https://api.crossref.org

Implementation: `backend/apps/papers/services.py` → `fetch_crossref()`

### Materials Project API
- **URL**: https://api.materialsproject.org/materials
- **Auth**: API key (free, register at https://nextgen.materialsproject.org)
- **Rate limit**: 1000 requests/day (free tier)
- **Returns**: JSON with material properties (band gap, density, formation energy, etc.)
- **Documentation**: https://api.materialsproject.org

Implementation: `backend/apps/materials/services.py` → `fetch_material_from_mp()`

### Semantic Scholar API (optional)
- **URL**: https://api.semanticscholar.org/graph/v1/paper/search
- **Auth**: optional API key for higher rate limit
- **Documentation**: https://api.semanticscholar.org

Not currently implemented in code; integration point is `backend/apps/papers/services.py`.

---

## 4. Data quality & ethics

### Data sources are open and citable
- arXiv papers: respect arXiv's license (arXiv non-exclusive license)
- OpenAlex: CC BY 4.0
- CrossRef: CC BY 4.0 metadata
- Materials Project: CC BY 4.0

### No personal data
The app does not collect personal data beyond:
- Email (for account creation)
- Institution, ORCID (optional, user-provided)
- Chat message content (stored in user's session)

### Provenance tracking
- Every `Paper` records its `source` and `source_id`
- Every `Entity` records its `extractor` (regex/spacy/transformer/llm)
- Every `Relation` records its `extractor` and `evidence` (source sentence)
- Every `PredictionRequest` records the `model_name`, `model_version`, and `inputs`

This means **every piece of knowledge in the system is traceable to its origin** — a key requirement for research-grade systems.
