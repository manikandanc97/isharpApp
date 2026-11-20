"use client";

import { useState } from "react";
import type { ImportReport } from "./types";

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

  const selectImportFile = (file: File | null) => {
    setImportReport(null);
    setImportError(null);
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
    try {
      const form = new FormData();
      form.set("file", importFile);
      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        body: form,
      });

      let result: (ImportReport & { message?: string; error?: string }) | null = null;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText || "Unexpected response"}`);
      }

      if (!response.ok) {
        throw new Error(result?.message || result?.error || `Excel import failed (HTTP ${response.status})`);
      }

      if (!result) {
        throw new Error("Empty response received from import service.");
      }

      setImportReport(result);
      if (result.imported > 0) {
        await onImportSuccess();
      }
      if (setNotice && result.failed === 0 && result.imported > 0) {
        setNotice(
          `${result.imported} question${result.imported > 1 ? "s" : ""} imported successfully.`,
        );
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Excel import failed";
      setImportError(message);
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
    selectImportFile,
    importExcel,
  };
}
