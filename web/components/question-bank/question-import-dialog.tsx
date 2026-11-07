"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
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
  onImport: () => Promise<void>;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bulk import questions"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !importBusy) onClose();
      }}
      className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="mx-auto my-2 max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl sm:my-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#fbfbfa] px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <FileSpreadsheet className="size-3.5" /> Controlled bulk import
            </div>
            <h3 className="mt-1.5 type-section-title text-slate-950">
              Import questions from Excel
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Existing and repeated external IDs are skipped automatically. No
              existing question will be overwritten.
            </p>
          </div>
          <button
            type="button"
            disabled={importBusy}
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close bulk import"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
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
              <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#fdfdfc] px-6 py-7 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30">
                <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                  <Upload className="size-5" />
                </span>
                <span className="mt-3 text-sm font-semibold text-slate-900">
                  {importFile ? importFile.name : "Choose Excel workbook"}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {importFile
                    ? (importFile.size / 1024 / 1024).toFixed(2) +
                      " MB · ready to validate"
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
                  Duplicate matching is case-insensitive using{" "}
                  <strong>external_id</strong>. The first new row is imported;
                  later repetitions and existing database records are skipped.
                  New chapter titles are created under the matching course and
                  subject automatically.
                </span>
              </div>
            </>
          )}

          {importReport && (
            <div className="space-y-4">
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

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link
            href="/api/admin/questions/template"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs"
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
                }}
                className="h-10 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-navy px-5 text-xs font-semibold text-white hover:bg-brand-navy/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shadow-xs"
            >
              {importBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {importBusy
                ? "Validating and importing…"
                : importReport?.failed
                  ? "Retry failed rows"
                  : importReport
                    ? "Done"
                    : "Start import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

