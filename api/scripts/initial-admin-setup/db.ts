import type { PrismaClient } from '../../src/generated/prisma/client.js';
import {
  type InitialAdminSetupConfig,
  type InitialAdminSlot,
  type SupabaseUser,
  UUID_PATTERN,
} from './config.js';

export async function assertNoExistingPrivilegedAssignments(
  prisma: PrismaClient,
): Promise<void> {
  const count = await prisma.userRole.count({
    where: { role: { name: { in: ['ADMIN', 'SUPERADMIN'] } } },
  });
  if (count !== 0) {
    throw new Error(
      'Privileged role assignments already exist; initial-admin setup will not create more accounts',
    );
  }
}

export async function linkPrivilegedAccounts(
  prisma: PrismaClient,
  config: InitialAdminSetupConfig,
  users: ReadonlyMap<InitialAdminSlot, SupabaseUser>,
): Promise<void> {
  const superadminUser = requireConfirmedUser(users, 'SUPERADMIN');
  const adminUser = requireConfirmedUser(users, 'ADMIN');

  await prisma.$transaction(async (tx) => {
    const superadminRole = await tx.role.upsert({
      where: { name: 'SUPERADMIN' },
      create: {
        name: 'SUPERADMIN',
        description: 'System administrator with privileged account management',
      },
      update: {},
    });
    const adminRole = await tx.role.upsert({
      where: { name: 'ADMIN' },
      create: { name: 'ADMIN', description: 'Academy administrator' },
      update: {},
    });

    const superadminProfile = await ensureActiveProfile(
      tx,
      superadminUser.id,
      config.accounts[0].displayName,
    );
    const adminProfile = await ensureActiveProfile(
      tx,
      adminUser.id,
      config.accounts[1].displayName,
    );

    const assignments = await tx.userRole.findMany({
      where: { roleId: { in: [superadminRole.id, adminRole.id] } },
      select: { userProfileId: true, role: { select: { name: true } } },
    });
    for (const assignment of assignments) {
      const expectedProfileId =
        assignment.role.name === 'SUPERADMIN'
          ? superadminProfile.id
          : adminProfile.id;
      if (assignment.userProfileId !== expectedProfileId) {
        throw new Error(
          'An unexpected privileged assignment already exists; setup refused to promote or replace users',
        );
      }
    }

    await tx.userRole.upsert({
      where: {
        userProfileId_roleId: {
          userProfileId: superadminProfile.id,
          roleId: superadminRole.id,
        },
      },
      create: {
        userProfileId: superadminProfile.id,
        roleId: superadminRole.id,
      },
      update: {},
    });
    await tx.userRole.upsert({
      where: {
        userProfileId_roleId: {
          userProfileId: adminProfile.id,
          roleId: adminRole.id,
        },
      },
      create: { userProfileId: adminProfile.id, roleId: adminRole.id },
      update: {},
    });
  });
}

export function requireConfirmedUser(
  users: ReadonlyMap<InitialAdminSlot, SupabaseUser>,
  slot: InitialAdminSlot,
): SupabaseUser {
  const user = users.get(slot);
  if (!user || !UUID_PATTERN.test(user.id)) {
    throw new Error(`${slot} Auth account has not been created`);
  }
  if (!user.email_confirmed_at) {
    throw new Error(`${slot} email has not been confirmed`);
  }
  return user;
}

export async function ensureActiveProfile(
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  authUserId: string,
  displayName: string,
) {
  const existing = await tx.userProfile.findUnique({ where: { authUserId } });
  if (existing && !existing.isActive) {
    throw new Error('An initial-admin UserProfile exists but is inactive');
  }
  return (
    existing ??
    (await tx.userProfile.create({
      data: { authUserId, displayName, isActive: true },
    }))
  );
}

export async function verifyDatabaseConnectivity(
  prisma: PrismaClient,
  wait: (milliseconds: number) => Promise<void> = delay,
): Promise<void> {
  const maximumAttempts = 3;
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch {
      if (attempt < maximumAttempts) await wait(attempt * 1_000);
    }
  }
  throw new Error(
    'PostgreSQL connectivity check failed after 3 attempts; verify DATABASE_URL, network access, SSL settings, and database availability before running initial-admin setup',
  );
}

export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

