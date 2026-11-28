import type {
  ExamPatternConfigResponse,
  SubjectAllocationItem,
} from "../types";
import type { EditorFormState } from "./test-editor.types";

export interface EditorMetrics {
  enabledSubjects: SubjectAllocationItem[];
  subjectAllocationTotal: number;
  totalQuestions: number;
  calculatedDuration: number;
  effectiveDuration: number;
  effectiveCorrectMarks: number;
  effectiveNegativeMarks: number;
  maxMarks: number;
}

export function computeEditorMetrics(
  form: EditorFormState | null,
  examConfig: ExamPatternConfigResponse | null,
  legacyTotalQuestions: number | null,
): EditorMetrics {
  const enabledSubjects = form
    ? form.subjectAllocations.filter((s) => s.enabled && s.questionCount > 0)
    : [];

  const subjectAllocationTotal = enabledSubjects.reduce(
    (sum, s) => sum + (s.questionCount || 0),
    0,
  );

  let totalQuestions = 0;
  if (form && examConfig) {
    if (form.examPatternMode === "DEFAULT_NEET") {
      totalQuestions = examConfig.defaultPattern.totalQuestions;
    } else if (subjectAllocationTotal > 0) {
      totalQuestions = subjectAllocationTotal;
    } else {
      totalQuestions = legacyTotalQuestions ?? 0;
    }
  }

  const calculatedDuration =
    examConfig && totalQuestions > 0
      ? Math.max(
          1,
          Math.round(
            (totalQuestions * examConfig.defaultPattern.durationMinutes) /
              examConfig.defaultPattern.totalQuestions,
          ),
        )
      : 0;

  const effectiveDuration = !form
    ? 0
    : form.examPatternMode === "DEFAULT_NEET" ||
        form.durationMode === "AUTOMATIC"
      ? calculatedDuration
      : form.manualDuration;

  const effectiveCorrectMarks =
    !form || !examConfig
      ? 4
      : form.examPatternMode === "DEFAULT_NEET"
        ? examConfig.defaultPattern.correctMarks
        : form.correctMarks;

  let effectiveNegativeMarks = 1;
  if (form && examConfig) {
    if (form.examPatternMode === "DEFAULT_NEET") {
      effectiveNegativeMarks = examConfig.defaultPattern.negativeMarks;
    } else {
      effectiveNegativeMarks = form.hasNegativeMarking ? form.negativeMarks : 0;
    }
  }

  return {
    enabledSubjects,
    subjectAllocationTotal,
    totalQuestions,
    calculatedDuration,
    effectiveDuration,
    effectiveCorrectMarks,
    effectiveNegativeMarks,
    maxMarks: totalQuestions * effectiveCorrectMarks,
  };
}

export function validateSubjectAllocations(
  form: EditorFormState | null,
): string[] {
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
}

export function validateTestActivation(
  form: EditorFormState | null,
  metrics: EditorMetrics,
  allocationErrors: string[],
  assignedCount: number,
): string[] {
  if (!form) return [];
  const errs: string[] = [];
  if (!form.title.trim()) errs.push("Test name is required.");
  if (!form.categoryId) errs.push("Category is required.");
  if (metrics.totalQuestions <= 0) {
    errs.push("Total questions must be greater than 0.");
  }
  if (metrics.effectiveDuration <= 0) {
    errs.push("Duration must be greater than 0 minutes.");
  }
  if (metrics.effectiveCorrectMarks <= 0) {
    errs.push("Correct answer marks must be > 0.");
  }
  if (allocationErrors.length > 0) errs.push(...allocationErrors);
  if (form.isActive && assignedCount !== metrics.totalQuestions) {
    errs.push(
      `To keep this test Active, assign all ${metrics.totalQuestions} questions (currently ${assignedCount}).`,
    );
  }
  return errs;
}

export function buildSaveTestPayload(
  form: EditorFormState,
  examConfig: ExamPatternConfigResponse,
  metrics: EditorMetrics,
  hasAttempts: boolean,
): Record<string, unknown> {
  return {
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
          durationMinutes: metrics.effectiveDuration,
          totalQuestions: metrics.totalQuestions,
          correctMarks: metrics.effectiveCorrectMarks,
          negativeMarks: metrics.effectiveNegativeMarks,
          hasNegativeMarking:
            form.examPatternMode === "DEFAULT_NEET"
              ? true
              : form.hasNegativeMarking,
          randomizeQuestions: form.randomizeQuestions,
          maxAttempts: form.maxAttempts,
          subjectDistribution: metrics.enabledSubjects,
          questionIds: form.questionIds,
        }),
  };
}
