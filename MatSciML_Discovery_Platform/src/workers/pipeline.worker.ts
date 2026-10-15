/// <reference lib="dom" />
/**
 * LIVE PIPELINE WORKER — hosts the entire engine off the main thread.
 * Instantiated from the Live Pipeline Lab view:
 *   new Worker(new URL("./pipeline.worker.ts", import.meta.url), { type: "module" })
 */

import { runPipeline, PipelineCancelledError } from "@/lib/engine/pipeline";
import type { PipelineHooks, RunConfig, WorkerRequest, WorkerResponse } from "@/lib/engine/types";

const ctx = self as unknown as {
  postMessage: (message: WorkerResponse) => void;
  onmessage: ((ev: MessageEvent<WorkerRequest>) => void) | null;
};

function post(message: WorkerResponse): void {
  ctx.postMessage(message);
}

let cancelled = false;
let running = false;

/* -------------------------------------------------------------------------- */
/*  Real-MatSciBERT bridge: worker → main thread → /api/embed → back          */
/*  Falls back to null (→ local simulated embedding) on timeout/failure.      */
/* -------------------------------------------------------------------------- */

const pendingEmbeds = new Map<number, (vectors: number[][] | null) => void>();
let embedSeq = 0;
const EMBED_TIMEOUT_MS = 60_000;

function requestEmbeddings(texts: string[]): Promise<number[][] | null> {
  return new Promise((resolve) => {
    const batchId = ++embedSeq;
    const timer = setTimeout(() => {
      pendingEmbeds.delete(batchId);
      resolve(null);
    }, EMBED_TIMEOUT_MS);
    pendingEmbeds.set(batchId, (vectors) => {
      clearTimeout(timer);
      resolve(vectors);
    });
    post({ type: "embedRequest", batchId, texts });
  });
}

const hooks: PipelineHooks = {
  stage: (stage, status, progress, counter, seconds) =>
    post({ type: "stage", stage, status, progress, counter, seconds }),
  log: (level, msg) => post({ type: "log", level, msg, ts: Date.now() }),
  papers: (papers) => post({ type: "papersMeta", papers }),
  extractedText: (sample) => post({ type: "extractedText", sample }),
  embeddingSamples: (samples) => post({ type: "embeddingSamples", samples }),
  sentences: (batch) => post({ type: "sentences", batch }),
  records: (records) => post({ type: "records", records }),
  datasetSaved: (rows, matched, formulas, gaps) =>
    post({ type: "datasetSaved", rows, matched, formulas, gaps }),
  features: (names, kept) => post({ type: "features", names, kept }),
  fold: (result) =>
    post({
      type: "fold",
      model: result.model,
      fold: result.fold,
      mae: result.mae,
      rmse: result.rmse,
      r2: result.r2,
      seconds: result.seconds,
    }),
  modelDone: (s) =>
    post({
      type: "modelDone",
      model: s.model,
      maeMean: s.maeMean,
      maeStd: s.maeStd,
      rmseMean: s.rmseMean,
      rmseStd: s.rmseStd,
      r2Mean: s.r2Mean,
      r2Std: s.r2Std,
      seconds: s.seconds,
    }),
  bestModel: (model, holdout) => post({ type: "bestModel", model, holdout }),
  importance: (rows) => post({ type: "importance", rows }),
  discovery: (batch, total) => post({ type: "discovery", batch, total }),
  cancelled: (stage) => post({ type: "cancelled", stage }),
};

ctx.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data;
  if (msg.type === "init") {
    post({ type: "ready" });
    return;
  }
  if (msg.type === "cancel") {
    if (running) cancelled = true;
    return;
  }
  if (msg.type === "embedResponse") {
    const resolve = pendingEmbeds.get(msg.batchId);
    if (resolve) {
      pendingEmbeds.delete(msg.batchId);
      resolve(msg.vectors);
    }
    return;
  }
  if (msg.type === "run") {
    if (running) {
      post({ type: "error", message: "A pipeline run is already in progress." });
      return;
    }
    cancelled = false;
    running = true;
    const config: RunConfig = msg.config;
    runPipeline(config, {
      hooks,
      isCancelled: () => cancelled,
      speed: config.speed,
      embed: config.embedding === "simulated" ? undefined : requestEmbeddings,
    })
      .then((summary) => {
        post({ type: "runComplete", summary });
      })
      .catch((err: unknown) => {
        if (err instanceof PipelineCancelledError) {
          post({ type: "cancelled", stage: err.stage });
        } else {
          post({ type: "error", message: err instanceof Error ? err.message : String(err) });
        }
      })
      .finally(() => {
        running = false;
        cancelled = false;
      });
  }
};

export {};
