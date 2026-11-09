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

  it('searches current and previous IDs, phone, name, and email', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new AdminService({ userProfile: { findMany } } as never);

    await service.listUsers('ISAE0025');

    const request = findMany.mock.calls[0]?.[0];
    expect(JSON.stringify(request?.where)).toContain('displayName');
    expect(JSON.stringify(request?.where)).toContain('email');
    expect(JSON.stringify(request?.where)).toContain('phone');
    expect(JSON.stringify(request?.where)).toContain('studentId');
    expect(JSON.stringify(request?.where)).toContain('studentIdHistory');
    expect(JSON.stringify(request?.where)).toContain('studentCode');
  });
});

describe('AdminService internal roster management', () => {
  const actor = {
    authUserId: 'auth-admin',
    profileId: 'admin-profile',
    roles: ['ADMIN'],
  } as const;

  it('lets the database generate sequential internal student IDs', async () => {
    const created = {
      id: 'roster-id',
      studentId: 'ISAI0001',
      fullName: 'Student One',
      email: 'student@example.com',
      authUserId: null,
      isActive: true,
    };
    const create = vi.fn().mockResolvedValue(created);
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
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
    ).resolves.toMatchObject({ studentId: 'ISAI0001' });
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
      studentId: 'ISAI0002',
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
      $queryRaw: vi.fn().mockResolvedValue([]),
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
      studentId: 'ISAI0002',
      authUserId: '00000000-0000-4000-8000-000000000001',
    });
    expect(tx.institutionMembership.update).toHaveBeenCalledWith({
      where: { id: 'membership-id' },
      data: expect.objectContaining({
        studentId: 'ISAI0002',
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

  it('normalizes editable roster fields without allowing ID changes', async () => {
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
    });

    expect(tx.trustedInstitutionStudent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'roster-id' },
        data: {
          fullName: 'Student One',
          email: 'student@example.com',
        },
      }),
    );

    await expect(
      service.updateInternalStudent(actor as never, 'roster-id', {
        studentId: 'ISAI9999',
      }),
    ).rejects.toThrow('Only fullName, email and isActive can be updated');
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
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ studentCode: 'ISAE0002' }])
        .mockResolvedValueOnce([]),
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
        studentId: 'ISAE0002',
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

describe('AdminService external-to-internal conversion', () => {
  const actor = {
    authUserId: 'auth-admin',
    profileId: 'admin-profile',
    roles: ['ADMIN'],
  } as const;

  function conversionTx(auditError?: Error) {
    const current = {
      id: '00000000-0000-4000-8000-000000000101',
      userId: 'student-profile',
      studentId: 'ISAE0025',
      studentCategory: 'EXTERNAL',
      paymentStatus: 'PAID',
      paidAccessUntil: new Date('2026-12-01T00:00:00Z'),
      user: { userRoles: [{ role: { name: 'STUDENT' } }] },
    };
    return {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ studentCode: 'ISAI0042' }])
        .mockResolvedValueOnce([]),
      institutionMembership: {
        findUnique: vi.fn().mockResolvedValue(current),
        update: vi.fn().mockResolvedValue({
          id: current.id,
          studentId: 'ISAI0042',
          studentCategory: 'INTERNAL',
          paymentStatus: 'NOT_REQUIRED',
          studentIdHistory: [
            { studentCode: 'ISAI0042', isCurrent: true },
            { studentCode: 'ISAE0025', isCurrent: false },
          ],
        }),
      },
      studentAccessAudit: {
        create: auditError
          ? vi.fn().mockRejectedValue(auditError)
          : vi.fn().mockResolvedValue({}),
      },
    };
  }

  it('rotates the display code while preserving the membership UUID', async () => {
    const tx = conversionTx();
    const service = new AdminService({
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never);

    await expect(
      service.convertExternalStudent(
        actor as never,
        '00000000-0000-4000-8000-000000000101',
        { reason: 'Joined the academy programme' },
      ),
    ).resolves.toMatchObject({
      id: '00000000-0000-4000-8000-000000000101',
      studentId: 'ISAI0042',
      studentCategory: 'INTERNAL',
    });
    expect(tx.institutionMembership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '00000000-0000-4000-8000-000000000101' },
        data: expect.objectContaining({
          studentId: 'ISAI0042',
          studentCategory: 'INTERNAL',
          paymentStatus: 'NOT_REQUIRED',
          verifiedById: 'admin-profile',
        }),
      }),
    );
    expect(tx.studentAccessAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reason: 'Joined the academy programme',
        previousCategory: 'EXTERNAL',
        newCategory: 'INTERNAL',
      }),
    });
  });

  it('rejects conversion without a mandatory reason', async () => {
    const service = new AdminService({} as never);
    await expect(
      service.convertExternalStudent(
        actor as never,
        '00000000-0000-4000-8000-000000000101',
        { reason: ' ' },
      ),
    ).rejects.toThrow('reason must contain 3 to 500 characters');
  });

  it('propagates audit failure so the transaction can roll back', async () => {
    const tx = conversionTx(new Error('audit write failed'));
    const service = new AdminService({
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never);
    await expect(
      service.convertExternalStudent(
        actor as never,
        '00000000-0000-4000-8000-000000000101',
        { reason: 'Joined the academy programme' },
      ),
    ).rejects.toThrow('audit write failed');
  });
});
