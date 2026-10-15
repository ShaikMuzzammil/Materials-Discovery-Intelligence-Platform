"use client";

import { Download, FileCode2, FileDown, FileText, Loader2, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

import { downloadReport } from "@/components/export-buttons";
import { ViewHeader } from "@/components/view-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadVerifiedPdfReport } from "@/lib/live-report";
import {
  DATASET_CLEANING_REPORT,
  DATASET_STATS,
  DISCOVERY_CANDIDATES,
  EXTRACTION_CLEANING_REPORT,
  EXTRACTION_STATS,
  FEATURE_ABLATION,
  FEATURE_FAMILY_SUMMARY,
  FEATURE_IMPORTANCE,
  FSCORE_COMPARISON,
  HOLDOUT_RESULT,
  MODEL_CV_RESULTS,
  PAPERS,
  PIPELINE_STAGES,
  PROJECT,
  PUBLISHED_REFERENCE,
  RUN_METADATA,
  SPOT_CHECKS,
  STRUCTURED_RECORDS,
  paperDoiUrl,
} from "@/lib/data";
import { reportDate } from "@/lib/format";

/* Lightweight print-safe document primitives (explicit light "paper" styling
   so the document reads like a real report both on screen and in print). */

function DocTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="mb-5 w-full border-collapse text-[11px]">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="border border-slate-300 bg-slate-800 px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-white">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 1 ? "bg-slate-50" : undefined}>
            {row.map((cell, j) => (
              <td key={j} className="border border-slate-200 px-2 py-1.5 align-top text-slate-700">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 id={id} className="mb-3 border-b border-slate-300 pb-1 text-lg font-bold text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ReportView() {
  const [busy, setBusy] = useState<"html" | "md" | "pdf" | null>(null);

  const handleDownload = async (format: "html" | "md") => {
    setBusy(format);
    try {
      await downloadReport(format);
    } catch (error) {
      toast.error("Report download failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setBusy("pdf");
    try {
      await downloadVerifiedPdfReport();
      toast.success("Downloaded 24041_103_report.pdf", {
        description: "Verified-mode PDF · cover, KPIs, all result tables, page numbers",
      });
    } catch (error) {
      toast.error("PDF report failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBusy(null);
    }
  };

  const date = reportDate();

  return (
    <div className="space-y-6">
      <ViewHeader
        eyebrow="Live document · print-ready"
        title="Report Builder"
        description="A complete, styled run report generated from the verified pipeline outputs — header block, 9 stage sections and every result table. Print it, or download it as standalone HTML / Markdown."
        actions={
          <>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={() => void handlePdf()}
              disabled={busy !== null}
              aria-label="Download the verified run as a multi-page PDF report"
            >
              {busy === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="h-4 w-4" aria-hidden="true" />
              )}
              PDF report
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} aria-label="Print this report">
              <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("html")}
              disabled={busy !== null}
              aria-label="Download full HTML report"
            >
              <FileCode2 className="mr-2 h-4 w-4 text-emerald-500" aria-hidden="true" />
              HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("md")}
              disabled={busy !== null}
              aria-label="Download Markdown summary"
            >
              <FileText className="mr-2 h-4 w-4 text-teal-500" aria-hidden="true" />
              Markdown
            </Button>
          </>
        }
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Document preview</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-1.5">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Downloads: PDF (24041_103_report.pdf · jspdf) · HTML/MD from <span className="font-mono">/api/report</span> ·
              printing hides the app shell and prints only the document
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* The printable document */}
            <article
              id="report-print"
              className="print-card mx-auto max-w-4xl rounded-xl bg-white p-6 text-slate-900 shadow-2xl sm:p-10"
            >
              {/* Header block */}
              <header className="border-b-[3px] border-emerald-600 pb-5">
                <span className="inline-block rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                  Run Report · Verified
                </span>
                <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
                  {PROJECT.fullTitle}
                </h1>
                <p className="mt-1 text-sm text-slate-600">{PROJECT.subtitle}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                  {[
                    ["Project ID", "24041_103"],
                    ["Report date", date],
                    ["Notebook", `${RUN_METADATA.notebook} · ${RUN_METADATA.notebookCells} cells · ${RUN_METADATA.notebookErrors} errors`],
                    ["Environment", RUN_METADATA.environment],
                    ["Python", RUN_METADATA.python],
                    ["Best model", RUN_METADATA.bestModel],
                    ["Base paper", PROJECT.basePaperCitation],
                    ["Benchmark", `${DATASET_STATS.benchmark} · target: ${DATASET_STATS.target}`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <dt className="text-[9px] font-bold uppercase tracking-wider text-teal-700">{label}</dt>
                      <dd className="mt-0.5 leading-snug text-slate-700">{value}</dd>
                    </div>
                  ))}
                </dl>
              </header>

              {/* 1 · Executive summary */}
              <DocSection id="report-s1" title="1 · Executive Summary">
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[
                    ["20", "Papers in corpus"],
                    ["295", "Property sentences"],
                    ["4,601", "Clean samples"],
                    ["63", "Selected features"],
                    ["5", "Models compared"],
                    ["111", "Discovery candidates"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2.5 text-center">
                      <p className="text-lg font-bold text-emerald-700">{value}</p>
                      <p className="text-[9px] leading-tight text-slate-600">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[12.5px] leading-relaxed text-slate-700">
                  <strong>Headline result.</strong> XGBoost predicts experimental band gaps with MAE{" "}
                  <strong>0.4598 eV</strong>, RMSE <strong>0.7976 eV</strong> and R²{" "}
                  <strong>0.6942</strong> (5-fold CV), and holds up on an unseen 20% hold-out (MAE
                  0.4376 eV · R² 0.6972). Extraction quality <strong>beats the base paper</strong>:
                  F-score {FSCORE_COMPARISON.ours} vs {FSCORE_COMPARISON.basePaper}. The trained model
                  screens 111 unexplored oxide candidates; top suggestion{" "}
                  <strong>Li(V0.5Ta0.5)O₃ at 3.78 eV</strong>.
                </p>
              </DocSection>

              {/* 2 · Pipeline stages */}
              <DocSection id="report-s2" title="2 · Pipeline — 9 Verified Stages">
                <div className="space-y-3">
                  {PIPELINE_STAGES.map((stage) => (
                    <div key={stage.id} className="rounded-lg border border-slate-200 p-3">
                      <h3 className="text-[13px] font-bold text-teal-700">
                        Stage {String(stage.id).padStart(2, "0")} · {stage.title}
                      </h3>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{stage.description}</p>
                      <p className="mt-1.5 text-[11px] text-slate-600">
                        <strong className="text-slate-800">Inputs:</strong> {stage.inputs.join(" · ")}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        <strong className="text-slate-800">Outputs:</strong> {stage.outputs.join(" · ")}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        <strong className="text-slate-800">Tech:</strong> {stage.techStack.join(" · ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {stage.metrics.map((m) => (
                          <span key={m.label} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                            <strong>{m.value}</strong> {m.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DocSection>

              {/* 3 · Papers */}
              <DocSection id="report-s3" title="3 · Paper Corpus (20)">
                <DocTable
                  headers={["#", "Short name", "Title", "Year", "Venue", "DOI", "Role"]}
                  rows={PAPERS.map((p) => [
                    p.id,
                    <span key="n" className={p.isBase ? "font-bold text-emerald-700" : undefined}>{p.shortName}</span>,
                    p.title,
                    p.year,
                    p.venue,
                    <a key="d" href={paperDoiUrl(p)} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline underline-offset-1">
                      {p.doi}
                    </a>,
                    p.isBase ? <span key="r" className="font-bold text-emerald-700">BASE — {p.role}</span> : p.role,
                  ])}
                />
              </DocSection>

              {/* 4 · Extraction */}
              <DocSection id="report-s4" title="4 · Property Extraction">
                <p className="mb-3 text-[12px] leading-relaxed text-slate-700">
                  From {EXTRACTION_STATS.pdfPages} PDF pages and {EXTRACTION_STATS.textUnits} text
                  units, {EXTRACTION_STATS.sentencesScanned} candidate property sentences were mined
                  ({EXTRACTION_STATS.bandGapMentions} mention the band gap). Validation left{" "}
                  <strong>{EXTRACTION_STATS.recordsValidated} records</strong> covering{" "}
                  <strong>{EXTRACTION_STATS.uniqueMaterials} unique materials</strong>, of which{" "}
                  <strong>{EXTRACTION_STATS.benchmarkMatches}</strong> matched the benchmark (TiO₂
                  3.20 eV · TiO₂ 1.52 eV amorphous · SnO₂ 3.60 eV).
                </p>
                <DocTable
                  headers={["Check", "Rows affected"]}
                  rows={EXTRACTION_CLEANING_REPORT.map((c) => [c.check, c.rowsAffected])}
                />
                <div className="mb-4 rounded-lg border-l-4 border-emerald-600 bg-emerald-50 px-4 py-2.5 text-[11.5px] text-slate-700">
                  <strong>Extraction F-score:</strong> ours <strong>{FSCORE_COMPARISON.ours}</strong> vs
                  base paper <strong>{FSCORE_COMPARISON.basePaper}</strong> — better.
                </div>
                <DocTable
                  headers={["Material", "Property", "Value", "Unit", "Source", "Pg", "In benchmark"]}
                  rows={STRUCTURED_RECORDS.map((r) => [
                    <span key="m" className="font-mono font-semibold">{r.material}</span>,
                    r.property,
                    r.value,
                    r.unit,
                    r.sourcePaper.split("_").slice(0, 2).join("_"),
                    r.page,
                    r.matchedInBenchmark ? <span key="b" className="font-semibold text-emerald-700">Yes</span> : "No",
                  ])}
                />
              </DocSection>

              {/* 5 · Dataset */}
              <DocSection id="report-s5" title="5 · Main Dataset — Matbench expt_gap">
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[
                    ["4,604", "rows start"],
                    ["3", "dupes removed"],
                    ["4,601", "clean rows"],
                    ["0.976", "mean (eV)"],
                    ["1.445", "std (eV)"],
                    ["0–11.7", "range (eV)"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center">
                      <p className="text-base font-bold text-slate-800">{value}</p>
                      <p className="text-[9px] text-slate-600">{label}</p>
                    </div>
                  ))}
                </div>
                <DocTable
                  headers={["Cleaning check", "Rows affected"]}
                  rows={DATASET_CLEANING_REPORT.map((c) => [c.check, c.rowsAffected.toLocaleString("en-US")])}
                />
                <p className="rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5 text-[11.5px] leading-relaxed text-slate-700">
                  <strong>Why this benchmark?</strong> Matbench expt_gap is a standard, citable
                  benchmark of <em>experimental</em> band gaps (Dunn et al. 2020) — it grounds the NLP
                  pipeline in measurable ground truth and lets our MAE be compared directly with the
                  published Automatminer Express reference (MAE {PUBLISHED_REFERENCE.mae} eV).
                </p>
              </DocSection>

              {/* 6 · Features */}
              <DocSection id="report-s6" title="6 · Features">
                <p className="mb-3 text-[12px] leading-relaxed text-slate-700">
                  45 Magpie-style composition features + 32 MatSciBERT text features (768 → PCA-32) =
                  77 before selection; variance + correlation filters selected{" "}
                  <strong>{FEATURE_FAMILY_SUMMARY.totalSelected}</strong> (
                  {FEATURE_FAMILY_SUMMARY.compositionSelected} composition +{" "}
                  {FEATURE_FAMILY_SUMMARY.textSelected} text).
                </p>
                <DocTable
                  headers={["Rank", "Feature", "Importance"]}
                  rows={FEATURE_IMPORTANCE.map((f) => [f.rank, f.feature, f.importance.toFixed(6)])}
                />
                <h3 className="mb-2 text-[13px] font-bold text-teal-700">Feature ablation (XGBoost MAE eV)</h3>
                <DocTable
                  headers={["Feature set", "MAE mean ± std", "R²"]}
                  rows={FEATURE_ABLATION.map((a) => [
                    a.featureSet,
                    `${a.maeMean.toFixed(4)} ± ${a.maeStd.toFixed(4)}`,
                    a.r2Mean.toFixed(4),
                  ])}
                />
              </DocSection>

              {/* 7 · Models */}
              <DocSection id="report-s7" title="7 · Model Comparison — 5-fold Cross-Validation">
                <DocTable
                  headers={["Model", "MAE (eV)", "RMSE (eV)", "R²"]}
                  rows={[
                    ...MODEL_CV_RESULTS.map((m) => [
                      m.isBest ? <span key="m" className="font-bold text-emerald-700">{m.model} — BEST</span> : m.model,
                      `${m.maeMean.toFixed(4)} ± ${m.maeStd.toFixed(4)}`,
                      `${m.rmseMean.toFixed(4)} ± ${m.rmseStd.toFixed(4)}`,
                      `${m.r2Mean.toFixed(4)} ± ${m.r2Std.toFixed(4)}`,
                    ]),
                    [
                      <span key="ref" className="italic">{PUBLISHED_REFERENCE.model} (published reference)</span>,
                      PUBLISHED_REFERENCE.mae.toFixed(3),
                      "—",
                      "—",
                    ],
                  ]}
                />
                <div className="mb-4 rounded-lg border-l-4 border-emerald-600 bg-emerald-50 px-4 py-2.5 text-[11.5px] text-slate-700">
                  <strong>Hold-out test (20% unseen, XGBoost):</strong> MAE {HOLDOUT_RESULT.mae} eV ·
                  RMSE {HOLDOUT_RESULT.rmse} eV · R² {HOLDOUT_RESULT.r2} — consistent with CV, no
                  overfitting.
                </div>
                <h3 className="mb-2 text-[13px] font-bold text-teal-700">Spot-check predictions (eV)</h3>
                <DocTable
                  headers={["Material", "Predicted", "Measured", "Abs. error"]}
                  rows={SPOT_CHECKS.map((s) => [
                    <span key="m" className="font-mono font-semibold">{s.material}</span>,
                    s.predictedEv.toFixed(2),
                    s.measuredEv.toFixed(2),
                    s.absErrorEv.toFixed(2),
                  ])}
                />
              </DocSection>

              {/* 8 · Discovery */}
              <DocSection id="report-s8" title="8 · New Material Discovery — Future Implementation">
                <p className="mb-3 text-[12px] leading-relaxed text-slate-700">
                  The best model screens <strong>{DISCOVERY_CANDIDATES.length} unexplored oxide
                  candidates</strong> (mixed-cation perovskites, perovskites ABO₃, spinels AB₂O₄,
                  mixed sesquioxides, mixed dioxides — none present in the training data) and ranks
                  them by predicted band gap. Top 20 shown; the full list ships in{" "}
                  <span className="font-mono">new_material_discovery.csv</span>.
                </p>
                <DocTable
                  headers={["Rank", "Candidate", "Structure family", "Predicted gap (eV)"]}
                  rows={DISCOVERY_CANDIDATES.slice(0, 20).map((c) => [
                    c.rank <= 3 ? <span key="r" className="font-bold text-emerald-700">{c.rank}</span> : c.rank,
                    <span key="c" className="font-mono">{c.candidate}</span>,
                    c.structureFamily,
                    c.predictedBandGapEv.toFixed(2),
                  ])}
                />
              </DocSection>

              {/* 9 · Provenance */}
              <DocSection id="report-s9" title="9 · Data Provenance">
                <p className="rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5 text-[11.5px] leading-relaxed text-slate-700">
                  Every number in this report comes from the verified zero-error execution of{" "}
                  <span className="font-mono">{RUN_METADATA.notebook}</span> (18/18 cells, 16 notebook
                  sections). Outputs were exported as{" "}
                  <span className="font-mono">24041_103_all_outputs.zip</span> and ingested verbatim
                  by this platform. No values were re-simulated.
                </p>
              </DocSection>

              <footer className="mt-10 border-t border-slate-300 pt-3 text-[10px] text-slate-500">
                {PROJECT.fullTitle} · Capstone 24041_103 · Report generated {date} · Base paper:{" "}
                <a href={`https://doi.org/${PROJECT.basePaperDoi}`} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline underline-offset-1">
                  {PROJECT.basePaperCitation}
                </a>
              </footer>
            </article>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
