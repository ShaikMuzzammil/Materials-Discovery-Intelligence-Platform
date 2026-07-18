# MatDiscoverAI Python Backend - Production Docker Image
# Multi-stage build with Django + FastAPI

# ============================================================
# Stage 1: Base Python Image
# ============================================================
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================================================
# Stage 2: Dependencies
# ============================================================
FROM base as dependencies

COPY requirements.txt .

# Install Python dependencies (layer cached)
RUN pip install --no-cache-dir -r requirements.txt

# ============================================================
# Stage 3: Production
# ============================================================
FROM base as production

# Create non-root user for security
RUN groupadd -r matdiscoverai && useradd -r -g matdiscoverai matdiscoverai

# Copy dependencies from previous stage
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/db /app/static /app/media /app/logs && \
    chown -R matdiscoverai:matdiscoverai /app

# Switch to non-root user
USER matdiscoverai

# Expose ports
# 8000 - Django REST API
# 8001 - FastAPI ML Service
EXPOSE 8000 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Startup script (runs both Django and FastAPI)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["production"]
