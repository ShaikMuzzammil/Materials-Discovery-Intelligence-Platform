import { NextRequest, NextResponse } from "next/server";

/**
 * REAL MatSciBERT EMBEDDINGS — server-side Hugging Face proxy.
 *
 * GET  /api/embed                     → key/model status probe
 * POST /api/embed { texts: string[] } → { vectors: number[][] | null, ... }
 *
 * How it works
 *   1. Texts are sent (in small batches) to the Hugging Face Inference API
 *      feature-extraction pipeline for m3rg-iitd/matscibert — the exact
 *      MatSciBERT checkpoint used by the verified Colab notebook.
 *   2. Token embeddings are mean-pooled into one 768-d sentence vector.
 *   3. A deterministic seeded Johnson–Lindenstrauss random projection
 *      (768 → 32 dims) keeps the browser engine's feature budget unchanged
 *      while preserving approximate distances between sentences.
 *
 * Configuration (ALL OPTIONAL — everything works without a key):
 *   HF_TOKEN / HUGGINGFACE_API_KEY   Hugging Face access token
 *   HF_EMBED_MODEL                   override model id (default m3rg-iitd/matscibert)
 *
 * No key / any failure → { vectors: null } and the browser engine honestly
 * falls back to its local deterministic embedding.
 */

export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "m3rg-iitd/matscibert";
const OUT_DIM = 32;
const IN_DIM = 768;
const BATCH = 16;
const MAX_TEXTS = 512;
const TOTAL_BUDGET_MS = 25_000;

function readToken(): string | null {
  const token =
    process.env.HF_TOKEN ??
    process.env.HUGGINGFACE_API_KEY ??
    process.env.HUGGING_FACE_HUB_TOKEN ??
    null;
  return token && token.trim().length > 0 ? token.trim() : null;
}

/* -------------------------------------------------------------------------- */
/*  Deterministic 768×32 random projection (seeded — reproducible)            */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let projection: Float64Array | null = null;

/** Column-major 768×32 Gaussian matrix scaled by 1/sqrt(32) (JL). */
function getProjection(): Float64Array {
  if (projection) return projection;
  const rand = mulberry32(0x24041103); // capstone id — fixed seed
  const m = new Float64Array(IN_DIM * OUT_DIM);
  const scale = 1 / Math.sqrt(OUT_DIM);
  for (let i = 0; i < m.length; i++) {
    // Box–Muller transform
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    m[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * scale;
  }
  projection = m;
  return m;
}

/** Mean-pool token embeddings of arbitrary shape into one vector. */
function poolTokenEmbedding(raw: unknown): number[] | null {
  if (typeof raw === "number") return [raw];
  if (!Array.isArray(raw) || raw.length === 0) return null;
  // token-level: number[][]  →  average rows
  if (Array.isArray(raw[0])) {
    const rows = raw as number[][];
    const dim = rows[0].length;
    if (!dim) return null;
    const acc = new Float64Array(dim);
    for (const row of rows) {
      for (let j = 0; j < dim && j < row.length; j++) acc[j] += row[j];
    }
    return Array.from(acc, (v) => v / rows.length);
  }
  // already sentence-level: number[]
  return raw as number[];
}

/** Project a 768-d pooled vector to 32 dims + L2-normalize. */
function reduceAndNormalize(vec: number[]): number[] {
  const proj = getProjection();
  const out = new Float64Array(OUT_DIM);
  const limit = Math.min(vec.length, IN_DIM);
  for (let d = 0; d < limit; d++) {
    const v = vec[d];
    for (let k = 0; k < OUT_DIM; k++) {
      out[k] += v * proj[d * OUT_DIM + k];
    }
  }
  let norm = 0;
  for (const v of out) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return Array.from(out, (v) => Number((v / norm).toFixed(6)));
}

/* -------------------------------------------------------------------------- */
/*  Routes                                                                    */
/* -------------------------------------------------------------------------- */

export async function GET() {
  const token = readToken();
  return NextResponse.json(
    {
      hasKey: token !== null,
      model: process.env.HF_EMBED_MODEL ?? DEFAULT_MODEL,
      pipeline: "feature-extraction",
      pooling: "mean-token",
      reduction: `768 → ${OUT_DIM} deterministic JL projection`,
      maxTexts: MAX_TEXTS,
      note: token
        ? "Ready — real MatSciBERT embeddings will be used by live runs."
        : "No HF token configured — live runs use the local deterministic embedding. Add HF_TOKEN to enable real MatSciBERT.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const token = readToken();
  if (!token) {
    return NextResponse.json(
      { vectors: null, source: "no-key", reason: "HF_TOKEN / HUGGINGFACE_API_KEY not configured" },
      { status: 200 },
    );
  }

  let texts: string[] = [];
  try {
    const body = (await req.json()) as { texts?: unknown };
    if (Array.isArray(body.texts)) {
      texts = body.texts
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.slice(0, 600))
        .slice(0, MAX_TEXTS);
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (texts.length === 0) {
    return NextResponse.json({ error: "texts[] is required." }, { status: 400 });
  }

  const model = process.env.HF_EMBED_MODEL ?? DEFAULT_MODEL;
  const endpoint = `https://router.huggingface.co/hf-inference/models/${model}/pipelines/feature-extraction`;
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const vectors: number[][] = [];

  try {
    for (let start = 0; start < texts.length; start += BATCH) {
      if (Date.now() > deadline) throw new Error("Hugging Face budget timeout");
      const batch = texts.slice(start, start + BATCH);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: batch, options: { wait_for_model: true } }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HF ${res.status}: ${detail.slice(0, 180)}`);
      }
      const payload = (await res.json()) as unknown;
      const rows = Array.isArray(payload) ? payload : [payload];
      for (let i = 0; i < batch.length; i++) {
        const pooled = poolTokenEmbedding(rows[i]);
        if (!pooled || pooled.length === 0) throw new Error("unexpected embedding shape from HF");
        vectors.push(reduceAndNormalize(pooled));
      }
    }
    return NextResponse.json({
      vectors,
      source: "huggingface",
      model,
      dim: OUT_DIM,
      count: vectors.length,
    });
  } catch (error) {
    return NextResponse.json({
      vectors: null,
      source: "error",
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}
