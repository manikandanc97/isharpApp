import {
  assertNoExistingPrivilegedAssignments,
  INITIAL_ADMINS_SETUP_CONFIRMATION,
  linkPrivilegedAccounts,
  loadInitialAdminSetupConfig,
  loadInitialAdminEnvironment,
  SupabaseInitialAdminAuth,
  type InitialAdminSetupConfig,
  type SupabaseUser,
  verifyDatabaseConnectivity,
} from '../scripts/initial-admin-setup.js';

const completeEnvironment: NodeJS.ProcessEnv = {
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

describe('Supabase initial admin setup safety', () => {
  const config = loadInitialAdminSetupConfig(completeEnvironment);

  it('refuses to run if Supabase would auto-confirm email signup', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ mailer_autoconfirm: true }), {
        status: 200,
      }),
    );
    const auth = new SupabaseInitialAdminAuth(config, fetchMock);

    await expect(auth.assertSecureSignupSettings()).rejects.toThrow(
      'email confirmation must be enabled',
    );
  });

  it('refuses to promote an existing unmarked Auth account', () => {
    const auth = new SupabaseInitialAdminAuth(config, vi.fn());

    expect(() =>
      auth.resolveConfiguredUsers([
        {
          id: '00000000-0000-4000-8000-000000000001',
          email: config.accounts[0].email,
          email_confirmed_at: '2026-10-31T00:00:00Z',
          app_metadata: {},
        },
      ]),
    ).toThrow('not created by this setup');
  });

  it('recognizes only service-controlled slot markers idempotently', () => {
    const auth = new SupabaseInitialAdminAuth(config, vi.fn());
    const users = auth.resolveConfiguredUsers([
      markedUser(config, 'SUPERADMIN', 1),
      markedUser(config, 'ADMIN', 2),
    ]);

    expect(users.size).toBe(2);
    expect(users.get('SUPERADMIN')?.email).toBe(config.accounts[0].email);
    expect(users.get('ADMIN')?.email).toBe(config.accounts[1].email);
  });

  it('recognizes the previous protected metadata marker for safe reruns', () => {
    const auth = new SupabaseInitialAdminAuth(config, vi.fn());
    const legacyUser = markedUser(config, 'SUPERADMIN', 1);
    legacyUser.app_metadata = {
      i_sharp_privileged_bootstrap: { version: 1, slot: 'SUPERADMIN' },
    };

    const users = auth.resolveConfiguredUsers([legacyUser]);

    expect(users.get('SUPERADMIN')?.id).toBe(legacyUser.id);
  });

  it('rejects duplicate setup markers instead of choosing an account', () => {
    const auth = new SupabaseInitialAdminAuth(config, vi.fn());

    expect(() =>
      auth.resolveConfiguredUsers([
        markedUser(config, 'SUPERADMIN', 1),
        {
          ...markedUser(config, 'SUPERADMIN', 2),
          email: 'duplicate@example.com',
        },
      ]),
    ).toThrow('Multiple Auth users carry the SUPERADMIN marker');
  });

  it('reports insufficient service-role permissions without response secrets', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'sensitive upstream body' }), {
        status: 403,
      }),
    );
    const auth = new SupabaseInitialAdminAuth(config, fetchMock);

    await expect(auth.listUsers()).rejects.toThrow(
      'Insufficient Supabase permissions',
    );
  });

  it('accepts a direct Supabase signup user response and preserves metadata', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: '00000000-0000-4000-8000-000000000001',
            email_confirmed_at: null,
            app_metadata: { provider: 'email' },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    const auth = new SupabaseInitialAdminAuth(config, fetchMock);

    const user = await auth.createAccount(config.accounts[0]);

    expect(user.id).toBe('00000000-0000-4000-8000-000000000001');
    expect(user.app_metadata).toEqual({
      provider: 'email',
      i_sharp_initial_admin_setup: { version: 1, slot: 'SUPERADMIN' },
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      app_metadata: {
        provider: 'email',
        i_sharp_initial_admin_setup: { version: 1, slot: 'SUPERADMIN' },
      },
    });
  });

  it('removes a newly created user when protected metadata cannot be written', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: '00000000-0000-4000-8000-000000000001',
              email_confirmed_at: null,
            },
            session: null,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'forbidden' }), { status: 403 }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const auth = new SupabaseInitialAdminAuth(config, fetchMock);

    await expect(auth.createAccount(config.accounts[0])).rejects.toThrow(
      'could not be safely marked and was removed',
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

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

function markedUser(
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

function confirmedUsers(
  config: InitialAdminSetupConfig,
): Map<'SUPERADMIN' | 'ADMIN', SupabaseUser> {
  return new Map([
    ['SUPERADMIN', markedUser(config, 'SUPERADMIN', 1)],
    ['ADMIN', markedUser(config, 'ADMIN', 2)],
  ] as const);
}

function transactionPrisma(tx: object) {
  return {
    $transaction: vi.fn(
      async (callback: (transaction: object) => Promise<unknown>) =>
        callback(tx),
    ),
  };
}
