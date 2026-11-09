import type {
  DemoQuestion,
  ScorecardReport,
  SubjectStat,
  TimeAnalytics,
  UserAnswerRecord,
} from './demo-test.types';

export function calculateScorecard(
  questions: DemoQuestion[],
  answers: Record<string, UserAnswerRecord>,
  totalDurationSeconds: number,
): ScorecardReport {
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalScore = 0;
  let maxScore = 0;

  let totalCorrectTime = 0;
  let totalWrongTime = 0;
  let totalSkippedTime = 0;
  let fastestQ: { questionId: string; index: number; seconds: number; isCorrect: boolean } | undefined;
  let slowestQ: { questionId: string; index: number; seconds: number; isCorrect: boolean } | undefined;

  const subjectMap = new Map<
    string,
    {
      name: string;
      code: string;
      total: number;
      attempted: number;
      correct: number;
      wrong: number;
      skipped: number;
      marks: number;
      maxMarks: number;
      timeSpent: number;
    }
  >();

  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const q = questions[qIdx];
    const subCode = q.subjectCode || 'GENERAL';
    const subName = q.subject || 'General';

    if (!subjectMap.has(subCode)) {
      subjectMap.set(subCode, {
        name: subName,
        code: subCode,
        total: 0,
        attempted: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        marks: 0,
        maxMarks: 0,
        timeSpent: 0,
      });
    }

    const sub = subjectMap.get(subCode)!;
    sub.total += 1;
    sub.maxMarks += q.correctMarks;
    maxScore += q.correctMarks;

    const record = answers[q.id];
    const timeSpent = record?.timeSpentSeconds ?? 0;
    sub.timeSpent += timeSpent;

    const selectedOptionId = record?.selectedOptionId;

    if (!selectedOptionId) {
      skippedCount += 1;
      sub.skipped += 1;
      totalSkippedTime += timeSpent;
      continue;
    }

    sub.attempted += 1;
    const chosenOption = q.options.find((opt) => opt.id === selectedOptionId);
    const isCorrect = Boolean(chosenOption?.isCorrect);

    if (isCorrect) {
      correctCount += 1;
      sub.correct += 1;
      totalScore += q.correctMarks;
      sub.marks += q.correctMarks;
      totalCorrectTime += timeSpent;
    } else {
      wrongCount += 1;
      sub.wrong += 1;
      totalScore -= q.negativeMarks;
      sub.marks -= q.negativeMarks;
      totalWrongTime += timeSpent;
    }

    if (timeSpent > 0) {
      if (!fastestQ || timeSpent < fastestQ.seconds) {
        fastestQ = { questionId: q.id, index: qIdx, seconds: timeSpent, isCorrect };
      }
      if (!slowestQ || timeSpent > slowestQ.seconds) {
        slowestQ = { questionId: q.id, index: qIdx, seconds: timeSpent, isCorrect };
      }
    }
  }

  const attempted = correctCount + wrongCount;
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
  const percentage = maxScore > 0 ? Math.max(0, Math.round((totalScore / maxScore) * 100)) : 0;

  const subjectStats: SubjectStat[] = Array.from(subjectMap.values()).map((s) => ({
    subjectName: s.name,
    subjectCode: s.code,
    total: s.total,
    attempted: s.attempted,
    correct: s.correct,
    wrong: s.wrong,
    skipped: s.skipped,
    marksObtained: s.marks,
    maxMarks: s.maxMarks,
    accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
    timeSpentSeconds: s.timeSpent,
    avgTimeSeconds: s.total > 0 ? Math.round(s.timeSpent / s.total) : 0,
  }));

  const avgTimePerQuestion = questions.length > 0 ? Math.round(totalDurationSeconds / questions.length) : 0;
  const avgTimeCorrect = correctCount > 0 ? Math.round(totalCorrectTime / correctCount) : 0;
  const avgTimeWrong = wrongCount > 0 ? Math.round(totalWrongTime / wrongCount) : 0;
  const avgTimeSkipped = skippedCount > 0 ? Math.round(totalSkippedTime / skippedCount) : 0;

  let paceCategory: "OPTIMAL" | "SPEEDY" | "OVERTIME" = "OPTIMAL";
  let paceMessage = "Balanced pace aligned with official NEET exam speed (~60s/Q).";
  if (avgTimePerQuestion < 40) {
    paceCategory = "SPEEDY";
    paceMessage = "Rapid answering speed. Double check accuracy on negative marking.";
  } else if (avgTimePerQuestion > 80) {
    paceCategory = "OVERTIME";
    paceMessage = "Taking longer than recommended. Practice daily DPPs to cut solving time.";
  }

  const timeAnalytics: TimeAnalytics = {
    avgTimePerQuestion,
    avgTimeCorrect,
    avgTimeWrong,
    avgTimeSkipped,
    fastestQuestion: fastestQ,
    slowestQuestion: slowestQ,
    paceCategory,
    paceMessage,
  };

  return {
    testId: `EVAL-${Date.now()}`,
    totalQuestions: questions.length,
    attempted,
    correctCount,
    wrongCount,
    skippedCount,
    totalScore,
    maxScore,
    percentage,
    accuracy,
    totalTimeSpentSeconds: totalDurationSeconds,
    subjectStats,
    timeAnalytics,
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatSecondsOrMinutes(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

