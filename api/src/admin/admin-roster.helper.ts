import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import {
  generateStudentCode,
  setStudentIdAuditContext,
} from '../student-identity/student-id.helper.js';

export async function createInternalStudentRecord(
  prisma: PrismaService,
  actor: AuthUser,
  body: unknown,
) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new BadRequestException('Student name and email are required');
  const input = body as Record<string, unknown>;
  const fullName =
    typeof input.fullName === 'string' ? input.fullName.trim() : '';
  const email =
    typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (fullName.length < 2 || fullName.length > 150)
    throw new BadRequestException('fullName must contain 2 to 150 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320)
    throw new BadRequestException('A valid email is required');
  try {
    return await prisma.$transaction(async (tx) => {
      const student = await tx.trustedInstitutionStudent.create({
        data: { fullName, email, isActive: true },
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

      const profile = await tx.userProfile.findUnique({
        where: { email },
        select: {
          authUserId: true,
          userRoles: { select: { role: { select: { name: true } } } },
          institutionMembership: {
            select: {
              id: true,
              studentCategory: true,
              paymentStatus: true,
              paidAccessUntil: true,
            },
          },
        },
      });
      const isStudent = profile?.userRoles.some(
        ({ role }) => role.name === 'STUDENT',
      );
      if (!profile || !isStudent || !profile.institutionMembership)
        return student;

      const membership = profile.institutionMembership;
      await setStudentIdAuditContext(
        tx,
        actor.profileId,
        'ADMIN_INTERNAL_ROSTER_ADDED',
      );
      const updated = await tx.institutionMembership.update({
        where: { id: membership.id },
        data: {
          studentId: student.studentId,
          status: 'VERIFIED',
          studentCategory: 'INTERNAL',
          paymentStatus: 'NOT_REQUIRED',
          paidAccessUntil: null,
          trustedRecordId: student.id,
          method: 'TRUSTED_ROSTER',
          verifiedAt: new Date(),
          verifiedById: actor.profileId,
        },
      });
      if (profile.authUserId)
        await tx.trustedInstitutionStudent.update({
          where: { id: student.id },
          data: { authUserId: profile.authUserId },
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
          reason: 'ADMIN_INTERNAL_ROSTER_ADDED',
        },
      });

      return { ...student, authUserId: profile.authUserId };
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

export async function updateInternalStudentRecord(
  prisma: PrismaService,
  actor: AuthUser,
  id: string,
  body: unknown,
) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new BadRequestException('A student update object is required');
  const input = body as Record<string, unknown>;
  const allowed = new Set(['fullName', 'email', 'isActive']);
  if (
    !Object.keys(input).length ||
    Object.keys(input).some((key) => !allowed.has(key))
  )
    throw new BadRequestException(
      'Only fullName, email and isActive can be updated',
    );

  const data: {
    fullName?: string;
    email?: string;
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
  if ('isActive' in input) {
    if (typeof input.isActive !== 'boolean')
      throw new BadRequestException('isActive must be a boolean');
    data.isActive = input.isActive;
  }

  try {
    return await prisma.$transaction(async (tx) => {
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

      if (current.membership && data.isActive === false) {
        const membership = current.membership;
        const studentId = await generateStudentCode(tx, 'EXTERNAL');
        await setStudentIdAuditContext(
          tx,
          actor.profileId,
          'ADMIN_INTERNAL_ROSTER_DEACTIVATED',
        );
        const updatedMembership = await tx.institutionMembership.update({
          where: { id: membership.id },
          data: {
            studentId,
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

export async function deleteInternalStudentRecord(
  prisma: PrismaService,
  actor: AuthUser,
  id: string,
) {
  return prisma.$transaction(async (tx) => {
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
      const studentId = await generateStudentCode(tx, 'EXTERNAL');
      await setStudentIdAuditContext(
        tx,
        actor.profileId,
        'ADMIN_INTERNAL_ROSTER_RECORD_DELETED',
      );
      const updated = await tx.institutionMembership.update({
        where: { id: membership.id },
        data: {
          studentId,
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
