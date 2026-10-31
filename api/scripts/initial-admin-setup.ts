import { config as loadDotenv, type DotenvConfigOutput } from 'dotenv';
import type { PrismaClient } from '../src/generated/prisma/client.js';

export const INITIAL_ADMINS_SETUP_CONFIRMATION =
  'CREATE_INITIAL_PRIVILEGED_ACCOUNTS';
const INITIAL_ADMINS_ENV_PATH = '.env';
const SETUP_MARKER_KEY = 'i_sharp_initial_admin_setup';
// Kept only so accounts created by the previous command remain idempotent.
const LEGACY_SETUP_MARKER_KEY = 'i_sharp_privileged_bootstrap';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type InitialAdminSlot = 'SUPERADMIN' | 'ADMIN';

export type InitialAdminAccountConfig = {
  slot: InitialAdminSlot;
  email: string;
  password: string;
  displayName: string;
};

export type InitialAdminSetupConfig = {
  databaseUrl: string;
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  accounts: readonly [InitialAdminAccountConfig, InitialAdminAccountConfig];
};

export type SupabaseUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  app_metadata?: Record<string, unknown>;
};

type DotenvLoader = (options: {
  path: string;
  processEnv: NodeJS.ProcessEnv;
  override: boolean;
  quiet: boolean;
}) => DotenvConfigOutput;

export function loadInitialAdminEnvironment(
  env: NodeJS.ProcessEnv = process.env,
  loader: DotenvLoader = loadDotenv,
): void {
  const result = loader({
    path: INITIAL_ADMINS_ENV_PATH,
    processEnv: env,
    override: false,
    quiet: true,
  });
  if (result.error) {
    throw new Error(
      `Unable to load initial-admin environment file: ${INITIAL_ADMINS_ENV_PATH}`,
    );
  }
}

export function loadInitialAdminSetupConfig(
  env: NodeJS.ProcessEnv = process.env,
): InitialAdminSetupConfig {
  if (env.INITIAL_ADMINS_SETUP_CONFIRM !== INITIAL_ADMINS_SETUP_CONFIRMATION) {
    throw new Error(
      `INITIAL_ADMINS_SETUP_CONFIRM must equal ${INITIAL_ADMINS_SETUP_CONFIRMATION}`,
    );
  }

  const databaseUrl = validateDatabaseUrl(required(env, 'DATABASE_URL'));
  const supabaseUrl = validateSupabaseUrl(required(env, 'SUPABASE_URL'));
  const anonKey = required(env, 'SUPABASE_ANON_KEY');
  const serviceRoleKey = required(env, 'SUPABASE_SERVICE_ROLE_KEY');
  if (anonKey === serviceRoleKey) {
    throw new Error('Supabase anon and service-role keys must be different');
  }

  const superadmin = accountConfig(env, 'SUPERADMIN');
  const admin = accountConfig(env, 'ADMIN');
  if (superadmin.email === admin.email) {
    throw new Error('Initial-admin account emails must be different');
  }
  if (superadmin.password === admin.password) {
    throw new Error('Initial-admin account passwords must be different');
  }

  return {
    databaseUrl,
    supabaseUrl,
    anonKey,
    serviceRoleKey,
    accounts: [superadmin, admin],
  };
}

export class SupabaseInitialAdminAuth {
  constructor(
    private readonly config: InitialAdminSetupConfig,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  async assertSecureSignupSettings(): Promise<void> {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/settings`,
      { headers: { apikey: this.config.anonKey } },
    );
    const settings = await this.readJson<Record<string, unknown>>(
      response,
      'read Supabase Auth settings',
    );
    if (settings.disable_signup === true) {
      throw new Error('Supabase email signup is disabled');
    }
    if (settings.mailer_autoconfirm !== false) {
      throw new Error(
        'Supabase email confirmation must be enabled before initial-admin setup',
      );
    }
  }

  async listUsers(): Promise<SupabaseUser[]> {
    const users: SupabaseUser[] = [];
    const perPage = 1000;
    for (let page = 1; page <= 100; page += 1) {
      const response = await this.fetchImplementation(
        `${this.config.supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
        { headers: this.adminHeaders() },
      );
      const result = await this.readJson<{ users?: SupabaseUser[] }>(
        response,
        'list Supabase Auth users',
      );
      if (!Array.isArray(result.users)) {
        throw new Error('Supabase Auth returned an invalid user list');
      }
      users.push(...result.users);
      if (result.users.length < perPage) return users;
    }
    throw new Error('Supabase Auth user scan exceeded the safety limit');
  }

  resolveConfiguredUsers(
    users: SupabaseUser[],
  ): Map<InitialAdminSlot, SupabaseUser> {
    const resolved = new Map<InitialAdminSlot, SupabaseUser>();
    for (const account of this.config.accounts) {
      const byEmail = users.find(
        (user) => user.email?.trim().toLowerCase() === account.email,
      );
      const marked = users.filter(
        (user) => this.markerSlot(user) === account.slot,
      );
      if (marked.length > 1) {
        throw new Error(`Multiple Auth users carry the ${account.slot} marker`);
      }
      if (marked[0] && marked[0].id !== byEmail?.id) {
        throw new Error(
          `${account.slot} setup marker does not match the configured email`,
        );
      }
      if (byEmail && this.markerSlot(byEmail) !== account.slot) {
        throw new Error(
          `The configured ${account.slot} email already belongs to an account not created by this setup`,
        );
      }
      if (byEmail) resolved.set(account.slot, byEmail);
    }

    const superadmin = resolved.get('SUPERADMIN');
    const admin = resolved.get('ADMIN');
    if (superadmin && admin && superadmin.id === admin.id) {
      throw new Error(
        'Initial-admin roles must reference different Auth users',
      );
    }
    return resolved;
  }

  async createAccount(
    account: InitialAdminAccountConfig,
  ): Promise<SupabaseUser> {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/signup`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
      },
    );
    const result = await this.readJson<
      SupabaseUser & {
        user?: SupabaseUser;
        session?: unknown;
      }
    >(response, `create the ${account.slot} Auth account`);
    const createdUser = result.user ?? (result.id ? result : undefined);
    if (!createdUser || !UUID_PATTERN.test(createdUser.id)) {
      throw new Error('Supabase Auth did not return a valid created user');
    }
    if (result.session || createdUser.email_confirmed_at) {
      await this.deleteUnexpectedAutoConfirmedUser(createdUser.id);
      throw new Error(
        'Supabase unexpectedly auto-confirmed an initial-admin account; the new account was removed',
      );
    }

    try {
      await this.setSetupMarker(
        createdUser.id,
        account.slot,
        createdUser.app_metadata,
      );
    } catch {
      await this.deleteNewUserAfterPartialFailure(createdUser.id);
      throw new Error(
        `The ${account.slot} account could not be safely marked and was removed; verify service-role permissions before retrying`,
      );
    }
    return {
      ...createdUser,
      app_metadata: {
        ...createdUser.app_metadata,
        [SETUP_MARKER_KEY]: { version: 1, slot: account.slot },
      },
    };
  }

  private markerSlot(user: SupabaseUser): InitialAdminSlot | null {
    const marker =
      user.app_metadata?.[SETUP_MARKER_KEY] ??
      user.app_metadata?.[LEGACY_SETUP_MARKER_KEY];
    if (!marker || typeof marker !== 'object' || Array.isArray(marker)) {
      return null;
    }
    const value = (marker as Record<string, unknown>).slot;
    return value === 'SUPERADMIN' || value === 'ADMIN' ? value : null;
  }

  private async setSetupMarker(
    userId: string,
    slot: InitialAdminSlot,
    existingMetadata: Record<string, unknown> = {},
  ): Promise<void> {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          ...this.adminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_metadata: {
            ...existingMetadata,
            [SETUP_MARKER_KEY]: { version: 1, slot },
          },
        }),
      },
    );
    await this.readJson(response, `mark the ${slot} setup account`);
  }

  private async deleteUnexpectedAutoConfirmedUser(userId: string) {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/admin/users/${userId}`,
      { method: 'DELETE', headers: this.adminHeaders() },
    );
    if (!response.ok) {
      throw new Error(
        'Supabase auto-confirmed a new account and automatic cleanup failed; remove it manually before retrying',
      );
    }
  }

  private async deleteNewUserAfterPartialFailure(userId: string) {
    const response = await this.fetchImplementation(
      `${this.config.supabaseUrl}/auth/v1/admin/users/${userId}`,
      { method: 'DELETE', headers: this.adminHeaders() },
    );
    if (!response.ok) {
      throw new Error(
        'A partially created unmarked Auth account could not be removed; delete the configured account in Supabase before retrying',
      );
    }
  }

  private adminHeaders(): Record<string, string> {
    return {
      apikey: this.config.serviceRoleKey,
      Authorization: `Bearer ${this.config.serviceRoleKey}`,
    };
  }

  private async readJson<T = Record<string, unknown>>(
    response: Response,
    operation: string,
  ): Promise<T> {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Insufficient Supabase permissions to ${operation} (HTTP ${response.status})`,
        );
      }
      throw new Error(`Failed to ${operation} (HTTP ${response.status})`);
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new Error(
        `Supabase returned an invalid response while trying to ${operation}`,
      );
    }
  }
}

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

function requireConfirmedUser(
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

async function ensureActiveProfile(
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

function accountConfig(
  env: NodeJS.ProcessEnv,
  slot: InitialAdminSlot,
): InitialAdminAccountConfig {
  const emailName = `INITIAL_${slot}_EMAIL`;
  const email = requiredWithLegacy(env, emailName, `BOOTSTRAP_${slot}_EMAIL`)
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`${emailName} must be a valid email address`);
  }
  const passwordName = `INITIAL_${slot}_PASSWORD`;
  const displayName = `INITIAL_${slot}_DISPLAY_NAME`;
  const password = requiredWithLegacy(
    env,
    passwordName,
    `BOOTSTRAP_${slot}_INITIAL_PASSWORD`,
  );
  if (password.length < 8 || password.length > 128) {
    throw new Error(`${passwordName} must contain 8 to 128 characters`);
  }
  const resolvedDisplayName = requiredWithLegacy(
    env,
    displayName,
    `BOOTSTRAP_${slot}_DISPLAY_NAME`,
  ).trim();
  if (resolvedDisplayName.length < 1 || resolvedDisplayName.length > 150) {
    throw new Error(`${displayName} must contain 1 to 150 characters`);
  }
  return { slot, email, password, displayName: resolvedDisplayName };
}

function requiredWithLegacy(
  env: NodeJS.ProcessEnv,
  name: string,
  legacyName: string,
): string {
  const value = env[name];
  const legacyValue = env[legacyName];
  if (value && legacyValue && value !== legacyValue) {
    throw new Error(`${name} conflicts with legacy ${legacyName}`);
  }
  if (value) return value;
  if (legacyValue) return legacyValue;
  throw new Error(`${name} is not configured`);
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function validateDatabaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL URL beginning with postgresql://',
    );
  }
  if (
    !['postgresql:', 'postgres:'].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname ||
    url.pathname === '/'
  ) {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL URL beginning with postgresql:// and include a host and database name',
    );
  }
  return value;
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

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function validateSupabaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('SUPABASE_URL must be a valid URL');
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('SUPABASE_URL must use HTTPS (except local development)');
  }
  return url.toString().replace(/\/$/, '');
}
