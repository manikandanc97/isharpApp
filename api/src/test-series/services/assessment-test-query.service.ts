import { Injectable, NotFoundException } from '@nestjs/common';
import { buildPaginationMeta } from '../../common/utils/pagination.util.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TestCategoryService } from './test-category.service.js';

@Injectable()
export class AssessmentTestQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: TestCategoryService,
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
}
