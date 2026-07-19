# Deployment Guide

This document covers deploying MatDiscoverAI to Render (recommended), Docker, Vercel, and bare-metal VPS.

---

## Table of contents

1. [Render (recommended for Django)](#1-render-recommended-for-django)
2. [Docker (any host)](#2-docker-any-host)
3. [Vercel (frontend + serverless Python — with caveats)](#3-vercel-frontend--serverless-python--with-caveats)
4. [Bare-metal VPS](#4-bare-metal-vps)
5. [Post-deploy checklist](#5-post-deploy-checklist)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Render (recommended for Django)

Render supports Django natively with gunicorn + Postgres + Redis + worker processes. The included `render.yaml` Blueprint provisions everything in one click.

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: MatDiscoverAI"
git remote add origin https://github.com/your-username/matdiscoverai.git
git push -u origin main
```

### Step 2: Create Render Blueprint

1. Go to https://dashboard.render.com
2. Click **New +** → **Blueprint**
3. Select your GitHub repo
4. Render auto-detects `render.yaml` and shows the services to be created:
   - `matdiscoverai-web` (Django + gunicorn) — Starter plan ($7/mo)
   - `matdiscoverai-worker` (Celery) — Starter plan ($7/mo)
   - `matdiscoverai-redis` (Redis) — Free
   - `matdiscoverai-db` (PostgreSQL 16) — Starter ($7/mo)
5. Click **Apply**

### Step 3: Set secret env vars

In the Render dashboard, navigate to `matdiscoverai-web` → **Environment** → set:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-...` (your OpenAI key, or skip if using Groq) |
| `GROQ_API_KEY` | `gsk_...` (your Groq key, free at https://console.groq.com) |
| `MATERIALS_PROJECT_API_KEY` | (optional, from https://nextgen.materialsproject.org/api) |
| `OPENALEX_EMAIL` | `your-email@example.com` (polite email) |

Apply the same to `matdiscoverai-worker`.

### Step 4: Wait for first deploy

Render will:
1. Build the Docker image
2. Run `pip install -r requirements.txt`
3. Run `python manage.py collectstatic --noinput`
4. Run `python manage.py migrate`
5. Start gunicorn

Takes ~5-8 minutes on first deploy.

### Step 5: Initialize data

Open Render → `matdiscoverai-web` → **Shell**, then run:

```bash
python manage.py createsuperuser
# Enter email + password

python manage.py seed_data
python manage.py extract_all
python manage.py build_kg
python manage.py train_models
python manage.py index_all
```

### Step 6: Verify

- Visit `https://matdiscoverai-web.onrender.com/` — should show landing page with stats populated.
- Visit `https://matdiscoverai-web.onrender.com/admin/` — login with superuser.
- Try the chat at `https://matdiscoverai-web.onrender.com/chat/`.

### Step 7: Custom domain (optional)

Render → `matdiscoverai-web` → **Settings** → **Custom Domains** → add your domain. Update DNS CNAME as instructed.

### Cost estimate (Render)

| Service | Plan | Cost/month |
|---------|------|------------|
| Web (Django) | Starter | $7 |
| Worker (Celery) | Starter | $7 |
| Redis | Free | $0 |
| PostgreSQL | Starter | $7 |
| **Total** | | **~$21/month** |

OpenAI API usage: ~$0.01 per chat query (gpt-4o-mini). 1000 queries ≈ $10.

---

## 2. Docker (any host)

### Step 1: Build the image

```bash
docker build -t matdiscoverai .
```

### Step 2: Run with external services

You need Postgres + Redis running somewhere (could be Render/Supabase/Upstash managed services).

```bash
docker run -d --name matdiscoverai \
  -p 8000:8000 \
  -e DJANGO_SECRET_KEY="your-50-char-secret" \
  -e DJANGO_DEBUG=False \
  -e DJANGO_ALLOWED_HOSTS="your-domain.com" \
  -e DJANGO_CSRF_TRUSTED_ORIGINS="https://your-domain.com" \
  -e DATABASE_URL="postgres://user:pass@db-host:5432/matdiscoverai" \
  -e CELERY_BROKER_URL="redis://redis-host:6379/1" \
  -e CELERY_RESULT_BACKEND="redis://redis-host:6379/2" \
  -e OPENAI_API_KEY="sk-..." \
  -e MATERIALS_PROJECT_API_KEY="..." \
  -e OPENALEX_EMAIL="your-email@example.com" \
  -v /path/to/modeldata:/app/ml/models/saved \
  -v /path/to/chromadb:/app/chroma_db \
  matdiscoverai
```

### Step 3: Run migrations + seed

```bash
docker exec -it matdiscoverai python manage.py migrate
docker exec -it matdiscoverai python manage.py createsuperuser
docker exec -it matdiscoverai python manage.py seed_data
docker exec -it matdiscoverai python manage.py extract_all
docker exec -it matdiscoverai python manage.py build_kg
docker exec -it matdiscoverai python manage.py train_models
```

### Full stack with docker-compose

For self-hosted VPS, use the included `docker-compose.yml`:

```bash
# Edit .env first
docker compose up -d --build

# Initialize data
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py seed_data
docker compose exec web python manage.py extract_all
docker compose exec web python manage.py build_kg
docker compose exec web python manage.py train_models
docker compose exec web python manage.py index_all
```

Optional extras (run with `--profile full`):
- Neo4j at http://localhost:7474
- Flower (Celery monitor) at http://localhost:5555

---

## 3. Vercel (frontend + serverless Python — with caveats)

> ⚠️ **Important**: Vercel is optimized for Next.js / Node.js serverless functions. Django can run there via `@vercel/python`, but with significant limitations. **For production Django, use Render or a Docker host.**

### Limitations of Vercel for Django

| Limitation | Impact |
|------------|--------|
| No persistent filesystem | ChromaDB (./chroma_db/) and ML .pkl files won't survive between requests |
| 60-second function timeout | ML training jobs won't fit |
| No long-running workers | Celery won't work; use Vercel Cron + serverless functions instead |
| Cold starts | Heavy ML libraries (torch, transformers) inflate cold-start to 10-30s |
| 250MB function size limit | May need to strip unused deps (torch is large) |

### Recommended Vercel setup

If you still want Vercel, use this hybrid approach:

1. **Frontend on Vercel** — Next.js (or Django templates compiled to static HTML)
2. **Django API on Render/Railway** — gunicorn + Celery + persistent volumes
3. **Postgres on Neon** — serverless Postgres (free tier)
4. **Redis on Upstash** — serverless Redis (free tier)
5. **Vector DB on Pinecone** — managed vector DB (free tier)

### Minimal Vercel deployment (just the Django API, no ML)

If you want to try Vercel for the Django API alone (no ML features):

1. Strip ML deps from `requirements.txt` (remove torch, transformers, sentence-transformers, chromadb)
2. Set `vercel.json`:
   ```json
   {
     "builds": [{"src": "backend/wsgi.py", "use": "@vercel/python"}],
     "routes": [{"src": "/(.*)", "dest": "backend/wsgi.py"}]
   }
   ```
3. Set env vars in Vercel dashboard:
   - `DATABASE_URL` (Neon Postgres connection string)
   - `CELERY_BROKER_URL` (Upstash Redis)
   - `OPENAI_API_KEY`
   - `DJANGO_SECRET_KEY`
   - `DJANGO_DEBUG=False`
   - `DJANGO_ALLOWED_HOSTS=your-project.vercel.app`
4. Deploy: `vercel --prod`
5. Run migrations from a local shell with the same env vars:
   ```bash
   export DATABASE_URL="postgres://..."
   python manage.py migrate
   python manage.py seed_data
   ```

### What works on Vercel

- ✅ Django admin
- ✅ REST API (papers list, materials list, predictions)
- ✅ Template-rendered pages
- ✅ JWT auth
- ✅ Postgres via Neon
- ✅ Redis via Upstash (as cache, not Celery broker)

### What doesn't work on Vercel

- ❌ Async Celery tasks (paper ingestion, extraction, indexing)
- ❌ ChromaDB local persistence (volumes don't exist)
- ❌ ML model training (exceeds 60s timeout)
- ❌ Transformer NER (cold start too slow)
- ❌ LLM chat (RAG requires ChromaDB; switch to Pinecone)

### Vercel-friendly alternative stack

If you want a fully serverless deployment:

| Component | Service |
|-----------|---------|
| Frontend | Vercel (Next.js) |
| API | Vercel serverless functions (Next.js API routes) |
| Database | Neon Postgres |
| Vector DB | Pinecone |
| LLM | OpenAI API |
| Embeddings | OpenAI `text-embedding-3-small` (instead of sentence-transformers) |
| Async jobs | Vercel Cron + serverless functions |
| Auth | Auth0 / Clerk |

This requires rewriting the backend in Node.js / Next.js. The Django version of MatDiscoverAI is intentionally Django for the research-grade Python ML ecosystem.

---

## 4. Bare-metal VPS

For DigitalOcean, AWS EC2, Hetzner, Linode, etc.

### Step 1: Provision server

Ubuntu 22.04 LTS, 2 vCPU, 4GB RAM minimum.

### Step 2: Install Docker

```bash
ssh root@your-server
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin git
```

### Step 3: Clone repo

```bash
git clone https://github.com/your-username/matdiscoverai.git
cd matdiscoverai
cp .env.example .env
nano .env  # edit secrets
```

### Step 4: Launch

```bash
docker compose up -d --build
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py seed_data
docker compose exec web python manage.py extract_all
docker compose exec web python manage.py build_kg
docker compose exec web python manage.py train_models
```

### Step 5: Reverse proxy (Caddy — auto-HTTPS)

```bash
apt install -y caddy
```

Edit `/etc/caddy/Caddyfile`:

```
your-domain.com {
    reverse_proxy localhost:8000
}
```

```bash
systemctl restart caddy
```

Caddy automatically provisions Let's Encrypt TLS certificates.

### Step 6: Set up backups

```bash
# Daily Postgres backup
echo "0 3 * * * docker compose exec -T db pg_dump -U mda matdiscoverai | gzip > /backups/matdiscoverai-$(date +\%Y\%m\%d).sql.gz" | crontab -

# Keep last 30 days
echo "0 4 * * * find /backups -name 'matdiscoverai-*.sql.gz' -mtime +30 -delete" | crontab -
```

---

## 5. Post-deploy checklist

After deploying anywhere, verify:

- [ ] Landing page loads at `/` with stats showing (papers > 0, entities > 0)
- [ ] Admin at `/admin/` works with superuser login
- [ ] Papers list at `/papers/` shows seeded papers
- [ ] Paper detail at `/papers/1/` shows chunks after extraction
- [ ] Extraction dashboard at `/extraction/` shows entities + relations
- [ ] KG dashboard at `/kg/` shows interactive graph after build
- [ ] Materials list at `/materials/` shows cached records
- [ ] Compare page at `/materials/compare/` shows side-by-side chart
- [ ] Predict page at `/predictions/` returns predictions for `LiFePO4`
- [ ] Chat at `/chat/` returns AI answers (with citations if RAG enabled)
- [ ] API at `/api/papers/api/` returns JSON list

### Smoke test script

```bash
#!/bin/bash
# scripts/smoke_test.sh
BASE_URL="${1:-http://localhost:8000}"

echo "Testing $BASE_URL..."
curl -s -o /dev/null -w "Home: %{http_code}\n" $BASE_URL/
curl -s -o /dev/null -w "Admin: %{http_code}\n" $BASE_URL/admin/
curl -s -o /dev/null -w "Dashboard: %{http_code}\n" $BASE_URL/dashboard/overview/
curl -s -o /dev/null -w "Papers: %{http_code}\n" $BASE_URL/papers/
curl -s -o /dev/null -w "Extraction: %{http_code}\n" $BASE_URL/extraction/
curl -s -o /dev/null -w "KG: %{http_code}\n" $BASE_URL/kg/
curl -s -o /dev/null -w "Materials: %{http_code}\n" $BASE_URL/materials/
curl -s -o /dev/null -w "Predict: %{http_code}\n" $BASE_URL/predictions/
curl -s -o /dev/null -w "Chat: %{http_code}\n" $BASE_URL/chat/

echo "API tests:"
curl -s -o /dev/null -w "  /api/dashboard/stats/: %{http_code}\n" $BASE_URL/api/dashboard/stats/
curl -s -o /dev/null -w "  /api/papers/api/: %{http_code}\n" $BASE_URL/api/papers/api/
curl -s -o /dev/null -w "  /api/kg/api/graph/: %{http_code}\n" $BASE_URL/api/kg/api/graph/

echo "Prediction test:"
curl -s -X POST $BASE_URL/api/predictions/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{"target":"capacity_mah_g","formula":"LiFePO4","synthesis_method":"sol-gel","synthesis_temp_c":700}'
echo
```

---

## 6. Troubleshooting

### "OperationalError: FATAL: password authentication failed"
- Verify `DATABASE_URL` in env vars
- For Render Postgres: copy the **Internal Database URL** (not external)
- For Neon: ensure role + password match

### "Static files 404 in production"
- Run `python manage.py collectstatic --noinput` during build
- Verify `whitenoise.middleware.WhiteNoiseMiddleware` is in MIDDLEWARE (it is)
- Check `STATIC_ROOT = BASE_DIR / "staticfiles"` is set (it is)

### "CSRF verification failed"
- Add your domain to `DJANGO_CSRF_TRUSTED_ORIGINS` env var
- Format: `https://your-domain.com` (no trailing slash)
- Multiple origins: comma-separated

### "Celery worker not processing tasks"
- Check `CELERY_BROKER_URL` matches Redis URL
- Verify Redis is reachable: `redis-cli -u $CELERY_BROKER_URL ping`
- Check worker logs: `docker compose logs worker` or Render worker logs

### "ChromaDB not persisting"
- Check `chroma_db/` directory is writable
- For Docker: mount a volume: `-v chromadata:/app/chroma_db`
- For Render: add a Disk mounted at `/app/chroma_db`

### "OpenAI API errors"
- Verify `OPENAI_API_KEY` is set and valid
- Check billing at https://platform.openai.com/usage
- Switch to Groq free tier as fallback: set `GROQ_API_KEY`

### "Model training takes too long"
- For >1000 papers, enable GPU (not available on Render starter)
- Reduce model complexity: `RandomForestRegressor(n_estimators=100)` instead of 300
- Pre-train locally, commit the `.pkl` files, skip training on deploy

### "PDF download fails (403)"
- Some publishers block automated downloads
- Use arXiv (open access) instead of publisher URLs
- Or upload PDFs manually via the admin

### "Memory issues with transformer NER"
- Disable transformer: `EnsembleEntityExtractor(use_transformer=False)`
- Or use a smaller model: `allenai/scibert_scivocab_uncased` (110M params) instead of `MatSciBERT`
- Or run NER on the first N characters only (already capped at 1500)

---

## Need help?

- Open an issue: https://github.com/your-username/matdiscoverai/issues
- Check existing issues for common errors
- For Render-specific issues: https://render.com/docs
