"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { demoQuestions } from "./demo-questions";
import { request } from "./helpers";
import {
  emptyDraft,
  type Draft,
  type ImportReport,
  type MockTest,
  type Question,
} from "./types";

export type SubjectFilter = "PHYSICS" | "CHEMISTRY" | "BIOLOGY";

export function useQuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<"bank" | "tests">("bank");
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("PHYSICS");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      setDraft((current) =>
        current.courseCode
          ? current
          : { ...current, courseCode: "NEET", subjectCode: "PHYSICS" },
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Question bank could not load",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

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
  }, [editorOpen, importBusy, importOpen]);

  const visible = useMemo(() => {
    const value = query.toLowerCase();
    return questions.filter(
      (item) =>
        item.courseSubject.subject.code === subjectFilter &&
        (!value ||
          item.externalId.toLowerCase().includes(value) ||
          item.textEn?.toLowerCase().includes(value) ||
          item.textTa?.toLowerCase().includes(value)),
    );
  }, [questions, query, subjectFilter]);

  const patchOption = (
    index: number,
    patch: Partial<Draft["options"][number]>,
  ) =>
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    }));

  const chooseCorrect = (index: number) =>
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({
        ...option,
        isCorrect:
          current.type === "MULTIPLE_CORRECT"
            ? optionIndex === index
              ? !option.isCorrect
              : option.isCorrect
            : optionIndex === index,
      })),
    }));

  const uploadImage = async (file: File, apply: (url: string) => void) => {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/question-media", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        url?: string;
        message?: string;
      };
      if (!response.ok || !payload.url)
        throw new Error(payload.message || "Upload failed");
      apply(payload.url);
      setNotice("Image uploaded securely.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("questions", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          courseCode: "NEET",
          subjectCode: subjectFilter,
          correctMarks: 4,
          negativeMarks: 1,
        }),
      });
      setDraft({
        ...emptyDraft(),
        courseCode: "NEET",
        subjectCode: subjectFilter,
      });
      setEditingId(null);
      setEditorOpen(false);
      setNotice(
        editingId
          ? "Question updated successfully."
          : "Question added successfully.",
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Question save failed");
    } finally {
      setBusy(false);
    }
  };

  const editQuestion = (question: Question) => {
    const legacy = ["A", "B", "C", "D"];
    const options = ["1", "2", "3", "4"].map((label, idx) => {
      const existing = question.options.find(
        (item) => item.label === label || item.label === legacy[idx] || (item as unknown as { position?: number }).position === idx + 1,
      );
      return {
        label,
        textEn: existing?.textEn ?? "",
        textTa: existing?.textTa ?? "",
        imageUrl: existing?.imageUrl ?? "",
        isCorrect: existing?.isCorrect ?? false,
      };
    });
    setSubjectFilter(
      question.courseSubject.subject.code as SubjectFilter,
    );
    setEditingId(question.id);
    setDraft({
      externalId: question.externalId,
      courseCode: question.courseSubject.course.code,
      subjectCode: question.courseSubject.subject.code,
      chapterTitle: question.chapter?.title ?? "",
      type: question.type,
      language: question.language,
      difficulty: question.difficulty,
      textEn: question.textEn ?? "",
      textTa: question.textTa ?? "",
      questionImageUrl: question.questionImageUrl ?? "",
      solutionEn: question.solutionEn ?? "",
      solutionTa: question.solutionTa ?? "",
      solutionImageUrl: question.solutionImageUrl ?? "",
      numericalAnswer: question.numericalAnswer ?? "",
      source: question.source ?? "",
      options,
    });
    setEditorOpen(true);
  };

  const createQuestion = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft(),
      courseCode: "NEET",
      subjectCode: subjectFilter,
    });
    setEditorOpen(true);
  };

  const applyDemoQuestion = (question: Question) => {
    const fresh = emptyDraft();
    setSubjectFilter(
      question.courseSubject.subject.code as SubjectFilter,
    );
    setEditingId(null);
    setDraft({
      externalId: fresh.externalId,
      courseCode: "NEET",
      subjectCode: question.courseSubject.subject.code,
      chapterTitle: question.chapter?.title ?? "",
      type: question.type,
      language: question.language,
      difficulty: question.difficulty,
      textEn: question.textEn ?? "",
      textTa: question.textTa ?? "",
      questionImageUrl: question.questionImageUrl ?? "",
      solutionEn: question.solutionEn ?? "",
      solutionTa: question.solutionTa ?? "",
      solutionImageUrl: question.solutionImageUrl ?? "",
      numericalAnswer: question.numericalAnswer ?? "",
      source: question.source ?? "",
      options: ["1", "2", "3", "4"].map((label, idx) => {
        const legacy = ["A", "B", "C", "D"];
        const option = question.options.find(
          (item) => item.label === label || item.label === legacy[idx] || (item as unknown as { position?: number }).position === idx + 1,
        );
        return {
          label,
          textEn: option?.textEn ?? "",
          textTa: option?.textTa ?? "",
          imageUrl: option?.imageUrl ?? "",
          isCorrect: option?.isCorrect ?? false,
        };
      }),
    });
    setEditorOpen(true);
  };

  const deleteQuestion = async (question: Question) => {
    if (
      !window.confirm(`Delete ${question.externalId}? This cannot be undone.`)
    )
      return;
    setBusy(true);
    try {
      await request(`questions/${question.id}`, { method: "DELETE" });
      setQuestions((current) =>
        current.filter((item) => item.id !== question.id),
      );
      setSelected((current) => current.filter((id) => id !== question.id));
      setNotice("Question deleted.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Question delete failed",
      );
    } finally {
      setBusy(false);
    }
  };

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
      if (result.imported) await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Excel import failed");
    } finally {
      setImportBusy(false);
    }
  };

  const subjectCounts = {
    PHYSICS: questions.filter(
      (item) => item.courseSubject.subject.code === "PHYSICS",
    ).length,
    CHEMISTRY: questions.filter(
      (item) => item.courseSubject.subject.code === "CHEMISTRY",
    ).length,
    BIOLOGY: questions.filter(
      (item) => item.courseSubject.subject.code === "BIOLOGY",
    ).length,
  };

  const showingExamples =
    !busy && !query.trim() && subjectCounts[subjectFilter] === 0;
  const libraryQuestions = showingExamples
    ? demoQuestions.filter(
        (item) => item.courseSubject.subject.code === subjectFilter,
      )
    : visible;

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

