import { NextResponse } from "next/server";

import { fetchPapers } from "@/lib/db-optional";

export const dynamic = "force-dynamic";

export async function GET() {
  const papers = await fetchPapers();
  return NextResponse.json(
    { papers, total: papers.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
