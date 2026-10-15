import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const count = await db.runArtifact.count();
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
