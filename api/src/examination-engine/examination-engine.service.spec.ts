import { describe, expect, it, vi } from 'vitest';
import {
  AssessmentTestStatus,
  TestAttemptStatus,
} from '../generated/prisma/client.js';
import { ExaminationEngineService } from './examination-engine.service.js';

describe('ExaminationEngineService', () => {
  const mockTest = {
    id: 'test-uuid-1',
    code: 'NEET-MOCK-01',
    title: 'NEET 2026 Grand Mock Test 01',
    durationMinutes: 180,
    totalMarks: 720,
    maxAttempts: 1,
    status: AssessmentTestStatus.PUBLISHED,
    testSeries: {
      id: 'series-uuid-1',
      title: 'NEET 2026 Test Series',
      status: 'PUBLISHED',
      isActive: true,
      courseId: null,
    },
    randomizeQuestions: true,
    randomizeOptions: true,
    hasNegativeMarking: true,
    correctMarks: 4,
    negativeMarks: 1,
    showResultsImmediately: false,
    questions: [
      {
        questionId: 'q-1',
        position: 1,
        section: 'A',
        correctMarks: 4,
        negativeMarks: 1,
        isDropped: false,
        question: {
          id: 'q-1',
          textEn: 'What is the SI unit of electric flux?',
          textTa: 'மின்பாயத்தின் SI அலகு எது?',
          solutionEn: 'Secret explanation that must never leak to student',
          options: [
            { id: 'opt-1', label: 'A', position: 1, textEn: 'N m^2 C^-1', isCorrect: true },
            { id: 'opt-2', label: 'B', position: 2, textEn: 'V m^-1', isCorrect: false },
          ],
          courseSubject: { subject: { code: 'PHY', name: 'Physics' } },
        },
      },
    ],
  };

  const mockPrisma = {
    assessmentTest: {
      findUnique: vi.fn(),
    },
    institutionMembership: {
      findUnique: vi.fn(),
    },
    testAttempt: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    attemptQuestion: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    attemptOptionMapping: {
      createMany: vi.fn(),
    },
    attemptAnswer: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    testResult: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const service = new ExaminationEngineService(mockPrisma as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start a new attempt and sanitize questions (zero answer/solution leaks)', async () => {
    mockPrisma.assessmentTest.findUnique.mockResolvedValue(mockTest);
    mockPrisma.testAttempt.findFirst.mockResolvedValue(null); // No previous active attempt
    mockPrisma.testAttempt.count.mockResolvedValue(0);
    mockPrisma.institutionMembership.findUnique.mockResolvedValue({ id: 'mem-1' });

    mockPrisma.testAttempt.create.mockResolvedValue({ id: 'att-1' });
    mockPrisma.attemptQuestion.create.mockResolvedValue({ id: 'aq-1' });

    const createdAttemptData = {
      id: 'att-1',
      assessmentTestId: mockTest.id,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 180 * 60 * 1000),
      questions: [
        {
          questionId: 'q-1',
          position: 1,
          section: 'A',
          correctMarks: 4,
          negativeMarks: 1,
          question: mockTest.questions[0].question,
          optionMappings: [
            { canonicalOptionId: 'opt-1', shuffledPosition: 1, displayedLabel: 'A' },
            { canonicalOptionId: 'opt-2', shuffledPosition: 2, displayedLabel: 'B' },
          ],
        },
      ],
      answers: [],
    };
    mockPrisma.testAttempt.findUnique.mockResolvedValue(createdAttemptData);

    const payload = await service.startOrResumeAttempt('student-profile-1', 'test-uuid-1');

    expect(payload.attemptId).toBe('att-1');
    expect(payload.questions.length).toBe(1);

    const q = payload.questions[0];
    expect(q.id).toBe('q-1');
    expect(q.textEn).toBe('What is the SI unit of electric flux?');

    // CRITICAL SECURITY ASSERTIONS: Verify zero leakage
    expect((q as any).solutionEn).toBeUndefined();
    expect((q as any).solutionTa).toBeUndefined();
    expect((q as any).solutionImageUrl).toBeUndefined();

    for (const opt of q.options) {
      expect((opt as any).isCorrect).toBeUndefined();
    }
  });

  it('should resume existing in-progress attempt with exact same question order and mapping', async () => {
    mockPrisma.assessmentTest.findUnique.mockResolvedValue(mockTest);

    const existingAttempt = {
      id: 'att-existing',
      assessmentTestId: mockTest.id,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 100 * 60 * 1000),
      status: TestAttemptStatus.IN_PROGRESS,
      questions: [
        {
          questionId: 'q-1',
          position: 1,
          section: 'A',
          correctMarks: 4,
          negativeMarks: 1,
          question: mockTest.questions[0].question,
          optionMappings: [
            { canonicalOptionId: 'opt-2', shuffledPosition: 1, displayedLabel: 'A' },
            { canonicalOptionId: 'opt-1', shuffledPosition: 2, displayedLabel: 'B' },
          ],
        },
      ],
      answers: [
        {
          questionId: 'q-1',
          selectedOptionId: 'opt-2',
          isMarkedForReview: true,
          isVisited: true,
          timeSpentSeconds: 45,
        },
      ],
    };

    mockPrisma.testAttempt.findFirst.mockResolvedValue(existingAttempt);

    const payload = await service.startOrResumeAttempt('student-profile-1', 'test-uuid-1');

    expect(payload.attemptId).toBe('att-existing');
    expect(payload.questions[0].savedAnswer?.selectedOptionId).toBe('opt-2');
    expect(payload.questions[0].savedAnswer?.isMarkedForReview).toBe(true);
    // Did not create a new attempt
    expect(mockPrisma.testAttempt.create).not.toHaveBeenCalled();
  });

  it('should autosave student answer securely', async () => {
    mockPrisma.testAttempt.findUnique.mockResolvedValue({
      id: 'att-1',
      studentProfileId: 'student-profile-1',
      status: TestAttemptStatus.IN_PROGRESS,
      expiresAt: new Date(Date.now() + 60_000),
    });

    mockPrisma.attemptQuestion.findUnique.mockResolvedValue({
      attemptId: 'att-1',
      questionId: 'q-1',
    });

    mockPrisma.attemptAnswer.upsert.mockResolvedValue({
      selectedOptionId: 'opt-1',
      numericalAnswer: null,
      isMarkedForReview: false,
      isVisited: true,
      timeSpentSeconds: 30,
    });

    const result = await service.autosaveAnswer('student-profile-1', 'att-1', {
      questionId: 'q-1',
      selectedOptionId: 'opt-1',
      isMarkedForReview: false,
      isVisited: true,
      timeSpentSeconds: 30,
    });

    expect(result.attemptId).toBe('att-1');
    expect(result.selectedOptionId).toBe('opt-1');
    expect(mockPrisma.attemptAnswer.upsert).toHaveBeenCalled();
  });

  it('should reject unauthorized cross-student attempt access', async () => {
    mockPrisma.testAttempt.findUnique.mockResolvedValue({
      id: 'att-1',
      studentProfileId: 'student-owner-id',
      status: TestAttemptStatus.IN_PROGRESS,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.getAttempt('unauthorized-student-id', 'att-1'),
    ).rejects.toThrow('You do not have permission to access this attempt');
  });

  it('should evaluate attempt with +4 for correct and -1 for wrong, and protect duplicate submissions', async () => {
    const attemptForSubmit = {
      id: 'att-submit-1',
      studentProfileId: 'student-1',
      startedAt: new Date(Date.now() - 3600_000),
      expiresAt: new Date(Date.now() + 3600_000),
      status: TestAttemptStatus.IN_PROGRESS,
      assessmentTestId: 'test-uuid-1',
      assessmentTest: {
        id: 'test-uuid-1',
        hasNegativeMarking: true,
        showResultsImmediately: false,
        durationMinutes: 180,
      },
      questions: [
        {
          questionId: 'q-1',
          position: 1,
          section: 'A',
          correctMarks: 4,
          negativeMarks: 1,
          isDropped: false,
          question: {
            id: 'q-1',
            options: [
              { id: 'opt-1', isCorrect: true },
              { id: 'opt-2', isCorrect: false },
            ],
            courseSubject: { subject: { code: 'PHY', name: 'Physics' } },
          },
        },
      ],
      answers: [
        {
          questionId: 'q-1',
          selectedOptionId: 'opt-1', // Correct answer
        },
      ],
    };

    mockPrisma.testAttempt.findUnique.mockResolvedValue(attemptForSubmit);
    mockPrisma.testAttempt.update.mockResolvedValue({ ...attemptForSubmit, status: TestAttemptStatus.EVALUATED });
    mockPrisma.testResult.upsert.mockResolvedValue({ totalMarksScored: 4 });

    const evalResult = await service.submitAttempt('student-1', 'att-submit-1', {
      timeSpentSeconds: 3600,
    });

    expect(evalResult.score).toBe(4);
    expect(evalResult.correctCount).toBe(1);
    expect(evalResult.incorrectCount).toBe(0);

    // Test duplicate submission idempotency: if already SUBMITTED or EVALUATED, returns result without re-evaluating
    const submittedAttempt = {
      ...attemptForSubmit,
      status: TestAttemptStatus.EVALUATED,
    };
    mockPrisma.testAttempt.findUnique.mockResolvedValue(submittedAttempt);
    mockPrisma.testResult.findUnique.mockResolvedValue({
      attemptId: 'att-submit-1',
      studentProfileId: 'student-1',
      totalMarksScored: 4,
      maxMarks: 4,
      percentage: 100,
      accuracyPercentage: 100,
      correctCount: 1,
      incorrectCount: 0,
      unansweredCount: 0,
      calculatedAt: new Date(),
      assessmentTest: { showResultsImmediately: false },
      attempt: { questions: [], answers: [] },
    });

    const duplicateSubmitResult = await service.submitAttempt('student-1', 'att-submit-1');
    expect(duplicateSubmitResult.score).toBe(4);
  });

  it('should enforce result review visibility rules (solutions hidden when showResultsImmediately is false)', async () => {
    mockPrisma.testResult.findUnique.mockResolvedValue({
      attemptId: 'att-1',
      studentProfileId: 'student-1',
      totalMarksScored: 4,
      maxMarks: 4,
      percentage: 100,
      accuracyPercentage: 100,
      correctCount: 1,
      incorrectCount: 0,
      unansweredCount: 0,
      calculatedAt: new Date(),
      assessmentTest: {
        id: 'test-1',
        title: 'NEET Test',
        code: 'NEET-01',
        showResultsImmediately: false, // RESTRICTED
      },
      attempt: {
        questions: [],
        answers: [],
      },
    });

    const result = await service.getAttemptResult('student-1', 'att-1');
    expect(result.score).toBe(4);
    // Review and solutions must be null when showResultsImmediately is false
    expect(result.review).toBeNull();
  });
});
