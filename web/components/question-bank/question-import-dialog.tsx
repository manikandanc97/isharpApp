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
import { useEffect, useState } from "react";
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

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 550);
      setDisplay(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

export function QuestionImportDialog({
  open,
  onClose,
  importFile,
  selectImportFile,
  importReport,
  setImportReport,
  setImportFile,
  importBusy,
  importError,
  setImportError,
  importProgress,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  importFile: File | null;
  selectImportFile: (file: File | null) => void;
  importReport: ImportReport | null;
  setImportReport: (report: ImportReport | null) => void;
  setImportFile: (file: File | null) => void;
  importBusy: boolean;
  importError?: string | null;
  setImportError?: (err: string | null) => void;
  importProgress: ImportProgress;
  onImport: () => Promise<void>;
}) {
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
                    {importFile && (
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
                        setImportFile(null);
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
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-in fade-in-0 zoom-in-95 duration-300"
              aria-live="polite"
            >
              <div className="relative bg-slate-950 px-5 py-5 text-white sm:px-6">
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_right,#38bdf8,transparent_45%)]" />
                <div className="relative flex items-center gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    {importProgress.phase === "uploading" ? (
                      <Upload className="size-5 animate-pulse" />
                    ) : (
                      <ShieldCheck className="size-5 animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">
                          {importProgress.phase === "uploading"
                            ? "Uploading workbook"
                            : "Validating and importing questions"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-300">
                          {importFile?.name}
                        </p>
                      </div>
                      <span className="text-lg font-bold tabular-nums">
                        {importProgress.phase === "uploading"
                          ? `${importProgress.percent}%`
                          : importProgress.totalRows > 0
                            ? `${importProgress.processedRows.toLocaleString()} / ${importProgress.totalRows.toLocaleString()}`
                            : "Processing"}
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      {importProgress.phase === "uploading" ? (
                        <div
                          className="h-full rounded-full bg-sky-400 transition-[width] duration-300 ease-out"
                          style={{ width: `${importProgress.percent}%` }}
                        />
                      ) : (
                        <div
                          className={`h-full origin-left rounded-full bg-sky-400/80 transition-[width] duration-300 ${importProgress.totalRows ? "" : "animate-pulse"}`}
                          style={{
                            width: importProgress.totalRows
                              ? `${importProgress.percent}%`
                              : "100%",
                          }}
                        />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
                      <span>
                        {importProgress.phase === "uploading"
                          ? `${formatBytes(importProgress.loadedBytes)} of ${formatBytes(importProgress.totalBytes)}`
                          : importProgress.totalRows > 0
                            ? `${importProgress.processedRows.toLocaleString()} of ${importProgress.totalRows.toLocaleString()} rows processed`
                            : "Checking duplicates, validating rows and saving records"}
                      </span>
                      <span>Do not close this window</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
                {[
                  ["1", "Upload", importProgress.phase !== "uploading"],
                  ["2", "Validate & de-duplicate", false],
                  ["3", "Save & summarize", false],
                ].map(([step, label, done], index) => {
                  const active =
                    (index === 0 && importProgress.phase === "uploading") ||
                    (index === 1 && importProgress.phase === "processing");
                  return (
                    <div key={String(label)} className="flex items-center gap-3 bg-slate-50 px-4 py-3">
                      <span
                        className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                          done
                            ? "bg-emerald-100 text-emerald-700"
                            : active
                              ? "bg-sky-100 text-sky-700 ring-4 ring-sky-50"
                              : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {done ? <CheckCircle2 className="size-4" /> : step}
                      </span>
                      <span className={`text-xs font-semibold ${active ? "text-slate-900" : "text-slate-500"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {importProgress.phase === "processing" && importProgress.totalRows > 0 && (
                <div className="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-4" aria-label="Live import counts">
                  {[
                    ["Processed", importProgress.processedRows, "text-slate-950"],
                    ["Imported", importProgress.importedRows, "text-emerald-700"],
                    ["Duplicates", importProgress.skippedRows, "text-amber-700"],
                    ["Errors", importProgress.failedRows, "text-rose-700"],
                  ].map(([label, value, tone]) => (
                    <div key={String(label)} className="bg-white px-4 py-3 text-center">
                      <p className={`text-lg font-bold tabular-nums ${tone}`}>{Number(value).toLocaleString()}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {importReport && (
            <div className="space-y-4">
              {importReport.failed > 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
                  <AlertCircle className="mt-0.5 size-4.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-950">
                      {importReport.failed} question{importReport.failed > 1 ? "s" : ""} could not be imported
                    </p>
                    <p className="mt-0.5 text-amber-800">
                      Review the failed rows below to see specific validation errors. Correct them in your spreadsheet and re-upload.
                    </p>
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

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total rows", value: importReport.total, tone: "text-slate-950", Icon: Rows3, iconTone: "bg-slate-100 text-slate-600" },
                  { label: "Uploaded", value: importReport.imported, tone: "text-emerald-700", Icon: Database, iconTone: "bg-emerald-50 text-emerald-700" },
                  { label: "Duplicates", value: importReport.skipped, tone: "text-amber-700", Icon: Copy, iconTone: "bg-amber-50 text-amber-700" },
                  { label: "Errors", value: importReport.failed, tone: "text-rose-700", Icon: AlertCircle, iconTone: "bg-rose-50 text-rose-700" },
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
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[64px_minmax(110px,0.7fr)_100px_minmax(180px,1.3fr)] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Row</span>
                    <span>External ID</span>
                    <span>Status</span>
                    <span>Details</span>
                  </div>
                  <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {importReport.results.map((result) => (
                      <div
                        key={
                          String(result.row) +
                          "-" +
                          (result.externalId ?? "row")
                        }
                        className="grid grid-cols-[64px_minmax(110px,0.7fr)_100px_minmax(180px,1.3fr)] items-center px-3 py-2.5 text-xs"
                      >
                        <span className="font-semibold text-slate-500">
                          {result.row}
                        </span>
                        <span className="truncate font-semibold text-slate-800">
                          {result.externalId || "—"}
                        </span>
                        <span
                          className={
                            "inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold uppercase " +
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
                              ? "error"
                              : "uploaded"}
                        </span>
                        <span className="text-slate-500">
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
                  setImportFile(null);
                  setImportReport(null);
                  if (setImportError) setImportError(null);
                }}
                className="h-9 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
              >
                Import another
              </button>
            )}
            <button
              type="button"
              disabled={importBusy || (!importFile && !importReport)}
              onClick={() => {
                if (importReport?.failed && importFile) {
                  void onImport();
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
              ) : (
                <Upload className="size-4" />
              )}
              {importBusy
                ? "Validating and importing…"
                : importReport?.failed
                  ? "Retry failed rows"
                  : importReport
                    ? "Done"
                    : importError
                      ? "Retry import"
                      : "Start import"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

