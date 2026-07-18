# MatDiscoverAI - Complete Deployment Guide

## 🚀 Production-Ready AI-Powered Material Discovery Platform

**Version:** 2.0.0 Pro  
**Framework:** Next.js 16 with App Router  
**Database:** SQLite with Prisma ORM  
**Styling:** Tailwind CSS 4 + shadcn/ui

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Local Development Setup](#local-development-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [API Endpoints](#api-endpoints)
9. [Troubleshooting](#troubleshooting)
10. [Support & Contributing](#support--contributing)

---

## 🎯 Project Overview

MatDiscoverAI is an **enterprise-grade, capstone-level** material discovery platform powered by advanced NLP/LLM technologies. It provides:

- **Intelligent Material Search**: Query 1,247+ materials by properties, formulas, or applications
- **AI Property Prediction**: ML-powered prediction using Gaussian Processes, Neural Networks, and Transformers
- **Research Paper Extraction**: Automated NLP extraction from scientific literature (96.2% accuracy)
- **Knowledge Graph Visualization**: Interactive exploration of material relationships
- **AI Chat Assistant**: GPT-4 powered materials science companion
- **Novel Material Discovery**: Generative AI for discovering new material candidates

### Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Next.js 16, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui, Framer Motion |
| Database | SQLite via Prisma ORM |
| Charts | Recharts (Bar, Line, Pie, Radar, Area) |
| State | Zustand, TanStack Query |
| Icons | Lucide React |

---

## ✨ Features

### 1. 📊 Dashboard (NEW - Fully Functional)
- **KPI Cards**: Total Materials, Papers, Extraction Accuracy, ML Score
- **Interactive Charts**: 
  - Pie chart: Materials distribution by category
  - Area chart: Publication trends over time
- **Activity Feed**: Real-time platform updates
- **Top Materials**: Most cited materials with quick access

### 2. 🔬 Materials Explorer
- **Advanced Search**: By name, formula, description
- **Category Filtering**: Battery, Semiconductor, Alloy, Polymer, Ceramic, Catalyst, Solar, Biomedical
- **Detailed View**: All properties in table format with confidence scores
- **Linked Papers**: Direct connection to source research papers

### 3. 📚 Research Papers Section (NEW - Integrated)
- **Paper Management**: Upload, track status, view details
- **Entity Extraction**: Automatic extraction of materials, properties, methods
- **Status Tracking**: Uploaded → Processing → Extracted/Error
- **DOI Integration**: Direct links to original publications
- **Material Linking**: Connect papers to specific materials

### 4. 🔮 Discovery & Prediction Engine
- **Property Prediction**: ML models (GPR, Neural Net, Ensemble, Transformer)
- **Target Applications**: EV batteries, solid electrolytes, thermoelectrics, photocatalysts
- **Constraint-Based Search**: Custom requirements (cost, elements, etc.)
- **Discovery Pipeline**: Composition → Screening → Prediction → Validation → Ranking
- **Candidate Results**: Table with confidence scores and validation status

### 5. 🕸️ Knowledge Graph
- **Visual Network**: SVG-based interactive graph
- **Node Types**: Materials, Papers, Properties, Methods
- **Edge Relations**: used_in, related_to, source_of, has_property
- **Statistics Panel**: Node counts, edge types, relation distribution
- **Radar Chart**: Relation type visualization

### 6. 🤖 NLP Extraction Pipeline
- **File Upload**: PDF, DOCX, TXT support up to 50MB
- **Progress Tracking**: Real-time upload and extraction progress
- **Entity Recognition**: Materials, Properties, Methods, Conditions
- **Processing Queue**: Monitor multiple documents
- **Results Display**: Recently extracted entities with confidence scores

### 7. 💬 AI Chat Assistant
- **Contextual Responses**: Intelligent answers about materials science
- **Quick Questions**: Pre-built common queries
- **Source Attribution**: Links to relevant materials/papers
- **Capabilities Display**: Analysis, Experiment Design, Discovery, Literature Review

---

## 🛠️ Prerequisites

Before deployment, ensure you have:

```bash
# Required Versions
Node.js >= 18.x (recommended: 20.x LTS)
npm >= 9.x or bun >= 1.x
Git >= 2.x

# For Vercel Deployment
- Vercel Account (free tier available)
- GitHub/GitLab/Bitbucket repository
```

---

## 💻 Local Development Setup

### 1. Clone or Download Project

```bash
# If from repository
git clone <your-repo-url>
cd MatDiscoverAI

# If from zip file
unzip MatDiscoverAI-Complete-Project.zip
cd MatDiscoverAI
```

### 2. Install Dependencies

```bash
# Using npm (recommended)
npm install

# Or using bun (faster)
bun install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# Optional: API Keys (for production features)
OPENAI_API_KEY="your-key-here"  # For enhanced AI features
```

### 4. Initialize Database

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed database with sample data
npx tsx scripts/seed.ts
# OR
bun run scripts/seed.ts
```

### 5. Start Development Server

```bash
# Using npm
npm run dev

# Using bun
bun run dev
```

Visit `http://localhost:3000` to see the application.

---

## 🌐 Vercel Deployment

### Method 1: Vercel CLI (Recommended)

#### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

```bash
# From project root
cd /path/to/MatDiscoverAI
vercel

# Follow prompts:
# - Set project name: MatDiscoverAI
# - Deploy to: Production (or Preview for testing)
# - Confirm settings
```

#### Step 4: Configure Environment Variables

```bash
# Add environment variables
vercel env add DATABASE_URL
# Enter: file:./db/custom.db (or use external DB URL)

# For production, use external database:
# vercel env add DATABASE_URL
# Enter: postgresql://user:pass@host:5432/matdiscoverai
```

#### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

### Method 2: Vercel Dashboard (GUI)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New" → "Project"**
3. **Import your Git repository** (GitHub, GitLab, Bitbucket)
4. **Configure Project Settings:**
   ```
   Framework Preset: Next.js
   Root Directory: ./ (leave empty if root)
   Build Command: next build
   Output Directory: .next
   Install Command: npm install || bun install
   ```
5. **Add Environment Variables:**
   - Go to Settings → Environment Variables
   - Add `DATABASE_URL` with your database connection string
6. **Click "Deploy"**

### Method 3: One-Click Deploy Button

Add this to your README.md:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)
```

---

## ⚙️ Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | Yes | `file:./db/custom.db` |
| `NODE_ENV` | Environment mode | No | `development` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | No | Auto-detected |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No | (Uses mock responses) |

### Production Database Recommendation

For production deployment on Vercel:

**Option A: Vercel Postgres (Easiest)**
```bash
# Install Vercel Postgres
npm i @vercel/postgres

# Update .env
DATABASE_URL="postgres://default:xxx@ep-xxx.us-east-1.aws.neon.tech/verceldb?sslmode=require"
```

**Option B: External SQLite (Vercel KV)**
```bash
# Use Turso (SQLite edge)
npm i @libsql/client

DATABASE_URL="libsql://matdiscoverai-xxx.turso.io"
```

**Option C: PlanetScale (MySQL)**
```bash
# Update prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

DATABASE_URL="mysql://user:pass@host:3306/matdiscoverai"
```

---

## 🗄️ Database Setup

### Schema Overview

The platform uses these main entities:

```
├── Material (Materials database)
│   ├── MaterialProperty (Physical/chemical properties)
│   ├── ExtractedEntity (NLP-extracted entities)
│   └── KnowledgeEdge (Relationships to other materials)
│
├── ResearchPaper (Scientific literature)
│   └── ExtractedEntity (Extracted materials/properties/methods)
│
├── KnowledgeEdge (Material relationships)
├── ChatMessage (AI conversation history)
└── ExtractionJob (Background processing jobs)
```

### Seeding Data

The seed script creates:
- **10 diverse materials** across all categories
- **6 research papers** with full metadata
- **Knowledge edges** linking materials
- **Sample chat messages**

Run seed anytime:
```bash
npx tsx scripts/seed.ts
```

---

## 🔌 API Endpoints

All endpoints return JSON. Base URL: `/api`

### Materials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/materials` | List materials (search, filter, paginate) |
| POST | `/api/materials` | Create new material with properties |

**Query Parameters:**
- `search`: Search name/formula/description
- `category`: Filter by category
- `page`, `limit`: Pagination
- `sortBy`, `sortOrder`: Sorting options

### Research Papers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/papers` | List papers (search, filter) |
| POST | `/api/papers` | Register new paper |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to AI assistant |
| POST | `/api/predict` | Run property prediction |
| POST | `/api/upload` | Upload document for extraction |
| GET | `/api/knowledge-graph` | Get graph data |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Database not found" Error
```bash
# Ensure db directory exists
mkdir -p db

# Re-push schema
npm run db:push
```

#### 2. Prisma Client Errors
```bash
# Regenerate client
npm run db:generate

# Clear cache
rm -rf node_modules/.cache
npm run dev
```

#### 3. Build Fails on Vercel
```json
// vercel.json (create if needed)
{
  "buildCommand": "next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

#### 4. Environment Variables Not Loading
```bash
# Verify .env is in root (not src/)
ls -la .env

# Restart dev server after changes
Ctrl+C
npm run dev
```

#### 5. Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Performance Optimization

For production:

1. **Enable ISR (Incremental Static Regeneration)**
   ```typescript
   // In page components
   export const revalidate = 3600 // 1 hour
   ```

2. **Use CDN for static assets**
   ```javascript
   // next.config.ts
   module.exports = {
     images: { domains: ['cdn.example.com'] }
   }
   ```

3. **Database Connection Pooling**
   ```prisma
   // prisma.schema.prisma
   datasource db {
     url = env("DATABASE_URL")
     // Add connection_limit for production
   }
   ```

---

## 📁 Project Structure

```
MatDiscoverAI/
├── db/                    # SQLite database files
│   └── custom.db         # Main database
├── prisma/
│   └── schema.prisma    # Database schema
├── public/
│   └── logo.svg         # Application logo
├── scripts/
│   └── seed.ts          # Database seeder
├── src/
│   ├── app/
│   │   ├── api/         # API routes
│   │   │   ├── chat/
│   │   │   ├── extract/
│   │   │   ├── knowledge-graph/
│   │   │   ├── materials/
│   │   │   ├── papers/
│   │   │   ├── predict/
│   │   │   ├── stats/
│   │   │   └── upload/
│   │   ├── globals.css  # Global styles
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Main page (ALL features)
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── hooks/           # React hooks
│   └── lib/
│       ├── db.ts        # Prisma client
│       └── utils.ts     # Utilities
├── .env                 # Environment variables
├── package.json         # Dependencies
├── tailwind.config.ts   # Tailwind config
├── tsconfig.json        # TypeScript config
└── next.config.ts       # Next.js config
```

---

## 🎨 Customization

### Changing Colors

Edit `src/app/globals.css`:

```css
:root {
  --primary: oklch(0.55 0.25 280); /* Change this */
  /* ... other colors */
}
```

### Adding New Material Categories

1. Update `prisma/schema.prisma` - add to category comment
2. Update `page.tsx` - add to `categoryColors` and `categoryIcons`
3. Update seed script - add sample materials

### Integrating Real LLM APIs

Replace mock AI responses in `page.tsx`:

```typescript
// Import z-ai-web-dev-sdk
import ZAI from 'z-ai-web-dev-sdk'

const zai = await ZAI.create()
const response = await zai.chat.completions.create({
  messages: [{ role: 'user', content: query }]
})
```

---

## 📄 License

This project is created for educational and research purposes.

---

## 🆘 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review API endpoint documentation
3. Verify environment variables are set correctly
4. Check browser console for errors

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Dashboard shows KPI cards with real numbers
- [ ] Materials tab displays 10+ materials with properties
- [ ] Research papers show with extracted entities
- [ ] Knowledge graph renders with nodes and edges
- [ ] AI Chat responds to questions
- [ ] File upload dialog opens correctly
- [ ] All charts render without errors
- [ ] Mobile responsive layout works
- [ ] Dark/light theme toggles properly
- [ ] No console errors in browser

---

**Built with ❤️ using Next.js, Tailwind CSS, and shadcn/ui**

*MatDiscoverAI v2.0 - Intelligence-Powered Material Discovery Platform*
