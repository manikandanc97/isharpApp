import { describe, expect, it, vi } from 'vitest';
import { StudentAccessResolver } from './student-access-resolver.service.js';

function serviceWith(tx: Record<string, unknown>) {
  const prisma = {
    userProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: (callback: (value: unknown) => unknown) => callback(tx),
  };
  return new StudentAccessResolver(prisma as never);
}

function existingService(profile: Record<string, unknown>) {
  const prisma = {
    userProfile: { findUnique: vi.fn().mockResolvedValue(profile) },
    trustedInstitutionStudent: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  };
  return { service: new StudentAccessResolver(prisma as never), prisma };
}

describe('StudentAccessResolver', () => {
  it('does not open a transaction for an unchanged administrator profile', async () => {
    const profile = {
      id: 'admin-profile',
      email: 'admin@example.com',
      isActive: true,
      userRoles: [{ role: { name: 'ADMIN' } }],
      institutionMembership: null,
    };
    const { service, prisma } = existingService(profile);

    await expect(
      service.resolve('00000000-0000-4000-8000-000000000010', {
        email: 'admin@example.com',
      }),
    ).resolves.toBe(profile);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('coalesces concurrent profile resolutions for the same auth user', async () => {
    const profile = {
      id: 'admin-profile',
      email: 'admin@example.com',
      isActive: true,
      userRoles: [{ role: { name: 'ADMIN' } }],
      institutionMembership: null,
    };
    let release!: (value: typeof profile) => void;
    const query = new Promise<typeof profile>((resolve) => {
      release = resolve;
    });
    const prisma = {
      userProfile: { findUnique: vi.fn().mockReturnValue(query) },
      $transaction: vi.fn(),
    };
    const service = new StudentAccessResolver(prisma as never);
    const payload = { email: 'admin@example.com' };

    const first = service.resolve(
      '00000000-0000-4000-8000-000000000011',
      payload,
    );
    const second = service.resolve(
      '00000000-0000-4000-8000-000000000011',
      payload,
    );
    release(profile);

    await expect(Promise.all([first, second])).resolves.toEqual([
      profile,
      profile,
    ]);
    expect(prisma.userProfile.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('automatically gives an exact active internal email free access', async () => {
    const created = {
      id: 'profile',
      email: 'student@example.com',
      isActive: true,
      userRoles: [{ role: { name: 'STUDENT' } }],
      institutionMembership: { studentCategory: 'INTERNAL' },
    };
    const tx = {
      userProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
      },
      role: { findUnique: vi.fn().mockResolvedValue({ id: 'student-role' }) },
      trustedInstitutionStudent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'roster',
          studentId: 'ISH-1',
          fullName: 'Student One',
          authUserId: null,
          isActive: true,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    const result = await serviceWith(tx).resolve(
      '00000000-0000-4000-8000-000000000001',
      { email: ' Student@Example.com ' },
    );
    expect(result).toBe(created);
    expect(tx.userProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'student@example.com',
          institutionMembership: {
            create: expect.objectContaining({
              studentCategory: 'INTERNAL',
              paymentStatus: 'NOT_REQUIRED',
            }),
          },
        }),
      }),
    );
  });

  it('classifies an unmatched login as external with payment pending', async () => {
    const tx = {
      userProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'external' }),
      },
      role: { findUnique: vi.fn().mockResolvedValue({ id: 'student-role' }) },
      trustedInstitutionStudent: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    await serviceWith(tx).resolve('00000000-0000-4000-8000-000000000002', {
      email: 'outside@example.com',
    });
    expect(tx.userProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          institutionMembership: {
            create: expect.objectContaining({
              studentCategory: 'EXTERNAL',
              paymentStatus: 'PENDING',
            }),
          },
        }),
      }),
    );
  });
});
