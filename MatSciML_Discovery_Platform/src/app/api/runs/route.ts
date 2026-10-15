import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/*  Run artifact persistence for the Live Pipeline Lab.                       */
/*  POST /api/runs            → save one completed run                        */
/*  GET  /api/runs            → list recent runs (summaries only)             */
/*  GET  /api/runs?runId=...  → fetch one full artifact                       */
/*  DELETE /api/runs?runId=…  → remove one artifact                           */
/* -------------------------------------------------------------------------- */

const MAX_DISCOVERY_ROWS = 300;

const runArtifactSchema = z.object({
  runId: z.string().min(3).max(64),
  config: z.record(z.string(), z.unknown()),
  summary: z
    .object({
      runId: z.string(),
      totalSeconds: z.number(),
      bestModel: z.string(),
      counts: z.record(z.string(), z.unknown()),
      honesty: z.record(z.string(), z.unknown()),
    })
    .passthrough(),
  records: z.array(z.unknown()),
  cvResults: z.array(z.unknown()),
  discovery: z.array(z.unknown()),
});

async function withDb<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    const { db } = await import("@/lib/db");
    return await fn();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = runArtifactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid run artifact",
        details: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`),
      },
      { status: 400 },
    );
  }
  const { runId, config, summary, records, cvResults } = parsed.data;
  const discovery = parsed.data.discovery.slice(0, MAX_DISCOVERY_ROWS);

  const jsonConfig = config as unknown as Prisma.InputJsonObject;
  const jsonSummary = summary as unknown as Prisma.InputJsonObject;
  const jsonRecords = records as unknown as Prisma.InputJsonValue;
  const jsonCv = cvResults as unknown as Prisma.InputJsonValue;
  const jsonDiscovery = discovery as unknown as Prisma.InputJsonValue;

  const saved = await withDb(async () => {
    const { db } = await import("@/lib/db");
    return db.runArtifact.upsert({
      where: { runId },
      update: { config: jsonConfig, summary: jsonSummary, records: jsonRecords, cvResults: jsonCv, discovery: jsonDiscovery },
      create: { runId, config: jsonConfig, summary: jsonSummary, records: jsonRecords, cvResults: jsonCv, discovery: jsonDiscovery },
    });
  });

  if (!saved) {
    // 503 → the client transparently falls back to localStorage
    return NextResponse.json(
      { error: "Run artifact database unavailable — saved locally instead", saved: "local" },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, id: saved.id, runId: saved.runId, saved: "prisma" }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  if (runId) {
    const artifact = await withDb(() =>
      import("@/lib/db").then(({ db }) => db.runArtifact.findUnique({ where: { runId } })),
    );
    if (!artifact) {
      return NextResponse.json({ error: `Run "${runId}" not found` }, { status: 404 });
    }
    return NextResponse.json({ artifact });
  }

  const rows = await withDb(() =>
    import("@/lib/db").then(({ db }) =>
      db.runArtifact.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, runId: true, createdAt: true, config: true, summary: true },
      }),
    ),
  );

  if (!rows) {
    return NextResponse.json({ error: "Run artifact database unavailable", runs: [] }, { status: 503 });
  }

  const runs = rows.map((row) => {
    const summary = row.summary as Record<string, unknown>;
    const counts = (summary?.counts ?? {}) as Record<string, number>;
    return {
      id: row.id,
      runId: row.runId,
      createdAt: row.createdAt,
      totalSeconds: typeof summary?.totalSeconds === "number" ? summary.totalSeconds : null,
      bestModel: typeof summary?.bestModel === "string" ? summary.bestModel : null,
      records: counts.records ?? null,
      datasetRows: counts.benchmarkRowsFinal ?? null,
      discoveryTotal: counts.discoveryTotal ?? null,
      config: row.config,
    };
  });
  return NextResponse.json({ runs });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");
  if (!runId) {
    return NextResponse.json({ error: "runId query parameter is required" }, { status: 400 });
  }
  const deleted = await withDb(() =>
    import("@/lib/db").then(({ db }) => db.runArtifact.delete({ where: { runId } })),
  );
  if (!deleted) {
    return NextResponse.json({ error: "Run artifact database unavailable" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, runId });
}
