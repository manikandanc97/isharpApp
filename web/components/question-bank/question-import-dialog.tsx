"use client";

import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Database,
  FileDown,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  Rows3,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImportProgress, ImportReport } from "./types";

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 1024 * 1024 ? 2 : 3)} MB`;
}

function AnimatedCount({ value, duration = 350 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prevRef.current = value;
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }
    const fromVal = prevRef.current;
    const toVal = value;
    prevRef.current = value;
    if (fromVal === toVal) return;

    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromVal + (toVal - fromVal) * eased);
      setDisplay(current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export function QuestionImportDialog({
  open,
  onClose,
  importFile,
  selectImportFile,
  importReport,
  importBusy,
  retryExportBusy,
  retryMode,
  importError,
  setImportError,
  importProgress,
  selectFailedRowsFile,
  onDownloadFailedRows,
  onCompletePartial,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  importFile: File | null;
  selectImportFile: (file: File | null) => void;
  importReport: ImportReport | null;
  importBusy: boolean;
  retryExportBusy: boolean;
  retryMode: boolean;
  importError?: string | null;
  setImportError?: (err: string | null) => void;
  importProgress: ImportProgress;
  selectFailedRowsFile: (file: File | null) => void;
  onDownloadFailedRows: () => Promise<void>;
  onCompletePartial: () => void;
  onImport: () => Promise<void>;
}) {
  const [resultView, setResultView] = useState<"all" | "failed">("failed");
  const activeResultView = importReport?.failed ? resultView : "all";

  const visibleResults =
    activeResultView === "failed"
      ? importReport?.results.filter((result) => result.status === "failed") ?? []
      : importReport?.results ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !importBusy) {
          if (setImportError) setImportError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-blue">
            <FileSpreadsheet className="size-3.5" /> Controlled bulk import
          </div>
          <DialogTitle className="mt-1 text-base sm:text-lg font-bold text-slate-950">
            Import questions from Excel
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Existing and repeated external IDs are skipped automatically. No existing question will be overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 p-6">
          {importError && (
            <div className="relative overflow-hidden rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-900 shadow-xs animate-in fade-in-50 duration-200">
              <div className="flex items-start gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-600">
                  <AlertCircle className="size-5" />
                </div>
                <div className="flex-1 pr-6">
                  <h4 className="text-sm font-bold text-rose-950">
                    Import Failed
                  </h4>
                  <p className="mt-1 font-medium leading-relaxed text-rose-800 break-words">
                    {importError}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {importFile && !importReport && (
                      <button
                        type="button"
                        disabled={importBusy}
                        onClick={() => void onImport()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
                      >
                        <RefreshCw className="size-3.5" />
                        Retry Import
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (setImportError) setImportError(null);
                        selectImportFile(null);
                      }}
                      className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 active:scale-95 transition shadow-2xs"
                    >
                      Choose Different File
                    </button>
                  </div>
                </div>
                {setImportError && (
                  <button
                    type="button"
                    onClick={() => setImportError(null)}
                    className="absolute top-3 right-3 text-rose-400 hover:text-rose-700 rounded-md p-1 transition"
                    title="Dismiss error"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!importReport && !importBusy && (
            <>
              {retryMode && (
                <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs leading-5 text-indigo-900">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <strong>Failed-row retry:</strong> this run should contain only the corrected rows from the downloaded error workbook. Previously completed rows will not be submitted again.
                  </span>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Workbook", ".xlsx · max 25 MB"],
                  ["Batch size", "Up to 500 rows"],
                  ["Images", "JPG/PNG · max 100"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <label
                className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-7 text-center transition ${
                  importError
                    ? "border-rose-300 bg-rose-50/20 hover:border-rose-400 hover:bg-rose-50/30"
                    : importFile
                      ? "border-emerald-300 bg-emerald-50/20 hover:border-emerald-400"
                      : "border-slate-300 bg-[#fdfdfc] hover:border-indigo-300 hover:bg-indigo-50/30"
                }`}
              >
                <span
                  className={`grid size-11 place-items-center rounded-xl ${
                    importError
                      ? "bg-rose-100 text-rose-700"
                      : importFile
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {importFile ? (
                    <FileSpreadsheet className="size-5" />
                  ) : (
                    <Upload className="size-5" />
                  )}
                </span>
                <span className="mt-3 text-sm font-semibold text-slate-900">
                  {importFile ? importFile.name : "Choose Excel workbook"}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {importFile
                    ? (importFile.size / 1024 / 1024).toFixed(2) +
                      " MB · click to choose a different file"
                    : "Use the official template for reliable validation"}
                </span>
                <input
                  className="hidden"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={importBusy}
                  onChange={(event) =>
                    selectImportFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong>external_id</strong> and <strong>course_code</strong> are auto-generated automatically (no need to include in Excel).
                  New chapter titles are created under the matching subject automatically.
                  Existing questions with matching external IDs are safely skipped.
                </span>
              </div>
            </>
          )}

          {importBusy && (
            <div
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md animate-in fade-in-0 zoom-in-95 duration-300"
              aria-live="polite"
            >
              <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-5 py-5 text-white sm:px-6">
                <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_top_right,#38bdf8,transparent_50%)] pointer-events-none" />
                <div className="relative flex items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 shadow-inner">
                    {importProgress.phase === "uploading" ? (
                      <Upload className="size-5 animate-pulse text-sky-400" />
                    ) : (
                      <LoaderCircle className="size-5 animate-spin text-sky-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <p className="text-sm font-bold tracking-tight text-white">
                            {importProgress.phase === "uploading"
                              ? "Uploading workbook"
                              : "Validating & importing questions"}
                          </p>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-400 font-mono">
                          {importFile?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black tabular-nums tracking-tight text-white">
                          {importProgress.phase === "uploading" ? (
                            <>
                              <AnimatedCount value={importProgress.percent} />%
                            </>
                          ) : importProgress.totalRows > 0 ? (
                            <>
                              <AnimatedCount value={importProgress.processedRows} />
                              <span className="text-xs font-medium text-slate-400 ml-1">
                                / {importProgress.totalRows.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-sky-400 flex items-center gap-1.5 justify-end">
                              <LoaderCircle className="size-3.5 animate-spin" /> Initializing
                            </span>
                          )}
                        </div>
                        {importProgress.phase === "processing" && importProgress.totalRows > 0 && (
                          <p className="text-[11px] font-semibold text-sky-400 tabular-nums">
                            <AnimatedCount value={importProgress.percent} />% completed
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Gradient Progress Bar */}
                    <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-slate-800/90 p-0.5 ring-1 ring-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 transition-[width] duration-300 ease-out shadow-sm shadow-sky-500/50"
                        style={{
                          width: `${Math.max(2, importProgress.percent)}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <span className="inline-block size-1.5 rounded-full bg-sky-400 animate-pulse" />
                        {importProgress.stageMessage ||
                          (importProgress.phase === "uploading"
                            ? `${formatBytes(importProgress.loadedBytes)} of ${formatBytes(importProgress.totalBytes)}`
                            : "Checking duplicates, validating rows and saving records...")}
                      </span>
                      <span className="text-[11px] text-slate-400">Live stream ingestion · Do not close</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Step Wizard Bar */}
              <div className="grid gap-px bg-slate-200 sm:grid-cols-3 border-b border-slate-200">
                {[
                  {
                    step: "1",
                    label: "Upload",
                    done: importProgress.phase !== "uploading",
                    active: importProgress.phase === "uploading",
                  },
                  {
                    step: "2",
                    label: "Validate & de-duplicate",
                    done:
                      importProgress.stage === "persisting" ||
                      importProgress.stage === "complete",
                    active:
                      importProgress.phase === "processing" &&
                      (importProgress.stage === "parsing" ||
                        importProgress.stage === "deduplicating" ||
                        importProgress.stage === "images"),
                  },
                  {
                    step: "3",
                    label: "Save & summarize",
                    done: importProgress.stage === "complete",
                    active: importProgress.stage === "persisting",
                  },
                ].map(({ step, label, done, active }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      active ? "bg-sky-50/80" : "bg-slate-50/60"
                    }`}
                  >
                    <span
                      className={`grid size-7 place-items-center rounded-full text-xs font-bold transition-all ${
                        done
                          ? "bg-emerald-500 text-white shadow-xs"
                          : active
                            ? "bg-sky-600 text-white ring-4 ring-sky-100 shadow-xs"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {done ? <CheckCircle2 className="size-4" /> : step}
                    </span>
                    <span
                      className={`text-xs font-semibold block truncate ${
                        active
                          ? "text-sky-950 font-bold"
                          : done
                            ? "text-slate-800"
                            : "text-slate-500"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Live 4 Metrics Grid */}
              <div
                className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4"
                aria-label="Live import counts"
              >
                <div className="bg-white px-4 py-3.5 text-center transition-all">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Processed
                    </p>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-slate-950 tracking-tight">
                    <AnimatedCount value={importProgress.processedRows} />
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {importProgress.totalRows > 0
                      ? `of ${importProgress.totalRows.toLocaleString()} rows`
                      : "Total rows"}
                  </p>
                </div>

                <div className="bg-white px-4 py-3.5 text-center transition-all">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                      Imported
                    </p>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-emerald-600 tracking-tight">
                    <AnimatedCount value={importProgress.importedRows} />
                  </p>
                  <p className="text-[10px] text-emerald-600/80 mt-0.5">
                    New questions
                  </p>
                </div>

                <div className="bg-white px-4 py-3.5 text-center transition-all">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                      Duplicates
                    </p>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-amber-600 tracking-tight">
                    <AnimatedCount value={importProgress.skippedRows} />
                  </p>
                  <p className="text-[10px] text-amber-600/80 mt-0.5">
                    Safely skipped
                  </p>
                </div>

                <div className="bg-white px-4 py-3.5 text-center transition-all">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="size-2 rounded-full bg-rose-500" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                      Errors
                    </p>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-rose-600 tracking-tight">
                    <AnimatedCount value={importProgress.failedRows} />
                  </p>
                  <p className="text-[10px] text-rose-600/80 mt-0.5">
                    Failed rows
                  </p>
                </div>
              </div>
            </div>
          )}

          {importReport && (
            <div className="space-y-4">
              {importReport.failed > 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
                  <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-950">
                      Partial import completed — {importReport.failed} row{importReport.failed > 1 ? "s" : ""} need correction
                    </p>
                    <p className="mt-0.5 text-amber-800">
                      {importReport.imported} successful row{importReport.imported === 1 ? " is" : "s are"} already saved. Download the error workbook to correct and re-upload only the failed rows, or finish now and leave them out.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={retryExportBusy}
                        onClick={() => void onDownloadFailedRows()}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-900 px-3 text-xs font-semibold text-white hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {retryExportBusy ? <LoaderCircle className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
                        Download {importReport.failed} failed row{importReport.failed === 1 ? "" : "s"}
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
                      {importReport.imported} uploaded successfully and {importReport.skipped} duplicate {importReport.skipped === 1 ? "row was" : "rows were"} safely skipped.
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
                      All {importReport.imported} questions were verified and added to the Question Bank repository.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Import summary</p>
                    <p className="mt-1 text-sm font-semibold">{importFile?.name}</p>
                  </div>
                  <p className="text-xs text-slate-400">{importReport.total.toLocaleString()} rows processed</p>
                </div>
                <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-800" aria-label="Import result distribution">
                  {importReport.imported > 0 && (
                    <span className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${(importReport.imported / importReport.total) * 100}%` }} />
                  )}
                  {importReport.skipped > 0 && (
                    <span className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${(importReport.skipped / importReport.total) * 100}%` }} />
                  )}
                  {importReport.failed > 0 && (
                    <span className="h-full bg-rose-400 transition-all duration-700" style={{ width: `${(importReport.failed / importReport.total) * 100}%` }} />
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: "Total rows", value: importReport.total, tone: "text-slate-950", Icon: Rows3, iconTone: "bg-slate-100 text-slate-600" },
                  { label: "Uploaded", value: importReport.imported, tone: "text-emerald-700", Icon: Database, iconTone: "bg-emerald-50 text-emerald-700" },
                  { label: "File Duplicates", value: importReport.withinExcelDuplicates ?? 0, tone: "text-amber-700", Icon: Copy, iconTone: "bg-amber-50 text-amber-700" },
                  { label: "DB Duplicates", value: importReport.databaseDuplicates ?? (importReport.skipped - (importReport.withinExcelDuplicates ?? 0)), tone: "text-orange-700", Icon: Database, iconTone: "bg-orange-50 text-orange-700" },
                  { label: "Conflicts / Errors", value: importReport.failed, tone: "text-rose-700", Icon: AlertCircle, iconTone: "bg-rose-50 text-rose-700" },
                ].map(({ label, value, tone, Icon, iconTone }) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={"type-metric tabular-nums " + tone}><AnimatedCount value={Number(value)} /></p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
                      </div>
                      <span className={`grid size-9 place-items-center rounded-lg ${iconTone}`}>
                        <Icon className="size-4.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                {importReport && (
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-3 py-2 gap-2">
                    <p className="text-xs font-semibold text-slate-600">
                      {activeResultView === "failed" ? `${importReport.failed} rows requiring action` : `${importReport.total} processed rows`}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const headers = ["Row", "External ID", "Status", "Duplicate Category", "Match Type", "Matched ID", "Reason / Error"];
                          const rows = importReport.results.map((r) => [
                            r.row,
                            r.externalId || "",
                            r.status,
                            r.duplicateCategory || "",
                            r.duplicateType || "",
                            r.matchedId || "",
                            `"${(r.reason || r.error || "").replace(/"/g, '""')}"`,
                          ]);
                          const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
                          const encoded = encodeURI(csv);
                          const link = document.createElement("a");
                          link.setAttribute("href", encoded);
                          link.setAttribute("download", `${(importFile?.name || "questions").replace(/\.xlsx$/i, "")}-import-report.csv`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
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
                )}
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
                        key={
                          String(result.row) +
                          "-" +
                          (result.externalId ?? "row")
                        }
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
                        <span className="text-slate-500 text-[11px] font-medium capitalize">
                          {result.duplicateCategory === "within_excel"
                            ? "File"
                            : result.duplicateCategory === "database"
                              ? "Database"
                              : result.status === "imported"
                                ? "New"
                                : "—"}
                        </span>
                        <span className="text-slate-600 truncate" title={result.reason || result.error || "Imported successfully"}>
                          {result.reason ||
                            result.error ||
                            "Imported successfully"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/api/admin/questions/template"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs"
          >
            <FileDown className="size-4" /> Download template
          </Link>
          <div className="flex gap-2">
            {importReport && (
              <button
                type="button"
                onClick={() => {
                  selectImportFile(null);
                }}
                className="h-9 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
              >
                Import another
              </button>
            )}
            <button
              type="button"
              disabled={importBusy || retryExportBusy || (!importFile && !importReport)}
              onClick={() => {
                if (importReport?.failed) {
                  onCompletePartial();
                  return;
                }
                if (importReport) {
                  onClose();
                  return;
                }
                void onImport();
              }}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-brand-navy px-5 text-xs font-semibold text-white hover:bg-brand-navy/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shadow-xs"
            >
              {importBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : importError ? (
                <RefreshCw className="size-4" />
              ) : importReport ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Upload className="size-4" />
              )}
              {importBusy
                ? "Validating and importing…"
                : importReport?.failed
                  ? "Keep completed & finish"
                  : importReport
                    ? "Done"
                    : importError
                      ? "Retry import"
                      : retryMode
                        ? "Import corrected rows"
                        : "Start import"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

