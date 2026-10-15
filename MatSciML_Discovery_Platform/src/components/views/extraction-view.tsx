"use client";

import { CheckCircle2, FileSearch, Layers, Quote, ScanSearch, Search, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { AnimatedCounter } from "@/components/animated-counter";
import { ExportButtonGroup } from "@/components/export-buttons";
import { LiveDataStrip } from "@/components/live/live-data-strip";
import { LiveExtractionPanel } from "@/components/live/view-live-panels";
import { ViewHeader } from "@/components/view-header";
import { ViewError, ViewSkeleton } from "@/components/view-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRecords } from "@/hooks/use-api";
import type { StructuredRecord } from "@/lib/types";

const PAGE_SIZE = 8;

function truncate(text: string, max = 110): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function sourceShort(source: string): string {
  return source.replace(/\.txt$/, "").split("_").slice(0, 2).join(" ");
}

export function ExtractionView() {
  const [property, setProperty] = useState("all");
  const [source, setSource] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activeRecord, setActiveRecord] = useState<StructuredRecord | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  // Reset pagination whenever filters change (render-time state adjustment —
  // the pattern recommended by React docs instead of setState-in-effect).
  const filterKey = `${property}|${source}|${debouncedQuery}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError, error, refetch, isFetching } = useRecords({
    property: property === "all" ? undefined : property,
    source: source === "all" ? undefined : source,
    q: debouncedQuery || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data?.totalPages ?? 1;
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }, [page, totalPages]);

  const stats = data?.stats;

  if (isLoading) return <ViewSkeleton />;
  if (isError || !data) return <ViewError message={error?.message ?? "Unknown error"} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <LiveDataStrip kind="extraction" />
      <ViewHeader
        eyebrow="Stage 3-5 · property mining"
        title="Structured Extraction"
        description="295 candidate property sentences were mined from the corpus (160 mention band gap). Validation leaves 13 records over 15 unique materials — 3 of which match the benchmark. Click any sentence to see the full source evidence."
        actions={
          <ExportButtonGroup
            entity="records"
            toastContext={property !== "all" || source !== "all" || debouncedQuery ? "full dataset" : "all records"}
          />
        }
      />

      <LiveExtractionPanel />

      {/* Funnel stats */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-label="Extraction funnel statistics"
      >
        {[
          { icon: ScanSearch, label: "Sentences scanned", value: stats?.sentencesScanned ?? 295, sub: "160 mention band gap", color: "text-teal-500" },
          { icon: CheckCircle2, label: "Validated records", value: stats?.recordsValidated ?? 13, sub: "unit + range checks", color: "text-emerald-500" },
          { icon: Layers, label: "Unique materials", value: stats?.uniqueMaterials ?? 15, sub: "Ga, Ti, Sn, Cd families…", color: "text-amber-500" },
          { icon: Target, label: "Benchmark matches", value: stats?.benchmarkMatches ?? 3, sub: "TiO2 ×2 · SnO2", color: "text-orange-500" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="transition-shadow hover:shadow-lg hover:shadow-emerald-500/5">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.color}`} aria-hidden="true" />
                  <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                </div>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  <AnimatedCounter value={card.value} />
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.section>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Structured records
            <Badge variant="secondary" className="font-mono">
              {data.total} total
            </Badge>
          </CardTitle>
          <CardDescription>
            Material | property | value | unit | conditions | source + page — straight from
            structured_dataset_tabular.csv
          </CardDescription>
          <div className="mt-2 flex flex-col gap-2 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search material, value, sentence…"
                className="pl-9"
                aria-label="Search structured records"
              />
            </div>
            <Select value={property} onValueChange={setProperty}>
              <SelectTrigger className="md:w-44" aria-label="Filter by property">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All properties</SelectItem>
                {data.facets.properties.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="md:w-52" aria-label="Filter by source paper">
                <SelectValue placeholder="Source paper" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {data.facets.sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {sourceShort(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-20">Material</TableHead>
                  <TableHead className="min-w-24">Property</TableHead>
                  <TableHead className="min-w-16 text-right">Value</TableHead>
                  <TableHead className="min-w-14">Unit</TableHead>
                  <TableHead className="min-w-20">Source</TableHead>
                  <TableHead className="w-10 text-center">Pg</TableHead>
                  <TableHead className="min-w-72">Evidence sentence</TableHead>
                  <TableHead className="min-w-20 text-center">Benchmark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.records.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}
                    className="hover:bg-secondary/60"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {record.material}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          record.property === "band_gap"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        }
                      >
                        {record.property}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-foreground">
                      {record.value}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{record.unit}</TableCell>
                    <TableCell className="max-w-40 truncate text-xs text-muted-foreground" title={record.sourcePaper}>
                      {sourceShort(record.sourcePaper)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {record.page}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setActiveRecord(record)}
                            className="text-left text-xs leading-snug text-foreground/80 underline decoration-dotted underline-offset-2 hover:text-emerald-500 focus-visible:outline-2 focus-visible:outline-ring"
                            aria-label={`Show full evidence sentence for ${record.material}`}
                          >
                            {truncate(record.sentence)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm text-xs">
                          Click to open the full sentence
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-center">
                      {record.matchedInBenchmark ? (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">MATCH</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
                {data.records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No records match the current filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Page {data.page} of {data.totalPages} · {data.total} record
              {data.total === 1 ? "" : "s"}
              {isFetching ? " · refreshing…" : ""}
            </p>
            <div className="flex items-center gap-1" role="navigation" aria-label="Records pagination">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                «
              </Button>
              {pageNumbers.map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 text-xs ${p === page ? "bg-emerald-600 hover:bg-emerald-500" : ""}`}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                »
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full-sentence dialog */}
      <Dialog open={activeRecord !== null} onOpenChange={(open) => !open && setActiveRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 font-mono">
              {activeRecord?.material}
              <Badge variant="outline" className="font-normal">
                {activeRecord?.property} = {activeRecord?.value} {activeRecord?.unit}
              </Badge>
              {activeRecord?.matchedInBenchmark ? (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">BENCHMARK MATCH</Badge>
              ) : null}
            </DialogTitle>
            <DialogDescription className="text-left">
              Source: {activeRecord?.sourcePaper} · page {activeRecord?.page}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <Quote className="mb-2 h-4 w-4 text-emerald-500" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground/90">{activeRecord?.sentence}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
