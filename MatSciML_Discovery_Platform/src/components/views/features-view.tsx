"use client";

import { Layers, SlidersHorizontal, Sparkles, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnimatedCounter } from "@/components/animated-counter";
import { ExportButtonGroup } from "@/components/export-buttons";
import { LiveDataStrip } from "@/components/live/live-data-strip";
import { LiveFeaturesPanel } from "@/components/live/view-live-panels";
import { ViewHeader } from "@/components/view-header";
import { ViewError, ViewSkeleton } from "@/components/view-states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFeatures } from "@/hooks/use-api";
import { CHART_COLORS } from "@/lib/chart-theme";

export function FeaturesView() {
  const { data, isLoading, isError, error, refetch } = useFeatures();

  if (isLoading) return <ViewSkeleton />;
  if (isError || !data) return <ViewError message={error?.message ?? "Unknown error"} onRetry={refetch} />;

  const importanceData = [...data.importance].reverse(); // horizontal bars: rank 15..1 bottom→top? reverse for top at top
  const ablationData = data.ablation.map((a) => ({
    featureSet: a.featureSet,
    mae: a.maeMean,
    error: a.maeStd,
    r2: a.r2Mean,
  }));

  const familyProgress = [
    {
      label: "Composition (Magpie-style)",
      before: data.familySummary.compositionBefore,
      selected: data.familySummary.compositionSelected,
      color: "[&>div]:bg-emerald-500",
    },
    {
      label: "MatSciBERT text (PCA 768→32)",
      before: data.familySummary.textBefore,
      selected: data.familySummary.textSelected,
      color: "[&>div]:bg-teal-500",
    },
  ];

  return (
    <div className="space-y-6">
      <LiveDataStrip kind="features" />
      <ViewHeader
        eyebrow="Stage 7 · engineering & selection"
        title="Feature Engineering"
        description="45 Magpie-style composition features + 32 MatSciBERT text features (768 → PCA-32) = 77 candidates. Variance and correlation filters select 63 (31 composition + 32 text) that feed every model."
        actions={<ExportButtonGroup entity="features" toastContext="top importances + selection" />}
      />

      <LiveFeaturesPanel />

      {/* Selection funnel + family cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} aria-label="Feature selection funnel">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Workflow className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Selection funnel
              </CardTitle>
              <CardDescription>Variance + correlation filters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Candidates (45 comp + 32 text)", value: data.familySummary.totalBefore, pct: 100 },
                { label: "After variance filter", value: 68, pct: (68 / 77) * 100 },
                { label: "Selected (31 comp + 32 text)", value: data.familySummary.totalSelected, pct: (63 / 77) * 100 },
              ].map((step) => (
                <div key={step.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-mono font-semibold tabular-nums text-foreground">
                      <AnimatedCounter value={step.value} />
                    </span>
                  </div>
                  <Progress value={step.pct} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500" aria-label={`${step.label}: ${step.value}`} />
                </div>
              ))}
              <div className="pt-1 text-xs leading-relaxed text-muted-foreground">
                14 composition features were dropped by the filters (zero variance or &gt; 0.95
                correlation with a stronger feature); all 32 PCA text components survived.
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {familyProgress.map((family, i) => (
          <motion.section
            key={family.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.08 }}
            aria-label={`${family.label} breakdown`}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4 text-teal-500" aria-hidden="true" />
                  {family.label}
                </CardTitle>
                <CardDescription>
                  {family.selected} of {family.before} selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-4xl font-bold tabular-nums text-foreground">
                  <AnimatedCounter value={family.selected} />
                  <span className="text-lg text-muted-foreground"> / {family.before}</span>
                </p>
                <Progress value={(family.selected / family.before) * 100} className={`mt-3 h-2.5 ${family.color}`} aria-label={`${family.selected} of ${family.before}`} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.selected
                    .filter((f) => (i === 0 ? f.family === "composition" : f.family === "text"))
                    .slice(0, 8)
                    .map((f) => (
                      <Badge key={f.name} variant="secondary" className="font-mono text-[10px] font-normal">
                        {f.name}
                      </Badge>
                    ))}
                  <Badge variant="outline" className="border-dashed font-mono text-[10px] font-normal text-muted-foreground">
                    +{(family.selected - 8).toLocaleString("en-US")} more
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Feature importance chart */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          aria-label="Top feature importances chart"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Top feature importance — XGBoost gain
              </CardTitle>
              <CardDescription>
                Group_max (0.1946) and Period_max (0.1321) dominate: where an element sits in the
                periodic table drives its band-gap contribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[420px] text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={importanceData} layout="vertical" margin={{ top: 4, right: 24, left: 30, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.12} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      stroke="currentColor"
                      tickFormatter={(v: number) => v.toFixed(2)}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      width={118}
                      stroke="currentColor"
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
                      formatter={(value: number | string) => [Number(value).toFixed(6), "Gain importance"]}
                    />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]} isAnimationActive>
                      {importanceData.map((row, i) => (
                        <Cell
                          key={row.feature}
                          fill={i >= importanceData.length - 2 ? CHART_COLORS.emerald : i >= importanceData.length - 6 ? CHART_COLORS.teal : CHART_COLORS.slate}
                          fillOpacity={i >= importanceData.length - 2 ? 1 : 0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Ablation chart */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          aria-label="Feature ablation comparison chart"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-amber-500" aria-hidden="true" />
                Feature ablation — XGBoost MAE (eV)
              </CardTitle>
              <CardDescription>
                Error bars = ±1 std over 5 folds · composition carries most of the signal, text adds
                paper context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ablationData} margin={{ top: 12, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                    <XAxis
                      dataKey="featureSet"
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      stroke="currentColor"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      stroke="currentColor"
                      domain={[0.3, 0.7]}
                      tickFormatter={(v: number) => v.toFixed(2)}
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
                      formatter={(value: number | string, _name, item) => {
                        const payload = item?.payload as { r2: number } | undefined;
                        return [
                          `${Number(value).toFixed(4)} eV MAE · R² ${payload?.r2?.toFixed(4) ?? "—"}`,
                          (item?.payload as { featureSet?: string })?.featureSet ?? "",
                        ];
                      }}
                    />
                    <Bar dataKey="mae" radius={[6, 6, 0, 0]} maxBarSize={80} isAnimationActive>
                      {ablationData.map((row) => (
                        <Cell
                          key={row.featureSet}
                          fill={
                            row.featureSet.includes("composition only")
                              ? CHART_COLORS.emerald
                              : row.featureSet.includes("text only")
                                ? CHART_COLORS.amber
                                : CHART_COLORS.teal
                          }
                        />
                      ))}
                      <ErrorBar dataKey="error" width={5} strokeWidth={1.5} stroke="currentColor" direction="y" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {ablationData.map((row) => (
                  <div key={row.featureSet} className="rounded-lg bg-secondary/50 p-2.5">
                    <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                      {row.mae.toFixed(4)}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                      {row.featureSet}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Selected features chips grid */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        aria-label="Selected features list"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              All {data.selected.length} selected features
              <Badge variant="secondary" className="ml-2 font-mono">
                from selected_features.csv
              </Badge>
            </CardTitle>
            <CardDescription>
              <span className="text-emerald-600 dark:text-emerald-400">Emerald = composition</span>{" "}
              · <span className="text-teal-600 dark:text-teal-400">teal = MatSciBERT text (PCA)</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64 pr-3">
              <div className="flex flex-wrap gap-2">
                {data.selected.map((feature, i) => (
                  <motion.span
                    key={feature.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.012, 0.5), duration: 0.25 }}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${
                      feature.family === "composition"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-400"
                    }`}
                  >
                    {feature.name}
                  </motion.span>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
