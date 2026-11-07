import { vi } from 'vitest';
import {
  INITIAL_ADMINS_SETUP_CONFIRMATION,
  type InitialAdminSetupConfig,
  type SupabaseUser,
} from '../../scripts/initial-admin-setup.js';

export const completeEnvironment: NodeJS.ProcessEnv = {
  DATABASE_URL: 'postgresql://server/database',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  INITIAL_SUPERADMIN_EMAIL: 'owner@example.com',
  INITIAL_SUPERADMIN_PASSWORD: 'a-strong-password-1',
  INITIAL_SUPERADMIN_DISPLAY_NAME: 'Academy Owner',
  INITIAL_ADMIN_EMAIL: 'administrator@example.com',
  INITIAL_ADMIN_PASSWORD: 'a-different-password-2',
  INITIAL_ADMIN_DISPLAY_NAME: 'Academy Admin',
  INITIAL_ADMINS_SETUP_CONFIRM: INITIAL_ADMINS_SETUP_CONFIRMATION,
};

export function markedUser(
  config: InitialAdminSetupConfig,
  slot: 'SUPERADMIN' | 'ADMIN',
  suffix: number,
): SupabaseUser {
  const account = config.accounts.find((candidate) => candidate.slot === slot)!;
  return {
    id: `00000000-0000-4000-8000-${suffix.toString().padStart(12, '0')}`,
    email: account.email,
    email_confirmed_at: '2026-10-31T00:00:00Z',
    app_metadata: {
      i_sharp_initial_admin_setup: { version: 1, slot },
    },
  };
}

export function confirmedUsers(
  config: InitialAdminSetupConfig,
): Map<'SUPERADMIN' | 'ADMIN', SupabaseUser> {
  return new Map([
    ['SUPERADMIN', markedUser(config, 'SUPERADMIN', 1)],
    ['ADMIN', markedUser(config, 'ADMIN', 2)],
  ] as const);
}

export function transactionPrisma(tx: object) {
  return {
    $transaction: vi.fn(
      async (callback: (transaction: object) => Promise<unknown>) =>
        callback(tx),
    ),
  };
}

