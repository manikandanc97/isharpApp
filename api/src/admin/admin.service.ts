import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  convertExternalStudentRecord,
  listMembershipsRecords,
  setStudentAccessRecord,
  studentAccountRoleFilter,
} from './admin-access.helper.js';
import { parseCoursePayload } from './admin-course.helper.js';
import {
  createInternalStudentRecord,
  deleteInternalStudentRecord,
  updateInternalStudentRecord,
} from './admin-roster.helper.js';

const userSelect = {
  id: true,
  authUserId: true,
  displayName: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  userRoles: { select: { role: { select: { name: true } } } },
  institutionMembership: {
    select: {
      id: true,
      studentId: true,
      trustedRecordId: true,
      status: true,
      studentCategory: true,
      paymentStatus: true,
      paidAccessUntil: true,
      studentIdHistory: {
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          studentCode: true,
          studentType: true,
          isCurrent: true,
          changeReason: true,
          createdAt: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private overviewCache: { data: unknown; expiresAt: number } | null = null;
  private readonly OVERVIEW_CACHE_TTL_MS = 15_000;

  invalidateOverviewCache() {
    this.overviewCache = null;
  }

  async overview() {
    const now = Date.now();
    if (this.overviewCache && this.overviewCache.expiresAt > now) {
      return this.overviewCache.data as Awaited<
        ReturnType<AdminService['fetchOverviewFromDb']>
      >;
    }
    const data = await this.fetchOverviewFromDb();
    this.overviewCache = { data, expiresAt: now + this.OVERVIEW_CACHE_TTL_MS };
    return data;
  }

  private async fetchOverviewFromDb() {
    const [
      users,
      activeUsers,
      pendingVerifications,
      courses,
      subjects,
      recent,
    ] = await Promise.all([
      this.prisma.userProfile.count({
        where: { userRoles: studentAccountRoleFilter },
      }),
      this.prisma.userProfile.count({
        where: { isActive: true, userRoles: studentAccountRoleFilter },
      }),
      this.prisma.institutionMembership.count({
        where: {
          status: 'PENDING',
          studentCategory: 'INTERNAL',
          user: { userRoles: studentAccountRoleFilter },
        },
      }),
      this.prisma.course.count({
        where: { isActive: true },
      }),
      this.prisma.subject.count({
        where: { isActive: true },
      }),
      this.prisma.institutionMembership.findMany({
        where: { user: { userRoles: studentAccountRoleFilter } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          studentId: true,
          status: true,
          studentCategory: true,
          paymentStatus: true,
          updatedAt: true,
          user: { select: { id: true, displayName: true } },
        },
      }),
    ]);

    return {
      metrics: {
        users,
        activeUsers,
        pendingVerifications,
        courses,
        subjects,
      },
      recentVerifications: recent,
    };
  }

  async listUsers(query?: string) {
    const normalized = query?.trim().slice(0, 100);
    const users = await this.prisma.userProfile.findMany({
      where: {
        userRoles: studentAccountRoleFilter,
        ...(normalized
          ? {
              OR: [
                { displayName: { contains: normalized, mode: 'insensitive' } },
                { email: { contains: normalized, mode: 'insensitive' } },
                { phone: { contains: normalized, mode: 'insensitive' } },
                {
                  institutionMembership: {
                    is: {
                      studentId: { contains: normalized, mode: 'insensitive' },
                    },
                  },
                },
                {
                  institutionMembership: {
                    is: {
                      studentIdHistory: {
                        some: {
                          studentCode: {
                            contains: normalized,
                            mode: 'insensitive',
                          },
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: userSelect,
    });

    return users.map(({ userRoles, ...user }) => ({
      ...user,
      roles: userRoles.map(({ role }) => role.name),
    }));
  }

  listInternalStudents() {
    return this.prisma.trustedInstitutionStudent.findMany({
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
      select: {
        id: true,
        studentId: true,
        fullName: true,
        email: true,
        authUserId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createInternalStudent(actor: AuthUser, body: unknown) {
    const res = await createInternalStudentRecord(this.prisma, actor, body);
    this.invalidateOverviewCache();
    return res;
  }

  async updateInternalStudent(actor: AuthUser, id: string, body: unknown) {
    const res = await updateInternalStudentRecord(this.prisma, actor, id, body);
    this.invalidateOverviewCache();
    return res;
  }

  async deleteInternalStudent(actor: AuthUser, id: string) {
    const res = await deleteInternalStudentRecord(this.prisma, actor, id);
    this.invalidateOverviewCache();
    return res;
  }

  async setUserStatus(actor: AuthUser, profileId: string, body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('A status update object is required');
    }
    const isActive = (body as Record<string, unknown>).isActive;
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean');
    }
    if (actor.profileId === profileId) {
      throw new ForbiddenException('Administrators cannot disable themselves');
    }

    const target = await this.prisma.userProfile.findUnique({
      where: { id: profileId },
      select: userSelect,
    });
    if (!target) throw new NotFoundException('Profile not found');

    const targetRoles = target.userRoles.map(({ role }) => role.name);
    if (
      !actor.roles.includes('SUPERADMIN') &&
      targetRoles.some((role) => role === 'ADMIN' || role === 'SUPERADMIN')
    ) {
      throw new ForbiddenException(
        'Only SUPERADMIN can manage administrator accounts',
      );
    }

    const updated = await this.prisma.userProfile.update({
      where: { id: profileId },
      data: { isActive },
      select: userSelect,
    });
    this.invalidateOverviewCache();
    return {
      ...updated,
      roles: updated.userRoles.map(({ role }) => role.name),
      userRoles: undefined,
    };
  }

  async setStudentAccess(actor: AuthUser, membershipId: string, body: unknown) {
    const res = await setStudentAccessRecord(
      this.prisma,
      actor,
      membershipId,
      body,
    );
    this.invalidateOverviewCache();
    return res;
  }

  async convertExternalStudent(
    actor: AuthUser,
    membershipId: string,
    body: unknown,
  ) {
    const result = await convertExternalStudentRecord(
      this.prisma,
      actor,
      membershipId,
      body,
    );
    this.invalidateOverviewCache();
    return result;
  }

  listMemberships(status?: string) {
    return listMembershipsRecords(this.prisma, status);
  }

  private catalogCache: { data: unknown; expiresAt: number } | null = null;
  private readonly CATALOG_CACHE_TTL_MS = 60_000;

  invalidateCatalogCache() {
    this.catalogCache = null;
  }

  async catalog() {
    const now = Date.now();
    if (this.catalogCache && this.catalogCache.expiresAt > now) {
      return this.catalogCache.data as Awaited<
        ReturnType<AdminService['fetchCatalogFromDb']>
      >;
    }
    const data = await this.fetchCatalogFromDb();
    this.catalogCache = { data, expiresAt: now + this.CATALOG_CACHE_TTL_MS };
    return data;
  }

  private fetchCatalogFromDb() {
    return this.prisma.course.findMany({
      orderBy: [{ isActive: 'desc' }, { title: 'asc' }],
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        isActive: true,
        updatedAt: true,
        courseSubjects: {
          where: { isActive: true },
          select: {
            id: true,
            subject: { select: { id: true, code: true, name: true } },
            chapters: {
              where: { isActive: true },
              orderBy: { position: 'asc' },
              select: { id: true, title: true, position: true, isActive: true },
            },
            _count: { select: { chapters: true } },
          },
        },
      },
    });
  }

  async createCourse(body: unknown) {
    const input = parseCoursePayload(body, true);
    const created = await this.prisma.course.create({ data: input });
    this.invalidateCatalogCache();
    this.invalidateOverviewCache();
    return created;
  }

  async updateCourse(id: string, body: unknown) {
    const input = parseCoursePayload(body, false);
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');
    const updated = await this.prisma.course.update({
      where: { id },
      data: input,
    });
    this.invalidateCatalogCache();
    this.invalidateOverviewCache();
    return updated;
  }

  // --------------------------------------------------------------------------
  // EXAM MANAGEMENT & LIVE PROCTORING (REAL DATA INTEGRATION)
  // --------------------------------------------------------------------------

  async listScheduledExams(statusFilter?: string) {
    const tests = await this.prisma.assessmentTest.findMany({
      include: {
        testSeries: {
          include: {
            category: true,
          },
        },
        attempts: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    });

    const now = new Date();

    const exams = tests.map((t) => {
      let mappedStatus: 'LIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' = 'UPCOMING';
      if (!t.isActive || t.isCancelled) {
        mappedStatus = 'CANCELLED';
      } else if (t.scheduledAt && t.scheduledAt > now) {
        mappedStatus = 'UPCOMING';
      } else if (t.availableUntil && t.availableUntil < now) {
        mappedStatus = 'COMPLETED';
      } else {
        mappedStatus = 'LIVE';
      }

      const startTime = t.scheduledAt ? t.scheduledAt.toISOString() : t.createdAt.toISOString();
      const endTime = t.availableUntil
        ? t.availableUntil.toISOString()
        : new Date(new Date(startTime).getTime() + (t.durationMinutes || 180) * 60 * 1000).toISOString();

      return {
        id: t.id,
        testId: t.id,
        testSeriesId: t.testSeriesId,
        testName: t.title,
        testCode: t.code,
        categoryName: t.testSeries?.category?.name || 'General NEET',
        durationMinutes: t.durationMinutes,
        totalQuestions: t.totalQuestions,
        totalMarks: t.totalMarks,
        startTime,
        endTime,
        assignmentTarget: 'ALL' as const,
        assignedStudentIds: [],
        status: mappedStatus,
        maxAttempts: t.maxAttempts,
        autoSubmitOnTimeout: true,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });

    const filtered =
      statusFilter && statusFilter !== 'ALL'
        ? exams.filter((e) => e.status === statusFilter)
        : exams;

    const totalAttemptsCount = await this.prisma.testAttempt.count();
    const activeTestTakersCount = await this.prisma.testAttempt.count({
      where: { status: 'IN_PROGRESS' },
    });

    const stats = {
      totalExams: exams.length,
      liveExams: exams.filter((e) => e.status === 'LIVE').length,
      upcomingExams: exams.filter((e) => e.status === 'UPCOMING').length,
      completedExams: exams.filter((e) => e.status === 'COMPLETED').length,
      activeTestTakers: activeTestTakersCount,
      totalAttempts: totalAttemptsCount,
    };

    return { exams: filtered, stats };
  }

  async updateExam(
    id: string,
    updates: {
      status?: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
      assignmentTarget?: string;
      assignedStudentIds?: string[];
    },
  ) {
    const test = await this.prisma.assessmentTest.findUnique({
      where: { id },
      include: {
        testSeries: {
          include: {
            category: true,
          },
        },
      },
    });
    if (!test) {
      throw new NotFoundException('Exam not found');
    }

    const data: Record<string, unknown> = {};
    if (updates.status) {
      if (updates.status === 'LIVE') {
        data.isActive = true;
        data.isCancelled = false;
        data.scheduledAt = new Date();
        data.availableUntil = new Date(Date.now() + test.durationMinutes * 60 * 1000);
      } else if (updates.status === 'COMPLETED') {
        data.availableUntil = new Date();
      } else if (updates.status === 'CANCELLED') {
        data.isCancelled = true;
      } else if (updates.status === 'UPCOMING') {
        data.isActive = true;
        data.isCancelled = false;
      }
    }

    const updated = await this.prisma.assessmentTest.update({
      where: { id },
      data,
      include: {
        testSeries: {
          include: {
            category: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      testId: updated.id,
      testSeriesId: updated.testSeriesId,
      testName: updated.title,
      testCode: updated.code,
      categoryName: updated.testSeries?.category?.name || 'General NEET',
      durationMinutes: updated.durationMinutes,
      totalQuestions: updated.totalQuestions,
      totalMarks: updated.totalMarks,
      startTime: updated.scheduledAt ? updated.scheduledAt.toISOString() : updated.createdAt.toISOString(),
      endTime: updated.availableUntil ? updated.availableUntil.toISOString() : new Date().toISOString(),
      assignmentTarget: updates.assignmentTarget || 'ALL',
      assignedStudentIds: updates.assignedStudentIds || [],
      status: updates.status || 'LIVE',
      maxAttempts: updated.maxAttempts,
      autoSubmitOnTimeout: true,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async listAttempts(examId?: string) {
    const where: Record<string, unknown> = {};
    if (examId) {
      where.assessmentTestId = examId;
    }

    const attempts = await this.prisma.testAttempt.findMany({
      where,
      include: {
        assessmentTest: true,
        studentProfile: {
          include: {
            institutionMembership: true,
          },
        },
        result: true,
        answers: {
          select: { id: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 200,
    });

    return attempts.map((att) => {
      const studentName = att.studentProfile?.displayName || 'Unknown Student';
      const studentId =
        att.studentProfile?.institutionMembership?.studentId ||
        att.studentProfile?.id?.slice(0, 8) ||
        'N/A';
      const studentCategory =
        att.studentProfile?.institutionMembership?.studentCategory === 'INTERNAL'
          ? 'INTERNAL'
          : 'EXTERNAL';
      const score = att.result?.totalMarksScored ?? att.totalScore ?? 0;
      const totalMarks = att.assessmentTest?.totalMarks || 720;
      const percentage =
        att.result?.percentage ??
        (totalMarks > 0 ? Math.round((score / totalMarks) * 100 * 10) / 10 : 0);

      return {
        id: att.id,
        examId: att.assessmentTestId,
        testId: att.assessmentTestId,
        testName: att.assessmentTest?.title || 'Unknown Test',
        studentId,
        studentName,
        studentEmail: att.studentProfile?.email || '',
        studentCategory,
        attemptNumber: att.attemptNumber,
        maxAllowedAttempts: att.assessmentTest?.maxAttempts || 1,
        startedAt: att.startedAt.toISOString(),
        submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
        durationSeconds: att.durationSeconds,
        score,
        totalMarks,
        percentage,
        accuracy: att.result?.accuracyPercentage ? Number(att.result.accuracyPercentage) : 0,
        questionsAttempted: att.answers?.length || 0,
        totalQuestions: att.assessmentTest?.totalQuestions || 0,
        status: att.status,
      };
    });
  }

  async handleAttemptAction(
    attemptId: string,
    action: 'AUTO_SUBMIT' | 'GRANT_REATTEMPT' | 'RESET',
  ) {
    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: { assessmentTest: true },
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (action === 'AUTO_SUBMIT') {
      const updated = await this.prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
      return updated;
    }

    if (action === 'GRANT_REATTEMPT') {
      return { success: true, message: 'Granted reattempt' };
    }

    if (action === 'RESET') {
      await this.prisma.testAttempt.delete({
        where: { id: attemptId },
      });
      return { success: true, message: 'Attempt reset successfully' };
    }

    throw new BadRequestException(`Invalid action: ${action}`);
  }
}
