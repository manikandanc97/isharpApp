import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import {
  evaluateStudentAttempt,
  type AttemptQuestionEvaluationInput,
} from './examination-evaluation.helper.js';
import { formatSanitizedAttempt } from './helpers/attempt-payload.helper.js';
import {
  createOptionMappings,
  secureShuffle,
} from './examination-randomization.helper.js';

describe('Full 180-Question NEET Examination Lifecycle & Performance', () => {
  const SUBJECTS = ['PHYSICS', 'CHEMISTRY', 'BOTANY', 'ZOOLOGY'] as const;

  function build180Questions() {
    return Array.from({ length: 180 }, (_, index) => {
      const subjectCode = SUBJECTS[Math.floor(index / 45)];
      const qId = `q-${index + 1}`;
      return {
        questionId: qId,
        position: index + 1,
        section: subjectCode,
        correctMarks: 4,
        negativeMarks: 1,
        question: {
          id: qId,
          type: 'SINGLE_CHOICE',
          difficulty: 'MEDIUM',
          textEn: `${subjectCode} Question ${index + 1}: Solve F = ma`,
          textTa: `${subjectCode} கேள்வி ${index + 1}: F = ma தீர்க்கவும்`,
          questionImageUrl: index % 10 === 0 ? `https://cdn.example.com/q-${index + 1}.png` : null,
          numericalAnswer: null,
          solutionEn: `Secret solution ${index + 1}`,
          solutionTa: `ரகசிய தீர்வு ${index + 1}`,
          solutionImageUrl: null,
          isDropped: false,
          courseSubject: { subject: { code: subjectCode, name: subjectCode } },
          options: [1, 2, 3, 4].map((pos) => ({
            id: `${qId}-opt-${pos}`,
            position: pos,
            label: String(pos),
            textEn: `Option ${pos}`,
            textTa: `விருப்பம் ${pos}`,
            imageUrl: null,
            isCorrect: pos === ((index % 4) + 1),
          })),
        },
      };
    });
  }

  it('randomizes 180 questions & options, strips answer keys during IN_PROGRESS, and scores with negative marking', () => {
    const testQuestions = build180Questions();

    const tRand0 = performance.now();
    const shuffled = secureShuffle(testQuestions);
    const attemptQuestions = shuffled.map((tq, idx) => ({
      id: `aq-${tq.questionId}`,
      questionId: tq.questionId,
      position: idx + 1,
      section: tq.section,
      correctMarks: tq.correctMarks,
      negativeMarks: tq.negativeMarks,
      optionMappings: createOptionMappings(
        tq.question.options.map((o) => ({ id: o.id, position: o.position })),
        true,
      ),
      question: tq.question,
    }));
    const randomizationMs = performance.now() - tRand0;
    expect(attemptQuestions).toHaveLength(180);
    expect(randomizationMs).toBeLessThan(200);

    const inProgressPayload = formatSanitizedAttempt(
      {
        id: 'attempt-180-1',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 60 * 1000),
        submittedAt: null,
        totalTimeSeconds: 0,
        questions: attemptQuestions,
        answers: [],
      },
      {
        id: 'test-180',
        title: 'Full NEET 180 Mock',
        code: 'NEET-180',
        durationMinutes: 180,
        hasNegativeMarking: true,
      },
    );

    expect(inProgressPayload.questions).toHaveLength(180);
    // CRITICAL: Answer keys and solutions must NEVER be exposed while IN_PROGRESS
    for (const q of inProgressPayload.questions) {
      const record = q as Record<string, unknown>;
      expect(record.solutionEn).toBeUndefined();
      expect(record.solutionTa).toBeUndefined();
      expect(record.solutionImageUrl).toBeUndefined();
      for (const opt of q.options as Array<Record<string, unknown>>) {
        expect(opt.isCorrect).toBeUndefined();
      }
    }

    // Simulate 100 correct, 40 incorrect, 40 unanswered
    const evalInputs: AttemptQuestionEvaluationInput[] = attemptQuestions.map((aq, idx) => {
      const correctOpt = aq.question.options.find((o) => o.isCorrect)!;
      const wrongOpt = aq.question.options.find((o) => !o.isCorrect)!;
      let selectedOptionId: string | null = null;
      if (idx < 100) selectedOptionId = correctOpt.id;
      else if (idx < 140) selectedOptionId = wrongOpt.id;

      return {
        questionId: aq.questionId,
        position: aq.position,
        section: aq.section,
        correctMarks: aq.correctMarks,
        negativeMarks: aq.negativeMarks,
        isDropped: aq.question.isDropped,
        selectedOptionId,
        canonicalCorrectOptionId: correctOpt.id,
        subjectCode: aq.section,
      };
    });

    const tEval0 = performance.now();
    const evaluation = evaluateStudentAttempt(evalInputs, true);
    const evalMs = performance.now() - tEval0;

    expect(evaluation.correctCount).toBe(100);
    expect(evaluation.incorrectCount).toBe(40);
    expect(evaluation.unansweredCount).toBe(40);
    expect(evaluation.totalMarksScored).toBe(100 * 4 - 40 * 1); // 360
    expect(evaluation.maxMarks).toBe(720);
    expect(evaluation.percentage).toBe(50);
    expect(Object.keys(evaluation.subjectBreakdown).sort()).toEqual([
      'BOTANY',
      'CHEMISTRY',
      'PHYSICS',
      'ZOOLOGY',
    ]);
    expect(evalMs).toBeLessThan(100);
  });
});
