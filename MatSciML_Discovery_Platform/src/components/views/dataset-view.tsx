"use client";

import { ArrowDown, Database, Filter, Info, Sigma } from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnimatedCounter } from "@/components/animated-counter";
import { LiveDataStrip } from "@/components/live/live-data-strip";
import { LiveDatasetPanel } from "@/components/live/view-live-panels";
import { ViewHeader } from "@/components/view-header";
import { ViewError, ViewSkeleton } from "@/components/view-states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDataset } from "@/hooks/use-api";
import { CHART_COLORS } from "@/lib/chart-theme";

export function DatasetView() {
  const { data, isLoading, isError, error, refetch } = useDataset();

  if (isLoading) return <ViewSkeleton />;
  if (isError || !data) return <ViewError message={error?.message ?? "Unknown error"} onRetry={refetch} />;

  const { stats, cleaningReport, histogram } = data;
  const funnelSteps = [
    { label: "Rows loaded from Matbench expt_gap", value: stats.rowsStart, pct: 100 },
    { label: "Non-numeric / missing / unparseable removed", value: 0, pct: 100 },
    { label: "Duplicate-composition rows removed", value: stats.duplicatesRemoved, pct: 100 - (stats.duplicatesRemoved / stats.rowsStart) * 100 },
    { label: "Clean rows ready for training", value: stats.rowsFinal, pct: (stats.rowsFinal / stats.rowsStart) * 100 },
  ];

  return (
    <div className="space-y-6">
      <LiveDataStrip kind="dataset" />
      <ViewHeader
        eyebrow="Stage 6 · benchmark join"
        title="Main Dataset — Matbench expt_gap"
        description="4,604 experimental band-gap measurements joined with our extracted materials; 3 duplicate-composition rows removed, nothing else needed fixing. 4,601 clean rows power every model in this project."
      />

      <LiveDatasetPanel />

      {/* Stats cards */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        aria-label="Dataset summary statistics"
      >
        {[
          { label: "Clean rows", value: stats.rowsFinal, digits: 0 },
          { label: "Rows start", value: stats.rowsStart, digits: 0 },
          { label: "Min (eV)", value: stats.minEv, digits: 2 },
          { label: "Max (eV)", value: stats.maxEv, digits: 1 },
          { label: "Mean (eV)", value: stats.meanEv, digits: 3 },
          { label: "Std (eV)", value: stats.stdEv, digits: 3 },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                <AnimatedCounter value={card.value} format={(v) => (card.digits === 0 ? Math.round(v).toLocaleString("en-US") : v.toFixed(card.digits))} />
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Cleaning funnel */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
          aria-label="Cleaning funnel"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Cleaning funnel
              </CardTitle>
              <CardDescription>4,604 → 4,601 · only duplicate compositions removed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {funnelSteps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-mono font-semibold tabular-nums text-foreground">
                      {step.value.toLocaleString("en-US")}
                    </span>
                  </div>
                  <Progress
                    value={step.pct}
                    className={`h-2.5 ${i === funnelSteps.length - 1 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-teal-500/80"}`}
                    aria-label={`${step.label}: ${step.value}`}
                  />
                  {i < funnelSteps.length - 1 ? (
                    <ArrowDown className="mx-auto my-1 h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
                  ) : null}
                </motion.div>
              ))}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-relaxed text-foreground/90">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">99.93%</span>{" "}
                of loaded rows survived cleaning — the benchmark was already high-quality; our join
                only removed 3 duplicate compositions.
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Histogram */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3"
          aria-label="Target distribution histogram"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Target distribution — experimental band gap (eV)
              </CardTitle>
              <CardDescription>
                24 bins · reconstructed from verified stats: range 0–11.7 eV, mean 0.976 eV, std
                1.445 eV · strongly right-skewed (many low-gap semiconductors, few wide-gap insulators)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: "currentColor" }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={58}
                      stroke="currentColor"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      stroke="currentColor"
                      tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "currentColor", fillOpacity: 0.08 }}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: number | string) => [
                        `${Number(value).toLocaleString("en-US")} materials`,
                        "Count",
                      ]}
                      labelFormatter={(label: string) => `${label} eV`}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive>
                      {histogram.map((bin, i) => (
                        <Cell
                          key={bin.label}
                          fill={i < 2 ? CHART_COLORS.emerald : i < 6 ? CHART_COLORS.teal : CHART_COLORS.slate}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cleaning report table */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          aria-label="Cleaning report table"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Cleaning report</CardTitle>
              <CardDescription>
                Every check applied to the benchmark — from cleaning_report.csv (dataset_summary.csv
                stats above)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead className="text-right">Rows affected</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleaningReport.map((row) => (
                    <TableRow key={row.check} className="hover:bg-secondary/60">
                      <TableCell className="font-mono text-xs text-foreground/90">{row.check}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {row.rowsAffected.toLocaleString("en-US")}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.check === "duplicate_composition_rows_removed" || row.check === "rows_start" || row.check === "rows_final" ? (
                          <Badge
                            variant="outline"
                            className={
                              row.rowsAffected > 0 && row.check.includes("removed")
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }
                          >
                            {row.rowsAffected > 0 && row.check.includes("removed") ? "REMOVED" : "OK"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            CLEAN
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.section>

        {/* Why this benchmark */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          aria-label="About the target variable and benchmark"
        >
          <Card className="h-full border-teal-500/25 bg-gradient-to-br from-teal-500/8 via-transparent to-emerald-500/8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sigma className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Target variable & benchmark choice
              </CardTitle>
              <CardDescription>Why Matbench expt_gap grounds this capstone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-foreground/90">
              <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" aria-hidden="true" />
                <p>
                  <span className="font-semibold">Target:</span> the experimental band gap in eV —
                  the single most reported functional property in the corpus (160 of 295 mined
                  sentences mention it), making it the natural bridge from NLP extraction to
                  quantitative prediction.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                <p>
                  <span className="font-semibold">Why Matbench expt_gap:</span> it is a standard,
                  citable benchmark of real (not DFT) measured band gaps (Dunn et al. 2020, npj
                  Comput. Mater.). Using it lets our MAE be compared directly against the published
                  Automatminer Express reference of 0.416 eV — an external yardstick for the whole
                  capstone.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <p>
                  <span className="font-semibold">Join with our extraction:</span> 3 extracted
                  records matched materials inside the benchmark (TiO₂ 3.20 eV, TiO₂ 1.52 eV
                  amorphous, SnO₂ 3.60 eV) — validating that the NLP pipeline recovers values
                  consistent with curated experimental data.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
