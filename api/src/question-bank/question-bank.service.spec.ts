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
      { skipExisting: true },
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
