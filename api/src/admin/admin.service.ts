import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { AuthUser } from '../auth/auth-user.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const userSelect = {
  id: true,
  displayName: true,
  email: true,
  isActive: true,
  createdAt: true,
  userRoles: { select: { role: { select: { name: true } } } },
  institutionMembership: {
    select: {
      id: true,
      studentId: true,
      status: true,
      studentCategory: true,
      paymentStatus: true,
      paidAccessUntil: true,
    },
  },
} as const;

// Student-facing admin views must never include privileged accounts, even if a
// privileged profile was accidentally assigned the STUDENT role as well.
const studentAccountRoleFilter = {
  some: { role: { name: 'STUDENT' } },
  none: { role: { name: { in: ['ADMIN', 'SUPERADMIN'] } } },
} satisfies Prisma.UserRoleListRelationFilter;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    // Bound database concurrency here because the dashboard already loads its
    // four resources in parallel. These small reads are faster and more stable
    // in sequence than competing for every slot in the shared session pool.
    const users = await this.prisma.userProfile.count({
      where: { userRoles: studentAccountRoleFilter },
    });
    const activeUsers = await this.prisma.userProfile.count({
      where: { isActive: true, userRoles: studentAccountRoleFilter },
    });
    const pendingVerifications = await this.prisma.institutionMembership.count({
      where: {
        status: 'PENDING',
        user: { userRoles: studentAccountRoleFilter },
      },
    });
    const courses = await this.prisma.course.count({
      where: { isActive: true },
    });
    const subjects = await this.prisma.subject.count({
      where: { isActive: true },
    });
    const recent = await this.prisma.institutionMembership.findMany({
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
    });

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

  async createInternalStudent(body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new BadRequestException('Student name and email are required');
    const input = body as Record<string, unknown>;
    const fullName =
      typeof input.fullName === 'string' ? input.fullName.trim() : '';
    const email =
      typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    if (fullName.length < 2 || fullName.length > 150)
      throw new BadRequestException(
        'fullName must contain 2 to 150 characters',
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320)
      throw new BadRequestException('A valid email is required');
    const studentIdInput =
      typeof input.studentId === 'string'
        ? input.studentId.trim().toUpperCase()
        : '';
    const studentId =
      studentIdInput ||
      `INT-${createHash('sha256').update(email).digest('hex').slice(0, 16).toUpperCase()}`;
    try {
      return await this.prisma.trustedInstitutionStudent.create({
        data: { fullName, email, studentId, isActive: true },
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
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      )
        throw new BadRequestException(
          'Email or student ID already exists in the internal roster',
        );
      throw error;
    }
  }

  async updateInternalStudent(actor: AuthUser, id: string, body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new BadRequestException('A student update object is required');
    const input = body as Record<string, unknown>;
    const allowed = new Set(['fullName', 'email', 'studentId', 'isActive']);
    if (
      !Object.keys(input).length ||
      Object.keys(input).some((key) => !allowed.has(key))
    )
      throw new BadRequestException(
        'Only fullName, email, studentId and isActive can be updated',
      );

    const data: {
      fullName?: string;
      email?: string;
      studentId?: string;
      isActive?: boolean;
    } = {};
    if ('fullName' in input) {
      if (typeof input.fullName !== 'string')
        throw new BadRequestException('fullName must be text');
      const fullName = input.fullName.trim();
      if (fullName.length < 2 || fullName.length > 150)
        throw new BadRequestException(
          'fullName must contain 2 to 150 characters',
        );
      data.fullName = fullName;
    }
    if ('email' in input) {
      if (typeof input.email !== 'string')
        throw new BadRequestException('email must be text');
      const email = input.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320)
        throw new BadRequestException('A valid email is required');
      data.email = email;
    }
    if ('studentId' in input) {
      if (typeof input.studentId !== 'string')
        throw new BadRequestException('studentId must be text');
      const studentId = input.studentId.trim().toUpperCase();
      if (!studentId || studentId.length > 64)
        throw new BadRequestException(
          'studentId must contain 1 to 64 characters',
        );
      data.studentId = studentId;
    }
    if ('isActive' in input) {
      if (typeof input.isActive !== 'boolean')
        throw new BadRequestException('isActive must be a boolean');
      data.isActive = input.isActive;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.trustedInstitutionStudent.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            authUserId: true,
            membership: {
              select: {
                id: true,
                studentCategory: true,
                paymentStatus: true,
                paidAccessUntil: true,
              },
            },
          },
        });
        if (!current) throw new NotFoundException('Internal student not found');
        if (current.authUserId && data.email && data.email !== current.email)
          throw new BadRequestException(
            'A matched login email cannot be changed. Delete the roster entry and add the correct email instead',
          );

        if (current.membership && data.studentId)
          await tx.institutionMembership.update({
            where: { id: current.membership.id },
            data: { studentId: data.studentId },
          });

        if (current.membership && data.isActive === false) {
          const membership = current.membership;
          const updatedMembership = await tx.institutionMembership.update({
            where: { id: membership.id },
            data: {
              studentCategory: 'EXTERNAL',
              paymentStatus: 'PENDING',
              paidAccessUntil: null,
              trustedRecordId: null,
              method: null,
            },
          });
          await tx.studentAccessAudit.create({
            data: {
              membershipId: membership.id,
              actorUserId: actor.profileId,
              previousCategory: membership.studentCategory,
              newCategory: updatedMembership.studentCategory,
              previousPaymentStatus: membership.paymentStatus,
              newPaymentStatus: updatedMembership.paymentStatus,
              previousAccessUntil: membership.paidAccessUntil,
              newAccessUntil: updatedMembership.paidAccessUntil,
              reason: 'ADMIN_INTERNAL_ROSTER_DEACTIVATED',
            },
          });
        }

        return tx.trustedInstitutionStudent.update({
          where: { id },
          data,
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
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      )
        throw new NotFoundException('Internal student not found');
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      )
        throw new BadRequestException(
          'Email or student ID already exists in the internal roster',
        );
      throw error;
    }
  }

  async deleteInternalStudent(actor: AuthUser, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.trustedInstitutionStudent.findUnique({
        where: { id },
        select: {
          id: true,
          membership: {
            select: {
              id: true,
              studentCategory: true,
              paymentStatus: true,
              paidAccessUntil: true,
            },
          },
        },
      });
      if (!current) throw new NotFoundException('Internal student not found');
      if (current.membership) {
        const membership = current.membership;
        const updated = await tx.institutionMembership.update({
          where: { id: membership.id },
          data: {
            studentCategory: 'EXTERNAL',
            paymentStatus: 'PENDING',
            paidAccessUntil: null,
            trustedRecordId: null,
            method: null,
          },
        });
        await tx.studentAccessAudit.create({
          data: {
            membershipId: membership.id,
            actorUserId: actor.profileId,
            previousCategory: membership.studentCategory,
            newCategory: updated.studentCategory,
            previousPaymentStatus: membership.paymentStatus,
            newPaymentStatus: updated.paymentStatus,
            previousAccessUntil: membership.paidAccessUntil,
            newAccessUntil: updated.paidAccessUntil,
            reason: 'ADMIN_INTERNAL_ROSTER_RECORD_DELETED',
          },
        });
      }
      await tx.trustedInstitutionStudent.delete({ where: { id } });
      return { id, deleted: true };
    });
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
    return {
      ...updated,
      roles: updated.userRoles.map(({ role }) => role.name),
      userRoles: undefined,
    };
  }

  async setStudentAccess(actor: AuthUser, membershipId: string, body: unknown) {
    if (!actor.profileId)
      throw new ForbiddenException('Administrator profile is required');
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new BadRequestException('An access update object is required');
    const input = body as Record<string, unknown>;
    const category = input.studentCategory;
    if (category !== 'INTERNAL' && category !== 'EXTERNAL')
      throw new BadRequestException(
        'studentCategory must be INTERNAL or EXTERNAL',
      );
    let paymentStatus = input.paymentStatus;
    if (category === 'INTERNAL') paymentStatus = 'NOT_REQUIRED';
    if (
      !['NOT_REQUIRED', 'PENDING', 'PAID', 'EXPIRED', 'CANCELLED'].includes(
        String(paymentStatus),
      )
    )
      throw new BadRequestException('Invalid paymentStatus');
    if (category === 'EXTERNAL' && paymentStatus === 'NOT_REQUIRED')
      throw new BadRequestException(
        'External students require a paid-access status',
      );
    if (
      typeof input.reason !== 'string' ||
      input.reason.trim().length < 3 ||
      input.reason.trim().length > 500
    )
      throw new BadRequestException('reason must contain 3 to 500 characters');
    const reason = input.reason.trim();
    let paidAccessUntil: Date | null = null;
    if (
      category === 'EXTERNAL' &&
      typeof input.paidAccessUntil === 'string' &&
      input.paidAccessUntil.trim()
    ) {
      paidAccessUntil = new Date(input.paidAccessUntil);
      if (Number.isNaN(paidAccessUntil.getTime()))
        throw new BadRequestException('paidAccessUntil must be a valid date');
    }
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.institutionMembership.findUnique({
        where: { id: membershipId },
        select: {
          id: true,
          userId: true,
          studentCategory: true,
          paymentStatus: true,
          paidAccessUntil: true,
          user: {
            select: {
              userRoles: { select: { role: { select: { name: true } } } },
            },
          },
        },
      });
      if (!current) throw new NotFoundException('Membership not found');
      if (current.userId === actor.profileId)
        throw new ForbiddenException(
          'Administrators cannot change their own student access',
        );
      const privileged = current.user.userRoles.some(
        ({ role }) => role.name === 'ADMIN' || role.name === 'SUPERADMIN',
      );
      if (privileged && !actor.roles.includes('SUPERADMIN'))
        throw new ForbiddenException(
          'Only SUPERADMIN can manage administrator access',
        );
      const updated = await tx.institutionMembership.update({
        where: { id: membershipId },
        data: {
          studentCategory: category,
          paymentStatus: paymentStatus as never,
          paidAccessUntil: category === 'INTERNAL' ? null : paidAccessUntil,
        },
        select: {
          id: true,
          studentId: true,
          status: true,
          studentCategory: true,
          paymentStatus: true,
          paidAccessUntil: true,
        },
      });
      await tx.studentAccessAudit.create({
        data: {
          membershipId,
          actorUserId: actor.profileId!,
          previousCategory: current.studentCategory,
          newCategory: category,
          previousPaymentStatus: current.paymentStatus,
          newPaymentStatus: paymentStatus as never,
          previousAccessUntil: current.paidAccessUntil,
          newAccessUntil: updated.paidAccessUntil,
          reason,
        },
      });
      return updated;
    });
  }

  async listMemberships(status?: string) {
    const allowed = ['PENDING', 'VERIFIED', 'REJECTED', 'REVOKED'];
    if (status && status !== 'ALL' && !allowed.includes(status)) {
      throw new BadRequestException('Unknown verification status');
    }
    return this.prisma.institutionMembership.findMany({
      where: {
        user: { userRoles: studentAccountRoleFilter },
        ...(status && status !== 'ALL' ? { status: status as never } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        studentId: true,
        status: true,
        method: true,
        studentCategory: true,
        paymentStatus: true,
        paidAccessUntil: true,
        verifiedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            isActive: true,
            userRoles: { select: { role: { select: { name: true } } } },
          },
        },
      },
    });
  }

  async catalog() {
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
    const input = this.parseCourse(body, true);
    return this.prisma.course.create({ data: input });
  }

  async updateCourse(id: string, body: unknown) {
    const input = this.parseCourse(body, false);
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Course not found');
    return this.prisma.course.update({ where: { id }, data: input });
  }

  private parseCourse(body: unknown, creating: boolean) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('A course object is required');
    }
    const input = body as Record<string, unknown>;
    const allowed = ['code', 'title', 'description', 'isActive'];
    if (Object.keys(input).some((key) => !allowed.includes(key))) {
      throw new BadRequestException('Unsupported course field');
    }
    const data: {
      code?: string;
      title?: string;
      description?: string | null;
      isActive?: boolean;
    } = {};
    if (creating || 'code' in input) {
      if (
        typeof input.code !== 'string' ||
        !/^[A-Za-z0-9_-]{2,50}$/.test(input.code.trim())
      ) {
        throw new BadRequestException(
          'code must contain 2 to 50 letters, numbers, _ or -',
        );
      }
      data.code = input.code.trim().toUpperCase();
    }
    if (creating || 'title' in input) {
      if (
        typeof input.title !== 'string' ||
        input.title.trim().length < 2 ||
        input.title.trim().length > 200
      ) {
        throw new BadRequestException('title must contain 2 to 200 characters');
      }
      data.title = input.title.trim();
    }
    if ('description' in input) {
      if (input.description !== null && typeof input.description !== 'string') {
        throw new BadRequestException('description must be text or null');
      }
      data.description =
        typeof input.description === 'string'
          ? input.description.trim().slice(0, 4000) || null
          : null;
    }
    if ('isActive' in input) {
      if (typeof input.isActive !== 'boolean') {
        throw new BadRequestException('isActive must be a boolean');
      }
      data.isActive = input.isActive;
    }
    if (!creating && Object.keys(data).length === 0) {
      throw new BadRequestException('At least one course field is required');
    }
    return data as {
      code: string;
      title: string;
      description?: string | null;
      isActive?: boolean;
    };
  }
}
