"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImportReport } from "./types";

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

          {!importReport && (
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

              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Total", importReport.total, "text-slate-950"],
                  ["Imported", importReport.imported, "text-emerald-700"],
                  ["Skipped", importReport.skipped, "text-amber-700"],
                  ["Failed", importReport.failed, "text-rose-700"],
                ].map(([label, value, tone]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <p className={"type-metric " + tone}>{value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
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
                          {result.status}
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

