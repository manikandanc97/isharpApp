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
import {
  QuestionDuplicateDetectionService,
  type QuestionFingerprints,
} from './question-duplicate-detection.service.js';
import {
  persistQuestionRecord,
  type QuestionSavePolicy,
} from './question-persistence.helper.js';
import { runImportPreflight } from './question-preflight.helper.js';
import {
  int,
  isForeignKeyConstraintError,
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    duplicateService?: QuestionDuplicateDetectionService,
  ) {
    this.duplicateService =
      duplicateService ?? new QuestionDuplicateDetectionService();
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

  async importQuestions(profileId: string | null, body: unknown) {
    const envelope = obj(body);
    const rows = envelope.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500)
      throw new BadRequestException('Upload 1 to 500 question rows');
    const results: ImportRowResult[] = [];
    const seenExternalIds = new Set<string>();
    const seenContentFingerprints = new Map<string, number>();
    const seenEquivFingerprints = new Map<string, number>();
    const courseSubjectCache = new Map<string, unknown>();

    const CONCURRENCY = 6;
    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      const slice = rows.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map(async (rowItem, sliceIdx) => {
          const index = i + sliceIdx;
          const envelope = obj(rowItem);
          const rowNumber = int(envelope.rowNumber, index + 2, 2, 1_000_000);
          const row =
            envelope.data === undefined ? envelope : obj(envelope.data);
          const externalId = str(row.externalId, 'externalId', false, 64);
          const duplicateKey = externalId?.toLocaleLowerCase('en-US');
          if (duplicateKey && seenExternalIds.has(duplicateKey)) {
            results.push({
              row: rowNumber,
              externalId: externalId ?? undefined,
              status: 'skipped',
              duplicateCategory: 'within_excel',
              reason: 'Duplicate external ID in this workbook',
            });
            return;
          }
          if (duplicateKey) seenExternalIds.add(duplicateKey);

          const rawOptions = Array.isArray(row.options) ? row.options : [];
          const fingerprints = this.duplicateService.calculateFingerprints({
            type: str(row.type, 'type', false) || 'SINGLE_CORRECT',
            textEn: str(row.textEn, 'textEn'),
            textTa: str(row.textTa, 'textTa'),
            questionImageUrl: str(row.questionImageUrl, 'questionImageUrl'),
            questionImageHash: str(row.questionImageHash, 'questionImageHash'),
            options: rawOptions as any[],
            numericalAnswer: str(row.numericalAnswer, 'numericalAnswer'),
          });

          // Check exact content duplicate within workbook
          if (seenContentFingerprints.has(fingerprints.contentFingerprint)) {
            const firstRow = seenContentFingerprints.get(
              fingerprints.contentFingerprint,
            )!;
            results.push({
              row: rowNumber,
              externalId: externalId ?? undefined,
              status: 'skipped',
              duplicateCategory: 'within_excel',
              duplicateType: 'exact',
              matchedId: firstRow,
              reason: `Duplicate of row ${firstRow} in this workbook`,
            });
            return;
          }
          seenContentFingerprints.set(
            fingerprints.contentFingerprint,
            rowNumber,
          );

          // Check equivalent duplicate within workbook
          if (
            !fingerprints.hasAmbiguousOptions &&
            seenEquivFingerprints.has(fingerprints.equivalentFingerprint)
          ) {
            const firstRow = seenEquivFingerprints.get(
              fingerprints.equivalentFingerprint,
            )!;
            results.push({
              row: rowNumber,
              externalId: externalId ?? undefined,
              status: 'skipped',
              duplicateCategory: 'within_excel',
              duplicateType: 'equivalent',
              matchedId: firstRow,
              reason: `Duplicate of row ${firstRow} (equivalent match with reordered options)`,
            });
            return;
          }
          if (!fingerprints.hasAmbiguousOptions) {
            seenEquivFingerprints.set(
              fingerprints.equivalentFingerprint,
              rowNumber,
            );
          }

          try {
            const saved = await this.saveQuestion(profileId, row, {
              matchExistingContent: true,
              createMissingChapter: true,
              skipReturnDetails: true,
              courseSubjectCache,
              duplicateMode: 'SKIP_DUPLICATES',
              precomputedFingerprints: fingerprints,
            });

            if (saved?.isSkipped) {
              results.push({
                row: rowNumber,
                externalId: saved.externalId || externalId || undefined,
                status: saved.status || 'skipped',
                duplicateCategory: saved.duplicateCategory || 'database',
                duplicateType: saved.duplicateType,
                matchedId: saved.matchedExternalId || saved.matchedQuestionId,
                reason: saved.reason || 'Question already exists',
              });
            } else {
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
            }
          } catch (error) {
            if (externalId && isUniqueConstraintError(error)) {
              results.push({
                row: rowNumber,
                externalId,
                status: 'skipped',
                reason: 'Question already exists',
              });
              return;
            }
            results.push({
              row: rowNumber,
              externalId: externalId ?? undefined,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Import failed',
            });
          }
        }),
      );
    }
    results.sort((a, b) => a.row - b.row);
    return {
      total: rows.length,
      imported: results.filter((item) => item.status === 'imported').length,
      skipped: results.filter((item) => item.status === 'skipped').length,
      failed: results.filter((item) => item.status === 'failed').length,
      results,
    };
  }

  /**
   * Safe batch backfill process to compute and store fingerprints for existing questions.
   */
  async backfillFingerprints(batchSize = 100) {
    let processed = 0;
    let updated = 0;
    let unresolved = 0;
    let hasMore = true;

    while (hasMore) {
      const questions = await this.prisma.question.findMany({
        where: { contentFingerprint: null },
        include: { options: { orderBy: { position: 'asc' } } },
        take: batchSize,
      });

      if (!questions || questions.length === 0) break;

      for (const q of questions) {
        processed++;
        const qImgHash = await this.duplicateService.resolveImageHash(
          q.questionImageUrl,
        );
        const optHashes = await Promise.all(
          q.options.map((opt) =>
            this.duplicateService.resolveImageHash(opt.imageUrl),
          ),
        );
        const fps = this.duplicateService.calculateFingerprints(
          {
            type: q.type,
            textEn: q.textEn,
            textTa: q.textTa,
            questionImageUrl: q.questionImageUrl,
            questionImageHash: qImgHash,
            options: q.options.map((opt, i) => ({
              label: opt.label,
              textEn: opt.textEn,
              textTa: opt.textTa,
              imageUrl: opt.imageUrl,
              imageHash: optHashes[i],
              isCorrect: opt.isCorrect,
              position: opt.position,
            })),
            numericalAnswer: q.numericalAnswer,
          },
          { questionImageHash: qImgHash, optionImageHashes: optHashes },
        );

        if (fps.unresolvedImages) unresolved++;

        await this.prisma.question.update({
          where: { id: q.id },
          data: {
            contentFingerprint: fps.contentFingerprint,
            equivalentFingerprint: fps.equivalentFingerprint,
            fingerprintVersion: fps.fingerprintVersion,
          },
        });
        updated++;
      }

      if (questions.length < batchSize) hasMore = false;
    }

    return { processed, updated, unresolved };
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
        let removedFromAssessmentTests = 0;
        let removedFromMockTests = 0;

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
          const delAssessment = await tx.assessmentTestQuestion.deleteMany({
            where: { questionId: id },
          });
          removedFromAssessmentTests =
            delAssessment?.count ?? assessmentLinks.length;
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
