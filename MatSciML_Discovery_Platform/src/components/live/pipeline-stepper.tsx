"use client";

/**
 * PIPELINE STEPPER — the horizontal 9-stage rail above the stage workspace.
 * Full, never-truncated titles · live status · per-stage progress · click a
 * node to open that stage's detailed output panel. Auto-scrolls the active
 * node into view while the engine runs.
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
import { useEffect, useRef } from "react";

import { Progress } from "@/components/ui/progress";
import { STAGE_INFO } from "@/lib/live-stage-info";
import { useLiveRunStore } from "@/lib/live-run-store";

export function PipelineStepper({ activeStage, onSelect }: { activeStage: number; onSelect: (stage: number) => void }) {
  const stages = useLiveRunStore((s) => s.stages);
  const running = useLiveRunStore((s) => s.running);
  const containerRef = useRef<HTMLOListElement>(null);

  // keep the active node visible while the pipeline runs
  useEffect(() => {
    const node = containerRef.current?.querySelector<HTMLElement>(`[data-stage-node="${activeStage}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeStage]);

  const overall = running ? stages.reduce((a, s) => a + (s.status === "done" ? 1 : s.progress), 0) / stages.length : stages.filter((s) => s.status === "done").length / stages.length;

  return (
    <section aria-label="Pipeline progress rail" className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="font-mono text-[10px] text-muted-foreground">PIPELINE</span>
          Nine stages · click any stage to inspect its live output
        </h2>
        <p className="font-mono text-xs tabular-nums text-muted-foreground" aria-live="polite">
          overall {Math.round(overall * 100)}%
        </p>
      </div>

      <Progress value={overall * 100} className="mb-4 h-1.5 [&>div]:bg-emerald-500" aria-label="Overall pipeline progress" />

      <ol ref={containerRef} className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {stages.map((stage, index) => {
          const info = STAGE_INFO[index];
          const Icon = info.icon ?? ScanSearch;
          const isActive = activeStage === stage.id;
          const isRunning = stage.status === "running";
          const isDone = stage.status === "done";
          return (
            <li key={stage.id} className="snap-start">
              <button
                type="button"
                data-stage-node={stage.id}
                onClick={() => onSelect(stage.id)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Stage ${stage.id} ${info.title}: ${stage.status}${stage.counter ? `, ${stage.counter}` : ""}`}
                className={`group relative flex w-[148px] flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                  isActive
                    ? "border-emerald-500/70 bg-emerald-500/10"
                    : isRunning
                      ? "border-emerald-500/50 bg-card"
                      : isDone
                        ? "border-emerald-500/25 bg-card hover:border-emerald-500/40"
                        : "border-border bg-card hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isRunning
                          ? "bg-emerald-500 text-white"
                          : "bg-secondary text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : String(stage.id).padStart(2, "0")}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-muted-foreground group-hover:text-foreground" aria-hidden="true">
                    <Icon className="h-4 w-4" />
                  </span>
                  {isRunning ? (
                    <motion.span
                      className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.3, ease: "linear" }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight text-foreground">{info.title}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{info.hint}</p>
                </div>
                <div>
                  <Progress value={stage.progress * 100} className="h-1 [&>div]:bg-emerald-500" aria-hidden="true" />
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className="truncate font-mono text-[9.5px] text-muted-foreground">{stage.counter || "—"}</span>
                    <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground/80">
                      {stage.seconds > 0 ? `${stage.seconds.toFixed(1)}s` : ""}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* icon re-exports so stage-info stays data-only */
export const STAGE_ICONS = { BookOpen, ScanSearch, Network, Minimize2, Table, GitMerge, SlidersHorizontal, Trophy, FlaskConical };
