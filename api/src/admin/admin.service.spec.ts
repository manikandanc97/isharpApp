import { AdminService } from './admin.service.js';

const studentRoleFilter = {
  some: { role: { name: 'STUDENT' } },
  none: { role: { name: { in: ['ADMIN', 'SUPERADMIN'] } } },
};

describe('AdminService student account isolation', () => {
  it('lists only non-privileged profiles with the STUDENT role', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'student-profile',
        displayName: 'Student One',
        email: 'student@example.com',
        isActive: true,
        createdAt: new Date('2026-11-01T00:00:00Z'),
        userRoles: [{ role: { name: 'STUDENT' } }],
        institutionMembership: null,
      },
    ]);
    const service = new AdminService({
      userProfile: { findMany },
    } as never);

    const result = await service.listUsers();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userRoles: studentRoleFilter },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({ id: 'student-profile', roles: ['STUDENT'] }),
    ]);
  });

  it('uses the same student-only boundary for overview counts and activity', async () => {
    const userCount = vi.fn().mockResolvedValue(0);
    const membershipCount = vi.fn().mockResolvedValue(0);
    const membershipFindMany = vi.fn().mockResolvedValue([]);
    const service = new AdminService({
      userProfile: { count: userCount },
      institutionMembership: {
        count: membershipCount,
        findMany: membershipFindMany,
      },
      course: { count: vi.fn().mockResolvedValue(0) },
      subject: { count: vi.fn().mockResolvedValue(0) },
    } as never);

    await service.overview();

    expect(userCount).toHaveBeenNthCalledWith(1, {
      where: { userRoles: studentRoleFilter },
    });
    expect(userCount).toHaveBeenNthCalledWith(2, {
      where: { isActive: true, userRoles: studentRoleFilter },
    });
    expect(membershipCount).toHaveBeenCalledWith({
      where: {
        status: 'PENDING',
        user: { userRoles: studentRoleFilter },
      },
    });
    expect(membershipFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user: { userRoles: studentRoleFilter } },
      }),
    );
  });
});

describe('AdminService internal roster management', () => {
  const actor = {
    authUserId: 'auth-admin',
    profileId: 'admin-profile',
    roles: ['ADMIN'],
  } as const;

  it('normalizes editable roster fields', async () => {
    const tx = {
      trustedInstitutionStudent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'roster-id',
          email: 'old@example.com',
          authUserId: null,
          membership: null,
        }),
        update: vi.fn().mockResolvedValue({ id: 'roster-id' }),
      },
    };
    const service = new AdminService({
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never);

    await service.updateInternalStudent(actor as never, 'roster-id', {
      fullName: '  Student One  ',
      email: '  STUDENT@EXAMPLE.COM ',
      studentId: ' int-001 ',
    });

    expect(tx.trustedInstitutionStudent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'roster-id' },
        data: {
          fullName: 'Student One',
          email: 'student@example.com',
          studentId: 'INT-001',
        },
      }),
    );
  });

  it('does not allow a matched login email to be reassigned', async () => {
    const tx = {
      trustedInstitutionStudent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'roster-id',
          email: 'matched@example.com',
          authUserId: 'matched-auth-user',
          membership: null,
        }),
        update: vi.fn(),
      },
    };
    const service = new AdminService({
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never);

    await expect(
      service.updateInternalStudent(actor as never, 'roster-id', {
        email: 'different@example.com',
      }),
    ).rejects.toThrow('A matched login email cannot be changed');
    expect(tx.trustedInstitutionStudent.update).not.toHaveBeenCalled();
  });

  it('detaches linked access before deleting a roster record', async () => {
    const tx = {
      trustedInstitutionStudent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'roster-id',
          membership: {
            id: 'membership-id',
            studentCategory: 'INTERNAL',
            paymentStatus: 'NOT_REQUIRED',
            paidAccessUntil: null,
          },
        }),
        delete: vi.fn().mockResolvedValue({ id: 'roster-id' }),
      },
      institutionMembership: {
        update: vi.fn().mockResolvedValue({
          studentCategory: 'EXTERNAL',
          paymentStatus: 'PENDING',
          paidAccessUntil: null,
        }),
      },
      studentAccessAudit: { create: vi.fn().mockResolvedValue({}) },
    };
    const service = new AdminService({
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never);

    await expect(
      service.deleteInternalStudent(actor as never, 'roster-id'),
    ).resolves.toEqual({ id: 'roster-id', deleted: true });
    expect(tx.institutionMembership.update).toHaveBeenCalledWith({
      where: { id: 'membership-id' },
      data: {
        studentCategory: 'EXTERNAL',
        paymentStatus: 'PENDING',
        paidAccessUntil: null,
        trustedRecordId: null,
        method: null,
      },
    });
    expect(tx.studentAccessAudit.create).toHaveBeenCalled();
    expect(tx.trustedInstitutionStudent.delete).toHaveBeenCalledWith({
      where: { id: 'roster-id' },
    });
  });
});
