"use client";

import { ArrowDownToLine, BookOpen, Brain, FileCode2, FileSpreadsheet, FileText, FlaskConical, Loader2, ScanSearch, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { downloadReport, type ExportEntity } from "@/components/export-buttons";
import { ViewHeader } from "@/components/view-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DISCOVERY_CANDIDATES,
  FEATURE_IMPORTANCE,
  MODEL_CV_RESULTS,
  PAPERS,
  SPOT_CHECKS,
  STRUCTURED_RECORDS,
} from "@/lib/data";
import { byteLength, formatBytes, toCsv } from "@/lib/format";
import { downloadPdfReport, downloadVerifiedPdfReport, liveSummaryToReportData } from "@/lib/live-report";
import { useLiveRunStore } from "@/lib/live-run-store";

interface EntityCard {
  entity: ExportEntity;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: number;
  csvBytes: number;
  jsonBytes: number;
  csvHeaders: string[];
}

/** Client-side size estimates from the SAME data the API exports. */
function buildEntityCards(): EntityCard[] {
  const papersCsv = toCsv(
    ["id", "short_name", "title", "year", "venue", "doi", "role"],
    PAPERS.map((p) => [p.id, p.shortName, p.title, p.year, p.venue, p.doi, p.role]),
  );
  const papersJson = JSON.stringify(
    { project: "24041_103", entity: "papers", count: PAPERS.length, papers: PAPERS },
    null,
    2,
  );

  const recordsCsv = toCsv(
    ["id", "material", "property", "value", "unit", "conditions", "source_paper", "page", "sentence", "matched_in_benchmark"],
    STRUCTURED_RECORDS.map((r) => [
      r.id,
      r.material,
      r.property,
      r.value,
      r.unit,
      r.conditions,
      r.sourcePaper,
      r.page,
      r.sentence,
      r.matchedInBenchmark,
    ]),
  );
  const recordsJson = JSON.stringify(
    { project: "24041_103", entity: "records", count: STRUCTURED_RECORDS.length, records: STRUCTURED_RECORDS },
    null,
    2,
  );

  const discoveryCsv = toCsv(
    ["rank", "candidate", "structure_family", "predicted_band_gap_eV"],
    DISCOVERY_CANDIDATES.map((c) => [c.rank, c.candidate, c.structureFamily, c.predictedBandGapEv]),
  );
  const discoveryJson = JSON.stringify(
    { project: "24041_103", entity: "discovery", count: DISCOVERY_CANDIDATES.length, candidates: DISCOVERY_CANDIDATES },
    null,
    2,
  );

  const modelsCsv = toCsv(
    ["model", "mae_mean", "mae_std", "rmse_mean", "rmse_std", "r2_mean", "r2_std", "is_best", "holdout_mae", "holdout_rmse", "holdout_r2"],
    [
      ...MODEL_CV_RESULTS.map((m) => [
        m.model,
        m.maeMean.toFixed(4),
        m.maeStd.toFixed(4),
        m.rmseMean.toFixed(4),
        m.rmseStd.toFixed(4),
        m.r2Mean.toFixed(4),
        m.r2Std.toFixed(4),
        m.isBest ? "true" : "false",
        "",
        "",
        "",
      ]),
      ["XGBoost (hold-out)", "", "", "", "", "", "", "true", "0.4376", "0.7736", "0.6972"],
    ],
  );
  const modelsJson = JSON.stringify(
    {
      project: "24041_103",
      entity: "models",
      cvResults: MODEL_CV_RESULTS,
      spotChecks: SPOT_CHECKS,
    },
    null,
    2,
  );

  const featuresCsv = toCsv(
    ["rank", "feature", "importance_gain"],
    FEATURE_IMPORTANCE.map((f) => [f.rank, f.feature, f.importance]),
  );
  const featuresJson = JSON.stringify(
    { project: "24041_103", entity: "features", count: FEATURE_IMPORTANCE.length, importance: FEATURE_IMPORTANCE },
    null,
    2,
  );

  return [
    {
      entity: "papers",
      title: "Papers",
      description: "The 20-paper corpus with DOIs, venues, years and pipeline roles.",
      icon: BookOpen,
      rows: PAPERS.length,
      csvBytes: byteLength(papersCsv),
      jsonBytes: byteLength(papersJson),
      csvHeaders: ["id", "short_name", "title", "year", "venue", "doi", "role"],
    },
    {
      entity: "records",
      title: "Structured Records",
      description: "Material | property | value | unit | conditions | source + page + full evidence sentences.",
      icon: ScanSearch,
      rows: STRUCTURED_RECORDS.length,
      csvBytes: byteLength(recordsCsv),
      jsonBytes: byteLength(recordsJson),
      csvHeaders: ["id", "material", "property", "value", "unit", "conditions", "source_paper", "page", "sentence", "matched_in_benchmark"],
    },
    {
      entity: "discovery",
      title: "Discovery Candidates",
      description: "All 111 unexplored oxide candidates ranked by predicted band gap.",
      icon: FlaskConical,
      rows: DISCOVERY_CANDIDATES.length,
      csvBytes: byteLength(discoveryCsv),
      jsonBytes: byteLength(discoveryJson),
      csvHeaders: ["rank", "candidate", "structure_family", "predicted_band_gap_eV"],
    },
    {
      entity: "models",
      title: "Model Results",
      description: "5-fold CV leaderboard (5 models) plus hold-out and spot-check predictions.",
      icon: Trophy,
      rows: MODEL_CV_RESULTS.length + 1,
      csvBytes: byteLength(modelsCsv),
      jsonBytes: byteLength(modelsJson),
      csvHeaders: ["model", "mae_mean", "mae_std", "rmse_mean", "rmse_std", "r2_mean", "r2_std", "is_best", "holdout_mae", "holdout_rmse", "holdout_r2"],
    },
    {
      entity: "features",
      title: "Feature Importance",
      description: "Top XGBoost gain importances (Group_max 0.1946, Period_max 0.1321, …).",
      icon: Brain,
      rows: FEATURE_IMPORTANCE.length,
      csvBytes: byteLength(featuresCsv),
      jsonBytes: byteLength(featuresJson),
      csvHeaders: ["rank", "feature", "importance_gain"],
    },
  ];
}

function ExportButtons({
  entity,
  rows,
  csvBytes,
  jsonBytes,
}: {
  entity: ExportEntity;
  rows: number;
  csvBytes: number;
  jsonBytes: number;
}) {
  const [busy, setBusy] = useState<"csv" | "json" | null>(null);

  const download = useCallback(
    async (format: "csv" | "json") => {
      setBusy(format);
      try {
        const res = await fetch(`/api/export?entity=${entity}&format=${format}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition") ?? "";
        const match = /filename="?([^";]+)"?/i.exec(disposition);
        const filename = match?.[1] ?? `24041_103_${entity}.${format}`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast.success(`Exported ${filename}`, {
          description: `${rows} rows · ${format.toUpperCase()} · ${formatBytes(format === "csv" ? csvBytes : jsonBytes)}`,
        });
      } catch (error) {
        toast.error("Export failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setBusy(null);
      }
    },
    [entity, rows, csvBytes, jsonBytes],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => download("csv")} disabled={busy !== null} aria-label={`Download ${entity} CSV with ${rows} rows`}>
        <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-500" aria-hidden="true" />
        CSV · {formatBytes(csvBytes)}
      </Button>
      <Button variant="outline" size="sm" onClick={() => download("json")} disabled={busy !== null} aria-label={`Download ${entity} JSON`}>
        <FileText className="mr-2 h-4 w-4 text-teal-500" aria-hidden="true" />
        JSON · {formatBytes(jsonBytes)}
      </Button>
    </div>
  );
}

export function ExportView() {
  const entityCards = buildEntityCards();
  const [reportBusy, setReportBusy] = useState<"html" | "md" | null>(null);
  const [pdfBusy, setPdfBusy] = useState<"verified" | "live" | null>(null);
  const liveSummary = useLiveRunStore((s) => s.summary);

  const handleReport = async (format: "html" | "md") => {
    setReportBusy(format);
    try {
      await downloadReport(format);
    } catch (error) {
      toast.error("Report download failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setReportBusy(null);
    }
  };

  const handleVerifiedPdf = async () => {
    setPdfBusy("verified");
    try {
      await downloadVerifiedPdfReport();
      toast.success("Downloaded 24041_103_report.pdf", {
        description: "Verified-mode PDF · cover, repeating page headers, all result tables, page numbers",
      });
    } catch (error) {
      toast.error("PDF export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setPdfBusy(null);
    }
  };

  const handleLivePdf = async () => {
    if (!liveSummary) return;
    setPdfBusy("live");
    try {
      const state = useLiveRunStore.getState();
      await downloadPdfReport(
        liveSummaryToReportData(liveSummary, state.records, {
          papers: state.papers.map((p) => ({ name: p.name, pages: p.pages, chars: p.chars, source: p.source })),
          sentencesSample: state.sentences.slice(0, 15).map((s) => ({
            paper: s.paper,
            page: s.page,
            sentence: s.sentence,
            properties: s.properties.join("; "),
            gap: s.gapValue !== null ? s.gapValue.toFixed(2) : "—",
          })),
        }),
      );
      toast.success("Downloaded 24041_103_report.pdf", {
        description: `Live-run PDF · ${liveSummary.runId} · per-fold CV calculation included`,
      });
    } catch (error) {
      toast.error("PDF export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setPdfBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        eyebrow="Everything downloadable"
        title="Export Center"
        description="Every dataset in the platform, one click away. CSV files always ship with a proper header row as the first line; JSON files include metadata. All downloads are generated server-side by /api/export and /api/report."
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.07 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {entityCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.entity}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="flex h-full flex-col transition-shadow hover:shadow-lg hover:shadow-emerald-500/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                      {card.rows}
                      <span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">rows</span>
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-base">{card.title}</CardTitle>
                  <CardDescription className="leading-snug">{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="rounded-lg bg-secondary/50 p-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">CSV header row</p>
                    <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-muted-foreground">
                      {card.csvHeaders.join(",")}
                    </p>
                  </div>
                  <ExportButtons
                    entity={card.entity}
                    rows={card.rows}
                    csvBytes={card.csvBytes}
                    jsonBytes={card.jsonBytes}
                  />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Full HTML report card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="flex h-full flex-col border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <FileCode2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  9<span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">sections</span>
                </span>
              </div>
              <CardTitle className="mt-2 text-base">Full HTML Report</CardTitle>
              <CardDescription className="leading-snug">
                Standalone styled document (inline CSS): header block with title, project ID
                24041_103, date and run metadata, plus every stage and result table. Opens in any
                browser, prints perfectly.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500"
                onClick={() => handleReport("html")}
                disabled={reportBusy !== null}
                aria-label="Download the full HTML report"
              >
                <ArrowDownToLine className="mr-2 h-4 w-4" aria-hidden="true" />
                Download 24041_103_report.html
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* PDF report card (verified) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <Card className="flex h-full flex-col border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-teal-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <FileCode2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  PDF<span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">report</span>
                </span>
              </div>
              <CardTitle className="mt-2 text-base">PDF Report — Verified Run</CardTitle>
              <CardDescription className="leading-snug">
                Multi-page A4 PDF with a dark cover, repeating header band on every page
                (project · run id · date), footer with page numbers, and ten detailed sections
                including the full model comparison and discovery table.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500"
                onClick={() => void handleVerifiedPdf()}
                disabled={pdfBusy !== null}
                aria-label="Download the verified-run PDF report"
              >
                {pdfBusy === "verified" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowDownToLine className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Download 24041_103_report.pdf
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* PDF report card (live run) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
          <Card
            className={`flex h-full flex-col ${
              liveSummary
                ? "border-teal-500/40 bg-gradient-to-br from-teal-500/15 to-emerald-500/10"
                : "border-dashed"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${liveSummary ? "bg-teal-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  <FlaskConical className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  {liveSummary ? `${liveSummary.totalSeconds.toFixed(0)}s` : "—"}
                  <span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">run</span>
                </span>
              </div>
              <CardTitle className="mt-2 text-base">PDF Report — Live Run</CardTitle>
              <CardDescription className="leading-snug">
                {liveSummary ? (
                  <>Generated from your completed browser run <span className="font-mono text-xs">{liveSummary.runId}</span> — adds the
                  paper corpus, extraction evidence and the per-fold CV calculation tables to the PDF.</>
                ) : (
                  <>Run the Live Pipeline Lab first — once a run completes, this card unlocks its full PDF report with fold-by-fold CV detail.</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full bg-teal-600 hover:bg-teal-500"
                onClick={() => void handleLivePdf()}
                disabled={pdfBusy !== null || liveSummary === null}
                aria-label={liveSummary ? "Download the live-run PDF report" : "Run the live pipeline to unlock this export"}
              >
                {pdfBusy === "live" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowDownToLine className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {liveSummary ? "Download live-run PDF" : "Locked — run the pipeline first"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Markdown summary card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
          <Card className="flex h-full flex-col border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-emerald-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  MD<span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground">format</span>
                </span>
              </div>
              <CardTitle className="mt-2 text-base">Markdown Summary</CardTitle>
              <CardDescription className="leading-snug">
                The entire run summarised in clean Markdown — KPI tables, CV leaderboard, ablation,
                spot checks and the top-20 discovery list. Perfect for READMEs and notebooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full bg-teal-600 hover:bg-teal-500"
                onClick={() => handleReport("md")}
                disabled={reportBusy !== null}
                aria-label="Download the Markdown summary"
              >
                <ArrowDownToLine className="mr-2 h-4 w-4" aria-hidden="true" />
                Download 24041_103_summary.md
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How exports work</CardTitle>
          <CardDescription>Guaranteed to work locally and on Vercel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">1.</span> The browser fetches{" "}
            <span className="font-mono text-xs">/api/export?entity=…&amp;format=csv|json</span> (or{" "}
            <span className="font-mono text-xs">/api/report?format=html|md</span>) with a relative
            path — safe behind any gateway or CDN.
          </p>
          <p>
            <span className="font-semibold text-foreground">2.</span> The route builds the file from
            the verified data constants, attaches a{" "}
            <span className="font-mono text-xs">Content-Disposition: attachment</span> header with a
            friendly filename, and streams it back.
          </p>
          <p>
            <span className="font-semibold text-foreground">3.</span> The client turns the response
            into a Blob, saves it via <span className="font-mono text-xs">URL.createObjectURL</span>{" "}
            and fires a success toast with the exact byte size.
          </p>
          <Separator />
          <p className="text-xs">
            CSV files always begin with the full header row shown on each card above — open them
            directly in Excel, Sheets or pandas with zero post-processing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
