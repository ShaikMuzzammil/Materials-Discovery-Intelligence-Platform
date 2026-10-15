import { NextResponse } from "next/server";

import { fetchRecords } from "@/lib/db-optional";
import { EXTRACTION_STATS } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const property = url.searchParams.get("property")?.trim().toLowerCase() ?? "";
  const source = url.searchParams.get("source")?.trim().toLowerCase() ?? "";
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? "8", 10) || 8),
  );

  const all = await fetchRecords();

  const filtered = all.filter((record) => {
    // Case-insensitive comparison: the query params are lowercased above, so
    // lowercase the record fields too before matching.
    if (property && record.property.toLowerCase() !== property) return false;
    if (source && record.sourcePaper.toLowerCase() !== source) return false;
    if (q) {
      const haystack = [
        record.material,
        record.property,
        String(record.value),
        record.unit,
        record.conditions,
        record.sourcePaper,
        record.sentence,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const records = filtered.slice(start, start + pageSize);

  const facets = {
    properties: Array.from(new Set(all.map((r) => r.property))),
    sources: Array.from(new Set(all.map((r) => r.sourcePaper))),
  };

  return NextResponse.json(
    {
      records,
      total,
      page: safePage,
      pageSize,
      totalPages,
      facets,
      stats: {
        sentencesScanned: EXTRACTION_STATS.sentencesScanned,
        recordsValidated: EXTRACTION_STATS.recordsValidated,
        uniqueMaterials: EXTRACTION_STATS.uniqueMaterials,
        benchmarkMatches: EXTRACTION_STATS.benchmarkMatches,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
