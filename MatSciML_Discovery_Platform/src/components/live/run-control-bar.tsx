"use client";

/**
 * RUN CONTROL BAR — the full-width command strip that replaced the old
 * cramped 380px sidebar card. One horizontal card: upload zone · corpus ·
 * models · speed · run/cancel/reset with live elapsed + ETA.
 */

import { AlertTriangle, Ban, Cpu, FileText, Loader2, Play, RotateCcw, Rocket, Trash2, UploadCloud, Zap, Gauge, Sparkles, Braces } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MODEL_LABELS, MODEL_ORDER } from "@/lib/engine/types";
import type { EmbeddingMode, ModelId, SpeedMode } from "@/lib/engine/types";
import { extractAnyFile } from "@/lib/pdf-extract";
import { listUploads, saveUpload } from "@/lib/uploads-idb";
import { SPEED_LABELS, cancelPipelineRun, useLiveRunStore } from "@/lib/live-run-store";

/* -------------------------------------------------------------------------- */
/*  Compact dropzone                                                          */
/* -------------------------------------------------------------------------- */

function Dropzone() {
  const uploadMeta = useLiveRunStore((s) => s.uploadMeta);
  const addUpload = useLiveRunStore((s) => s.addUpload);
  const setUploadStatus = useLiveRunStore((s) => s.setUploadStatus);
  const removeUpload = useLiveRunStore((s) => s.removeUpload);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const loadLibrary = useCallback(async (): Promise<void> => {
    const stored = await listUploads();
    if (stored.length === 0) {
      toast.info("Library is empty", { description: "Upload papers here or in the Papers view — they persist in this browser." });
      return;
    }
    let added = 0;
    for (const row of stored) {
      if (row.pages.length === 0) continue;
      addUpload(
        { name: row.filename, pages: row.pages, chars: row.chars },
        { name: row.filename, size: row.chars, pages: row.pages.length, chars: row.chars, status: "ready" },
      );
      added++;
    }
    toast.success(`Loaded ${added} paper${added === 1 ? "" : "s"} from the library`, {
      description: "Disable the bundled corpus to run on YOUR papers only.",
    });
  }, [addUpload]);

  const handleFiles = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      for (const file of Array.from(files)) {
        const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
        const isText = /\.(txt|md)$/i.test(file.name) || file.type.startsWith("text/");
        if (!isPdf && !isText) {
          toast.error(`Unsupported file: ${file.name}`, { description: "Drop PDF or TXT research papers." });
          continue;
        }
        setUploadStatus(file.name, { name: file.name, size: file.size, pages: 0, chars: 0, status: "extracting" });
        try {
          const payload = await extractAnyFile(file, (page, total) => {
            setUploadStatus(file.name, { pages: `${page}/${total}` });
          });
          addUpload(payload, {
            name: file.name,
            size: file.size,
            pages: payload.pages.length,
            chars: payload.chars,
            status: "ready",
          });
          // persist to the shared library (IndexedDB + server when available)
          void saveUpload(payload);
          toast.success(`Extracted ${file.name}`, {
            description: `${payload.pages.length} pages · ${payload.chars.toLocaleString("en-US")} chars (pdf.js) — saved to your library`,
          });
        } catch (error) {
          setUploadStatus(file.name, {
            status: "error",
            error: error instanceof Error ? error.message : "extraction failed",
          });
          toast.error(`Extraction failed: ${file.name}`, {
            description: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    },
    [addUpload, setUploadStatus],
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload research papers (PDF or TXT) — drag and drop or click to browse"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[84px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
          dragging
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-border bg-secondary/30 hover:border-emerald-500/50 hover:bg-emerald-500/5"
        }`}
      >
        <UploadCloud className="h-6 w-6 text-emerald-500" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          Upload papers <span className="text-muted-foreground">— PDF / TXT, multiple files</span>
        </p>
        <p className="text-[11px] text-muted-foreground">pdf.js text extraction runs locally in your browser</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void loadLibrary();
          }}
          className="mt-1 rounded-md border border-border/70 bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          or load previously uploaded papers from the library →
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {uploadMeta.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
            aria-label="Uploaded files"
          >
            {uploadMeta.map((f) => (
              <motion.li
                key={f.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2"
              >
                {f.status === "extracting" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-500" aria-hidden="true" />
                ) : f.status === "error" ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{f.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {f.status === "extracting"
                      ? "extracting text…"
                      : f.status === "error"
                        ? (f.error ?? "extraction failed")
                        : `${f.pages} pages · ${f.chars.toLocaleString("en-US")} chars`}
                  </p>
                </div>
                {f.status === "ready" ? (
                  <Badge variant="outline" className="shrink-0 whitespace-nowrap border-emerald-500/40 bg-emerald-500/10 text-[9px] text-emerald-600 dark:text-emerald-400">
                    READY
                  </Badge>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-500"
                  onClick={() => removeUpload(f.name)}
                  aria-label={`Remove ${f.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Embedding source control — real MatSciBERT vs local fallback             */
/* -------------------------------------------------------------------------- */

const EMBED_OPTIONS: Array<{ mode: EmbeddingMode; label: string; hint: string }> = [
  { mode: "auto", label: "MatSciBERT", hint: "real embeddings via Hugging Face when HF_TOKEN is set, honest fallback otherwise" },
  { mode: "simulated", label: "Local", hint: "deterministic 32-d browser embedding — instant, offline" },
];

function EmbeddingControl() {
  const embeddingMode = useLiveRunStore((s) => s.embeddingMode);
  const setEmbeddingMode = useLiveRunStore((s) => s.setEmbeddingMode);
  const embedStatus = useLiveRunStore((s) => s.embedStatus);
  const embedSource = useLiveRunStore((s) => s.embedSource);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Embedding</p>
        {embedStatus ? (
          embedStatus.hasKey ? (
            <Badge className="gap-1 bg-teal-600 px-1.5 py-0 text-[9px] text-white hover:bg-teal-600">
              <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
              HF key detected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[9px] text-amber-600 dark:text-amber-400">
              no key → local
            </Badge>
          )
        ) : null}
      </div>
      <div role="radiogroup" aria-label="Embedding source" className="grid grid-cols-2 gap-1.5">
        {EMBED_OPTIONS.map((opt) => {
          const active = embeddingMode === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.hint}
              onClick={() => setEmbeddingMode(opt.mode)}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                active
                  ? "border-teal-500/60 bg-teal-500/15 text-teal-600 dark:text-teal-400"
                  : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {opt.mode === "auto" ? <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> : <Braces className="h-3.5 w-3.5" aria-hidden="true" />}
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 min-h-[14px] font-mono text-[9px] leading-tight text-muted-foreground">
        {embedSource === "huggingface"
          ? "this run: real MatSciBERT vectors ✓"
          : embedSource === "simulated"
            ? "this run: local deterministic vectors"
            : embeddingMode === "auto" && embedStatus?.hasKey
              ? "ready — real m3rg-iitd/matscibert via /api/embed"
              : "add HF_TOKEN on the server for real MatSciBERT (optional)"}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Speed control (inline)                                                    */
/* -------------------------------------------------------------------------- */

const SPEED_ICONS: Record<SpeedMode, React.ComponentType<{ className?: string }>> = {
  smooth: Gauge,
  fast: Zap,
  turbo: Rocket,
};

function SpeedControl() {
  const speed = useLiveRunStore((s) => s.speed);
  const setSpeed = useLiveRunStore((s) => s.setSpeed);

  return (
    <div role="radiogroup" aria-label="Pipeline speed" className="grid grid-cols-3 gap-1.5">
      {(Object.keys(SPEED_LABELS) as SpeedMode[]).map((mode) => {
        const Icon = SPEED_ICONS[mode];
        const active = speed === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setSpeed(mode)}
            className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
              active
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {SPEED_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Run control bar                                                           */
/* -------------------------------------------------------------------------- */

export function RunControlBar({ onRun, elapsed, eta }: { onRun: () => void; elapsed: number; eta: string | null }) {
  const includeBundled = useLiveRunStore((s) => s.includeBundled);
  const setIncludeBundled = useLiveRunStore((s) => s.setIncludeBundled);
  const models = useLiveRunStore((s) => s.models);
  const toggleModel = useLiveRunStore((s) => s.toggleModel);
  const uploads = useLiveRunStore((s) => s.uploads);
  const running = useLiveRunStore((s) => s.running);
  const workerReady = useLiveRunStore((s) => s.workerReady);
  const error = useLiveRunStore((s) => s.error);
  const hasRun = useLiveRunStore((s) => s.hasAnyOutput);
  const resetRunState = useLiveRunStore((s) => s.resetRun);

  const canRun = !running && workerReady && (includeBundled || uploads.length > 0) && models.length > 0;
  const disabledReason = running
    ? null
    : !workerReady
      ? "engine worker is still booting…"
      : !(includeBundled || uploads.length > 0)
        ? "upload a paper or enable the bundled corpus"
        : models.length === 0
          ? "select at least one model"
          : null;

  return (
    <Card className="border-emerald-500/25">
      <CardContent className="p-4 lg:p-5">
        {/* persistent error banner — a dead engine is never just a toast */}
        <AnimatePresence>
          {error ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
              role="alert"
            >
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-xs font-medium text-red-700 dark:text-red-300">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-red-500/40 px-2.5 text-[11px] text-red-700 hover:bg-red-500/10 dark:text-red-300"
                  onClick={() => {
                    resetRunState();
                    onRun();
                  }}
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Retry run
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid gap-5 lg:grid-cols-[minmax(260px,1fr)_minmax(240px,0.9fr)_minmax(200px,0.8fr)_minmax(230px,0.9fr)]">
          {/* col 1 — upload */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <UploadCloud className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              Input papers
            </p>
            <Dropzone />
          </div>

          {/* col 2 — corpus + models */}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Corpus</p>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                <Checkbox
                  id="bundled-corpus"
                  checked={includeBundled}
                  onCheckedChange={(v) => setIncludeBundled(v === true)}
                  aria-label="Include bundled 4-paper corpus"
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <Label htmlFor="bundled-corpus" className="cursor-pointer text-xs font-medium leading-none">
                    Bundled corpus (4 real papers)
                  </Label>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    Ward2016 · Dunn2020 · Gupta2022 · Kononova2019 — 39 pages
                  </p>
                </div>
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-foreground">Models to cross-validate</legend>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {MODEL_ORDER.map((m: ModelId) => {
                  const checked = models.includes(m);
                  return (
                    <label
                      key={m}
                      className={`flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors ${
                        checked ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-secondary/30 hover:bg-secondary"
                      }`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleModel(m)} aria-label={MODEL_LABELS[m]} />
                      <span className={`min-w-0 leading-tight ${checked ? "font-medium text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
                        {MODEL_LABELS[m]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* col 3 — speed + embedding + engine status */}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Speed</p>
              <SpeedControl />
            </div>
            <EmbeddingControl />
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[11px] ${
                workerReady
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
              aria-live="polite"
            >
              <Cpu className="h-4 w-4 shrink-0" aria-hidden="true" />
              {workerReady ? "engine worker ready — computation runs off the main thread" : "booting engine worker…"}
            </div>
          </div>

          {/* col 4 — run */}
          <div className="flex flex-col gap-2 lg:border-l lg:border-border lg:pl-5">
            <Button
              size="lg"
              className="h-12 w-full gap-2 bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500"
              disabled={!canRun}
              onClick={onRun}
              aria-label="Run the full 9-stage pipeline in the browser"
              title={disabledReason ?? "Run the full 9-stage pipeline"}
            >
              {running ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Running… {formatElapsed(elapsed)}
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" aria-hidden="true" />
                  Run Full Pipeline
                </>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 gap-1.5"
                disabled={!running}
                onClick={() => {
                  cancelPipelineRun();
                  toast.info("Cancel requested", { description: "The engine will stop at the next checkpoint." });
                }}
              >
                <Ban className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 flex-1 gap-1.5"
                disabled={running || !hasRun}
                onClick={() => {
                  resetRunState();
                  toast.info("Run reset", { description: "All live panels cleared — engine kept warm." });
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </Button>
            </div>
            <p className="min-h-[16px] text-center font-mono text-[10px] text-muted-foreground" aria-live="polite">
              {running
                ? `elapsed ${formatElapsed(elapsed)}${eta ? ` · ETA ${eta}` : ""}`
                : disabledReason
                  ? disabledReason
                  : "9 stages · 5-fold CV · discovery screening"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
