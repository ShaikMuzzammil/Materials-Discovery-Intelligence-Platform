import { NextResponse } from "next/server";

import { PIPELINE_STAGES } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { stages: PIPELINE_STAGES },
    { headers: { "Cache-Control": "no-store" } },
  );
}
