"use client";

/**
 * ============================================================================
 *  LIVE PIPELINE LAB — the flagship view, v3 layout.
 *
 *  Full-width stacked design (replaces the old cramped two-column layout):
 *    1 · Run Control Bar  — upload · corpus · models · speed · run
 *    2 · Pipeline Stepper — the horizontal nine-stage rail, click to inspect
 *    3 · Stage Workspace  — one detailed full-width tab per stage + terminal
 *    4 · Run Summary      — KPIs, live-vs-verified, PDF/JSON downloads
 *    5 · Saved Runs       — reopen any completed artifact
 *
 *  The whole capstone pipeline runs FOR REAL in this browser: pdf.js text
 *  extraction, regex property mining, recursive-descent formula parsing,
 *  63 Magpie composition features, an honestly-labelled simulated embedding
 *  layer and five TypeScript ML models cross-validated in a web worker.
 * ============================================================================
 */

import { FlaskConical } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PipelineStepper } from "@/components/live/pipeline-stepper";
import { RunControlBar } from "@/components/live/run-control-bar";
import { RunSummaryPanel, SavedRunsPanel } from "@/components/live/run-summary-panel";
import { StageWorkspace } from "@/components/live/stage-workspace";
import { ViewHeader } from "@/components/view-header";
import { Badge } from "@/components/ui/badge";
import { MODEL_LABELS } from "@/lib/engine/types";
import {
  SPEED_LABELS,
  initPipelineWorker,
  startPipelineRun,
  useLiveRunStore,
} from "@/lib/live-run-store";

export function LiveLabView() {
  const running = useLiveRunStore((s) => s.running);
  const runStartedAt = useLiveRunStore((s) => s.runStartedAt);
  const runEndedAt = useLiveRunStore((s) => s.runEndedAt);
  const error = useLiveRunStore((s) => s.error);
  const cancelledStage = useLiveRunStore((s) => s.cancelledStage);
  const uploads = useLiveRunStore((s) => s.uploads);
  const includeBundled = useLiveRunStore((s) => s.includeBundled);
  const models = useLiveRunStore((s) => s.models);
  const speed = useLiveRunStore((s) => s.speed);
  const stages = useLiveRunStore((s) => s.stages);
  const folds = useLiveRunStore((s) => s.folds);
  const [elapsedTick, setElapsedTick] = useState(0);
  const [activeTab, setActiveTab] = useState("1");

  // derived elapsed ("now" while running, final value once finished)
  const elapsed = useMemo(() => {
    if (!runStartedAt) return 0;
    if (!running && runEndedAt) return (runEndedAt - runStartedAt) / 1000;
    return (Date.now() - runStartedAt) / 1000;
  }, [runStartedAt, runEndedAt, running, elapsedTick]);

  // derived ETA from fold timings
  const eta = useMemo<string | null>(() => {
    if (!running) return null;
    const stage8 = stages[7];
    if (stage8?.status !== "running") return "~2 min (5-model CV is the long pole)";
    const allFolds = Object.values(folds).flat();
    if (allFolds.length < 2) return "~2 min (5-model CV is the long pole)";
    const avgFold = allFolds.reduce((a, f) => a + f.seconds, 0) / allFolds.length;
    const totalFolds = models.length * 5;
    const remaining = Math.max(0, totalFolds - allFolds.length);
    return `~${Math.max(1, Math.round(remaining * avgFold))}s (${allFolds.length}/${totalFolds} folds)`;
  }, [running, stages, folds, models.length]);

  // boot the engine worker once (client only)
  useEffect(() => {
    initPipelineWorker();
    void useLiveRunStore.getState().refreshSavedRuns();
    void useLiveRunStore.getState().refreshEmbedStatus();
  }, []);

  // elapsed ticker — interval callbacks only (no synchronous setState)
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsedTick((t) => t + 1), 500);
    return () => window.clearInterval(timer);
  }, [running]);

  // toast on run completion / error / cancellation
  const summary = useLiveRunStore((s) => s.summary);
  useEffect(() => {
    if (summary) {
      toast.success("Pipeline complete", {
        description: `${summary.totalSeconds.toFixed(1)}s · best ${MODEL_LABELS[summary.bestModel]} · ${summary.counts.discoveryTotal.toLocaleString("en-US")} discovery candidates`,
      });
    }
  }, [summary]);
  useEffect(() => {
    if (error) toast.error("Pipeline error", { description: error });
  }, [error]);
  useEffect(() => {
    if (cancelledStage) toast.warning("Run cancelled", { description: `Stopped during stage ${cancelledStage}.` });
  }, [cancelledStage]);

  const handleRun = useCallback((): void => {
    if (running) return;
    if (!includeBundled && uploads.length === 0) {
      toast.error("Nothing to run", { description: "Upload at least one paper or enable the bundled corpus." });
      return;
    }
    if (models.length === 0) {
      toast.error("No models selected", { description: "Pick at least one model to cross-validate." });
      return;
    }
    setElapsedTick(0);
    setActiveTab("1");
    toast.success("Live pipeline started", {
      description: `${includeBundled ? "bundled corpus" : `${uploads.length} uploaded file${uploads.length === 1 ? "" : "s"}`} · ${models.length} models · ${SPEED_LABELS[speed]}`,
    });
    startPipelineRun({ files: uploads, includeBundled, models, speed });
  }, [running, includeBundled, uploads, models, speed]);

  const handleStageSelect = useCallback((value: string): void => {
    setActiveTab(value);
  }, []);

  return (
    <div className="space-y-6">
      <ViewHeader
        eyebrow="Real-time browser engine"
        title="Live Pipeline Lab"
        description="The entire capstone pipeline running for real in this browser — extraction, mining, formula parsing, features, 5-fold CV with five models and discovery screening. Every stage streams its output live into the tabs below; every number is computed, not replayed."
        actions={
          <Badge
            variant="outline"
            className="gap-1.5 whitespace-nowrap border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
          >
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            real computation · web worker
          </Badge>
        }
      />

      {/* 1 · run configuration — full width */}
      <RunControlBar onRun={handleRun} elapsed={elapsed} eta={eta} />

      {/* 2 · nine-stage rail — click a node to inspect that stage */}
      <PipelineStepper activeStage={Number(activeTab) || 1} onSelect={(id) => handleStageSelect(String(id))} />

      {/* 3 · one detailed panel per stage + the live terminal */}
      <StageWorkspace activeStage={activeTab} onStageSelect={handleStageSelect} />

      {/* 4 · run summary + 5 · saved runs */}
      <RunSummaryPanel />
      <SavedRunsPanel />
    </div>
  );
}
