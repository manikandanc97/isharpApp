import { describe, expect, it, vi } from 'vitest';
import { TestSeriesService } from './test-series.service.js';

describe('TestSeriesService', () => {
  const mockPrisma = {
    testSeriesCategory: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    testSeries: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
    },
    $transaction: vi.fn((cb) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const service = new TestSeriesService(mockPrisma as any);

  it('should list categories and ensure defaults if none exist', async () => {
    mockPrisma.testSeriesCategory.count.mockResolvedValueOnce(0);
    mockPrisma.testSeriesCategory.findMany.mockResolvedValueOnce([
      { id: 'cat-1', name: 'Class 11', slug: 'class-11', position: 1 },
      { id: 'cat-2', name: 'Class 12', slug: 'class-12', position: 2 },
    ]);

    const result = await service.getCategories();
    expect(result.length).toBe(2);
    expect(mockPrisma.testSeriesCategory.upsert).toHaveBeenCalled();
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
});
