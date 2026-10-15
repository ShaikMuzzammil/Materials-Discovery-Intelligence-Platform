"use client";

import { BookOpen, Database, ExternalLink, FileText, HardDriveUpload, Loader2, Plus, Search, Star, Trash2, UploadCloud } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ExportButtonGroup } from "@/components/export-buttons";
import { LiveCorpusPanel } from "@/components/live/view-live-panels";
import { LiveDataStrip } from "@/components/live/live-data-strip";
import { ViewHeader } from "@/components/view-header";
import { ViewError, ViewSkeleton } from "@/components/view-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePapers } from "@/hooks/use-api";
import { useLiveRunStore } from "@/lib/live-run-store";
import { paperDoiUrl } from "@/lib/data";
import { extractAnyFile } from "@/lib/pdf-extract";
import { listUploads, removeUpload, saveUpload, type StoredUpload } from "@/lib/uploads-idb";

/* -------------------------------------------------------------------------- */
/*  Upload library — real pdf.js extraction + IndexedDB + server persistence   */
/* -------------------------------------------------------------------------- */

interface UploadRow extends StoredUpload {
  status: "stored" | "extracting";
}

function UploadLibrary() {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addUpload = useLiveRunStore((s) => s.addUpload);

  const refresh = useCallback(async () => {
    const stored = await listUploads();
    setRows(stored.map((r) => ({ ...r, status: "stored" as const })));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleFiles = useCallback(
    async (files: FileList | File[]): Promise<void> => {
      for (const file of Array.from(files)) {
        const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
        const isText = /\.(txt|md)$/i.test(file.name) || file.type.startsWith("text/");
        if (!isPdf && !isText) {
          toast.error(`Unsupported file: ${file.name}`, { description: "Upload PDF or TXT research papers." });
          continue;
        }
        setBusy(file.name);
        try {
          const payload = await extractAnyFile(file);
          const stored = await saveUpload(payload);
          setRows((prev) => [
            { ...stored, status: "stored" as const },
            ...prev.filter((r) => r.filename !== stored.filename),
          ]);
          // also stage it for the live engine immediately
          addUpload(payload, {
            name: payload.name,
            size: file.size,
            pages: payload.pages.length,
            chars: payload.chars,
            status: "ready",
          });
          toast.success(`Stored ${file.name}`, {
            description: `${payload.pages.length} pages · ${payload.chars.toLocaleString("en-US")} chars extracted (pdf.js) · saved ${stored.serverId !== null ? "to database + browser" : "in this browser"}`,
          });
        } catch (error) {
          toast.error(`Extraction failed: ${file.name}`, {
            description: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          setBusy(null);
        }
      }
    },
    [addUpload],
  );

  const handleDelete = useCallback(
    async (row: UploadRow) => {
      await removeUpload(row.filename, row.serverId);
      setRows((prev) => prev.filter((r) => r.filename !== row.filename));
      toast.success(`Removed ${row.filename}`);
    },
    [],
  );

  const handleStageAll = useCallback(() => {
    let staged = 0;
    for (const row of rows) {
      if (row.status !== "stored" || row.pages.length === 0) continue;
      addUpload(
        { name: row.filename, pages: row.pages, chars: row.chars },
        { name: row.filename, size: row.chars, pages: row.pages.length, chars: row.chars, status: "ready" },
      );
      staged++;
    }
    if (staged > 0) {
      toast.success(`${staged} paper${staged === 1 ? "" : "s"} staged for the live engine`, {
        description: "Open Live Pipeline Lab → disable the bundled corpus to run on YOUR papers only.",
      });
    } else {
      toast.info("Library is empty", { description: "Upload a PDF first — it will be staged automatically." });
    }
  }, [rows, addUpload]);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UploadCloud className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Upload papers — real extraction, real storage
            </CardTitle>
            <CardDescription>
              Drop PDFs/TXT — text is extracted in your browser (pdf.js), stored in IndexedDB, and mirrored to the
              database when one is configured. Uploads feed the live pipeline and persist across reloads.
            </CardDescription>
          </div>
          {rows.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 whitespace-nowrap border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
              onClick={handleStageAll}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Stage all for live run
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload research papers (PDF or TXT) — drag and drop or click to browse"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragging
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-border/70 bg-secondary/30 hover:border-emerald-500/50 hover:bg-emerald-500/5"
          }`}
        >
          {busy ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">Extracting {busy}…</p>
              <p className="text-xs text-muted-foreground">pdf.js is reading every page of the document</p>
            </>
          ) : (
            <>
              <HardDriveUpload className="h-6 w-6 text-emerald-500" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">Drop research papers here or click to browse</p>
              <p className="text-xs text-muted-foreground">PDF or TXT · multi-file · extraction runs locally in your browser</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            multiple
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <AnimatePresence initial={false}>
          {rows.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-52">File</TableHead>
                      <TableHead className="w-16 text-right">Pages</TableHead>
                      <TableHead className="w-24 text-right">Chars</TableHead>
                      <TableHead className="w-36">Storage</TableHead>
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.filename} className="hover:bg-secondary/60">
                        <TableCell className="max-w-64">
                          <span className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                            <span className="truncate font-mono text-xs">{row.filename}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">{row.pages.length}</TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                          {row.chars.toLocaleString("en-US")}
                        </TableCell>
                        <TableCell>
                          {row.serverId !== null ? (
                            <Badge className="gap-1 bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">
                              <Database className="h-3 w-3" aria-hidden="true" />
                              DB + browser
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400">
                              browser (IndexedDB)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            aria-label={`Remove ${row.filename} from the library`}
                            onClick={() => void handleDelete(row)}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Verified corpus table — fixed alignment (horizontal scroll + min-width)    */
/* -------------------------------------------------------------------------- */

export function PapersView() {
  const { data, isLoading, isError, error, refetch } = usePapers();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const papers = data?.papers ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter((p) =>
      [p.title, p.shortName, String(p.year), p.venue, p.role, p.doi]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  if (isLoading) return <ViewSkeleton />;
  if (isError || !data) return <ViewError message={error?.message ?? "Unknown error"} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <LiveDataStrip kind="papers" />
      <ViewHeader
        eyebrow={`${data.total} verified sources · upload your own · live runs`}
        title="Paper Corpus"
        description="The base survey (Jiang et al. 2025) plus 19 supporting works — and now YOUR uploads. Every paper is logged with DOI, year, venue and role; uploaded PDFs are extracted and stored for real, then flow one-to-one into the live pipeline."
        actions={<ExportButtonGroup entity="papers" toastContext={`${filtered.length} shown`} />}
      />

      <UploadLibrary />

      <LiveCorpusPanel />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Verified corpus (baseline)
              </CardTitle>
              <CardDescription>
                {filtered.length} of {data.total} papers · search by title, author, year, venue or role
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search authors, titles, years…"
                className="pl-9"
                aria-label="Search papers by title, author or year"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="max-h-[560px] overflow-auto rounded-lg border border-border/60">
            <Table className="min-w-[880px]">
              <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="w-28">Author / Year</TableHead>
                  <TableHead className="min-w-[340px]">Title</TableHead>
                  <TableHead className="w-36">Venue</TableHead>
                  <TableHead className="w-32">DOI</TableHead>
                  <TableHead className="w-36">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((paper) => (
                  <motion.tr
                    key={paper.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(paper.id * 0.02, 0.3), duration: 0.25 }}
                    className={
                      paper.isBase
                        ? "bg-emerald-500/8 font-medium hover:bg-emerald-500/12"
                        : "hover:bg-secondary/60"
                    }
                  >
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {paper.id}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`text-xs font-semibold ${paper.isBase ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                        {paper.shortName}
                      </span>
                      <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{paper.year}</span>
                    </TableCell>
                    <TableCell className="text-xs leading-snug text-foreground/90">{paper.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{paper.venue}</TableCell>
                    <TableCell>
                      <a
                        href={paperDoiUrl(paper)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-teal-600 underline-offset-2 hover:text-teal-500 hover:underline dark:text-teal-400"
                        aria-label={`DOI link for ${paper.shortName} (opens in new tab)`}
                      >
                        {paper.doi.length > 22 ? `${paper.doi.slice(0, 20)}…` : paper.doi}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </TableCell>
                    <TableCell>
                      {paper.isBase ? (
                        <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                          BASE
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="max-w-32 truncate font-normal text-muted-foreground">
                          {paper.role}
                        </Badge>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No papers match &quot;{query}&quot;. Try a different author, title or year.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
