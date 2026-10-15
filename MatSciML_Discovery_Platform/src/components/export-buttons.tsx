"use client";

import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadBlob, downloadFromApi, formatBytes } from "@/lib/format";

export type ExportEntity = "papers" | "records" | "discovery" | "models" | "features";
export type ExportFormat = "csv" | "json";

interface ExportButtonGroupProps {
  entity: ExportEntity;
  /** Extra context appended to the toast, e.g. current filters */
  toastContext?: string;
  size?: "default" | "sm";
}

/**
 * CSV + JSON download buttons that hit /api/export, save the blob with
 * createObjectURL and toast success/failure. Works everywhere the app is
 * deployed (relative path only).
 */
export function ExportButtonGroup({ entity, toastContext, size = "sm" }: ExportButtonGroupProps) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const download = useCallback(
    async (format: ExportFormat) => {
      setBusy(format);
      try {
        const { filename, bytes } = await downloadFromApi(
          `/api/export?entity=${entity}&format=${format}`,
          `Could not export ${entity}`,
        );
        toast.success(`Exported ${filename}`, {
          description: `${entity} · ${format.toUpperCase()} · ${formatBytes(bytes)}${toastContext ? ` · ${toastContext}` : ""}`,
        });
      } catch (error) {
        toast.error("Export failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setBusy(null);
      }
    },
    [entity, toastContext],
  );

  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Export ${entity} data`}>
      <Button
        variant="outline"
        size={size}
        onClick={() => download("csv")}
        disabled={busy !== null}
        aria-label={`Download ${entity} as CSV`}
      >
        {busy === "csv" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-500" aria-hidden="true" />
        )}
        CSV
      </Button>
      <Button
        variant="outline"
        size={size}
        onClick={() => download("json")}
        disabled={busy !== null}
        aria-label={`Download ${entity} as JSON`}
      >
        {busy === "json" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileJson className="mr-2 h-4 w-4 text-teal-500" aria-hidden="true" />
        )}
        JSON
      </Button>
    </div>
  );
}

/** Download the full standalone report (HTML or Markdown) from /api/report. */
export async function downloadReport(format: "html" | "md"): Promise<void> {
  const { filename, bytes } = await downloadFromApi(
    `/api/report?format=${format}`,
    "Could not download report",
  );
  toast.success(`Downloaded ${filename}`, {
    description: `Full run report · ${format === "html" ? "styled HTML" : "Markdown"} · ${formatBytes(bytes)}`,
  });
}

/** Client-side Blob download helper re-export for ad-hoc exports. */
export { downloadBlob };
