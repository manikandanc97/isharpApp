import { ForbiddenException, Injectable } from '@nestjs/common';
import { TestAttemptStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StudentTestQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublishedAssessmentTests(profileId: string | null) {
    if (!profileId) {
      throw new ForbiddenException('An active student profile is required');
    }
    if (!this.prisma.assessmentTest?.findMany) {
      return [];
    }

    const now = new Date();
    const tests = await this.prisma.assessmentTest.findMany({
      where: {
        isActive: true,
        isCancelled: false,
        testSeries: {
          isActive: true,
          OR: [{ courseId: null }, { course: { isActive: true } }],
        },
      },
      include: {
        category: { select: { id: true, name: true } },
        testSeries: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: { select: { id: true, name: true } },
          },
        },
        questions: {
          select: {
            question: {
              select: {
                courseSubject: {
                  select: {
                    subject: { select: { id: true, code: true, name: true } },
                  },
                },
                chapter: { select: { id: true, title: true } },
              },
            },
          },
        },
        attempts: {
          where: { studentProfileId: profileId },
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            startedAt: true,
            submittedAt: true,
            expiresAt: true,
            result: {
              select: {
                totalMarksScored: true,
                maxMarks: true,
                percentage: true,
                accuracyPercentage: true,
              },
            },
          },
          orderBy: { attemptNumber: 'desc' },
        },
        _count: { select: { questions: true } },
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });

    return tests
      .filter((t) => {
        const hasHistory = t.attempts.length > 0;
        const isComplete =
          t._count.questions > 0 && t._count.questions === t.totalQuestions;
        return hasHistory || isComplete;
      })
      .map((t) => {
        const activeAttempt = t.attempts.find(
          (a) => a.status === TestAttemptStatus.IN_PROGRESS && a.expiresAt > now,
        );
        const completedAttempts = t.attempts.filter(
          (a) =>
            a.status === TestAttemptStatus.SUBMITTED ||
            a.status === TestAttemptStatus.EVALUATED,
        );
        const latestResult = completedAttempts[0]?.result || null;

        const subjectsMap = new Map<
          string,
          { code: string; name: string; questionCount: number }
        >();
        const chaptersSet = new Set<string>();

        t.questions.forEach((aq) => {
          const sub = aq.question.courseSubject?.subject;
          if (sub) {
            if (!subjectsMap.has(sub.code)) {
              subjectsMap.set(sub.code, {
                code: sub.code,
                name: sub.name,
                questionCount: 0,
              });
            }
            subjectsMap.get(sub.code)!.questionCount++;
          }
          if (aq.question.chapter?.title) {
            chaptersSet.add(aq.question.chapter.title);
          }
        });

        let availabilityStatus:
          | 'LIVE'
          | 'UPCOMING'
          | 'EXPIRED'
          | 'COMPLETED'
          | 'RESUMABLE' = 'LIVE';
        if (activeAttempt) {
          availabilityStatus = 'RESUMABLE';
        } else if (completedAttempts.length >= t.maxAttempts) {
          availabilityStatus = 'COMPLETED';
        } else if (t.availableUntil && t.availableUntil < now) {
          availabilityStatus = 'EXPIRED';
        } else if (t.scheduledAt && t.scheduledAt > now) {
          availabilityStatus = 'UPCOMING';
        }

        const effectiveCategory = t.category ?? t.testSeries?.category;

        return {
          id: t.id,
          code: t.code,
          title: t.title,
          description: t.description,
          testType: t.testType,
          durationMinutes: t.durationMinutes,
          totalMarks: t.totalMarks,
          passingMarks: t.passingMarks,
          hasNegativeMarking: t.hasNegativeMarking,
          correctMarks: t.correctMarks,
          negativeMarks: t.negativeMarks,
          maxAttempts: t.maxAttempts,
          showResultsImmediately: t.showResultsImmediately,
          instructionsEn: t.instructionsEn,
          instructionsTa: t.instructionsTa,
          scheduledAt: t.scheduledAt?.toISOString() ?? null,
          availableUntil: t.availableUntil?.toISOString() ?? null,
          questionCount: t._count.questions || t.totalQuestions,
          seriesId: t.testSeries.id,
          seriesTitle: t.testSeries.title,
          categoryId: effectiveCategory?.id ?? null,
          categoryName: effectiveCategory?.name ?? 'General',
          subjects: Array.from(subjectsMap.values()),
          chapters: Array.from(chaptersSet),
          attemptCount: completedAttempts.length,
          activeAttemptId: activeAttempt?.id ?? null,
          availabilityStatus,
          latestResult: latestResult
            ? {
                score: latestResult.totalMarksScored,
                maxMarks: latestResult.maxMarks,
                percentage: latestResult.percentage,
                accuracy: latestResult.accuracyPercentage,
              }
            : null,
        };
      });
  }

  async fetchActiveTestSeries() {
    if (!this.prisma.testSeries?.findMany) {
      return [];
    }
    return this.prisma.testSeries.findMany({
      where: {
        isActive: true,
        OR: [{ courseId: null }, { course: { isActive: true } }],
      },
      include: {
        category: true,
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  groupTestsIntoSeries(
    seriesList: Awaited<
      ReturnType<StudentTestQueryService['fetchActiveTestSeries']>
    >,
    publishedTests: Awaited<
      ReturnType<StudentTestQueryService['getPublishedAssessmentTests']>
    >,
  ) {
    const testsBySeries = new Map<string, typeof publishedTests>();
    publishedTests.forEach((test) => {
      if (!testsBySeries.has(test.seriesId)) {
        testsBySeries.set(test.seriesId, []);
      }
      testsBySeries.get(test.seriesId)!.push(test);
    });

    return seriesList.map((series) => ({
      id: series.id,
      title: series.title,
      slug: series.slug,
      description: series.description,
      categoryId: series.categoryId,
      categoryName: series.category.name,
      academicYear: series.academicYear,
      coverImageUrl: series.coverImageUrl,
      course: series.course
        ? {
            id: series.course.id,
            title: series.course.title,
            code: series.course.code,
          }
        : null,
      tests: testsBySeries.get(series.id) || [],
    }));
  }

  async getPublishedTestSeries(profileId: string | null) {
    if (!profileId) {
      throw new ForbiddenException('An active student profile is required');
    }
    if (!this.prisma.testSeries?.findMany) {
      return [];
    }

    const [publishedTests, seriesList] = await Promise.all([
      this.getPublishedAssessmentTests(profileId),
      this.fetchActiveTestSeries(),
    ]);
    return this.groupTestsIntoSeries(seriesList, publishedTests);
  }
}
