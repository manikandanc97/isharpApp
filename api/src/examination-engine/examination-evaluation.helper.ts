export interface AttemptQuestionEvaluationInput {
  questionId: string;
  position: number;
  section: string;
  correctMarks: number;
  negativeMarks: number;
  isDropped: boolean;
  selectedOptionId?: string | null;
  numericalAnswer?: string | null;
  canonicalCorrectOptionId?: string | null;
  canonicalNumericalAnswer?: string | null;
  subjectCode?: string;
}

export interface EvaluationResultSummary {
  totalMarksScored: number;
  maxMarks: number;
  percentage: number;
  accuracyPercentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  droppedCount: number;
  physicsScore: number;
  chemistryScore: number;
  biologyScore: number;
  botanyScore: number;
  zoologyScore: number;
  answers: Array<{
    questionId: string;
    isCorrect: boolean;
    marksAwarded: number;
  }>;
  subjectBreakdown: Record<
    string,
    {
      score: number;
      maxScore: number;
      correct: number;
      incorrect: number;
      unanswered: number;
    }
  >;
}

export function evaluateStudentAttempt(
  items: AttemptQuestionEvaluationInput[],
  hasNegativeMarking = true,
): EvaluationResultSummary {
  let totalMarksScored = 0;
  let maxMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let droppedCount = 0;

  let physicsScore = 0;
  let chemistryScore = 0;
  let biologyScore = 0;
  let botanyScore = 0;
  let zoologyScore = 0;

  const answers: Array<{
    questionId: string;
    isCorrect: boolean;
    marksAwarded: number;
  }> = [];

  const subjectBreakdown: Record<
    string,
    {
      score: number;
      maxScore: number;
      correct: number;
      incorrect: number;
      unanswered: number;
    }
  > = {};

  for (const item of items) {
    const subject = (item.subjectCode || 'GENERAL').toUpperCase();
    if (!subjectBreakdown[subject]) {
      subjectBreakdown[subject] = {
        score: 0,
        maxScore: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
      };
    }

    const sub = subjectBreakdown[subject];
    maxMarks += item.correctMarks;
    sub.maxScore += item.correctMarks;

    // 1. Dropped question handling (Award full positive marks per NTA guidelines)
    if (item.isDropped) {
      droppedCount++;
      const marks = item.correctMarks;
      totalMarksScored += marks;
      sub.score += marks;
      answers.push({ questionId: item.questionId, isCorrect: true, marksAwarded: marks });
      applySubjectScore(subject, marks);
      continue;
    }

    // 2. Unanswered question
    const hasSelection = Boolean(
      item.selectedOptionId || (item.numericalAnswer && item.numericalAnswer.trim()),
    );

    if (!hasSelection) {
      unansweredCount++;
      sub.unanswered++;
      answers.push({ questionId: item.questionId, isCorrect: false, marksAwarded: 0 });
      continue;
    }

    // 3. Check correctness
    let isCorrect = false;
    if (item.canonicalCorrectOptionId && item.selectedOptionId) {
      isCorrect = item.selectedOptionId === item.canonicalCorrectOptionId;
    } else if (item.canonicalNumericalAnswer && item.numericalAnswer) {
      isCorrect =
        item.numericalAnswer.trim().toLowerCase() ===
        item.canonicalNumericalAnswer.trim().toLowerCase();
    }

    if (isCorrect) {
      correctCount++;
      sub.correct++;
      const marks = item.correctMarks;
      totalMarksScored += marks;
      sub.score += marks;
      answers.push({ questionId: item.questionId, isCorrect: true, marksAwarded: marks });
      applySubjectScore(subject, marks);
    } else {
      incorrectCount++;
      sub.incorrect++;
      const penalty = hasNegativeMarking ? item.negativeMarks : 0;
      totalMarksScored -= penalty;
      sub.score -= penalty;
      answers.push({ questionId: item.questionId, isCorrect: false, marksAwarded: -penalty });
      applySubjectScore(subject, -penalty);
    }
  }

  function applySubjectScore(subject: string, delta: number) {
    if (subject.includes('PHY')) physicsScore += delta;
    else if (subject.includes('CHE')) chemistryScore += delta;
    else if (subject.includes('BOT')) {
      botanyScore += delta;
      biologyScore += delta;
    } else if (subject.includes('ZOO')) {
      zoologyScore += delta;
      biologyScore += delta;
    } else if (subject.includes('BIO')) {
      biologyScore += delta;
    }
  }

  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage =
    attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 1000) / 10 : 0;
  const percentage = maxMarks > 0 ? Math.round((totalMarksScored / maxMarks) * 1000) / 10 : 0;

  return {
    totalMarksScored,
    maxMarks,
    percentage,
    accuracyPercentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    droppedCount,
    physicsScore,
    chemistryScore,
    biologyScore,
    botanyScore,
    zoologyScore,
    answers,
    subjectBreakdown,
  };
}
