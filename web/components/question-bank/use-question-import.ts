"use client";

import { useState } from "react";
import type { ImportProgress, ImportReport } from "./types";

const initialProgress: ImportProgress = {
  phase: "idle",
  percent: 0,
  loadedBytes: 0,
  totalBytes: 0,
  totalRows: 0,
  processedRows: 0,
  importedRows: 0,
  skippedRows: 0,
  failedRows: 0,
};

type ImportProgressEvent = {
  type: "progress";
  stage?: "uploading" | "parsing" | "deduplicating" | "images" | "persisting" | "complete";
  message?: string;
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  failed: number;
};

type ImportCompleteEvent = { type: "complete"; report: ImportReport };
type ImportErrorEvent = { type: "error"; message: string };
type ImportStreamEvent =
  | ImportProgressEvent
  | ImportCompleteEvent
  | ImportErrorEvent;

export interface UseQuestionImportOptions {
  onImportSuccess: () => Promise<void> | void;
  setError?: (err: string) => void;
  setNotice?: (notice: string) => void;
}

export function useQuestionImport({
  onImportSuccess,
  setNotice,
}: UseQuestionImportOptions) {
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [retryExportBusy, setRetryExportBusy] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importProgress, setImportProgress] =
    useState<ImportProgress>(initialProgress);

  const selectImportFile = (file: File | null) => {
    setRetryMode(false);
    selectFile(file);
  };

  const selectFile = (file: File | null) => {
    setImportReport(null);
    setImportError(null);
    setImportProgress(initialProgress);
    if (!file) {
      setImportFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportFile(null);
      setImportError("Invalid file type: Please choose a valid .xlsx Excel workbook.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setImportFile(null);
      setImportError("File too large: Excel workbook must be 25 MB or smaller.");
      return;
    }
    setImportFile(file);
  };

  const selectFailedRowsFile = (file: File | null) => {
    setRetryMode(Boolean(file));
    selectFile(file);
  };

  const downloadFailedRows = async () => {
    if (!importFile || !importReport?.failed) return;
    const failures = importReport.results
      .filter((result) => result.status === "failed")
      .map((result) => ({
        row: result.row,
        externalId: result.externalId,
        error: result.error || result.reason || "Import failed",
      }));
    if (!failures.length) return;

    setRetryExportBusy(true);
    setImportError(null);
    try {
      const form = new FormData();
      form.set("file", importFile);
      form.set("failures", JSON.stringify(failures));
      const response = await fetch("/api/admin/questions/import/failed-rows", {
        method: "POST",
        body: form,
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(payload.message || "Failed rows workbook could not be created");
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${importFile.name.replace(/\.xlsx$/i, "")}-failed-rows.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setNotice?.(
        `${failures.length} failed row${failures.length === 1 ? "" : "s"} downloaded for correction.`,
      );
    } catch (cause) {
      setImportError(
        cause instanceof Error
          ? cause.message
          : "Failed rows workbook could not be created",
      );
    } finally {
      setRetryExportBusy(false);
    }
  };

  const completePartialImport = () => {
    if (importReport) {
      setNotice?.(
        `${importReport.imported} imported question${importReport.imported === 1 ? " was" : "s were"} kept. ${importReport.skipped} duplicate row${importReport.skipped === 1 ? " was" : "s were"} left unchanged. ${importReport.failed} failed row${importReport.failed === 1 ? " was" : "s were"} left out.`,
      );
    }
    setImportOpen(false);
    setImportFile(null);
    setImportReport(null);
    setImportError(null);
    setImportProgress(initialProgress);
    setRetryMode(false);
  };

  const importExcel = async () => {
    if (!importFile) return;
    setImportBusy(true);
    setImportError(null);
    setImportReport(null);
    setImportProgress({
      phase: "uploading",
      percent: 0,
      loadedBytes: 0,
      totalBytes: importFile.size,
      totalRows: 0,
      processedRows: 0,
      importedRows: 0,
      skippedRows: 0,
      failedRows: 0,
    });
    try {
      const form = new FormData();
      form.set("file", importFile);
      const result = await new Promise<
        ImportReport & { message?: string; error?: string }
      >((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/admin/questions/import");
        request.timeout = 310_000;
        let responseOffset = 0;
        let responseBuffer = "";
        let completedReport: ImportReport | null = null;

        const handleEvent = (event: ImportStreamEvent) => {
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "complete") {
            completedReport = event.report;
            return;
          }
          setImportProgress({
            phase: "processing",
            stage: event.stage ?? "persisting",
            stageMessage: event.message,
            percent:
              event.total > 0
                ? Math.round((event.processed / event.total) * 100)
                : 0,
            loadedBytes: importFile.size,
            totalBytes: importFile.size,
            totalRows: event.total,
            processedRows: event.processed,
            importedRows: event.imported,
            skippedRows: event.skipped,
            failedRows: event.failed,
          });
        };

        const consumeResponse = (flush = false) => {
          const nextText = request.responseText.slice(responseOffset);
          responseOffset = request.responseText.length;
          responseBuffer += nextText;
          const lines = responseBuffer.split("\n");
          responseBuffer = flush ? "" : (lines.pop() ?? "");
          for (const line of lines) {
            if (!line.trim()) continue;
            handleEvent(JSON.parse(line) as ImportStreamEvent);
          }
          if (flush && responseBuffer.trim()) {
            handleEvent(JSON.parse(responseBuffer) as ImportStreamEvent);
            responseBuffer = "";
          }
        };

        request.upload.onprogress = (event) => {
          const total = event.lengthComputable ? event.total : importFile.size;
          const percent = total > 0 ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
          setImportProgress({
            phase: percent >= 100 ? "processing" : "uploading",
            stage: "uploading",
            stageMessage:
              percent >= 100
                ? "Workbook received. Initializing pipeline..."
                : `Uploading workbook (${percent}%)...`,
            percent,
            loadedBytes: event.loaded,
            totalBytes: total,
            totalRows: 0,
            processedRows: 0,
            importedRows: 0,
            skippedRows: 0,
            failedRows: 0,
          });
        };
        request.upload.onload = () => {
          setImportProgress({
            phase: "processing",
            stage: "parsing",
            stageMessage: "Parsing workbook & extracting questions...",
            percent: 0,
            loadedBytes: importFile.size,
            totalBytes: importFile.size,
            totalRows: 0,
            processedRows: 0,
            importedRows: 0,
            skippedRows: 0,
            failedRows: 0,
          });
        };
        request.onerror = () => reject(new Error("Network error. Check your connection and try again."));
        request.ontimeout = () => reject(new Error("Import timed out. Please try again."));
        request.onprogress = () => {
          try {
            consumeResponse();
          } catch (error) {
            request.abort();
            reject(error);
          }
        };
        request.onload = () => {
          if (request.status < 200 || request.status >= 300) {
            let body: { message?: string; error?: string } = {};
            try {
              body = JSON.parse(request.responseText) as {
                message?: string;
                error?: string;
              };
            } catch {
              // Preserve the HTTP fallback below for non-JSON proxy errors.
            }
            reject(
              new Error(
                body?.message ||
                  body?.error ||
                  `Excel import failed (HTTP ${request.status})`,
              ),
            );
            return;
          }
          try {
            consumeResponse(true);
          } catch (error) {
            reject(error);
            return;
          }
          if (!completedReport) {
            reject(new Error("Import service did not return a completion report."));
            return;
          }
          resolve(completedReport);
        };
        request.send(form);
      });

      if (result.imported > 0) {
        await onImportSuccess();
      }
      setImportReport(result);
      setImportProgress({
        phase: "complete",
        stage: "complete",
        stageMessage: "Import complete",
        percent: 100,
        loadedBytes: importFile.size,
        totalBytes: importFile.size,
        totalRows: result.total,
        processedRows: result.total,
        importedRows: result.imported,
        skippedRows: result.skipped,
        failedRows: result.failed,
      });
      if (setNotice && result.failed === 0 && result.imported > 0) {
        setNotice(
          `${result.imported} question${result.imported > 1 ? "s" : ""} imported successfully.`,
        );
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Excel import failed";
      setImportError(message);
      setImportProgress(initialProgress);
    } finally {
      setImportBusy(false);
    }
  };

  return {
    importOpen,
    setImportOpen,
    importFile,
    setImportFile,
    importReport,
    setImportReport,
    importBusy,
    setImportBusy,
    retryExportBusy,
    retryMode,
    importError,
    setImportError,
    importProgress,
    selectImportFile,
    selectFailedRowsFile,
    downloadFailedRows,
    completePartialImport,
    importExcel,
  };
}
