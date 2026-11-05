import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import {
  MembershipVerificationStatus,
  Prisma,
  StudentCategory,
} from '../generated/prisma/client.js';

export const membershipSelect = {
  id: true,
  studentId: true,
  status: true,
  method: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
  studentCategory: true,
  paymentStatus: true,
  paidAccessUntil: true,
} satisfies Prisma.InstitutionMembershipSelect;

export function parseStudentId(body: unknown): string {
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

export function parseManualDecision(body: unknown): {
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

export function requireProfile(actor: AuthUser): string {
  if (!actor.profileId) {
    throw new ForbiddenException('An active user profile is required');
  }
  return actor.profileId;
}

export function toMembershipResponse<
  T extends { status: MembershipVerificationStatus },
>(membership: T) {
  return {
    membership,
    eligibleForFreeAccess:
      membership.status === MembershipVerificationStatus.VERIFIED &&
      'studentCategory' in membership &&
      membership.studentCategory === StudentCategory.INTERNAL,
  };
}

export function rethrowUniqueConflict(error: unknown): void {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException('Student ID or user is already claimed');
  }
}

