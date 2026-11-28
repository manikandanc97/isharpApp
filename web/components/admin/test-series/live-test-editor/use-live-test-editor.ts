import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  QuestionShortageDetail,
  SelectedQuestionItem,
} from "../types";
import {
  fetchTestDetail,
  generateTestQuestions,
  saveTestConfiguration,
  searchBankQuestions,
} from "./test-editor.api";
import type {
  EditorFormState,
  EditorTab,
  LiveTestEditorProps,
} from "./test-editor.types";
import {
  buildDefaultAllocations,
  createInitialState,
} from "./test-editor.utils";
import {
  buildSaveTestPayload,
  computeEditorMetrics,
  validateSubjectAllocations,
  validateTestActivation,
} from "./test-editor.validation";

export function useLiveTestEditor({
  mode,
  selectedTest,
  categories,
  selectedCategoryId,
  examConfig,
  onDirtyChange,
  onSaved,
  onError,
}: Pick<
  LiveTestEditorProps,
  | "mode"
  | "selectedTest"
  | "categories"
  | "selectedCategoryId"
  | "examConfig"
  | "onDirtyChange"
  | "onSaved"
  | "onError"
>) {
  const [activeTab, setActiveTab] = useState<EditorTab>("details");
  const [form, setForm] = useState<EditorFormState | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [loadedQuestions, setLoadedQuestions] = useState<
    SelectedQuestionItem[]
  >([]);
  const [savedQuestionsSnapshot, setSavedQuestionsSnapshot] = useState<
    SelectedQuestionItem[]
  >([]);
  const [legacyTotalQuestions, setLegacyTotalQuestions] = useState<
    number | null
  >(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDefaultOpen, setConfirmDefaultOpen] = useState(false);

  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<string, boolean>
  >({});
  const [chapterSearch, setChapterSearch] = useState<Record<string, string>>(
    {},
  );

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

  useEffect(() => {
    abortRef.current?.abort();

    if (!examConfig || mode === "empty") {
      const timer = window.setTimeout(() => {
        setForm(null);
        setSavedSnapshot("");
        setLoadedQuestions([]);
        setSavedQuestionsSnapshot([]);
        setLegacyTotalQuestions(null);
        setShortages([]);
        setReplaceTargetId(null);
        onDirtyChange(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (mode === "create") {
      const timer = window.setTimeout(() => {
        const next = createInitialState(
          examConfig,
          selectedCategoryId ?? categories[0]?.id ?? "",
        );
        setForm(next);
        setSavedSnapshot(JSON.stringify(next));
        setLoadedQuestions([]);
        setSavedQuestionsSnapshot([]);
        setLegacyTotalQuestions(null);
        setShortages([]);
        setReplaceTargetId(null);
        setActiveTab("details");
        onDirtyChange(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (mode === "edit" && selectedTest?.id) {
      const controller = new AbortController();
      abortRef.current = controller;

      const timer = window.setTimeout(() => {
        setLoadingDetail(true);
        setShortages([]);
        setReplaceTargetId(null);

        const fallbackCategoryId =
          selectedTest.categoryId ?? selectedCategoryId ?? "";

        fetchTestDetail(
          selectedTest.id,
          examConfig,
          fallbackCategoryId,
          controller.signal,
        )
          .then((result) => {
            if (controller.signal.aborted) return;
            setForm(result.form);
            setSavedSnapshot(JSON.stringify(result.form));
            setLoadedQuestions(result.questions);
            setSavedQuestionsSnapshot(result.questions);
            setLegacyTotalQuestions(result.legacyTotalQuestions);
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

  const metrics = useMemo(
    () => computeEditorMetrics(form, examConfig, legacyTotalQuestions),
    [form, examConfig, legacyTotalQuestions],
  );

  const allocationErrors = useMemo(
    () => validateSubjectAllocations(form),
    [form],
  );

  const activationErrors = useMemo(
    () =>
      validateTestActivation(
        form,
        metrics,
        allocationErrors,
        loadedQuestions.length,
      ),
    [form, metrics, allocationErrors, loadedQuestions.length],
  );

  const loadBankQuestions = useCallback(async () => {
    setBankLoading(true);
    try {
      const data = await searchBankQuestions({
        page: bankPage,
        subjectCode: bankSubject,
        chapterId: bankChapter,
        difficulty: bankDifficulty,
        query: bankQuery,
      });
      setBankItems(data.items);
      setBankTotalPages(data.totalPages);
      setBankTotal(data.total);
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
  }, [
    activeTab,
    form?.questionSelectionMode,
    replaceTargetId,
    loadBankQuestions,
  ]);

  const handleGenerateQuestions = useCallback(async () => {
    if (!form || allocationErrors.length > 0) {
      if (allocationErrors.length > 0) onError(allocationErrors[0]);
      return;
    }
    if (metrics.enabledSubjects.length === 0) {
      onError("Enable at least one subject in Subjects & Chapters first.");
      return;
    }
    setGenerating(true);
    setShortages([]);
    try {
      const data = await generateTestQuestions(metrics.enabledSubjects);
      if (data.shortages.length > 0) {
        setShortages(data.shortages);
      } else {
        setShortages([]);
        setLoadedQuestions(data.questions);
        updateForm((prev) => ({
          ...prev,
          questionIds: data.questions.map((q) => q.id),
        }));
      }
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to generate questions",
      );
    } finally {
      setGenerating(false);
    }
  }, [form, allocationErrors, metrics.enabledSubjects, onError, updateForm]);

  const selectedIdSet = useMemo(
    () => new Set(loadedQuestions.map((q) => q.id)),
    [loadedQuestions],
  );

  const toggleManualQuestion = useCallback(
    (q: SelectedQuestionItem) => {
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
        if (loadedQuestions.length >= metrics.totalQuestions) {
          onError(`Already selected ${metrics.totalQuestions} questions.`);
          return;
        }
        const next = [...loadedQuestions, q];
        setLoadedQuestions(next);
        updateForm((prev) => ({ ...prev, questionIds: next.map((i) => i.id) }));
      }
    },
    [
      hasAttempts,
      form,
      replaceTargetId,
      loadedQuestions,
      selectedIdSet,
      metrics.totalQuestions,
      onError,
      updateForm,
    ],
  );

  const handleBulkSelectPage = useCallback(() => {
    if (hasAttempts || !form) return;
    const existing = new Set(loadedQuestions.map((q) => q.id));
    const next = [...loadedQuestions];
    for (const item of bankItems) {
      if (next.length >= metrics.totalQuestions) break;
      if (!existing.has(item.id)) {
        existing.add(item.id);
        next.push(item);
      }
    }
    setLoadedQuestions(next);
    updateForm((prev) => ({ ...prev, questionIds: next.map((i) => i.id) }));
  }, [
    hasAttempts,
    form,
    loadedQuestions,
    bankItems,
    metrics.totalQuestions,
    updateForm,
  ]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!form || !examConfig || mode === "empty") return false;
    if (activationErrors.length > 0) {
      onError(activationErrors[0]);
      return false;
    }
    setSaving(true);
    try {
      const payload = buildSaveTestPayload(
        form,
        examConfig,
        metrics,
        hasAttempts,
      );
      const data = await saveTestConfiguration(
        mode,
        selectedTest?.id,
        payload,
      );

      setSavedSnapshot(JSON.stringify(form));
      setSavedQuestionsSnapshot(loadedQuestions);
      onDirtyChange(false);
      const isCreate = mode === "create";
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
    mode,
    activationErrors,
    metrics,
    hasAttempts,
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

  const applyDefaultNeetPattern = useCallback(() => {
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
  }, [examConfig, updateForm]);

  const availableChaptersForBank = useMemo(() => {
    if (!examConfig || bankSubject === "ALL") return [];
    return (
      examConfig.subjects.find((s) => s.subjectCode === bankSubject)?.chapters ??
      []
    );
  }, [bankSubject, examConfig]);

  return {
    activeTab,
    setActiveTab,
    form,
    loadedQuestions,
    setLoadedQuestions,
    loadingDetail,
    saving,
    confirmDefaultOpen,
    setConfirmDefaultOpen,
    expandedSubjects,
    setExpandedSubjects,
    chapterSearch,
    setChapterSearch,
    shortages,
    generating,
    bankQuery,
    setBankQuery,
    bankSubject,
    setBankSubject,
    bankChapter,
    setBankChapter,
    bankDifficulty,
    setBankDifficulty,
    bankPage,
    setBankPage,
    bankTotalPages,
    bankTotal,
    bankItems,
    bankLoading,
    previewQuestion,
    setPreviewQuestion,
    replaceTargetId,
    setReplaceTargetId,
    hasAttempts,
    isDirty,
    updateForm,
    metrics,
    allocationErrors,
    activationErrors,
    selectedIdSet,
    availableChaptersForBank,
    handleGenerateQuestions,
    toggleManualQuestion,
    handleBulkSelectPage,
    handleSave,
    handleDiscard,
    applyDefaultNeetPattern,
  };
}
