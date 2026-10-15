import { NextResponse } from "next/server";

import { fetchFeatureImportance } from "@/lib/db-optional";
import { FEATURE_ABLATION, FEATURE_FAMILY_SUMMARY, SELECTED_FEATURES } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const importance = await fetchFeatureImportance();
  return NextResponse.json(
    {
      importance,
      selected: SELECTED_FEATURES,
      ablation: FEATURE_ABLATION,
      familySummary: FEATURE_FAMILY_SUMMARY,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
