"use client";

import { BadgeCheck, BookMarked, Cloud, Cpu, GitBranch, Info, KeyRound, Rocket, Server, ShieldAlert, Sparkles, TerminalSquare, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

import { ViewHeader } from "@/components/view-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_REFERENCE, PROJECT, TECH_STACK } from "@/lib/data";
import { useLiveRunStore } from "@/lib/live-run-store";
import { useUiStore } from "@/lib/store";

function CodeBlock({ lines, title }: { lines: string[]; title: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-3 py-1.5">
        <TerminalSquare className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      <pre className="overflow-x-auto bg-zinc-950 p-3 text-[11px] leading-relaxed text-emerald-100">
        {lines.join("\n")}
      </pre>
    </div>
  );
}

export function DocsView() {
  const embedStatus = useLiveRunStore((s) => s.embedStatus);
  const refreshEmbedStatus = useLiveRunStore((s) => s.refreshEmbedStatus);
  const setView = useUiStore((s) => s.setView);

  useEffect(() => {
    void refreshEmbedStatus();
  }, [refreshEmbedStatus]);

  return (
    <div className="space-y-6">
      <ViewHeader
        eyebrow="Reference"
        title="Docs & About"
        description="What this platform is, how the underlying pipeline runs, the full tech stack, the API surface, and step-by-step guides for pushing to GitHub and deploying to Vercel."
      />

      {/* API keys & integrations */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} aria-label="API keys and integrations">
        <Card className="border-teal-500/30 bg-gradient-to-br from-teal-500/8 via-transparent to-emerald-500/8">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-teal-500" aria-hidden="true" />
              API Keys & Integrations
              {embedStatus ? (
                embedStatus.hasKey ? (
                  <Badge className="gap-1 bg-teal-600 text-[10px] text-white hover:bg-teal-600">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    HF token detected — MatSciBERT LIVE
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400">
                    running key-free — everything still works
                  </Badge>
                )
              ) : null}
            </CardTitle>
            <CardDescription>
              The platform is 100% functional with ZERO keys — uploads persist in the browser (IndexedDB) and the
              embedding layer falls back to a local deterministic encoder. Add the optional keys below to unlock
              the enhanced server-side modes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-36">Key</TableHead>
                    <TableHead className="min-w-40">Where to get it</TableHead>
                    <TableHead className="min-w-64">What it unlocks</TableHead>
                    <TableHead className="w-24 text-center">Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-secondary/60">
                    <TableCell className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">HF_TOKEN</TableCell>
                    <TableCell className="text-xs">
                      <a
                        href="https://huggingface.co/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-2 hover:text-teal-500 hover:underline"
                      >
                        huggingface.co/settings/tokens ↗
                      </a>
                      <span className="block text-[10px] text-muted-foreground">free account · “Read” token is enough</span>
                    </TableCell>
                    <TableCell className="text-xs leading-relaxed">
                      Real MatSciBERT embeddings (m3rg-iitd/matscibert) for every live run — the worker calls
                      <span className="font-mono text-[10px]"> /api/embed </span>
                      which proxies the Hugging Face Inference API server-side (your token never reaches the browser).
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] font-normal">optional</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-secondary/60">
                    <TableCell className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">DATABASE_URL</TableCell>
                    <TableCell className="text-xs">
                      <a
                        href="https://neon.tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-2 hover:text-teal-500 hover:underline"
                      >
                        neon.tech ↗
                      </a>
                      <span className="block text-[10px] text-muted-foreground">or Vercel Postgres — free tier works</span>
                    </TableCell>
                    <TableCell className="text-xs leading-relaxed">
                      Server-side persistence: uploaded papers and completed runs are stored in Postgres
                      (Prisma) and synced across devices. Without it, the same data persists in this browser via IndexedDB.
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] font-normal">optional</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <CodeBlock
                title="local setup — .env.local"
                lines={[
                  "# optional — real MatSciBERT embeddings",
                  "HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxx",
                  "",
                  "# optional — server persistence (SQLite locally / Neon on Vercel)",
                  "DATABASE_URL=file:./db/custom.db",
                ]}
              />
              <CodeBlock
                title="vercel setup — project settings → environment variables"
                lines={[
                  "HF_TOKEN        = hf_xxxxxxxxxxxxxxxxxxxxxxxx",
                  "DATABASE_URL    = postgresql://user:pass@host/db?sslmode=require",
                  "",
                  "# redeploy after adding — the /api/embed route probes the key live:",
                  "#   GET /api/embed  →  { hasKey: true, model: \"m3rg-iitd/matscibert\" }",
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-teal-500/40 text-teal-700 hover:bg-teal-500/15 dark:text-teal-300"
                onClick={() => setView("live")}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Try it in the Live Lab
              </Button>
              <p className="text-xs text-muted-foreground">
                Current server probe:{" "}
                <span className="font-mono text-[11px]">
                  {embedStatus ? `${embedStatus.hasKey ? "key detected" : "no key"} · ${embedStatus.model}` : "checking…"}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Live Pipeline Lab */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} aria-label="Live Pipeline Lab">
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Live Pipeline Lab — the real-time browser engine
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                FLAGSHIP
              </Badge>
            </CardTitle>
            <CardDescription>
              The first sidebar item runs the entire capstone pipeline as real computation inside your browser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-foreground/90">
            <p>
              The Live Pipeline Lab executes every stage for real in a dedicated web worker (the UI never
              blocks): pdf.js text extraction of uploaded PDFs, the exact notebook regexes for band-gap
              mining, a recursive-descent chemical-formula parser, 63 Magpie-style composition features,
              5-fold cross-validation of <strong>five ML models written from scratch in TypeScript</strong>{" "}
              (ridge regression, random forest, gradient boosting, XGBoost-style Newton boosting, and an
              Adam-trained MLP — all on Float64Arrays with zero allocation in hot loops), and finally
              new-material discovery screening with the best model.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["9 live stages", "streaming terminal", "live CV leaderboard", "discovery podium", "PDF report", "saved runs"].map((chip) => (
                <Badge key={chip} variant="secondary" className="font-mono text-[11px] font-normal">
                  {chip}
                </Badge>
              ))}
            </div>
            <Button size="sm" className="w-fit gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => useUiStore.getState().setView("live")}>
              <Cpu className="h-4 w-4" aria-hidden="true" />
              Open the Live Pipeline Lab
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      {/* Real vs simulated capability matrix */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} aria-label="Real versus simulated capability matrix">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Real vs simulated — the honesty matrix
            </CardTitle>
            <CardDescription>
              What the live browser engine computes for real, and what is honestly labelled as simulated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="pr-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">Capability</TableHead>
                    <TableHead className="min-w-28">Verified notebook</TableHead>
                    <TableHead className="min-w-28">Live browser run</TableHead>
                    <TableHead className="min-w-48">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      capability: "PDF text extraction",
                      verified: "PyMuPDF",
                      live: "pdf.js (main thread)",
                      note: "both real — live runs client-side on uploaded files",
                      real: true,
                    },
                    {
                      capability: "Band-gap regex mining",
                      verified: "Python re",
                      live: "identical regexes, TypeScript",
                      note: "ported verbatim (AFTER / BEFORE / symbolic patterns)",
                      real: true,
                    },
                    {
                      capability: "Formula parsing",
                      verified: "Python parser",
                      live: "recursive descent, TS",
                      note: "same validation rules (≤6 elements, ≥1.5 atoms)",
                      real: true,
                    },
                    {
                      capability: "Magpie composition features",
                      verified: "magpie / pymatgen",
                      live: "94-element table, 63 features",
                      note: "real fraction-weighted statistics in both",
                      real: true,
                    },
                    {
                      capability: "Text embeddings",
                      verified: "m3rg-iitd/matscibert (768-d)",
                      live: "SIMULATED (mulberry32 hash → 32-d)",
                      note: "MatSciBERT cannot run in-browser; every UI surface labels this honestly",
                      real: false,
                    },
                    {
                      capability: "5 ML models + 5-fold CV",
                      verified: "scikit-learn / XGBoost",
                      live: "real TS re-implementations in a worker",
                      note: "identical seeded folds; small metric deltas expected",
                      real: true,
                    },
                    {
                      capability: "Discovery screening",
                      verified: "XGBoost predictions",
                      live: "best live model predictions",
                      note: "same candidate families (ABO₃, spinels, sesquioxides…)",
                      real: true,
                    },
                  ].map((row) => (
                    <TableRow key={row.capability} className="hover:bg-secondary/60">
                      <TableCell className="text-xs font-semibold">{row.capability}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.verified}</TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={
                            row.real
                              ? "font-medium text-emerald-600 dark:text-emerald-400"
                              : "font-medium text-amber-600 dark:text-amber-400"
                          }
                        >
                          {row.live}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.section>

      {/* About */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} aria-label="About the project">
        <Card className="border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 via-transparent to-teal-500/8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookMarked className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              About the project
            </CardTitle>
            <CardDescription>{PROJECT.fullTitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-foreground/90">
            <p>
              This platform is the deliverable front-end for capstone{" "}
              <span className="font-mono font-semibold">24041_103</span>. It operationalises the base
              paper —{" "}
              <a
                href={`https://doi.org/${PROJECT.basePaperDoi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline underline-offset-2 hover:text-teal-500 dark:text-teal-400"
              >
                Jiang et al. 2025, npj Comput. Mater. 11:79
              </a>{" "}
              — into an end-to-end, fully verified pipeline: 20 open-access papers are mined for
              materials properties with NLP; MatSciBERT embeddings and Magpie-style composition
              features feed an XGBoost regressor trained on the Matbench expt_gap benchmark; and the
              trained model screens 111 brand-new oxide candidates.
            </p>
            <p>
              Every metric shown across the 11 views comes from the zero-error execution of{" "}
              <span className="font-mono">24041_103_RUN_ALL.ipynb</span> (18/18 cells) and was
              exported verbatim from its CSV outputs — nothing on this site is simulated.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["20 papers", "295 property sentences", "4,601 clean samples", "63 features", "5 models", "111 candidates", "F-score 75.5 > 73.33"].map(
                (chip) => (
                  <Badge key={chip} variant="secondary" className="font-mono text-[11px] font-normal">
                    {chip}
                  </Badge>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* How the pipeline runs */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} aria-label="How the pipeline runs">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-teal-500" aria-hidden="true" />
              How the pipeline runs (Colab notebook)
            </CardTitle>
            <CardDescription>
              24041_103_RUN_ALL.ipynb · 18 cells · 16 sections · runs top-to-bottom on a free Colab T4
              (verified on a 2-thread CPU)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5">
              {[
                "Sections 1–2 — Mount Google Drive (optional), install requirements (PyMuPDF, transformers, xgboost, scikit-learn, pandas), and download the 20-paper corpus + Matbench expt_gap CSV.",
                "Sections 3–7 — Extract text from 315 PDF pages, mine 295 property sentences, embed them with MatSciBERT (m3rg-iitd/matscibert), and build the structured Material|Property|Value table.",
                "Section 8 — Load and clean Matbench expt_gap: 4,604 → 4,601 rows (3 duplicate compositions removed).",
                "Sections 9–11 — Featurise (45 Magpie-style + PCA-32 text), select 63 features, train 5 models with 5-fold CV.",
                "Sections 12–14 — Evaluate: leaderboard, feature ablation, hold-out test, spot-check predictions.",
                "Sections 15–16 — Screen 111 discovery candidates, plot all charts, and download everything as 24041_103_all_outputs.zip.",
              ].map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-3 rounded-lg bg-secondary/40 p-3 text-xs leading-relaxed text-foreground/90"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {i + 1}
                  </span>
                  {step}
                </motion.li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              The notebook is CPU-friendly; a free Colab T4 GPU accelerates the MatSciBERT embedding
              cell but is not required.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* Tech stack + API reference */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} aria-label="Tech stack table">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Tech stack</CardTitle>
              <CardDescription>Web platform + pipeline ML stack</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96 pr-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Layer</TableHead>
                      <TableHead>Technology</TableHead>
                      <TableHead className="min-w-40">Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TECH_STACK.map((row) => (
                      <TableRow key={row.layer} className="hover:bg-secondary/60">
                        <TableCell className="text-xs font-semibold">{row.layer}</TableCell>
                        <TableCell className="text-xs">{row.tech}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} aria-label="API reference table">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">API reference</CardTitle>
              <CardDescription>All routes are GET + JSON (exports return files)</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96 pr-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Method</TableHead>
                      <TableHead className="min-w-32">Endpoint</TableHead>
                      <TableHead className="min-w-48">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {API_REFERENCE.map((row) => (
                      <TableRow key={`${row.method}-${row.path}`} className="hover:bg-secondary/60">
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                            {row.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.path}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* GitHub + Vercel */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} aria-label="GitHub push steps">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Push to GitHub
              </CardTitle>
              <CardDescription>From the project root, after the dev server is stopped</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock
                title="git — initial push"
                lines={[
                  "git init",
                  "git add .",
                  'git commit -m "feat: MatSciML Discovery platform (capstone 24041_103)"',
                  "git branch -M main",
                  "git remote add origin https://github.com/<your-user>/matsciml-discovery.git",
                  "git push -u origin main",
                ]}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Recommended: add a <span className="font-mono">.gitignore</span> covering{" "}
                <span className="font-mono">node_modules/</span>,{" "}
                <span className="font-mono">.next/</span>, <span className="font-mono">db/</span> and{" "}
                <span className="font-mono">dev.log</span> before the first commit.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} aria-label="Vercel deploy steps">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Deploy to Vercel
              </CardTitle>
              <CardDescription>No environment variables needed — static data fallback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="space-y-2 text-xs leading-relaxed text-foreground/90">
                {[
                  "Go to vercel.com → Add New… → Project.",
                  "Import the GitHub repository you just pushed (matsciml-discovery).",
                  "Vercel auto-detects the framework as Next.js — keep the default build command (next build).",
                  "Do NOT add any environment variables: every API route falls back to the bundled data.ts constants when the SQLite database is absent, so the deployed site works with zero config.",
                  "Click Deploy — done. Every view, filter, chart and export works on the serverless deployment.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex items-start gap-2.5 rounded-lg border border-teal-500/30 bg-teal-500/10 p-3 text-xs leading-relaxed text-foreground/90">
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" aria-hidden="true" />
                <p>
                  Optional local database: set <span className="font-mono">DATABASE_URL</span> to a
                  SQLite file, run <span className="font-mono">bun run db:push &amp;&amp; bun run db:seed</span>{" "}
                  — the API automatically prefers the seeded Prisma database when present.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Data provenance */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} aria-label="Data provenance">
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Data provenance
            </CardTitle>
            <CardDescription>Where every number comes from</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-foreground/90">
            <p>
              All results shown in this platform were produced by the verified zero-error execution
              of <span className="font-mono">24041_103_RUN_ALL.ipynb</span> (18/18 cells, Python
              3.12.15, CPU-only). The notebook exported its outputs as{" "}
              <span className="font-mono">24041_103_all_outputs.zip</span>; the following CSVs were
              then ingested <em>verbatim</em> into <span className="font-mono">src/lib/data.ts</span>:
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "cross_validation_results.csv",
                "feature_ablation.csv",
                "holdout_results.csv",
                "spot_check_predictions.csv",
                "feature_importance.csv",
                "selected_features.csv",
                "cleaning_report.csv",
                "dataset_summary.csv",
                "structured_dataset_tabular.csv",
                "new_material_discovery.csv",
                "extraction_cleaning_report.csv",
              ].map((file) => (
                <Badge key={file} variant="outline" className="font-mono text-[10px] font-normal text-muted-foreground">
                  {file}
                </Badge>
              ))}
            </div>
            <Separator className="my-4" />
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              The band-gap histogram on the Overview and Dataset views is the only reconstructed
              artifact: 24 bins rebuilt from the verified summary statistics (range 0–11.7 eV, mean
              0.976 eV, std 1.445 eV, 4,601 rows, right-skewed) because the raw per-row benchmark file
              is not redistributed.
            </p>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
