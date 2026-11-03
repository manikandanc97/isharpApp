import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { QuestionBankService } from './question-bank.service.js';

describe('QuestionBankService validation', () => {
  const service = new QuestionBankService(
    {} as PrismaService,
    new ConfigService(),
  );

  it('requires a trusted administrator profile', async () => {
    await expect(service.saveQuestion(null, {})).rejects.toThrow(
      'Administrator profile is not linked',
    );
  });

  it('rejects an empty Excel import', async () => {
    await expect(
      service.importQuestions('profile-id', { rows: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('skips repeated workbook IDs and preserves Excel row numbers', async () => {
    const save = vi
      .spyOn(service, 'saveQuestion')
      .mockResolvedValueOnce({ externalId: 'Q-001' } as never);
    const result = await service.importQuestions('profile-id', {
      rows: [
        { rowNumber: 4, data: { externalId: 'Q-001' } },
        { rowNumber: 9, data: { externalId: 'q-001' } },
      ],
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      total: 2,
      imported: 1,
      skipped: 1,
      failed: 0,
      results: [
        { row: 4, externalId: 'Q-001', status: 'imported' },
        {
          row: 9,
          externalId: 'q-001',
          status: 'skipped',
          reason: 'Duplicate external ID in this workbook',
        },
      ],
    });
    save.mockRestore();
  });

  it('reports an existing question as skipped instead of overwriting it', async () => {
    const save = vi.spyOn(service, 'saveQuestion').mockResolvedValueOnce(null);
    const result = await service.importQuestions('profile-id', {
      rows: [{ rowNumber: 7, data: { externalId: 'EXISTING-1' } }],
    });

    expect(save).toHaveBeenCalledWith(
      'profile-id',
      { externalId: 'EXISTING-1' },
      { skipExisting: true, createMissingChapter: true },
    );
    expect(result).toMatchObject({
      imported: 0,
      skipped: 1,
      failed: 0,
      results: [
        {
          row: 7,
          externalId: 'EXISTING-1',
          status: 'skipped',
          reason: 'Question already exists',
        },
      ],
    });
    save.mockRestore();
  });

  it('treats a concurrent unique-ID insert as a skipped duplicate', async () => {
    const save = vi
      .spyOn(service, 'saveQuestion')
      .mockRejectedValueOnce({ code: 'P2002' });
    const result = await service.importQuestions('profile-id', {
      rows: [{ rowNumber: 12, data: { externalId: 'RACE-1' } }],
    });

    expect(result).toMatchObject({
      imported: 0,
      skipped: 1,
      failed: 0,
      results: [
        {
          row: 12,
          externalId: 'RACE-1',
          status: 'skipped',
          reason: 'Question already exists',
        },
      ],
    });
    save.mockRestore();
  });

  it('creates a missing chapter during bulk import and maps the question', async () => {
    const tx = {
      question: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'question-1' }),
        findUnique: vi.fn().mockResolvedValue({
          id: 'question-1',
          externalId: 'NEW-1',
          options: [],
        }),
      },
      chapter: {
        findFirst: vi.fn().mockResolvedValue(null),
        aggregate: vi.fn().mockResolvedValue({ _max: { position: 2 } }),
        create: vi.fn().mockResolvedValue({
          id: 'chapter-3',
          title: 'Laws of Motion',
        }),
      },
      questionOption: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prisma = {
      courseSubject: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'course-subject-1',
          chapters: [],
        }),
      },
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const importService = new QuestionBankService(
      prisma as unknown as PrismaService,
      new ConfigService(),
    );

    const saved = await importService.saveQuestion(
      'profile-id',
      {
        externalId: 'NEW-1',
        courseCode: 'NEET',
        subjectCode: 'PHYSICS',
        chapterTitle: 'Laws of Motion',
        textEn: 'Question',
        solutionEn: 'Solution',
        options: [
          { label: 'A', textEn: 'One', isCorrect: true },
          { label: 'B', textEn: 'Two', isCorrect: false },
        ],
      },
      { skipExisting: true, createMissingChapter: true },
    );

    expect(tx.chapter.create).toHaveBeenCalledWith({
      data: {
        courseSubjectId: 'course-subject-1',
        title: 'Laws of Motion',
        position: 3,
      },
    });
    expect(tx.question.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ chapterId: 'chapter-3' }),
    });
    expect(saved).toMatchObject({
      externalId: 'NEW-1',
      importMeta: { createdChapter: 'Laws of Motion' },
    });
  });

  it('rejects executable or unsupported media', async () => {
    await expect(
      service.uploadImage({
        buffer: Buffer.from('x'),
        mimetype: 'image/svg+xml',
        originalname: 'x.svg',
        size: 1,
      }),
    ).rejects.toThrow('Only JPG, PNG and WebP images are allowed');
  });

  it('enforces the five-megabyte media limit', async () => {
    await expect(
      service.uploadImage({
        buffer: Buffer.alloc(1),
        mimetype: 'image/png',
        originalname: 'x.png',
        size: 5 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow('Image must be 5 MB or smaller');
  });
});
