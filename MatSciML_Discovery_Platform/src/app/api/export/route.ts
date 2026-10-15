import { NextResponse } from "next/server";

import {
  fetchDiscovery,
  fetchFeatureImportance,
  fetchModelResults,
  fetchPapers,
  fetchRecords,
} from "@/lib/db-optional";
import { FSCORE_COMPARISON, HOLDOUT_RESULT, PUBLISHED_REFERENCE, RUN_METADATA, SPOT_CHECKS } from "@/lib/data";
import { toCsv } from "@/lib/format";

export const dynamic = "force-dynamic";

type ExportEntity = "papers" | "records" | "discovery" | "models" | "features";
type ExportFormat = "csv" | "json";

interface ExportFile {
  filename: string;
  csv: () => string;
  json: () => string;
}

async function buildEntity(entity: ExportEntity): Promise<ExportFile> {
  switch (entity) {
    case "papers": {
      const papers = await fetchPapers();
      return {
        filename: "24041_103_papers.csv",
        csv: () =>
          toCsv(
            ["id", "short_name", "title", "year", "venue", "doi", "role"],
            papers.map((p) => [p.id, p.shortName, p.title, p.year, p.venue, p.doi, p.role]),
          ),
        json: () =>
          JSON.stringify(
            { project: "24041_103", entity: "papers", count: papers.length, papers },
            null,
            2,
          ),
      };
    }
    case "records": {
      const records = await fetchRecords();
      return {
        filename: "24041_103_structured_records.csv",
        csv: () =>
          toCsv(
            [
              "id",
              "material",
              "property",
              "value",
              "unit",
              "conditions",
              "source_paper",
              "page",
              "sentence",
              "matched_in_benchmark",
            ],
            records.map((r) => [
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
          ),
        json: () =>
          JSON.stringify(
            { project: "24041_103", entity: "records", count: records.length, records },
            null,
            2,
          ),
      };
    }
    case "discovery": {
      const candidates = await fetchDiscovery();
      return {
        filename: "24041_103_discovery_candidates.csv",
        csv: () =>
          toCsv(
            ["rank", "candidate", "structure_family", "predicted_band_gap_eV"],
            candidates.map((c) => [c.rank, c.candidate, c.structureFamily, c.predictedBandGapEv]),
          ),
        json: () =>
          JSON.stringify(
            {
              project: "24041_103",
              entity: "discovery",
              count: candidates.length,
              candidates,
            },
            null,
            2,
          ),
      };
    }
    case "models": {
      const cvResults = await fetchModelResults();
      return {
        filename: "24041_103_model_results.csv",
        csv: () =>
          toCsv(
            [
              "model",
              "mae_mean",
              "mae_std",
              "rmse_mean",
              "rmse_std",
              "r2_mean",
              "r2_std",
              "is_best",
              "holdout_mae",
              "holdout_rmse",
              "holdout_r2",
            ],
            [
              ...cvResults.map((m) => [
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
              ["Automatminer Express (published reference)", "0.416", "", "", "", "", "", "false", "", "", ""],
            ],
          ),
        json: () =>
          JSON.stringify(
            {
              project: "24041_103",
              entity: "models",
              crossValidation: cvResults,
              holdout: HOLDOUT_RESULT,
              spotChecks: SPOT_CHECKS,
              publishedReference: PUBLISHED_REFERENCE,
              fscoreComparison: FSCORE_COMPARISON,
            },
            null,
            2,
          ),
      };
    }
    case "features": {
      const importance = await fetchFeatureImportance();
      return {
        filename: "24041_103_feature_importance.csv",
        csv: () =>
          toCsv(
            ["rank", "feature", "importance_gain"],
            importance.map((f) => [f.rank, f.feature, f.importance]),
          ),
        json: () =>
          JSON.stringify(
            {
              project: "24041_103",
              entity: "features",
              run: RUN_METADATA.notebook,
              importance,
            },
            null,
            2,
          ),
      };
    }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const entity = (url.searchParams.get("entity") ?? "").trim() as ExportEntity;
  const format = (url.searchParams.get("format") ?? "csv").trim().toLowerCase() as ExportFormat;

  const validEntities: ExportEntity[] = ["papers", "records", "discovery", "models", "features"];
  if (!validEntities.includes(entity)) {
    return NextResponse.json(
      { error: `Unknown entity "${entity}". Valid: ${validEntities.join(", ")}` },
      { status: 400 },
    );
  }
  if (format !== "csv" && format !== "json") {
    return NextResponse.json({ error: 'format must be "csv" or "json"' }, { status: 400 });
  }

  const file = await buildEntity(entity);
  const extension = format === "csv" ? "csv" : "json";
  const filename = file.filename.replace(/\.csv$/, `.${extension}`);
  const body = format === "csv" ? file.csv() : file.json();
  const mimeType = format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
