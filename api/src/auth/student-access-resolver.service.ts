import { ConflictException, Injectable } from '@nestjs/common';
import type { JWTPayload } from 'jose';
import {
  MembershipVerificationMethod,
  MembershipVerificationStatus,
  StudentCategory,
  StudentPaymentStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  generateStudentCode,
  setStudentIdAuditContext,
} from '../student-identity/student-id.helper.js';
import {
  cleanEmail,
  cleanPhone,
  extractDisplayName,
  studentProfileSelect,
  type ResolvedProfile,
} from './student-access-resolver.helper.js';

@Injectable()
export class StudentAccessResolver {
  private readonly inFlight = new Map<string, Promise<ResolvedProfile>>();

  constructor(private readonly prisma: PrismaService) {}

  resolve(authUserId: string, payload: JWTPayload): Promise<ResolvedProfile> {
    const pending = this.inFlight.get(authUserId);
    if (pending) return pending;

    const resolution = this.resolveOnce(authUserId, payload).finally(() => {
      if (this.inFlight.get(authUserId) === resolution)
        this.inFlight.delete(authUserId);
    });
    this.inFlight.set(authUserId, resolution);
    return resolution;
  }

  private async resolveOnce(
    authUserId: string,
    payload: JWTPayload,
  ): Promise<ResolvedProfile> {
    const email = cleanEmail(payload.email);
    const phone = cleanPhone(payload);

    // Most authenticated requests only need an existing, unchanged profile.
    // Keep that hot path outside an interactive transaction so parallel page
    // requests do not compete for transaction slots in a small database pool.
    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
      select: studentProfileSelect,
    });
    if (existing) {
      if (email && existing.email && existing.email !== email)
        throw new ConflictException(
          'Login email does not match the linked profile',
        );
      if (!email && (!phone || existing.phone === phone)) return existing;

      const isStudent = existing.userRoles.some(
        ({ role }) => role.name === 'STUDENT',
      );
      if (!isStudent && existing.email && (!phone || existing.phone === phone))
        return existing;

      if (isStudent && existing.email) {
        const roster = await this.prisma.trustedInstitutionStudent.findUnique({
          where: { email: email ?? existing.email },
          select: {
            id: true,
            studentId: true,
            authUserId: true,
            isActive: true,
          },
        });
        if (roster?.authUserId && roster.authUserId !== authUserId)
          throw new ConflictException(
            'Internal student email is already linked to another account',
          );
        const internal =
          roster?.isActive === true &&
          (!roster.authUserId || roster.authUserId === authUserId);
        const membership = existing.institutionMembership;
        const accessChanged =
          !membership ||
          (internal &&
            (membership.studentCategory !== StudentCategory.INTERNAL ||
              membership.trustedRecordId !== roster.id ||
              membership.studentId !== roster.studentId)) ||
          (!internal &&
            membership.studentCategory === StudentCategory.INTERNAL);
        const rosterNeedsLink = internal && !roster.authUserId;
        const contactNeedsUpdate = Boolean(phone && !existing.phone);
        if (!accessChanged && !rosterNeedsLink && !contactNeedsUpdate)
          return existing;
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        let profile = await tx.userProfile.findUnique({
          where: { authUserId },
          select: studentProfileSelect,
        });
        if (!profile && !email && !phone) return null;
        if (!profile) {
          const loginEmail = email;
          const loginIdentifier = loginEmail ?? phone!;
          const role = await tx.role.findUnique({
            where: { name: 'STUDENT' },
            select: { id: true },
          });
          if (!role)
            throw new ConflictException('STUDENT role is not configured');
          const roster = loginEmail
            ? await tx.trustedInstitutionStudent.findUnique({
                where: { email: loginEmail },
                select: {
                  id: true,
                  studentId: true,
                  fullName: true,
                  authUserId: true,
                  isActive: true,
                },
              })
            : null;
          const internal =
            roster?.isActive === true &&
            (!roster.authUserId || roster.authUserId === authUserId);
          if (roster?.authUserId && roster.authUserId !== authUserId)
            throw new ConflictException(
              'Internal student email is already linked to another account',
            );
          const created = await tx.userProfile.create({
            data: {
              authUserId,
              email: loginEmail,
              phone,
              displayName:
                internal && roster?.fullName
                  ? roster.fullName
                  : extractDisplayName(payload, loginIdentifier),
              userRoles: { create: { roleId: role.id } },
              institutionMembership: {
                create: {
                  ...(internal ? { studentId: roster!.studentId } : {}),
                  status: internal
                    ? MembershipVerificationStatus.VERIFIED
                    : MembershipVerificationStatus.PENDING,
                  method: internal
                    ? MembershipVerificationMethod.TRUSTED_ROSTER
                    : null,
                  trustedRecordId: internal ? roster!.id : null,
                  verifiedAt: internal ? new Date() : null,
                  studentCategory: internal
                    ? StudentCategory.INTERNAL
                    : StudentCategory.EXTERNAL,
                  paymentStatus: internal
                    ? StudentPaymentStatus.NOT_REQUIRED
                    : StudentPaymentStatus.PENDING,
                },
              },
            },
            select: studentProfileSelect,
          });
          if (internal && !roster!.authUserId)
            await tx.trustedInstitutionStudent.update({
              where: { id: roster!.id },
              data: { authUserId },
            });
          return created;
        }
        if (email && profile.email && profile.email !== email)
          throw new ConflictException(
            'Login email does not match the linked profile',
          );
        const profileUpdate = {
          ...(email && !profile.email ? { email } : {}),
          ...(phone && !profile.phone ? { phone } : {}),
        };
        if (Object.keys(profileUpdate).length)
          profile = await tx.userProfile.update({
            where: { id: profile.id },
            data: profileUpdate,
            select: studentProfileSelect,
          });
        const isStudent = profile.userRoles.some(
          ({ role }) => role.name === 'STUDENT',
        );
        if (!isStudent || !email) return profile;
        const roster = await tx.trustedInstitutionStudent.findUnique({
          where: { email },
          select: {
            id: true,
            studentId: true,
            authUserId: true,
            isActive: true,
          },
        });
        const internal =
          roster?.isActive === true &&
          (!roster.authUserId || roster.authUserId === authUserId);
        if (roster?.authUserId && roster.authUserId !== authUserId)
          throw new ConflictException(
            'Internal student email is already linked to another account',
          );
        if (internal && !roster!.authUserId)
          await tx.trustedInstitutionStudent.update({
            where: { id: roster!.id },
            data: { authUserId },
          });
        if (!profile.institutionMembership) {
          await tx.institutionMembership.create({
            data: {
              userId: profile.id,
              ...(internal ? { studentId: roster!.studentId } : {}),
              status: internal
                ? MembershipVerificationStatus.VERIFIED
                : MembershipVerificationStatus.PENDING,
              method: internal
                ? MembershipVerificationMethod.TRUSTED_ROSTER
                : null,
              trustedRecordId: internal ? roster!.id : null,
              verifiedAt: internal ? new Date() : null,
              studentCategory: internal
                ? StudentCategory.INTERNAL
                : StudentCategory.EXTERNAL,
              paymentStatus: internal
                ? StudentPaymentStatus.NOT_REQUIRED
                : StudentPaymentStatus.PENDING,
            },
          });
          return tx.userProfile.findUnique({
            where: { id: profile.id },
            select: studentProfileSelect,
          });
        }
        const membership = profile.institutionMembership;
        const mustPromote =
          internal && membership.studentCategory !== StudentCategory.INTERNAL;
        const mustDowngrade =
          !internal && membership.studentCategory === StudentCategory.INTERNAL;
        if (
          mustPromote ||
          mustDowngrade ||
          (internal &&
            (membership.trustedRecordId !== roster!.id ||
              membership.studentId !== roster!.studentId))
        ) {
          const nextStudentId = internal
            ? roster!.studentId
            : await generateStudentCode(tx, StudentCategory.EXTERNAL);
          await setStudentIdAuditContext(
            tx,
            null,
            internal
              ? 'AUTO_INTERNAL_EMAIL_ROSTER_MATCH'
              : 'AUTO_INTERNAL_ROSTER_MATCH_REMOVED',
          );
          const updated = await tx.institutionMembership.update({
            where: { id: membership.id },
            data: internal
              ? {
                  studentId: nextStudentId,
                  status: MembershipVerificationStatus.VERIFIED,
                  studentCategory: StudentCategory.INTERNAL,
                  paymentStatus: StudentPaymentStatus.NOT_REQUIRED,
                  paidAccessUntil: null,
                  trustedRecordId: roster!.id,
                  method: MembershipVerificationMethod.TRUSTED_ROSTER,
                  verifiedAt: new Date(),
                  verifiedById: null,
                }
              : {
                  studentId: nextStudentId,
                  status: MembershipVerificationStatus.PENDING,
                  studentCategory: StudentCategory.EXTERNAL,
                  paymentStatus: StudentPaymentStatus.PENDING,
                  paidAccessUntil: null,
                  trustedRecordId: null,
                  method: null,
                  verifiedAt: null,
                  verifiedById: null,
                },
          });
          await tx.studentAccessAudit.create({
            data: {
              membershipId: membership.id,
              actorUserId: null,
              previousCategory: membership.studentCategory,
              newCategory: updated.studentCategory,
              previousPaymentStatus: membership.paymentStatus,
              newPaymentStatus: updated.paymentStatus,
              previousAccessUntil: membership.paidAccessUntil,
              newAccessUntil: updated.paidAccessUntil,
              reason: internal
                ? 'AUTO_INTERNAL_EMAIL_ROSTER_MATCH'
                : 'AUTO_INTERNAL_ROSTER_MATCH_REMOVED',
            },
          });
          return tx.userProfile.findUnique({
            where: { id: profile.id },
            select: studentProfileSelect,
          });
        }
        return profile;
      },
      {
        maxWait: 10_000,
        timeout: 15_000,
      },
    );
  }
}
