#!/usr/bin/env bash
# Vercel build script – runs migrations + collects static files.
# Vercel runs this automatically after installing dependencies.
set -e

echo "=== MatDiscoverAI Vercel build script ==="

# Set environment
export DJANGO_SETTINGS_MODULE=backend.settings_vercel
export DJANGO_DEBUG=False
# DJANGO_SECRET_KEY must be set in Vercel env vars; use a fallback for build only
export DJANGO_SECRET_KEY="${DJANGO_SECRET_KEY:-build-time-placeholder-key-not-for-production}"
export DJANGO_ALLOWED_HOSTS="${DJANGO_ALLOWED_HOSTS:-*}"

# Generate datasets (CSV files) so the app has data to work with
echo "→ Generating sample datasets..."
python scripts/generate_all_datasets.py 2>&1 | tail -10 || echo "  (skipped - datasets may already exist)"

# Collect static files
echo "→ Collecting static files..."
python manage.py collectstatic --noinput 2>&1 | tail -5 || echo "  (collectstatic had issues, continuing)"

# Run migrations (only if database is reachable; skip silently if not)
# Note: On Vercel, migrations should be run via a separate step with DATABASE_URL set.
# For SQLite in /tmp, this creates the DB on first build.
echo "→ Running migrations..."
python manage.py migrate --run-syncdb 2>&1 | tail -10 || echo "  (migrations skipped - DATABASE_URL not set or unreachable)"

# Seed initial data (only if database is empty)
echo "→ Seeding initial data..."
python manage.py seed_data 2>&1 | tail -10 || echo "  (seeding skipped)"

# Extract entities from seeded papers
echo "→ Running extraction..."
python manage.py extract_all 2>&1 | tail -10 || echo "  (extraction skipped)"

# Build knowledge graph
echo "→ Building knowledge graph..."
python manage.py build_kg 2>&1 | tail -5 || echo "  (KG build skipped)"

# Note: Training is skipped on Vercel (60s timeout).
# Models must be pre-trained locally and committed to the repo.
# See docs/VERCEL_DEPLOYMENT.md for instructions.
if [ -d "ml/models/saved" ] && [ "$(find ml/models/saved -name '*.pkl' | head -1)" ]; then
    echo "→ Pre-trained models found: $(find ml/models/saved -name '*.pkl' | wc -l) files"
else
    echo "⚠ WARNING: No pre-trained models found in ml/models/saved/"
    echo "  Predictions will train on-the-fly (may timeout on Vercel)."
    echo "  See docs/VERCEL_DEPLOYMENT.md → 'Pre-training models' section."
fi

echo "=== Build complete ==="
