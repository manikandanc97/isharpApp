import { ForbiddenException, Injectable } from '@nestjs/common';
import { MockTestStatus } from '../generated/prisma/client.js';
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
            status: MockTestStatus.PUBLISHED,
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
              status: MockTestStatus.PUBLISHED,
              OR: [{ availableUntil: null }, { availableUntil: { gte: now } }],
            },
          }),
        ]),
      ]);

    if (!profile?.institutionMembership) {
      throw new ForbiddenException('Student access record is required');
    }

    const [activeCourses, activeSubjects, activeChapters, activeQuestions, publishedMocks] =
      summary;

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
        publishedMocks,
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
      mockTests: mockTests.map(({ _count, ...test }) => ({
        ...test,
        scheduledAt: test.scheduledAt?.toISOString() ?? null,
        availableUntil: test.availableUntil?.toISOString() ?? null,
        questionCount: _count.questions,
      })),
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
}
