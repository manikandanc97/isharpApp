"use client";

import { useState } from "react";
import type { ImportReport } from "./types";

export interface UseQuestionImportOptions {
  onImportSuccess: () => Promise<void> | void;
  setError: (err: string) => void;
  setNotice: (notice: string) => void;
}

export function useQuestionImport({
  onImportSuccess,
  setError,
  setNotice,
}: UseQuestionImportOptions) {
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [importBusy, setImportBusy] = useState(false);

  const selectImportFile = (file: File | null) => {
    setImportReport(null);
    if (!file) {
      setImportFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportFile(null);
      setError("Choose a valid .xlsx workbook.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setImportFile(null);
      setError("Excel file must be 25 MB or smaller.");
      return;
    }
    setError("");
    setImportFile(file);
  };

  const importExcel = async () => {
    if (!importFile) return;
    setImportBusy(true);
    setError("");
    setImportReport(null);
    try {
      const form = new FormData();
      form.set("file", importFile);
      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as ImportReport & {
        message?: string;
      };
      if (!response.ok) throw new Error(result.message || "Import failed");
      setImportReport(result);
      setNotice(
        [
          result.imported,
          " imported, ",
          result.skipped,
          " skipped, ",
          result.failed,
          " failed.",
        ].join(""),
      );
      if (result.imported) {
        await onImportSuccess();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Excel import failed");
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
    selectImportFile,
    importExcel,
  };
}
