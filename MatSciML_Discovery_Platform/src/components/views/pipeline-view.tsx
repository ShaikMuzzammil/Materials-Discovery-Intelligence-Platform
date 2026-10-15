"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  GitMerge,
  Library,
  Search,
  SlidersHorizontal,
  Table2,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ViewHeader } from "@/components/view-header";
import { ViewError, ViewSkeleton } from "@/components/view-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePipeline } from "@/hooks/use-api";
import type { PipelineIconKey } from "@/lib/types";

const STAGE_ICONS: Record<PipelineIconKey, React.ComponentType<{ className?: string }>> = {
  library: Library,
  "file-text": FileText,
  search: Search,
  brain: Brain,
  table: Table2,
  "git-merge": GitMerge,
  sliders: SlidersHorizontal,
  trophy: Trophy,
  flask: FlaskConical,
};

export function PipelineView() {
  const { data, isLoading, isError, error, refetch } = usePipeline();
  const [selected, setSelected] = useState(1);

  const stages = useMemo(() => data?.stages ?? [], [data]);
  const stage = stages.find((s) => s.id === selected) ?? stages[0];

  const goNext = useCallback(() => {
    setSelected((cur) => Math.min(cur + 1, stages.length));
  }, [stages.length]);

  const goPrev = useCallback(() => {
    setSelected((cur) => Math.max(cur - 1, 1));
  }, []);

  // Keyboard arrow navigation (ignored while typing in inputs).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") goNext();
      else if (event.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  if (isLoading) return <ViewSkeleton />;
  if (isError || !data || !stage) {
    return <ViewError message={error?.message ?? "Unknown error"} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        eyebrow="9 verified stages"
        title="Pipeline Explorer"
        description="One continuous flow: 20 papers in, 111 ranked new-material candidates out. Click a stage on the stepper (or use ← → arrow keys) to inspect its description, inputs, outputs, real numbers and tech stack."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={selected <= 1} aria-label="Previous stage">
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Prev
            </Button>
            <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
              stage {String(selected).padStart(2, "0")} / 09
            </span>
            <Button variant="outline" size="sm" onClick={goNext} disabled={selected >= stages.length} aria-label="Next stage">
              Next
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        }
      />

      {/* Horizontal stepper */}
      <Card className="overflow-hidden">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max items-stretch gap-0 p-4">
            {stages.map((s, i) => {
              const Icon = STAGE_ICONS[s.icon] ?? Library;
              const isActive = s.id === selected;
              const isDone = s.id < selected;
              return (
                <div key={s.id} className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => setSelected(s.id)}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Stage ${s.id}: ${s.title}`}
                    className={`relative flex w-36 shrink-0 flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all focus-visible:outline-2 focus-visible:outline-ring ${
                      isActive
                        ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                        : "border-border bg-secondary/30 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                        isActive
                          ? "bg-emerald-600 text-white"
                          : isDone
                            ? "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {String(s.id).padStart(2, "0")}
                    </div>
                    <Icon
                      className={`h-4 w-4 ${isActive ? "text-emerald-500" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    />
                    <span className={`text-[11px] font-medium leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.shortTitle}
                    </span>
                    {isActive ? (
                      <motion.span
                        layoutId="stage-glow"
                        className="absolute -bottom-0.5 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-emerald-500"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    ) : null}
                  </button>
                  {i < stages.length - 1 ? (
                    <div className="relative flex w-10 items-center justify-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-border" />
                      <motion.div
                        className="absolute left-0 h-0.5 bg-emerald-500"
                        initial={false}
                        animate={{ width: s.id < selected ? "100%" : "0%" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                      <ArrowRight className="relative z-10 h-3.5 w-3.5 rounded-full bg-card px-0.5 text-muted-foreground" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-600/25">
                    {String(stage.id).padStart(2, "0")}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{stage.title}</CardTitle>
                    <CardDescription className="mt-0.5 font-mono text-xs">
                      stage key: {stage.key}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="gap-1.5 border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  VERIFIED
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <p className="max-w-3xl text-sm leading-relaxed text-foreground/90">{stage.description}</p>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stage.metrics.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="rounded-lg border border-border bg-secondary/40 p-3"
                  >
                    <p className="font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {metric.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {metric.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Inputs → outputs */}
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5 rotate-180 text-teal-500" aria-hidden="true" />
                      Inputs
                    </p>
                    <ul className="space-y-1.5">
                      {stage.inputs.map((input) => (
                        <li key={input} className="flex items-start gap-2 rounded-md bg-secondary/40 px-3 py-2 text-xs text-foreground/90">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
                          {input}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                      Outputs
                    </p>
                    <ul className="space-y-1.5">
                      {stage.outputs.map((output) => (
                        <li key={output} className="flex items-start gap-2 rounded-md bg-emerald-500/8 px-3 py-2 text-xs text-foreground/90">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                          {output}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tech stack */}
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    Tech stack used
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {stage.techStack.map((tech, i) => (
                      <motion.span
                        key={tech}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-[11px] font-medium text-amber-700 dark:text-amber-400"
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>
                  <Separator className="my-5" />
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Status:</span> this stage ran
                      end-to-end inside <span className="font-mono">{`24041_103_RUN_ALL.ipynb`}</span>{" "}
                      with zero errors — every metric above is read from the notebook&apos;s exported
                      CSV outputs, not re-simulated.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prev / next footer */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  disabled={selected <= 1}
                  aria-label={`Go to stage ${selected - 1}`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  {selected > 1 ? stages[selected - 2]?.shortTitle : "Start"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNext}
                  disabled={selected >= stages.length}
                  className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                  aria-label={selected < stages.length ? `Go to stage ${selected + 1}` : "Final stage"}
                >
                  {selected < stages.length ? stages[selected]?.shortTitle : "Complete"}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
