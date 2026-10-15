import { NextResponse } from "next/server";

import { fetchDiscovery } from "@/lib/db-optional";
import { DISCOVERY_FAMILIES, DISCOVERY_TOP_CANDIDATE, discoveryFamilyCounts } from "@/lib/data";

export const dynamic = "force-dynamic";

const SORTERS: Record<string, (a: { rank: number; candidate: string; predictedBandGapEv: number }, b: { rank: number; candidate: string; predictedBandGapEv: number }) => number> = {
  rank: (a, b) => a.rank - b.rank,
  rank_desc: (a, b) => b.rank - a.rank,
  gap_desc: (a, b) => b.predictedBandGapEv - a.predictedBandGapEv || a.rank - b.rank,
  gap_asc: (a, b) => a.predictedBandGapEv - b.predictedBandGapEv || a.rank - b.rank,
  formula: (a, b) => a.candidate.localeCompare(b.candidate),
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const family = url.searchParams.get("family")?.trim() ?? "";
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const sort = url.searchParams.get("sort")?.trim() ?? "rank";
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? "10", 10) || 10),
  );

  const all = await fetchDiscovery();

  const filtered = all.filter((candidate) => {
    if (family && candidate.structureFamily !== family) return false;
    if (q && !candidate.candidate.toLowerCase().includes(q)) return false;
    return true;
  });

  const sorter = SORTERS[sort] ?? SORTERS.rank;
  const sorted = [...filtered].sort(sorter);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const candidates = sorted.slice(start, start + pageSize);

  return NextResponse.json(
    {
      candidates,
      total,
      page: safePage,
      pageSize,
      totalPages,
      families: DISCOVERY_FAMILIES,
      familyCounts: discoveryFamilyCounts(),
      topCandidate: DISCOVERY_TOP_CANDIDATE,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
