import type {
  AttemptQuestionEvaluationInput,
  EvaluationResultSummary,
} from '../examination-evaluation.helper.js';

export interface EvaluatableAttemptQuestion {
  questionId: string;
  position: number;
  section: string;
  correctMarks: number;
  negativeMarks: number;
  isDropped: boolean;
  question: {
    numericalAnswer?: string | null;
    options: Array<{ id: string; isCorrect: boolean }>;
    courseSubject?: { subject?: { code: string } | null } | null;
  };
}

export interface ExistingAttemptAnswerRef {
  questionId: string;
  selectedOptionId?: string | null;
  numericalAnswer?: string | null;
}

/**
 * Maps attempt questions and saved answers into scoring engine inputs.
 */
export function buildAttemptQuestionEvalInputs(
  questions: EvaluatableAttemptQuestion[],
  answersByQuestionId: Map<string, ExistingAttemptAnswerRef>,
): AttemptQuestionEvaluationInput[] {
  return questions.map((aq) => {
    const ans = answersByQuestionId.get(aq.questionId);
    const correctOpt = aq.question.options.find((o) => o.isCorrect);

    return {
      questionId: aq.questionId,
      position: aq.position,
      section: aq.section,
      correctMarks: aq.correctMarks,
      negativeMarks: aq.negativeMarks,
      isDropped: aq.isDropped,
      selectedOptionId: ans?.selectedOptionId,
      numericalAnswer: ans?.numericalAnswer,
      canonicalCorrectOptionId: correctOpt?.id || null,
      canonicalNumericalAnswer: aq.question.numericalAnswer || null,
      subjectCode: aq.question.courseSubject?.subject?.code,
    };
  });
}

/**
 * Builds the shared Prisma upsert payload for `TestResult` across online,
 * recalculation, and offline examination evaluation flows.
 */
export function buildTestResultPersistencePayload(
  attemptId: string,
  assessmentTestId: string,
  studentProfileId: string,
  evaluation: EvaluationResultSummary,
  calculatedAt: Date,
) {
  const sharedFields = {
    totalMarksScored: evaluation.totalMarksScored,
    maxMarks: evaluation.maxMarks,
    percentage: evaluation.percentage,
    accuracyPercentage: evaluation.accuracyPercentage,
    correctCount: evaluation.correctCount,
    incorrectCount: evaluation.incorrectCount,
    unansweredCount: evaluation.unansweredCount,
    physicsScore: evaluation.physicsScore,
    chemistryScore: evaluation.chemistryScore,
    biologyScore: evaluation.biologyScore,
    botanyScore: evaluation.botanyScore,
    zoologyScore: evaluation.zoologyScore,
    subjectBreakdown: evaluation.subjectBreakdown,
    calculatedAt,
  };

  return {
    where: { attemptId },
    create: {
      attemptId,
      assessmentTestId,
      studentProfileId,
      ...sharedFields,
    },
    update: sharedFields,
  };
}

/**
 * Groups `isCorrect`/`marksAwarded` updates by outcome bucket so existing
 * autosaved answer rows are updated in a few `updateMany` calls without
 * touching `selectedOptionId`, `numericalAnswer`, or `answeredAt`.
 */
export async function batchUpdateEvaluatedAnswerScores(
  tx: {
    attemptAnswer: {
      updateMany: (args: {
        where: { attemptId: string; questionId: { in: string[] } };
        data: { isCorrect: boolean; marksAwarded: number };
      }) => Promise<unknown>;
    };
  },
  attemptId: string,
  answers: Array<{ questionId: string; isCorrect: boolean; marksAwarded: number }>,
) {
  const buckets = new Map<
    string,
    { isCorrect: boolean; marksAwarded: number; questionIds: string[] }
  >();

  for (const a of answers) {
    const key = `${a.isCorrect ? '1' : '0'}:${a.marksAwarded}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        isCorrect: a.isCorrect,
        marksAwarded: a.marksAwarded,
        questionIds: [],
      };
      buckets.set(key, bucket);
    }
    bucket.questionIds.push(a.questionId);
  }

  for (const bucket of buckets.values()) {
    await tx.attemptAnswer.updateMany({
      where: {
        attemptId,
        questionId: { in: bucket.questionIds },
      },
      data: {
        isCorrect: bucket.isCorrect,
        marksAwarded: bucket.marksAwarded,
      },
    });
  }
}
