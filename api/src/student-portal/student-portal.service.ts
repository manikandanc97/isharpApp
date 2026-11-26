import { ForbiddenException, Injectable } from '@nestjs/common';
import { TestAttemptStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StudentPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(profileId: string | null) {
    if (!profileId) {
      throw new ForbiddenException('An active student profile is required');
    }

    const now = new Date();
    const [profile, courses, mockTests, recentQuestions, summary] =
      await Promise.all([
        this.prisma.userProfile.findUnique({
          where: { id: profileId },
          select: {
            id: true,
            displayName: true,
            email: true,
            institutionMembership: {
              select: {
                studentId: true,
                studentCategory: true,
                paymentStatus: true,
                paidAccessUntil: true,
              },
            },
          },
        }),
        this.prisma.course.findMany({
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            courseSubjects: {
              where: { isActive: true, subject: { isActive: true } },
              orderBy: [{ position: 'asc' }, { subject: { name: 'asc' } }],
              select: {
                id: true,
                subject: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    description: true,
                  },
                },
                _count: {
                  select: {
                    chapters: { where: { isActive: true } },
                    questions: {
                      where: {
                        isActive: true,
                        OR: [{ chapterId: null }, { chapter: { isActive: true } }],
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { title: 'asc' },
        }),
        this.prisma.mockTest.findMany({
          where: {
            isActive: true,
            OR: [{ availableUntil: null }, { availableUntil: { gte: now } }],
          },
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            durationMinutes: true,
            totalMarks: true,
            instructionsEn: true,
            instructionsTa: true,
            scheduledAt: true,
            availableUntil: true,
            _count: { select: { questions: true } },
          },
          orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.question.findMany({
          where: {
            isActive: true,
            courseSubject: {
              isActive: true,
              course: { isActive: true },
              subject: { isActive: true },
            },
            OR: [{ chapterId: null }, { chapter: { isActive: true } }],
          },
          select: {
            id: true,
            externalId: true,
            type: true,
            language: true,
            difficulty: true,
            textEn: true,
            textTa: true,
            questionImageUrl: true,
            updatedAt: true,
            chapter: { select: { id: true, title: true } },
            courseSubject: {
              select: {
                course: { select: { id: true, code: true, title: true } },
                subject: { select: { id: true, code: true, name: true } },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 12,
        }),
        Promise.all([
          this.prisma.course.count({ where: { isActive: true } }),
          this.prisma.subject.count({
            where: {
              isActive: true,
              courseSubjects: {
                some: { isActive: true, course: { isActive: true } },
              },
            },
          }),
          this.prisma.chapter.count({
            where: {
              isActive: true,
              courseSubject: {
                isActive: true,
                course: { isActive: true },
                subject: { isActive: true },
              },
            },
          }),
          this.prisma.question.count({
            where: {
              isActive: true,
              courseSubject: {
                isActive: true,
                course: { isActive: true },
                subject: { isActive: true },
              },
              OR: [{ chapterId: null }, { chapter: { isActive: true } }],
            },
          }),
          this.prisma.mockTest.count({
            where: {
              isActive: true,
              OR: [{ availableUntil: null }, { availableUntil: { gte: now } }],
            },
          }),
        ]),
      ]);

    if (!profile?.institutionMembership) {
      throw new ForbiddenException('Student access record is required');
    }

    const [publishedAssessmentTests, publishedTestSeries] = await Promise.all([
      this.getPublishedAssessmentTests(profileId),
      this.getPublishedTestSeries(profileId),
    ]);

    const [activeCourses, activeSubjects, activeChapters, activeQuestions] = summary;
    const publishedMocksCount = publishedAssessmentTests.length > 0 ? publishedAssessmentTests.length : summary[4];

    // Map assessment tests into standard mockTests structure for seamless integration
    const mappedTests =
      publishedAssessmentTests.length > 0
        ? publishedAssessmentTests.map((t) => ({
            id: t.id,
            code: t.code,
            title: t.title,
            description: t.description || `${t.seriesTitle} - ${t.categoryName}`,
            durationMinutes: t.durationMinutes,
            totalMarks: t.totalMarks,
            instructionsEn: t.instructionsEn,
            instructionsTa: t.instructionsTa,
            scheduledAt: t.scheduledAt,
            availableUntil: t.availableUntil,
            questionCount: t.questionCount,
            testType: t.testType,
            seriesId: t.seriesId,
            seriesTitle: t.seriesTitle,
            categoryName: t.categoryName,
            attemptCount: t.attemptCount,
            maxAttempts: t.maxAttempts,
            activeAttemptId: t.activeAttemptId,
            availabilityStatus: t.availabilityStatus,
            latestResult: t.latestResult,
          }))
        : mockTests.map(({ _count, ...test }) => ({
            ...test,
            scheduledAt: test.scheduledAt?.toISOString() ?? null,
            availableUntil: test.availableUntil?.toISOString() ?? null,
            questionCount: _count.questions,
            testType: 'FULL_SYLLABUS',
            seriesId: null,
            seriesTitle: null,
            categoryName: 'General',
            attemptCount: 0,
            maxAttempts: 1,
            activeAttemptId: null,
            availabilityStatus: 'LIVE',
            latestResult: null,
          }));

    return {
      student: {
        profileId: profile.id,
        displayName: profile.displayName,
        email: profile.email,
        studentId: profile.institutionMembership.studentId,
        category: profile.institutionMembership.studentCategory,
        paymentStatus: profile.institutionMembership.paymentStatus,
        paidAccessUntil:
          profile.institutionMembership.paidAccessUntil?.toISOString() ?? null,
      },
      summary: {
        activeCourses,
        activeSubjects,
        activeChapters,
        activeQuestions,
        publishedMocks: publishedMocksCount,
      },
      courses: courses.map((course) => ({
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        subjects: course.courseSubjects.map((item) => ({
          id: item.subject.id,
          code: item.subject.code,
          name: item.subject.name,
          description: item.subject.description,
          chapterCount: item._count.chapters,
          questionCount: item._count.questions,
        })),
      })),
      mockTests: mappedTests,
      testSeries: publishedTestSeries,
      assessmentTests: publishedAssessmentTests,
      recentQuestions: recentQuestions.map((question) => ({
        id: question.id,
        externalId: question.externalId,
        type: question.type,
        language: question.language,
        difficulty: question.difficulty,
        textEn: question.textEn,
        textTa: question.textTa,
        questionImageUrl: question.questionImageUrl,
        updatedAt: question.updatedAt.toISOString(),
        chapter: question.chapter,
        course: question.courseSubject.course,
        subject: question.courseSubject.subject,
      })),
      generatedAt: now.toISOString(),
    };
  }

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
        testSeries: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: { select: { id: true, name: true } },
          },
        },
        questions: {
          include: {
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

    return tests.map((t) => {
      const activeAttempt = t.attempts.find(
        (a) => a.status === TestAttemptStatus.IN_PROGRESS && a.expiresAt > now,
      );
      const completedAttempts = t.attempts.filter(
        (a) => a.status === TestAttemptStatus.SUBMITTED || a.status === TestAttemptStatus.EVALUATED,
      );
      const latestResult = completedAttempts[0]?.result || null;

      const subjectsMap = new Map<string, { code: string; name: string; questionCount: number }>();
      const chaptersSet = new Set<string>();

      t.questions.forEach((aq) => {
        const sub = aq.question.courseSubject?.subject;
        if (sub) {
          if (!subjectsMap.has(sub.code)) {
            subjectsMap.set(sub.code, { code: sub.code, name: sub.name, questionCount: 0 });
          }
          subjectsMap.get(sub.code)!.questionCount++;
        }
        if (aq.question.chapter?.title) {
          chaptersSet.add(aq.question.chapter.title);
        }
      });

      let availabilityStatus: 'LIVE' | 'UPCOMING' | 'EXPIRED' | 'COMPLETED' | 'RESUMABLE' = 'LIVE';
      if (activeAttempt) {
        availabilityStatus = 'RESUMABLE';
      } else if (completedAttempts.length >= t.maxAttempts) {
        availabilityStatus = 'COMPLETED';
      } else if (t.availableUntil && t.availableUntil < now) {
        availabilityStatus = 'EXPIRED';
      } else if (t.scheduledAt && t.scheduledAt > now) {
        availabilityStatus = 'UPCOMING';
      }

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
        categoryName: t.testSeries.category.name,
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

  async getPublishedTestSeries(profileId: string | null) {
    if (!profileId) {
      throw new ForbiddenException('An active student profile is required');
    }
    if (!this.prisma.testSeries?.findMany) {
      return [];
    }

    const publishedTests = await this.getPublishedAssessmentTests(profileId);
    const testsBySeries = new Map<string, typeof publishedTests>();
    publishedTests.forEach((test) => {
      if (!testsBySeries.has(test.seriesId)) {
        testsBySeries.set(test.seriesId, []);
      }
      testsBySeries.get(test.seriesId)!.push(test);
    });

    const seriesList = await this.prisma.testSeries.findMany({
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
        ? { id: series.course.id, title: series.course.title, code: series.course.code }
        : null,
      tests: testsBySeries.get(series.id) || [],
    }));
  }
}
