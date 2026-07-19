# Vercel Build Error Fix

## The error you got

```
Error: Failed to run "uv lock --python ...": Command failed: /usr/local/bin/uv lock --python ...
error: No `project` table found in: /vercel/path0/pyproject.toml
```

## Root cause

Vercel's Python builder (using `uv`) reads `pyproject.toml` and expects a `[project]` table. Our original `pyproject.toml` only had `[tool.*]` sections (black, isort, ruff, pytest) — no `[project]` table.

## What I fixed

### 1. Added `[project]` table to `pyproject.toml`

```toml
[project]
name = "matdiscoverai"
version = "1.0.0"
description = "..."
requires-python = ">=3.11"
dependencies = []  # Empty — Vercel uses requirements-vercel.txt

[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"
```

### 2. Created `requirements-vercel.txt` (lighter deps)

Vercel has a **250MB function size limit**. The full `requirements.txt` (with torch, transformers, chromadb, sentence-transformers) exceeds this. So I created a lighter version that excludes heavy ML libs — the app falls back to:
- Regex NER (instead of transformer NER)
- RandomForest (instead of XGBoost/LightGBM)
- Stub responses (if no LLM API key)

### 3. Created `backend/settings_vercel.py`

Vercel-optimized Django settings:
- `CELERY_TASK_ALWAYS_EAGER=True` (no broker needed)
- `DISABLE_TRANSFORMER_NER=True` (skips heavy model loading)
- `STATIC_ROOT="/tmp/staticfiles"` (Vercel's writable dir)
- SQLite in `/tmp` if no `DATABASE_URL` set
- Allows `.vercel.app` and `.now.sh` hosts

### 4. Updated `vercel.json`

Points to the Vercel settings module and includes all necessary files in the bundle.

### 5. Created `build.sh`

Vercel build script that:
- Generates sample datasets
- Collects static files
- Runs migrations (if DB reachable)
- Seeds initial data + runs extraction + builds KG

### 6. Created `.python-version`

Pins Python 3.12 (Vercel requires this).

### 7. Created `.vercelignore`

Excludes heavy files (docs, tests, Docker configs) from the deployment bundle.

### 8. Created `docs/VERCEL_DEPLOYMENT.md`

Comprehensive Vercel deployment guide with troubleshooting.

### 9. Updated `.gitignore`

Removed `*.pkl` exclusion so pre-trained ML models can be committed (Vercel needs them — can't train on serverless).

---

## How to deploy (step-by-step)

### Step 1: Pull the fixes

```bash
cd Materials-Discovery-Intelligence-Platform
git pull origin main  # or unzip the new matdiscoverai.zip
```

### Step 2: Pre-train models locally (CRITICAL — Vercel can't train)

```bash
# Install FULL dependencies locally (not the Vercel ones)
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env: set DJANGO_SECRET_KEY to any 50-char string

# Initialize database
python manage.py migrate

# Generate datasets
python manage.py generate_datasets

# Train ALL 42+ ML models (takes ~5 minutes)
python manage.py train_all_domains

# Verify models exist
ls ml/models/saved/
# Should show: battery/ alloys/ polymers/ semiconductors/ catalysts/ solar/ hydrogen/
find ml/models/saved/ -name "*.pkl" | wc -l
# Should show: 42+ files
```

### Step 3: Commit the .pkl files

```bash
git add ml/models/saved/
git add pyproject.toml requirements-vercel.txt vercel.json backend/settings_vercel.py build.sh .python-version .vercelignore docs/VERCEL_DEPLOYMENT.md .gitignore
git commit -m "Fix Vercel deployment: add [project] table, Vercel settings, build script"
git push origin main
```

### Step 4: Set Vercel environment variables

In Vercel → your project → Settings → Environment Variables, add:

| Key | Value |
|-----|-------|
| `DJANGO_SECRET_KEY` | (generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
| `DJANGO_DEBUG` | `False` |
| `DATABASE_URL` | (Neon Postgres URL — see below) |
| `OPENAI_API_KEY` | `sk-...` (optional, for LLM chat) |
| `GROQ_API_KEY` | `gsk_...` (free alternative — console.groq.com) |

### Step 5: Set up Neon Postgres (recommended)

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Create project → copy connection string
3. Paste as `DATABASE_URL` in Vercel env vars

### Step 6: Run migrations against production DB

```bash
# Set the production DATABASE_URL locally
export DATABASE_URL="postgres://user:pass@ep-xxx.region.aws.neon.tech/matdiscoverai?sslmode=require"

# Run migrations
python manage.py migrate

# Load sample data
python manage.py seed_data
python manage.py extract_all
python manage.py build_kg
```

### Step 7: Deploy

In Vercel dashboard → click **Redeploy**. The build should now succeed:

```
✓ pyproject.toml has [project] table
✓ uv lock succeeds
✓ Dependencies installed from requirements-vercel.txt
✓ build.sh runs (collectstatic + migrate + seed)
✓ Function deployed
```

Visit your Vercel URL — the app should work!

---

## What will work on Vercel

- ✅ All 27 web pages (home, dashboard, domains, datasets, etc.)
- ✅ All 60+ REST API endpoints
- ✅ Django admin
- ✅ Predictions for all 7 domains (using pre-trained RandomForest models)
- ✅ Knowledge graph visualization
- ✅ Regex NER (chemical formulas, properties, synthesis methods)
- ✅ LLM chat (if OPENAI_API_KEY or GROQ_API_KEY set)
- ✅ Dataset analysis
- ✅ Experiment tracking (with Postgres DB)
- ✅ Cross-domain analytics

## What won't work on Vercel

- ❌ ML model training (60s timeout) — pre-train locally
- ❌ ChromaDB persistence (vectors lost between requests)
- ❌ Transformer NER (MatSciBERT too heavy)
- ❌ XGBoost/LightGBM predictions (libs not in requirements-vercel.txt)
- ❌ SHAP explanations (lib not in requirements-vercel.txt)
- ❌ Optuna hyperparameter tuning (lib not in requirements-vercel.txt)
- ❌ Async Celery tasks (runs synchronously, may timeout)

For full features, use Render — see `docs/DEPLOYMENT.md`.

---

## Quick verification

Before deploying, run this to verify the fix:

```bash
# Verify pyproject.toml has [project] table
python -c "import tomllib; data = tomllib.load(open('pyproject.toml','rb')); print('✓ [project] table found' if 'project' in data else '✗ MISSING')"

# Verify Django check passes with Vercel settings
DJANGO_SETTINGS_MODULE=backend.settings_vercel DJANGO_SECRET_KEY=test DJANGO_DEBUG=False python manage.py check

# Verify all Vercel files exist
ls pyproject.toml requirements-vercel.txt vercel.json backend/settings_vercel.py build.sh .python-version .vercelignore
```

All three should succeed. Then deploy to Vercel.

---

## Still have issues?

See `docs/VERCEL_DEPLOYMENT.md` for the full troubleshooting guide, or switch to Render (recommended for Django + ML) — see `docs/DEPLOYMENT.md`.
