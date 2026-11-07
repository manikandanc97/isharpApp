import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  createMockTestRecord,
  setMockTestQuestionsRecord,
} from './mock-test.helper.js';
import { uploadQuestionImage } from './question-media.helper.js';
import { persistQuestionRecord } from './question-persistence.helper.js';
import { runImportPreflight } from './question-preflight.helper.js';
import {
  int,
  isUniqueConstraintError,
  obj,
  str,
} from './question-validation.helper.js';

export interface QuestionListOptions {
  query?: string;
  page?: number;
  limit?: number;
  subjectCode?: string;
  chapterId?: string;
  difficulty?: string;
}

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  listQuestions(filterOrQuery?: string | QuestionListOptions) {
    const filter: QuestionListOptions =
      typeof filterOrQuery === 'string'
        ? { query: filterOrQuery }
        : filterOrQuery || {};

    const q = filter.query?.trim().slice(0, 100);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(
      250,
      Math.max(1, Number(filter.limit) || (filter.page ? 50 : 250)),
    );
    const skip = (page - 1) * limit;

    const whereConditions: Record<string, unknown>[] = [];

    if (q) {
      whereConditions.push({
        OR: [
          { externalId: { contains: q, mode: 'insensitive' } },
          { textEn: { contains: q, mode: 'insensitive' } },
          { textTa: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (filter.subjectCode) {
      whereConditions.push({
        courseSubject: {
          subject: {
            code: filter.subjectCode.toUpperCase(),
          },
        },
      });
    }

    if (filter.chapterId) {
      whereConditions.push({ chapterId: filter.chapterId });
    }

    if (filter.difficulty) {
      whereConditions.push({ difficulty: filter.difficulty.toUpperCase() });
    }

    const where =
      whereConditions.length === 0
        ? undefined
        : whereConditions.length === 1
          ? whereConditions[0]
          : { AND: whereConditions };

    return this.prisma.question.findMany({
      where: where as Parameters<PrismaService['question']['findMany']>[0] extends { where?: infer W } ? W : never,
      include: {
        options: { orderBy: { position: 'asc' } },
        chapter: true,
        courseSubject: { include: { course: true, subject: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });
  }

  saveQuestion(
    profileId: string | null,
    body: unknown,
    savePolicy: {
      skipExisting?: boolean;
      createMissingChapter?: boolean;
    } = {},
  ) {
    return persistQuestionRecord(this.prisma, profileId, body, savePolicy);
  }

  async importQuestions(profileId: string | null, body: unknown) {
    const rows = obj(body).rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500)
      throw new BadRequestException('Upload 1 to 500 question rows');
    const results: {
      row: number;
      externalId?: string;
      status: 'imported' | 'skipped' | 'failed';
      reason?: string;
      error?: string;
    }[] = [];
    const seen = new Set<string>();
    for (let index = 0; index < rows.length; index++) {
      const envelope = obj(rows[index]);
      const rowNumber = int(envelope.rowNumber, index + 2, 2, 1_000_000);
      const row = envelope.data === undefined ? envelope : obj(envelope.data);
      const externalId = str(row.externalId, 'externalId', false, 64);
      const duplicateKey = externalId?.toLocaleLowerCase('en-US');
      if (duplicateKey && seen.has(duplicateKey)) {
        results.push({
          row: rowNumber,
          externalId: externalId ?? undefined,
          status: 'skipped',
          reason: 'Duplicate external ID in this workbook',
        });
        continue;
      }
      if (duplicateKey) seen.add(duplicateKey);
      try {
        const saved = await this.saveQuestion(profileId, row, {
          skipExisting: true,
          createMissingChapter: true,
        });
        results.push(
          saved
            ? {
                row: rowNumber,
                externalId: saved.externalId,
                status: 'imported',
                reason: saved.importMeta?.createdChapter
                  ? `Imported and created chapter: ${saved.importMeta.createdChapter}`
                  : undefined,
              }
            : {
                row: rowNumber,
                externalId: externalId ?? undefined,
                status: 'skipped',
                reason: 'Question already exists',
              },
        );
      } catch (error) {
        if (externalId && isUniqueConstraintError(error)) {
          results.push({
            row: rowNumber,
            externalId,
            status: 'skipped',
            reason: 'Question already exists',
          });
          continue;
        }
        results.push({
          row: rowNumber,
          externalId: externalId ?? undefined,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }
    return {
      total: rows.length,
      imported: results.filter((item) => item.status === 'imported').length,
      skipped: results.filter((item) => item.status === 'skipped').length,
      failed: results.filter((item) => item.status === 'failed').length,
      results,
    };
  }

  importPreflight(body: unknown) {
    return runImportPreflight(this.prisma, body);
  }

  async deleteQuestion(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        _count: { select: { mockTests: true } },
      },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question._count.mockTests > 0)
      throw new BadRequestException(
        'Remove this question from mock tests before deleting it',
      );
    await this.prisma.question.delete({ where: { id } });
    return { id, externalId: question.externalId, deleted: true };
  }

  private mockTestsCache: { data: unknown; expiresAt: number } | null = null;
  private readonly MOCK_TESTS_CACHE_TTL_MS = 30_000;

  invalidateMockTestsCache() {
    this.mockTestsCache = null;
  }

  async listMockTests() {
    const now = Date.now();
    if (this.mockTestsCache && this.mockTestsCache.expiresAt > now) {
      return this.mockTestsCache.data as Awaited<
        ReturnType<QuestionBankService['fetchMockTestsFromDb']>
      >;
    }
    const data = await this.fetchMockTestsFromDb();
    this.mockTestsCache = { data, expiresAt: now + this.MOCK_TESTS_CACHE_TTL_MS };
    return data;
  }

  private fetchMockTestsFromDb() {
    return this.prisma.mockTest.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createMockTest(profileId: string | null, body: unknown) {
    const res = await createMockTestRecord(this.prisma, profileId, body);
    this.invalidateMockTestsCache();
    return res;
  }

  async setMockTestQuestions(id: string, body: unknown) {
    const res = await setMockTestQuestionsRecord(this.prisma, id, body);
    this.invalidateMockTestsCache();
    return res;
  }

  uploadImage(file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  }) {
    return uploadQuestionImage(this.config, file);
  }
}
