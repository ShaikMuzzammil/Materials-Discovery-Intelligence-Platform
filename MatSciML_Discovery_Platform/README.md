<div align="center">

# ⚗️ MatSciML Discovery — NLP + LLM to New Materials Prediction Platform

**Capstone 24041_103 · Research Papers → MatSciBERT → XGBoost → New Material Discovery**

A production-quality, single-page analytics platform for a fully verified materials-informatics
pipeline: 20 open-access papers are mined for materials properties with NLP, embedded with
MatSciBERT, joined to the Matbench `expt_gap` benchmark, modelled with 5 ML algorithms under strict
5-fold cross-validation, and finally used to screen **111 brand-new oxide candidates**.

Dark premium theme (slate/zinc + emerald/teal) · light/dark toggle · every transition animated with
Framer Motion · every chart rendered with Recharts · every number traceable to the zero-error
notebook run `24041_103_RUN_ALL.ipynb` (18/18 cells).

**Base paper:** Jiang et al. (2025), *Applications of NLP and LLMs in materials discovery*,
npj Comput. Mater. 11:79 — [10.1038/s41524-025-01554-0](https://doi.org/10.1038/s41524-025-01554-0)

</div>

---

## 📊 Verified results at a glance

| KPI | Value |
| --- | --- |
| Papers in corpus | **20** (18 PDFs + 2 text corpora) |
| Property sentences mined | **295** (160 mention band gap) |
| Clean benchmark samples | **4,601** (Matbench expt_gap, 3 dupes removed) |
| Selected features | **63** (31 composition + 32 MatSciBERT text) |
| Models compared | **5** (identical 5-fold CV, seed 42) |
| Discovery candidates | **111** unexplored oxides |
| **Best model (XGBoost)** | **MAE 0.4598 eV · RMSE 0.7976 eV · R² 0.6942** |
| Hold-out (20% unseen) | MAE 0.4376 eV · RMSE 0.7736 eV · R² 0.6972 |
| Extraction F-score | **75.5** (base paper: 73.33) |
| Top discovery pick | **Li(V0.5Ta0.5)O₃ — 3.78 eV** (mixed-cation perovskite) |
| Published reference | Automatminer Express MAE 0.416 eV (same benchmark) |

## ✨ Live features

### 📤 Real paper uploads — extraction + persistence (NEW)

- **Upload zone in both the Papers view and the Live Lab** — drag & drop or browse multiple
  PDF/TXT files; **pdf.js extracts every page locally** with live per-page progress.
- **Triple persistence**: every upload is stored in **IndexedDB** (browser, always), mirrored to
  the **`UploadedPaper` Prisma table** (`POST /api/uploads`) when a database is configured, and
  synced back across devices via `GET /api/uploads?filename=…`.
- **Upload Library table** in the Papers view — pages, chars, storage badge (DB + browser /
  browser-only), delete, and **“Stage all for live run”** to push the whole library into the engine.
- Zero-config guarantee: on a fresh Vercel deploy with no database, uploads still persist in the
  browser and flow into the live pipeline — nothing breaks.

### 🧠 Real MatSciBERT embeddings — optional HF token (NEW)

- Stage 4 can now embed sentences with the **real `m3rg-iitd/matscibert` checkpoint** via the
  **Hugging Face Inference API**, proxied server-side by `POST /api/embed` (token stays on the
  server — never exposed to the browser).
- The pipeline worker streams batches to the proxy (worker → main → `/api/embed` → HF → back);
  token embeddings are mean-pooled (768-d) and projected to 32-d with a deterministic seeded
  Johnson–Lindenstrauss matrix so the feature budget stays identical.
- **No token? Nothing breaks** — the engine honestly falls back to the local deterministic
  embedding, labels the run accordingly, and the UI shows exactly which source was used
  ("real MatSciBERT ✓" vs "local deterministic").
- Toggle in the Run Control Bar: **Embedding → MatSciBERT (auto) / Local**, persisted in
  localStorage; `GET /api/embed` probes key status live.

### 🧪 Live Pipeline Lab (flagship — real computation in the browser)

The whole capstone pipeline runs **for real inside the browser** — not a replay:

- **Full-width control bar** — upload PDF/TXT research papers (pdf.js text extraction), toggle the
  bundled 4-paper corpus, pick models, choose speed (Smooth / Fast / Turbo), Run / Cancel / Reset
  with live elapsed + ETA and the reason whenever the Run button is disabled.
- **Horizontal 9-stage rail** — one card per stage with full (never truncated) titles, live status
  (IDLE / RUNNING / DONE), per-stage progress, live counters ("1,565 sentences", "fold 3/5"),
  timings and an overall progress bar. Click any stage to inspect it.
- **Stage Workspace — one detailed tab per stage**, auto-advancing to the running stage:
  1. **Paper corpus** — the live corpus table (pages, chars, BUNDLED/UPLOADED source) + CSV/JSON
  2. **Text extraction** — the **preprocessed output**: each paper's extracted page-1 text streamed
     live in a monospace viewer + per-paper sentence counts
  3. **Property mining** — mined sentences table with property hits, materials and gap values
  4. **Embedding layer** — sample 32-dim vectors visualised as heat-strips with norms — **real
     MatSciBERT when an HF token is configured**, honest local fallback otherwise (always labelled)
  5. **Structured dataset** — records built live + **the dataset created & saved in-app, downloadable
     as CSV/JSON**
  6. **Benchmark join** — dedupe stats and record-matching visual
  7. **Feature engineering** — 95 → kept selection funnel + importance-ranked feature chips
  8. **Model training** — live CV leaderboard (5 models × 5 folds) **plus the fold-by-fold
     calculation table** (train rows / val rows / MAE / RMSE / R² per fold + the mean ± std row
     with the exact KFold(5, shuffle, seed 42) split sizes)
  9. **Discovery** — podium + streaming candidate table
  + **Terminal** tab — the full engine log with level filters
- **Run Summary** — 9 KPIs, stage-timing chips, live-vs-verified-notebook comparison table,
  honesty note, **Download PDF report** and JSON bundle.
- **Saved Runs** — every completed run persists via `POST /api/runs` (Prisma/SQLite) with a
  localStorage fallback; **Reopen** restores records, CV and discovery panels; Download metadata.
- **Crash-proof engine** — the worker auto-recovers after a crash (recreated on the next Run),
  errors show in a persistent banner with a Retry button, and a watchdog rebuilds stuck workers.

### One-to-one sidebar ↔ pipeline integration

**Every pipeline stage view now streams the live engine output inline (NEW):** the Papers,
Extraction, Dataset, Features, Models and Discovery views each render a live panel above their
verified baseline content — the live corpus table, the preprocessed page stream, the mined
property-sentence feed (filterable), the structured records, the feature-selection funnel, the
fold-by-fold CV table with the running leaderboard, and the discovery candidates — all from the
same store the Live Lab uses, updating in real time while a run is in progress. Panels appear
automatically when the engine reaches that stage and deep-link back into the Live Lab.

The sidebar mirrors the pipeline order (01 Papers · 03 Extraction · 05 Dataset · 07 Features ·
08 Models · 09 Discovery). While a live run's outputs exist, those analytics tabs show a **live
run data strip** with shared stats and a deep link back into the exact Live Lab stage panel; the
sidebar items carry a live-dot badge.

### Analytics views (verified data)

- **Overview** — 6 animated KPI counters, pipeline health strip, band-gap histogram, best-model &
  F-score highlight cards.
- **Pipeline Explorer** — interactive 9-stage stepper with per-stage detail panel (description,
  inputs → outputs, real numbers, tech stack) and keyboard navigation.
- **Papers** — searchable 20-paper table with DOI links, emerald-highlighted BASE paper, CSV/JSON
  export.
- **Extraction** — server-side filtering (property / source / search), pagination, evidence-sentence
  tooltips + full-sentence dialog, extraction funnel stats.
- **Dataset** — cleaning funnel (4,604 → 4,601), stats cards, cleaning-report table, 24-bin
  histogram, benchmark rationale.
- **Features** — XGBoost gain horizontal bars, family breakdown (31 + 32), 77 → 63 selection
  funnel, 63 feature chips, ablation chart with ±std error bars.
- **Models** — CV leaderboard (bold emerald BEST row), MAE & R² bar charts, normalised radar,
  hold-out card, feature-ablation panel, spot-check parity table + predicted-vs-measured line
  chart, F-score comparison card, published-reference note.
- **Discovery** — #1 banner card, family filter, search, 5 sort modes, medal-highlighted top-10,
  rank-vs-gap scatter, pagination.
- **Report Builder** — print-ready live document (header block, 9 sections, all tables), Print
  (window.print with dedicated print CSS), HTML + Markdown downloads.
- **Export Center** — 9 export cards: 5 datasets (CSV/JSON with proper header rows), **PDF report
  (verified run)**, **PDF report (live run — unlocks after a browser run)**, HTML report and
  Markdown summary.
- **Docs & About** — Colab run guide, tech stack table, API reference, GitHub push & Vercel deploy
  walkthroughs, data provenance note.

### 🖨️ PDF reports (jspdf + jspdf-autotable)

Both verified-run and live-run reports are multi-page A4 documents with a dark cover, a
**repeating header band on every page** (project · run id · date · report title), footers with
page numbers and timestamps, and up to ten sections: run configuration, summary KPIs, pipeline
stages, paper corpus, extraction evidence, structured records, CV leaderboard, **per-fold
calculation detail (train/val rows, fold-by-fold metrics, mean ± std row)**, feature importance,
discovery top-25 and the honesty note.

## 🧰 Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) + lucide-react |
| Animation | Framer Motion 12 (view transitions, staggered cards, animated counters) |
| Charts | Recharts 2 (histogram, leaderboards, radar, scatter, parity, error bars) |
| State | Zustand 5 (UI + live run store) + TanStack Query 5 (server data) |
| Live engine | Web Worker + pure-TypeScript ML (ridge, RF, GBR, XGBoost-style, MLP) |
| PDF/text | jspdf + jspdf-autotable (PDF reports) · pdfjs-dist (browser PDF upload) |
| Theming | next-themes (dark premium slate/zinc + emerald/teal, light mode) |
| Toasts | sonner |
| Database | Prisma ORM + SQLite — **optional**, static fallback included |
| Pipeline (ML) | PyMuPDF · MatSciBERT (`m3rg-iitd/matscibert`) · PCA · scikit-learn · XGBoost |
| Benchmark | Matbench `expt_gap` (4,601 clean experimental band gaps) |

## 📁 Project structure

```
├── prisma/
│   ├── schema.prisma        # Paper, StructuredRecord, DiscoveryCandidate, ModelResult, FeatureImportance, RunArtifact, UploadedPaper
│   └── seed.ts              # seeds DB from src/lib/data.ts (optional local persistence)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── overview/route.ts    # GET — KPIs, pipeline health, best model, F-score
│   │   │   ├── papers/route.ts      # GET — 20-paper corpus
│   │   │   ├── records/route.ts     # GET — ?property=&source=&q=&page=&pageSize=
│   │   │   ├── dataset/route.ts     # GET — stats + cleaning report + histogram
│   │   │   ├── features/route.ts    # GET — importance + selected + ablation
│   │   │   ├── models/route.ts      # GET — CV leaderboard + holdout + spot checks
│   │   │   ├── discovery/route.ts   # GET — ?family=&q=&sort=&page=&pageSize=
│   │   │   ├── pipeline/route.ts    # GET — 9 verified stages
│   │   │   ├── runs/route.ts        # POST/GET/DELETE — live-run artifacts (reopen support)
│   │   │   ├── uploads/route.ts    # POST/GET/DELETE — uploaded-paper persistence (Prisma ↔ IndexedDB sync)
│   │   │   ├── embed/route.ts      # GET status probe / POST — Hugging Face MatSciBERT proxy
│   │   │   ├── export/route.ts     # GET — ?entity=&format= (attachment download)
│   │   │   └── report/route.ts      # GET — ?format=html|md (full report)
│   │   ├── globals.css      # theme variables (emerald/teal, no indigo/blue) + print CSS
│   │   ├── layout.tsx       # fonts, metadata, Providers (theme + query + sonner)
│   │   └── page.tsx         # the single / route → AppShell
│   ├── components/
│   │   ├── app-shell.tsx    # sidebar (pipeline-ordered, live dots) + header + footer
│   │   ├── views/           # 12 view components (live lab, overview … docs)
│   │   ├── live/            # ⭐ Live Lab: run-control-bar (upload · models · speed ·
│   │   │                    #   embedding source), pipeline-stepper, stage-workspace,
│   │   │                    #   stage panels (papers / extracted text / embeddings / fold
│   │   │                    #   detail), output panels, terminal, run summary, live-data
│   │   │                    #   strip + view-live-panels (inbuilt live layer per stage view)
│   │   ├── animated-counter.tsx, export-buttons.tsx, view-header.tsx, view-states.tsx
│   │   └── providers.tsx
│   ├── workers/
│   │   └── pipeline.worker.ts  # ⭐ the live engine host (runs off the main thread)
│   ├── hooks/use-api.ts     # typed fetchers + TanStack Query hooks
│   └── lib/
│       ├── data.ts          # ⭐ SINGLE SOURCE OF TRUTH — all verified run data
│       ├── engine/          # ⭐ pure-TS live pipeline: text-mining, formula parser, Magpie
│       │                    #   features, 5 ML models, discovery, 9-stage orchestrator
│       ├── engine-data/     # bundled papers text + Matbench expt_gap + element table
│       ├── live-run-store.ts   # worker lifecycle + streaming run state + embed bridge (Zustand)
│       ├── live-report.ts      # jspdf PDF builder (verified + live modes)
│       ├── live-exports.ts     # CSV/JSON builders for live-run downloads
│       ├── live-stage-info.ts  # shared 9-stage metadata (stepper / tabs / deep links)
│       ├── pdf-extract.ts      # pdf.js browser text extraction for uploads
│       ├── uploads-idb.ts      # IndexedDB upload library (zero-config persistence) + server sync
│       ├── types.ts         # shared domain types
│       ├── store.ts         # Zustand UI store
│       ├── db-optional.ts   # try Prisma → fall back to data.ts (Vercel-safe)
│       ├── db.ts            # Prisma client singleton
│       ├── report.ts        # HTML + Markdown report generators
│       ├── format.ts        # CSV builder, download helpers, formatters
│       └── chart-theme.ts   # emerald/teal/amber chart palette
├── .env.example
└── README.md
```

## 🔑 API keys (all optional)

The platform is **100% functional with zero keys**. Two optional unlocks:

| Key | Where | Unlocks |
| --- | --- | --- |
| `HF_TOKEN` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (free, “Read” scope) | Real MatSciBERT embeddings for every live run — the server-side `/api/embed` proxy keeps the token off the client |
| `DATABASE_URL` | [neon.tech](https://neon.tech) or Vercel Postgres (free tier) | Server-side persistence of uploaded papers + completed runs (Prisma); without it, IndexedDB + localStorage keep everything in-browser |

Local: copy `.env.example` → `.env.local` and fill in what you have. On Vercel: Project Settings →
Environment Variables → add → Redeploy. See **Docs & About → API Keys & Integrations** inside the app
for the live status probe.

## 🚀 Quickstart

```bash
# 1 · install dependencies
bun install            # or: npm install / pnpm install

# 2 · (optional) set up the local SQLite database + keys
cp .env.example .env                  # DATABASE_URL="file:./db/custom.db" (+ optional HF_TOKEN)
bun run db:push                       # create tables
bun run db:seed                       # seed all verified data (20 papers, 17 records,
                                      #   111 candidates, 5 models, 15 importances)

# 3 · run the dev server
bun run dev            # http://localhost:3000

# 4 · production build
bun run build && bun run start
```

> **No database? No keys? No problem.** Every API route falls back to `src/lib/data.ts`, uploads
> persist in the browser (IndexedDB), and the embedding layer falls back to the local deterministic
> encoder — the app is fully functional (and fully deployable) with zero configuration.

## 🔌 API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/overview` | KPI stats, pipeline health, best model, F-score comparison, persistence probe |
| GET | `/api/papers` | 20-paper corpus with roles and DOIs |
| GET | `/api/records` | Structured records — filters: `property`, `source`, `q`, `page`, `pageSize` |
| GET | `/api/dataset` | Dataset stats, cleaning report, band-gap histogram |
| GET | `/api/features` | Feature importance, selected features, ablation results |
| GET | `/api/models` | CV leaderboard, hold-out result, spot checks, published reference |
| GET | `/api/discovery` | 111 candidates — filters: `family`, `q`, `sort`, `page`, `pageSize` |
| GET | `/api/pipeline` | 9 pipeline stages with full detail |
| POST | `/api/runs` | Save a completed live-run artifact (records, CV, discovery) |
| GET | `/api/runs` | List saved runs · `?runId=` returns the full artifact for reopen |
| DELETE | `/api/runs` | Remove a saved artifact (`?runId=`) |
| POST | `/api/uploads` | **Store an uploaded paper** (pdf.js-extracted pages) — Prisma when configured, browser-only otherwise |
| GET | `/api/uploads` | **List stored uploads** · `?filename=` returns full page text for cross-device sync |
| DELETE | `/api/uploads` | Remove one stored upload (`?id=`) |
| GET | `/api/embed` | **MatSciBERT status probe** — key detected, model, reduction pipeline |
| POST | `/api/embed` | **Real embeddings** — batches sentences to the HF Inference API (m3rg-iitd/matscibert), mean-pools + projects to 32-d; `{ vectors: null }` when no key → engine falls back locally |
| GET | `/api/export` | File download — `entity=papers\|records\|discovery\|models\|features`, `format=csv\|json` |
| GET | `/api/report` | Full report — `format=html\|md` |

PDF reports are generated client-side (jspdf) from the Report Builder, the Run Summary panel and
both Export Center PDF cards — no server round-trip, works identically on Vercel.

## 📤 Export guide

| File | Rows / content |
| --- | --- |
| `24041_103_papers.csv/.json` | 20 papers (id, short_name, title, year, venue, doi, role) |
| `24041_103_structured_records.csv/.json` | 17 records incl. full evidence sentences |
| `24041_103_discovery_candidates.csv/.json` | 111 candidates (rank, formula, family, predicted gap) |
| `24041_103_model_results.csv/.json` | 5 CV models + hold-out + published reference |
| `24041_103_feature_importance.csv/.json` | 15 XGBoost gain importances |
| `24041_103_report.pdf` | **PDF report — verified run** (cover, repeating page headers, 10 sections, page numbers) |
| `24041_103_report.pdf` (live) | **PDF report — live run** (adds paper corpus, extraction evidence, per-fold CV calculation) |
| `24041_103_report.html` | Standalone styled report — header block, 9 sections, all tables |
| `24041_103_summary.md` | Markdown summary of the whole run |
| Live-run CSVs | sentences · records · dataset · features · importance · CV folds · discovery · papers (from the Live Lab panels) |
| Live-run JSON bundle | full run snapshot — config, sentences, records, dataset, CV, discovery |

Every CSV begins with a proper header row; JSON files embed project metadata. Downloads are
generated server-side with `Content-Disposition: attachment` and saved client-side via
`Blob` + `URL.createObjectURL`, with a sonner toast confirming filename + byte size.

## 🐙 Push to GitHub

```bash
git init
git add .
git commit -m "feat: MatSciML Discovery platform (capstone 24041_103)"
git branch -M main
git remote add origin https://github.com/<your-user>/matsciml-discovery.git
git push -u origin main
```

## ▲ Deploy to Vercel

1. Go to **vercel.com → Add New… → Project**.
2. **Import** the GitHub repository you just pushed.
3. Vercel auto-detects **Next.js** — keep the default build settings.
4. **No environment variables needed** — API routes fall back to the bundled `src/lib/data.ts`
   constants when the SQLite database is absent, so the deployed site works with zero config.
5. Click **Deploy** — done. All 12 views, the Live Pipeline Lab (browser engine needs no server
   compute), filters, charts and every export work on serverless. Live-run artifacts persist to
   SQLite when available and transparently fall back to `localStorage` when the database is absent.

*(Optional: to use a database in production, add a `DATABASE_URL` env var pointing at a hosted
database — the schema in `prisma/schema.prisma` is ready to migrate.)*

## 🖼️ Screenshots

> Six live screenshots are bundled in [`docs/screenshots/`](docs/screenshots/) — Overview, Pipeline
> Explorer, Models leaderboard, Discovery, Report Builder, Export Center. The Live Pipeline Lab
> (control bar · nine-stage rail · stage workspace · fold calculation · discovery podium) is best
> experienced live in the preview.

## 🧾 Data provenance

Every number in this platform comes from the verified zero-error execution of
`24041_103_RUN_ALL.ipynb` (18/18 cells, Python 3.12.15, CPU-only, 16 notebook sections). The
notebook exported `24041_103_all_outputs.zip`, whose CSVs were ingested **verbatim** into
`src/lib/data.ts`:

`cross_validation_results.csv` · `feature_ablation.csv` · `holdout_results.csv` ·
`spot_check_predictions.csv` · `feature_importance.csv` · `selected_features.csv` ·
`cleaning_report.csv` · `dataset_summary.csv` · `structured_dataset_tabular.csv` ·
`new_material_discovery.csv` · `extraction_cleaning_report.csv`

The only reconstructed artifact is the band-gap histogram (24 bins rebuilt from the verified
summary statistics — range 0–11.7 eV, mean 0.976 eV, std 1.445 eV, 4,601 rows, right-skewed),
because the raw per-row benchmark file is not redistributed.

## 📄 License

MIT — see the license header in your repository settings, or add a `LICENSE` file:

```
MIT License

Copyright (c) 2026 Capstone 24041_103

Permission is hereby granted, free of charge, to any person obtaining a copy...
```
