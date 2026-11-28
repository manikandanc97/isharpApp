"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Database,
  FileDown,
  LoaderCircle,
  Rows3,
  Upload,
} from "lucide-react";
import type { ImportReport } from "../types";
import { AnimatedCount } from "./import-progress-panel";

interface ImportResultSummaryProps {
  importReport: ImportReport;
  fileName?: string;
  importBusy: boolean;
  retryExportBusy: boolean;
  selectFailedRowsFile: (file: File | null) => void;
  onDownloadFailedRows: () => Promise<void>;
}

export function ImportResultSummary({
  importReport,
  fileName,
  importBusy,
  retryExportBusy,
  selectFailedRowsFile,
  onDownloadFailedRows,
}: ImportResultSummaryProps) {
  const [resultView, setResultView] = useState<"all" | "failed">("failed");
  const activeResultView = importReport.failed ? resultView : "all";

  const visibleResults =
    activeResultView === "failed"
      ? importReport.results.filter((result) => result.status === "failed")
      : importReport.results;

  const exportCsvReport = () => {
    const headers = [
      "Row",
      "External ID",
      "Status",
      "Duplicate Category",
      "Match Type",
      "Matched ID",
      "Reason / Error",
    ];
    const rows = importReport.results.map((r) => [
      r.row,
      r.externalId || "",
      r.status,
      r.duplicateCategory || "",
      r.duplicateType || "",
      r.matchedId || "",
      `"${(r.reason || r.error || "").replace(/"/g, '""')}"`,
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute(
      "download",
      `${(fileName || "questions").replace(/\.xlsx$/i, "")}-import-report.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4">
      {importReport.failed > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold text-amber-950">
              Partial import completed — {importReport.failed} row
              {importReport.failed > 1 ? "s" : ""} need correction
            </p>
            <p className="mt-0.5 text-amber-800">
              {importReport.imported} successful row
              {importReport.imported === 1 ? " is" : "s are"} already saved.
              Download the error workbook to correct and re-upload only the
              failed rows, or finish now and leave them out.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={retryExportBusy}
                onClick={() => void onDownloadFailedRows()}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-900 px-3 text-xs font-semibold text-white hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {retryExportBusy ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <FileDown className="size-3.5" />
                )}
                Download {importReport.failed} failed row
                {importReport.failed === 1 ? "" : "s"}
              </button>
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100">
                <Upload className="size-3.5" /> Re-upload corrected rows
                <input
                  className="hidden"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={importBusy || retryExportBusy}
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    selectFailedRowsFile(selected);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      ) : importReport.skipped > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
          <Copy className="mt-0.5 size-4.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold text-amber-950">
              Import completed with duplicates skipped
            </p>
            <p className="mt-0.5 text-amber-800">
              {importReport.imported} uploaded successfully and{" "}
              {importReport.skipped} duplicate{" "}
              {importReport.skipped === 1 ? "row was" : "rows were"} safely
              skipped.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold text-emerald-950">
              Import completed successfully!
            </p>
            <p className="mt-0.5 text-emerald-800">
              All {importReport.imported} questions were verified and added to
              the Question Bank repository.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Import summary
            </p>
            <p className="mt-1 text-sm font-semibold">{fileName}</p>
          </div>
          <p className="text-xs text-slate-400">
            {importReport.total.toLocaleString()} rows processed
          </p>
        </div>
        <div
          className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-800"
          aria-label="Import result distribution"
        >
          {importReport.imported > 0 && (
            <span
              className="h-full bg-emerald-400 transition-all duration-700"
              style={{
                width: `${(importReport.imported / importReport.total) * 100}%`,
              }}
            />
          )}
          {importReport.skipped > 0 && (
            <span
              className="h-full bg-amber-400 transition-all duration-700"
              style={{
                width: `${(importReport.skipped / importReport.total) * 100}%`,
              }}
            />
          )}
          {importReport.failed > 0 && (
            <span
              className="h-full bg-rose-400 transition-all duration-700"
              style={{
                width: `${(importReport.failed / importReport.total) * 100}%`,
              }}
            />
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Total rows",
            value: importReport.total,
            tone: "text-slate-950",
            Icon: Rows3,
            iconTone: "bg-slate-100 text-slate-600",
          },
          {
            label: "Uploaded",
            value: importReport.imported,
            tone: "text-emerald-700",
            Icon: Database,
            iconTone: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "File Duplicates",
            value: importReport.withinExcelDuplicates ?? 0,
            tone: "text-amber-700",
            Icon: Copy,
            iconTone: "bg-amber-50 text-amber-700",
          },
          {
            label: "DB Duplicates",
            value:
              importReport.databaseDuplicates ??
              importReport.skipped - (importReport.withinExcelDuplicates ?? 0),
            tone: "text-orange-700",
            Icon: Database,
            iconTone: "bg-orange-50 text-orange-700",
          },
          {
            label: "Conflicts / Errors",
            value: importReport.failed,
            tone: "text-rose-700",
            Icon: AlertCircle,
            iconTone: "bg-rose-50 text-rose-700",
          },
        ].map(({ label, value, tone, Icon, iconTone }) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={"type-metric tabular-nums " + tone}>
                  <AnimatedCount value={Number(value)} />
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {label}
                </p>
              </div>
              <span
                className={`grid size-9 place-items-center rounded-lg ${iconTone}`}
              >
                <Icon className="size-4.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <p className="text-xs font-semibold text-slate-600">
            {activeResultView === "failed"
              ? `${importReport.failed} rows requiring action`
              : `${importReport.total} processed rows`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsvReport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <FileDown className="size-3.5" /> Export CSV Report
            </button>
            {importReport.failed > 0 && (
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setResultView("failed")}
                  className={`rounded-md px-2.5 py-1 ${activeResultView === "failed" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500"}`}
                >
                  Errors only
                </button>
                <button
                  type="button"
                  onClick={() => setResultView("all")}
                  className={`rounded-md px-2.5 py-1 ${activeResultView === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`}
                >
                  All rows
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-[620px]">
          <div className="grid grid-cols-[54px_minmax(110px,0.6fr)_90px_90px_minmax(180px,1.4fr)] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Row</span>
            <span>External ID</span>
            <span>Status</span>
            <span>Scope</span>
            <span>Details</span>
          </div>
          <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {visibleResults.map((result) => (
              <div
                key={`${result.row}-${result.externalId ?? "row"}`}
                className="grid grid-cols-[54px_minmax(110px,0.6fr)_90px_90px_minmax(180px,1.4fr)] items-center px-3 py-2.5 text-xs"
              >
                <span className="font-semibold text-slate-500">
                  {result.row}
                </span>
                <span className="truncate font-semibold text-slate-800">
                  {result.externalId || "—"}
                </span>
                <span
                  className={
                    "inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase " +
                    (result.status === "imported"
                      ? "bg-emerald-50 text-emerald-700"
                      : result.status === "skipped"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700")
                  }
                >
                  {result.status === "imported" && (
                    <CheckCircle2 className="size-3" />
                  )}
                  {result.status === "skipped"
                    ? "duplicate"
                    : result.status === "failed"
                      ? "conflict/err"
                      : "uploaded"}
                </span>
                <span className="text-[11px] font-medium capitalize text-slate-500">
                  {result.duplicateCategory === "within_excel"
                    ? "File"
                    : result.duplicateCategory === "database"
                      ? "Database"
                      : result.status === "imported"
                        ? "New"
                        : "—"}
                </span>
                <span
                  className="truncate text-slate-600"
                  title={result.reason || result.error || "Imported successfully"}
                >
                  {result.reason || result.error || "Imported successfully"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
