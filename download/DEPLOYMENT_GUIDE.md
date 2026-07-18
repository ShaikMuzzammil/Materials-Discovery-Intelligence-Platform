# MatDiscoverAI - Complete Deployment Guide

## 🚀 AI-Powered Material Discovery Platform

**Version:** 2.0 (with Python/Django Backend Integration)  
**Stack:** Next.js 16 + React 19 + TypeScript + Django 4.2 + FastAPI + Prisma

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Vercel Deployment (Frontend Only)](#vercel-deployment)
4. [Full Stack Deployment (Docker)](#full-stack-deployment-docker)
5. [Python Backend Setup](#python-backend-setup)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Python 3.10+ (for ML backend, optional)
- Git

### Frontend-Only Deployment (Fastest)

```bash
# 1. Clone or extract the project
cd MatDiscoverAI

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000
```

### Full Stack with Python Backend

```bash
# Terminal 1: Start Next.js Frontend
npm run dev

# Terminal 2: Start Python Backend
cd python-backend
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000      # Django REST API
uvicorn fastapi_app:app --host 0.0.0.0 --port 8001 --reload  # FastAPI ML Service
```

---

## 📁 Project Structure

```
MatDiscoverAI/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main application (2200+ lines)
│   │   ├── layout.tsx            # Root layout with metadata
│   │   ├── globals.css           # Custom styling
│   │   └── api/
│   │       ├── ml/
│   │       │   └── predict/
│   │       │       └── route.ts  # ⭐ NEW: Python ML integration
│   │       ├── materials/route.ts
│   │       ├── papers/route.ts
│   │       ├── chat/route.ts
│   │       └── ...               # Other API routes
│   ├── components/ui/            # shadcn/ui components
│   └── lib/                      # Utilities & DB client
├── python-backend/               # ⭐ NEW: Complete Python/Django backend
│   ├── fastapi_app.py            # FastAPI ML microservice
│   ├── ml_models.py              # Machine learning models
│   ├── nlp_engine.py             # NLP extraction engine
│   ├── manage.py                 # Django management
│   ├── matdiscoverai/            # Django settings
│   ├── materials/                # Materials app (models, views, serializers)
│   ├── papers/                   # Research papers app
│   ├── ml_services/              # ML services app
│   ├── nlp_pipeline/             # NLP pipeline app
│   ├── Dockerfile                # Production container
│   ├── docker-entrypoint.sh      # Startup script
│   └── requirements.txt          # Python dependencies
├── docker-compose.yml            # ⭐ NEW: Full stack orchestration
├── prisma/
│   └── schema.prisma            # Database schema
├── public/
│   └── logo.svg                  # Custom logo
├── package.json
├── next.config.ts
└── README.md
```

---

## 🌐 Vercel Deployment (Frontend Only)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: MatDiscoverAI v2.0"
git remote add origin https://github.com/YOUR_USERNAME/Materials-Discovery-Intelligence-Platform.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..." → "Project"**
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next`
   - **Install Command:** `npm install` (default)

5. Add Environment Variables (if any):
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   ```

6. Click **"Deploy"**

### Step 3: Verify Deployment

After deployment completes (~2 minutes), your site will be live at:
```
https://your-project-name.vercel.app
```

---

## 🐳 Full Stack Deployment (Docker)

### Option A: Using Docker Compose (Recommended for Production)

```bash
# 1. Navigate to project directory
cd MatDiscoverAI

# 2. Build and start all services
docker-compose up -d --build

# Services started:
# - Frontend:     localhost:3000
# - Django API:   localhost:8000  
# - FastAPI ML:   localhost:8001
# - PostgreSQL:   localhost:5432
# - Redis:        localhost:6379

# 3. View logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f ml-service

# 4. Stop services
docker-compose down
```

### Option B: Manual Docker Build

#### Build Python Backend Image

```bash
cd python-backend
docker build -t matdiscoverai-backend .
docker run -p 8000:8000 -p 8001:8001 matdiscoverai-backend production
```

#### Build Frontend Image

Create `Dockerfile.frontend` in root:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -f Dockerfile.frontend -t matdiscoverai-frontend .
docker run -p 3000:3000 matdiscoverai-frontend
```

---

## 🐍 Python Backend Setup

### Local Development

```bash
# 1. Create virtual environment
cd python-backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up database
python manage.py migrate
python manage.py seed_database  # Populate with sample data

# 4. Run Django REST API
python manage.py runserver 0.0.0.0:8000

# 5. In another terminal, run FastAPI ML service
uvicorn fastapi_app:app --reload --port 8001
```

### Available Python Endpoints

| Service | Port | Documentation |
|---------|------|---------------|
| Django REST API | 8000 | `/api/docs/` |
| FastAPI ML Service | 8001 | `/docs` (Swagger UI), `/redoc` |

#### Key FastAPI Endpoints

```
POST /api/v2/predict        - Material property prediction
POST /api/v2/extract        - NLP extraction from text
POST /api/v2/chat           - AI material science assistant
POST /api/v2/similarity     - Find similar materials
GET  /api/v2/materials      - List/search materials
POST /api/v2/knowledge-graph - Query knowledge graph
POST /api/v2/upload         - Upload document for analysis
GET  /api/v2/stats          - Platform statistics
GET  /health                - Health check
```

### Testing Python ML Models

```bash
# Test ML models directly
python ml_models.py

# Test NLP engine
python nlp_engine.py

# Test FastAPI service
curl -X POST http://localhost:8001/api/v2/predict \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Material", "formula": "LiFePO4", "category": "battery"}'
```

---

## 🔧 Environment Variables

### Frontend (.env.local)

```env
# Python Backend URLs (optional - fallback built-in if unavailable)
NEXT_PUBLIC_PYTHON_ML_URL=http://localhost:8001
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000

# Database (Prisma/SQLite default)
DATABASE_URL="file:./db/custom.db"
```

### Python Backend (.env or environment)

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL for production)
DATABASE_URL=postgres://user:password@localhost:5432/matdiscoverai

# Redis (for Celery)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# CORS (allow frontend origin)
CORS_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

### Vercel Environment Variables

Set these in Vercel dashboard under **Settings → Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

---

## ❓ Troubleshooting

### Common Issues

#### 1. Build Error: "entityIcons is not fixed"

**Solution:** This has been fixed in v2.0. Ensure you have the latest code:
```bash
git pull origin main
# Or re-download the project
```

#### 2. Python Backend Connection Refused

**Symptom:** Frontend works but ML predictions use fallback mode

**Solutions:**
- Ensure Python backend is running: `curl http://localhost:8001/health`
- Check firewall isn't blocking ports 8000/8001
- Update `PYTHON_ML_URL` in frontend env if different host

#### 3. Database Migration Errors

```bash
# Reset database
rm python-backend/db/sqlite3.db
python manage.py migrate
python manage.py seed_database
```

#### 4. Port Already in Use

```bash
# Check what's using the port
lsof -i :3000  # or :8000, :8001

# Kill process or change port
kill -9 <PID>
```

#### 5. Vercel Deployment Fails

- Check build logs in Vercel dashboard
- Ensure `next.config.ts` is correct
- Verify no TypeScript errors locally: `npx tsc --noEmit`
- Check Node.js version compatibility (should be 18+)

### Getting Help

1. Check the [GitHub Issues](https://github.com/your-repo/issues)
2. Review this guide thoroughly
3. Test components individually before full deployment

---

## 📊 Features Overview

### Frontend Features (Next.js)
- ✅ **Dashboard** with real-time statistics and charts
- ✅ **Materials Explorer** with filtering and search
- ✅ **Research Papers** linked to materials
- ✅ **ML Property Predictions** (with Python integration)
- ✅ **NLP Text Extraction** from research papers
- ✅ **Knowledge Graph** visualization
- ✅ **AI Chat Assistant** for material science Q&A
- ✅ **Responsive Design** for mobile/tablet/desktop

### Backend Features (Python/Django/FastAPI)
- ✅ **Django REST API** for CRUD operations
- ✅ **FastAPI ML Microservice** for predictions
- ✅ **NLP Pipeline** for entity extraction
- ✅ **Material Property Prediction Models**
- ✅ **Stability Classification**
- ✅ **Similarity Search Engine**
- ✅ **Material Generator** (candidate discovery)
- ✅ **Knowledge Graph Querying**

---

## 🔒 Security Notes for Production

1. **Change default secrets** (`SECRET_KEY`, database passwords)
2. **Enable HTTPS** (automatic on Vercel, use reverse proxy for self-hosted)
3. **Configure CORS** properly for your domain
4. **Enable authentication** (Django REST Framework supports Token Auth)
5. **Use environment variables** for sensitive config
6. **Regular updates**: `npm update`, `pip install --upgrade -r requirements.txt`

---

## 📈 Scaling Considerations

- **Database**: Migrate from SQLite to PostgreSQL for production
- **Caching**: Redis already configured for Celery/sessions
- **CDN**: Vercel Edge Network handles static assets
- **Monitoring**: Add Sentry (included in requirements)
- **Load Balancing**: Multiple worker processes configured in gunicorn

---

## 📝 License

This project is created for educational and research purposes.

---

**Last Updated:** July 2026  
**Version:** 2.0.0  
**Status:** Production Ready ✅
