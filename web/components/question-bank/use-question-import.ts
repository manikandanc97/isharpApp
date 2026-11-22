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
  const [importError, setImportError] = useState<string | null>(null);
  const [importProgress, setImportProgress] =
    useState<ImportProgress>(initialProgress);

  const selectImportFile = (file: File | null) => {
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
            percent: 100,
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
    importError,
    setImportError,
    importProgress,
    selectImportFile,
    importExcel,
  };
}
