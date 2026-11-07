import { config as loadDotenv, type DotenvConfigOutput } from 'dotenv';

export const INITIAL_ADMINS_SETUP_CONFIRMATION =
  'CREATE_INITIAL_PRIVILEGED_ACCOUNTS';
export const INITIAL_ADMINS_ENV_PATH = '.env';
export const SETUP_MARKER_KEY = 'i_sharp_initial_admin_setup';
// Kept only so accounts created by the previous command remain idempotent.
export const LEGACY_SETUP_MARKER_KEY = 'i_sharp_privileged_bootstrap';
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type InitialAdminSlot = 'SUPERADMIN' | 'ADMIN';

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

export type DotenvLoader = (options: {
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

export function accountConfig(
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

export function requiredWithLegacy(
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

export function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function validateDatabaseUrl(value: string): string {
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

export function validateSupabaseUrl(value: string): string {
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

