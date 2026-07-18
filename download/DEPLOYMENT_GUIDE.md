# MatDiscoverAI - Complete Deployment & Project Guide

## Project Overview

**MatDiscoverAI** is an LLM-Based Scientific Knowledge Extraction and Materials Discovery Framework. It uses NLP and Large Language Models to automatically extract material knowledge from scientific literature, build knowledge graphs, and provide intelligent material recommendations.

### Title
**MatDiscoverAI: Intelligent Materials Discovery using Large Language Models and Natural Language Processing**

### Base Paper
"Applications of natural language processing and large language models in materials discovery" - Jiang et al., npj Computational Materials (2025)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                      │
│  React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui         │
│  Dashboard | Materials | Extract | Knowledge Graph | Chat    │
├─────────────────────────────────────────────────────────────┤
│                    API Layer (Next.js API Routes)             │
│  /api/stats | /api/materials | /api/extract | /api/chat      │
│  /api/predict | /api/knowledge-graph | /api/papers           │
├─────────────────────────────────────────────────────────────┤
│                    ML Pipeline Service (Port 3030)            │
│  NER Engine | Property Extractor | Relation Builder          │
│  Material Predictor | RAG Chat Engine                         │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                 │
│  Prisma ORM + SQLite | Material DB | Paper Repository        │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Charts | Recharts |
| Database | Prisma ORM + SQLite |
| Runtime | Bun |
| ML Service | Bun (TypeScript) |
| Animations | Framer Motion |

---

## Quick Start

### Prerequisites
- Node.js 18+ or Bun 1.0+
- npm or bun package manager

### Local Development

```bash
# 1. Install dependencies
bun install

# 2. Set up database
bun run db:push

# 3. Seed the database with sample data
bun run scripts/seed.ts

# 4. Start the ML pipeline service
cd mini-services/ml-pipeline && bun run dev &
cd ../..

# 5. Start the development server
bun run dev

# 6. Open http://localhost:3000
```

---

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Best for:** Quick deployment, automatic CI/CD, free tier

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

**Environment Variables to set in Vercel:**
- `DATABASE_URL` = `file:./db/custom.db`

**Notes:**
- Vercel automatically detects Next.js and configures the build
- SQLite works for demo but use PostgreSQL for production
- ML pipeline needs to be deployed separately (see Option 3)

### Option 2: Docker + Cloud (AWS/GCP/Azure)

**Best for:** Production deployment, full control, scalability

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run db:push
RUN bun run build

# Expose port
EXPOSE 3000

# Start
CMD ["bun", "run", "start"]
```

```bash
# Build and run
docker build -t matdiscover .
docker run -p 3000:3000 -v $(pwd)/db:/app/db matdiscover
```

**AWS Deployment:**
```bash
# Using AWS ECS/Fargate
aws ecr create-repository --repository-name matdiscover
docker tag matdiscover:latest <account>.dkr.ecr.<region>.amazonaws.com/matdiscover
docker push <account>.dkr.ecr.<region>.amazonaws.com/matdiscover

# Or using AWS App Runner (simpler)
aws apprunner create-service --source-configuration ...
```

**GCP Deployment:**
```bash
# Using Cloud Run
gcloud builds submit --tag gcr.io/<project>/matdiscover
gcloud run deploy matdiscover --image gcr.io/<project>/matdiscover --port 3000
```

### Option 3: Railway / Render (PaaS)

**Best for:** Easy deployment with database support

**Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Render:**
1. Connect GitHub repository
2. Set build command: `bun install && bun run db:push && bun run build`
3. Set start command: `bun run start`
4. Add environment variable: `DATABASE_URL`

### Option 4: VPS (DigitalOcean/Linode/Hetzner)

**Best for:** Full control, cost-effective for 24/7

```bash
# SSH into your VPS
ssh root@your-server

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone and setup
git clone https://github.com/yourusername/matdiscover-ai.git
cd matdiscover-ai
bun install
bun run db:push
bun run scripts/seed.ts

# Start ML pipeline
cd mini-services/ml-pipeline
screen -S ml-pipeline -dm bun run dev
cd ../..

# Start app with PM2
npm i -g pm2
pm2 start "bun run start" --name matdiscover
pm2 save
pm2 startup
```

**Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name matdiscover.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

---

## Project Structure

```
matdiscover-ai/
├── prisma/
│   └── schema.prisma          # Database schema (7 models)
├── db/
│   └── custom.db              # SQLite database
├── scripts/
│   └── seed.ts                # Database seeding script
├── mini-services/
│   └── ml-pipeline/
│       ├── package.json
│       └── index.ts           # ML pipeline service (port 3030)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main SPA page (8 tabs)
│   │   ├── globals.css        # Tailwind styles
│   │   └── api/
│   │       ├── stats/         # Dashboard statistics
│   │       ├── materials/     # Materials CRUD
│   │       ├── papers/        # Papers management
│   │       ├── extract/       # NLP extraction
│   │       ├── chat/          # RAG chat
│   │       ├── predict/       # Material prediction
│   │       ├── knowledge-graph/ # Graph visualization data
│   │       └── upload/        # File upload
│   ├── components/ui/         # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   └── lib/
│       ├── db.ts              # Prisma client
│       └── utils.ts           # Utility functions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── Caddyfile                  # Gateway config
```

---

## Database Schema

| Model | Description | Key Fields |
|-------|-------------|------------|
| Material | Materials in knowledge base | name, formula, category, confidence |
| MaterialProperty | Physical/chemical properties | propertyName, propertyValue, unit |
| ResearchPaper | Scientific literature | title, authors, abstract, year, doi |
| ExtractedEntity | NER-extracted entities | entityType, entityText, confidence |
| KnowledgeEdge | Material relationships | sourceEntityId, targetEntityId, relationType |
| ChatMessage | Chat history | role, content, sources |
| ExtractionJob | Processing jobs | status, result, error |

---

## ML Pipeline API (Port 3030)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/extract` | POST | Extract materials, properties, relations from text |
| `/api/predict` | POST | Get material recommendations by category |
| `/api/chat` | POST | RAG-powered chat responses |
| `/api/ner` | POST | Named Entity Recognition demo |
| `/api/properties` | POST | Property extraction demo |

---

## Features

1. **Dashboard** - Overview stats, charts, pipeline visualization, category distribution
2. **Materials Explorer** - Search, filter, browse 33+ materials with properties
3. **NLP Extraction** - Paste text → extract materials, properties, relations
4. **Knowledge Graph** - Interactive canvas-based graph visualization
5. **Material Prediction** - AI-powered recommendations by category
6. **AI Chat** - RAG-powered Q&A about materials science
7. **Papers** - Browse indexed research papers
8. **About** - Architecture, ML techniques, deployment guide

---

## ML Capstone Alignment

### Phase 1: Problem Statement Definition (100 marks)

**Selection of Problem (30 marks):**
- Real-world: Materials knowledge scattered across millions of papers
- Scope: AI automation of extraction → structured knowledge base → discovery
- Impact: Accelerates research, reduces manual effort

**Understanding of Problem (30 marks):**
- Pipeline: Papers → PDF Parser → Text Cleaning → LLM → NER → Knowledge Graph → Recommendation
- Clear "To Do" steps with defined outputs

**Dataset & ML Technique (30 marks):**
- Datasets: Materials Project, arXiv, Semantic Scholar, OpenAlex
- ML: MatSciBERT, SciBERT, NER, RAG, GNN, XGBoost, LangChain

**Presentation (10 marks):**
- 4-slide format covering Problem, Objectives, Methodology, Expected Outcomes

### Phase 2: Features Selection & Learning Technique (100 marks)

**Feature Selection (30 marks):**
- Text features: TF-IDF, BERT embeddings, token sequences
- Categorical: material type, domain category, relation type
- Numerical: property values, confidence scores

**Literature Survey (30 marks):**
- SciBERT (Beltagy et al. 2019)
- MatSciBERT (Gupta et al. 2022)
- GNN for Materials (Gilmer et al. 2020)
- RAG (Lewis et al. 2021)
- Autonomous AI Research (Merchant et al. 2023)

**Learning Algorithm (30 marks):**
- Supervised NER with transformer models
- Graph-based prediction with GNN
- Ensemble ranking with XGBoost
- RAG for knowledge-grounded generation

### Phase 3: End Sem Evaluation (150 marks)

- Complete pipeline with real datasets
- Data preprocessing and feature engineering
- Algorithmic design with convincing results
- Presentation and interaction

---

## Production Recommendations

1. **Database**: Migrate from SQLite to PostgreSQL (Prisma supports both)
2. **ML Models**: Replace simulated NER with actual SciBERT/MatSciBERT models
3. **LLM Integration**: Connect to OpenAI/Anthropic API for real LLM chat
4. **File Storage**: Use S3/GCS for PDF uploads
5. **Authentication**: Enable NextAuth.js for user management
6. **Caching**: Add Redis for API response caching
7. **Monitoring**: Add Sentry/DataDog for error tracking
8. **Testing**: Add Jest + Playwright for E2E testing

---

## Environment Variables

```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..." # Optional: for real LLM chat
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Port 3000 in use | Kill existing process: `lsof -i :3000` then `kill <pid>` |
| Port 3030 in use | Kill ML pipeline: `lsof -i :3030` then `kill <pid>` |
| Database errors | Reset: `bun run db:push` then `bun run scripts/seed.ts` |
| Blank page | Clear browser cache, check console for errors |
| API errors | Verify ML pipeline is running on port 3030 |

---

## License

MIT License - Free for educational and research use.

---

## Author

ML Capstone Project - Amrita School of Computing, Chennai Campus
Academic Year 2026-27
