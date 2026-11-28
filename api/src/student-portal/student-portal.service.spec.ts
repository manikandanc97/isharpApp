import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { StudentPortalService } from './student-portal.service.js';

function createPrisma() {
  return {
    userProfile: { findUnique: vi.fn() },
    course: { findMany: vi.fn(), count: vi.fn() },
    subject: { count: vi.fn() },
    chapter: { count: vi.fn() },
    question: { findMany: vi.fn(), count: vi.fn() },
    mockTest: { findMany: vi.fn(), count: vi.fn() },
  };
}

describe('StudentPortalService', () => {
  it('requires a database-linked profile', async () => {
    const service = new StudentPortalService(createPrisma() as never);
    await expect(service.getDashboard(null)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns only database records and excludes answer material', async () => {
    const prisma = createPrisma();
    prisma.userProfile.findUnique.mockResolvedValue({
      id: 'profile-id',
      displayName: 'Database Student',
      email: 'student@example.com',
      institutionMembership: {
        studentId: 'ISA000001',
        studentCategory: 'INTERNAL',
        paymentStatus: 'NOT_REQUIRED',
        paidAccessUntil: null,
      },
    });
    prisma.course.findMany.mockResolvedValue([
      {
        id: 'course-id',
        code: 'NEET',
        title: 'NEET',
        description: null,
        courseSubjects: [
          {
            subject: {
              id: 'subject-id',
              code: 'PHY',
              name: 'Physics',
              description: null,
            },
            _count: { chapters: 2, questions: 4 },
          },
        ],
      },
    ]);
    prisma.mockTest.findMany.mockResolvedValue([
      {
        id: 'mock-id',
        code: 'MOCK-1',
        title: 'Published test',
        description: null,
        durationMinutes: 180,
        totalMarks: 720,
        instructionsEn: null,
        instructionsTa: null,
        scheduledAt: new Date('2026-11-09T08:30:00.000Z'),
        availableUntil: null,
        _count: { questions: 1 },
      },
    ]);
    prisma.question.findMany.mockResolvedValue([
      {
        id: 'question-id',
        externalId: 'Q-1',
        type: 'SINGLE_CORRECT',
        language: 'BILINGUAL',
        difficulty: 'MEDIUM',
        textEn: 'Database question',
        textTa: null,
        questionImageUrl: null,
        updatedAt: new Date('2026-11-08T08:30:00.000Z'),
        chapter: null,
        courseSubject: {
          course: { id: 'course-id', code: 'NEET', title: 'NEET' },
          subject: { id: 'subject-id', code: 'PHY', name: 'Physics' },
        },
      },
    ]);
    prisma.course.count.mockResolvedValue(1);
    prisma.subject.count.mockResolvedValue(1);
    prisma.chapter.count.mockResolvedValue(2);
    prisma.question.count.mockResolvedValue(4);
    prisma.mockTest.count.mockResolvedValue(1);

    const result = await new StudentPortalService(
      prisma as never,
    ).getDashboard('profile-id');

    expect(result.student.displayName).toBe('Database Student');
    expect(result.summary.activeQuestions).toBe(4);
    expect(result.courses[0]?.subjects[0]?.questionCount).toBe(4);
    expect(result.mockTests[0]?.questionCount).toBe(1);
    expect(result.recentQuestions[0]).not.toHaveProperty('options');
    expect(result.recentQuestions[0]).not.toHaveProperty('solutionEn');
    expect(prisma.mockTest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 12 }),
    );
  });

  it('fetches published assessment tests only once per getDashboard call', async () => {
    const prisma = {
      ...createPrisma(),
      assessmentTest: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'test-1',
            code: 'T1',
            title: 'Test 1',
            description: null,
            testType: 'MOCK',
            durationMinutes: 180,
            totalMarks: 720,
            totalQuestions: 1,
            passingMarks: null,
            hasNegativeMarking: true,
            correctMarks: 4,
            negativeMarks: 1,
            maxAttempts: 1,
            showResultsImmediately: true,
            instructionsEn: null,
            instructionsTa: null,
            scheduledAt: null,
            availableUntil: null,
            category: { id: 'cat-1', name: 'Mocks' },
            testSeries: {
              id: 'series-1',
              title: 'NEET 2026',
              slug: 'neet-2026',
              category: { id: 'cat-1', name: 'Mocks' },
            },
            questions: [
              {
                question: {
                  courseSubject: {
                    subject: { id: 'sub-1', code: 'PHY', name: 'Physics' },
                  },
                  chapter: { id: 'ch-1', title: 'Mechanics' },
                },
              },
            ],
            attempts: [],
            _count: { questions: 1 },
          },
        ]),
      },
      testSeries: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'series-1',
            title: 'NEET 2026',
            slug: 'neet-2026',
            description: null,
            categoryId: 'cat-1',
            category: { id: 'cat-1', name: 'Mocks' },
            academicYear: '2026',
            coverImageUrl: null,
            course: null,
          },
        ]),
      },
    };
    prisma.userProfile.findUnique.mockResolvedValue({
      id: 'profile-id',
      displayName: 'Student',
      email: 's@example.com',
      institutionMembership: {
        studentId: 'ISA000001',
        studentCategory: 'INTERNAL',
        paymentStatus: 'NOT_REQUIRED',
        paidAccessUntil: null,
      },
    });
    prisma.course.findMany.mockResolvedValue([]);
    prisma.mockTest.findMany.mockResolvedValue([]);
    prisma.question.findMany.mockResolvedValue([]);
    prisma.course.count.mockResolvedValue(0);
    prisma.subject.count.mockResolvedValue(0);
    prisma.chapter.count.mockResolvedValue(0);
    prisma.question.count.mockResolvedValue(0);
    prisma.mockTest.count.mockResolvedValue(0);

    const result = await new StudentPortalService(
      prisma as never,
    ).getDashboard('profile-id');

    expect(prisma.assessmentTest.findMany).toHaveBeenCalledTimes(1);
    expect(result.mockTests).toHaveLength(1);
    expect(result.testSeries[0]?.tests).toHaveLength(1);
  });
});
