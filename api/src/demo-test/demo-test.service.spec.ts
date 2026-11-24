import { describe, expect, it, vi } from 'vitest';
import { DemoTestService } from './demo-test.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('DemoTestService', () => {
  it('generates a balanced randomized demo test from questions', async () => {
    const mockQuestions = [
      {
        id: 'q1',
        externalId: 'PHY-01',
        difficulty: 'EASY',
        textEn: 'Physics Question 1',
        textTa: 'இயற்பியல் வினா 1',
        solutionEn: 'Sol 1',
        solutionTa: 'தீர்வு 1',
        correctMarks: 4,
        negativeMarks: 1,
        options: [
          {
            id: 'o1',
            label: 'A',
            textEn: 'Opt A',
            textTa: null,
            isCorrect: true,
            position: 1,
          },
          {
            id: 'o2',
            label: 'B',
            textEn: 'Opt B',
            textTa: null,
            isCorrect: false,
            position: 2,
          },
        ],
        chapter: { title: 'Mechanics' },
        courseSubject: { subject: { code: 'PHYSICS', name: 'Physics' } },
      },
      {
        id: 'q2',
        externalId: 'CHEM-01',
        difficulty: 'MEDIUM',
        textEn: 'Chemistry Question 1',
        textTa: 'வேதியியல் வினா 1',
        solutionEn: 'Sol 2',
        solutionTa: 'தீர்வு 2',
        correctMarks: 4,
        negativeMarks: 1,
        options: [
          {
            id: 'o3',
            label: 'A',
            textEn: 'Opt A',
            textTa: null,
            isCorrect: false,
            position: 1,
          },
          {
            id: 'o4',
            label: 'B',
            textEn: 'Opt B',
            textTa: null,
            isCorrect: true,
            position: 2,
          },
        ],
        chapter: { title: 'Bonding' },
        courseSubject: { subject: { code: 'CHEMISTRY', name: 'Chemistry' } },
      },
      {
        id: 'q3',
        externalId: 'BIO-01',
        difficulty: 'EASY',
        textEn: 'Biology Question 1',
        textTa: 'உயிரியல் வினா 1',
        solutionEn: 'Sol 3',
        solutionTa: 'தீர்வு 3',
        correctMarks: 4,
        negativeMarks: 1,
        options: [
          {
            id: 'o5',
            label: 'A',
            textEn: 'Opt A',
            textTa: null,
            isCorrect: true,
            position: 1,
          },
          {
            id: 'o6',
            label: 'B',
            textEn: 'Opt B',
            textTa: null,
            isCorrect: false,
            position: 2,
          },
        ],
        chapter: { title: 'Cell Biology' },
        courseSubject: { subject: { code: 'BIOLOGY', name: 'Biology' } },
      },
    ];

    const prismaMock = {
      mockTest: { findFirst: vi.fn().mockResolvedValue(null) },
      question: {
        findMany: vi.fn().mockResolvedValue(mockQuestions),
      },
    } as unknown as PrismaService;

    const service = new DemoTestService(prismaMock);
    const result = await service.generateDemoTest(3);

    expect(result.questionCount).toBe(3);
    expect(result.questions).toHaveLength(3);
    expect(result.subjects).toHaveLength(3);
    expect(result.totalMarks).toBe(12);
    expect(result.durationMinutes).toBeGreaterThanOrEqual(8);
    expect(result.questions[0].options).toHaveLength(2);
  });

  it('generates a single subject demo test when requested', async () => {
    const mockQuestions = [
      {
        id: 'q1',
        externalId: 'PHY-01',
        difficulty: 'EASY',
        textEn: 'Physics Question 1',
        textTa: 'இயற்பியல் வினா 1',
        solutionEn: 'Sol 1',
        solutionTa: 'தீர்வு 1',
        correctMarks: 4,
        negativeMarks: 1,
        options: [
          {
            id: 'o1',
            label: 'A',
            textEn: 'Opt A',
            textTa: null,
            isCorrect: true,
            position: 1,
          },
        ],
        chapter: { title: 'Mechanics' },
        courseSubject: { subject: { code: 'PHYSICS', name: 'Physics' } },
      },
      {
        id: 'q2',
        externalId: 'CHEM-01',
        difficulty: 'MEDIUM',
        textEn: 'Chemistry Question 1',
        textTa: 'வேதியியல் வினா 1',
        solutionEn: 'Sol 2',
        solutionTa: 'தீர்வு 2',
        correctMarks: 4,
        negativeMarks: 1,
        options: [
          {
            id: 'o3',
            label: 'A',
            textEn: 'Opt A',
            textTa: null,
            isCorrect: true,
            position: 1,
          },
        ],
        chapter: { title: 'Bonding' },
        courseSubject: { subject: { code: 'CHEMISTRY', name: 'Chemistry' } },
      },
    ];

    const prismaMock = {
      mockTest: { findFirst: vi.fn().mockResolvedValue(null) },
      question: {
        findMany: vi.fn().mockResolvedValue(mockQuestions),
      },
    } as unknown as PrismaService;

    const service = new DemoTestService(prismaMock);
    const result = await service.generateDemoTest(1, 'PHYSICS');

    expect(result.questionCount).toBe(1);
    expect(result.questions[0].subjectCode).toBe('PHYSICS');
    expect(result.title).toContain('Physics');
  });

  it('handles empty questions gracefully', async () => {
    const prismaMock = {
      mockTest: { findFirst: vi.fn().mockResolvedValue(null) },
      question: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    const service = new DemoTestService(prismaMock);
    const result = await service.generateDemoTest(9);

    expect(result.questionCount).toBe(0);
    expect(result.questions).toEqual([]);
    expect(result.totalMarks).toBe(0);
  });

  it('serves the exact admin-configured login demo in its saved order', async () => {
    const findFallbackQuestions = vi.fn();
    const prismaMock = {
      mockTest: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'demo-test-id',
          code: 'LOGIN-DEMO-01',
          title: 'Curated Login Demo',
          durationMinutes: 12,
          instructionsEn: 'Admin English instructions',
          instructionsTa: 'நிர்வாக தமிழ் வழிமுறைகள்',
          questions: [
            {
              position: 1,
              correctMarks: 5,
              negativeMarks: 2,
              question: {
                id: 'q-configured',
                externalId: 'PHY-CONFIGURED',
                isActive: true,
                difficulty: 'HARD',
                textEn: 'Configured question',
                textTa: null,
                questionImageUrl: null,
                solutionEn: 'Configured solution',
                solutionTa: null,
                chapter: { title: 'Mechanics' },
                courseSubject: {
                  subject: { code: 'PHYSICS', name: 'Physics' },
                },
                options: [
                  {
                    id: 'configured-option',
                    label: 'A',
                    textEn: 'Answer',
                    textTa: null,
                    imageUrl: null,
                    isCorrect: true,
                    position: 1,
                  },
                ],
              },
            },
          ],
        }),
      },
      question: { findMany: findFallbackQuestions },
    } as unknown as PrismaService;

    const result = await new DemoTestService(prismaMock).generateDemoTest(
      99,
      'BIOLOGY',
    );

    expect(result.testId).toBe('demo-test-id');
    expect(result.title).toBe('Curated Login Demo');
    expect(result.durationMinutes).toBe(12);
    expect(result.totalMarks).toBe(5);
    expect(result.questions.map((question) => question.id)).toEqual([
      'q-configured',
    ]);
    expect(result.questions[0].negativeMarks).toBe(2);
    expect(findFallbackQuestions).not.toHaveBeenCalled();
  });
});
