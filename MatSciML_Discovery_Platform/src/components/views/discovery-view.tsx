"use client";

import { Crown, FlaskConical, Medal, Search, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

import { AnimatedCounter } from "@/components/animated-counter";
import { ExportButtonGroup } from "@/components/export-buttons";
import { LiveDataStrip } from "@/components/live/live-data-strip";
import { LiveDiscoveryPanel } from "@/components/live/view-live-panels";
import { ViewHeader } from "@/components/view-header";
import { ViewError, ViewSkeleton } from "@/components/view-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useDiscovery } from "@/hooks/use-api";
import { FAMILY_COLORS } from "@/lib/chart-theme";

const PAGE_SIZE = 10;

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-400 text-amber-950",
  2: "bg-slate-300 text-slate-800",
  3: "bg-orange-400 text-orange-950",
};

function FamilyBadge({ family }: { family: string }) {
  const color = FAMILY_COLORS[family] ?? "#64748b";
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
      style={{
        borderColor: `${color}66`,
        backgroundColor: `${color}1a`,
        color,
      }}
    >
      {family}
    </span>
  );
}

export function DiscoveryView() {
  const [family, setFamily] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState("rank");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  // Reset pagination whenever filters/sort change (render-time state
  // adjustment — React-docs pattern instead of setState-in-effect).
  const filterKey = `${family}|${debouncedQuery}|${sort}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError, error, refetch, isFetching } = useDiscovery({
    family: family === "all" ? undefined : family,
    q: debouncedQuery || undefined,
    sort,
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

  const scatterData = useMemo(() => {
    return (data?.candidates ?? []).map((c) => ({
      rank: c.rank,
      gap: c.predictedBandGapEv,
      candidate: c.candidate,
      family: c.structureFamily,
    }));
  }, [data]);

  if (isLoading) return <ViewSkeleton />;
  if (isError || !data) return <ViewError message={error?.message ?? "Unknown error"} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <LiveDataStrip kind="discovery" />
      <ViewHeader
        eyebrow="Stage 9 · future implementation"
        title="New Material Discovery"
        description="Like the base paper's future direction: the best XGBoost model screens 111 unexplored oxide candidates — mixed-cation perovskites, spinels, sesquioxides and dioxides, none in the training data — and ranks them by predicted band gap."
        actions={<ExportButtonGroup entity="discovery" toastContext="all 111 candidates" />}
      />

      <LiveDiscoveryPanel />

      {/* Top candidate banner */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        aria-label="Top discovery candidate"
      >
        <Card className="relative overflow-hidden border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/25">
              <Crown className="h-8 w-8 text-amber-950" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">RANK #1 OF 111</Badge>
                <FamilyBadge family={data.topCandidate.family} />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-foreground sm:text-3xl">
                {data.topCandidate.formula}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{data.topCandidate.note}</p>
            </div>
            <div className="shrink-0 rounded-xl border border-emerald-500/30 bg-background/60 p-4 text-center">
              <p className="font-mono text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                <AnimatedCounter value={data.topCandidate.predictedBandGapEv} format={(v) => v.toFixed(2)} />
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                predicted band gap (eV)
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Scatter + family counts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
          aria-label="Rank versus predicted band gap scatter chart"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Predicted band gap vs rank — current page
              </CardTitle>
              <CardDescription>Colored by structure family · size = predicted gap</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.12} />
                    <XAxis
                      type="number"
                      dataKey="rank"
                      name="Rank"
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      stroke="currentColor"
                      domain={[0, 112]}
                    />
                    <YAxis
                      type="number"
                      dataKey="gap"
                      name="Predicted gap"
                      unit=" eV"
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      stroke="currentColor"
                    />
                    <ZAxis type="number" dataKey="gap" range={[40, 220]} />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: number | string, name) => [
                        name === "Predicted gap" ? `${Number(value).toFixed(2)} eV` : value,
                        name,
                      ]}
                      labelFormatter={() => ""}
                    />
                    <Scatter data={scatterData} isAnimationActive>
                      {scatterData.map((row) => (
                        <Cell key={`${row.candidate}-${row.rank}`} fill={FAMILY_COLORS[row.family] ?? "#64748b"} fillOpacity={0.85} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          aria-label="Family breakdown"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Families screened
              </CardTitle>
              <CardDescription>111 candidates across 5 oxide families</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.familyCounts.map((fc) => (
                <div key={fc.family} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: FAMILY_COLORS[fc.family] ?? "#64748b" }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground/90">{fc.family}</span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{fc.count}</span>
                </div>
              ))}
              <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                Every candidate is absent from the 4,601-row Matbench training set — these are
                genuinely unexplored compositions for the model.
              </p>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Candidates table */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} aria-label="Discovery candidates table">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  Ranked candidates
                  <Badge variant="secondary" className="font-mono">
                    {data.total} total
                  </Badge>
                </CardTitle>
                <CardDescription>Top-10 rows highlighted with medals · {isFetching ? "refreshing…" : "sorted server-side"}</CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search formula…"
                    className="w-full pl-9 md:w-44"
                    aria-label="Search candidates by formula"
                  />
                </div>
                <Select value={family} onValueChange={setFamily}>
                  <SelectTrigger className="md:w-48" aria-label="Filter by structure family">
                    <SelectValue placeholder="Family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All families</SelectItem>
                    {data.families.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="md:w-44" aria-label="Sort candidates">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">Rank (best gap first)</SelectItem>
                    <SelectItem value="rank_desc">Rank (worst first)</SelectItem>
                    <SelectItem value="gap_desc">Gap (high → low)</SelectItem>
                    <SelectItem value="gap_asc">Gap (low → high)</SelectItem>
                    <SelectItem value="formula">Formula (A→Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">Rank</TableHead>
                    <TableHead className="min-w-40">Candidate formula</TableHead>
                    <TableHead className="min-w-36">Structure family</TableHead>
                    <TableHead className="text-right">Predicted band gap (eV)</TableHead>
                    <TableHead className="min-w-24">Gap bar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.candidates.map((c, i) => {
                    const isTop10 = c.rank <= 10;
                    const medal = RANK_STYLES[c.rank];
                    return (
                      <motion.tr
                        key={`${c.rank}-${c.candidate}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.25 }}
                        className={isTop10 ? "bg-emerald-500/8 hover:bg-emerald-500/12" : "hover:bg-secondary/60"}
                      >
                        <TableCell className="text-center">
                          {medal ? (
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${medal}`}>
                              <Medal className="h-3.5 w-3.5" aria-hidden="true" />
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground">{c.rank}</span>
                          )}
                        </TableCell>
                        <TableCell className={`font-mono text-xs ${isTop10 ? "font-bold text-emerald-700 dark:text-emerald-400" : "font-medium text-foreground"}`}>
                          {c.candidate}
                        </TableCell>
                        <TableCell>
                          <FamilyBadge family={c.structureFamily} />
                        </TableCell>
                        <TableCell className={`text-right font-mono text-xs tabular-nums ${isTop10 ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}`}>
                          {c.predictedBandGapEv.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`Gap bar: ${c.predictedBandGapEv} eV`}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(2, Math.min(100, (c.predictedBandGapEv / 3.78) * 100))}%`,
                                backgroundColor: FAMILY_COLORS[c.structureFamily] ?? "#64748b",
                              }}
                            />
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                  {data.candidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        No candidates match &quot;{query}&quot;{family !== "all" ? ` in ${family}` : ""}.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Page {data.page} of {data.totalPages} · {data.total} candidates
              </p>
              <div className="flex items-center gap-1" role="navigation" aria-label="Discovery pagination">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page">
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
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page">
                  »
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
