import { NextRequest, NextResponse } from "next/server";

/**
 * UPLOADED PAPERS — real upload persistence.
 *
 * POST   /api/uploads        { filename, title, pages: string[], chars }
 * GET    /api/uploads        → { papers, storage: "prisma" | "unavailable" }
 * DELETE /api/uploads?id=123 → remove one stored upload
 *
 * Persistence strategy:
 *   · With a database (local SQLite / Neon / Vercel Postgres) uploads are
 *     stored in the UploadedPaper table and survive reloads + devices.
 *   · Without one (fresh Vercel deploy, zero config) the client keeps its
 *     IndexedDB copy and this route answers { storage: "unavailable" } so
 *     the UI can honestly report "saved in this browser".
 */

export const dynamic = "force-dynamic";

interface UploadBody {
  filename?: unknown;
  title?: unknown;
  pages?: unknown;
  chars?: unknown;
}

const MAX_PAGES = 400;
const MAX_CHARS = 4_000_000;

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("filename");
  try {
    const { db } = await import("@/lib/db");
    if (filename) {
      const row = await db.uploadedPaper.findUnique({ where: { filename } });
      if (!row) {
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      }
      return NextResponse.json(
        {
          paper: {
            id: row.id,
            filename: row.filename,
            title: row.title,
            pagesJson: row.pagesJson,
            pages: row.pages,
            chars: row.chars,
            createdAt: row.createdAt.toISOString(),
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const rows = await db.uploadedPaper.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      {
        papers: rows.map((r) => ({
          id: r.id,
          filename: r.filename,
          title: r.title,
          pages: r.pages,
          chars: r.chars,
          createdAt: r.createdAt.toISOString(),
        })),
        storage: "prisma",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { papers: [], storage: "unavailable" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: UploadBody;
  try {
    body = (await req.json()) as UploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const title = typeof body.title === "string" ? body.title.slice(0, 300) : "";
  const chars = typeof body.chars === "number" ? Math.max(0, Math.floor(body.chars)) : 0;
  const pages = Array.isArray(body.pages)
    ? body.pages.filter((p): p is string => typeof p === "string").slice(0, MAX_PAGES)
    : [];

  if (!filename) {
    return NextResponse.json({ error: "filename is required." }, { status: 400 });
  }
  if (pages.length === 0) {
    return NextResponse.json({ error: "pages[] must contain at least one page of text." }, { status: 400 });
  }
  if (chars > MAX_CHARS) {
    return NextResponse.json({ error: "Paper exceeds the 4M character limit." }, { status: 413 });
  }

  try {
    const { db } = await import("@/lib/db");
    const row = await db.uploadedPaper.upsert({
      where: { filename },
      update: { title, pagesJson: pages, pages: pages.length, chars },
      create: { filename, title, pagesJson: pages, pages: pages.length, chars },
    });
    return NextResponse.json(
      { stored: "prisma", id: row.id, filename: row.filename },
      { status: 201 },
    );
  } catch {
    // No database (e.g. Vercel without DATABASE_URL): the client-side
    // IndexedDB copy is the source of truth — acknowledge, stay honest.
    return NextResponse.json({ stored: "browser-only", id: null, filename }, { status: 202 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Valid ?id= is required." }, { status: 400 });
  }
  try {
    const { db } = await import("@/lib/db");
    await db.uploadedPaper.delete({ where: { id } });
    return NextResponse.json({ deleted: id });
  } catch {
    return NextResponse.json({ error: "Delete requires a configured database." }, { status: 503 });
  }
}
