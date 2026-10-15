"use client";

/**
 * STAGE PANELS (01 · 02 · 04 · 08-detail) — the panels that were missing from
 * the original output stack: the corpus table, the preprocessed extracted-text
 * preview, the embedding vectors, and the fold-by-fold CV calculation.
 */

import { motion } from "framer-motion";
import { BookOpen, FileJson, FileSpreadsheet, Layers, Minimize2, ScanSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/format";
import { HYPER, kfoldIndices } from "@/lib/engine/ml";
import { MODEL_LABELS, MODEL_ORDER } from "@/lib/engine/types";
import type { ModelId } from "@/lib/engine/types";
import { useLiveRunStore } from "@/lib/live-run-store";

/* -------------------------------------------------------------------------- */
/*  Stage 01 — Paper corpus table                                             */
/* -------------------------------------------------------------------------- */

export function PapersStagePanel() {
  const papers = useLiveRunStore((s) => s.papers);

  if (papers.length === 0) {
    return <Waiting text="Waiting for the corpus — run the pipeline to load the paper list." />;
  }

  const totalPages = papers.reduce((a, p) => a + p.pages, 0);
  const totalChars = papers.reduce((a, p) => a + p.chars, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
          <BookOpen className="h-3 w-3" aria-hidden="true" />
          {papers.length} papers
        </Badge>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">{totalPages} pages</Badge>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">{totalChars.toLocaleString("en-US")} chars</Badge>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
            onClick={() => {
              const csv = ["name,pages,chars,source", ...papers.map((p) => `${p.name},${p.pages},${p.chars},${p.source}`)].join("\n");
              downloadBlob(new Blob([csv], { type: "text/csv" }), "24041_103_live_papers.csv");
              toast.success("Downloaded 24041_103_live_papers.csv");
            }}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
            onClick={() => {
              downloadBlob(new Blob([JSON.stringify(papers, null, 2)], { type: "application/json" }), "24041_103_live_papers.json");
              toast.success("Downloaded 24041_103_live_papers.json");
            }}
          >
            <FileJson className="h-3.5 w-3.5 text-teal-500" aria-hidden="true" />
            JSON
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur">
              <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-muted-foreground">
                <th scope="col" className="w-[40px]">#</th>
                <th scope="col">Paper</th>
                <th scope="col" className="w-[80px] text-right">Pages</th>
                <th scope="col" className="w-[110px] text-right">Chars</th>
                <th scope="col" className="w-[90px]">Source</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((p, i) => (
                <motion.tr
                  key={p.name}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/60 last:border-0 odd:bg-background even:bg-secondary/30"
                >
                  <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-mono font-medium text-foreground">
                    <span className="block max-w-[380px] truncate" title={p.name}>{p.name}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground/80">{p.pages}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground/80">{p.chars.toLocaleString("en-US")}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={`whitespace-nowrap text-[9px] ${
                        p.source === "upload"
                          ? "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : "border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                      }`}
                    >
                      {p.source === "upload" ? "UPLOADED" : "BUNDLED"}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage 02 — Preprocessed extracted-text preview                             */
/* -------------------------------------------------------------------------- */

export function ExtractedTextPanel() {
  const extractedPages = useLiveRunStore((s) => s.extractedPages);
  const stages = useLiveRunStore((s) => s.stages);
  const [selected, setSelected] = useState<string | null>(null);

  if (extractedPages.length === 0) {
    return <Waiting text="Waiting for extraction — page previews stream here as the engine segments each paper." />;
  }

  const active = extractedPages.find((p) => p.paper === selected) ?? extractedPages[extractedPages.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
          <ScanSearch className="h-3 w-3" aria-hidden="true" />
          preprocessed output · page 1 of each paper
        </Badge>
        <span className="font-mono text-[11px] text-muted-foreground">
          {stages[1]?.counter || ""}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(200px,260px)_minmax(0,1fr)]">
        {/* paper selector */}
        <div className="space-y-1.5" role="tablist" aria-label="Extracted papers">
          {extractedPages.map((p) => {
            const isActive = p.paper === active.paper;
            return (
              <button
                key={p.paper}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelected(p.paper)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                  isActive ? "border-emerald-500/60 bg-emerald-500/10" : "border-border bg-secondary/30 hover:bg-secondary/60"
                }`}
              >
                <p className="truncate text-xs font-medium text-foreground">{p.paper}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  p.1/{p.totalPages} · {p.sentences} sentences · {p.chars.toLocaleString("en-US")} chars
                </p>
              </button>
            );
          })}
        </div>

        {/* text preview */}
        <motion.div
          key={active.paper}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-w-0 rounded-lg border border-border bg-secondary/30"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="truncate font-mono text-[11px] font-medium text-foreground">{active.paper} — page 1 of {active.totalPages}</p>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{active.chars.toLocaleString("en-US")} chars</span>
          </div>
          <pre className="max-h-[320px] overflow-y-auto whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-[10.5px] leading-relaxed text-foreground/85">
            {active.text}
            <span className="text-muted-foreground/60"> …</span>
          </pre>
        </motion.div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage 04 — Embedding vectors                                              */
/* -------------------------------------------------------------------------- */

function vectorCellClass(v: number): string {
  const a = Math.min(1, Math.abs(v));
  if (v >= 0) return `bg-emerald-500/${Math.round(8 + a * 72).toString()}`;
  return `bg-rose-500/${Math.round(8 + a * 72).toString()}`;
}

export function EmbeddingPanel() {
  const embeddingSamples = useLiveRunStore((s) => s.embeddingSamples);
  const stages = useLiveRunStore((s) => s.stages);

  if (embeddingSamples.length === 0) {
    return <Waiting text="Waiting for the embedding layer — sample vectors appear here as sentences are embedded." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
          <Minimize2 className="h-3 w-3" aria-hidden="true" />
          {embeddingSamples.length} sample vectors · 32-dim
        </Badge>
        <span className="font-mono text-[11px] text-muted-foreground">{stages[3]?.counter || ""}</span>
        <span className="ml-auto rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
          SIMULATED — the verified notebook used real m3rg-iitd/matscibert (768-dim)
        </span>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2">
        {embeddingSamples.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-border bg-secondary/30 p-3"
          >
            <p className="mb-2 line-clamp-2 text-[11px] leading-snug text-foreground/90" title={s.sentence}>
              “{s.sentence}…”</p>
            <div className="mb-2 flex h-6 items-stretch gap-[2px] overflow-hidden rounded" aria-hidden="true">
              {s.vector.map((v, j) => (
                <span key={j} className={`flex-1 rounded-[2px] ${vectorCellClass(v)}`} title={`dim ${j + 1}: ${v.toFixed(3)}`} />
              ))}
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
              <span>32 dims</span>
              <span>‖v‖ = {s.norm.toFixed(3)}</span>
            </div>
            <p className="mt-1 truncate font-mono text-[9.5px] text-muted-foreground/70">
              [{s.vector.slice(0, 6).map((v) => v.toFixed(2)).join(", ")}, …]
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage 08 — Fold-by-fold calculation detail                                 */
/* -------------------------------------------------------------------------- */

export function FoldDetailPanel() {
  const folds = useLiveRunStore((s) => s.folds);
  const modelsDone = useLiveRunStore((s) => s.modelsDone);
  const dataset = useLiveRunStore((s) => s.dataset);
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);

  const activeModels = MODEL_ORDER.filter((m) => folds[m]);
  if (activeModels.length === 0) {
    return <Waiting text="Waiting for cross-validation — fold results fill in here model by model." />;
  }

  const model = selectedModel && folds[selectedModel] ? selectedModel : activeModels[0];
  const list = folds[model] ?? [];
  const done = modelsDone[model];
  const n = dataset?.rows ?? 4601;
  const foldSizes = kfoldIndices(n, 5, HYPER.seed).map((f) => f.length);

  const mean = (vals: number[]): number => vals.reduce((a, v) => a + v, 0) / vals.length;
  const std = (vals: number[]): number => {
    if (vals.length < 2) return 0;
    const m = mean(vals);
    return Math.sqrt(vals.reduce((a, v) => a + (v - m) * (v - m), 0) / vals.length);
  };

  const maes = list.map((f) => f.mae);
  const rmses = list.map((f) => f.rmse);
  const r2s = list.map((f) => f.r2);

  return (
    <div className="space-y-3">
      {/* model selector */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="CV model detail">
        {activeModels.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={m === model}
            onClick={() => setSelectedModel(m)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
              m === model
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {MODEL_LABELS[m].split(" (")[0]}
            {modelsDone[m] ? " ✓" : " …"}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          KFold(5, shuffle=True, seed={HYPER.seed}) on {n.toLocaleString("en-US")} rows
        </span>
      </div>

      {/* fold table with the calculation */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-secondary/95">
            <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-muted-foreground">
              <th scope="col">Fold</th>
              <th scope="col" className="text-right">Train rows</th>
              <th scope="col" className="text-right">Val rows</th>
              <th scope="col" className="text-right">MAE (eV)</th>
              <th scope="col" className="text-right">RMSE (eV)</th>
              <th scope="col" className="text-right">R²</th>
              <th scope="col" className="text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((k) => {
              const f = list.find((r) => r.fold === k);
              const valRows = foldSizes[k - 1];
              return (
                <motion.tr
                  key={k}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-border/60 last:border-0 odd:bg-background even:bg-secondary/30"
                >
                  <td className="px-3 py-2 font-mono font-semibold text-foreground">fold {k}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {(n - valRows).toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {valRows.toLocaleString("en-US")}
                  </td>
                  {f ? (
                    <>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">{f.mae.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground/80">{f.rmse.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground/80">{f.r2.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{f.seconds.toFixed(1)}s</td>
                    </>
                  ) : (
                    <td colSpan={4} className="px-3 py-2 text-center font-mono text-muted-foreground/50">
                      {list.length > 0 ? "training…" : "—"}
                    </td>
                  )}
                </motion.tr>
              );
            })}
            {/* the calculation row */}
            <tr className="border-t-2 border-border bg-emerald-500/10 font-semibold">
              <td className="px-3 py-2.5 text-foreground">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  mean ± std
                </span>
              </td>
              <td colSpan={2} className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">
                over {list.length}/5 folds
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                {list.length ? `${mean(maes).toFixed(4)} ± ${std(maes).toFixed(3)}` : "—"}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
                {list.length ? `${mean(rmses).toFixed(4)} ± ${std(rmses).toFixed(3)}` : "—"}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
                {list.length ? (done ? done.r2Mean.toFixed(4) : mean(r2s).toFixed(4)) : "—"}
              </td>
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                {done ? `${done.seconds.toFixed(1)}s` : "…"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Split sizes derive from the same deterministic <span className="font-mono">kfoldIndices(n, 5, seed 42)</span> shuffle the engine
        uses — fold 5 absorbs the remainder. The bold row shows the 5-fold mean ± standard deviation the leaderboard ranks on.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Waiting placeholder                                                       */
/* -------------------------------------------------------------------------- */

function Waiting({ text }: { text: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 px-6 py-8 text-center">
      <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
