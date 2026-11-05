import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import {
  MembershipVerificationMethod,
  MembershipVerificationStatus,
  type Prisma,
  StudentCategory,
  StudentPaymentStatus,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  membershipSelect,
  parseManualDecision,
  parseStudentId,
  requireProfile,
  rethrowUniqueConflict,
  toMembershipResponse,
} from './institution-memberships.helper.js';

@Injectable()
export class InstitutionMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(actor: AuthUser, body: unknown) {
    const profileId = requireProfile(actor);
    const studentId = parseStudentId(body);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const ownMembership = await tx.institutionMembership.findUnique({
          where: { userId: profileId },
          select: membershipSelect,
        });
        if (ownMembership) {
          if (ownMembership.studentId !== studentId) {
            throw new ConflictException(
              'A membership submission already exists for this user',
            );
          }
          return toMembershipResponse(ownMembership);
        }

        const claimed = await tx.institutionMembership.findUnique({
          where: { studentId },
          select: { userId: true },
        });
        if (claimed) {
          throw new ConflictException('Student ID is already claimed');
        }

        const membership = await tx.institutionMembership.create({
          data: { userId: profileId, studentId },
          select: membershipSelect,
        });
        await tx.membershipVerificationAudit.create({
          data: {
            membershipId: membership.id,
            actorUserId: profileId,
            newStatus: MembershipVerificationStatus.PENDING,
            reason: 'STUDENT_ID_SUBMITTED',
          },
        });

        return this.matchTrustedRecord(tx, actor, membership);
      });
    } catch (error: unknown) {
      rethrowUniqueConflict(error);
      throw error;
    }
  }

  async getStatus(actor: AuthUser) {
    const userId = requireProfile(actor);
    const membership = await this.prisma.institutionMembership.findUnique({
      where: { userId },
      select: membershipSelect,
    });
    return membership
      ? toMembershipResponse(membership)
      : { membership: null, eligibleForFreeAccess: false };
  }

  async verifyAgainstTrustedSource(actor: AuthUser) {
    const userId = requireProfile(actor);
    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.institutionMembership.findUnique({
        where: { userId },
        select: membershipSelect,
      });
      if (!membership) {
        throw new NotFoundException('Membership submission not found');
      }
      if (membership.status === MembershipVerificationStatus.VERIFIED) {
        return toMembershipResponse(membership);
      }
      if (
        membership.status === MembershipVerificationStatus.REJECTED ||
        membership.status === MembershipVerificationStatus.REVOKED
      ) {
        throw new ConflictException(
          'This membership requires an authorized administrator review',
        );
      }
      return this.matchTrustedRecord(tx, actor, membership);
    });
  }

  async recordManualDecision(
    actor: AuthUser,
    membershipId: string,
    body: unknown,
  ) {
    const actorProfileId = requireProfile(actor);
    const { status, reason } = parseManualDecision(body);

    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.institutionMembership.findUnique({
        where: { id: membershipId },
        select: {
          ...membershipSelect,
          userId: true,
          user: {
            select: {
              userRoles: { select: { role: { select: { name: true } } } },
            },
          },
        },
      });
      if (!membership) throw new NotFoundException('Membership not found');
      if (membership.userId === actorProfileId) {
        throw new ForbiddenException(
          'Administrators cannot decide their own membership',
        );
      }

      const targetRoles = membership.user.userRoles.map(
        ({ role }) => role.name,
      );
      if (
        !actor.roles.includes('SUPERADMIN') &&
        targetRoles.some((role) => role === 'ADMIN' || role === 'SUPERADMIN')
      ) {
        throw new ForbiddenException(
          'Only SUPERADMIN can review administrator memberships',
        );
      }
      if (membership.status === status) {
        throw new ConflictException('Membership already has this status');
      }

      const verified = status === MembershipVerificationStatus.VERIFIED;
      const updated = await tx.institutionMembership.update({
        where: { id: membershipId },
        data: {
          status,
          method: MembershipVerificationMethod.MANUAL_ADMIN,
          verifiedAt: verified ? new Date() : null,
          verifiedById: verified ? actorProfileId : null,
        },
        select: membershipSelect,
      });
      await tx.membershipVerificationAudit.create({
        data: {
          membershipId,
          actorUserId: actorProfileId,
          previousStatus: membership.status,
          newStatus: status,
          method: MembershipVerificationMethod.MANUAL_ADMIN,
          reason,
        },
      });
      return toMembershipResponse(updated);
    });
  }

  private async matchTrustedRecord(
    tx: Prisma.TransactionClient,
    actor: AuthUser,
    membership: Prisma.InstitutionMembershipGetPayload<{
      select: typeof membershipSelect;
    }>,
  ) {
    const trustedRecord = await tx.trustedInstitutionStudent.findUnique({
      where: { studentId: membership.studentId },
      select: { id: true, authUserId: true, isActive: true },
    });
    const isExactMatch =
      trustedRecord?.isActive === true &&
      trustedRecord.authUserId !== null &&
      trustedRecord.authUserId === actor.authUserId;

    if (!isExactMatch) {
      await tx.membershipVerificationAudit.create({
        data: {
          membershipId: membership.id,
          actorUserId: actor.profileId,
          previousStatus: membership.status,
          newStatus: MembershipVerificationStatus.PENDING,
          reason: 'TRUSTED_ROSTER_IDENTITY_NOT_MATCHED',
        },
      });
      return toMembershipResponse(membership);
    }

    const updated = await tx.institutionMembership.update({
      where: { id: membership.id },
      data: {
        status: MembershipVerificationStatus.VERIFIED,
        method: MembershipVerificationMethod.TRUSTED_ROSTER,
        trustedRecordId: trustedRecord.id,
        verifiedAt: new Date(),
        verifiedById: null,
        studentCategory: StudentCategory.INTERNAL,
        paymentStatus: StudentPaymentStatus.NOT_REQUIRED,
        paidAccessUntil: null,
      },
      select: membershipSelect,
    });
    await tx.membershipVerificationAudit.create({
      data: {
        membershipId: membership.id,
        actorUserId: actor.profileId,
        previousStatus: membership.status,
        newStatus: MembershipVerificationStatus.VERIFIED,
        method: MembershipVerificationMethod.TRUSTED_ROSTER,
        reason: 'TRUSTED_ROSTER_EXACT_AUTH_IDENTITY_MATCH',
      },
    });
    return toMembershipResponse(updated);
  }
}
