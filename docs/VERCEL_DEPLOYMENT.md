# Vercel Deployment Guide

This guide walks you through deploying MatDiscoverAI to Vercel, including all the gotchas.

> ⚠️ **Important**: Vercel is a serverless platform optimized for Next.js / Node.js. Django can run there, but with **significant limitations**. For production Django, we recommend Render or Docker. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for alternatives.

---

## Table of Contents

1. [Vercel Limitations (read first!)](#1-vercel-limitations-read-first)
2. [What works on Vercel](#2-what-works-on-vercel)
3. [What doesn't work on Vercel](#3-what-doesnt-work-on-vercel)
4. [Step-by-step deployment](#4-step-by-step-deployment)
5. [Environment variables](#5-environment-variables)
6. [Database setup (Neon Postgres)](#6-database-setup-neon-postgres)
7. [Running migrations](#7-running-migrations)
8. [Pre-training models](#8-pre-training-models)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Vercel Limitations (read first!)

Vercel's serverless functions have these constraints:

| Limitation | Impact on MatDiscoverAI |
|------------|--------------------------|
| **No persistent filesystem** | ChromaDB local persistence won't work; ML `.pkl` files don't survive between requests |
| **60-second function timeout** | ML training jobs won't fit (training takes 30-60s per target × 42 targets = 30+ min) |
| **250MB function size limit** | Heavy ML libs (torch, transformers, chromadb) inflate the bundle; we exclude them |
| **No long-running workers** | Celery won't work; we use `CELERY_TASK_ALWAYS_EAGER=True` to run tasks synchronously |
| **Cold starts** | First request after idle takes 3-10s (Python runtime + Django setup) |
| **No WebSockets** | Real-time updates won't work; use polling instead |

**Workaround:** We've created `backend/settings_vercel.py` that:
- Disables Celery (tasks run synchronously via `CELERY_TASK_ALWAYS_EAGER=True`)
- Uses in-memory ChromaDB (persistence to `/tmp/chroma_db` which is per-invocation)
- Disables transformer NER (uses regex NER only — much lighter)
- Uses SQLite in `/tmp` if no `DATABASE_URL` is set
- Excludes heavy ML libs from the bundle (see `requirements-vercel.txt`)

---

## 2. What works on Vercel

- ✅ Django admin (read-only if using SQLite; full if using Postgres)
- ✅ REST API (papers list, materials list, predictions, chat)
- ✅ Template-rendered pages (home, dashboard, domains, datasets, etc.)
- ✅ JWT auth
- ✅ Postgres via Neon/Supabase
- ✅ Pre-trained ML model predictions (RandomForest, scikit-learn only)
- ✅ Knowledge graph (NetworkX, in-memory)
- ✅ Regex NER (extracts chemical formulas, properties, etc.)
- ✅ LLM chat (if you set `OPENAI_API_KEY` or `GROQ_API_KEY`)
- ✅ All 7 domain predictions (RandomForest only)

## 3. What doesn't work on Vercel

- ❌ Async Celery tasks (paper ingestion, extraction, indexing) — runs sync, may timeout
- ❌ ChromaDB local persistence — vectors don't persist between requests
- ❌ ML model training (exceeds 60s timeout)
- ❌ Transformer NER (MatSciBERT/SciBERT — too heavy)
- ❌ XGBoost, LightGBM, Optuna, SHAP (excluded from `requirements-vercel.txt`)
- ❌ Sentence-transformers embeddings (too heavy)
- ❌ Long-running workflows (use Render for these)

**Workaround**: Pre-train models locally, commit the `.pkl` files, deploy. The app will load them at runtime.

---

## 4. Step-by-step deployment

### Step 1: Push to GitHub

```bash
cd matdiscoverai
git init
git add .
git commit -m "Initial commit: MatDiscoverAI"
git remote add origin https://github.com/your-username/matdiscoverai.git
git push -u origin main
```

### Step 2: Pre-train models locally (CRITICAL)

Vercel can't train models (60s timeout). **Train them locally first**:

```bash
# On your local machine:
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set DJANGO_SECRET_KEY

python manage.py migrate
python manage.py generate_datasets
python manage.py seed_data
python manage.py extract_all
python manage.py build_kg
python manage.py train_all_domains  # This creates 42+ .pkl files in ml/models/saved/

# Verify the .pkl files exist:
ls ml/models/saved/*/
# Should show: battery/, alloys/, polymers/, semiconductors/, catalysts/, solar/, hydrogen/
```

**Important**: The `.gitignore` excludes `*.pkl` files by default. **Remove that exclusion** so the models get committed:

```bash
# Edit .gitignore and remove or comment out these lines:
# ml/models/saved/*.pkl
# *.pkl
# *.joblib

git add ml/models/saved/
git commit -m "Add pre-trained ML models for Vercel deployment"
git push
```

### Step 3: Create Vercel project

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `matdiscoverai` repository
4. Vercel auto-detects the framework (leave as "Other")
5. **DO NOT** override the build settings — `vercel.json` handles everything

### Step 4: Configure environment variables

In the Vercel project dashboard → **Settings** → **Environment Variables**, add:

| Key | Value | Required |
|-----|-------|----------|
| `DJANGO_SECRET_KEY` | (50+ char random string) | ✅ Yes |
| `DJANGO_DEBUG` | `False` | ✅ Yes |
| `DATABASE_URL` | (Neon Postgres URL — see step 6) | ✅ Yes (for persistence) |
| `OPENAI_API_KEY` | `sk-...` | 💡 Recommended |
| `GROQ_API_KEY` | `gsk_...` | 💡 Alternative (free tier) |
| `MATERIALS_PROJECT_API_KEY` | (from materialsproject.org) | Optional |
| `OPENALEX_EMAIL` | `your-email@example.com` | Optional |

Generate a secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 5: Deploy

Click **Deploy** in Vercel. The build process will:
1. Read `pyproject.toml` (validates project metadata)
2. Install dependencies from `requirements-vercel.txt`
3. Run `build.sh` which:
   - Generates sample datasets
   - Collects static files
   - Runs migrations (creates SQLite in `/tmp` if no `DATABASE_URL`)
   - Skips training (models are pre-trained and committed)

Build takes ~3-5 minutes. Once done, visit your Vercel URL.

### Step 6: Initialize the database

If using Postgres (recommended), run migrations from your local machine:

```bash
# Set the Vercel DATABASE_URL locally
export DATABASE_URL="postgres://user:pass@ep-xxx.region.aws.neon.tech/matdiscoverai?sslmode=require"

# Run migrations locally against the remote DB
python manage.py migrate

# Load sample data
python manage.py seed_data
python manage.py extract_all
python manage.py build_kg
```

If using SQLite (demo only — data is lost on each cold start), the app auto-migrates on first request via `build.sh`.

---

## 5. Environment variables

### Minimum required

```env
DJANGO_SECRET_KEY=django-insecure-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DJANGO_DEBUG=False
DATABASE_URL=postgres://user:pass@host:5432/dbname?sslmode=require
```

### Recommended (for full features)

```env
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=False
DATABASE_URL=...
OPENAI_API_KEY=sk-...                    # For LLM chat
GROQ_API_KEY=gsk_...                     # Free-tier LLM alternative
MATERIALS_PROJECT_API_KEY=...            # For live material data
OPENALEX_EMAIL=your-email@example.com    # Polite email for OpenAlex API
DEFAULT_DOMAIN_FOCUS=battery             # Default domain
```

---

## 6. Database setup (Neon Postgres)

Vercel doesn't include a database. Use **Neon** (recommended — free tier, serverless Postgres):

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Create a new project → name it `matdiscoverai`
3. Copy the **Connection string** (looks like `postgres://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
4. In Vercel → Settings → Environment Variables:
   - Key: `DATABASE_URL`
   - Value: (paste the Neon connection string)
5. Redeploy

**Alternative databases:**
- **Supabase** (free, Postgres + auth + storage) — [supabase.com](https://supabase.com)
- **Railway** (free tier, Postgres) — [railway.app](https://railway.app)
- **PlanetScale** (MySQL, free tier) — would require Django DB backend swap

---

## 7. Running migrations

Vercel's serverless functions are stateless, so migrations don't persist. Run them from your local machine against the production database:

```bash
# Set the production DATABASE_URL locally
export DATABASE_URL="postgres://user:pass@ep-xxx.region.aws.neon.tech/matdiscoverai?sslmode=require"

# Apply migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Load sample data
python manage.py seed_data

# Run extraction pipeline (may take 1-2 minutes)
python manage.py extract_all
python manage.py build_kg
```

**Note**: `train_all_domains` is already done locally (step 2) — the `.pkl` files are committed and bundled with the Vercel function.

---

## 8. Pre-training models

Models **must** be trained locally before deploying. The `.pkl` files are bundled with the Vercel function (they're under 250MB combined for RandomForest models).

### Verify model bundle size

```bash
du -sh ml/models/saved/
# Should be < 50MB for 42 RandomForest models
```

If too large, use smaller models:
```bash
# Edit ml/models/universal_trainer.py and change:
# RandomForestRegressor(n_estimators=300, ...) → n_estimators=100
python manage.py train_all_domains
```

### Re-training after dataset changes

If you update `ml/data/*/` CSVs:
1. Re-train locally: `python manage.py train_all_domains`
2. Commit the new `.pkl` files
3. Push to GitHub → Vercel auto-redeploys

---

## 9. Troubleshooting

### Error: `No project table found in pyproject.toml`
**Fix**: We've added a `[project]` table to `pyproject.toml`. Make sure it's committed.

### Error: `uv lock failed`
**Fix**: Vercel's new uv-based builder requires the `[project]` table. Verify `pyproject.toml` has it:
```toml
[project]
name = "matdiscoverai"
version = "1.0.0"
# ...
dependencies = []
```

### Error: `ModuleNotFoundError: No module named 'xgboost'` (or similar heavy ML lib)
**Cause**: `requirements-vercel.txt` excludes heavy ML libs to fit Vercel's 250MB limit.
**Fix**: The app should gracefully fall back to RandomForest. If you see this error in a prediction:
- The `universal_trainer.py` will fall back to `random_forest` automatically
- If you need XGBoost, deploy to Render instead

### Error: `Function timeout exceeded 60s`
**Cause**: A long-running operation (training, full extraction, RAG indexing).
**Fix**: These operations don't work on Vercel. Run them locally and commit the results.

### Error: `OperationalError: no such table: ...`
**Cause**: Migrations haven't been run on the production database.
**Fix**: Run migrations locally with `DATABASE_URL` set to your Vercel database:
```bash
export DATABASE_URL="postgres://..."
python manage.py migrate
```

### Error: `Static files 404`
**Fix**: Make sure `build.sh` ran `python manage.py collectstatic --noinput`. Check the Vercel build logs.

### Error: `CSRF verification failed`
**Fix**: Add your Vercel URL to `DJANGO_CSRF_TRUSTED_ORIGINS`:
```
DJANGO_CSRF_TRUSTED_ORIGINS=https://matdiscoverai.vercel.app,https://matdiscoverai-xxx.vercel.app
```

### Cold start takes 5-10 seconds
**Cause**: Python runtime + Django + scikit-learn + model loading on first request.
**Fix**: This is normal for serverless. To reduce:
- Use Vercel's `cron` to ping the endpoint every 5 minutes (keeps it warm)
- Switch to Render (no cold starts on the $7/mo plan)

### Predictions return stub responses
**Cause**: LLM not configured (no `OPENAI_API_KEY` or `GROQ_API_KEY`).
**Fix**: Set at least one LLM API key in Vercel env vars.

### ChromaDB errors (vector search not working)
**Cause**: Vercel's filesystem is read-only except `/tmp`. ChromaDB persists to `/tmp/chroma_db` but this is per-invocation.
**Fix**: RAG chat will not work properly on Vercel. Use Render for full RAG features.

---

## Vercel vs Render — which to choose?

| Feature | Vercel | Render |
|---------|--------|--------|
| **Cost (free tier)** | Yes (hobby) | Yes (limited) |
| **Cold starts** | Yes (3-10s) | No (always-on) |
| **Persistent filesystem** | ❌ No | ✅ Yes (disks) |
| **Long-running workers (Celery)** | ❌ No | ✅ Yes |
| **ML training on platform** | ❌ No (60s timeout) | ✅ Yes |
| **ChromaDB persistence** | ❌ No | ✅ Yes |
| **Postgres** | External (Neon) | Built-in |
| **ML lib bundle size** | 250MB limit | Unlimited |
| **Best for** | Static sites, Next.js | Django, ML apps |

**Recommendation**: Use Vercel only for demo/preview deployments. For production MatDiscoverAI, use Render (see [`DEPLOYMENT.md`](DEPLOYMENT.md)).

---

## Quick reference: Vercel file checklist

Before deploying, verify these files exist in your repo:

- ✅ `pyproject.toml` — has `[project]` table (fixes the uv error)
- ✅ `requirements-vercel.txt` — lighter dependency list
- ✅ `vercel.json` — Vercel build config
- ✅ `backend/settings_vercel.py` — Vercel-optimized Django settings
- ✅ `build.sh` — build script (migrations + collectstatic)
- ✅ `ml/models/saved/**/*.pkl` — pre-trained ML models (committed!)
- ✅ `ml/data/**/*.csv` — sample datasets (committed)
- ✅ `.python-version` — pins Python 3.12

Run this to verify:
```bash
ls pyproject.toml requirements-vercel.txt vercel.json backend/settings_vercel.py build.sh .python-version
ls ml/models/saved/  # should show 7 domain subdirectories with .pkl files
ls ml/data/          # should show 7 domain subdirectories with .csv files
```

---

## Need more help?

- Vercel Python docs: https://vercel.com/docs/functions/runtimes/python
- Vercel build errors: https://vercel.com/docs/troubleshooting
- For Django-specific issues, switch to Render: see [`DEPLOYMENT.md`](DEPLOYMENT.md)
