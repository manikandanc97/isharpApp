import { describe, expect, it, vi } from 'vitest';
import {
  loadInitialAdminEnvironment,
  loadInitialAdminSetupConfig,
} from '../../scripts/initial-admin-setup.js';
import { completeEnvironment } from './fixtures.js';

describe('initial admin setup configuration', () => {
  it('explicitly loads .env before configuration is read', () => {
    const environment: NodeJS.ProcessEnv = {};
    const loader = vi.fn((options: { processEnv: NodeJS.ProcessEnv }) => {
      options.processEnv.DATABASE_URL = 'postgresql://loaded/database';
      return { parsed: { DATABASE_URL: 'postgresql://loaded/database' } };
    });

    loadInitialAdminEnvironment(environment, loader);

    expect(loader).toHaveBeenCalledWith({
      path: '.env',
      processEnv: environment,
      override: false,
      quiet: true,
    });
    expect(environment.DATABASE_URL).toBe('postgresql://loaded/database');
  });

  it('fails clearly when the selected environment file cannot be loaded', () => {
    const loader = vi.fn().mockReturnValue({ error: new Error('ENOENT') });

    expect(() => loadInitialAdminEnvironment({}, loader)).toThrow(
      'Unable to load initial-admin environment file: .env',
    );
  });

  it('fails closed when the explicit confirmation switch is missing', () => {
    expect(() =>
      loadInitialAdminSetupConfig({
        ...completeEnvironment,
        INITIAL_ADMINS_SETUP_CONFIRM: undefined,
      }),
    ).toThrow('INITIAL_ADMINS_SETUP_CONFIRM');
  });

  it.each([
    '//user:password@database.example.com:5432/postgres',
    'https://database.example.com/postgres',
    'postgresql://database.example.com',
  ])('rejects malformed PostgreSQL configuration: %s', (databaseUrl) => {
    expect(() =>
      loadInitialAdminSetupConfig({
        ...completeEnvironment,
        DATABASE_URL: databaseUrl,
      }),
    ).toThrow('DATABASE_URL must be a valid PostgreSQL URL');
  });

  it.each([
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INITIAL_SUPERADMIN_EMAIL',
    'INITIAL_SUPERADMIN_PASSWORD',
    'INITIAL_SUPERADMIN_DISPLAY_NAME',
    'INITIAL_ADMIN_EMAIL',
    'INITIAL_ADMIN_PASSWORD',
    'INITIAL_ADMIN_DISPLAY_NAME',
  ])('rejects missing %s configuration', (name) => {
    expect(() =>
      loadInitialAdminSetupConfig({
        ...completeEnvironment,
        [name]: undefined,
      }),
    ).toThrow(name);
  });

  it('uses the two configured academy identities', () => {
    const config = loadInitialAdminSetupConfig(completeEnvironment);

    expect(config.accounts[0].email).toBe('owner@example.com');
    expect(config.accounts[1].email).toBe('administrator@example.com');
  });

  it('requires distinct initial-admin emails', () => {
    expect(() =>
      loadInitialAdminSetupConfig({
        ...completeEnvironment,
        INITIAL_ADMIN_EMAIL: completeEnvironment.INITIAL_SUPERADMIN_EMAIL,
      }),
    ).toThrow('emails must be different');
  });

  it('requires distinct initial passwords', () => {
    expect(() =>
      loadInitialAdminSetupConfig({
        ...completeEnvironment,
        INITIAL_ADMIN_PASSWORD: completeEnvironment.INITIAL_SUPERADMIN_PASSWORD,
      }),
    ).toThrow('passwords must be different');
  });

  it('accepts legacy bootstrap names from the existing .env', () => {
    const config = loadInitialAdminSetupConfig({
      ...completeEnvironment,
      INITIAL_SUPERADMIN_PASSWORD: undefined,
      INITIAL_SUPERADMIN_DISPLAY_NAME: undefined,
      INITIAL_ADMIN_PASSWORD: undefined,
      INITIAL_ADMIN_DISPLAY_NAME: undefined,
      INITIAL_SUPERADMIN_EMAIL: undefined,
      INITIAL_ADMIN_EMAIL: undefined,
      BOOTSTRAP_SUPERADMIN_EMAIL: 'legacy-owner@example.com',
      BOOTSTRAP_SUPERADMIN_INITIAL_PASSWORD: 'legacy-strong-password-1',
      BOOTSTRAP_SUPERADMIN_DISPLAY_NAME: 'Academy Owner',
      BOOTSTRAP_ADMIN_EMAIL: 'legacy-administrator@example.com',
      BOOTSTRAP_ADMIN_INITIAL_PASSWORD: 'legacy-strong-password-2',
      BOOTSTRAP_ADMIN_DISPLAY_NAME: 'Academy Admin',
    });

    expect(
      config.accounts.map(({ slot, email, displayName }) => ({
        slot,
        email,
        displayName,
      })),
    ).toEqual([
      {
        slot: 'SUPERADMIN',
        email: 'legacy-owner@example.com',
        displayName: 'Academy Owner',
      },
      {
        slot: 'ADMIN',
        email: 'legacy-administrator@example.com',
        displayName: 'Academy Admin',
      },
    ]);
  });

  it('rejects conflicting current and legacy variable names', () => {
    expect(() =>
      loadInitialAdminSetupConfig({
        ...completeEnvironment,
        BOOTSTRAP_ADMIN_INITIAL_PASSWORD: 'different-legacy-password',
      }),
    ).toThrow('INITIAL_ADMIN_PASSWORD conflicts');
  });

  it.each(['SUPERADMIN', 'ADMIN'] as const)(
    'accepts an 8-character %s initial password',
    (slot) => {
      const variable = `INITIAL_${slot}_PASSWORD`;
      const config = loadInitialAdminSetupConfig({
        ...completeEnvironment,
        [variable]: slot === 'SUPERADMIN' ? 'Eight001' : 'Eight002',
      });

      expect(
        config.accounts.find((account) => account.slot === slot)?.password,
      ).toHaveLength(8);
    },
  );

  it.each(['SUPERADMIN', 'ADMIN'] as const)(
    'rejects a 7-character %s initial password',
    (slot) => {
      const variable = `INITIAL_${slot}_PASSWORD`;

      expect(() =>
        loadInitialAdminSetupConfig({
          ...completeEnvironment,
          [variable]: slot === 'SUPERADMIN' ? 'Seven01' : 'Seven02',
        }),
      ).toThrow(`${variable} must contain 8 to 128 characters`);
    },
  );

  it.each(['SUPERADMIN', 'ADMIN'] as const)(
    'accepts a 128-character %s initial password',
    (slot) => {
      const variable = `INITIAL_${slot}_PASSWORD`;
      const password = (slot === 'SUPERADMIN' ? 'S' : 'A').repeat(128);
      const config = loadInitialAdminSetupConfig({
        ...completeEnvironment,
        [variable]: password,
      });

      expect(
        config.accounts.find((account) => account.slot === slot)?.password,
      ).toHaveLength(128);
    },
  );

  it.each(['SUPERADMIN', 'ADMIN'] as const)(
    'rejects a 129-character %s initial password',
    (slot) => {
      const variable = `INITIAL_${slot}_PASSWORD`;

      expect(() =>
        loadInitialAdminSetupConfig({
          ...completeEnvironment,
          [variable]: (slot === 'SUPERADMIN' ? 'S' : 'A').repeat(129),
        }),
      ).toThrow(`${variable} must contain 8 to 128 characters`);
    },
  );
});
