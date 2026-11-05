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
        select: expect.objectContaining({
          institutionMembership: expect.objectContaining({
            select: expect.objectContaining({ trustedRecordId: true }),
          }),
        }),
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

  it('lets the database generate sequential ISA student IDs', async () => {
    const created = {
      id: 'roster-id',
      studentId: 'ISA001',
      fullName: 'Student One',
      email: 'student@example.com',
      authUserId: null,
      isActive: true,
    };
    const create = vi.fn().mockResolvedValue(created);
    const tx = {
      trustedInstitutionStudent: { create },
      userProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const service = new AdminService({
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never);

    await expect(
      service.createInternalStudent(actor as never, {
        fullName: ' Student One ',
        email: ' STUDENT@EXAMPLE.COM ',
        studentId: 'CLIENT-SUPPLIED-ID',
      }),
    ).resolves.toMatchObject({ studentId: 'ISA001' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          fullName: 'Student One',
          email: 'student@example.com',
          isActive: true,
        },
      }),
    );
  });

  it('immediately promotes a matching external account to internal access', async () => {
    const created = {
      id: 'roster-id',
      studentId: 'ISA002',
      fullName: 'Mani',
      email: 'manibct1817@gmail.com',
      authUserId: null,
      isActive: true,
    };
    const membership = {
      id: 'membership-id',
      studentCategory: 'EXTERNAL',
      paymentStatus: 'PENDING',
      paidAccessUntil: null,
    };
    const tx = {
      trustedInstitutionStudent: {
        create: vi.fn().mockResolvedValue(created),
        update: vi.fn().mockResolvedValue({}),
      },
      userProfile: {
        findUnique: vi.fn().mockResolvedValue({
          authUserId: '00000000-0000-4000-8000-000000000001',
          userRoles: [{ role: { name: 'STUDENT' } }],
          institutionMembership: membership,
        }),
      },
      institutionMembership: {
        update: vi.fn().mockResolvedValue({
          studentCategory: 'INTERNAL',
          paymentStatus: 'NOT_REQUIRED',
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
      service.createInternalStudent(actor as never, {
        fullName: 'Mani',
        email: 'manibct1817@gmail.com',
      }),
    ).resolves.toMatchObject({
      studentId: 'ISA002',
      authUserId: '00000000-0000-4000-8000-000000000001',
    });
    expect(tx.institutionMembership.update).toHaveBeenCalledWith({
      where: { id: 'membership-id' },
      data: expect.objectContaining({
        studentId: 'ISA002',
        status: 'VERIFIED',
        studentCategory: 'INTERNAL',
        paymentStatus: 'NOT_REQUIRED',
        trustedRecordId: 'roster-id',
        method: 'TRUSTED_ROSTER',
        verifiedById: 'admin-profile',
      }),
    });
    expect(tx.trustedInstitutionStudent.update).toHaveBeenCalledWith({
      where: { id: 'roster-id' },
      data: { authUserId: '00000000-0000-4000-8000-000000000001' },
    });
    expect(tx.studentAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        membershipId: 'membership-id',
        reason: 'ADMIN_INTERNAL_ROSTER_ADDED',
      }),
    });
  });

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
