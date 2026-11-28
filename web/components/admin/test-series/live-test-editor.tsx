"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  FileQuestion,
  Loader2,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ExamPatternMode,
  QuestionShortageDetail,
  SelectedQuestionItem,
  SubjectAllocationItem,
} from "./types";
import { TestDetailsTab } from "./live-test-editor/components/test-details-tab";
import { TestSubjectsTab } from "./live-test-editor/components/test-subjects-tab";
import { TestQuestionsTab } from "./live-test-editor/components/test-questions-tab";
import { TestSettingsTab } from "./live-test-editor/components/test-settings-tab";
import { TestEditorDialogs } from "./live-test-editor/components/test-editor-dialogs";
import type {
  EditorFormState,
  EditorMode,
  EditorTab,
  LiveTestEditorHandle,
  LiveTestEditorProps,
} from "./live-test-editor/test-editor.types";
import {
  buildDefaultAllocations,
  buildEmptyAllocations,
  createInitialState,
} from "./live-test-editor/test-editor.utils";

export type { EditorMode, EditorTab, LiveTestEditorHandle };

export const LiveTestEditor = forwardRef<
  LiveTestEditorHandle,
  LiveTestEditorProps
>(function LiveTestEditor(
  {
    mode,
    selectedTest,
    categories,
    selectedCategoryId,
    examConfig,
    inDialog = false,
    onDirtyChange,
    onCancelCreate,
    onClose,
    onCreateTestClick,
    onSaved,
    onError,
  },
  ref,
) {
  const [activeTab, setActiveTab] = useState<EditorTab>("details");
  const [form, setForm] = useState<EditorFormState | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [loadedQuestions, setLoadedQuestions] = useState<SelectedQuestionItem[]>([]);
  const [savedQuestionsSnapshot, setSavedQuestionsSnapshot] = useState<
    SelectedQuestionItem[]
  >([]);
  const [legacyTotalQuestions, setLegacyTotalQuestions] = useState<number | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDefaultOpen, setConfirmDefaultOpen] = useState(false);

  // Subjects & Chapters UI state
  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<string, boolean>
  >({});
  const [chapterSearch, setChapterSearch] = useState<Record<string, string>>({});

  // Questions Tab UI state
  const [shortages, setShortages] = useState<QuestionShortageDetail[]>([]);
  const [generating, setGenerating] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [bankSubject, setBankSubject] = useState("ALL");
  const [bankChapter, setBankChapter] = useState("ALL");
  const [bankDifficulty, setBankDifficulty] = useState("ALL");
  const [bankPage, setBankPage] = useState(1);
  const [bankTotalPages, setBankTotalPages] = useState(1);
  const [bankTotal, setBankTotal] = useState(0);
  const [bankItems, setBankItems] = useState<SelectedQuestionItem[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [previewQuestion, setPreviewQuestion] =
    useState<SelectedQuestionItem | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const hasAttempts = mode === "edit" && (selectedTest?.attemptCount ?? 0) > 0;

  // Sync form state when mode or selectedTest changes
  useEffect(() => {
    abortRef.current?.abort();

    if (!examConfig || mode === "empty") {
      setForm(null);
      setSavedSnapshot("");
      setLoadedQuestions([]);
      setSavedQuestionsSnapshot([]);
      setLegacyTotalQuestions(null);
      setShortages([]);
      setReplaceTargetId(null);
      onDirtyChange(false);
      return;
    }

    if (mode === "create") {
      const next = createInitialState(
        examConfig,
        selectedCategoryId ?? categories[0]?.id ?? "",
      );
      const snap = JSON.stringify(next);
      setForm(next);
      setSavedSnapshot(snap);
      setLoadedQuestions([]);
      setSavedQuestionsSnapshot([]);
      setLegacyTotalQuestions(null);
      setShortages([]);
      setReplaceTargetId(null);
      setActiveTab("details");
      onDirtyChange(false);
      return;
    }

    if (mode === "edit" && selectedTest?.id) {
      const controller = new AbortController();
      abortRef.current = controller;

      const timer = window.setTimeout(() => {
        setLoadingDetail(true);
        setShortages([]);
        setReplaceTargetId(null);

        fetch(
          `/api/admin/test-series/tests/${encodeURIComponent(selectedTest.id)}`,
          { cache: "no-store", signal: controller.signal },
        )
          .then(async (res) => {
            if (!res.ok) throw new Error("Failed to load test configuration");
            return res.json();
          })
          .then((detail) => {
            if (controller.signal.aborted) return;

            const hasSavedDistribution =
              Array.isArray(detail.subjectDistribution) &&
              detail.subjectDistribution.length > 0;

            let allocations: SubjectAllocationItem[];
            if (hasSavedDistribution) {
              const savedMap = new Map(
                (detail.subjectDistribution as SubjectAllocationItem[]).map(
                  (s) => [s.courseSubjectId, s],
                ),
              );
              allocations = buildEmptyAllocations(examConfig).map((base) => {
                const saved = savedMap.get(base.courseSubjectId);
                if (!saved) return base;
                return {
                  ...base,
                  enabled: (saved.questionCount ?? 0) > 0,
                  chapterMode: saved.chapterMode ?? "ALL",
                  chapterAllocationMode:
                    saved.chapterAllocationMode ?? "AUTOMATIC",
                  questionCount: saved.questionCount ?? 0,
                  chapterIds: saved.chapterIds ?? base.chapterIds,
                  chapterAllocations: saved.chapterAllocations ?? [],
                };
              });
            } else {
              // Legacy test without saved subjectDistribution: do not fabricate 180 if stored total differs
              allocations = buildEmptyAllocations(examConfig);
            }

            const mappedQuestions: SelectedQuestionItem[] = Array.isArray(
              detail.questions,
            )
              ? detail.questions.map(
                  (item: {
                    question: SelectedQuestionItem & {
                      courseSubject?: { subject?: { code: string; name: string } };
                      chapter?: { id: string; title: string } | null;
                    };
                  }) => ({
                    ...item.question,
                    subjectCode:
                      item.question.courseSubject?.subject?.code ??
                      item.question.subjectCode ??
                      "GENERAL",
                    subjectName:
                      item.question.courseSubject?.subject?.name ??
                      item.question.subjectName ??
                      "General",
                    chapterTitle:
                      item.question.chapter?.title ??
                      item.question.chapterTitle ??
                      null,
                  }),
                )
              : [];

            // If legacy test has no distribution and total != 180, keep pattern as MANUAL so user sees real stored count
            const effectivePatternMode: ExamPatternMode =
              !hasSavedDistribution &&
              detail.totalQuestions !== examConfig.defaultPattern.totalQuestions
                ? "MANUAL"
                : detail.examPatternMode ?? "DEFAULT_NEET";

            const nextForm: EditorFormState = {
              title: detail.title ?? "",
              categoryId:
                detail.categoryId ??
                selectedTest.categoryId ??
                selectedCategoryId ??
                "",
              description: detail.description ?? "",
              isActive: Boolean(detail.isActive),
              showScheduling: Boolean(
                detail.scheduledAt || detail.availableUntil,
              ),
              scheduledAt: detail.scheduledAt
                ? String(detail.scheduledAt).slice(0, 16)
                : "",
              availableUntil: detail.availableUntil
                ? String(detail.availableUntil).slice(0, 16)
                : "",
              examPatternMode: effectivePatternMode,
              questionSelectionMode: detail.questionSelectionMode ?? "AUTOMATIC",
              durationMode: detail.durationMode ?? "AUTOMATIC",
              manualDuration:
                detail.durationMinutes ??
                examConfig.defaultPattern.durationMinutes,
              correctMarks:
                detail.correctMarks ?? examConfig.defaultPattern.correctMarks,
              negativeMarks:
                detail.negativeMarks ?? examConfig.defaultPattern.negativeMarks,
              hasNegativeMarking: detail.hasNegativeMarking ?? true,
              randomizeQuestions: detail.randomizeQuestions ?? true,
              maxAttempts: detail.maxAttempts ?? 1,
              subjectAllocations: allocations,
              questionIds: mappedQuestions.map((q) => q.id),
            };

            setForm(nextForm);
            setSavedSnapshot(JSON.stringify(nextForm));
            setLoadedQuestions(mappedQuestions);
            setSavedQuestionsSnapshot(mappedQuestions);
            setLegacyTotalQuestions(
              hasSavedDistribution ? null : detail.totalQuestions,
            );
            onDirtyChange(false);
          })
          .catch((err) => {
            if (!controller.signal.aborted) {
              onError(
                err instanceof Error
                  ? err.message
                  : "Failed to load test details",
              );
            }
          })
          .finally(() => {
            if (!controller.signal.aborted) {
              setLoadingDetail(false);
            }
          });
      }, 0);

      return () => {
        window.clearTimeout(timer);
        controller.abort();
      };
    }
  }, [
    mode,
    selectedTest?.id,
    selectedTest?.categoryId,
    examConfig,
    selectedCategoryId,
    categories,
    onDirtyChange,
    onError,
  ]);

  const isDirty = useMemo(() => {
    if (!form || !savedSnapshot) return false;
    return JSON.stringify(form) !== savedSnapshot;
  }, [form, savedSnapshot]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const updateForm = useCallback(
    (updater: (prev: EditorFormState) => EditorFormState) => {
      setForm((prev) => (prev ? updater(prev) : prev));
    },
    [],
  );

  // Derived Totals
  const enabledSubjects = useMemo(
    () =>
      form
        ? form.subjectAllocations.filter((s) => s.enabled && s.questionCount > 0)
        : [],
    [form],
  );

  const subjectAllocationTotal = useMemo(
    () => enabledSubjects.reduce((sum, s) => sum + (s.questionCount || 0), 0),
    [enabledSubjects],
  );

  const totalQuestions = useMemo(() => {
    if (!form || !examConfig) return 0;
    if (form.examPatternMode === "DEFAULT_NEET") {
      return examConfig.defaultPattern.totalQuestions;
    }
    if (subjectAllocationTotal > 0) return subjectAllocationTotal;
    return legacyTotalQuestions ?? 0;
  }, [form, examConfig, subjectAllocationTotal, legacyTotalQuestions]);

  const calculatedDuration = useMemo(() => {
    if (!examConfig || totalQuestions <= 0) return 0;
    const raw =
      (totalQuestions * examConfig.defaultPattern.durationMinutes) /
      examConfig.defaultPattern.totalQuestions;
    return Math.max(1, Math.round(raw));
  }, [totalQuestions, examConfig]);

  const effectiveDuration = useMemo(() => {
    if (!form) return 0;
    if (form.examPatternMode === "DEFAULT_NEET" || form.durationMode === "AUTOMATIC") {
      return calculatedDuration;
    }
    return form.manualDuration;
  }, [form, calculatedDuration]);

  const effectiveCorrectMarks = useMemo(() => {
    if (!form || !examConfig) return 4;
    return form.examPatternMode === "DEFAULT_NEET"
      ? examConfig.defaultPattern.correctMarks
      : form.correctMarks;
  }, [form, examConfig]);

  const effectiveNegativeMarks = useMemo(() => {
    if (!form || !examConfig) return 1;
    if (form.examPatternMode === "DEFAULT_NEET") {
      return examConfig.defaultPattern.negativeMarks;
    }
    return form.hasNegativeMarking ? form.negativeMarks : 0;
  }, [form, examConfig]);

  const maxMarks = totalQuestions * effectiveCorrectMarks;

  // Validation
  const allocationErrors = useMemo(() => {
    if (!form) return [];
    const errors: string[] = [];
    for (const s of form.subjectAllocations) {
      if (!s.enabled) continue;
      if (s.questionCount <= 0) {
        errors.push(`${s.subjectName}: Question count must be greater than 0.`);
      }
      if (s.chapterMode === "SELECTED" && s.chapterIds.length === 0) {
        errors.push(`${s.subjectName}: Select at least one chapter.`);
      }
      if (s.chapterAllocationMode === "MANUAL") {
        const sum = s.chapterAllocations.reduce((a, b) => a + (b.count || 0), 0);
        if (sum !== s.questionCount) {
          errors.push(
            `${s.subjectName}: Chapter sum (${sum}) must equal ${s.questionCount}.`,
          );
        }
      }
    }
    return errors;
  }, [form]);

  const activationErrors = useMemo(() => {
    if (!form) return [];
    const errs: string[] = [];
    if (!form.title.trim()) errs.push("Test name is required.");
    if (!form.categoryId) errs.push("Category is required.");
    if (totalQuestions <= 0) errs.push("Total questions must be greater than 0.");
    if (effectiveDuration <= 0) errs.push("Duration must be greater than 0 minutes.");
    if (effectiveCorrectMarks <= 0) errs.push("Correct answer marks must be > 0.");
    if (allocationErrors.length > 0) errs.push(...allocationErrors);
    if (form.isActive && loadedQuestions.length !== totalQuestions) {
      errs.push(
        `To keep this test Active, assign all ${totalQuestions} questions (currently ${loadedQuestions.length}).`,
      );
    }
    return errs;
  }, [
    form,
    totalQuestions,
    effectiveDuration,
    effectiveCorrectMarks,
    allocationErrors,
    loadedQuestions.length,
  ]);

  // Question Bank Search (Manual tab or Replace)
  const loadBankQuestions = useCallback(async () => {
    setBankLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(bankPage),
        limit: "12",
        subjectCode: bankSubject,
        chapterId: bankChapter,
        difficulty: bankDifficulty,
        type: "SINGLE_CORRECT",
      });
      if (bankQuery.trim()) params.set("query", bankQuery.trim());
      const res = await fetch(
        `/api/admin/test-series/questions/search?${params.toString()}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        setBankItems(data.items ?? []);
        setBankTotalPages(data.totalPages ?? 1);
        setBankTotal(data.total ?? 0);
      }
    } catch {
      // handled gracefully
    } finally {
      setBankLoading(false);
    }
  }, [bankPage, bankSubject, bankChapter, bankDifficulty, bankQuery]);

  useEffect(() => {
    if (
      activeTab === "questions" &&
      (form?.questionSelectionMode === "MANUAL" || replaceTargetId)
    ) {
      const timer = window.setTimeout(() => void loadBankQuestions(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [activeTab, form?.questionSelectionMode, replaceTargetId, loadBankQuestions]);

  // Automatic Question Generation
  const handleGenerateQuestions = async () => {
    if (!form || allocationErrors.length > 0) {
      if (allocationErrors.length > 0) onError(allocationErrors[0]);
      return;
    }
    if (enabledSubjects.length === 0) {
      onError("Enable at least one subject in Subjects & Chapters first.");
      return;
    }
    setGenerating(true);
    setShortages([]);
    try {
      const res = await fetch("/api/admin/test-series/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectAllocations: enabledSubjects }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to generate questions");
      }
      if (Array.isArray(data.shortages) && data.shortages.length > 0) {
        setShortages(data.shortages);
      } else {
        const qs: SelectedQuestionItem[] = data.questions ?? [];
        setShortages([]);
        setLoadedQuestions(qs);
        updateForm((prev) => ({
          ...prev,
          questionIds: qs.map((q) => q.id),
        }));
      }
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to generate questions",
      );
    } finally {
      setGenerating(false);
    }
  };

  const selectedIdSet = useMemo(
    () => new Set(loadedQuestions.map((q) => q.id)),
    [loadedQuestions],
  );

  const toggleManualQuestion = (q: SelectedQuestionItem) => {
    if (hasAttempts || !form) return;
    if (replaceTargetId) {
      const next = loadedQuestions.map((item) =>
        item.id === replaceTargetId ? q : item,
      );
      setLoadedQuestions(next);
      updateForm((prev) => ({ ...prev, questionIds: next.map((i) => i.id) }));
      setReplaceTargetId(null);
      return;
    }
    if (selectedIdSet.has(q.id)) {
      const next = loadedQuestions.filter((item) => item.id !== q.id);
      setLoadedQuestions(next);
      updateForm((prev) => ({ ...prev, questionIds: next.map((i) => i.id) }));
    } else {
      if (loadedQuestions.length >= totalQuestions) {
        onError(`Already selected ${totalQuestions} questions.`);
        return;
      }
      const next = [...loadedQuestions, q];
      setLoadedQuestions(next);
      updateForm((prev) => ({ ...prev, questionIds: next.map((i) => i.id) }));
    }
  };

  const handleBulkSelectPage = () => {
    if (hasAttempts || !form) return;
    const existing = new Set(loadedQuestions.map((q) => q.id));
    const next = [...loadedQuestions];
    for (const item of bankItems) {
      if (next.length >= totalQuestions) break;
      if (!existing.has(item.id)) {
        existing.add(item.id);
        next.push(item);
      }
    }
    setLoadedQuestions(next);
    updateForm((prev) => ({ ...prev, questionIds: next.map((i) => i.id) }));
  };

  // Save & Discard
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!form || !examConfig) return false;
    if (activationErrors.length > 0) {
      onError(activationErrors[0]);
      return false;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: form.categoryId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
        scheduledAt:
          form.showScheduling && form.scheduledAt
            ? new Date(form.scheduledAt).toISOString()
            : null,
        availableUntil:
          form.showScheduling && form.availableUntil
            ? new Date(form.availableUntil).toISOString()
            : null,
        ...(hasAttempts
          ? {}
          : {
              examPatternMode: form.examPatternMode,
              examPatternVersion: examConfig.defaultPattern.version,
              questionSelectionMode: form.questionSelectionMode,
              durationMode:
                form.examPatternMode === "DEFAULT_NEET"
                  ? "AUTOMATIC"
                  : form.durationMode,
              durationMinutes: effectiveDuration,
              totalQuestions,
              correctMarks: effectiveCorrectMarks,
              negativeMarks: effectiveNegativeMarks,
              hasNegativeMarking:
                form.examPatternMode === "DEFAULT_NEET"
                  ? true
                  : form.hasNegativeMarking,
              randomizeQuestions: form.randomizeQuestions,
              maxAttempts: form.maxAttempts,
              subjectDistribution: enabledSubjects,
              questionIds: form.questionIds,
            }),
      };

      const isCreate = mode === "create";
      const url = isCreate
        ? "/api/admin/test-series/tests"
        : `/api/admin/test-series/tests/${encodeURIComponent(selectedTest!.id)}`;

      const res = await fetch(url, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to save test");
      }

      setSavedSnapshot(JSON.stringify(form));
      setSavedQuestionsSnapshot(loadedQuestions);
      onDirtyChange(false);
      await onSaved(
        data.id ?? selectedTest?.id ?? "",
        isCreate,
        isCreate ? "Test created successfully" : "Changes saved",
      );
      return true;
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save test");
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    form,
    examConfig,
    activationErrors,
    hasAttempts,
    effectiveDuration,
    totalQuestions,
    effectiveCorrectMarks,
    effectiveNegativeMarks,
    enabledSubjects,
    mode,
    selectedTest,
    loadedQuestions,
    onDirtyChange,
    onSaved,
    onError,
  ]);

  const handleDiscard = useCallback(() => {
    if (!savedSnapshot) return;
    const parsed: EditorFormState = JSON.parse(savedSnapshot);
    setForm(parsed);
    setLoadedQuestions(savedQuestionsSnapshot);
    setShortages([]);
    setReplaceTargetId(null);
    onDirtyChange(false);
  }, [savedSnapshot, savedQuestionsSnapshot, onDirtyChange]);

  useImperativeHandle(
    ref,
    () => ({
      save: handleSave,
      discard: handleDiscard,
    }),
    [handleSave, handleDiscard],
  );

  const applyDefaultNeetPattern = () => {
    if (!examConfig) return;
    updateForm((prev) => ({
      ...prev,
      examPatternMode: "DEFAULT_NEET",
      durationMode: "AUTOMATIC",
      correctMarks: examConfig.defaultPattern.correctMarks,
      negativeMarks: examConfig.defaultPattern.negativeMarks,
      hasNegativeMarking: true,
      subjectAllocations: buildDefaultAllocations(examConfig),
    }));
    setShortages([]);
    setConfirmDefaultOpen(false);
  };

  const availableChaptersForBank = useMemo(() => {
    if (!examConfig || bankSubject === "ALL") return [];
    return (
      examConfig.subjects.find((s) => s.subjectCode === bankSubject)?.chapters ??
      []
    );
  }, [bankSubject, examConfig]);

  // Empty State
  if (mode === "empty") {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
        <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <FileQuestion className="size-6" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-900">
          Select a test to view or edit its configuration.
        </h3>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Click any test in the table on the left, or create a new test in this
          category.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={onCreateTestClick}
          className="mt-4 gap-1.5 rounded-xl bg-brand-red text-xs font-semibold text-white hover:bg-brand-red/90"
        >
          <Plus className="size-3.5" />
          Create Test
        </Button>
      </div>
    );
  }

  if (loadingDetail || !form || !examConfig) {
    return (
      <div
        className={
          inDialog
            ? "flex h-full min-h-0 flex-1 items-center justify-center bg-white text-xs text-slate-500"
            : "flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs text-slate-500 shadow-2xs"
        }
      >
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading test configuration...
      </div>
    );
  }

  const tabs: Array<{ id: EditorTab; label: string }> = [
    { id: "details", label: "Test Details" },
    { id: "subjects", label: "Subjects & Chapters" },
    { id: "questions", label: `Questions (${loadedQuestions.length}/${totalQuestions})` },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div
      className={
        inDialog
          ? "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
          : "flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
      }
    >
      {/* Sticky Header */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-3.5">
        <div className={`flex items-center justify-between gap-2 ${inDialog ? "pr-8" : ""}`}>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">
              {mode === "create"
                ? "Create Test"
                : `Edit Test – ${form.title || selectedTest?.title || ""}`}
            </h3>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
              <span>
                {categories.find((c) => c.id === form.categoryId)?.name ??
                  "Uncategorized"}
              </span>
              {isDirty && (
                <span className="font-semibold text-amber-600">
                  • Unsaved changes
                </span>
              )}
            </div>
          </div>

          <Badge
            variant="outline"
            className={
              form.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]"
                : "border-slate-200 bg-slate-100 text-slate-600 text-[11px]"
            }
          >
            {form.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* 4 Compact Tabs */}
        <div className="mt-3 flex gap-1 overflow-x-auto border-b border-slate-100 -mx-4 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-3 py-2 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Tab Body */}
      <div className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto p-5">
        {hasAttempts && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <strong>
                {selectedTest?.attemptCount} student attempt(s) recorded:
              </strong>{" "}
              Questions, duration, and marking scheme are locked. Duplicate the
              test to create a modified version.
            </div>
          </div>
        )}

        {mode === "edit" &&
          (selectedTest?.configurationWarnings?.length ?? 0) > 0 && (
            <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-3.5 text-amber-600" />
                Configuration Inconsistency Detected
              </div>
              {selectedTest?.configurationWarnings?.map((w, i) => (
                <div key={i}>• {w}</div>
              ))}
            </div>
          )}

        {activeTab === "details" && (
          <TestDetailsTab
            form={form}
            categories={categories}
            examConfig={examConfig}
            hasAttempts={hasAttempts}
            totalQuestions={totalQuestions}
            assignedCount={loadedQuestions.length}
            effectiveDuration={effectiveDuration}
            maxMarks={maxMarks}
            effectiveCorrectMarks={effectiveCorrectMarks}
            effectiveNegativeMarks={effectiveNegativeMarks}
            subjectAllocationTotal={subjectAllocationTotal}
            enabledSubjects={enabledSubjects}
            updateForm={updateForm}
            onRequestDefaultPattern={() => setConfirmDefaultOpen(true)}
          />
        )}

        {activeTab === "subjects" && (
          <TestSubjectsTab
            form={form}
            examConfig={examConfig}
            hasAttempts={hasAttempts}
            subjectAllocationTotal={subjectAllocationTotal}
            allocationErrors={allocationErrors}
            expandedSubjects={expandedSubjects}
            setExpandedSubjects={setExpandedSubjects}
            chapterSearch={chapterSearch}
            setChapterSearch={setChapterSearch}
            updateForm={updateForm}
          />
        )}

        {activeTab === "questions" && (
          <TestQuestionsTab
            form={form}
            examConfig={examConfig}
            hasAttempts={hasAttempts}
            totalQuestions={totalQuestions}
            loadedQuestions={loadedQuestions}
            setLoadedQuestions={setLoadedQuestions}
            selectedIdSet={selectedIdSet}
            generating={generating}
            shortages={shortages}
            allocationErrors={allocationErrors}
            replaceTargetId={replaceTargetId}
            setReplaceTargetId={setReplaceTargetId}
            bankQuery={bankQuery}
            setBankQuery={setBankQuery}
            bankSubject={bankSubject}
            setBankSubject={setBankSubject}
            bankChapter={bankChapter}
            setBankChapter={setBankChapter}
            bankDifficulty={bankDifficulty}
            setBankDifficulty={setBankDifficulty}
            bankPage={bankPage}
            setBankPage={setBankPage}
            bankItems={bankItems}
            bankTotal={bankTotal}
            bankTotalPages={bankTotalPages}
            bankLoading={bankLoading}
            availableChaptersForBank={availableChaptersForBank}
            onGenerateQuestions={handleGenerateQuestions}
            onBulkSelectPage={handleBulkSelectPage}
            onToggleManualQuestion={toggleManualQuestion}
            onPreviewQuestion={setPreviewQuestion}
            updateForm={updateForm}
          />
        )}

        {activeTab === "settings" && (
          <TestSettingsTab
            form={form}
            hasAttempts={hasAttempts}
            effectiveDuration={effectiveDuration}
            effectiveCorrectMarks={effectiveCorrectMarks}
            effectiveNegativeMarks={effectiveNegativeMarks}
            updateForm={updateForm}
          />
        )}
      </div>

      {/* Sticky Footer */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        {activationErrors.length > 0 && (
          <div className="mb-2 text-[11px] font-medium text-amber-700">
            {activationErrors[0]}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          {mode === "create" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelCreate}
                disabled={saving}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving || activationErrors.length > 0}
                onClick={() => void handleSave()}
                className="h-8 gap-1.5 rounded-xl bg-brand-blue px-3.5 text-xs font-semibold text-white hover:bg-brand-blue/90"
              >
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                Create Test
              </Button>
            </>
          ) : (
            <>
              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={saving}
                  className="h-8 rounded-xl text-xs"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!isDirty || saving}
                onClick={handleDiscard}
                className="h-8 rounded-xl text-xs"
              >
                Discard Changes
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!isDirty || saving || activationErrors.length > 0}
                onClick={() => void handleSave()}
                className="h-8 gap-1.5 rounded-xl bg-brand-blue px-3.5 text-xs font-semibold text-white hover:bg-brand-blue/90"
              >
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <TestEditorDialogs
        confirmDefaultOpen={confirmDefaultOpen}
        onConfirmDefaultOpenChange={setConfirmDefaultOpen}
        onApplyDefaultPattern={applyDefaultNeetPattern}
        previewQuestion={previewQuestion}
        onClosePreview={() => setPreviewQuestion(null)}
      />
    </div>
  );
});
