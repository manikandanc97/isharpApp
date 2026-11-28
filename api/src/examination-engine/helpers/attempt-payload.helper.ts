import { normalizeOptionLabel } from '../../common/utils/option-label.util.js';

/**
 * Formats an active or resumed attempt payload for the student exam runner.
 * CRITICAL SECURITY RULE: Never includes `isCorrect`, `solutionEn`, `solutionTa`, or `solutionImageUrl`.
 */
export function formatSanitizedAttempt(attempt: any, test: any) {
  const now = Date.now();
  const expiresAtMs = attempt.expiresAt.getTime();
  const secondsRemaining = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

  const answersMap = new Map(
    (attempt.answers || []).map((a: any) => [
      a.questionId,
      {
        selectedOptionId: a.selectedOptionId,
        numericalAnswer: a.numericalAnswer,
        isMarkedForReview: a.isMarkedForReview,
        isVisited: a.isVisited,
        timeSpentSeconds: a.timeSpentSeconds,
      },
    ]),
  );

  const subjectsMap = new Map<
    string,
    { name: string; code: string; count: number }
  >();

  const sanitizedQuestions = attempt.questions.map((aq: any) => {
    const q = aq.question;
    const subName = q.courseSubject?.subject?.name || 'General';
    const subCode = q.courseSubject?.subject?.code || 'GEN';

    if (!subjectsMap.has(subCode)) {
      subjectsMap.set(subCode, { name: subName, code: subCode, count: 0 });
    }
    subjectsMap.get(subCode)!.count++;

    const optMapByCanonical = new Map<string, any>(
      aq.optionMappings.map((m: any) => [m.canonicalOptionId, m]),
    );

    const mappedOptions = q.options.map((opt: any) => {
      const mapping = optMapByCanonical.get(opt.id);
      const fallbackLabel = normalizeOptionLabel(opt.label) || opt.label;
      return {
        id: opt.id,
        label: mapping ? mapping.displayedLabel : fallbackLabel,
        position: mapping ? mapping.shuffledPosition : opt.position,
        textEn: opt.textEn,
        textTa: opt.textTa,
        imageUrl: opt.imageUrl,
      };
    });

    mappedOptions.sort((a: any, b: any) => a.position - b.position);

    const savedAnswer = answersMap.get(q.id);

    return {
      id: q.id,
      position: aq.position,
      section: aq.section,
      subject: subName,
      subjectCode: subCode,
      chapterTitle: q.chapter?.title || null,
      difficulty: q.difficulty,
      type: q.type,
      textEn: q.textEn,
      textTa: q.textTa,
      questionImageUrl: q.questionImageUrl,
      correctMarks: aq.correctMarks,
      negativeMarks: aq.negativeMarks,
      options: mappedOptions,
      savedAnswer: savedAnswer || null,
    };
  });

  return {
    attemptId: attempt.id,
    testId: test.id,
    title: test.title,
    code: test.code,
    instructionsEn: test.instructionsEn,
    instructionsTa: test.instructionsTa,
    durationMinutes: test.durationMinutes,
    totalMarks: test.totalMarks,
    totalQuestions: sanitizedQuestions.length,
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: attempt.expiresAt.toISOString(),
    secondsRemaining,
    subjects: Array.from(subjectsMap.values()),
    questions: sanitizedQuestions,
  };
}

export function formatAttemptResultResponse(result: any) {
  const answersByQ = new Map<string, any>(
    result.attempt.answers.map((a: any) => [a.questionId, a]),
  );

  return {
    attemptId: result.attemptId,
    test: result.assessmentTest,
    score: result.totalMarksScored,
    maxMarks: result.maxMarks,
    percentage: result.percentage,
    accuracy: result.accuracyPercentage,
    correctCount: result.correctCount,
    incorrectCount: result.incorrectCount,
    unansweredCount: result.unansweredCount,
    physicsScore: result.physicsScore,
    chemistryScore: result.chemistryScore,
    biologyScore: result.biologyScore,
    botanyScore: result.botanyScore,
    zoologyScore: result.zoologyScore,
    subjectBreakdown: result.subjectBreakdown,
    calculatedAt: result.calculatedAt.toISOString(),
    review: result.assessmentTest.showResultsImmediately
      ? result.attempt.questions.map((aq: any) => {
          const userAns = answersByQ.get(aq.questionId);
          return {
            position: aq.position,
            questionId: aq.questionId,
            textEn: aq.question.textEn,
            textTa: aq.question.textTa,
            questionImageUrl: aq.question.questionImageUrl,
            solutionEn: aq.question.solutionEn,
            solutionTa: aq.question.solutionTa,
            solutionImageUrl: aq.question.solutionImageUrl,
            options: aq.question.options.map((o: any, optIdx: number) => {
              const normalized = normalizeOptionLabel(o.label);
              const label = /^[0-9]+$/.test(normalized)
                ? normalized
                : String(optIdx + 1);
              return {
                id: o.id,
                label,
                textEn: o.textEn,
                textTa: o.textTa,
                imageUrl: o.imageUrl,
                isCorrect: o.isCorrect,
              };
            }),
            selectedOptionId: userAns?.selectedOptionId || null,
            isCorrect: userAns?.isCorrect ?? false,
            marksAwarded: userAns?.marksAwarded ?? 0,
          };
        })
      : null,
  };
}
