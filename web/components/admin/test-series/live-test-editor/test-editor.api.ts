import type {
  ExamPatternConfigResponse,
  ExamPatternMode,
  QuestionShortageDetail,
  SelectedQuestionItem,
  SubjectAllocationItem,
} from "../types";
import type { EditorFormState, EditorMode } from "./test-editor.types";
import { buildEmptyAllocations } from "./test-editor.utils";

export interface LoadedTestDetailResult {
  form: EditorFormState;
  questions: SelectedQuestionItem[];
  legacyTotalQuestions: number | null;
}

interface RawDetailQuestion {
  question: SelectedQuestionItem & {
    courseSubject?: { subject?: { code: string; name: string } };
    chapter?: { id: string; title: string } | null;
  };
}

export async function fetchTestDetail(
  testId: string,
  examConfig: ExamPatternConfigResponse,
  fallbackCategoryId: string,
  signal: AbortSignal,
): Promise<LoadedTestDetailResult> {
  const res = await fetch(
    `/api/admin/test-series/tests/${encodeURIComponent(testId)}`,
    { cache: "no-store", signal },
  );
  if (!res.ok) {
    throw new Error("Failed to load test configuration");
  }
  const detail = await res.json();

  const hasSavedDistribution =
    Array.isArray(detail.subjectDistribution) &&
    detail.subjectDistribution.length > 0;

  let allocations: SubjectAllocationItem[];
  if (hasSavedDistribution) {
    const savedMap = new Map(
      (detail.subjectDistribution as SubjectAllocationItem[]).map((s) => [
        s.courseSubjectId,
        s,
      ]),
    );
    allocations = buildEmptyAllocations(examConfig).map((base) => {
      const saved = savedMap.get(base.courseSubjectId);
      if (!saved) return base;
      return {
        ...base,
        enabled: (saved.questionCount ?? 0) > 0,
        chapterMode: saved.chapterMode ?? "ALL",
        chapterAllocationMode: saved.chapterAllocationMode ?? "AUTOMATIC",
        questionCount: saved.questionCount ?? 0,
        chapterIds: saved.chapterIds ?? base.chapterIds,
        chapterAllocations: saved.chapterAllocations ?? [],
      };
    });
  } else {
    allocations = buildEmptyAllocations(examConfig);
  }

  const mappedQuestions: SelectedQuestionItem[] = Array.isArray(detail.questions)
    ? (detail.questions as RawDetailQuestion[]).map((item) => ({
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
          item.question.chapter?.title ?? item.question.chapterTitle ?? null,
      }))
    : [];

  const effectivePatternMode: ExamPatternMode =
    !hasSavedDistribution &&
    detail.totalQuestions !== examConfig.defaultPattern.totalQuestions
      ? "MANUAL"
      : (detail.examPatternMode ?? "DEFAULT_NEET");

  const form: EditorFormState = {
    title: detail.title ?? "",
    categoryId: detail.categoryId ?? fallbackCategoryId,
    description: detail.description ?? "",
    isActive: Boolean(detail.isActive),
    showScheduling: Boolean(detail.scheduledAt || detail.availableUntil),
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
      detail.durationMinutes ?? examConfig.defaultPattern.durationMinutes,
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

  return {
    form,
    questions: mappedQuestions,
    legacyTotalQuestions: hasSavedDistribution ? null : detail.totalQuestions,
  };
}

export interface SearchBankQuestionsParams {
  page: number;
  subjectCode: string;
  chapterId: string;
  difficulty: string;
  query: string;
}

export async function searchBankQuestions(
  params: SearchBankQuestionsParams,
): Promise<{
  items: SelectedQuestionItem[];
  totalPages: number;
  total: number;
}> {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: "12",
    subjectCode: params.subjectCode,
    chapterId: params.chapterId,
    difficulty: params.difficulty,
    type: "SINGLE_CORRECT",
  });
  if (params.query.trim()) qs.set("query", params.query.trim());

  const res = await fetch(
    `/api/admin/test-series/questions/search?${qs.toString()}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    return { items: [], totalPages: 1, total: 0 };
  }
  const data = await res.json();
  return {
    items: data.items ?? [],
    totalPages: data.totalPages ?? 1,
    total: data.total ?? 0,
  };
}

export async function generateTestQuestions(
  subjectAllocations: SubjectAllocationItem[],
): Promise<{
  questions: SelectedQuestionItem[];
  shortages: QuestionShortageDetail[];
}> {
  const res = await fetch("/api/admin/test-series/questions/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subjectAllocations }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to generate questions");
  }
  return {
    questions: data.questions ?? [],
    shortages: Array.isArray(data.shortages) ? data.shortages : [],
  };
}

export async function saveTestConfiguration(
  mode: Exclude<EditorMode, "empty">,
  testId: string | undefined,
  payload: Record<string, unknown>,
): Promise<{ id?: string }> {
  const isCreate = mode === "create";
  const url = isCreate
    ? "/api/admin/test-series/tests"
    : `/api/admin/test-series/tests/${encodeURIComponent(testId ?? "")}`;

  const res = await fetch(url, {
    method: isCreate ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to save test");
  }
  return data;
}
