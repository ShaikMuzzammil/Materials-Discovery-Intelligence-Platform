import { NextResponse } from "next/server";

import { fetchModelResults } from "@/lib/db-optional";
import {
  FEATURE_ABLATION,
  FSCORE_COMPARISON,
  HOLDOUT_RESULT,
  PUBLISHED_REFERENCE,
  SPOT_CHECKS,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const cvResults = await fetchModelResults();
  return NextResponse.json(
    {
      cvResults,
      holdout: HOLDOUT_RESULT,
      ablation: FEATURE_ABLATION,
      spotChecks: SPOT_CHECKS,
      publishedReference: PUBLISHED_REFERENCE,
      fscore: FSCORE_COMPARISON,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
