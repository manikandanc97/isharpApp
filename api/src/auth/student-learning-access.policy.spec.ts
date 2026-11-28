import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  MembershipVerificationStatus,
  StudentCategory,
  StudentPaymentStatus,
} from '../generated/prisma/client.js';
import {
  assertStudentLearningAccess,
  hasStudentLearningAccess,
} from './student-learning-access.policy.js';

describe('student-learning-access.policy', () => {
  const now = new Date('2026-11-28T10:00:00.000Z');
  const future = new Date('2026-12-28T10:00:00.000Z');
  const past = new Date('2026-10-28T10:00:00.000Z');

  it('allows VERIFIED INTERNAL students and blocks PENDING INTERNAL students', () => {
    expect(
      hasStudentLearningAccess(
        {
          studentCategory: StudentCategory.INTERNAL,
          status: MembershipVerificationStatus.VERIFIED,
          paymentStatus: StudentPaymentStatus.NOT_REQUIRED,
          paidAccessUntil: null,
        },
        now,
      ),
    ).toBe(true);

    expect(() =>
      assertStudentLearningAccess(
        {
          studentCategory: StudentCategory.INTERNAL,
          status: MembershipVerificationStatus.PENDING,
          paymentStatus: StudentPaymentStatus.NOT_REQUIRED,
          paidAccessUntil: null,
        },
        now,
      ),
    ).toThrow(new ForbiddenException('A verified student membership is required'));
  });

  it('allows active PAID EXTERNAL students and rejects expired, unpaid, or revoked ones', () => {
    expect(
      hasStudentLearningAccess(
        {
          studentCategory: StudentCategory.EXTERNAL,
          status: MembershipVerificationStatus.PENDING,
          paymentStatus: StudentPaymentStatus.PAID,
          paidAccessUntil: future,
        },
        now,
      ),
    ).toBe(true);

    expect(() =>
      assertStudentLearningAccess(
        {
          studentCategory: StudentCategory.EXTERNAL,
          status: MembershipVerificationStatus.VERIFIED,
          paymentStatus: StudentPaymentStatus.PAID,
          paidAccessUntil: past,
        },
        now,
      ),
    ).toThrow(
      new ForbiddenException(
        'An active paid plan is required for external students',
      ),
    );

    expect(() =>
      assertStudentLearningAccess(
        {
          studentCategory: StudentCategory.EXTERNAL,
          status: MembershipVerificationStatus.REVOKED,
          paymentStatus: StudentPaymentStatus.PAID,
          paidAccessUntil: future,
        },
        now,
      ),
    ).toThrow(new ForbiddenException('Student membership is not active'));
  });

  it('rejects null membership or missing studentCategory', () => {
    expect(() => assertStudentLearningAccess(null, now)).toThrow(
      new ForbiddenException('Student access record is required'),
    );
    expect(() =>
      assertStudentLearningAccess(
        {
          studentCategory: null,
          status: MembershipVerificationStatus.PENDING,
          paymentStatus: StudentPaymentStatus.NOT_REQUIRED,
          paidAccessUntil: null,
        },
        now,
      ),
    ).toThrow(new ForbiddenException('Student access classification is required'));
  });
});
