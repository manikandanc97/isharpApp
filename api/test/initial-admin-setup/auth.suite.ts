import { describe, expect, it, vi } from 'vitest';
import {
  loadInitialAdminSetupConfig,
  SupabaseInitialAdminAuth,
} from '../../scripts/initial-admin-setup.js';
import { completeEnvironment, markedUser } from './fixtures.js';

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
