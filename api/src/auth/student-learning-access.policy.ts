import { ForbiddenException } from '@nestjs/common';
import {
  MembershipVerificationStatus,
  StudentCategory,
  StudentPaymentStatus,
} from '../generated/prisma/client.js';

export interface MembershipAccessSnapshot {
  status: MembershipVerificationStatus;
  studentCategory: StudentCategory | null;
  paymentStatus: StudentPaymentStatus;
  paidAccessUntil: Date | null;
}

/**
 * Pure policy check for whether a student membership grants active learning access.
 * - INTERNAL students require VERIFIED status.
 * - EXTERNAL students require non-REJECTED/non-REVOKED status, PAID paymentStatus,
 *   and an active (or open-ended) paidAccessUntil timestamp.
 */
export function hasStudentLearningAccess(
  membership: MembershipAccessSnapshot | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!membership) return false;

  if (membership.studentCategory === StudentCategory.INTERNAL) {
    return membership.status === MembershipVerificationStatus.VERIFIED;
  }

  if (membership.studentCategory !== StudentCategory.EXTERNAL) {
    return false;
  }

  return (
    membership.status !== MembershipVerificationStatus.REJECTED &&
    membership.status !== MembershipVerificationStatus.REVOKED &&
    membership.paymentStatus === StudentPaymentStatus.PAID &&
    (!membership.paidAccessUntil || membership.paidAccessUntil > now)
  );
}

/**
 * Enforces student learning access and throws the exact ForbiddenException
 * reasons expected by protected endpoints and VerifiedMembershipGuard.
 */
export function assertStudentLearningAccess(
  membership: MembershipAccessSnapshot | null | undefined,
  now: Date = new Date(),
): void {
  if (!membership) {
    throw new ForbiddenException('Student access record is required');
  }
  if (
    membership.studentCategory !== StudentCategory.INTERNAL &&
    membership.studentCategory !== StudentCategory.EXTERNAL
  ) {
    throw new ForbiddenException('Student access classification is required');
  }
  if (
    membership.status === MembershipVerificationStatus.REJECTED ||
    membership.status === MembershipVerificationStatus.REVOKED
  ) {
    throw new ForbiddenException('Student membership is not active');
  }
  if (membership.studentCategory === StudentCategory.INTERNAL) {
    if (membership.status !== MembershipVerificationStatus.VERIFIED) {
      throw new ForbiddenException('A verified student membership is required');
    }
    return;
  }
  const paidAndCurrent =
    membership.paymentStatus === StudentPaymentStatus.PAID &&
    (!membership.paidAccessUntil || membership.paidAccessUntil > now);
  if (!paidAndCurrent) {
    throw new ForbiddenException(
      'An active paid plan is required for external students',
    );
  }
}
