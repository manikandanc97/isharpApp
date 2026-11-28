import type { ShuffledOptionMapping } from '../demo-test.types.js';

export interface DemoAttemptQuestionRecord {
  id: string;
  selectedOptionId: string | null;
  numericalAnswer: string | null;
  isMarkedForReview: boolean;
  isVisited: boolean;
  timeSpentSeconds: number;
  correctMarks: number;
  negativeMarks: number;
  isCorrect: boolean | null;
  marksAwarded: number | null;
  optionOrderJson: unknown;
  question: {
    id: string;
    externalId: string;
    type: string;
    difficulty: string;
    textEn: string | null;
    textTa: string | null;
    questionImageUrl: string | null;
    solutionEn: string | null;
    solutionTa: string | null;
    solutionImageUrl: string | null;
    numericalAnswer: string | null;
    chapter: { id?: string; title: string } | null;
    courseSubject: {
      subject: { code: string; name: string } | null;
    } | null;
    options: Array<{
      id: string;
      textEn: string | null;
      textTa: string | null;
      imageUrl: string | null;
      isCorrect: boolean;
    }>;
  };
}

export function buildDemoClientAttemptPayload(
  attempt: {
    id: string;
    status: string;
    isPreview: boolean;
    title: string;
    code: string;
    instructionsEn: string | null;
    instructionsTa: string | null;
    subjectMode: string;
    languageMode: string;
    durationMinutes: number;
    maxMarks: number;
    questionCount: number;
    startedAt: Date;
    expiresAt: Date;
    controlledReuseUsed: boolean;
    resultSnapshot: unknown;
    questions: DemoAttemptQuestionRecord[];
  },
  isFinished: boolean,
): Record<string, unknown> {
  const subjectCounts = new Map<
    string,
    { name: string; code: string; count: number }
  >();

  const questions = attempt.questions.map((aq) => {
    const q = aq.question;
    const subjCode = q.courseSubject?.subject?.code ?? 'GENERAL';
    const subjName = q.courseSubject?.subject?.name ?? 'General';
    const existingSubj = subjectCounts.get(subjCode);
    if (existingSubj) existingSubj.count += 1;
    else {
      subjectCounts.set(subjCode, { name: subjName, code: subjCode, count: 1 });
    }

    const mappings = (
      Array.isArray(aq.optionOrderJson) ? aq.optionOrderJson : []
    ) as unknown as ShuffledOptionMapping[];
    const optionById = new Map(q.options.map((o) => [o.id, o]));

    const orderedOptions = mappings
      .map((m) => {
        const opt = optionById.get(m.canonicalOptionId);
        if (!opt) return null;
        return {
          id: opt.id,
          label: m.displayedLabel,
          textEn: opt.textEn ?? '',
          textTa: opt.textTa,
          imageUrl: opt.imageUrl,
          position: m.shuffledPosition,
          ...(isFinished ? { isCorrect: opt.isCorrect } : {}),
        };
      })
      .filter((o): o is NonNullable<typeof o> => o !== null);

    return {
      id: q.id,
      externalId: q.externalId,
      type: q.type,
      subject: subjName,
      subjectCode: subjCode,
      chapterTitle: q.chapter?.title ?? null,
      difficulty: q.difficulty,
      textEn: q.textEn ?? '',
      textTa: q.textTa,
      questionImageUrl: q.questionImageUrl,
      correctMarks: aq.correctMarks,
      negativeMarks: aq.negativeMarks,
      options: orderedOptions,
      savedState: {
        selectedOptionId: aq.selectedOptionId,
        numericalAnswer: aq.numericalAnswer,
        isMarkedForReview: aq.isMarkedForReview,
        isVisited: aq.isVisited,
        timeSpentSeconds: aq.timeSpentSeconds,
      },
      ...(isFinished
        ? {
            solutionEn: q.solutionEn,
            solutionTa: q.solutionTa,
            solutionImageUrl: q.solutionImageUrl,
            correctNumericalAnswer: q.numericalAnswer,
            isCorrect: aq.isCorrect,
            marksAwarded: aq.marksAwarded,
          }
        : {}),
    };
  });

  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000),
  );

  return {
    attemptId: attempt.id,
    testId: attempt.id,
    status: attempt.status,
    isPreview: attempt.isPreview,
    title: attempt.title,
    code: attempt.code,
    instructionsEn: attempt.instructionsEn ?? '',
    instructionsTa: attempt.instructionsTa ?? '',
    subjectMode: attempt.subjectMode,
    languageMode: attempt.languageMode,
    durationMinutes: attempt.durationMinutes,
    totalMarks: attempt.maxMarks,
    questionCount: attempt.questionCount,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt.toISOString(),
    remainingSeconds,
    controlledReuseUsed: attempt.controlledReuseUsed,
    subjects: Array.from(subjectCounts.values()),
    questions,
    ...(isFinished && attempt.resultSnapshot
      ? { result: attempt.resultSnapshot }
      : {}),
  };
}

export function evaluateDemoAttemptQuestions(
  attempt: {
    id: string;
    questionCount: number;
    maxMarks: number;
    questions: DemoAttemptQuestionRecord[];
  },
  elapsedSeconds: number,
) {
  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const subjectStatsMap = new Map<
    string,
    {
      subjectName: string;
      subjectCode: string;
      total: number;
      attempted: number;
      correct: number;
      wrong: number;
      skipped: number;
      marksObtained: number;
      maxMarks: number;
      accuracy: number;
      timeSpentSeconds: number;
    }
  >();

  const chapterStatsMap = new Map<
    string,
    {
      chapterTitle: string;
      total: number;
      correct: number;
      wrong: number;
      skipped: number;
    }
  >();

  const questionUpdates: Array<{
    id: string;
    isCorrect: boolean | null;
    marksAwarded: number;
  }> = [];

  for (const aq of attempt.questions) {
    const q = aq.question;
    const subjCode = q.courseSubject?.subject?.code ?? 'GENERAL';
    const subjName = q.courseSubject?.subject?.name ?? 'General';
    if (!subjectStatsMap.has(subjCode)) {
      subjectStatsMap.set(subjCode, {
        subjectName: subjName,
        subjectCode: subjCode,
        total: 0,
        attempted: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        marksObtained: 0,
        maxMarks: 0,
        accuracy: 0,
        timeSpentSeconds: 0,
      });
    }
    const sStat = subjectStatsMap.get(subjCode)!;
    sStat.total += 1;
    sStat.maxMarks += aq.correctMarks;
    sStat.timeSpentSeconds += aq.timeSpentSeconds;

    const chTitle = q.chapter?.title ?? null;
    if (chTitle && !chapterStatsMap.has(chTitle)) {
      chapterStatsMap.set(chTitle, {
        chapterTitle: chTitle,
        total: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
      });
    }
    const cStat = chTitle ? chapterStatsMap.get(chTitle)! : null;
    if (cStat) cStat.total += 1;

    const hasAttempted =
      q.type === 'NUMERICAL'
        ? Boolean(aq.numericalAnswer?.trim())
        : Boolean(aq.selectedOptionId);

    if (!hasAttempted) {
      unansweredCount += 1;
      sStat.skipped += 1;
      if (cStat) cStat.skipped += 1;
      questionUpdates.push({ id: aq.id, isCorrect: null, marksAwarded: 0 });
      continue;
    }

    sStat.attempted += 1;
    let isCorrect = false;
    if (q.type === 'NUMERICAL') {
      isCorrect =
        (aq.numericalAnswer?.trim() ?? '') ===
        (q.numericalAnswer?.trim() ?? '');
    } else {
      const chosenOpt = q.options.find((o) => o.id === aq.selectedOptionId);
      isCorrect = Boolean(chosenOpt?.isCorrect);
    }

    const marksAwarded = isCorrect ? aq.correctMarks : -aq.negativeMarks;
    totalScore += marksAwarded;
    sStat.marksObtained += marksAwarded;

    if (isCorrect) {
      correctCount += 1;
      sStat.correct += 1;
      if (cStat) cStat.correct += 1;
    } else {
      incorrectCount += 1;
      sStat.wrong += 1;
      if (cStat) cStat.wrong += 1;
    }
    questionUpdates.push({ id: aq.id, isCorrect, marksAwarded });
  }

  const attempted = correctCount + incorrectCount;
  const accuracy =
    attempted > 0 ? Math.round((correctCount / attempted) * 1000) / 10 : 0;
  const percentage =
    attempt.maxMarks > 0
      ? Math.max(0, Math.round((totalScore / attempt.maxMarks) * 1000) / 10)
      : 0;

  const subjectStats = Array.from(subjectStatsMap.values()).map((s) => ({
    ...s,
    accuracy:
      s.attempted > 0 ? Math.round((s.correct / s.attempted) * 1000) / 10 : 0,
  }));

  const resultSnapshot = {
    testId: attempt.id,
    totalQuestions: attempt.questionCount,
    attempted,
    correctCount,
    wrongCount: incorrectCount,
    skippedCount: unansweredCount,
    totalScore,
    maxScore: attempt.maxMarks,
    percentage,
    accuracy,
    totalTimeSpentSeconds: elapsedSeconds,
    subjectStats,
    chapterStats: Array.from(chapterStatsMap.values()),
  };

  return {
    totalScore,
    correctCount,
    incorrectCount,
    unansweredCount,
    accuracy,
    percentage,
    questionUpdates,
    resultSnapshot,
  };
}
