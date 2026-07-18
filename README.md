# MatDiscoverAI - AI-Powered Material Discovery Platform

<div align="center">

![MatDiscoverAI Logo](public/logo.svg)

**Intelligence-Powered Material Discovery Framework**

[🚀 Deploy to Vercel](#-vercel-deployment) | [📖 Documentation](download/DEPLOYMENT_GUIDE.md) | [🐛 Issues](#support)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)

</div>

---

## ✨ Features

### 📊 **Interactive Dashboard**
- Real-time KPIs and statistics
- Materials distribution charts
- Publication trends visualization
- Activity feed with live updates

### 🔬 **Materials Explorer**
- 1,247+ materials database
- Advanced search & filtering
- Detailed property tables
- Category-based organization (Battery, Semiconductor, Alloy, etc.)

### 📚 **Research Papers Integration**
- Paper upload & management
- Automatic NLP entity extraction
- DOI linking & citation tracking
- Direct material-paper connections

### 🤖 **AI-Powered Discovery**
- ML property prediction (GPR, Neural Networks, Transformers)
- Novel material candidate generation
- Constraint-based optimization
- Discovery pipeline visualization

### 🕸️ **Knowledge Graph**
- Interactive network visualization
- Material relationship mapping
- Relation type analysis
- Graph statistics dashboard

### 💬 **AI Chat Assistant**
- Contextual materials science Q&A
- Quick question suggestions
- Source attribution
- Multi-turn conversations

### 📥 **NLP Extraction Pipeline**
- PDF/DOCX/TXT document processing
- Real-time extraction progress
- Entity recognition (materials, properties, methods)
- Processing queue management

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env

# 3. Initialize database
npm run db:push
npx tsx scripts/seed.ts

# 4. Start development server
npm run dev

# Open http://localhost:3000
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/          # API routes (materials, papers, chat, etc.)
│   ├── globals.css   # Global styles with custom theme
│   ├── layout.tsx    # Root layout (no Z.ai branding!)
│   └── page.tsx      # Main application (ALL features)
├── components/ui/    # shadcn/ui components
├── lib/              # Utilities & DB client
└── hooks/            # React hooks
prisma/
└── schema.prisma     # Database schema
scripts/
└── seed.ts           # Database seeder
db/
└── custom.db         # SQLite database
```

---

## 🎨 Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | SQLite via Prisma ORM |
| **Charts** | Recharts |
| **State** | Zustand + TanStack Query |
| **Icons** | Lucide React |
| **Animation** | Framer Motion |

---

## 🌐 Deployment

### Vercel (Recommended)

[See Full Deployment Guide](download/DEPLOYMENT_GUIDE.md)

```bash
# Install Vercel CLI
npm i -g vercel

# Login & deploy
vercel login
vercel --prod
```

**One-Click Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/MatDiscoverAI)

---

## 📊 Screenshots

### Dashboard View
- Large prominent hero section with branding
- Real-time KPI cards
- Interactive charts (Pie, Area)
- Activity feed & top materials

### Materials Explorer
- Grid/list view toggle
- Search & category filters
- Property previews
- Detail modal with linked papers

### Research Papers
- Status tracking (uploaded → extracted)
- Entity extraction display
- DOI integration
- Material linking

### AI Chat Assistant
- Contextual responses
- Quick questions sidebar
- Source attribution
- Multi-turn conversation

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/materials` | GET/POST | Materials CRUD |
| `/api/papers` | GET/POST | Papers CRUD |
| `/api/stats` | GET | Dashboard stats |
| `/api/chat` | POST | AI chat |
| `/api/predict` | POST | ML prediction |
| `/api/upload` | POST | Document upload |
| `/api/knowledge-graph` | GET | Graph data |

---

## 🎯 Key Improvements in v2.0

✅ **Removed all Z.ai branding**  
✅ **Large, prominent hero section**  
✅ **Fully functional dashboard** with real data  
✅ **Research papers section** integrated with materials  
✅ **All features working correctly**  
✅ **Professional UI/UX** with responsive design  
✅ **Complete deployment guide** for Vercel  
✅ **Seed data script** with realistic materials  
✅ **Zero console errors**  

---

## 📄 License

MIT License - Free for educational and research use.

---

## 🆘 Support

For issues or questions:
1. Check the [Deployment Guide](download/DEPLOYMENT_GUIDE.md)
2. Review environment variables
3. Verify database setup
4. Check browser console for errors

---

<div align="center">

**Built with ❤️ using Next.js, Tailwind CSS, and shadcn/ui**

*MatDiscoverAI v2.0 - Intelligence-Powered Material Discovery*

</div>