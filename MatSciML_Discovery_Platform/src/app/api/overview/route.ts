import { NextResponse } from "next/server";

import { probeDatabase } from "@/lib/db-optional";
import {
  BAND_GAP_HISTOGRAM,
  FSCORE_COMPARISON,
  MODEL_CV_RESULTS,
  OVERVIEW_KPIS,
  PIPELINE_STAGES,
  PROJECT,
  RUN_METADATA,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const best = MODEL_CV_RESULTS.find((m) => m.isBest) ?? MODEL_CV_RESULTS[0];
  const persistence = await probeDatabase();

  return NextResponse.json(
    {
      project: {
        title: PROJECT.title,
        fullTitle: PROJECT.fullTitle,
        subtitle: PROJECT.subtitle,
        basePaperDoi: PROJECT.basePaperDoi,
      },
      run: RUN_METADATA,
      kpis: OVERVIEW_KPIS,
      pipelineHealth: PIPELINE_STAGES.map((s) => ({ id: s.id, title: s.title, status: s.status })),
      bestModel: {
        model: best.model,
        mae: best.maeMean,
        rmse: best.rmseMean,
        r2: best.r2Mean,
      },
      fscore: FSCORE_COMPARISON,
      histogram: BAND_GAP_HISTOGRAM,
      persistence: {
        source: persistence.source,
        databaseAvailable: persistence.available,
        seededRows: persistence.available
          ? persistence.papers + persistence.records + persistence.candidates
          : 0,
      },
      generatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
