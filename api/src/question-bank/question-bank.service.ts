import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  createMockTestRecord,
  setMockTestQuestionsRecord,
} from './mock-test.helper.js';
import { uploadQuestionImage } from './question-media.helper.js';
import {
  QuestionDuplicateDetectionService,
} from './question-duplicate-detection.service.js';
import {
  persistQuestionRecord,
  type QuestionSavePolicy,
} from './question-persistence.helper.js';
import { QuestionImportService } from './services/question-import.service.js';
import {
  isForeignKeyConstraintError,
} from './question-validation.helper.js';

export interface QuestionListOptions {
  query?: string;
  page?: number;
  limit?: number;
  subjectCode?: string;
  chapterId?: string;
  difficulty?: string;
}

export type ImportRowResult = {
  row: number;
  externalId?: string;
  status: 'imported' | 'skipped' | 'failed';
  duplicateCategory?: 'within_excel' | 'database';
  duplicateType?: 'exact' | 'equivalent' | 'answer_conflict' | 'id_conflict';
  matchedId?: string | number;
  reason?: string;
  error?: string;
};

@Injectable()
export class QuestionBankService {
  private readonly duplicateService: QuestionDuplicateDetectionService;
  private readonly importService: QuestionImportService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Optional() duplicateService?: QuestionDuplicateDetectionService,
    @Optional() importService?: QuestionImportService,
  ) {
    this.duplicateService =
      duplicateService ?? new QuestionDuplicateDetectionService();
    this.importService =
      importService ??
      new QuestionImportService(prisma, this.duplicateService);
  }

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
      where: where as Parameters<
        PrismaService['question']['findMany']
      >[0] extends { where?: infer W }
        ? W
        : never,
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
    savePolicy: QuestionSavePolicy = {},
  ) {
    return persistQuestionRecord(this.prisma, profileId, body, {
      duplicateService: this.duplicateService,
      ...savePolicy,
    });
  }

  importQuestions(profileId: string | null, body: unknown) {
    return this.importService.importQuestions(
      profileId,
      body,
      (pid, row, policy) => this.saveQuestion(pid, row, policy),
    );
  }

  backfillFingerprints(batchSize = 100) {
    return this.importService.backfillFingerprints(batchSize);
  }

  importPreflight(body: unknown) {
    return this.importService.importPreflight(body);
  }

  async deleteQuestion(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        _count: {
          select: {
            mockTests: true,
            assessmentQuestions: true,
            attemptQuestions: true,
            attemptAnswers: true,
            answerKeyAudits: true,
          },
        },
      },
    });
    if (!question) throw new NotFoundException('Question not found');

    if (
      (question._count?.attemptQuestions ?? 0) > 0 ||
      (question._count?.attemptAnswers ?? 0) > 0 ||
      (question._count?.answerKeyAudits ?? 0) > 0
    ) {
      throw new BadRequestException(
        'Questions with attempt or answer-key history cannot be deleted',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (tx.assessmentTestQuestion) {
          const assessmentLinks = await tx.assessmentTestQuestion.findMany({
            where: { questionId: id },
            include: { assessmentTest: true },
          });
          for (const link of assessmentLinks) {
            const currentTotal = link.assessmentTest?.totalQuestions ?? 0;
            const currentMarks = link.assessmentTest?.totalMarks ?? 0;
            await tx.assessmentTest.update({
              where: { id: link.assessmentTestId },
              data: {
                totalQuestions: Math.max(0, currentTotal - 1),
                totalMarks: Math.max(
                  0,
                  currentMarks - (link.correctMarks ?? 4),
                ),
              },
            });
          }
          await tx.assessmentTestQuestion.deleteMany({
            where: { questionId: id },
          });
        }

        if (tx.mockTestQuestion) {
          await tx.mockTestQuestion.deleteMany({
            where: { questionId: id },
          });
        }

        await tx.question.delete({ where: { id } });

        return {
          id,
          externalId: question.externalId,
          deleted: true,
          removedFromMockTests: question._count.mockTests,
          removedFromAssessmentTests: question._count.assessmentQuestions,
        };
      });
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new BadRequestException(
          'Cannot delete question because it is referenced by other records',
        );
      }
      throw error;
    }
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
    this.mockTestsCache = {
      data,
      expiresAt: now + this.MOCK_TESTS_CACHE_TTL_MS,
    };
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
