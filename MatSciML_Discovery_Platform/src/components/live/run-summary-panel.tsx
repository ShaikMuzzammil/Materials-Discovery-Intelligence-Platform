"use client";

/**
 * RUN SUMMARY PANEL — materializes on runComplete: KPI grid, stage timings,
 * the live-vs-verified side-by-side comparison, honesty note, PDF report
 * download, JSON bundle export and the saved-runs list (Prisma + local
 * fallback) with reopen/download actions.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  FileJson,
  History,
  Info,
  Loader2,
  PackageOpen,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODEL_LABELS, VERIFIED_CV } from "@/lib/engine/types";
import type { ModelId } from "@/lib/engine/types";
import { downloadRunBundle } from "@/lib/live-exports";
import { liveSummaryToReportData, downloadPdfReport } from "@/lib/live-report";
import { useLiveRunStore } from "@/lib/live-run-store";

/* -------------------------------------------------------------------------- */

export function RunSummaryPanel() {
  const summary = useLiveRunStore((s) => s.summary);
  const lastSaveMode = useLiveRunStore((s) => s.lastSaveMode);
  const [pdfBusy, setPdfBusy] = useState(false);

  if (!summary) return null;

  const c = summary.counts;
  const bestCv = summary.cv.find((m) => m.isBest);

  const kpis: { label: string; value: string; hint: string }[] = [
    { label: "Papers", value: String(c.papers), hint: `${c.pages} pages` },
    { label: "Sentences", value: c.sentences.toLocaleString("en-US"), hint: `${c.propertySentences.toLocaleString("en-US")} property hits` },
    { label: "Records", value: String(c.records), hint: `${c.uniqueMaterials} unique materials` },
    { label: "Dataset rows", value: c.benchmarkRowsFinal.toLocaleString("en-US"), hint: `${c.duplicatesRemoved} dupes removed` },
    { label: "Features kept", value: `${c.featuresKept}`, hint: `of ${c.featuresComputed} computed` },
    { label: "Best model", value: (MODEL_LABELS[summary.bestModel] ?? summary.bestModel).split(" (")[0], hint: `MAE ${(bestCv?.maeMean ?? 0).toFixed(4)} eV` },
    { label: "Hold-out MAE", value: summary.holdout ? `${summary.holdout.mae.toFixed(4)} eV` : "—", hint: "20% unseen split" },
    { label: "Discovery", value: c.discoveryTotal.toLocaleString("en-US"), hint: "candidates ranked" },
    { label: "Runtime", value: `${summary.totalSeconds.toFixed(1)}s`, hint: "all 9 stages" },
  ];

  const handlePdf = async (): Promise<void> => {
    setPdfBusy(true);
    try {
      const state = useLiveRunStore.getState();
      await downloadPdfReport(
        liveSummaryToReportData(summary, state.records, {
          papers: state.papers.map((p) => ({ name: p.name, pages: p.pages, chars: p.chars, source: p.source })),
          sentencesSample: state.sentences.slice(0, 15).map((s) => ({
            paper: s.paper,
            page: s.page,
            sentence: s.sentence,
            properties: s.properties.join("; "),
            gap: s.gapValue !== null ? s.gapValue.toFixed(2) : "—",
          })),
        }),
      );
      toast.success("Downloaded 24041_103_report.pdf", {
        description: `Live-run report · ${summary.cv.length} models · ${c.discoveryTotal.toLocaleString("en-US")} discovery candidates`,
      });
    } catch (error) {
      toast.error("PDF report failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Run summary"
    >
      <Card className="h-full border-emerald-500/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <CardTitle className="flex flex-wrap items-baseline gap-x-2 text-base">
                  <span className="font-mono text-[10px] text-muted-foreground">COMPLETE</span>
                  Run Summary
                </CardTitle>
                <CardDescription className="mt-0.5">
                  run <span className="font-mono">{summary.runId}</span> · finished in {summary.totalSeconds.toFixed(1)}s
                  {lastSaveMode ? (
                    <Badge
                      variant="outline"
                      className="ml-2 whitespace-nowrap border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                    >
                      saved · {lastSaveMode === "prisma" ? "SQLite (Prisma)" : "localStorage"}
                    </Badge>
                  ) : null}
                </CardDescription>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
                onClick={() => void handlePdf()}
                disabled={pdfBusy}
              >
                {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileDown className="h-4 w-4" aria-hidden="true" />}
                Download PDF report
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                downloadRunBundle();
                toast.success("Downloaded run bundle", { description: "Full JSON bundle — sentences, records, dataset, CV, discovery" });
              }}>
                <PackageOpen className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                JSON bundle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-lg border border-border bg-secondary/40 px-3 py-2.5"
              >
                <p className="truncate font-mono text-lg font-bold tabular-nums text-foreground">{kpi.value}</p>
                <p className="truncate text-[11px] font-medium text-foreground/90">{kpi.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{kpi.hint}</p>
              </motion.div>
            ))}
          </div>

          {/* stage timings */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {summary.stageTimings.map((t) => (
              <span
                key={t.id}
                className="whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                title={t.title}
              >
                {String(t.id).padStart(2, "0")}·{t.seconds.toFixed(1)}s
              </span>
            ))}
          </div>

          {/* live vs verified comparison */}
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Download className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              Live browser run vs verified notebook run
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-secondary/95">
                  <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-muted-foreground">
                    <th scope="col">Model</th>
                    <th scope="col" className="text-right">Live MAE (eV)</th>
                    <th scope="col" className="text-right">Notebook MAE</th>
                    <th scope="col" className="text-right">Live R²</th>
                    <th scope="col" className="text-right">Notebook R²</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.cv.map((m) => {
                    const ref = VERIFIED_CV[m.model as ModelId];
                    const delta = ref ? m.maeMean - ref.mae : null;
                    return (
                      <tr key={m.model} className={`border-b border-border/60 last:border-0 ${m.isBest ? "bg-emerald-500/10" : "odd:bg-background even:bg-secondary/30"}`}>
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">{MODEL_LABELS[m.model]}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                          {m.maeMean.toFixed(4)} <span className="text-[10px] text-muted-foreground">±{m.maeStd.toFixed(3)}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                          {ref ? ref.mae.toFixed(4) : "—"}
                          {delta !== null ? (
                            <span className={`ml-1 text-[10px] ${delta <= 0.05 ? "text-emerald-500" : "text-amber-500"}`}>
                              {delta >= 0 ? "+" : ""}
                              {delta.toFixed(3)}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground/80">{m.r2Mean.toFixed(4)}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{ref ? ref.r2.toFixed(4) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Verified reference: 24041_103_RUN_ALL.ipynb (identical folds, real MatSciBERT + scikit-learn/XGBoost). Small
              deltas are expected — the browser engine uses simulated embeddings and re-implemented models.
            </p>
          </div>

          {/* honesty note */}
          <div className="mt-4 flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              <strong>Honesty note.</strong> {summary.honesty.note}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Saved runs                                                                */
/* -------------------------------------------------------------------------- */

export function SavedRunsPanel() {
  const savedRuns = useLiveRunStore((s) => s.savedRuns);
  const reopenRun = useLiveRunStore((s) => s.reopenRun);
  const refreshSavedRuns = useLiveRunStore((s) => s.refreshSavedRuns);
  const [busyRun, setBusyRun] = useState<string | null>(null);

  if (savedRuns.length === 0) return null;

  const handleReopen = async (runId: string): Promise<void> => {
    setBusyRun(runId);
    try {
      const ok = await reopenRun(runId);
      if (ok) {
        toast.success(`Reopened ${runId}`, { description: "Records, CV leaderboard and discovery restored into the panels" });
      } else {
        toast.error("Could not reopen run", { description: "Artifact no longer available" });
      }
    } finally {
      setBusyRun(null);
    }
  };

  return (
    <motion.section {...{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }} aria-label="Saved runs">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <History className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle className="text-base">Saved Runs</CardTitle>
                <CardDescription>
                  Completed live-run artifacts — persisted via <span className="font-mono">/api/runs</span> (Prisma/SQLite)
                  with a localStorage fallback
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => void refreshSavedRuns()}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="grid gap-2 md:grid-cols-2">
            <AnimatePresence initial={false}>
              {savedRuns.slice(0, 10).map((run) => (
                <motion.li
                  key={`${run.storage}-${run.runId}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5"
                >
                  <Bookmark className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-semibold text-foreground">{run.runId}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString("en-GB")} ·{" "}
                      {run.totalSeconds !== null ? `${run.totalSeconds.toFixed?.(1) ?? run.totalSeconds}s · ` : ""}
                      best {run.bestModel ?? "—"} · {run.records ?? 0} records · {run.discoveryTotal ?? 0} candidates
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 whitespace-nowrap text-[9px] ${
                      run.storage === "prisma"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    }`}
                  >
                    {run.storage === "prisma" ? "SQLITE" : "LOCAL"}
                  </Badge>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px]"
                      disabled={busyRun === run.runId}
                      onClick={() => void handleReopen(run.runId)}
                    >
                      {busyRun === run.runId ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      )}
                      Reopen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-[10px]"
                      onClick={() => {
                        const payload = JSON.stringify(
                          { runId: run.runId, createdAt: run.createdAt, meta: { bestModel: run.bestModel, records: run.records, discoveryTotal: run.discoveryTotal } },
                          null,
                          2,
                        );
                        const blob = new Blob([payload], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `24041_103_run_${run.runId}.json`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
                        toast.success(`Downloaded ${run.runId} metadata`);
                      }}
                    >
                      <FileJson className="h-3 w-3 text-teal-500" aria-hidden="true" />
                      Download
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
            POST /api/runs saves every completed run automatically; reopen restores the records, CV and discovery panels.
          </p>
        </CardContent>
      </Card>
    </motion.section>
  );
}
