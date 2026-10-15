"use client";

/**
 * STAGE TRACKER — nine live stage cards (01–09) with status chips, animated
 * progress bars and live counters ("pages read", "fold 3/5", …).
 */

import { motion } from "framer-motion";
import {
  BookOpen,
  Check,
  FlaskConical,
  GitMerge,
  Loader2,
  Minimize2,
  Network,
  ScanSearch,
  SlidersHorizontal,
  Table,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLiveRunStore } from "@/lib/live-run-store";
import type { TrackedStage } from "@/lib/live-run-store";

const STAGE_ICONS: React.ComponentType<{ className?: string }>[] = [
  BookOpen, // 01 paper corpus
  ScanSearch, // 02 text extraction
  Network, // 03 property mining
  Minimize2, // 04 embedding layer
  Table, // 05 structured dataset
  GitMerge, // 06 benchmark join
  SlidersHorizontal, // 07 features
  Trophy, // 08 model training
  FlaskConical, // 09 discovery
];

const STAGE_HINTS = [
  "corpus assembly",
  "sentence segmentation",
  "regex + keyword mining",
  "32-dim simulated vectors",
  "formula parsing",
  "Matbench expt_gap",
  "63 Magpie + 32 text",
  "KFold(5) × 5 models",
  "candidate screening",
];

export function StageTracker() {
  const stages = useLiveRunStore((s) => s.stages);

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Pipeline stage progress">
      {stages.map((stage, i) => (
        <StageCard key={stage.id} stage={stage} index={i} />
      ))}
    </ol>
  );
}

function StageCard({ stage, index }: { stage: TrackedStage; index: number }) {
  const Icon = STAGE_ICONS[index] ?? ScanSearch;
  const running = stage.status === "running";
  const done = stage.status === "done";

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border bg-card p-4 transition-colors ${
        running
          ? "border-emerald-500/60 shadow-md shadow-emerald-500/10"
          : done
            ? "border-emerald-500/30"
            : "border-border"
      }`}
    >
      {running ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.4, ease: "linear" }}
          aria-hidden="true"
        />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              done
                ? "bg-emerald-500/20 text-emerald-500"
                : running
                  ? "bg-emerald-500 text-white"
                  : "bg-secondary text-muted-foreground"
            }`}
            aria-hidden="true"
          >
            {done ? <Check className="h-4 w-4" /> : running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="flex items-baseline gap-1.5 text-sm font-semibold leading-tight text-foreground">
              <span className="font-mono text-[10px] text-muted-foreground">{String(stage.id).padStart(2, "0")}</span>
              <span className="truncate">{stage.title}</span>
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{STAGE_HINTS[index]}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 whitespace-nowrap text-[10px] ${
            done
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : running
                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-500"
                : "text-muted-foreground"
          }`}
        >
          {done ? "DONE" : running ? "RUNNING" : "IDLE"}
        </Badge>
      </div>

      <div className="mt-3">
        <Progress
          value={stage.progress * 100}
          className="h-1.5 [&>div]:bg-emerald-500"
          aria-label={`Stage ${stage.id} progress: ${Math.round(stage.progress * 100)}%`}
        />
        <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[11px]">
          <span className="truncate font-mono text-muted-foreground">{stage.counter || "—"}</span>
          <span className="shrink-0 font-mono tabular-nums text-muted-foreground/80">
            {stage.seconds > 0 ? `${stage.seconds.toFixed(1)}s` : ""}
          </span>
        </div>
      </div>
    </motion.li>
  );
}
