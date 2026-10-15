"use client";

/**
 * STAGE WORKSPACE — the full-width tabbed home for every pipeline stage's
 * detailed output. Tabs mirror the nine stages one-to-one (plus the live
 * terminal). While the engine runs the workspace auto-advances to the
 * currently-running stage; the user can pin any tab by clicking it.
 */

import { CheckCircle2, ExternalLink, Loader2, TerminalSquare } from "lucide-react";
import { useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveTerminal } from "@/components/live/live-terminal";
import { BenchmarkJoinPanel, DiscoveryPanel, FeaturesPanel, LeaderboardPanel, MinedSentencesPanel, RecordsPanel } from "@/components/live/output-panels";
import { EmbeddingPanel, ExtractedTextPanel, FoldDetailPanel, PapersStagePanel } from "@/components/live/stage-extra-panels";
import { STAGE_INFO } from "@/lib/live-stage-info";
import { useLiveRunStore } from "@/lib/live-run-store";
import { useUiStore } from "@/lib/store";

/* -------------------------------------------------------------------------- */
/*  Empty-state wrapper                                                       */
/* -------------------------------------------------------------------------- */

function StagePanelSlot({ hasOutput, waitingText, children }: { hasOutput: boolean; waitingText: string; children: React.ReactNode }) {
  if (!hasOutput) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{waitingText}</p>
      </div>
    );
  }
  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/*  Workspace                                                                 */
/* -------------------------------------------------------------------------- */

export function StageWorkspace({
  activeStage,
  onStageSelect,
}: {
  activeStage: string;
  onStageSelect: (value: string) => void;
}) {
  const stages = useLiveRunStore((s) => s.stages);
  const running = useLiveRunStore((s) => s.running);
  const setView = useUiStore((s) => s.setView);
  const pinnedRef = useRef(false);

  const sentences = useLiveRunStore((s) => s.sentences);
  const records = useLiveRunStore((s) => s.records);
  const dataset = useLiveRunStore((s) => s.dataset);
  const features = useLiveRunStore((s) => s.features);
  const folds = useLiveRunStore((s) => s.folds);
  const discovery = useLiveRunStore((s) => s.discovery);
  const papers = useLiveRunStore((s) => s.papers);
  const extractedPages = useLiveRunStore((s) => s.extractedPages);
  const embeddingSamples = useLiveRunStore((s) => s.embeddingSamples);

  // auto-advance to the running stage unless the user pinned a tab
  useEffect(() => {
    if (running && !pinnedRef.current) {
      const current = stages.find((s) => s.status === "running");
      if (current) onStageSelect(String(current.id));
    }
  }, [stages, running, onStageSelect]);

  // unpin at the start of each run so auto-advance resumes
  useEffect(() => {
    if (running) pinnedRef.current = false;
  }, [running]);

  const handleValueChange = (value: string): void => {
    pinnedRef.current = true;
    onStageSelect(value);
  };

  const active = activeStage;
  const activeInfo = STAGE_INFO.find((s) => s.id === Number(active));
  const activeStageState = stages[Number(active) - 1];

  return (
    <section aria-label="Pipeline stage outputs" className="rounded-xl border border-border bg-card">
      <Tabs value={active} onValueChange={handleValueChange}>
        {/* tab rail */}
        <div className="border-b border-border px-3 pt-3">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {STAGE_INFO.map((info) => {
              const stage = stages[info.id - 1];
              const isRunning = stage?.status === "running";
              const isDone = stage?.status === "done";
              return (
                <TabsTrigger
                  key={info.id}
                  value={String(info.id)}
                  className={`relative gap-1.5 rounded-lg px-2.5 py-1.5 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 ${
                    isRunning ? "ring-1 ring-emerald-500/50" : ""
                  }`}
                >
                  <span className="font-mono text-[10px] text-muted-foreground">{String(info.id).padStart(2, "0")}</span>
                  <span className="whitespace-nowrap text-xs">{info.title}</span>
                  {isDone ? <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" /> : null}
                  {isRunning ? <Loader2 className="h-3 w-3 animate-spin text-emerald-500" aria-hidden="true" /> : null}
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="log" className="gap-1.5 rounded-lg px-2.5 py-1.5 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300">
              <TerminalSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="whitespace-nowrap text-xs">Terminal</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* stage header strip */}
        {activeInfo ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/30 px-4 py-2.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`whitespace-nowrap text-[10px] ${
                  activeStageState?.status === "done"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : activeStageState?.status === "running"
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-500"
                      : "text-muted-foreground"
                }`}
              >
                {activeStageState?.status === "done" ? "DONE" : activeStageState?.status === "running" ? "RUNNING" : "IDLE"}
              </Badge>
              <p className="min-w-0 text-xs text-muted-foreground">{activeInfo.description}</p>
              {activeStageState?.counter ? (
                <span className="whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-foreground/80">
                  {activeStageState.counter}
                </span>
              ) : null}
            </div>
            {activeInfo.view ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-[11px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                onClick={() => setView(activeInfo.view!)}
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                Explore in {activeInfo.viewLabel} tab
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* panels */}
        <div className="p-4">
          <TabsContent value="1" className="mt-0">
            <StagePanelSlot
              hasOutput={papers.length > 0}
              waitingText="The corpus table appears the moment the engine assembles your uploaded papers plus the bundled corpus."
            >
              <PapersStagePanel />
            </StagePanelSlot>
          </TabsContent>

          <TabsContent value="2" className="mt-0">
            <StagePanelSlot
              hasOutput={extractedPages.length > 0}
              waitingText="Preprocessed text previews stream here page by page while the engine segments sentences."
            >
              <ExtractedTextPanel />
            </StagePanelSlot>
          </TabsContent>

          <TabsContent value="3" className="mt-0">
            <StagePanelSlot
              hasOutput={sentences.length > 0}
              waitingText="Mined property sentences stream here in batches of 25 as the regex + keyword miner scans the corpus."
            >
              <MinedSentencesPanel />
            </StagePanelSlot>
          </TabsContent>

          <TabsContent value="4" className="mt-0">
            <StagePanelSlot
              hasOutput={embeddingSamples.length > 0}
              waitingText="Sample embedding vectors appear here once the embedding layer starts encoding the mined sentences."
            >
              <EmbeddingPanel />
            </StagePanelSlot>
          </TabsContent>

          <TabsContent value="5" className="mt-0">
            <StagePanelSlot
              hasOutput={records.length > 0}
              waitingText="The structured dataset — material, property, value, evidence sentence and benchmark match — builds here record by record."
            >
              <RecordsPanel />
            </StagePanelSlot>
          </TabsContent>

          <TabsContent value="6" className="mt-0">
            <StagePanelSlot
              hasOutput={dataset !== null}
              waitingText="The Matbench expt_gap join stats (dedupe, clean rows, matched records) appear here when the join completes."
            >
              <BenchmarkJoinPanel />
            </StagePanelSlot>
          </TabsContent>

          <TabsContent value="7" className="mt-0">
            <StagePanelSlot
              hasOutput={features !== null}
              waitingText="The 95 computed features and the kept subset appear here after variance + correlation filtering."
            >
              <FeaturesPanel />
            </StagePanelSlot>
          </TabsContent>

          <TabsContent value="8" className="mt-0 space-y-5">
            <StagePanelSlot
              hasOutput={Object.keys(folds).length > 0}
              waitingText="The live CV leaderboard fills in fold by fold as each model trains — fold 1 of 5 first for every model in turn."
            >
              <LeaderboardPanel />
            </StagePanelSlot>
            <section aria-label="Fold calculation detail">
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <span className="font-mono text-[10px] text-muted-foreground">CALCULATION</span>
                Fold-by-fold 5-fold CV — the process
              </h3>
              <FoldDetailPanel />
            </section>
          </TabsContent>

          <TabsContent value="9" className="mt-0">
            <StagePanelSlot
              hasOutput={discovery.length > 0}
              waitingText="Discovery candidates stream here once the best model starts screening unseen oxide compositions."
            >
              <DiscoveryPanel />
            </StagePanelSlot>
          </TabsContent>

          <TabsContent value="log" className="mt-0">
            <LiveTerminal />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
