"use client";

/**
 * LIVE DATA STRIP — the one-to-one bridge between the Live Pipeline Lab and
 * the analytics tabs. When a live run has produced output for a view's stage,
 * this strip materializes at the top of that view showing the shared live
 * numbers and a deep link back into the exact Live Lab stage panel.
 */

import { motion } from "framer-motion";
import { ArrowRight, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MODEL_LABELS } from "@/lib/engine/types";
import { useLiveRunStore } from "@/lib/live-run-store";
import { useUiStore } from "@/lib/store";

export type LiveStripKind = "papers" | "extraction" | "dataset" | "features" | "models" | "discovery";

const STAGE_BY_KIND: Record<LiveStripKind, number> = {
  papers: 1,
  extraction: 3,
  dataset: 5,
  features: 7,
  models: 8,
  discovery: 9,
};

export function LiveDataStrip({ kind }: { kind: LiveStripKind }) {
  const running = useLiveRunStore((s) => s.running);
  const papers = useLiveRunStore((s) => s.papers);
  const sentences = useLiveRunStore((s) => s.sentencesTotal);
  const records = useLiveRunStore((s) => s.records);
  const dataset = useLiveRunStore((s) => s.dataset);
  const features = useLiveRunStore((s) => s.features);
  const folds = useLiveRunStore((s) => s.folds);
  const bestModel = useLiveRunStore((s) => s.bestModel);
  const discovery = useLiveRunStore((s) => s.discoveryTotal);
  const summary = useLiveRunStore((s) => s.summary);
  const setView = useUiStore((s) => s.setView);

  let stats: { label: string; value: string }[] = [];
  let hasData = false;

  switch (kind) {
    case "papers":
      hasData = papers.length > 0;
      stats = [
        { label: "papers in corpus", value: String(papers.length) },
        { label: "pages", value: String(papers.reduce((a, p) => a + p.pages, 0)) },
      ];
      break;
    case "extraction":
      hasData = sentences > 0;
      stats = [
        { label: "property sentences", value: sentences.toLocaleString("en-US") },
        { label: "structured records", value: String(records.length) },
      ];
      break;
    case "dataset":
      hasData = dataset !== null || records.length > 0;
      stats = [
        { label: "records", value: String(records.length) },
        { label: "benchmark rows", value: dataset ? dataset.rows.toLocaleString("en-US") : "—" },
      ];
      break;
    case "features":
      hasData = features !== null;
      stats = [
        { label: "computed", value: features ? String(features.names.length) : "—" },
        { label: "kept", value: features ? String(features.kept.length) : "—" },
      ];
      break;
    case "models":
      hasData = Object.keys(folds).length > 0;
      stats = [
        { label: "models trained", value: String(Object.keys(folds).length) },
        { label: "best so far", value: bestModel ? MODEL_LABELS[bestModel].split(" (")[0] : "—" },
      ];
      break;
    case "discovery":
      hasData = discovery > 0;
      stats = [
        { label: "candidates", value: discovery.toLocaleString("en-US") },
        { label: "top pick", value: summary?.discoveryTop?.[0]?.candidate ?? "—" },
      ];
      break;
  }

  if (!hasData) return null;

  const stage = STAGE_BY_KIND[kind];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
        {running ? (
          <motion.span
            className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6 }}
          />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        )}
      </span>
      <Radio className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
      <p className="min-w-0 flex-wrap items-center gap-x-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <span className="whitespace-nowrap">
          {running ? "Live run in progress" : "Live run data available"}
          {summary ? <span className="font-mono text-[10px] text-emerald-600/80 dark:text-emerald-400/80"> · {summary.runId}</span> : null}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 text-[11px] font-normal text-emerald-700/90 dark:text-emerald-300/90">
          {stats.map((s) => (
            <span key={s.label} className="whitespace-nowrap">
              <span className="font-mono font-semibold">{s.value}</span> {s.label}
            </span>
          ))}
        </span>
      </p>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto h-7 gap-1.5 border-emerald-500/40 bg-transparent px-2.5 text-[11px] text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
        onClick={() => setView("live")}
      >
        Open Live Lab stage {String(stage).padStart(2, "0")}
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Button>
    </motion.div>
  );
}
