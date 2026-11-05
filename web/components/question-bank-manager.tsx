"use client";

import {
  BookOpenCheck,
  ClipboardCheck,
  FileDown,
  FileQuestion,
  FileSpreadsheet,
  LoaderCircle,
  Plus,
  Search,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { demoQuestions } from "./question-bank/demo-questions";
import { request } from "./question-bank/helpers";
import { MockTestsBuilder } from "./question-bank/mock-tests-builder";
import { QuestionCard } from "./question-bank/question-card";
import { QuestionEditorDialog } from "./question-bank/question-editor-dialog";
import { QuestionImportDialog } from "./question-bank/question-import-dialog";
import {
  emptyDraft,
  type Draft,
  type ImportReport,
  type MockTest,
  type Question,
} from "./question-bank/types";
import { Stack } from "@/components/layout/layout-primitives";

export function QuestionBankManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<"bank" | "tests">("bank");
  const [subjectFilter, setSubjectFilter] = useState<
    "PHYSICS" | "CHEMISTRY" | "BIOLOGY"
  >("PHYSICS");
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
    const options = ["A", "B", "C", "D"].map((label) => {
      const existing = question.options.find((item) => item.label === label);
      return {
        label,
        textEn: existing?.textEn ?? "",
        textTa: existing?.textTa ?? "",
        imageUrl: existing?.imageUrl ?? "",
        isCorrect: existing?.isCorrect ?? false,
      };
    });
    setSubjectFilter(
      question.courseSubject.subject.code as typeof subjectFilter,
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
      question.courseSubject.subject.code as typeof subjectFilter,
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
      options: ["A", "B", "C", "D"].map((label) => {
        const option = question.options.find((item) => item.label === label);
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

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-200 bg-[#fbfbfa] px-5 py-6 sm:px-7 sm:py-7">
        <Stack gap="lg">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <Stack gap="sm" className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <BookOpenCheck className="size-3.5" /> Content operations
            </div>
            <h2 className="type-page-title text-slate-950">
              Assessment content
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Build and maintain bilingual NEET questions, syllabus coverage,
              and mock assessments from one workspace.
            </p>
          </Stack>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
            <button
              type="button"
              onClick={createQuestion}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18184a] px-4 text-xs font-semibold text-white transition hover:bg-[#25255f]"
            >
              <Plus className="size-4" /> Add question
            </button>
            <Link
              href="/api/admin/questions/template"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <FileDown className="size-4" /> Template
            </Link>
            <button
              type="button"
              onClick={() => {
                setImportOpen(true);
                setImportFile(null);
                setImportReport(null);
                setError("");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <FileSpreadsheet className="size-4" /> Import Excel
            </button>
          </div>
        </div>
        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3">
          {[
            {
              label: "Questions",
              detail: "Library records",
              value: questions.length,
              icon: FileQuestion,
              tone: "bg-indigo-50 text-indigo-700",
            },
            {
              label: "Mock tests",
              detail: "Assessment drafts",
              value: tests.length,
              icon: ClipboardCheck,
              tone: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Selected",
              detail: "Ready for test",
              value: selected.length,
              icon: Target,
              tone: "bg-amber-50 text-amber-700",
            },
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`flex items-center gap-3 px-4 py-3.5 sm:px-5 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${metric.tone}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold tracking-tight text-slate-950">
                      {metric.value}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {metric.label}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-400">
                    {metric.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        </Stack>
      </div>

      <QuestionImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        importFile={importFile}
        selectImportFile={selectImportFile}
        importReport={importReport}
        setImportReport={setImportReport}
        setImportFile={setImportFile}
        importBusy={importBusy}
        onImport={importExcel}
      />

      <QuestionEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        editingId={editingId}
        subjectFilter={subjectFilter}
        draft={draft}
        setDraft={setDraft}
        patchOption={patchOption}
        chooseCorrect={chooseCorrect}
        uploadImage={uploadImage}
        onSave={save}
        busy={busy}
      />

      {(error || notice) && (
        <div
          className={`mx-5 mt-5 flex items-center justify-between rounded-xl border p-3 text-sm sm:mx-7 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
        >
          <span>{error || notice}</span>
          <button
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="bg-[#fdfdfc] p-5 sm:p-7">
        <Stack>
        <div className="flex w-full border-b border-slate-200">
          {[
            {
              id: "bank" as const,
              label: "Question bank",
              count: questions.length,
            },
            { id: "tests" as const, label: "Mock tests", count: tests.length },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`relative px-4 pb-3 text-xs font-semibold transition sm:px-6 ${tab === item.id ? "text-brand-blue" : "text-slate-400 hover:text-slate-700"}`}
            >
              {item.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${tab === item.id ? "bg-blue-50 text-brand-blue" : "bg-slate-100 text-slate-500"}`}
              >
                {item.count}
              </span>
              {tab === item.id && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-blue" />
              )}
            </button>
          ))}
        </div>
        {tab === "bank" && (
          <div className="grid gap-3 md:grid-cols-3">
            {(["PHYSICS", "CHEMISTRY", "BIOLOGY"] as const).map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  setSubjectFilter(subject);
                }}
                className={`group flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition ${subjectFilter === subject ? "border-blue-200 bg-blue-50 text-brand-blue shadow-xs" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                <span className="grid gap-0.5">
                  <span className="block text-xs font-semibold">
                    {subject[0] + subject.slice(1).toLowerCase()}
                  </span>
                  <span
                    className={`block text-xs font-semibold uppercase tracking-wide ${subjectFilter === subject ? "text-brand-blue" : "text-slate-400"}`}
                  >
                    Subject workspace
                  </span>
                </span>
                <span
                  className={`grid size-8 place-items-center rounded-lg text-xs font-semibold ${subjectFilter === subject ? "bg-white text-indigo-700 ring-1 ring-indigo-200" : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"}`}
                >
                  {subjectCounts[subject]}
                </span>
              </button>
            ))}
          </div>
        )}
        {tab === "bank" ? (
          <div>
            <Stack className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <Stack gap="xs">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Content library
                  </p>
                  <h3 className="text-sm font-semibold text-slate-950">
                    {subjectFilter[0] + subjectFilter.slice(1).toLowerCase()}{" "}
                    questions
                  </h3>
                </Stack>
                <div className="flex items-center gap-2">
                  {showingExamples && (
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Demo preview
                    </span>
                  )}
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {visible.length} records
                  </span>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none"
                  placeholder={`Search ${subjectFilter.toLowerCase()} questions`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {busy && !questions.length ? (
                  <div className="grid h-48 place-items-center">
                    <LoaderCircle className="animate-spin" />
                  </div>
                ) : (
                  libraryQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      demo={showingExamples}
                      onEdit={() =>
                        showingExamples
                          ? applyDemoQuestion(question)
                          : editQuestion(question)
                      }
                      onDelete={
                        showingExamples
                          ? undefined
                          : () => void deleteQuestion(question)
                      }
                    />
                  ))
                )}
                {!busy && !libraryQuestions.length && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                    No {subjectFilter.toLowerCase()} questions yet.
                  </div>
                )}
              </div>
            </Stack>
          </div>
        ) : (
          <MockTestsBuilder
            tests={tests}
            questions={questions}
            selected={selected}
            onSelectionChange={setSelected}
            onCreated={load}
            onError={setError}
            onNotice={setNotice}
          />
        )}
        </Stack>
      </div>
    </section>
  );
}
