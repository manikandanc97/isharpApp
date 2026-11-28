import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
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
import { AssessmentTestDuplicationService } from './assessment-test-duplication.service.js';
import { AssessmentTestQueryService } from './assessment-test-query.service.js';
import { TestCategoryService } from './test-category.service.js';
import { TestQuestionAssignmentService } from './test-question-assignment.service.js';

@Injectable()
export class AssessmentTestService {
  private readonly queries: AssessmentTestQueryService;
  private readonly duplication: AssessmentTestDuplicationService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly questionEngine: QuestionSelectionEngine,
    private readonly categoryService: TestCategoryService,
    private readonly questionAssignment: TestQuestionAssignmentService,
    @Optional() queries?: AssessmentTestQueryService,
    @Optional() duplication?: AssessmentTestDuplicationService,
  ) {
    this.queries =
      queries ?? new AssessmentTestQueryService(prisma, categoryService);
    this.duplication =
      duplication ??
      new AssessmentTestDuplicationService(prisma, questionEngine);
  }

  listTests(filters: {
    categoryId?: string;
    search?: string;
    subjectCode?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.queries.listTests(filters);
  }

  getTestById(testId: string) {
    return this.queries.getTestById(testId);
  }

  duplicateStandaloneTest(
    profileId: string | null,
    testId: string,
    dto?: DuplicateTestDto,
  ) {
    return this.duplication.duplicateStandaloneTest(profileId, testId, dto);
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
