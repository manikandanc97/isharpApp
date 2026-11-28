"use client";

import { AlertCircle, FileSpreadsheet, ShieldCheck, Upload } from "lucide-react";

interface ImportDropzoneProps {
  importFile: File | null;
  importBusy: boolean;
  retryMode: boolean;
  hasError: boolean;
  onSelectFile: (file: File | null) => void;
}

export function ImportDropzone({
  importFile,
  importBusy,
  retryMode,
  hasError,
  onSelectFile,
}: ImportDropzoneProps) {
  return (
    <>
      {retryMode && (
        <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs leading-5 text-indigo-900">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Failed-row retry:</strong> this run should contain only the
            corrected rows from the downloaded error workbook. Previously
            completed rows will not be submitted again.
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
            <p className="mt-1 text-xs font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <label
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-7 text-center transition ${
          hasError
            ? "border-rose-300 bg-rose-50/20 hover:border-rose-400 hover:bg-rose-50/30"
            : importFile
              ? "border-emerald-300 bg-emerald-50/20 hover:border-emerald-400"
              : "border-slate-300 bg-[#fdfdfc] hover:border-indigo-300 hover:bg-indigo-50/30"
        }`}
      >
        <span
          className={`grid size-11 place-items-center rounded-xl ${
            hasError
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
            ? `${(importFile.size / 1024 / 1024).toFixed(2)} MB · click to choose a different file`
            : "Use the official template for reliable validation"}
        </span>
        <input
          className="hidden"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={importBusy}
          onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong>external_id</strong> and <strong>course_code</strong> are
          auto-generated automatically (no need to include in Excel). New
          chapter titles are created under the matching subject automatically.
          Existing questions with matching external IDs are safely skipped.
        </span>
      </div>
    </>
  );
}
