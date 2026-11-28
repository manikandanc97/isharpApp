import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildPaginationMeta } from '../../common/utils/pagination.util.js';
import { AssessmentTestType, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateAssessmentTestDto,
  CreateStandaloneTestDto,
  DuplicateTestDto,
  UpdateAssessmentTestDto,
  UpdateStandaloneTestDto,
} from '../dto/test-series.dto.js';
import {
  calculateMaximumMarks,
  calculateProportionalDuration,
  DEFAULT_NEET_PATTERN,
} from '../exam-pattern.config.js';
import {
  QuestionSelectionEngine,
  type SubjectAllocationInput,
} from '../question-selection.engine.js';
import { TestCategoryService } from './test-category.service.js';
import { TestQuestionAssignmentService } from './test-question-assignment.service.js';

@Injectable()
export class AssessmentTestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionEngine: QuestionSelectionEngine,
    private readonly categoryService: TestCategoryService,
    private readonly questionAssignment: TestQuestionAssignmentService,
  ) {}

  async listTests(filters: {
    categoryId?: string;
    search?: string;
    subjectCode?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    await this.categoryService.getCategories().catch(() => undefined);

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const whereConditions: Prisma.AssessmentTestWhereInput[] = [];

    if (filters.categoryId) {
      whereConditions.push({
        OR: [
          { categoryId: filters.categoryId },
          { categoryId: null, testSeries: { categoryId: filters.categoryId } },
        ],
      });
    }

    if (filters.isActive !== undefined) {
      whereConditions.push({ isActive: filters.isActive });
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      whereConditions.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (filters.subjectCode && filters.subjectCode !== 'ALL') {
      const code = filters.subjectCode.toUpperCase();
      whereConditions.push({
        OR: [
          { blueprints: { some: { subjectCode: code } } },
          {
            questions: {
              some: {
                question: {
                  courseSubject: { subject: { code } },
                },
              },
            },
          },
        ],
      });
    }

    const where: Prisma.AssessmentTestWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [total, rows] = await Promise.all([
      this.prisma.assessmentTest.count({ where }),
      this.prisma.assessmentTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true } },
          testSeries: {
            select: {
              id: true,
              title: true,
              categoryId: true,
              category: { select: { id: true, name: true } },
            },
          },
          blueprints: {
            orderBy: { orderIndex: 'asc' },
            select: {
              subjectCode: true,
              subjectName: true,
              chapterId: true,
              totalQuestions: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
              results: true,
            },
          },
        },
      }),
    ]);

    return {
      items: rows.map((t) => {
        const effectiveCategory = t.category ?? t.testSeries?.category ?? null;
        const subjectMap = new Map<
          string,
          { subjectCode: string; subjectName: string; count: number }
        >();

        if (Array.isArray(t.subjectDistribution)) {
          for (const item of t.subjectDistribution as Array<{
            subjectCode?: string;
            subjectName?: string;
            questionCount?: number;
          }>) {
            if (item.subjectCode && (item.questionCount ?? 0) > 0) {
              subjectMap.set(item.subjectCode, {
                subjectCode: item.subjectCode,
                subjectName: item.subjectName ?? item.subjectCode,
                count: item.questionCount ?? 0,
              });
            }
          }
        } else {
          for (const b of t.blueprints) {
            const existing = subjectMap.get(b.subjectCode);
            subjectMap.set(b.subjectCode, {
              subjectCode: b.subjectCode,
              subjectName: b.subjectName,
              count: (existing?.count ?? 0) + b.totalQuestions,
            });
          }
        }

        const subjectsSummary = Array.from(subjectMap.values());
        const configurationWarnings = this.computeConfigurationWarnings({
          totalQuestions: t.totalQuestions,
          assignedQuestionCount: t._count.questions,
          totalMarks: t.totalMarks,
          correctMarks: t.correctMarks,
          durationMinutes: t.durationMinutes,
          subjectsSummary,
        });

        return {
          id: t.id,
          testSeriesId: t.testSeriesId,
          categoryId: t.categoryId ?? t.testSeries?.categoryId ?? null,
          categoryName: effectiveCategory?.name ?? 'Uncategorized',
          code: t.code,
          title: t.title,
          description: t.description,
          isActive: t.isActive,
          examPatternMode: t.examPatternMode,
          examPatternVersion: t.examPatternVersion,
          questionSelectionMode: t.questionSelectionMode,
          durationMode: t.durationMode,
          durationMinutes: t.durationMinutes,
          totalQuestions: t.totalQuestions,
          totalMarks: t.totalMarks,
          correctMarks: t.correctMarks,
          negativeMarks: t.negativeMarks,
          hasNegativeMarking: t.hasNegativeMarking,
          scheduledAt: t.scheduledAt?.toISOString() ?? null,
          availableUntil: t.availableUntil?.toISOString() ?? null,
          assignedQuestionCount: t._count.questions,
          attemptCount: t._count.attempts,
          resultCount: t._count.results,
          subjectsSummary,
          configurationWarnings,
          isConfigurationValid: configurationWarnings.length === 0,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };
      }),
      ...buildPaginationMeta(total, page, limit),
    };
  }

  private computeConfigurationWarnings(params: {
    totalQuestions: number;
    assignedQuestionCount: number;
    totalMarks: number;
    correctMarks: number;
    durationMinutes: number;
    subjectsSummary: Array<{ count: number }>;
  }): string[] {
    const warnings: string[] = [];
    if (params.totalQuestions <= 0) {
      warnings.push('Configured question count must be greater than 0.');
    }
    if (params.assignedQuestionCount !== params.totalQuestions) {
      warnings.push(
        `Assigned questions (${params.assignedQuestionCount}) do not match configured total (${params.totalQuestions}).`,
      );
    }
    if (params.subjectsSummary.length === 0) {
      warnings.push('Subject distribution is not configured.');
    } else {
      const subjectTotal = params.subjectsSummary.reduce(
        (sum, s) => sum + s.count,
        0,
      );
      if (subjectTotal !== params.totalQuestions) {
        warnings.push(
          `Subject allocation total (${subjectTotal}) does not match configured total (${params.totalQuestions}).`,
        );
      }
    }
    if (params.durationMinutes <= 0) {
      warnings.push('Examination duration must be greater than 0 minutes.');
    }
    const expectedMarks = params.totalQuestions * params.correctMarks;
    if (params.totalMarks !== expectedMarks) {
      warnings.push(
        `Maximum marks (${params.totalMarks}) do not match ${params.totalQuestions} × ${params.correctMarks} (${expectedMarks}).`,
      );
    }
    return warnings;
  }

  private async getOrCreateInternalSeriesForCategory(
    tx: Prisma.TransactionClient,
    categoryId: string,
    profileId: string,
  ) {
    const existing = await tx.testSeries.findFirst({
      where: { categoryId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) return existing;

    const category = await tx.testSeriesCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    return tx.testSeries.create({
      data: {
        title: `${category.name} Tests`,
        slug: `cat-${category.slug}-${Date.now().toString().slice(-4)}`,
        description: `Automated container for ${category.name} tests`,
        categoryId,
        isActive: true,
        createdById: profileId,
      },
    });
  }

  private async validateActiveQuestions(
    questionIds: string[],
    expectedCount: number,
  ) {
    if (new Set(questionIds).size !== questionIds.length) {
      throw new BadRequestException(
        'Duplicate questions are not permitted in a test',
      );
    }
    if (questionIds.length !== expectedCount) {
      throw new BadRequestException(
        `Selected question count (${questionIds.length}) must match configured total questions (${expectedCount})`,
      );
    }
    const dbQuestions = await this.prisma.question.findMany({
      where: { id: { in: questionIds }, isActive: true },
      select: { id: true },
    });
    if (dbQuestions.length !== questionIds.length) {
      throw new BadRequestException(
        'One or more selected questions are invalid or inactive',
      );
    }
  }

  private async assignQuestionsInTx(
    tx: Prisma.TransactionClient,
    testId: string,
    questionIds: string[],
    correctMarks: number,
    negativeMarks: number,
  ) {
    if (questionIds.length === 0) return;
    const qDetails = await tx.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        courseSubject: { select: { subject: { select: { code: true } } } },
      },
    });
    const sectionById = new Map(
      qDetails.map((q) => [q.id, q.courseSubject.subject.code]),
    );

    await tx.assessmentTestQuestion.createMany({
      data: questionIds.map((qId, index) => ({
        assessmentTestId: testId,
        questionId: qId,
        position: index + 1,
        section: sectionById.get(qId) ?? 'A',
        correctMarks,
        negativeMarks,
      })),
    });
  }

  async createStandaloneTest(
    profileId: string | null,
    dto: CreateStandaloneTestDto,
  ) {
    if (!profileId) throw new BadRequestException('User profile is required');
    const title = dto.title?.trim();
    if (!title) throw new BadRequestException('Test name is required');
    if (!dto.categoryId) throw new BadRequestException('Category is required');

    const category = await this.prisma.testSeriesCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const examPatternMode = dto.examPatternMode ?? 'DEFAULT_NEET';
    const questionSelectionMode = dto.questionSelectionMode ?? 'AUTOMATIC';
    const durationMode = dto.durationMode ?? 'AUTOMATIC';

    const correctMarks =
      examPatternMode === 'DEFAULT_NEET'
        ? DEFAULT_NEET_PATTERN.correctMarks
        : Math.max(1, dto.correctMarks ?? DEFAULT_NEET_PATTERN.correctMarks);

    const hasNegativeMarking =
      examPatternMode === 'DEFAULT_NEET'
        ? true
        : dto.hasNegativeMarking !== false;

    const negativeMarks =
      examPatternMode === 'DEFAULT_NEET'
        ? DEFAULT_NEET_PATTERN.negativeMarks
        : hasNegativeMarking
          ? Math.max(0, dto.negativeMarks ?? DEFAULT_NEET_PATTERN.negativeMarks)
          : 0;

    const subjectDistribution = dto.subjectDistribution ?? [];
    const totalQuestionsFromSubjects = subjectDistribution.reduce(
      (sum, s) => sum + (s.questionCount || 0),
      0,
    );

    const totalQuestions =
      totalQuestionsFromSubjects > 0
        ? totalQuestionsFromSubjects
        : (dto.totalQuestions ??
          (examPatternMode === 'DEFAULT_NEET'
            ? DEFAULT_NEET_PATTERN.totalQuestions
            : 0));

    if (totalQuestions <= 0) {
      throw new BadRequestException('Total questions must be greater than 0');
    }

    const durationMinutes =
      durationMode === 'AUTOMATIC'
        ? calculateProportionalDuration(totalQuestions)
        : (dto.durationMinutes ?? 0);

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new BadRequestException(
        'Duration must be a positive number of minutes',
      );
    }

    const totalMarks = calculateMaximumMarks(totalQuestions, correctMarks);

    const questionIds = dto.questionIds ?? [];
    const targetActive = dto.isActive !== false;
    if (targetActive && questionIds.length !== totalQuestions) {
      throw new BadRequestException(
        `Cannot activate test: ${questionIds.length} of ${totalQuestions} required questions are assigned. Assign all questions or save as Inactive.`,
      );
    }
    if (questionIds.length > 0) {
      await this.validateActiveQuestions(questionIds, totalQuestions);
    }

    const code =
      dto.code?.trim().toUpperCase() ||
      `TEST-${Date.now().toString(36).toUpperCase()}`;

    const testType =
      subjectDistribution.length === 1
        ? subjectDistribution[0].chapterMode === 'SELECTED'
          ? AssessmentTestType.CHAPTER_WISE
          : AssessmentTestType.SUBJECT_WISE
        : totalQuestions >= 180
          ? AssessmentTestType.FULL_SYLLABUS
          : AssessmentTestType.CUSTOM_TEST;

    return this.prisma.$transaction(async (tx) => {
      const internalSeries = await this.getOrCreateInternalSeriesForCategory(
        tx,
        dto.categoryId,
        profileId,
      );

      const created = await tx.assessmentTest.create({
        data: {
          testSeriesId: internalSeries.id,
          categoryId: dto.categoryId,
          code,
          title,
          description: dto.description?.trim() || null,
          testType,
          examPatternMode,
          examPatternVersion:
            dto.examPatternVersion ?? DEFAULT_NEET_PATTERN.version,
          questionSelectionMode,
          durationMode,
          isActive: dto.isActive !== false,
          durationMinutes,
          totalQuestions,
          totalMarks,
          passingMarks: dto.passingMarks ?? null,
          hasNegativeMarking,
          correctMarks,
          negativeMarks,
          maxAttempts: dto.maxAttempts ?? 1,
          randomizeQuestions: dto.randomizeQuestions !== false,
          randomizeOptions: dto.randomizeOptions !== false,
          showResultsImmediately: dto.showResultsImmediately ?? false,
          subjectDistribution:
            subjectDistribution as unknown as Prisma.InputJsonValue,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          availableUntil: dto.availableUntil
            ? new Date(dto.availableUntil)
            : null,
          createdById: profileId,
        },
      });

      if (subjectDistribution.length > 0) {
        await this.questionAssignment.syncBlueprints(
          tx,
          created.id,
          subjectDistribution,
          correctMarks,
          negativeMarks,
        );
      }

      if (questionIds.length > 0) {
        await this.assignQuestionsInTx(
          tx,
          created.id,
          questionIds,
          correctMarks,
          negativeMarks,
        );
      }

      return created;
    });
  }

  async updateStandaloneTest(testId: string, dto: UpdateStandaloneTestDto) {
    const existing = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
      include: { _count: { select: { attempts: true, questions: true } } },
    });
    if (!existing) throw new NotFoundException('Assessment test not found');

    const hasAttempts = existing._count.attempts > 0;

    if (hasAttempts) {
      const attemptsDestructiveChange =
        dto.questionIds !== undefined ||
        (dto.correctMarks !== undefined &&
          dto.correctMarks !== existing.correctMarks) ||
        (dto.negativeMarks !== undefined &&
          dto.negativeMarks !== existing.negativeMarks) ||
        (dto.durationMinutes !== undefined &&
          dto.durationMinutes !== existing.durationMinutes) ||
        (dto.totalQuestions !== undefined &&
          dto.totalQuestions !== existing.totalQuestions);

      if (attemptsDestructiveChange) {
        throw new BadRequestException(
          'This test already has student attempts. Questions, duration, and marking scheme cannot be modified. You may duplicate the test or update its title/availability.',
        );
      }
    }

    const nextExamPatternMode = dto.examPatternMode ?? existing.examPatternMode;
    const nextDurationMode = dto.durationMode ?? existing.durationMode;
    const nextCorrectMarks =
      nextExamPatternMode === 'DEFAULT_NEET'
        ? DEFAULT_NEET_PATTERN.correctMarks
        : (dto.correctMarks ?? existing.correctMarks);
    const nextHasNegative =
      nextExamPatternMode === 'DEFAULT_NEET'
        ? true
        : (dto.hasNegativeMarking ?? existing.hasNegativeMarking);
    const nextNegativeMarks =
      nextExamPatternMode === 'DEFAULT_NEET'
        ? DEFAULT_NEET_PATTERN.negativeMarks
        : nextHasNegative
          ? (dto.negativeMarks ?? existing.negativeMarks)
          : 0;

    const subjectDistribution =
      dto.subjectDistribution ??
      (existing.subjectDistribution as SubjectAllocationInput[] | null) ??
      [];

    const totalFromSubjects = subjectDistribution.reduce(
      (sum, s) => sum + (s.questionCount || 0),
      0,
    );
    const nextTotalQuestions =
      totalFromSubjects > 0
        ? totalFromSubjects
        : (dto.totalQuestions ?? existing.totalQuestions);

    const nextDurationMinutes =
      nextDurationMode === 'AUTOMATIC'
        ? calculateProportionalDuration(nextTotalQuestions)
        : (dto.durationMinutes ?? existing.durationMinutes);

    if (nextDurationMinutes <= 0) {
      throw new BadRequestException(
        'Duration must be a positive number of minutes',
      );
    }

    const nextTotalMarks = calculateMaximumMarks(
      nextTotalQuestions,
      nextCorrectMarks,
    );

    const nextIsActive = dto.isActive ?? existing.isActive;
    const resultingAssignedCount =
      dto.questionIds !== undefined
        ? dto.questionIds.length
        : existing._count.questions;

    if (nextIsActive && resultingAssignedCount !== nextTotalQuestions) {
      throw new BadRequestException(
        `Cannot activate test: ${resultingAssignedCount} of ${nextTotalQuestions} required questions are assigned. Assign all questions or keep the test Inactive.`,
      );
    }

    if (dto.questionIds !== undefined) {
      await this.validateActiveQuestions(dto.questionIds, nextTotalQuestions);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.assessmentTest.update({
        where: { id: testId },
        data: {
          ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
          ...(dto.title?.trim() ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.scheduledAt !== undefined
            ? {
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
              }
            : {}),
          ...(dto.availableUntil !== undefined
            ? {
                availableUntil: dto.availableUntil
                  ? new Date(dto.availableUntil)
                  : null,
              }
            : {}),
          ...(!hasAttempts
            ? {
                examPatternMode: nextExamPatternMode,
                examPatternVersion:
                  dto.examPatternVersion ?? existing.examPatternVersion,
                questionSelectionMode:
                  dto.questionSelectionMode ?? existing.questionSelectionMode,
                durationMode: nextDurationMode,
                durationMinutes: nextDurationMinutes,
                totalQuestions: nextTotalQuestions,
                totalMarks: nextTotalMarks,
                correctMarks: nextCorrectMarks,
                negativeMarks: nextNegativeMarks,
                hasNegativeMarking: nextHasNegative,
                ...(dto.randomizeQuestions !== undefined
                  ? { randomizeQuestions: dto.randomizeQuestions }
                  : {}),
                ...(dto.maxAttempts !== undefined
                  ? { maxAttempts: dto.maxAttempts }
                  : {}),
                ...(dto.subjectDistribution !== undefined
                  ? {
                      subjectDistribution:
                        dto.subjectDistribution as unknown as Prisma.InputJsonValue,
                    }
                  : {}),
              }
            : {}),
        },
      });

      if (!hasAttempts && dto.subjectDistribution !== undefined) {
        await tx.testBlueprint.deleteMany({
          where: { assessmentTestId: testId },
        });
        if (dto.subjectDistribution.length > 0) {
          await this.questionAssignment.syncBlueprints(
            tx,
            testId,
            dto.subjectDistribution,
            nextCorrectMarks,
            nextNegativeMarks,
          );
        }
      }

      if (!hasAttempts && dto.questionIds !== undefined) {
        await tx.assessmentTestQuestion.deleteMany({
          where: { assessmentTestId: testId },
        });
        await this.assignQuestionsInTx(
          tx,
          testId,
          dto.questionIds,
          nextCorrectMarks,
          nextNegativeMarks,
        );
      }

      return updated;
    });
  }

  async duplicateStandaloneTest(
    profileId: string | null,
    testId: string,
    dto?: DuplicateTestDto,
  ) {
    if (!profileId) throw new BadRequestException('User profile is required');
    const source = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
      include: {
        questions: { orderBy: { position: 'asc' } },
        blueprints: { orderBy: { orderIndex: 'asc' } },
        testSeries: { select: { categoryId: true } },
      },
    });
    if (!source) throw new NotFoundException('Assessment test not found');

    const mode = dto?.mode ?? 'COPY_QUESTIONS';
    const copyCode = `${source.code}-CPY-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const copyTitle = `${source.title} (Copy)`;
    const categoryId = source.categoryId ?? source.testSeries.categoryId;

    let regeneratedQuestions: Array<{ id: string; subjectCode: string }> | null =
      null;
    if (mode === 'REGENERATE_QUESTIONS') {
      const dist = source.subjectDistribution as SubjectAllocationInput[] | null;
      if (!dist || dist.length === 0) {
        throw new BadRequestException(
          'Cannot regenerate questions because this test has no saved subject distribution',
        );
      }
      const result = await this.questionEngine.generateQuestions({
        subjectAllocations: dist,
      });
      if (result.shortages.length > 0) {
        throw new BadRequestException({
          message: 'Insufficient eligible questions to regenerate test',
          shortages: result.shortages,
        });
      }
      regeneratedQuestions = result.questions.map((q) => ({
        id: q.id,
        subjectCode: q.subjectCode,
      }));
    }

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.assessmentTest.create({
        data: {
          testSeriesId: source.testSeriesId,
          categoryId,
          code: copyCode,
          title: copyTitle,
          description: source.description,
          instructionsEn: source.instructionsEn,
          instructionsTa: source.instructionsTa,
          testType: source.testType,
          examPatternMode: source.examPatternMode,
          examPatternVersion: source.examPatternVersion,
          questionSelectionMode: source.questionSelectionMode,
          durationMode: source.durationMode,
          subjectDistribution: source.subjectDistribution ?? Prisma.JsonNull,
          isActive: source.isActive,
          isCancelled: false,
          durationMinutes: source.durationMinutes,
          totalQuestions: source.totalQuestions,
          totalMarks: source.totalMarks,
          passingMarks: source.passingMarks,
          hasNegativeMarking: source.hasNegativeMarking,
          correctMarks: source.correctMarks,
          negativeMarks: source.negativeMarks,
          maxAttempts: source.maxAttempts,
          randomizeQuestions: source.randomizeQuestions,
          randomizeOptions: source.randomizeOptions,
          showResultsImmediately: source.showResultsImmediately,
          isOfflineAvailable: source.isOfflineAvailable,
          orderIndex: source.orderIndex + 1,
          createdById: profileId,
        },
      });

      if (regeneratedQuestions) {
        await tx.assessmentTestQuestion.createMany({
          data: regeneratedQuestions.map((q, index) => ({
            assessmentTestId: copy.id,
            questionId: q.id,
            position: index + 1,
            section: q.subjectCode,
            correctMarks: source.correctMarks,
            negativeMarks: source.negativeMarks,
          })),
        });
      } else if (source.questions.length > 0) {
        await tx.assessmentTestQuestion.createMany({
          data: source.questions.map((q) => ({
            assessmentTestId: copy.id,
            questionId: q.questionId,
            position: q.position,
            section: q.section,
            correctMarks: q.correctMarks,
            negativeMarks: q.negativeMarks,
          })),
        });
      }

      if (source.blueprints.length > 0) {
        await tx.testBlueprint.createMany({
          data: source.blueprints.map((b) => ({
            assessmentTestId: copy.id,
            subjectCode: b.subjectCode,
            subjectName: b.subjectName,
            chapterId: b.chapterId,
            sectionName: b.sectionName,
            totalQuestions: b.totalQuestions,
            mandatoryCount: b.mandatoryCount,
            correctMarks: b.correctMarks,
            negativeMarks: b.negativeMarks,
            orderIndex: b.orderIndex,
          })),
        });
      }

      return copy;
    });
  }

  async deleteStandaloneTest(testId: string) {
    const existing = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
      include: { _count: { select: { attempts: true, results: true } } },
    });
    if (!existing) throw new NotFoundException('Assessment test not found');

    if (existing._count.attempts > 0 || existing._count.results > 0) {
      throw new BadRequestException(
        'This test has existing student attempts or results and cannot be deleted. Please deactivate it instead.',
      );
    }

    return this.prisma.assessmentTest.delete({ where: { id: testId } });
  }

  async createTest(
    profileId: string | null,
    seriesId: string,
    dto: CreateAssessmentTestDto,
  ) {
    if (!profileId) throw new BadRequestException('User profile is required');
    const series = await this.prisma.testSeries.findUnique({
      where: { id: seriesId },
    });
    if (!series) throw new NotFoundException('Test series not found');

    const code =
      dto.code?.trim().toUpperCase() || `TEST-${Date.now().toString().slice(-6)}`;

    const lastTest = await this.prisma.assessmentTest.findFirst({
      where: { testSeriesId: seriesId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    const orderIndex =
      dto.orderIndex ?? (lastTest ? lastTest.orderIndex + 1 : 1);

    return this.prisma.assessmentTest.create({
      data: {
        testSeriesId: seriesId,
        categoryId: series.categoryId,
        code,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        instructionsEn: dto.instructionsEn?.trim() || null,
        instructionsTa: dto.instructionsTa?.trim() || null,
        testType: dto.testType || AssessmentTestType.FULL_SYLLABUS,
        isActive: dto.isActive !== false,
        isCancelled: dto.isCancelled ?? false,
        durationMinutes: dto.durationMinutes ?? 180,
        totalQuestions: dto.totalQuestions ?? 180,
        totalMarks: dto.totalMarks ?? 720,
        passingMarks: dto.passingMarks ?? 350,
        hasNegativeMarking: dto.hasNegativeMarking !== false,
        correctMarks: dto.correctMarks ?? 4,
        negativeMarks: dto.negativeMarks ?? 1,
        maxAttempts: dto.maxAttempts ?? 1,
        randomizeQuestions: dto.randomizeQuestions !== false,
        randomizeOptions: dto.randomizeOptions !== false,
        showResultsImmediately: dto.showResultsImmediately ?? false,
        isOfflineAvailable: dto.isOfflineAvailable !== false,
        orderIndex,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
        createdById: profileId,
      },
    });
  }

  async getTestById(testId: string) {
    const t = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
      include: {
        category: { select: { id: true, name: true } },
        testSeries: {
          select: {
            id: true,
            title: true,
            academicYear: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
          },
        },
        questions: {
          orderBy: { position: 'asc' },
          include: {
            question: {
              include: {
                options: { orderBy: { position: 'asc' } },
                chapter: true,
                courseSubject: { include: { subject: true } },
              },
            },
          },
        },
        blueprints: { orderBy: { orderIndex: 'asc' } },
        _count: {
          select: { attempts: true, paperSets: true, offlineSessions: true },
        },
      },
    });
    if (!t) throw new NotFoundException('Assessment test not found');
    return {
      ...t,
      categoryId: t.categoryId ?? t.testSeries?.categoryId ?? null,
      categoryName: t.category?.name ?? t.testSeries?.category?.name ?? null,
    };
  }

  async updateTest(testId: string, dto: UpdateAssessmentTestDto) {
    const existing = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
    });
    if (!existing) throw new NotFoundException('Assessment test not found');

    return this.prisma.assessmentTest.update({
      where: { id: testId },
      data: {
        ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}),
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.instructionsEn !== undefined
          ? { instructionsEn: dto.instructionsEn }
          : {}),
        ...(dto.instructionsTa !== undefined
          ? { instructionsTa: dto.instructionsTa }
          : {}),
        ...(dto.testType ? { testType: dto.testType } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isCancelled !== undefined
          ? { isCancelled: dto.isCancelled }
          : {}),
        ...(dto.durationMinutes !== undefined
          ? { durationMinutes: dto.durationMinutes }
          : {}),
        ...(dto.totalQuestions !== undefined
          ? { totalQuestions: dto.totalQuestions }
          : {}),
        ...(dto.totalMarks !== undefined ? { totalMarks: dto.totalMarks } : {}),
        ...(dto.passingMarks !== undefined
          ? { passingMarks: dto.passingMarks }
          : {}),
        ...(dto.hasNegativeMarking !== undefined
          ? { hasNegativeMarking: dto.hasNegativeMarking }
          : {}),
        ...(dto.correctMarks !== undefined
          ? { correctMarks: dto.correctMarks }
          : {}),
        ...(dto.negativeMarks !== undefined
          ? { negativeMarks: dto.negativeMarks }
          : {}),
        ...(dto.maxAttempts !== undefined
          ? { maxAttempts: dto.maxAttempts }
          : {}),
        ...(dto.randomizeQuestions !== undefined
          ? { randomizeQuestions: dto.randomizeQuestions }
          : {}),
        ...(dto.randomizeOptions !== undefined
          ? { randomizeOptions: dto.randomizeOptions }
          : {}),
        ...(dto.showResultsImmediately !== undefined
          ? { showResultsImmediately: dto.showResultsImmediately }
          : {}),
        ...(dto.isOfflineAvailable !== undefined
          ? { isOfflineAvailable: dto.isOfflineAvailable }
          : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
        ...(dto.scheduledAt !== undefined
          ? {
              scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
            }
          : {}),
        ...(dto.availableUntil !== undefined
          ? {
              availableUntil: dto.availableUntil
                ? new Date(dto.availableUntil)
                : null,
            }
          : {}),
      },
    });
  }

  async reorderTests(seriesId: string, orderedTestIds: string[]) {
    return this.prisma.$transaction(
      orderedTestIds.map((id, index) =>
        this.prisma.assessmentTest.updateMany({
          where: { id, testSeriesId: seriesId },
          data: { orderIndex: index + 1 },
        }),
      ),
    );
  }
}
