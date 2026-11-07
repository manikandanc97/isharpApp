import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
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
                {
                  institutionMembership: {
                    is: {
                      studentId: { contains: normalized, mode: 'insensitive' },
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
    const res = await setStudentAccessRecord(this.prisma, actor, membershipId, body);
    this.invalidateOverviewCache();
    return res;
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
      return this.catalogCache.data as Awaited<ReturnType<AdminService['fetchCatalogFromDb']>>;
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
              select: { id: true, title: true },
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
    const updated = await this.prisma.course.update({ where: { id }, data: input });
    this.invalidateCatalogCache();
    this.invalidateOverviewCache();
    return updated;
  }
}
