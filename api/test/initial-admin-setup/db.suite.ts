import { describe, expect, it, vi } from 'vitest';
import {
  assertNoExistingPrivilegedAssignments,
  linkPrivilegedAccounts,
  loadInitialAdminSetupConfig,
  verifyDatabaseConnectivity,
} from '../../scripts/initial-admin-setup.js';
import {
  completeEnvironment,
  confirmedUsers,
  transactionPrisma,
} from './fixtures.js';

describe('database initial admin setup preflight', () => {
  it('verifies PostgreSQL connectivity before setup can continue', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ connected: 1 }]) };

    await expect(
      verifyDatabaseConnectivity(prisma as never),
    ).resolves.toBeUndefined();
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it('retries a transient PostgreSQL connectivity failure', async () => {
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockRejectedValueOnce(new Error('transient timeout'))
        .mockResolvedValue([{ connected: 1 }]),
    };
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyDatabaseConnectivity(prisma as never, wait),
    ).resolves.toBeUndefined();
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledWith(1_000);
  });

  it('reports a sanitized PostgreSQL connectivity failure', async () => {
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockRejectedValue(new Error('connect UNKNOWN /tmp/.s.PGSQL.5432')),
    };

    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyDatabaseConnectivity(prisma as never, wait),
    ).rejects.toThrow('PostgreSQL connectivity check failed after 3 attempts');
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenNthCalledWith(1, 1_000);
    expect(wait).toHaveBeenNthCalledWith(2, 2_000);
  });

  it('refuses account creation when privileged assignments already exist', async () => {
    const prisma = { userRole: { count: vi.fn().mockResolvedValue(1) } };

    await expect(
      assertNoExistingPrivilegedAssignments(prisma as never),
    ).rejects.toThrow('Privileged role assignments already exist');
  });

  it('creates only the two profiles and exact privileged role assignments', async () => {
    const config = loadInitialAdminSetupConfig(completeEnvironment);
    const profiles = {
      SUPERADMIN: {
        id: '20000000-0000-4000-8000-000000000001',
        authUserId: '00000000-0000-4000-8000-000000000001',
        displayName: config.accounts[0].displayName,
        isActive: true,
      },
      ADMIN: {
        id: '20000000-0000-4000-8000-000000000002',
        authUserId: '00000000-0000-4000-8000-000000000002',
        displayName: config.accounts[1].displayName,
        isActive: true,
      },
    };
    const tx = {
      role: {
        upsert: vi.fn(async ({ where }: { where: { name: string } }) => ({
          id: where.name === 'SUPERADMIN' ? 'role-superadmin' : 'role-admin',
          name: where.name,
        })),
      },
      userProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(async ({ data }: { data: { authUserId: string } }) =>
          data.authUserId === profiles.SUPERADMIN.authUserId
            ? profiles.SUPERADMIN
            : profiles.ADMIN,
        ),
      },
      userRole: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = transactionPrisma(tx);

    await linkPrivilegedAccounts(
      prisma as never,
      config,
      confirmedUsers(config),
    );

    expect(tx.userProfile.create).toHaveBeenCalledTimes(2);
    expect(tx.userProfile.create).toHaveBeenNthCalledWith(1, {
      data: {
        authUserId: profiles.SUPERADMIN.authUserId,
        displayName: config.accounts[0].displayName,
        isActive: true,
      },
    });
    expect(tx.userProfile.create).toHaveBeenNthCalledWith(2, {
      data: {
        authUserId: profiles.ADMIN.authUserId,
        displayName: config.accounts[1].displayName,
        isActive: true,
      },
    });
    expect(tx.userRole.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        create: {
          userProfileId: profiles.SUPERADMIN.id,
          roleId: 'role-superadmin',
        },
      }),
    );
    expect(tx.userRole.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        create: {
          userProfileId: profiles.ADMIN.id,
          roleId: 'role-admin',
        },
      }),
    );
    expect(JSON.stringify(tx.userProfile.create.mock.calls)).not.toContain(
      config.accounts[0].password,
    );
    expect(JSON.stringify(tx.userProfile.create.mock.calls)).not.toContain(
      config.accounts[1].password,
    );
  });

  it('is idempotent when the intended profiles and assignments already exist', async () => {
    const config = loadInitialAdminSetupConfig(completeEnvironment);
    const superadminProfile = {
      id: '20000000-0000-4000-8000-000000000001',
      authUserId: '00000000-0000-4000-8000-000000000001',
      isActive: true,
    };
    const adminProfile = {
      id: '20000000-0000-4000-8000-000000000002',
      authUserId: '00000000-0000-4000-8000-000000000002',
      isActive: true,
    };
    const tx = {
      role: {
        upsert: vi.fn(async ({ where }: { where: { name: string } }) => ({
          id: where.name === 'SUPERADMIN' ? 'role-superadmin' : 'role-admin',
          name: where.name,
        })),
      },
      userProfile: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(superadminProfile)
          .mockResolvedValueOnce(adminProfile),
        create: vi.fn(),
      },
      userRole: {
        findMany: vi.fn().mockResolvedValue([
          {
            userProfileId: superadminProfile.id,
            role: { name: 'SUPERADMIN' },
          },
          { userProfileId: adminProfile.id, role: { name: 'ADMIN' } },
        ]),
        upsert: vi.fn().mockResolvedValue({}),
      },
    };

    await linkPrivilegedAccounts(
      transactionPrisma(tx) as never,
      config,
      confirmedUsers(config),
    );

    expect(tx.userProfile.create).not.toHaveBeenCalled();
    expect(tx.userRole.upsert).toHaveBeenCalledTimes(2);
  });

  it('refuses an unexpected privileged assignment', async () => {
    const config = loadInitialAdminSetupConfig(completeEnvironment);
    const tx = {
      role: {
        upsert: vi.fn(async ({ where }: { where: { name: string } }) => ({
          id: where.name === 'SUPERADMIN' ? 'role-superadmin' : 'role-admin',
          name: where.name,
        })),
      },
      userProfile: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: '20000000-0000-4000-8000-000000000001',
            isActive: true,
          })
          .mockResolvedValueOnce({
            id: '20000000-0000-4000-8000-000000000002',
            isActive: true,
          }),
        create: vi.fn(),
      },
      userRole: {
        findMany: vi.fn().mockResolvedValue([
          {
            userProfileId: '20000000-0000-4000-8000-000000000002',
            role: { name: 'SUPERADMIN' },
          },
        ]),
        upsert: vi.fn(),
      },
    };

    await expect(
      linkPrivilegedAccounts(
        transactionPrisma(tx) as never,
        config,
        confirmedUsers(config),
      ),
    ).rejects.toThrow('unexpected privileged assignment');
    expect(tx.userRole.upsert).not.toHaveBeenCalled();
  });

  it('does not assign roles until Supabase reports both emails confirmed', async () => {
    const config = loadInitialAdminSetupConfig(completeEnvironment);
    const users = confirmedUsers(config);
    users.set('ADMIN', { ...users.get('ADMIN')!, email_confirmed_at: null });
    const prisma = { $transaction: vi.fn() };

    await expect(
      linkPrivilegedAccounts(prisma as never, config, users),
    ).rejects.toThrow('ADMIN email has not been confirmed');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
