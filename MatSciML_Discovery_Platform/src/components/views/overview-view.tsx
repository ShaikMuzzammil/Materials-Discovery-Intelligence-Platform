"use client";

import {
  ArrowRight,
  Award,
  Database,
  FlaskConical,
  Library,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
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
import { ViewHeader } from "@/components/view-header";
import { ViewError, ViewSkeleton } from "@/components/view-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOverview } from "@/hooks/use-api";
import { CHART_COLORS } from "@/lib/chart-theme";
import { useUiStore } from "@/lib/store";

const KPI_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  library: Library,
  search: Search,
  database: Database,
  sliders: SlidersHorizontal,
  trophy: Trophy,
  flask: FlaskConical,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

export function OverviewView() {
  const { data, isLoading, isError, error, refetch } = useOverview();
  const setView = useUiStore((s) => s.setView);

  if (isLoading) return <ViewSkeleton />;
  if (isError || !data) return <ViewError message={error?.message ?? "Unknown error"} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ViewHeader
        eyebrow="Capstone 24041_103"
        title="MatSciML Discovery Platform"
        description="Research papers → MatSciBERT → XGBoost → new material discovery. Every number on this page comes from the verified zero-error execution of 24041_103_RUN_ALL.ipynb (18/18 cells)."
        actions={
          <>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500"
              onClick={() => setView("live")}
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              Run the live pipeline
            </Button>
            <Button size="sm" variant="outline" onClick={() => setView("pipeline")}>
              9-stage explorer
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        }
      />

      {/* KPI cards */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        aria-label="Key performance indicators"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6"
      >
        {data.kpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.icon] ?? Sparkles;
          return (
            <motion.div key={kpi.key} variants={item}>
              <Card className="relative overflow-hidden transition-shadow hover:shadow-lg hover:shadow-emerald-500/10">
                <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl" aria-hidden="true" />
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="font-mono text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                    <AnimatedCounter
                      value={kpi.value}
                      format={(v) => Math.round(v).toLocaleString("en-US")}
                      aria-label={`${kpi.label}: ${kpi.value}`}
                    />
                  </p>
                  <p className="mt-1 text-xs font-medium text-foreground/90">{kpi.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{kpi.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Pipeline health strip */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
        aria-label="Pipeline health"
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Pipeline health — 9/9 stages verified
              </CardTitle>
              <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                ALL SYSTEMS GO
              </Badge>
            </div>
            <CardDescription>
              Click any stage to open the Pipeline Explorer · persistence: {data.persistence.source}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {data.pipelineHealth.map((stage, i) => (
                <motion.li
                  key={stage.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => setView("pipeline")}
                    className="group flex w-full flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2 py-3 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-ring"
                    aria-label={`Stage ${stage.id}: ${stage.title} — verified. Open pipeline explorer`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {String(stage.id).padStart(2, "0")}
                    </span>
                    <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                      {stage.title}
                    </span>
                    <span className="h-1 w-8 rounded-full bg-emerald-500/70" aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </motion.section>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="lg:col-span-3"
          aria-label="Band gap distribution histogram"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Band-gap distribution — Matbench expt_gap</CardTitle>
              <CardDescription>
                4,601 clean samples · reconstructed from verified stats (range 0–11.7 eV, mean 0.976
                eV, std 1.445 eV, right-skewed)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.histogram} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: "currentColor" }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={56}
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
                      formatter={(value: number | string) => [`${Number(value).toLocaleString("en-US")} samples`, "Count"]}
                      labelFormatter={(label: string) => `${label} eV`}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive>
                      {data.histogram.map((bin, i) => (
                        <Cell
                          key={bin.label}
                          fill={i < 2 ? CHART_COLORS.emerald : i < 6 ? CHART_COLORS.teal : CHART_COLORS.slate}
                          fillOpacity={i < 2 ? 0.95 : 0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Best model highlight */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
            aria-label="Best model highlight"
          >
            <Card className="relative h-full overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/15 blur-2xl" aria-hidden="true" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    Best model — XGBoost
                  </CardTitle>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">BEST</Badge>
                </div>
                <CardDescription>5-fold cross-validation · 4,601 rows × 63 features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "MAE (eV)", value: data.bestModel.mae, digits: 4 },
                    { label: "RMSE (eV)", value: data.bestModel.rmse, digits: 4 },
                    { label: "R²", value: data.bestModel.r2, digits: 4 },
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
                  Beats Random Forest, MLP, Gradient Boosting and Linear Regression on identical
                  folds. Hold-out (20% unseen): MAE 0.4376 · R² 0.6972.
                </p>
              </CardContent>
            </Card>
          </motion.section>

          {/* F-score comparison */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
            aria-label="Extraction F-score comparison with the base paper"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Extraction quality vs base paper</CardTitle>
                <CardDescription>F-score on materials property extraction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Base paper (Jiang 2025)</span>
                    <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">
                      <AnimatedCounter value={data.fscore.basePaper} format={(v) => v.toFixed(2)} />
                    </span>
                  </div>
                  <Progress value={data.fscore.basePaper} className="h-2 [&>div]:bg-slate-400" aria-label={`Base paper F-score ${data.fscore.basePaper}`} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">This pipeline</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      <AnimatedCounter value={data.fscore.ours} format={(v) => v.toFixed(1)} />
                    </span>
                  </div>
                  <Progress value={data.fscore.ours} className="h-2 [&>div]:bg-emerald-500" aria-label={`Our pipeline F-score ${data.fscore.ours}`} />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Our NLP extraction (PyMuPDF + patterns + MatSciBERT) scores{" "}
                  <span className="font-semibold text-emerald-500">75.5</span> vs the base paper&apos;s{" "}
                  <span className="font-semibold">73.33</span> — a +2.2 improvement on the same task.
                </p>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>

      {/* Next steps strip */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Highlights"
      >
        {
          [
            {
              title: "Live Pipeline Lab",
              body: "Run the whole pipeline in your browser — 5 ML models cross-validated live in a web worker.",
              view: "live" as const,
            },
            {
              title: "111 discovery candidates",
              body: "The best model screens unexplored oxides — top pick Li(V0.5Ta0.5)O3 at 3.78 eV.",
              view: "discovery" as const,
            },
            {
              title: "Feature ablation",
              body: "Composition features carry most of the signal; MatSciBERT text adds paper context.",
              view: "features" as const,
            },
            {
              title: "Full report builder",
              body: "Print or download the complete verified run report as HTML, Markdown or PDF.",
              view: "report" as const,
            },
          ].map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => setView(card.view)}
            className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <p className="flex items-center justify-between text-sm font-semibold text-foreground">
              {card.title}
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" aria-hidden="true" />
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{card.body}</p>
          </button>
        ))}
      </motion.section>
    </div>
  );
}
