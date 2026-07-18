#!/bin/bash
# MatDiscoverAI Docker Entry Point Script
# Runs both Django and FastAPI services

set -e

echo "========================================"
echo "  MatDiscoverAI Python Backend"
echo "  Starting services..."
echo "========================================"

# Wait for database (if using PostgreSQL)
if [ "$DATABASE_URL" != "" ]; then
    echo "Waiting for database..."
    while ! python -c "
import os
import psycopg2
conn = psycopg2.connect(os.environ['DATABASE_URL'])
conn.close()
    " 2>/dev/null; do
        sleep 1
    done
    echo "Database connection established!"
fi

# Run Django migrations
echo "Running Django migrations..."
python manage.py migrate --noinput || true

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Seed database (if needed)
echo "Checking database seed..."
python manage.py seed_database || true

case "$1" in
    production)
        echo ""
        echo "Starting PRODUCTION mode..."
        echo "  - Django REST API on port 8000"
        echo "  - FastAPI ML Service on port 8001"
        echo ""
        
        # Start FastAPI service in background
        uvicorn fastapi_app:app --host 0.0.0.0 --port 8001 --workers 2 &
        FASTAPI_PID=$!
        
        # Start Django with gunicorn in foreground
        exec gunicorn matdiscoverai.wsgi:application \
            --bind 0.0.0.0:8000 \
            --workers 3 \
            --worker-class gthread \
            --threads 4 \
            --timeout 120 \
            --access-logfile - \
            --error-logfile -
        ;;
    
    development)
        echo ""
        echo "Starting DEVELOPMENT mode..."
        echo "  - Django on http://localhost:8000"
        echo "  - FastAPI on http://localhost:8001"
        echo ""
        
        # Start FastAPI with auto-reload
        uvicorn fastapi_app:app --host 0.0.0.0 --port 8001 --reload &
        
        # Start Django dev server
        python manage.py runserver 0.0.0.0:8000
        ;;
    
    django-only)
        echo "Starting Django only on port 8000..."
        exec gunicorn matdiscoverai.wsgi:application \
            --bind 0.0.0.0:8000 \
            --workers 3
        ;;
    
    fastapi-only)
        echo "Starting FastAPI only on port 8001..."
        exec uvicorn fastapi_app:app --host 0.0.0.0 --port 8001 --workers 2
        ;;
    
    *)
        echo "Usage: $0 {production|development|django-only|fastapi-only}"
        exit 1
        ;;
esac
