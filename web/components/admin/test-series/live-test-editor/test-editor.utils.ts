import type {
  ExamPatternConfigResponse,
  SubjectAllocationItem,
} from "../types";
import type { EditorFormState } from "./test-editor.types";

export function buildDefaultAllocations(
  examConfig: ExamPatternConfigResponse,
): SubjectAllocationItem[] {
  const resolvedByCode = new Map(
    examConfig.defaultPattern.resolvedSubjects.map((r) => [r.subjectCode, r]),
  );
  const uniqueSubjects = Array.from(
    new Map(examConfig.subjects.map((s) => [s.subjectCode, s])).values(),
  );
  return uniqueSubjects.map((sub) => {
    const rule = resolvedByCode.get(sub.subjectCode);
    const count = rule?.questionCount ?? 0;
    return {
      courseSubjectId: sub.courseSubjectId,
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      enabled: count > 0,
      chapterMode: "ALL",
      chapterAllocationMode: "AUTOMATIC",
      questionCount: count,
      chapterIds: sub.chapters.map((c) => c.id),
      chapterAllocations: [],
    };
  });
}

export function buildEmptyAllocations(
  examConfig: ExamPatternConfigResponse,
): SubjectAllocationItem[] {
  const uniqueSubjects = Array.from(
    new Map(examConfig.subjects.map((s) => [s.subjectCode, s])).values(),
  );
  return uniqueSubjects.map((sub) => ({
    courseSubjectId: sub.courseSubjectId,
    subjectCode: sub.subjectCode,
    subjectName: sub.subjectName,
    enabled: false,
    chapterMode: "ALL",
    chapterAllocationMode: "AUTOMATIC",
    questionCount: 0,
    chapterIds: sub.chapters.map((c) => c.id),
    chapterAllocations: [],
  }));
}

export function createInitialState(
  examConfig: ExamPatternConfigResponse,
  categoryId: string,
): EditorFormState {
  return {
    title: "",
    categoryId,
    description: "",
    isActive: true,
    showScheduling: false,
    scheduledAt: "",
    availableUntil: "",
    examPatternMode: "DEFAULT_NEET",
    questionSelectionMode: "AUTOMATIC",
    durationMode: "AUTOMATIC",
    manualDuration: examConfig.defaultPattern.durationMinutes,
    correctMarks: examConfig.defaultPattern.correctMarks,
    negativeMarks: examConfig.defaultPattern.negativeMarks,
    hasNegativeMarking: true,
    randomizeQuestions: true,
    maxAttempts: 1,
    subjectAllocations: buildDefaultAllocations(examConfig),
    questionIds: [],
  };
}
