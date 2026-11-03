import { ConflictException, Injectable } from '@nestjs/common';
import type { JWTPayload } from 'jose';
import {
  MembershipVerificationMethod,
  MembershipVerificationStatus,
  type Prisma,
  StudentCategory,
  StudentPaymentStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const profileSelect = {
  id: true,
  email: true,
  isActive: true,
  userRoles: { select: { role: { select: { name: true } } } },
  institutionMembership: {
    select: {
      id: true,
      studentCategory: true,
      paymentStatus: true,
      paidAccessUntil: true,
      trustedRecordId: true,
    },
  },
} as const;

type ResolvedProfile = Prisma.UserProfileGetPayload<{
  select: typeof profileSelect;
}> | null;

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
    const email = this.email(payload.email);

    // Most authenticated requests only need an existing, unchanged profile.
    // Keep that hot path outside an interactive transaction so parallel page
    // requests do not compete for transaction slots in a small database pool.
    const existing = await this.prisma.userProfile.findUnique({
      where: { authUserId },
      select: profileSelect,
    });
    if (existing) {
      if (email && existing.email && existing.email !== email)
        throw new ConflictException(
          'Login email does not match the linked profile',
        );
      if (!email) return existing;

      const isStudent = existing.userRoles.some(
        ({ role }) => role.name === 'STUDENT',
      );
      if (!isStudent && existing.email) return existing;

      if (isStudent && existing.email) {
        const roster = await this.prisma.trustedInstitutionStudent.findUnique({
          where: { email },
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
              membership.trustedRecordId !== roster.id)) ||
          (!internal &&
            membership.studentCategory === StudentCategory.INTERNAL);
        const rosterNeedsLink = internal && !roster.authUserId;
        if (!accessChanged && !rosterNeedsLink) return existing;
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        let profile = await tx.userProfile.findUnique({
          where: { authUserId },
          select: profileSelect,
        });
        if (!profile && !email) return null;
        if (!profile) {
          const loginEmail = email!;
          const role = await tx.role.findUnique({
            where: { name: 'STUDENT' },
            select: { id: true },
          });
          if (!role)
            throw new ConflictException('STUDENT role is not configured');
          const roster = await tx.trustedInstitutionStudent.findUnique({
            where: { email: loginEmail },
            select: {
              id: true,
              studentId: true,
              fullName: true,
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
          const created = await tx.userProfile.create({
            data: {
              authUserId,
              email: loginEmail,
              displayName:
                internal && roster?.fullName
                  ? roster.fullName
                  : this.displayName(payload, loginEmail),
              userRoles: { create: { roleId: role.id } },
              institutionMembership: {
                create: {
                  studentId: internal ? roster!.studentId : `EXT-${authUserId}`,
                  status: MembershipVerificationStatus.VERIFIED,
                  method: internal
                    ? MembershipVerificationMethod.TRUSTED_ROSTER
                    : null,
                  trustedRecordId: internal ? roster!.id : null,
                  verifiedAt: new Date(),
                  studentCategory: internal
                    ? StudentCategory.INTERNAL
                    : StudentCategory.EXTERNAL,
                  paymentStatus: internal
                    ? StudentPaymentStatus.NOT_REQUIRED
                    : StudentPaymentStatus.PENDING,
                },
              },
            },
            select: profileSelect,
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
        if (email && !profile.email)
          profile = await tx.userProfile.update({
            where: { id: profile.id },
            data: { email },
            select: profileSelect,
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
              studentId: internal ? roster!.studentId : `EXT-${authUserId}`,
              status: MembershipVerificationStatus.VERIFIED,
              method: internal
                ? MembershipVerificationMethod.TRUSTED_ROSTER
                : null,
              trustedRecordId: internal ? roster!.id : null,
              verifiedAt: new Date(),
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
            select: profileSelect,
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
          (internal && membership.trustedRecordId !== roster!.id)
        ) {
          const updated = await tx.institutionMembership.update({
            where: { id: membership.id },
            data: internal
              ? {
                  studentCategory: StudentCategory.INTERNAL,
                  paymentStatus: StudentPaymentStatus.NOT_REQUIRED,
                  paidAccessUntil: null,
                  trustedRecordId: roster!.id,
                  method: MembershipVerificationMethod.TRUSTED_ROSTER,
                }
              : {
                  studentCategory: StudentCategory.EXTERNAL,
                  paymentStatus: StudentPaymentStatus.PENDING,
                  paidAccessUntil: null,
                  trustedRecordId: null,
                  method: null,
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
            select: profileSelect,
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

  private email(value: unknown) {
    if (typeof value !== 'string') return null;
    const email = value.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320
      ? email
      : null;
  }
  private displayName(payload: JWTPayload, email: string) {
    const metadata = payload.user_metadata;
    if (metadata && typeof metadata === 'object') {
      const record = metadata as Record<string, unknown>;
      const name =
        typeof record.full_name === 'string'
          ? record.full_name
          : typeof record.name === 'string'
            ? record.name
            : '';
      if (name.trim()) return name.trim().slice(0, 150);
    }
    return email.split('@')[0].slice(0, 150);
  }
}
