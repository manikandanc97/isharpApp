import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  calculateMaximumMarks,
  calculateProportionalDuration,
  DEFAULT_NEET_PATTERN,
  resolvePatternSubjectsForDb,
} from './exam-pattern.config.js';
import { QuestionSelectionEngine } from './question-selection.engine.js';
import { TestSeriesService } from './test-series.service.js';

describe('ExamPatternConfig', () => {
  it('calculates proportional duration accurately for 45, 90, and 180 questions', () => {
    expect(calculateProportionalDuration(10)).toBe(10);
    expect(calculateProportionalDuration(45)).toBe(45);
    expect(calculateProportionalDuration(90)).toBe(90);
    expect(calculateProportionalDuration(180)).toBe(180);
    expect(calculateProportionalDuration(0)).toBe(0);
  });

  it('calculates maximum marks correctly', () => {
    expect(calculateMaximumMarks(180, 4)).toBe(720);
    expect(calculateMaximumMarks(90, 4)).toBe(360);
    expect(calculateMaximumMarks(45, 4)).toBe(180);
  });

  it('resolves unified BIOLOGY subject without double counting', () => {
    const resolved = resolvePatternSubjectsForDb([
      { id: 's1', code: 'PHYSICS', name: 'Physics' },
      { id: 's2', code: 'CHEMISTRY', name: 'Chemistry' },
      { id: 's3', code: 'BIOLOGY', name: 'Biology' },
    ]);
    const total = resolved.reduce((sum, s) => sum + s.questionCount, 0);
    expect(total).toBe(DEFAULT_NEET_PATTERN.totalQuestions);
    expect(resolved.find((s) => s.subjectCode === 'BIOLOGY')?.questionCount).toBe(90);
  });
});

describe('QuestionSelectionEngine', () => {
  it('prevents duplicate and equivalent-fingerprint questions and reports shortages', async () => {
    const mockPrisma = {
      question: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'q1',
            chapterId: 'ch1',
            contentFingerprint: 'cfp-1',
            equivalentFingerprint: 'efp-1',
            chapter: { title: 'Laws of Motion' },
          },
          {
            id: 'q2',
            chapterId: 'ch1',
            contentFingerprint: 'cfp-1', // duplicate content fingerprint
            equivalentFingerprint: 'efp-1',
            chapter: { title: 'Laws of Motion' },
          },
          {
            id: 'q3',
            chapterId: 'ch1',
            contentFingerprint: 'cfp-1',
            equivalentFingerprint: 'efp-1', // duplicate equivalent fingerprint
            chapter: { title: 'Laws of Motion' },
          },
        ]),
      },
      chapter: {
        findMany: vi.fn().mockResolvedValue([{ id: 'ch1', title: 'Laws of Motion' }]),
      },
    };

    const engine = new QuestionSelectionEngine(mockPrisma as any);
    const result = await engine.generateQuestions({
      subjectAllocations: [
        {
          courseSubjectId: 'cs-phy',
          subjectCode: 'PHYSICS',
          subjectName: 'Physics',
          chapterMode: 'SELECTED',
          chapterAllocationMode: 'MANUAL',
          questionCount: 2,
          chapterIds: ['ch1'],
          chapterAllocations: [{ chapterId: 'ch1', count: 2 }],
        },
      ],
    });

    // Only 1 unique eligible question (q1) because q2 and q3 share fingerprints with q1
    expect(result.questions).toEqual([]);
    expect(result.shortages).toHaveLength(1);
    expect(result.shortages[0]).toMatchObject({
      subjectCode: 'PHYSICS',
      chapterTitle: 'Laws of Motion',
      required: 2,
      available: 1,
      shortage: 1,
    });
  });
});

describe('TestSeriesService', () => {
  const mockPrisma = {
    testSeriesCategory: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({ _max: { position: 3 } }),
    },
    testSeries: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    assessmentTest: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    assessmentTestQuestion: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    testBlueprint: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    question: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((cb) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const mockEngine = {
    getSubjectsAndChapters: vi.fn().mockResolvedValue([]),
    generateQuestions: vi.fn().mockResolvedValue({ questions: [], shortages: [] }),
  };

  let service: TestSeriesService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.testSeriesCategory.aggregate.mockResolvedValue({ _max: { position: 3 } });
    service = new TestSeriesService(mockPrisma as any, mockEngine as any);
  });

  it('should list categories and ensure defaults if none exist', async () => {
    mockPrisma.testSeriesCategory.count.mockResolvedValueOnce(0);
    mockPrisma.testSeriesCategory.findMany.mockResolvedValueOnce([
      { id: 'cat-1', name: 'Class 11', slug: 'class-11', position: 1 },
      { id: 'cat-2', name: 'Class 12', slug: 'class-12', position: 2 },
    ]);
    mockPrisma.assessmentTest.findMany.mockResolvedValueOnce([]);

    const result = await service.getCategories();
    expect(result.length).toBe(2);
    expect(mockPrisma.testSeriesCategory.upsert).toHaveBeenCalled();
  });

  it('should prevent case-insensitive duplicate category names', async () => {
    mockPrisma.testSeriesCategory.findFirst.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'Class 11',
    });

    await expect(service.createCategory({ name: '  class 11  ' })).rejects.toThrow(
      'already exists',
    );
  });

  it('should block deleting non-empty category without moveToCategoryId and allow move+delete', async () => {
    mockPrisma.testSeriesCategory.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Class 11',
    });
    mockPrisma.assessmentTest.count.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    mockPrisma.testSeries.count.mockResolvedValueOnce(1);

    await expect(service.deleteCategory('cat-1')).rejects.toThrow(
      'Please move them to another category first',
    );

    mockPrisma.assessmentTest.count.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    mockPrisma.testSeries.count.mockResolvedValueOnce(1);
    mockPrisma.testSeriesCategory.findUnique
      .mockResolvedValueOnce({ id: 'cat-1', name: 'Class 11' })
      .mockResolvedValueOnce({ id: 'cat-2', name: 'Class 12' });
    mockPrisma.testSeriesCategory.delete.mockResolvedValueOnce({ id: 'cat-1' });

    await service.deleteCategory('cat-1', 'cat-2');
    expect(mockPrisma.assessmentTest.updateMany).toHaveBeenCalled();
    expect(mockPrisma.testSeriesCategory.delete).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
    });
  });

  it('should block deleting or destructively editing tests with existing attempts', async () => {
    mockPrisma.assessmentTest.findUnique.mockResolvedValueOnce({
      id: 'test-1',
      _count: { attempts: 3, results: 2 },
    });

    await expect(service.deleteStandaloneTest('test-1')).rejects.toThrow(
      'cannot be deleted',
    );

    mockPrisma.assessmentTest.findUnique.mockResolvedValueOnce({
      id: 'test-1',
      correctMarks: 4,
      negativeMarks: 1,
      durationMinutes: 180,
      totalQuestions: 180,
      _count: { attempts: 3 },
    });

    await expect(
      service.updateStandaloneTest('test-1', { durationMinutes: 90 }),
    ).rejects.toThrow('already has student attempts');
  });

  it('should create test series with valid parameters', async () => {
    mockPrisma.testSeries.create.mockResolvedValueOnce({
      id: 'series-123',
      title: 'NEET 2026 Repeater Batch Master Mock Series',
      slug: 'neet-2026-repeater',
      categoryId: 'cat-repeater',
      academicYear: '2026-2027',
      isActive: true,
    });

    const created = await service.createSeries('user-admin-1', {
      title: 'NEET 2026 Repeater Batch Master Mock Series',
      categoryId: 'cat-repeater',
      academicYear: '2026-2027',
    });

    expect(created.id).toBe('series-123');
    expect(mockPrisma.testSeries.create).toHaveBeenCalled();
  });

  it('should reorder tests sequentially within a test series', async () => {
    mockPrisma.assessmentTest.updateMany.mockResolvedValue({ count: 1 });

    const orderedIds = ['test-3', 'test-1', 'test-2'];
    await service.reorderTests('series-123', orderedIds);

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.assessmentTest.updateMany).toHaveBeenCalledWith({
      where: { id: 'test-3', testSeriesId: 'series-123' },
      data: { orderIndex: 1 },
    });
  });

  it('should reject setting duplicate questions on a test', async () => {
    mockPrisma.assessmentTest.findUnique.mockResolvedValueOnce({ id: 'test-123' });

    await expect(
      service.setTestQuestions('test-123', {
        questions: [{ questionId: 'q1' }, { questionId: 'q1' }],
      }),
    ).rejects.toThrow('Duplicate questions are not permitted');
  });

  it('should prevent activating a test when assigned questions do not match totalQuestions', async () => {
    mockPrisma.testSeriesCategory.findUnique.mockResolvedValueOnce({
      id: 'cat-1',
      name: 'Class 11',
    });

    await expect(
      service.createStandaloneTest('admin-1', {
        categoryId: 'cat-1',
        title: 'Incomplete Active Test',
        isActive: true,
        examPatternMode: 'DEFAULT_NEET',
        totalQuestions: 180,
        questionIds: [],
      }),
    ).rejects.toThrow('Cannot activate test');
  });
});
