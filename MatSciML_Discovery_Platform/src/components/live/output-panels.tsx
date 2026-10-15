"use client";

/**
 * LIVE OUTPUT PANELS — materialize as their stage completes.
 *
 *   1 · MinedSentencesPanel   (stage 03)  streaming sentence table
 *   2 · RecordsPanel          (stage 05)  structured records + dataset banner
 *   3 · BenchmarkJoinPanel    (stage 06)  before/after join visual
 *   4 · FeaturesPanel         (stage 07)  feature chips + selection funnel
 *   5 · LeaderboardPanel      (stage 08)  live CV grid 5 models × 5 folds
 *   6 · DiscoveryPanel        (stage 09)  streaming candidates + podium
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  FlaskConical,
  Layers,
  ScanSearch,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MODEL_LABELS, MODEL_ORDER, VERIFIED_CV } from "@/lib/engine/types";
import type { ModelId } from "@/lib/engine/types";
import { useLiveRunStore } from "@/lib/live-run-store";
import {
  cvCsv,
  datasetCsv,
  discoveryCsv,
  downloadText,
  featuresCsv,
  importanceCsv,
  recordsCsv,
  sentencesCsv,
} from "@/lib/live-exports";
import { downloadBlob } from "@/lib/format";

/* -------------------------------------------------------------------------- */
/*  Shared panel shell                                                        */
/* -------------------------------------------------------------------------- */

const panelMotion = {
  initial: { opacity: 0, y: 24, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
};

function PanelShell({
  stage,
  icon: Icon,
  title,
  description,
  actions,
  children,
}: {
  stage: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section {...panelMotion} aria-label={title}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <CardTitle className="flex flex-wrap items-baseline gap-x-2 text-base">
                  <span className="font-mono text-[10px] text-muted-foreground">STAGE {String(stage).padStart(2, "0")}</span>
                  {title}
                </CardTitle>
                <CardDescription className="mt-0.5">{description}</CardDescription>
              </div>
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </motion.section>
  );
}

function ExportCsvJsonButtons({
  onCsv,
  onJson,
  csvLabel = "CSV",
}: {
  onCsv: () => void;
  onJson?: () => void;
  csvLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Panel exports">
      <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-[11px]" onClick={onCsv}>
        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        {csvLabel}
      </Button>
      {onJson ? (
        <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5 text-[11px]" onClick={onJson}>
          <FileJson className="h-3.5 w-3.5 text-teal-500" aria-hidden="true" />
          JSON
        </Button>
      ) : null}
    </div>
  );
}

function toastExport(kind: string, filename: string): void {
  toast.success(`Downloaded ${filename}`, { description: `${kind} export · proper header row included` });
}

/* -------------------------------------------------------------------------- */
/*  1 · Mined sentences                                                       */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 25;

export function MinedSentencesPanel() {
  const sentences = useLiveRunStore((s) => s.sentences);
  const sentencesTotal = useLiveRunStore((s) => s.sentencesTotal);
  const [query, setQuery] = useState("");
  const [gapOnly, setGapOnly] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sentences.filter((s) => {
      if (gapOnly && s.gapValue === null) return false;
      if (!q) return true;
      return (
        s.sentence.toLowerCase().includes(q) ||
        s.paper.toLowerCase().includes(q) ||
        (s.material ?? "").toLowerCase().includes(q) ||
        s.properties.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [sentences, query, gapOnly]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const handleCsv = (): void => {
    downloadText(sentencesCsv(sentences), "24041_103_live_sentences.csv");
    toastExport("Mined sentences", "24041_103_live_sentences.csv");
  };

  if (sentences.length === 0) return null;

  return (
    <PanelShell
      stage={3}
      icon={ScanSearch}
      title="Mined Sentences"
      description={`${sentencesTotal.toLocaleString("en-US")} property sentences streamed live — regex + keyword mining with formula detection`}
      actions={
        <ExportCsvJsonButtons
          onCsv={handleCsv}
          onJson={() => {
            downloadBlob(
              new Blob([JSON.stringify(sentences, null, 2)], { type: "application/json" }),
              "24041_103_live_sentences.json",
            );
            toastExport("Mined sentences", "24041_103_live_sentences.json");
          }}
        />
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Filter sentences, materials, properties…"
            className="h-8 pl-8 text-xs"
            aria-label="Filter mined sentences"
          />
        </div>
        <Button
          variant={gapOnly ? "default" : "outline"}
          size="sm"
          className={`h-8 text-[11px] ${gapOnly ? "bg-emerald-600 hover:bg-emerald-500" : ""}`}
          onClick={() => {
            setGapOnly((v) => !v);
            setPage(0);
          }}
          aria-pressed={gapOnly}
        >
          Band-gap value only
        </Button>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {filtered.length.toLocaleString("en-US")} rows
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur">
              <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-muted-foreground">
                <th scope="col" className="w-[130px]">Source</th>
                <th scope="col">Sentence</th>
                <th scope="col" className="w-[150px]">Hits</th>
                <th scope="col" className="w-[110px] text-right">Gap (eV)</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((s, i) => (
                  <motion.tr
                    key={`${s.paper}-${s.page}-${safePage}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border/60 align-top last:border-0 odd:bg-background even:bg-secondary/30"
                  >
                    <td className="px-3 py-2">
                      <p className="truncate font-mono text-[10px] text-muted-foreground">{s.paper}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/70">p.{s.page}</p>
                    </td>
                    <td className="px-3 py-2 leading-snug text-foreground/90">
                      {s.sentence.length > 220 ? `${s.sentence.slice(0, 220)}…` : s.sentence}
                      {s.material ? (
                        <span className="ml-1.5 inline-flex max-w-[120px] items-center rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {s.material}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {s.properties.slice(0, 2).map((p) => (
                          <span
                            key={p}
                            className="whitespace-nowrap rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-medium text-teal-600 dark:text-teal-400"
                          >
                            {p}
                          </span>
                        ))}
                        {s.gapKind ? (
                          <span className="whitespace-nowrap rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                            {s.gapKind}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {s.gapValue !== null ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{s.gapValue.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          page {safePage + 1} / {pageCount}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </PanelShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  2 · Structured records + dataset banner                                   */
/* -------------------------------------------------------------------------- */

export function RecordsPanel() {
  const records = useLiveRunStore((s) => s.records);
  const dataset = useLiveRunStore((s) => s.dataset);

  if (records.length === 0 && !dataset) return null;

  const matched = records.filter((r) => r.matchedInBenchmark).length;

  const handleCsv = (): void => {
    downloadText(recordsCsv(records), "24041_103_live_records.csv");
    toastExport("Structured records", "24041_103_live_records.csv");
  };
  const handleJson = (): void => {
    downloadBlob(new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }), "24041_103_live_records.json");
    toastExport("Structured records", "24041_103_live_records.json");
  };

  return (
    <PanelShell
      stage={5}
      icon={Database}
      title="Structured Records"
      description={`${records.length.toLocaleString("en-US")} material–property records from the recursive-descent formula parser`}
      actions={<ExportCsvJsonButtons onCsv={handleCsv} onJson={handleJson} />}
    >
      {dataset ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3"
        >
          <Database className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Dataset created &amp; saved</p>
            <p className="text-[11px] text-muted-foreground">
              {dataset.rows.toLocaleString("en-US")} benchmark rows · {matched} of {records.length} mined records matched ·
              ready for download below
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-emerald-500/40 px-2.5 text-[11px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
              onClick={() => {
                downloadText(datasetCsv(dataset.formulas, dataset.gaps), "24041_103_live_dataset.csv");
                toastExport("Joined dataset (4,601 rows)", "24041_103_live_dataset.csv");
              }}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
              Dataset CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-emerald-500/40 px-2.5 text-[11px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
              onClick={() => {
                downloadBlob(
                  new Blob(
                    [JSON.stringify(dataset.formulas.map((f, i) => ({ formula: f, expt_gap_eV: dataset.gaps[i] })), null, 2)],
                    { type: "application/json" },
                  ),
                  "24041_103_live_dataset.json",
                );
                toastExport("Joined dataset", "24041_103_live_dataset.json");
              }}
            >
              <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
              JSON
            </Button>
          </div>
        </motion.div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur">
              <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-muted-foreground">
                <th scope="col">#</th>
                <th scope="col">Material</th>
                <th scope="col">Property</th>
                <th scope="col" className="text-right">Value</th>
                <th scope="col">Source</th>
                <th scope="col" className="w-[90px]">Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-border/60 last:border-0 odd:bg-background even:bg-secondary/30"
                >
                  <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">{r.id}</td>
                  <td className="px-3 py-2 font-mono font-semibold text-foreground">{r.material}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.property}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {r.value.toFixed(2)} <span className="text-[10px] font-normal text-muted-foreground">{r.unit}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="block max-w-[160px] truncate font-mono text-[10px] text-muted-foreground" title={r.sourcePaper}>
                      {r.sourcePaper.split("_").slice(0, 2).join("_")} · p.{r.page}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {r.matchedInBenchmark ? (
                      <Badge className="whitespace-nowrap bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">MATCHED</Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PanelShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  3 · Benchmark join visual                                                 */
/* -------------------------------------------------------------------------- */

export function BenchmarkJoinPanel() {
  const dataset = useLiveRunStore((s) => s.dataset);
  const records = useLiveRunStore((s) => s.records);
  const summary = useLiveRunStore((s) => s.summary);

  if (!dataset) return null;

  const start = summary?.counts.benchmarkRowsStart ?? 4604;
  const dupes = summary?.counts.duplicatesRemoved ?? 3;
  const matched = records.filter((r) => r.matchedInBenchmark).length;

  return (
    <PanelShell
      stage={6}
      icon={ArrowLeftRight}
      title="Benchmark Join"
      description="Mined records matched against Matbench expt_gap by normalized composition"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Benchmark rows in", value: start.toLocaleString("en-US"), hint: "Matbench expt_gap" },
          { label: "Duplicates removed", value: String(dupes), hint: "normalized composition" },
          { label: "Clean rows out", value: dataset.rows.toLocaleString("en-US"), hint: "training dataset" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-center"
          >
            <p className="font-mono text-xl font-bold tabular-nums text-foreground">{kpi.value}</p>
            <p className="mt-0.5 text-[11px] font-medium text-foreground/90">{kpi.label}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.hint}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-secondary/30 px-4 py-3">
        <div className="flex -1 min-w-0 flex-1 items-center gap-2">
          <ScanSearch className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{records.length}</span> mined records →{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{matched}</span> matched the benchmark
          </p>
        </div>
        <div className="flex shrink-0 -space-x-1.5" aria-hidden="true">
          {records.slice(0, 8).map((r) => (
            <span
              key={r.id}
              title={`${r.material} · ${r.value} eV`}
              className={`flex h-7 w-14 items-center justify-center rounded-md border px-1 font-mono text-[10px] ${
                r.matchedInBenchmark
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              <span className="truncate">{r.material}</span>
            </span>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  4 · Feature chips + selection funnel                                      */
/* -------------------------------------------------------------------------- */

export function FeaturesPanel() {
  const features = useLiveRunStore((s) => s.features);
  const importance = useLiveRunStore((s) => s.importance);
  const [showDropped, setShowDropped] = useState(false);

  if (!features) return null;

  const keptSet = new Set(features.kept);
  const dropped = features.names.filter((n) => !keptSet.has(n));
  const shown = showDropped ? dropped : features.kept;

  const handleCsv = (): void => {
    downloadText(featuresCsv(features.names, features.kept), "24041_103_live_features.csv");
    toastExport("Feature selection", "24041_103_live_features.csv");
  };

  return (
    <PanelShell
      stage={7}
      icon={SlidersHorizontal}
      title="Feature Engineering & Selection"
      description={`${features.names.length} features computed → ${features.kept.length} kept (variance + |r| > 0.97 filters)`}
      actions={
        <ExportCsvJsonButtons
          onCsv={handleCsv}
          onJson={() => {
            downloadBlob(
              new Blob([JSON.stringify({ names: features.names, kept: features.kept }, null, 2)], { type: "application/json" }),
              "24041_103_live_features.json",
            );
            toastExport("Feature selection", "24041_103_live_features.json");
          }}
        />
      }
    >
      {/* selection funnel */}
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        {[
          { label: "Composition (Magpie)", value: 63 },
          { label: "Text (simulated)", value: 32 },
          { label: "Computed", value: features.names.length },
          { label: "Kept", value: features.kept.length },
        ].map((step, i) => (
          <div key={step.label} className="relative">
            <motion.div
              initial={{ scaleX: 0.7, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-lg border px-3 py-2 text-center ${
                i === 3 ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-secondary/40"
              }`}
              style={{ transformOrigin: "left center" }}
            >
              <p className={`font-mono text-lg font-bold tabular-nums ${i === 3 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                {step.value}
              </p>
              <p className="text-[10px] leading-tight text-muted-foreground">{step.label}</p>
            </motion.div>
            {i < 3 ? (
              <ChevronRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/50 sm:block" aria-hidden="true" />
            ) : null}
          </div>
        ))}
      </div>

      {/* chips */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          {showDropped ? `${dropped.length} dropped features` : `${features.kept.length} selected features`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-muted-foreground"
          onClick={() => setShowDropped((v) => !v)}
        >
          {showDropped ? "Show selected" : `Show dropped (${dropped.length})`}
        </Button>
      </div>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-3">
        <AnimatePresence initial={false}>
          {shown.slice(0, 120).map((name) => {
            const isText = name.startsWith("text_sim_");
            const rank = importance.findIndex((f) => f.feature === name);
            const isTop = rank >= 0 && rank < 15;
            return (
              <motion.span
                key={name}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] ${
                  isTop
                    ? "bg-emerald-500/25 font-semibold text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-300"
                    : isText
                      ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
                      : "bg-teal-500/15 text-teal-700 dark:text-teal-400"
                }`}
                title={isTop ? `importance rank #${rank + 1}` : isText ? "simulated text feature" : "composition feature"}
              >
                {isTop ? <Sparkles className="h-2.5 w-2.5" aria-hidden="true" /> : null}
                {name}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>

      {importance.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          <p className="text-[11px] text-muted-foreground">
            Top gain features:
            {importance.slice(0, 5).map((f, i) => (
              <span key={f.feature} className="ml-1.5 whitespace-nowrap font-mono text-[10px]">
                <span className="text-muted-foreground/70">{i + 1}.</span>
                <span className="font-semibold text-foreground">{f.feature}</span>
              </span>
            ))}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7 gap-1.5 px-2.5 text-[11px]"
            onClick={() => {
              downloadText(importanceCsv(importance), "24041_103_live_feature_importance.csv");
              toastExport("Feature importance (top 15)", "24041_103_live_feature_importance.csv");
            }}
          >
            <Download className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            Importance
          </Button>
        </div>
      ) : null}
    </PanelShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  5 · Live CV leaderboard                                                   */
/* -------------------------------------------------------------------------- */

export function LeaderboardPanel() {
  const folds = useLiveRunStore((s) => s.folds);
  const modelsDone = useLiveRunStore((s) => s.modelsDone);
  const bestModel = useLiveRunStore((s) => s.bestModel);
  const models = useLiveRunStore((s) => s.models);
  const running = useLiveRunStore((s) => s.running);

  const activeModels = Object.keys(folds).length > 0 ? MODEL_ORDER.filter((m) => folds[m]) : [];
  if (activeModels.length === 0) return null;

  const handleCsv = (): void => {
    const rows: { model: string; fold: number; mae: number; rmse: number; r2: number; seconds: number }[] = [];
    for (const m of activeModels) {
      for (const f of folds[m] ?? []) rows.push({ model: m, fold: f.fold, mae: f.mae, rmse: f.rmse, r2: f.r2, seconds: f.seconds });
    }
    downloadText(cvCsv(rows), "24041_103_live_cv_results.csv");
    toastExport("Cross-validation folds", "24041_103_live_cv_results.csv");
  };

  return (
    <PanelShell
      stage={8}
      icon={Trophy}
      title="Live CV Leaderboard"
      description="5-fold CV grid filling in real time — identical KFold(5, shuffle, seed 42) folds for every model"
      actions={<ExportCsvJsonButtons onCsv={handleCsv} />}
    >
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-secondary/95">
            <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-muted-foreground">
              <th scope="col">Model</th>
              <th scope="col" className="text-center">Fold 1</th>
              <th scope="col" className="text-center">Fold 2</th>
              <th scope="col" className="text-center">Fold 3</th>
              <th scope="col" className="text-center">Fold 4</th>
              <th scope="col" className="text-center">Fold 5</th>
              <th scope="col" className="text-right">MAE (eV)</th>
              <th scope="col" className="text-right">RMSE (eV)</th>
              <th scope="col" className="text-right">R²</th>
              <th scope="col" className="text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {activeModels.map((m) => {
              const done = modelsDone[m];
              const isBest = bestModel === m;
              const list = folds[m] ?? [];
              const foldCells = [0, 1, 2, 3, 4].map((i) => list[i]);
              const meanMae = list.length ? list.reduce((a, f) => a + f.mae, 0) / list.length : null;
              const best = foldCells.reduce((a, c) => (c && (!a || c.mae < a) ? c.mae : a), null as number | null);
              return (
                <motion.tr
                  key={m}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-b border-border/60 last:border-0 ${
                    isBest ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/30" : "odd:bg-background even:bg-secondary/30"
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      {isBest ? <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Best model" /> : null}
                      <span className={`font-medium ${isBest ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                        {MODEL_LABELS[m]}
                      </span>
                    </span>
                  </td>
                  {foldCells.map((f, i) => (
                    <td key={i} className="px-3 py-2 text-center font-mono tabular-nums">
                      {f ? (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`inline-block rounded px-1.5 py-0.5 text-[11px] ${
                            best !== null && f.mae === best ? "bg-emerald-500/20 font-semibold text-emerald-600 dark:text-emerald-400" : "text-foreground/80"
                          }`}
                        >
                          {f.mae.toFixed(3)}
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground/40" aria-hidden="true">
                          {running ? "…" : "·"}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums">
                    {done ? (
                      <span className="font-semibold text-foreground">
                        {done.maeMean.toFixed(4)} <span className="text-[10px] text-muted-foreground">±{done.maeStd.toFixed(3)}</span>
                      </span>
                    ) : meanMae !== null ? (
                      <span className="text-muted-foreground">{meanMae.toFixed(4)}…</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums">
                    {done ? (
                      <span className="text-foreground/80">
                        {done.rmseMean.toFixed(4)} <span className="text-[10px] text-muted-foreground">±{done.rmseStd.toFixed(3)}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums">
                    {done ? (
                      <span className="text-foreground/80">{done.r2Mean.toFixed(4)}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {done ? `${done.seconds.toFixed(1)}s` : "…"}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {models.length} models selected · cells show fold MAE (eV); highlighted cell = best fold so far · means update live
      </p>
    </PanelShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  6 · Discovery stream + podium                                             */
/* -------------------------------------------------------------------------- */

const MEDALS = ["🥇", "🥈", "🥉"];

export function DiscoveryPanel() {
  const discovery = useLiveRunStore((s) => s.discovery);
  const discoveryTotal = useLiveRunStore((s) => s.discoveryTotal);
  const [query, setQuery] = useState("");

  if (discovery.length === 0) return null;

  const top3 = discovery.slice(0, 3);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? discovery.filter((d) => d.candidate.toLowerCase().includes(q) || d.family.toLowerCase().includes(q))
    : discovery;
  const rows = filtered.slice(0, 100);

  const handleCsv = (): void => {
    downloadText(discoveryCsv(discovery), "24041_103_live_discovery.csv");
    toastExport("Discovery candidates", "24041_103_live_discovery.csv");
  };

  return (
    <PanelShell
      stage={9}
      icon={FlaskConical}
      title="New-Material Discovery"
      description={`${discoveryTotal.toLocaleString("en-US")} unseen oxide candidates screened and ranked by predicted band gap`}
      actions={
        <ExportCsvJsonButtons
          onCsv={handleCsv}
          onJson={() => {
            downloadBlob(
              new Blob([JSON.stringify(discovery, null, 2)], { type: "application/json" }),
              "24041_103_live_discovery.json",
            );
            toastExport("Discovery candidates", "24041_103_live_discovery.json");
          }}
        />
      }
    >
      {/* podium */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {top3.map((d, i) => (
          <motion.div
            key={`${d.rank}-${d.candidate}`}
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: i * 0.08 }}
            className={`relative overflow-hidden rounded-xl border p-4 ${
              i === 0
                ? "border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-emerald-500/10"
                : i === 1
                  ? "border-slate-400/40 bg-gradient-to-br from-slate-500/10 to-emerald-500/10"
                  : "border-orange-700/40 bg-gradient-to-br from-orange-700/10 to-emerald-500/10"
            }`}
          >
            <span className="absolute right-2 top-2 text-xl" aria-hidden="true">
              {MEDALS[i]}
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rank #{d.rank}</p>
            <p className="mt-1 break-words font-mono text-lg font-bold text-foreground">{d.candidate}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{d.family}</p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {d.predicted_eV.toFixed(2)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">eV</span>
            </p>
          </motion.div>
        ))}
      </div>

      {/* stream table */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter candidates or families…"
            className="h-8 pl-8 text-xs"
            aria-label="Filter discovery candidates"
          />
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          showing {rows.length.toLocaleString("en-US")} / {discovery.length.toLocaleString("en-US")}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur">
              <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-muted-foreground">
                <th scope="col" className="w-[60px]">Rank</th>
                <th scope="col">Candidate</th>
                <th scope="col">Structure family</th>
                <th scope="col" className="w-[130px] text-right">Predicted gap</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((d) => (
                  <motion.tr
                    key={`${d.rank}-${d.candidate}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-border/60 last:border-0 odd:bg-background even:bg-secondary/30"
                  >
                    <td className="px-3 py-1.5 font-mono tabular-nums text-muted-foreground">{d.rank}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 font-mono font-semibold text-foreground">{d.candidate}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      <span className="block max-w-[220px] truncate" title={d.family}>
                        {d.family}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {d.predicted_eV.toFixed(2)} eV
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </PanelShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bundle: all live output panels                                            */
/* -------------------------------------------------------------------------- */

export function LiveOutputPanels() {
  return (
    <div className="space-y-6">
      <MinedSentencesPanel />
      <RecordsPanel />
      <BenchmarkJoinPanel />
      <FeaturesPanel />
      <LeaderboardPanel />
      <DiscoveryPanel />
    </div>
  );
}
