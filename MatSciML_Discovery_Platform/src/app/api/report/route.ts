import { NextResponse } from "next/server";

import { buildHtmlReport, buildMarkdownReport } from "@/lib/report";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "html").trim().toLowerCase();

  if (format === "md" || format === "markdown") {
    const markdown = buildMarkdownReport();
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="24041_103_summary.md"',
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "html") {
    const html = buildHtmlReport();
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="24041_103_report.html"',
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    { error: 'format must be "html" or "md"' },
    { status: 400 },
  );
}
