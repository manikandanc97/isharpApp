import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { createInterface } from 'node:readline';
import { PrismaClient } from '../src/generated/prisma/client.js';

const CONFIRMATION = 'ENSURE_SINGLE_ADMIN_ACCOUNT';

async function main() {
  if (process.env.ADMIN_ACCOUNT_SETUP_CONFIRM !== CONFIRMATION) {
    throw new Error(`ADMIN_ACCOUNT_SETUP_CONFIRM must equal ${CONFIRMATION}`);
  }

  const email = required('TARGET_ADMIN_EMAIL').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('TARGET_ADMIN_EMAIL must be a valid email address');
  }
  const password = await readSecretFromStdin();
  if (password.length < 8 || password.length > 128) {
    throw new Error('The admin password must contain 8 to 128 characters');
  }

  const databaseUrl = required('DATABASE_URL');
  const supabaseUrl = required('SUPABASE_URL').replace(/\/$/, '');
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  let createdUserId: string | null = null;
  try {
    const users = await listAuthUsers(supabaseUrl, serviceRoleKey);
    let authUser = users.find(
      (candidate) => candidate.email?.trim().toLowerCase() === email,
    );

    const assignments = await prisma.userRole.findMany({
      where: { role: { name: 'ADMIN' } },
      select: {
        userProfile: { select: { authUserId: true } },
      },
    });
    const assignedAuthIds = assignments
      .map(({ userProfile }) => userProfile.authUserId)
      .filter((value): value is string => Boolean(value));

    if (
      assignedAuthIds.length > 0 &&
      (!authUser || !assignedAuthIds.includes(authUser.id))
    ) {
      throw new Error(
        'A different ADMIN assignment already exists; refusing to replace or add a privileged account',
      );
    }

    if (authUser) {
      const existingProfile = await prisma.userProfile.findUnique({
        where: { authUserId: authUser.id },
        select: {
          isActive: true,
          userRoles: { select: { role: { select: { name: true } } } },
        },
      });
      if (existingProfile && !existingProfile.isActive) {
        throw new Error('The configured administrator profile is inactive');
      }
      if (
        existingProfile?.userRoles.some(
          ({ role }) => role.name === 'SUPERADMIN',
        )
      ) {
        throw new Error(
          'The configured email belongs to a SUPERADMIN; refusing to change its credentials',
        );
      }
      authUser = await adminRequest<AuthUser>(
        supabaseUrl,
        serviceRoleKey,
        `/auth/v1/admin/users/${authUser.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ password, email_confirm: true }),
        },
      );
    } else {
      authUser = await adminRequest<AuthUser>(
        supabaseUrl,
        serviceRoleKey,
        '/auth/v1/admin/users',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            email_confirm: true,
            user_metadata: { display_name: 'I-Sharp Administrator' },
          }),
        },
      );
      createdUserId = authUser.id;
    }

    if (!isUuid(authUser.id)) {
      throw new Error('Supabase Auth did not return a valid user identifier');
    }

    await prisma.$transaction(async (tx) => {
      const role = await tx.role.upsert({
        where: { name: 'ADMIN' },
        create: { name: 'ADMIN', description: 'Academy administrator' },
        update: {},
      });
      const existingProfile = await tx.userProfile.findUnique({
        where: { authUserId: authUser.id },
      });
      if (existingProfile && !existingProfile.isActive) {
        throw new Error('The configured administrator profile is inactive');
      }
      const profile =
        existingProfile ??
        (await tx.userProfile.create({
          data: {
            authUserId: authUser.id,
            displayName: 'I-Sharp Administrator',
            isActive: true,
          },
        }));
      await tx.userRole.upsert({
        where: {
          userProfileId_roleId: {
            userProfileId: profile.id,
            roleId: role.id,
          },
        },
        create: { userProfileId: profile.id, roleId: role.id },
        update: {},
      });
    });

    console.log('Supabase administrator account and trusted ADMIN role are ready.');
  } catch (error) {
    if (createdUserId) {
      await adminRequest(
        supabaseUrl,
        serviceRoleKey,
        `/auth/v1/admin/users/${createdUserId}`,
        { method: 'DELETE' },
      ).catch(() => undefined);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

type AuthUser = { id: string; email?: string };

async function listAuthUsers(url: string, key: string) {
  const users: AuthUser[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const result = await adminRequest<{ users?: AuthUser[] }>(
      url,
      key,
      `/auth/v1/admin/users?page=${page}&per_page=1000`,
    );
    if (!Array.isArray(result.users)) {
      throw new Error('Supabase Auth returned an invalid user list');
    }
    users.push(...result.users);
    if (result.users.length < 1000) return users;
  }
  throw new Error('Supabase Auth user scan exceeded the safety limit');
}

async function adminRequest<T = Record<string, unknown>>(
  url: string,
  key: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  headers.set('Authorization', `Bearer ${key}`);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    throw new Error(`Supabase administrator operation failed (HTTP ${response.status})`);
  }
  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

async function readSecretFromStdin() {
  const input = createInterface({ input: process.stdin, terminal: false });
  const iterator = input[Symbol.asyncIterator]();
  const result = await iterator.next();
  input.close();
  return result.done ? '' : result.value;
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Administrator account setup failed: ${message}`);
  process.exitCode = 1;
}
