import { NextResponse } from "next/server";

import { BAND_GAP_HISTOGRAM, DATASET_CLEANING_REPORT, DATASET_STATS } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      stats: DATASET_STATS,
      cleaningReport: DATASET_CLEANING_REPORT,
      histogram: BAND_GAP_HISTOGRAM,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
