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
import type { ImportProgress, ImportReport } from "./types";
import { ImportDropzone } from "./import/import-dropzone";
import { ImportProgressPanel } from "./import/import-progress-panel";
import { ImportResultSummary } from "./import/import-result-summary";

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
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-blue">
            <FileSpreadsheet className="size-3.5" /> Controlled bulk import
          </div>
          <DialogTitle className="mt-1 text-base font-bold text-slate-950 sm:text-lg">
            Import questions from Excel
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Existing and repeated external IDs are skipped automatically. No
            existing question will be overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
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
                  <p className="mt-1 break-words font-medium leading-relaxed text-rose-800">
                    {importError}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {importFile && !importReport && (
                      <button
                        type="button"
                        disabled={importBusy}
                        onClick={() => void onImport()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
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
                      className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 shadow-2xs transition hover:bg-rose-50 active:scale-95"
                    >
                      Choose Different File
                    </button>
                  </div>
                </div>
                {setImportError && (
                  <button
                    type="button"
                    onClick={() => setImportError(null)}
                    className="absolute right-3 top-3 rounded-md p-1 text-rose-400 transition hover:text-rose-700"
                    title="Dismiss error"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!importReport && !importBusy && (
            <ImportDropzone
              importFile={importFile}
              importBusy={importBusy}
              retryMode={retryMode}
              hasError={Boolean(importError)}
              onSelectFile={selectImportFile}
            />
          )}

          {importBusy && (
            <ImportProgressPanel
              fileName={importFile?.name}
              importProgress={importProgress}
            />
          )}

          {importReport && (
            <ImportResultSummary
              importReport={importReport}
              fileName={importFile?.name}
              importBusy={importBusy}
              retryExportBusy={retryExportBusy}
              selectFailedRowsFile={selectFailedRowsFile}
              onDownloadFailedRows={onDownloadFailedRows}
            />
          )}
        </div>

        <DialogFooter className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/api/admin/questions/template"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
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
              disabled={
                importBusy || retryExportBusy || (!importFile && !importReport)
              }
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
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-brand-navy px-5 text-xs font-semibold text-white shadow-xs hover:bg-brand-navy/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
