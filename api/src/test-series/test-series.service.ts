import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentTestType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateAssessmentTestDto,
  CreateCategoryDto,
  CreateTestSeriesDto,
  SetTestBlueprintDto,
  SetTestQuestionsDto,
  UpdateAssessmentTestDto,
  UpdateCategoryDto,
  UpdateTestSeriesDto,
} from './dto/test-series.dto.js';

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

@Injectable()
export class TestSeriesService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------

  async getCategories() {
    await this.ensureDefaultCategories();
    return this.prisma.testSeriesCategory.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Category name is required');
    }
    const slug =
      dto.slug?.trim().toLowerCase() ||
      dto.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const existing = await this.prisma.testSeriesCategory.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    return this.prisma.testSeriesCategory.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.testSeriesCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.testSeriesCategory.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.slug ? { slug: dto.slug.trim().toLowerCase() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteCategory(id: string) {
    const seriesCount = await this.prisma.testSeries.count({
      where: { categoryId: id },
    });
    if (seriesCount > 0) {
      throw new BadRequestException(
        `Cannot delete category: it is assigned to ${seriesCount} test series`,
      );
    }
    return this.prisma.testSeriesCategory.delete({ where: { id } });
  }

  private async ensureDefaultCategories() {
    const count = await this.prisma.testSeriesCategory.count();
    if (count > 0) return;

    const defaults = [
      {
        name: 'Class 11',
        slug: 'class-11',
        description: 'Targeted NEET Foundation & Advanced Test Series for Grade 11',
        position: 1,
      },
      {
        name: 'Class 12',
        slug: 'class-12',
        description: 'Rigorous Board & National Entrance Mock Series for Grade 12',
        position: 2,
      },
      {
        name: 'Repeater Course',
        slug: 'repeater-course',
        description: 'Intensive 1-Year Droppers & Repeater Rank Booster Mock Papers',
        position: 3,
      },
    ];

    for (const d of defaults) {
      await this.prisma.testSeriesCategory.upsert({
        where: { slug: d.slug },
        update: {},
        create: d,
      });
    }
  }

  // --------------------------------------------------------------------------
  // TEST SERIES
  // --------------------------------------------------------------------------

  async listSeries(filters: {
    categoryId?: string;
    isActive?: boolean;
    academicYear?: string;
    search?: string;
  }) {
    await this.ensureDefaultCategories();

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
        { description: { contains: filters.search.trim(), mode: 'insensitive' } },
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
        durationMinutes: s.tests.reduce((acc, t) => Math.max(acc, t.durationMinutes), 0),
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
            _count: { select: { questions: true, attempts: true, paperSets: true } },
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
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.academicYear ? { academicYear: dto.academicYear.trim() } : {}),
        ...(dto.coverImageUrl !== undefined ? { coverImageUrl: dto.coverImageUrl } : {}),
        ...(dto.courseId !== undefined ? { courseId: dto.courseId || null } : {}),
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

    // Cascade deletes tests & questions because of relation onDelete: Cascade
    return this.prisma.testSeries.delete({ where: { id } });
  }

  async duplicateSeries(profileId: string | null, id: string) {
    if (!profileId) throw new BadRequestException('User profile is required');
    const source = await this.prisma.testSeries.findUnique({
      where: { id },
      include: {
        tests: {
          include: {
            questions: true,
            blueprints: true,
          },
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
            code: `${t.code}-CPY-${Date.now().toString().slice(-3)}`,
            title: `${t.title} (Copy)`,
            description: t.description,
            instructionsEn: t.instructionsEn,
            instructionsTa: t.instructionsTa,
            testType: t.testType,
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

  // --------------------------------------------------------------------------
  // INDIVIDUAL ASSESSMENT TESTS
  // --------------------------------------------------------------------------

  async createTest(profileId: string | null, seriesId: string, dto: CreateAssessmentTestDto) {
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
    const orderIndex = dto.orderIndex ?? (lastTest ? lastTest.orderIndex + 1 : 1);

    return this.prisma.assessmentTest.create({
      data: {
        testSeriesId: seriesId,
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
        testSeries: { select: { id: true, title: true, academicYear: true } },
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
        _count: { select: { attempts: true, paperSets: true, offlineSessions: true } },
      },
    });
    if (!t) throw new NotFoundException('Assessment test not found');
    return t;
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
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.instructionsEn !== undefined ? { instructionsEn: dto.instructionsEn } : {}),
        ...(dto.instructionsTa !== undefined ? { instructionsTa: dto.instructionsTa } : {}),
        ...(dto.testType ? { testType: dto.testType } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isCancelled !== undefined ? { isCancelled: dto.isCancelled } : {}),
        ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
        ...(dto.totalQuestions !== undefined ? { totalQuestions: dto.totalQuestions } : {}),
        ...(dto.totalMarks !== undefined ? { totalMarks: dto.totalMarks } : {}),
        ...(dto.passingMarks !== undefined ? { passingMarks: dto.passingMarks } : {}),
        ...(dto.hasNegativeMarking !== undefined
          ? { hasNegativeMarking: dto.hasNegativeMarking }
          : {}),
        ...(dto.correctMarks !== undefined ? { correctMarks: dto.correctMarks } : {}),
        ...(dto.negativeMarks !== undefined ? { negativeMarks: dto.negativeMarks } : {}),
        ...(dto.maxAttempts !== undefined ? { maxAttempts: dto.maxAttempts } : {}),
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
          ? { scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null }
          : {}),
        ...(dto.availableUntil !== undefined
          ? { availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null }
          : {}),
      },
    });
  }

  async deleteTest(testId: string) {
    const existing = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
    });
    if (!existing) throw new NotFoundException('Assessment test not found');
    return this.prisma.assessmentTest.delete({ where: { id: testId } });
  }

  async duplicateTest(profileId: string | null, testId: string) {
    if (!profileId) throw new BadRequestException('User profile is required');
    const source = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
      include: { questions: true, blueprints: true },
    });
    if (!source) throw new NotFoundException('Assessment test not found');

    const copyCode = `${source.code}-CPY-${Date.now().toString().slice(-3)}`;
    const copyTitle = `${source.title} (Copy)`;

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.assessmentTest.create({
        data: {
          testSeriesId: source.testSeriesId,
          code: copyCode,
          title: copyTitle,
          description: source.description,
          instructionsEn: source.instructionsEn,
          instructionsTa: source.instructionsTa,
          testType: source.testType,
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

      if (source.questions.length > 0) {
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

  async setTestQuestions(testId: string, dto: SetTestQuestionsDto) {
    const test = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
    });
    if (!test) throw new NotFoundException('Assessment test not found');

    const questionIds = dto.questions.map((q) => q.questionId);
    if (new Set(questionIds).size !== questionIds.length) {
      throw new BadRequestException('Duplicate questions are not permitted');
    }

    const dbQuestions = await this.prisma.question.findMany({
      where: { id: { in: questionIds }, isActive: true },
    });
    if (dbQuestions.length !== questionIds.length) {
      throw new BadRequestException('One or more selected questions are invalid or inactive');
    }

    const byId = new Map(dbQuestions.map((q) => [q.id, q]));

    await this.prisma.$transaction(async (tx) => {
      await tx.assessmentTestQuestion.deleteMany({
        where: { assessmentTestId: testId },
      });

      if (dto.questions.length > 0) {
        await tx.assessmentTestQuestion.createMany({
          data: dto.questions.map((item, index) => {
            const q = byId.get(item.questionId)!;
            return {
              assessmentTestId: testId,
              questionId: item.questionId,
              position: item.position ?? index + 1,
              section: item.section || 'A',
              correctMarks: item.correctMarks ?? q.correctMarks ?? test.correctMarks,
              negativeMarks: item.negativeMarks ?? q.negativeMarks ?? test.negativeMarks,
            };
          }),
        });
      }

      // Update total questions and total marks on the test
      const totalMarks = dto.questions.reduce((sum, item) => {
        const q = byId.get(item.questionId)!;
        return sum + (item.correctMarks ?? q.correctMarks ?? test.correctMarks);
      }, 0);

      await tx.assessmentTest.update({
        where: { id: testId },
        data: {
          totalQuestions: dto.questions.length,
          totalMarks: totalMarks > 0 ? totalMarks : test.totalMarks,
        },
      });
    });

    return {
      testId,
      questionCount: dto.questions.length,
      totalMarks: dto.questions.reduce((sum, item) => {
        const q = byId.get(item.questionId)!;
        return sum + (item.correctMarks ?? q.correctMarks ?? test.correctMarks);
      }, 0),
    };
  }

  async setTestBlueprint(testId: string, dto: SetTestBlueprintDto) {
    const test = await this.prisma.assessmentTest.findUnique({
      where: { id: testId },
    });
    if (!test) throw new NotFoundException('Assessment test not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.testBlueprint.deleteMany({ where: { assessmentTestId: testId } });
      if (dto.blueprints.length > 0) {
        await tx.testBlueprint.createMany({
          data: dto.blueprints.map((b, i) => ({
            assessmentTestId: testId,
            subjectCode: b.subjectCode.toUpperCase(),
            subjectName: b.subjectName,
            chapterId: b.chapterId || null,
            sectionName: b.sectionName || 'Section A',
            totalQuestions: b.totalQuestions,
            mandatoryCount: b.mandatoryCount,
            correctMarks: b.correctMarks ?? 4,
            negativeMarks: b.negativeMarks ?? 1,
            orderIndex: b.orderIndex ?? i + 1,
          })),
        });
      }
    });

    return { testId, blueprintCount: dto.blueprints.length };
  }

  // --------------------------------------------------------------------------
  // STATS
  // --------------------------------------------------------------------------

  private async getOverviewStats() {
    const now = new Date();
    const [totalSeries, totalTests, upcomingTests, completedTests] =
      await Promise.all([
        this.prisma.testSeries.count(),
        this.prisma.assessmentTest.count(),
        this.prisma.assessmentTest.count({
          where: {
            isActive: true,
            isCancelled: false,
            scheduledAt: { gt: now },
          },
        }),
        this.prisma.assessmentTest.count({
          where: {
            isActive: true,
            isCancelled: false,
            availableUntil: { lt: now },
          },
        }),
      ]);

    return {
      totalSeries,
      totalTests,
      upcomingTests,
      completedTests,
    };
  }
}
