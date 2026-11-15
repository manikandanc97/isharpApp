"use client";

import { useCallback, useEffect, useState } from "react";
import { request } from "./helpers";
import type { MockTest, Question } from "./types";
import { useMockTestAssignment } from "./use-mock-test-assignment";
import { useQuestionBankFilters } from "./use-question-bank-filters";
import { useQuestionDraftEditor } from "./use-question-draft-editor";
import { useQuestionImport } from "./use-question-import";

export type { SubjectFilter } from "./use-question-bank-filters";
export { useMockTestAssignment } from "./use-mock-test-assignment";
export { useQuestionBankFilters } from "./use-question-bank-filters";
export { useQuestionDraftEditor } from "./use-question-draft-editor";
export { useQuestionImport } from "./use-question-import";

export function useQuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const {
    tests,
    setTests,
    selected,
    setSelected,
  } = useMockTestAssignment();

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [q, t] = await Promise.all([
        request<Question[]>("questions"),
        request<MockTest[]>("mock-tests"),
      ]);
      setQuestions(q);
      setTests(t);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Question bank could not load",
      );
    } finally {
      setBusy(false);
    }
  }, [setTests]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const {
    query,
    setQuery,
    tab,
    setTab,
    subjectFilter,
    setSubjectFilter,
    visible,
    subjectCounts,
    showingExamples,
    libraryQuestions,
  } = useQuestionBankFilters({
    questions,
    busy,
  });

  const {
    draft,
    setDraft,
    editingId,
    setEditingId,
    editorOpen,
    setEditorOpen,
    patchOption,
    chooseCorrect,
    uploadImage,
    save,
    editQuestion,
    createQuestion,
    applyDemoQuestion,
    deleteQuestion,
  } = useQuestionDraftEditor({
    subjectFilter,
    setSubjectFilter,
    onQuestionsChanged: load,
    setBusy,
    setError,
    setNotice,
    setQuestions,
    setSelected,
  });

  const {
    importOpen,
    setImportOpen,
    importFile,
    setImportFile,
    importReport,
    setImportReport,
    importBusy,
    selectImportFile,
    importExcel,
  } = useQuestionImport({
    onImportSuccess: load,
    setError,
    setNotice,
  });

  // Modal overflow and Escape listener
  useEffect(() => {
    if (!editorOpen && !importOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (importOpen && !importBusy) setImportOpen(false);
        else if (editorOpen) setEditorOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [editorOpen, importBusy, importOpen, setEditorOpen, setImportOpen]);

  return {
    questions,
    tests,
    draft,
    setDraft,
    query,
    setQuery,
    selected,
    setSelected,
    tab,
    setTab,
    subjectFilter,
    setSubjectFilter,
    editingId,
    setEditingId,
    editorOpen,
    setEditorOpen,
    importOpen,
    setImportOpen,
    importFile,
    setImportFile,
    importReport,
    setImportReport,
    importBusy,
    busy,
    error,
    setError,
    notice,
    setNotice,
    load,
    patchOption,
    chooseCorrect,
    uploadImage,
    save,
    editQuestion,
    createQuestion,
    applyDemoQuestion,
    deleteQuestion,
    selectImportFile,
    importExcel,
    subjectCounts,
    showingExamples,
    libraryQuestions,
    visible,
  };
}
