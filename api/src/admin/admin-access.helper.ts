import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export const studentAccountRoleFilter = {
  some: { role: { name: 'STUDENT' } },
  none: { role: { name: { in: ['ADMIN', 'SUPERADMIN'] } } },
} satisfies Prisma.UserRoleListRelationFilter;

export async function setStudentAccessRecord(
  prisma: PrismaService,
  actor: AuthUser,
  membershipId: string,
  body: unknown,
) {
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
  return prisma.$transaction(async (tx) => {
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

export function listMembershipsRecords(
  prisma: PrismaService,
  status?: string,
) {
  const allowed = ['PENDING', 'VERIFIED', 'REJECTED', 'REVOKED'];
  if (status && status !== 'ALL' && !allowed.includes(status)) {
    throw new BadRequestException('Unknown verification status');
  }
  return prisma.institutionMembership.findMany({
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

