import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipVerificationMethod,
  MembershipVerificationStatus,
  Prisma,
} from '../generated/prisma/client.js';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';

const membershipSelect = {
  id: true,
  studentId: true,
  status: true,
  method: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InstitutionMembershipSelect;

@Injectable()
export class InstitutionMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(actor: AuthUser, body: unknown) {
    const profileId = this.requireProfile(actor);
    const studentId = this.parseStudentId(body);

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
          return this.toResponse(ownMembership);
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
      this.rethrowUniqueConflict(error);
      throw error;
    }
  }

  async getStatus(actor: AuthUser) {
    const userId = this.requireProfile(actor);
    const membership = await this.prisma.institutionMembership.findUnique({
      where: { userId },
      select: membershipSelect,
    });
    return membership
      ? this.toResponse(membership)
      : { membership: null, eligibleForFreeAccess: false };
  }

  async verifyAgainstTrustedSource(actor: AuthUser) {
    const userId = this.requireProfile(actor);
    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.institutionMembership.findUnique({
        where: { userId },
        select: membershipSelect,
      });
      if (!membership) {
        throw new NotFoundException('Membership submission not found');
      }
      if (membership.status === MembershipVerificationStatus.VERIFIED) {
        return this.toResponse(membership);
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
    const actorProfileId = this.requireProfile(actor);
    const { status, reason } = this.parseManualDecision(body);

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
      return this.toResponse(updated);
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
      return this.toResponse(membership);
    }

    const updated = await tx.institutionMembership.update({
      where: { id: membership.id },
      data: {
        status: MembershipVerificationStatus.VERIFIED,
        method: MembershipVerificationMethod.TRUSTED_ROSTER,
        trustedRecordId: trustedRecord.id,
        verifiedAt: new Date(),
        verifiedById: null,
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
    return this.toResponse(updated);
  }

  private parseStudentId(body: unknown): string {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('A studentId is required');
    }
    const value = (body as Record<string, unknown>).studentId;
    if (typeof value !== 'string') {
      throw new BadRequestException('studentId must be a string');
    }
    const normalized = value.trim().toUpperCase();
    const containsControlCharacter = Array.from(normalized).some(
      (character) => {
        const codePoint = character.codePointAt(0);
        return (
          codePoint !== undefined && (codePoint <= 31 || codePoint === 127)
        );
      },
    );
    if (
      normalized.length < 1 ||
      normalized.length > 64 ||
      containsControlCharacter
    ) {
      throw new BadRequestException(
        'studentId must contain 1 to 64 printable characters',
      );
    }
    return normalized;
  }

  private parseManualDecision(body: unknown): {
    status:
      | typeof MembershipVerificationStatus.VERIFIED
      | typeof MembershipVerificationStatus.REJECTED
      | typeof MembershipVerificationStatus.REVOKED;
    reason: string;
  } {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('A verification decision is required');
    }
    const input = body as Record<string, unknown>;
    const allowed = [
      MembershipVerificationStatus.VERIFIED,
      MembershipVerificationStatus.REJECTED,
      MembershipVerificationStatus.REVOKED,
    ] as const;
    if (!allowed.some((status) => status === input.status)) {
      throw new BadRequestException(
        'status must be VERIFIED, REJECTED, or REVOKED',
      );
    }
    if (
      typeof input.reason !== 'string' ||
      input.reason.trim().length < 3 ||
      input.reason.trim().length > 500
    ) {
      throw new BadRequestException('reason must contain 3 to 500 characters');
    }
    return {
      status: input.status as (typeof allowed)[number],
      reason: input.reason.trim(),
    };
  }

  private requireProfile(actor: AuthUser): string {
    if (!actor.profileId) {
      throw new ForbiddenException('An active user profile is required');
    }
    return actor.profileId;
  }

  private toResponse<T extends { status: MembershipVerificationStatus }>(
    membership: T,
  ) {
    return {
      membership,
      eligibleForFreeAccess:
        membership.status === MembershipVerificationStatus.VERIFIED,
    };
  }

  private rethrowUniqueConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Student ID or user is already claimed');
    }
  }
}
