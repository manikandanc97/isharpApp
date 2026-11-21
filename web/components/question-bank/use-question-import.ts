"use client";

import { useState } from "react";
import type { ImportProgress, ImportReport } from "./types";

const initialProgress: ImportProgress = {
  phase: "idle",
  percent: 0,
  loadedBytes: 0,
  totalBytes: 0,
};

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
    });
    try {
      const form = new FormData();
      form.set("file", importFile);
      const result = await new Promise<
        ImportReport & { message?: string; error?: string }
      >((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/admin/questions/import");
        request.responseType = "json";
        request.timeout = 310_000;

        request.upload.onprogress = (event) => {
          const total = event.lengthComputable ? event.total : importFile.size;
          const percent = total > 0 ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
          setImportProgress({
            phase: percent >= 100 ? "processing" : "uploading",
            percent,
            loadedBytes: event.loaded,
            totalBytes: total,
          });
        };
        request.upload.onload = () => {
          setImportProgress({
            phase: "processing",
            percent: 100,
            loadedBytes: importFile.size,
            totalBytes: importFile.size,
          });
        };
        request.onerror = () => reject(new Error("Network error. Check your connection and try again."));
        request.ontimeout = () => reject(new Error("Import timed out. Please try again."));
        request.onload = () => {
          const body = request.response as
            | (ImportReport & { message?: string; error?: string })
            | null;
          if (request.status < 200 || request.status >= 300) {
            reject(
              new Error(
                body?.message ||
                  body?.error ||
                  `Excel import failed (HTTP ${request.status})`,
              ),
            );
            return;
          }
          if (!body) {
            reject(new Error("Empty response received from import service."));
            return;
          }
          resolve(body);
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
