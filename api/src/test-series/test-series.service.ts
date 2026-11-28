import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateAssessmentTestDto,
  CreateCategoryDto,
  CreateStandaloneTestDto,
  CreateTestSeriesDto,
  DuplicateTestDto,
  SetTestBlueprintDto,
  SetTestQuestionsDto,
  UpdateAssessmentTestDto,
  UpdateCategoryDto,
  UpdateStandaloneTestDto,
  UpdateTestSeriesDto,
} from './dto/test-series.dto.js';
import { QuestionSelectionEngine } from './question-selection.engine.js';
import { AssessmentTestService } from './services/assessment-test.service.js';
import { TestCategoryService } from './services/test-category.service.js';
import { TestConfigurationService } from './services/test-configuration.service.js';
import { TestQuestionAssignmentService } from './services/test-question-assignment.service.js';

export type DerivedTestLifecycleStatus =
  | 'UPCOMING'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'INACTIVE';

export function deriveTestLifecycleStatus(
  test: {
    isActive: boolean;
    isCancelled: boolean;
    scheduledAt: Date | null;
    availableUntil: Date | null;
  },
  now = new Date(),
): DerivedTestLifecycleStatus {
  if (!test.isActive) return 'INACTIVE';
  if (test.isCancelled) return 'CANCELLED';
  if (test.scheduledAt && test.scheduledAt > now) return 'UPCOMING';
  if (test.availableUntil && test.availableUntil < now) return 'COMPLETED';
  return 'ONGOING';
}

/**
 * Coordinates test-series CRUD and overview statistics while delegating
 * category management, exam configuration, assessment tests, and question
 * assignment to focused domain services.
 */
@Injectable()
export class TestSeriesService {
  private readonly categories: TestCategoryService;
  private readonly configuration: TestConfigurationService;
  private readonly assessmentTests: AssessmentTestService;
  private readonly questionAssignment: TestQuestionAssignmentService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly questionEngine: QuestionSelectionEngine,
    @Optional() categories?: TestCategoryService,
    @Optional() configuration?: TestConfigurationService,
    @Optional() assessmentTests?: AssessmentTestService,
    @Optional() questionAssignment?: TestQuestionAssignmentService,
  ) {
    this.categories = categories ?? new TestCategoryService(prisma);
    this.configuration =
      configuration ?? new TestConfigurationService(questionEngine);
    this.questionAssignment =
      questionAssignment ?? new TestQuestionAssignmentService(prisma);
    this.assessmentTests =
      assessmentTests ??
      new AssessmentTestService(
        prisma,
        questionEngine,
        this.categories,
        this.questionAssignment,
      );
  }

  // --------------------------------------------------------------------------
  // CATEGORIES (Delegated to TestCategoryService)
  // --------------------------------------------------------------------------

  getCategories() {
    return this.categories.getCategories();
  }

  createCategory(dto: CreateCategoryDto) {
    return this.categories.createCategory(dto);
  }

  updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.categories.updateCategory(id, dto);
  }

  deleteCategory(id: string, moveToCategoryId?: string) {
    return this.categories.deleteCategory(id, moveToCategoryId);
  }

  // --------------------------------------------------------------------------
  // CONFIGURATION (Delegated to TestConfigurationService)
  // --------------------------------------------------------------------------

  getExamConfiguration() {
    return this.configuration.getExamConfiguration();
  }

  // --------------------------------------------------------------------------
  // ASSESSMENT TESTS (Delegated to AssessmentTestService & TestQuestionAssignmentService)
  // --------------------------------------------------------------------------

  listTests(filters: {
    categoryId?: string;
    search?: string;
    subjectCode?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.assessmentTests.listTests(filters);
  }

  createStandaloneTest(profileId: string | null, dto: CreateStandaloneTestDto) {
    return this.assessmentTests.createStandaloneTest(profileId, dto);
  }

  updateStandaloneTest(testId: string, dto: UpdateStandaloneTestDto) {
    return this.assessmentTests.updateStandaloneTest(testId, dto);
  }

  duplicateStandaloneTest(
    profileId: string | null,
    testId: string,
    dto?: DuplicateTestDto,
  ) {
    return this.assessmentTests.duplicateStandaloneTest(profileId, testId, dto);
  }

  deleteStandaloneTest(testId: string) {
    return this.assessmentTests.deleteStandaloneTest(testId);
  }

  createTest(
    profileId: string | null,
    seriesId: string,
    dto: CreateAssessmentTestDto,
  ) {
    return this.assessmentTests.createTest(profileId, seriesId, dto);
  }

  getTestById(testId: string) {
    return this.assessmentTests.getTestById(testId);
  }

  updateTest(testId: string, dto: UpdateAssessmentTestDto) {
    return this.assessmentTests.updateTest(testId, dto);
  }

  deleteTest(testId: string) {
    return this.assessmentTests.deleteStandaloneTest(testId);
  }

  duplicateTest(
    profileId: string | null,
    testId: string,
    dto?: DuplicateTestDto,
  ) {
    return this.assessmentTests.duplicateStandaloneTest(profileId, testId, dto);
  }

  reorderTests(seriesId: string, orderedTestIds: string[]) {
    return this.assessmentTests.reorderTests(seriesId, orderedTestIds);
  }

  setTestQuestions(testId: string, dto: SetTestQuestionsDto) {
    return this.questionAssignment.setTestQuestions(testId, dto);
  }

  setTestBlueprint(testId: string, dto: SetTestBlueprintDto) {
    return this.questionAssignment.setTestBlueprint(testId, dto);
  }

  // --------------------------------------------------------------------------
  // TEST SERIES CRUD & OVERVIEW
  // --------------------------------------------------------------------------

  async listSeries(filters: {
    categoryId?: string;
    isActive?: boolean;
    academicYear?: string;
    search?: string;
  }) {
    await this.categories.getCategories().catch(() => undefined);

    const where: Record<string, unknown> = {};
    if (filters.categoryId && filters.categoryId !== 'ALL') {
      where.categoryId = filters.categoryId;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.academicYear && filters.academicYear !== 'ALL') {
      where.academicYear = filters.academicYear;
    }
    if (filters.search?.trim()) {
      where.OR = [
        { title: { contains: filters.search.trim(), mode: 'insensitive' } },
        {
          description: { contains: filters.search.trim(), mode: 'insensitive' },
        },
      ];
    }

    const now = new Date();
    const [series, stats, categories] = await Promise.all([
      this.prisma.testSeries.findMany({
        where,
        include: {
          category: true,
          course: { select: { id: true, code: true, title: true } },
          tests: {
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              code: true,
              title: true,
              testType: true,
              isActive: true,
              isCancelled: true,
              durationMinutes: true,
              totalQuestions: true,
              totalMarks: true,
              scheduledAt: true,
              availableUntil: true,
              orderIndex: true,
              _count: { select: { questions: true, attempts: true } },
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
      }),
      this.getOverviewStats(),
      this.prisma.testSeriesCategory.findMany({
        where: { isActive: true },
        orderBy: { position: 'asc' },
      }),
    ]);

    return {
      series: series.map((s) => ({
        id: s.id,
        name: s.title,
        title: s.title,
        slug: s.slug,
        description: s.description,
        categoryId: s.categoryId,
        categoryName: s.category.name,
        coverImage: s.coverImageUrl,
        academicYear: s.academicYear,
        courseId: s.courseId,
        course: s.course,
        isActive: s.isActive,
        startDate: s.startDate?.toISOString() ?? null,
        endDate: s.endDate?.toISOString() ?? null,
        totalTests: s.tests.length,
        totalMarks: s.tests.reduce((acc, t) => acc + t.totalMarks, 0),
        durationMinutes: s.tests.reduce(
          (acc, t) => Math.max(acc, t.durationMinutes),
          0,
        ),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        tests: s.tests.map((t) => ({
          id: t.id,
          testSeriesId: s.id,
          name: t.title,
          title: t.title,
          code: t.code,
          testType: t.testType,
          isActive: t.isActive,
          isCancelled: t.isCancelled,
          lifecycleStatus: deriveTestLifecycleStatus(t, now),
          durationMinutes: t.durationMinutes,
          totalQuestions: t.totalQuestions,
          totalMarks: t.totalMarks,
          scheduledAt: t.scheduledAt?.toISOString() ?? null,
          availableUntil: t.availableUntil?.toISOString() ?? null,
          orderIndex: t.orderIndex,
          questionCount: t._count.questions,
          attemptCount: t._count.attempts,
        })),
      })),
      stats,
      categories,
    };
  }

  async getSeriesById(id: string) {
    const now = new Date();
    const s = await this.prisma.testSeries.findUnique({
      where: { id },
      include: {
        category: true,
        course: true,
        tests: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: { questions: true, attempts: true, paperSets: true },
            },
          },
        },
      },
    });
    if (!s) throw new NotFoundException('Test series not found');

    return {
      id: s.id,
      name: s.title,
      title: s.title,
      slug: s.slug,
      description: s.description,
      categoryId: s.categoryId,
      categoryName: s.category.name,
      academicYear: s.academicYear,
      coverImage: s.coverImageUrl,
      courseId: s.courseId,
      isActive: s.isActive,
      startDate: s.startDate?.toISOString() ?? null,
      endDate: s.endDate?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      tests: s.tests.map((t) => ({
        id: t.id,
        testSeriesId: s.id,
        name: t.title,
        title: t.title,
        code: t.code,
        description: t.description,
        instructions: t.instructionsEn,
        instructionsTa: t.instructionsTa,
        testType: t.testType,
        isActive: t.isActive,
        isCancelled: t.isCancelled,
        lifecycleStatus: deriveTestLifecycleStatus(t, now),
        durationMinutes: t.durationMinutes,
        totalQuestions: t.totalQuestions,
        totalMarks: t.totalMarks,
        passingMarks: t.passingMarks,
        negativeMarking: t.hasNegativeMarking,
        correctMarks: t.correctMarks,
        negativeMarks: t.negativeMarks,
        maxAttempts: t.maxAttempts,
        randomizeQuestions: t.randomizeQuestions,
        randomizeOptions: t.randomizeOptions,
        showResultsImmediately: t.showResultsImmediately,
        isOfflineAvailable: t.isOfflineAvailable,
        orderIndex: t.orderIndex,
        scheduledAt: t.scheduledAt?.toISOString() ?? null,
        availableUntil: t.availableUntil?.toISOString() ?? null,
        questionCount: t._count.questions,
        attemptCount: t._count.attempts,
        paperSetCount: t._count.paperSets,
      })),
    };
  }

  async createSeries(profileId: string | null, dto: CreateTestSeriesDto) {
    if (!profileId) throw new BadRequestException('User profile is required');
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Test series title is required');
    }
    if (!dto.categoryId) {
      throw new BadRequestException('Category is required');
    }

    const slug =
      dto.slug?.trim().toLowerCase() ||
      `${dto.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;

    return this.prisma.testSeries.create({
      data: {
        title: dto.title.trim(),
        slug,
        description: dto.description?.trim() || null,
        categoryId: dto.categoryId,
        academicYear: dto.academicYear?.trim() || '2026-2027',
        coverImageUrl: dto.coverImageUrl?.trim() || null,
        courseId: dto.courseId || null,
        isActive: dto.isActive !== false,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        createdById: profileId,
      },
      include: { category: true },
    });
  }

  async updateSeries(id: string, dto: UpdateTestSeriesDto) {
    const existing = await this.prisma.testSeries.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Test series not found');

    return this.prisma.testSeries.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.slug ? { slug: dto.slug.trim().toLowerCase() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.academicYear
          ? { academicYear: dto.academicYear.trim() }
          : {}),
        ...(dto.coverImageUrl !== undefined
          ? { coverImageUrl: dto.coverImageUrl }
          : {}),
        ...(dto.courseId !== undefined
          ? { courseId: dto.courseId || null }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
    });
  }

  async deleteSeries(id: string) {
    const existing = await this.prisma.testSeries.findUnique({
      where: { id },
      include: { _count: { select: { tests: true } } },
    });
    if (!existing) throw new NotFoundException('Test series not found');
    return this.prisma.testSeries.delete({ where: { id } });
  }

  async duplicateSeries(profileId: string | null, id: string) {
    if (!profileId) throw new BadRequestException('User profile is required');
    const source = await this.prisma.testSeries.findUnique({
      where: { id },
      include: {
        tests: {
          include: { questions: true, blueprints: true },
        },
      },
    });
    if (!source) throw new NotFoundException('Source test series not found');

    const copyTitle = `${source.title} (Copy)`;
    const copySlug = `${source.slug}-copy-${Date.now().toString().slice(-4)}`;

    return this.prisma.$transaction(async (tx) => {
      const duplicated = await tx.testSeries.create({
        data: {
          title: copyTitle,
          slug: copySlug,
          description: source.description,
          categoryId: source.categoryId,
          academicYear: source.academicYear,
          coverImageUrl: source.coverImageUrl,
          courseId: source.courseId,
          isActive: source.isActive,
          startDate: source.startDate,
          endDate: source.endDate,
          createdById: profileId,
        },
      });

      for (const t of source.tests) {
        const testCopy = await tx.assessmentTest.create({
          data: {
            testSeriesId: duplicated.id,
            categoryId: t.categoryId ?? source.categoryId,
            code: `${t.code}-CPY-${Date.now().toString().slice(-3)}`,
            title: `${t.title} (Copy)`,
            description: t.description,
            instructionsEn: t.instructionsEn,
            instructionsTa: t.instructionsTa,
            testType: t.testType,
            examPatternMode: t.examPatternMode,
            examPatternVersion: t.examPatternVersion,
            questionSelectionMode: t.questionSelectionMode,
            durationMode: t.durationMode,
            subjectDistribution: t.subjectDistribution ?? Prisma.JsonNull,
            isActive: t.isActive,
            isCancelled: false,
            durationMinutes: t.durationMinutes,
            totalQuestions: t.totalQuestions,
            totalMarks: t.totalMarks,
            passingMarks: t.passingMarks,
            hasNegativeMarking: t.hasNegativeMarking,
            correctMarks: t.correctMarks,
            negativeMarks: t.negativeMarks,
            maxAttempts: t.maxAttempts,
            randomizeQuestions: t.randomizeQuestions,
            randomizeOptions: t.randomizeOptions,
            showResultsImmediately: t.showResultsImmediately,
            isOfflineAvailable: t.isOfflineAvailable,
            orderIndex: t.orderIndex,
            scheduledAt: t.scheduledAt,
            availableUntil: t.availableUntil,
            createdById: profileId,
          },
        });

        if (t.questions.length > 0) {
          await tx.assessmentTestQuestion.createMany({
            data: t.questions.map((q) => ({
              assessmentTestId: testCopy.id,
              questionId: q.questionId,
              position: q.position,
              section: q.section,
              correctMarks: q.correctMarks,
              negativeMarks: q.negativeMarks,
            })),
          });
        }

        if (t.blueprints.length > 0) {
          await tx.testBlueprint.createMany({
            data: t.blueprints.map((b) => ({
              assessmentTestId: testCopy.id,
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
      }

      return duplicated;
    });
  }

  private async getOverviewStats() {
    const now = new Date();
    const [totalSeries, totalTests, upcomingTests, completedTests] =
      await Promise.all([
        this.prisma.testSeries.count(),
        this.prisma.assessmentTest.count(),
        this.prisma.assessmentTest.count({
          where: { isActive: true, isCancelled: false, scheduledAt: { gt: now } },
        }),
        this.prisma.assessmentTest.count({
          where: {
            isActive: true,
            isCancelled: false,
            availableUntil: { lt: now },
          },
        }),
      ]);

    return { totalSeries, totalTests, upcomingTests, completedTests };
  }
}
