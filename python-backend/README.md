# MatDiscoverAI - Python/Django Backend

## 🚀 Complete Django REST API Backend for Material Discovery Platform

This is the **Python/Django backend** that integrates with the **Next.js frontend** to provide:
- REST API for materials, papers, and knowledge graph
- ML-powered property prediction
- NLP-based entity extraction
- AI chat assistant
- Database management

---

## 📋 Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [API Endpoints](#api-endpoints)
4. [Project Structure](#project-structure)
5. [Configuration](#configuration)
6. [Integration with Next.js](#integration-with-nextjs)
7. [Deployment](#deployment)

---

## ✨ Features

### 📊 Materials API
- **CRUD Operations**: Create, Read, Update, Delete materials
- **Search & Filter**: By name, formula, category, source
- **Properties Management**: Physical, chemical, mechanical properties
- **Knowledge Graph**: Material relationships and connections

### 📚 Research Papers API
- **Paper Management**: Upload, track status, view details
- **NLP Extraction**: Automatic entity extraction from papers
- **Entity Types**: Materials, properties, methods, conditions
- **DOI Integration**: Link to original publications

### 🤖 ML Services
- **Property Prediction**: ML models (GPR, Neural Networks)
- **Material Discovery**: Novel candidate generation
- **Model Information**: Available models and their accuracy

### 💬 NLP Pipeline
- **Document Upload**: PDF/DOCX/TXT processing
- **Entity Extraction**: spaCy + Transformers
- **Text Summarization**: BART/T5 models
- **AI Chat Assistant**: Contextual Q&A

---

## ⚡ Quick Start

### Prerequisites

```bash
Python 3.10+
pip or pipenv
```

### Installation

```bash
# Clone or navigate to project
cd python-backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Seed database with sample data
python manage.py seed_database

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver 0.0.0.0:8000
```

### Verify Installation

Open your browser and visit:
- **API Root**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **Health Check**: http://localhost:8000/api/ml/health/

---

## 🔌 API Endpoints

### Materials API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/materials/` | List all materials |
| POST | `/api/materials/` | Create new material |
| GET | `/api/materials/{id}/` | Get material detail |
| PUT | `/api/materials/{id}/` | Update material |
| DELETE | `/api/materials/{id}/` | Delete material |
| GET | `/api/materials/dashboard_stats/` | Dashboard statistics |
| GET | `/api/materials/by_category/` | Materials by category |
| POST | `/api/materials/predict_property/` | ML property prediction |

**Query Parameters:**
- `search`: Search by name/formula/description
- `category`: Filter by category slug
- `ordering`: Sort field (e.g., `-created_at`)

**Example Request:**
```bash
curl http://localhost:8000/api/materials/?search=lithium&category=battery
```

### Research Papers API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/papers/` | List all papers |
| POST | `/api/papers/` | Upload new paper |
| GET | `/api/papers/{id}/` | Get paper detail |
| POST | `/api/papers/{id}/extract_entities/` | Trigger NLP extraction |
| GET | `/api/papers/stats/` | Paper statistics |

### ML Services API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ml/health/` | Health check |
| POST | `/api/ml/predict/` | Property prediction |
| POST | `/api/ml/discover/` | Novel material discovery |
| GET | `/api/ml/models/` | Model information |

### NLP Pipeline API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nlp/upload/` | Document upload |
| POST | `/api/nlp/extract/` | Entity extraction |
| POST | `/api/nlp/summarize/` | Text summarization |
| POST | `/api/nlp/chat/` | AI chat assistant |

---

## 📁 Project Structure

```
python-backend/
├── matdiscoverai/           # Django project config
│   ├── __init__.py
│   ├── settings.py          # Settings & configuration
│   ├── urls.py              # URL routing
│   ├── wsgi.py              # WSGI application
│   └── asgi.py              # ASGI application
├── materials/               # Materials app
│   ├── models.py            # Material, Property, Category models
│   ├── serializers.py       # DRF serializers
│   ├── views.py             # Viewsets & endpoints
│   ├── urls.py              # URL patterns
│   └── management/
│       └── commands/
│           └── seed_database.py  # DB seeder
├── papers/                  # Papers app
│   ├── models.py            # ResearchPaper, ExtractedEntity
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── ml_services/             # ML services app
│   ├── views.py             # Prediction, discovery endpoints
│   └── urls.py
├── nlp_pipeline/            # NLP pipeline app
│   ├── views.py             # Extraction, chat endpoints
│   └── urls.py
├── db/                      # SQLite database
├── media/                   # User uploads
├── static/                  # Static files
├── requirements.txt         # Python dependencies
├── manage.py                # Django CLI
└── README.md                # This file
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root:

```bash
# Security
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database (SQLite default)
# For PostgreSQL, update settings.py

# CORS (for Next.js frontend)
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Optional: OpenAI for enhanced AI features
OPENAI_API_KEY=sk-...
```

### Database Configuration

**Default: SQLite** (development)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db' / 'sqlite3.db',
    }
}
```

**Production: PostgreSQL**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'matdiscoverai'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

---

## 🔗 Integration with Next.js Frontend

The Django backend is designed to work seamlessly with the Next.js frontend.

### Frontend Configuration

Update your Next.js `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
# Or in production:
NEXT_PUBLIC_API_URL=https://your-django-api.com/api
```

### Example API Call in Next.js

```typescript
// Fetch materials from Django backend
async function fetchMaterials() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/materials/?search=lithium`);
  const data = await response.json();
  return data.results;
}

// Predict property using ML service
async function predictProperty(composition: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ml/predict/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      composition,
      property_name: 'energy_density'
    })
  });
  return response.json();
}
```

### CORS Configuration

Django backend allows requests from:
- `http://localhost:3000` (development)
- `https://*.vercel.app` (production)

Add your domain in `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-app.vercel.app",
]
```

---

## 🚀 Deployment

### Option 1: Traditional Server (Gunicorn + Nginx)

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn matdiscoverai.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /path/to/python-backend/staticfiles/;
    }

    location /media/ {
        alias /path/to/python-backend/media/;
    }
}
```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput
RUN python manage.py migrate
RUN python manage.py seed_database

EXPOSE 8000
CMD ["gunicorn", "matdiscoverai.wsgi:application", "--bind", "0.0.0.0:8000"]
```

Build and run:
```bash
docker build -t matdiscoverai-api .
docker run -p 8000:8000 matdiscoverai-api
```

### Option 3: Render/Railway/Heroku

These platforms support Django natively. Just push your code!

**Render.yaml example:**
```yaml
services:
  - type: web
    name: matdiscoverai-api
    env: python
    buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput
    startCommand: gunicorn matdiscoverai.wsgi:application --bind 0.0.0.0:$PORT
```

---

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Test specific app
python manage.py test materials

# Test with coverage
coverage run --source='.' manage.py test
coverage report
```

---

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:8000/api/ml/health/
```

Response:
```json
{
    "status": "healthy",
    "service": "MatDiscoverAI ML Backend",
    "version": "2.0.0",
    "components": {
        "database": "connected",
        "ml_models": "loaded",
        "nlp_pipeline": "ready"
    }
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🆘 Support

For issues or questions:
1. Check the documentation
2. Review API endpoint examples
3. Check health status at `/api/ml/health/`
4. Open an issue on GitHub

---

**Built with ❤️ using Django, Django REST Framework, and Python**

*MatDiscoverAI v2.0 - Intelligence-Powered Material Discovery*
