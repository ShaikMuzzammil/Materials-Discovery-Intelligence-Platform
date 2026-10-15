"use client";

/**
 * ============================================================================
 *  VIEW LIVE PANELS — the inbuilt real-time layer of the platform.
 *
 *  Each pipeline stage view (Papers · Extraction · Dataset · Features ·
 *  Models · Discovery) renders one of these panels ABOVE its verified
 *  baseline content. The panel streams the REAL output of the live engine
 *  (web worker) for that stage — same store, same numbers, one connected
 *  end-to-end system. Panels return null until the run reaches their stage,
 *  so views gracefully fall back to the verified baseline.
 * ============================================================================
 */

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Radio, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MODEL_LABELS, type ModelId } from "@/lib/engine/types";
import { useLiveRunStore } from "@/lib/live-run-store";
import { useUiStore } from "@/lib/store";

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                               */
/* -------------------------------------------------------------------------- */

function PanelHeader({
  stage,
  title,
  counter,
  extra,
}: {
  stage: number;
  title: string;
  counter: string;
  extra?: React.ReactNode;
}) {
  const stages = useLiveRunStore((s) => s.stages);
  const running = useLiveRunStore((s) => s.running);
  const embedSource = useLiveRunStore((s) => s.embedSource);
  const state = stages[stage - 1];
  const status = state?.status ?? "idle";
  const setView = useUiStore((s) => s.setView);

  return (
    <div className="flex flex-col gap-3 border-b border-emerald-500/25 bg-emerald-500/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          {status === "done" ? (
            <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
          ) : status === "running" ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
          ) : (
            <Radio className="h-4.5 w-4.5" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {title}
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
            >
              STAGE {String(stage).padStart(2, "0")}
            </Badge>
            {status === "running" ? (
              <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
                />
                computing now
              </Badge>
            ) : null}
            {stage === 4 && embedSource === "huggingface" ? (
              <Badge className="gap-1 bg-teal-600 text-white hover:bg-teal-600">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                real MatSciBERT
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription className="mt-1 font-mono text-[11px] text-muted-foreground">{counter}</CardDescription>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {extra}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-emerald-500/40 px-2.5 text-[11px] text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
          onClick={() => setView("live")}
          aria-label="Open this stage in the Live Pipeline Lab"
        >
          {running ? "Watch live" : "Open"} in Live Lab
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/** Thin stage progress bar shown while the stage is computing. */
function StageProgress({ stage }: { stage: number }) {
  const stages = useLiveRunStore((s) => s.stages);
  const state = stages[stage - 1];
  if (!state || state.status !== "running" || state.progress <= 0) return null;
  return (
    <div className="px-5 pt-3">
      <Progress value={Math.round(state.progress * 100)} className="h-1.5" aria-label={`Stage ${stage} progress`} />
    </div>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
};

/* -------------------------------------------------------------------------- */
/*  1 · Papers — live corpus table                                             */
/* -------------------------------------------------------------------------- */

export function LiveCorpusPanel() {
  const papers = useLiveRunStore((s) => s.papers);
  const running = useLiveRunStore((s) => s.running);
  if (papers.length === 0 && !running) return null;

  const pages = papers.reduce((a, p) => a + p.pages, 0);
  const chars = papers.reduce((a, p) => a + p.chars, 0);

  return (
    <motion.div {...fadeUp}>
      <Card className="overflow-hidden border-emerald-500/30 shadow-sm">
        <PanelHeader
          stage={1}
          title="Live corpus — assembled right now"
          counter={`${papers.length} papers · ${pages.toLocaleString("en-US")} pages · ${chars.toLocaleString("en-US")} chars · ${papers.filter((p) => p.source === "upload").length} uploaded`}
        />
        <CardContent className="p-0">
          <div className="max-h-80 overflow-auto">
            <Table className="min-w-[720px]">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="min-w-56">Paper</TableHead>
                  <TableHead className="w-20 text-right">Pages</TableHead>
                  <TableHead className="w-28 text-right">Chars</TableHead>
                  <TableHead className="w-28">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((p, i) => (
                  <TableRow key={`${p.name}-${i}`} className="hover:bg-secondary/60">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="max-w-72 truncate font-mono text-xs">{p.name}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{p.pages}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {p.chars.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          p.source === "upload"
                            ? "border-teal-500/40 bg-teal-500/10 text-[10px] text-teal-600 dark:text-teal-400"
                            : "border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {p.source === "upload" ? "your upload" : "bundled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  2/3 · Extraction — preprocessed pages + mined property sentences           */
/* -------------------------------------------------------------------------- */

export function LiveExtractionPanel() {
  const sentencesTotal = useLiveRunStore((s) => s.sentencesTotal);
  const sentences = useLiveRunStore((s) => s.sentences);
  const extractedPages = useLiveRunStore((s) => s.extractedPages);
  const embeddingSamples = useLiveRunStore((s) => s.embeddingSamples);
  const embedSource = useLiveRunStore((s) => s.embedSource);
  const running = useLiveRunStore((s) => s.running);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? sentences.filter((s) => s.sentence.toLowerCase().includes(q) || (s.material ?? "").toLowerCase().includes(q))
        : sentences,
    [sentences, q],
  );

  if (sentencesTotal === 0 && extractedPages.length === 0 && !running) return null;

  const shown = filtered.slice(0, 60);
  const withGap = sentences.filter((s) => s.gapValue !== null).length;

  return (
    <motion.div {...fadeUp} className="space-y-4">
      <Card className="overflow-hidden border-emerald-500/30 shadow-sm">
        <PanelHeader
          stage={3}
          title="Live property mining — streaming from the engine"
          counter={`${sentencesTotal.toLocaleString("en-US")} property sentences · ${withGap.toLocaleString("en-US")} carry a band-gap value · ${sentences.filter((s) => s.material).length} mention a material`}
          extra={
            <div className="relative hidden w-56 md:block">
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter live sentences…"
                className="h-8 text-xs"
                aria-label="Filter live mined sentences"
              />
            </div>
          }
        />
        <StageProgress stage={3} />
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <ul className="divide-y divide-border/60">
              {shown.map((s, i) => (
                <li key={i} className="px-5 py-2.5">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground">{s.paper} · p{s.page}</span>
                    {s.material ? (
                      <Badge variant="outline" className="border-teal-500/40 bg-teal-500/10 px-1.5 py-0 font-mono text-[10px] text-teal-600 dark:text-teal-400">
                        {s.material}
                      </Badge>
                    ) : null}
                    {s.gapValue !== null ? (
                      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        {s.gapValue} eV{s.gapKind ? ` · ${s.gapKind}` : ""}
                      </Badge>
                    ) : null}
                    {s.properties.slice(0, 2).map((p) => (
                      <Badge key={p} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                        {p}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/85">{s.sentence}</p>
                </li>
              ))}
              {shown.length === 0 ? (
                <li className="px-5 py-8 text-center text-xs text-muted-foreground">
                  {running ? "Mining sentences…" : "No sentences match the filter."}
                </li>
              ) : null}
            </ul>
          </ScrollArea>
          <p className="border-t border-border/60 px-5 py-2 text-center font-mono text-[10px] text-muted-foreground">
            showing {shown.length} of {filtered.length.toLocaleString("en-US")} filtered · {sentencesTotal.toLocaleString("en-US")} total mined
          </p>
        </CardContent>
      </Card>

      {extractedPages.length > 0 ? (
        <Card className="overflow-hidden border-emerald-500/30 shadow-sm">
          <PanelHeader
            stage={2}
            title="Preprocessed page stream (stage 02 output)"
            counter={`${extractedPages.length} page previews · normalized whitespace, hyphenation repaired, sentence-split`}
          />
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              <ul className="divide-y divide-border/60">
                {extractedPages.map((page, i) => (
                  <li key={i} className="px-5 py-2.5">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{page.paper}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">page {page.page}/{page.totalPages}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{page.sentences} sentences · {page.chars.toLocaleString("en-US")} chars</span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{page.text.slice(0, 260)}…</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : null}

      {embeddingSamples.length > 0 ? (
        <Card className="overflow-hidden border-teal-500/30 shadow-sm">
          <PanelHeader
            stage={4}
            title="Embedding layer output"
            counter={
              embedSource === "huggingface"
                ? "real MatSciBERT (m3rg-iitd/matscibert) via Hugging Face · 768-d mean-pool → 32-d projection"
                : "local deterministic 32-d embedding (add HF_TOKEN for real MatSciBERT)"
            }
          />
          <CardContent className="p-0">
            <div className="max-h-72 overflow-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="min-w-80">Sentence</TableHead>
                    <TableHead className="w-64">Vector preview (first 8 dims)</TableHead>
                    <TableHead className="w-20 text-right">‖v‖</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {embeddingSamples.map((s, i) => (
                    <TableRow key={i} className="hover:bg-secondary/60">
                      <TableCell className="max-w-80 truncate text-xs text-foreground/85">{s.sentence}</TableCell>
                      <TableCell className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                        [{s.vector.slice(0, 8).map((v) => v.toFixed(2)).join(", ")}…]
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{s.norm.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  5/6 · Dataset — live structured records + benchmark join                   */
/* -------------------------------------------------------------------------- */

export function LiveDatasetPanel() {
  const records = useLiveRunStore((s) => s.records);
  const dataset = useLiveRunStore((s) => s.dataset);
  const running = useLiveRunStore((s) => s.running);
  if (records.length === 0 && !running) return null;

  return (
    <motion.div {...fadeUp}>
      <Card className="overflow-hidden border-emerald-500/30 shadow-sm">
        <PanelHeader
          stage={5}
          title="Live structured dataset — extracted records"
          counter={
            dataset
              ? `${records.length} records · ${dataset.rows.toLocaleString("en-US")} benchmark rows after join (${dataset.rows - 4601 >= 0 ? "+" : ""}${dataset.rows - 4601}) · ${dataset.matched.toLocaleString("en-US")} matches`
              : `${records.length} records · benchmark join pending…`
          }
        />
        <StageProgress stage={5} />
        <CardContent className="p-0">
          <div className="max-h-96 overflow-auto">
            <Table className="min-w-[880px]">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="min-w-32">Material</TableHead>
                  <TableHead className="w-24">Property</TableHead>
                  <TableHead className="w-20 text-right">Value</TableHead>
                  <TableHead className="w-16">Unit</TableHead>
                  <TableHead className="min-w-36">Conditions</TableHead>
                  <TableHead className="min-w-32">Source</TableHead>
                  <TableHead className="w-24 text-center">Benchmark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 100).map((r) => (
                  <TableRow key={r.id} className="hover:bg-secondary/60">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">{r.material}</TableCell>
                    <TableCell className="text-xs">{r.property}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">{r.value.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.unit}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.conditions || "—"}</TableCell>
                    <TableCell className="max-w-32 truncate font-mono text-[10px] text-muted-foreground">
                      {r.sourcePaper} · p{r.page}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.matchedInBenchmark ? (
                        <Badge className="bg-emerald-600 px-1.5 py-0 text-[10px] text-white hover:bg-emerald-600">matched</Badge>
                      ) : (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">—</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="border-t border-border/60 px-5 py-2 text-center font-mono text-[10px] text-muted-foreground">
            showing {Math.min(records.length, 100)} of {records.length} live records{dataset ? ` · joined dataset: ${dataset.rows.toLocaleString("en-US")} rows (Matbench expt_gap)` : ""}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  7 · Features — live feature engineering                                    */
/* -------------------------------------------------------------------------- */

export function LiveFeaturesPanel() {
  const features = useLiveRunStore((s) => s.features);
  const importance = useLiveRunStore((s) => s.importance);
  const running = useLiveRunStore((s) => s.running);
  if (features === null && importance.length === 0 && !running) return null;

  const composition = features?.names.filter((n) => !n.startsWith("txt_")).length ?? 0;
  const text = features?.names.filter((n) => n.startsWith("txt_")).length ?? 0;

  return (
    <motion.div {...fadeUp}>
      <Card className="overflow-hidden border-emerald-500/30 shadow-sm">
        <PanelHeader
          stage={7}
          title="Live feature engineering"
          counter={
            features
              ? `${features.names.length} computed (${composition} Magpie composition + ${text} embedding) → ${features.kept.length} kept after variance + correlation filters`
              : "computing composition + embedding features…"
          }
        />
        <StageProgress stage={7} />
        <CardContent className="space-y-4 p-5">
          {features ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">computed</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{features.names.length}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">kept</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{features.kept.length}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">variance + correlation dropped</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{features.names.length - features.kept.length}</p>
              </div>
            </div>
          ) : null}
          {features ? (
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
              <p className="mb-2 text-xs font-semibold text-foreground">Kept feature names</p>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-auto">
                {features.kept.map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className={
                      name.startsWith("txt_")
                        ? "border-teal-500/40 bg-teal-500/10 px-1.5 py-0 font-mono text-[10px] text-teal-600 dark:text-teal-400"
                        : "border-border/60 px-1.5 py-0 font-mono text-[10px] text-muted-foreground"
                    }
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {importance.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">
                Permutation importance — computed after the live model comparison (stage 08)
              </p>
              <div className="max-h-60 overflow-auto rounded-lg border border-border/60">
                <Table className="min-w-[420px]">
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="w-12 text-center">Rank</TableHead>
                      <TableHead className="min-w-40">Feature</TableHead>
                      <TableHead className="w-24 text-right">Importance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importance.slice(0, 15).map((row) => (
                      <TableRow key={row.rank} className="hover:bg-secondary/60">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">{row.rank}</TableCell>
                        <TableCell className="font-mono text-xs">{row.feature}</TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                          {row.importance.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  8 · Models — live 5-fold CV, fold by fold                                  */
/* -------------------------------------------------------------------------- */

export function LiveModelsPanel() {
  const folds = useLiveRunStore((s) => s.folds);
  const modelsDone = useLiveRunStore((s) => s.modelsDone);
  const bestModel = useLiveRunStore((s) => s.bestModel);
  const holdout = useLiveRunStore((s) => s.holdout);
  const running = useLiveRunStore((s) => s.running);
  if (Object.keys(folds).length === 0 && Object.keys(modelsDone).length === 0 && !running) return null;

  const allFolds = (Object.values(folds) as (typeof folds)[ModelId][]).flat();

  return (
    <motion.div {...fadeUp} className="space-y-4">
      <Card className="overflow-hidden border-emerald-500/30 shadow-sm">
        <PanelHeader
          stage={8}
          title="Live 5-fold cross-validation — fold by fold"
          counter={`${allFolds.length} folds finished · ${Object.keys(modelsDone).length} models complete${bestModel ? ` · best: ${MODEL_LABELS[bestModel].split(" (")[0]}` : ""}`}
        />
        <StageProgress stage={8} />
        <CardContent className="space-y-4 p-5">
          {/* per-model progress cards */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(modelsDone) as ModelId[]).length > 0
              ? (Object.keys(modelsDone) as ModelId[]).map((m) => {
                  const done = modelsDone[m];
                  if (!done) return null;
                  return (
                    <div
                      key={m}
                      className={`rounded-xl border p-4 ${bestModel === m ? "border-emerald-500/50 bg-emerald-500/10" : "border-border/60 bg-secondary/30"}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-foreground">{MODEL_LABELS[m]}</p>
                        {bestModel === m ? (
                          <Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">BEST</Badge>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="font-mono text-[10px] uppercase text-muted-foreground">MAE</p>
                          <p className="font-mono text-sm font-bold tabular-nums">{done.maeMean.toFixed(4)}</p>
                          <p className="font-mono text-[9px] text-muted-foreground">±{done.maeStd.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase text-muted-foreground">RMSE</p>
                          <p className="font-mono text-sm font-bold tabular-nums">{done.rmseMean.toFixed(4)}</p>
                          <p className="font-mono text-[9px] text-muted-foreground">±{done.rmseStd.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase text-muted-foreground">R²</p>
                          <p className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {done.r2Mean.toFixed(4)}
                          </p>
                          <p className="font-mono text-[9px] text-muted-foreground">±{done.r2Std.toFixed(3)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              : (
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/30 p-4 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" aria-hidden="true" />
                  Training first model — folds will stream in below…
                </div>
              )}
          </div>

          {/* fold table */}
          {allFolds.length > 0 ? (
            <div className="max-h-72 overflow-auto rounded-lg border border-border/60">
              <Table className="min-w-[560px]">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="min-w-44">Model</TableHead>
                    <TableHead className="w-16 text-center">Fold</TableHead>
                    <TableHead className="w-24 text-right">MAE</TableHead>
                    <TableHead className="w-24 text-right">RMSE</TableHead>
                    <TableHead className="w-24 text-right">R²</TableHead>
                    <TableHead className="w-20 text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFolds.map((f, i) => (
                    <TableRow key={`${f.model}-${f.fold}-${i}`} className="hover:bg-secondary/60">
                      <TableCell className="text-xs">
                        {MODEL_LABELS[f.model]}
                        {bestModel === f.model ? <span className="ml-1.5 text-[10px] text-emerald-500">★</span> : null}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs tabular-nums">{f.fold}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{f.mae.toFixed(4)}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{f.rmse.toFixed(4)}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{f.r2.toFixed(4)}</TableCell>
                      <TableCell className="text-right font-mono text-[10px] tabular-nums text-muted-foreground">{f.seconds.toFixed(2)}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {holdout ? (
            <div className="rounded-xl border border-teal-500/40 bg-teal-500/10 p-4">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                Holdout evaluation · {MODEL_LABELS[holdout.model as ModelId]}
              </p>
              <p className="mt-1 font-mono text-xs text-teal-700/90 dark:text-teal-300/90">
                MAE {holdout.mae.toFixed(4)} · RMSE {holdout.rmse.toFixed(4)} · R² {holdout.r2.toFixed(4)}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  9 · Discovery — live new-material candidates                               */
/* -------------------------------------------------------------------------- */

export function LiveDiscoveryPanel() {
  const discovery = useLiveRunStore((s) => s.discovery);
  const discoveryTotal = useLiveRunStore((s) => s.discoveryTotal);
  const running = useLiveRunStore((s) => s.running);
  if (discovery.length === 0 && discoveryTotal === 0 && !running) return null;

  return (
    <motion.div {...fadeUp}>
      <Card className="overflow-hidden border-emerald-500/30 shadow-sm">
        <PanelHeader
          stage={9}
          title="Live discovery — new-material candidates ranked by the trained model"
          counter={`${discoveryTotal.toLocaleString("en-US")} candidates screened · ${discovery.length.toLocaleString("en-US")} shown · ranked by predicted band gap`}
        />
        <StageProgress stage={9} />
        <CardContent className="p-0">
          <div className="max-h-96 overflow-auto">
            <Table className="min-w-[560px]">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead className="min-w-36">Candidate</TableHead>
                  <TableHead className="min-w-40">Structure family</TableHead>
                  <TableHead className="w-32 text-right">Predicted gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discovery.slice(0, 60).map((d) => (
                  <TableRow key={`${d.rank}-${d.candidate}`} className="hover:bg-secondary/60">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">{d.rank}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">{d.candidate}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.family}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                      {d.predicted_eV.toFixed(3)} eV
                    </TableCell>
                  </TableRow>
                ))}
                {discovery.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                      {running ? "Screening candidates…" : "No candidates yet."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
