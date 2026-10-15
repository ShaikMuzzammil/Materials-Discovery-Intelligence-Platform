"use client";

import { Award, BookOpen, FlaskConical, Layers, Lock, Radar, ShieldCheck, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar as RadarRecharts,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnimatedCounter } from "@/components/animated-counter";
import { ExportButtonGroup } from "@/components/export-buttons";
import { LiveDataStrip } from "@/components/live/live-data-strip";
import { LiveModelsPanel } from "@/components/live/view-live-panels";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModels } from "@/hooks/use-api";
import { CHART_COLORS, MODEL_COLORS } from "@/lib/chart-theme";

export function ModelsView() {
  const { data, isLoading, isError, error, refetch } = useModels();

  if (isLoading) return <ViewSkeleton />;
  if (isError || !data) return <ViewError message={error?.message ?? "Unknown error"} onRetry={refetch} />;

  const { cvResults, holdout, ablation, spotChecks, publishedReference, fscore } = data;

  // Radar data: normalise each axis across the 5 models so that "higher is
  // always better": MAE and RMSE inverted, R² direct.
  const maes = cvResults.map((m) => m.maeMean);
  const rmses = cvResults.map((m) => m.rmseMean);
  const r2s = cvResults.map((m) => m.r2Mean);
  const norm = (v: number, min: number, max: number) => (max === min ? 1 : (v - min) / (max - min));
  const invNorm = (v: number, min: number, max: number) => 1 - norm(v, min, max);
  const radarData = cvResults.map((m) => ({
    model: m.model,
    "MAE (inverted)": Number(
      invNorm(m.maeMean, Math.min(...maes), Math.max(...maes)).toFixed(3),
    ),
    "RMSE (inverted)": Number(
      invNorm(m.rmseMean, Math.min(...rmses), Math.max(...rmses)).toFixed(3),
    ),
    "R²": Number(norm(m.r2Mean, Math.min(...r2s), Math.max(...r2s)).toFixed(3)),
  }));

  const maeData = cvResults.map((m) => ({ model: m.model, mae: m.maeMean, error: m.maeStd }));
  const r2Data = cvResults.map((m) => ({ model: m.model, r2: m.r2Mean }));
  const parityData = spotChecks.map((s) => ({
    material: s.material,
    predicted: s.predictedEv,
    measured: s.measuredEv,
  }));
  const ablationData = ablation.map((a) => ({
    featureSet: a.featureSet,
    mae: a.maeMean,
    error: a.maeStd,
    r2: a.r2Mean,
  }));

  return (
    <div className="space-y-6">
      <LiveDataStrip kind="models" />
      <ViewHeader
        eyebrow="Stage 8 · 5-fold cross-validation"
        title="Model Leaderboard"
        description="Five models on identical folds (KFold 5, shuffle, seed 42) over 4,601 rows × 63 features. XGBoost wins with MAE 0.4598 eV — and holds up on a 20% hold-out the CV never saw."
        actions={<ExportButtonGroup entity="models" toastContext="CV + holdout + spot checks" />}
      />

      <LiveModelsPanel />

      {/* Leaderboard table */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} aria-label="Cross-validation leaderboard">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              5-fold cross-validation leaderboard
            </CardTitle>
            <CardDescription>
              MAE / RMSE in eV (lower is better) · R² (higher is better) · mean ± std over 5 folds
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">Rank</TableHead>
                    <TableHead className="min-w-36">Model</TableHead>
                    <TableHead className="min-w-36 text-right">MAE (eV)</TableHead>
                    <TableHead className="min-w-32 text-right">RMSE (eV)</TableHead>
                    <TableHead className="min-w-32 text-right">R²</TableHead>
                    <TableHead className="min-w-28">Score profile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cvResults.map((m, i) => (
                    <motion.tr
                      key={m.model}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className={
                        m.isBest
                          ? "bg-emerald-500/10 font-semibold hover:bg-emerald-500/15"
                          : "hover:bg-secondary/60"
                      }
                    >
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={m.isBest ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium"}>
                            {m.model}
                          </span>
                          {m.isBest ? <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">BEST</Badge> : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {m.maeMean.toFixed(4)} <span className="text-muted-foreground">± {m.maeStd.toFixed(4)}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {m.rmseMean.toFixed(4)} <span className="text-muted-foreground">± {m.rmseStd.toFixed(4)}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {m.r2Mean.toFixed(4)} <span className="text-muted-foreground">± {m.r2Std.toFixed(4)}</span>
                      </TableCell>
                      <TableCell>
                        <Progress
                          value={(1 - (m.maeMean - 0.4) / 0.45) * 100}
                          className={`h-2 ${m.isBest ? "[&>div]:bg-emerald-500" : "[&>div]:bg-teal-500/70"}`}
                          aria-label={`${m.model} relative score`}
                        />
                      </TableCell>
                    </motion.tr>
                  ))}
                  <TableRow className="border-dashed hover:bg-secondary/40">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">ref</TableCell>
                    <TableCell className="italic text-muted-foreground">{publishedReference.model}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums italic text-muted-foreground">
                      {publishedReference.mae.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 border-amber-500/40 bg-amber-500/10 text-[10px] font-normal text-amber-700 dark:text-amber-400">
                        <BookOpen className="h-3 w-3" aria-hidden="true" />
                        published reference
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Charts: MAE bars, R² bars, radar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} aria-label="MAE comparison chart">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">MAE per model (eV)</CardTitle>
              <CardDescription>Error bars = ±1 std over 5 folds · lower is better</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maeData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                    <XAxis dataKey="model" tick={{ fontSize: 10, fill: "currentColor" }} stroke="currentColor" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "currentColor" }} stroke="currentColor" domain={[0.3, 0.9]} tickFormatter={(v: number) => v.toFixed(2)} />
                    <RechartsTooltip
                      cursor={{ fill: "currentColor", fillOpacity: 0.08 }}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: number | string, _name, item) => [
                        `${Number(value).toFixed(4)} ± ${(item?.payload as { error?: number })?.error?.toFixed(4)} eV`,
                        "MAE",
                      ]}
                    />
                    <Bar dataKey="mae" radius={[6, 6, 0, 0]} maxBarSize={72} isAnimationActive>
                      {maeData.map((row) => (
                        <Cell key={row.model} fill={MODEL_COLORS[row.model] ?? CHART_COLORS.slate} />
                      ))}
                      <ErrorBar dataKey="error" width={5} strokeWidth={1.5} stroke="currentColor" direction="y" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} aria-label="R squared comparison chart">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">R² per model</CardTitle>
              <CardDescription>Variance explained · higher is better</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={r2Data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                    <XAxis dataKey="model" tick={{ fontSize: 10, fill: "currentColor" }} stroke="currentColor" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "currentColor" }} stroke="currentColor" domain={[0, 0.8]} tickFormatter={(v: number) => v.toFixed(2)} />
                    <RechartsTooltip
                      cursor={{ fill: "currentColor", fillOpacity: 0.08 }}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: number | string) => [Number(value).toFixed(4), "R²"]}
                    />
                    <Bar dataKey="r2" radius={[6, 6, 0, 0]} maxBarSize={72} isAnimationActive>
                      {r2Data.map((row) => (
                        <Cell key={row.model} fill={MODEL_COLORS[row.model] ?? CHART_COLORS.slate} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Radar */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} aria-label="Model radar comparison">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Radar className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Model radar (normalised)
              </CardTitle>
              <CardDescription>MAE & RMSE inverted, R² direct — bigger is better on every axis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="model" tick={{ fontSize: 9, fill: "currentColor" }} />
                    <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 8, fill: "currentColor" }} axisLine={false} />
                    <RadarRecharts name="MAE (inverted)" dataKey="MAE (inverted)" stroke={CHART_COLORS.emerald} fill={CHART_COLORS.emerald} fillOpacity={0.25} strokeWidth={2} />
                    <RadarRecharts name="RMSE (inverted)" dataKey="RMSE (inverted)" stroke={CHART_COLORS.teal} fill={CHART_COLORS.teal} fillOpacity={0.15} strokeWidth={2} />
                    <RadarRecharts name="R²" dataKey="R²" stroke={CHART_COLORS.amber} fill={CHART_COLORS.amber} fillOpacity={0.15} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Hold-out card */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} aria-label="Hold-out test result">
          <Card className="h-full border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Hold-out test — {holdout.model}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" aria-hidden="true" />
                {holdout.testSize}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "MAE (eV)", value: holdout.mae, digits: 4 },
                  { label: "RMSE (eV)", value: holdout.rmse, digits: 4 },
                  { label: "R²", value: holdout.r2, digits: 4 },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-lg bg-secondary/60 p-3 text-center">
                    <p className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      <AnimatedCounter value={metric.value} format={(v) => v.toFixed(metric.digits)} />
                    </p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Metrics are consistent with (slightly better than) cross-validation — no overfitting
                and no optimistic fold leakage. The published Automatminer Express reference for the
                same benchmark is MAE {publishedReference.mae} eV.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* F-score + reference note */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-4" aria-label="Extraction F-score and published reference">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-amber-500" aria-hidden="true" />
                Extraction F-score
              </CardTitle>
              <CardDescription>Our NLP pipeline vs the base paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Base paper</span>
                  <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">{fscore.basePaper.toFixed(2)}</span>
                </div>
                <Progress value={fscore.basePaper} className="h-2 [&>div]:bg-slate-400" aria-label={`Base paper F-score ${fscore.basePaper}`} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">This pipeline</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fscore.ours.toFixed(1)}</span>
                </div>
                <Progress value={fscore.ours} className="h-2 [&>div]:bg-emerald-500" aria-label={`Our F-score ${fscore.ours}`} />
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{fscore.note}</p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-teal-500" aria-hidden="true" />
                Published reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">{publishedReference.mae} eV</span>{" "}
                MAE — {publishedReference.model} on the same Matbench expt_gap benchmark
                ({publishedReference.source}). Our XGBoost (0.4598 eV) is competitive for a
                63-feature, CPU-only capstone pipeline.
              </p>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Feature ablation panel */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        aria-label="Feature ablation panel"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Feature ablation — XGBoost MAE (eV)
            </CardTitle>
            <CardDescription>
              Composition only · MatSciBERT text only · composition + text (fused) · error bars = ±1 std
              over 5 folds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className="h-64 text-muted-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ablationData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                      <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                      <XAxis dataKey="featureSet" tick={{ fontSize: 10, fill: "currentColor" }} stroke="currentColor" interval={0} />
                      <YAxis tick={{ fontSize: 10, fill: "currentColor" }} stroke="currentColor" domain={[0.3, 0.7]} tickFormatter={(v: number) => v.toFixed(2)} />
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
                            "Ablation",
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
              </div>
              <div className="flex flex-col justify-center gap-3 lg:col-span-2">
                {ablationData.map((row) => (
                  <div key={row.featureSet} className="rounded-lg border border-border bg-secondary/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">{row.featureSet}</p>
                      <p className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {row.mae.toFixed(4)} eV
                      </p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      MAE ± {row.error.toFixed(4)} std · R² {row.r2.toFixed(4)}
                    </p>
                  </div>
                ))}
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Composition features alone reach the best MAE (0.4303 eV); adding the 32 MatSciBERT
                  text features trades a small amount of accuracy for paper-context awareness —
                  evidence that chemistry, not prose, drives band gaps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Spot checks */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} aria-label="Spot-check predictions">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Spot-check predictions — known materials
            </CardTitle>
            <CardDescription>
              Predicted vs measured band gaps (eV) for five well-known semiconductors · mean abs.
              error 0.174 eV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="table">
              <TabsList className="mb-4">
                <TabsTrigger value="table">Parity table</TabsTrigger>
                <TabsTrigger value="chart">Predicted vs measured</TabsTrigger>
              </TabsList>
              <TabsContent value="table">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Predicted (eV)</TableHead>
                        <TableHead className="text-right">Measured (eV)</TableHead>
                        <TableHead className="text-right">Abs. error (eV)</TableHead>
                        <TableHead className="min-w-32">Accuracy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spotChecks.map((s) => (
                        <TableRow key={s.material} className="hover:bg-secondary/60">
                          <TableCell className="font-mono text-xs font-semibold">{s.material}</TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                            {s.predictedEv.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">{s.measuredEv.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">{s.absErrorEv.toFixed(2)}</TableCell>
                          <TableCell>
                            <Progress
                              value={(1 - s.absErrorEv / 0.5) * 100}
                              className="h-2 [&>div]:bg-teal-500"
                              aria-label={`${s.material} accuracy`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="chart">
                <div className="h-80 text-muted-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={parityData} margin={{ top: 12, right: 24, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                      <XAxis dataKey="material" tick={{ fontSize: 11, fill: "currentColor" }} stroke="currentColor" />
                      <YAxis
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        stroke="currentColor"
                        domain={[0, 4]}
                        tickFormatter={(v: number) => v.toFixed(1)}
                        label={{ value: "eV", position: "insideTopLeft", offset: -4, fontSize: 10, fill: "currentColor" }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          fontSize: 12,
                          color: "var(--popover-foreground)",
                        }}
                        formatter={(value: number | string, name) => [`${Number(value).toFixed(2)} eV`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="measured"
                        name="Measured (eV)"
                        stroke={CHART_COLORS.slate}
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={{ r: 4, fill: CHART_COLORS.slate, strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                        isAnimationActive
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        name="Predicted (eV)"
                        stroke={CHART_COLORS.emerald}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: CHART_COLORS.emerald, strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                        isAnimationActive
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
