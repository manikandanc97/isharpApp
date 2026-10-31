import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  MembershipVerificationMethod,
  MembershipVerificationStatus,
} from '../generated/prisma/client.js';
import type { AuthUser } from '../auth/auth-user.js';
import { InstitutionMembershipsService } from './institution-memberships.service.js';

const student: AuthUser = {
  authUserId: '00000000-0000-4000-8000-000000000001',
  profileId: '20000000-0000-4000-8000-000000000001',
  roles: ['STUDENT'],
};

const pendingMembership = {
  id: '30000000-0000-4000-8000-000000000001',
  studentId: 'ISHARP-1001',
  status: MembershipVerificationStatus.PENDING,
  method: null,
  verifiedAt: null,
  createdAt: new Date('2026-10-31T00:00:00Z'),
  updatedAt: new Date('2026-10-31T00:00:00Z'),
};

function serviceWithTransaction(tx: Record<string, unknown>) {
  const prisma = {
    $transaction: vi.fn(async (callback: (client: unknown) => unknown) =>
      callback(tx),
    ),
  };
  return new InstitutionMembershipsService(prisma as never);
}

describe('InstitutionMembershipsService', () => {
  it.each([
    null,
    {},
    { studentId: 123 },
    { studentId: '' },
    { studentId: 'A'.repeat(65) },
    { studentId: 'ID\n100' },
  ])(
    'rejects invalid student IDs without querying the database',
    async (body) => {
      const prisma = { $transaction: vi.fn() };
      const service = new InstitutionMembershipsService(prisma as never);

      await expect(service.submit(student, body)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it('rejects a student ID already claimed by another user', async () => {
    const tx = {
      institutionMembership: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ userId: 'another-profile' }),
      },
    };
    const service = serviceWithTransaction(tx);

    await expect(
      service.submit(student, { studentId: ' isharp-1001 ' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies an exact active roster and Supabase auth identity match', async () => {
    const verifiedMembership = {
      ...pendingMembership,
      status: MembershipVerificationStatus.VERIFIED,
      method: MembershipVerificationMethod.TRUSTED_ROSTER,
      verifiedAt: new Date('2026-10-31T01:00:00Z'),
    };
    const tx = {
      institutionMembership: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        create: vi.fn().mockResolvedValue(pendingMembership),
        update: vi.fn().mockResolvedValue(verifiedMembership),
      },
      trustedInstitutionStudent: {
        findUnique: vi.fn().mockResolvedValue({
          id: '40000000-0000-4000-8000-000000000001',
          authUserId: student.authUserId,
          isActive: true,
        }),
      },
      membershipVerificationAudit: { create: vi.fn().mockResolvedValue({}) },
    };
    const service = serviceWithTransaction(tx);

    const result = await service.submit(student, {
      studentId: 'isharp-1001',
    });

    expect(result.eligibleForFreeAccess).toBe(true);
    expect(result.membership.status).toBe('VERIFIED');
    expect(tx.institutionMembership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          method: MembershipVerificationMethod.TRUSTED_ROSTER,
          status: MembershipVerificationStatus.VERIFIED,
        }),
      }),
    );
  });

  it('keeps an untrusted or identity-mismatched ID pending', async () => {
    const tx = {
      institutionMembership: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        create: vi.fn().mockResolvedValue(pendingMembership),
        update: vi.fn(),
      },
      trustedInstitutionStudent: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      membershipVerificationAudit: { create: vi.fn().mockResolvedValue({}) },
    };
    const service = serviceWithTransaction(tx);

    const result = await service.submit(student, {
      studentId: 'ISHARP-1001',
    });

    expect(result.eligibleForFreeAccess).toBe(false);
    expect(result.membership.status).toBe('PENDING');
    expect(tx.institutionMembership.update).not.toHaveBeenCalled();
    expect(tx.membershipVerificationAudit.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        reason: 'TRUSTED_ROSTER_IDENTITY_NOT_MATCHED',
      }),
    });
  });

  it('does not automatically re-verify a revoked membership', async () => {
    const tx = {
      institutionMembership: {
        findUnique: vi.fn().mockResolvedValue({
          ...pendingMembership,
          status: MembershipVerificationStatus.REVOKED,
          method: MembershipVerificationMethod.MANUAL_ADMIN,
        }),
      },
      trustedInstitutionStudent: { findUnique: vi.fn() },
    };
    const service = serviceWithTransaction(tx);

    await expect(
      service.verifyAgainstTrustedSource(student),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.trustedInstitutionStudent.findUnique).not.toHaveBeenCalled();
  });

  it('prevents an administrator from approving their own membership', async () => {
    const admin: AuthUser = {
      authUserId: '00000000-0000-4000-8000-000000000003',
      profileId: '20000000-0000-4000-8000-000000000003',
      roles: ['ADMIN'],
    };
    const tx = {
      institutionMembership: {
        findUnique: vi.fn().mockResolvedValue({
          ...pendingMembership,
          userId: admin.profileId,
          user: { userRoles: [{ role: { name: 'ADMIN' } }] },
        }),
      },
    };
    const service = serviceWithTransaction(tx);

    await expect(
      service.recordManualDecision(admin, pendingMembership.id, {
        status: 'VERIFIED',
        reason: 'Reviewed against original admission documents',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an authorized administrator to revoke with an audit entry', async () => {
    const admin: AuthUser = {
      authUserId: '00000000-0000-4000-8000-000000000003',
      profileId: '20000000-0000-4000-8000-000000000003',
      roles: ['ADMIN'],
    };
    const verified = {
      ...pendingMembership,
      status: MembershipVerificationStatus.VERIFIED,
      method: MembershipVerificationMethod.TRUSTED_ROSTER,
      verifiedAt: new Date('2026-10-31T01:00:00Z'),
      userId: student.profileId,
      user: { userRoles: [{ role: { name: 'STUDENT' } }] },
    };
    const revoked = {
      ...pendingMembership,
      status: MembershipVerificationStatus.REVOKED,
      method: MembershipVerificationMethod.MANUAL_ADMIN,
    };
    const tx = {
      institutionMembership: {
        findUnique: vi.fn().mockResolvedValue(verified),
        update: vi.fn().mockResolvedValue(revoked),
      },
      membershipVerificationAudit: { create: vi.fn().mockResolvedValue({}) },
    };
    const service = serviceWithTransaction(tx);

    const result = await service.recordManualDecision(
      admin,
      pendingMembership.id,
      { status: 'REVOKED', reason: 'Admission record was withdrawn' },
    );

    expect(result.eligibleForFreeAccess).toBe(false);
    expect(tx.membershipVerificationAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: admin.profileId,
        previousStatus: MembershipVerificationStatus.VERIFIED,
        newStatus: MembershipVerificationStatus.REVOKED,
      }),
    });
  });
});
