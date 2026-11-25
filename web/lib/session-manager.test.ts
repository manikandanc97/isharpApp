import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('handleSessionExpired', () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  });

  it('redirects to clean /administration URL and sends returnUrl via POST /api/auth/logout', async () => {
    const replaceMock = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    globalThis.window = {
      location: {
        pathname: '/admin/courses',
        origin: 'https://isharp.in',
        search: '',
        replace: replaceMock,
      },
      localStorage: {
        removeItem: vi.fn(),
      },
      sessionStorage: {
        clear: vi.fn(),
      },
    } as unknown as Window & typeof globalThis;

    vi.resetModules();
    const { handleSessionExpired } = await import('./session-manager');

    await handleSessionExpired();
    expect(replaceMock).toHaveBeenCalledWith(
      'https://isharp.in/administration',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reason: 'session_expired',
          returnUrl: '/admin/courses',
        }),
      }),
    );
  });

  it('redirects to clean /login URL for student routes and preserves returnUrl in logout payload', async () => {
    const replaceMock = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    globalThis.window = {
      location: {
        pathname: '/dashboard/student',
        origin: 'https://isharp.in',
        search: '',
        replace: replaceMock,
      },
      localStorage: {
        removeItem: vi.fn(),
      },
      sessionStorage: {
        clear: vi.fn(),
      },
    } as unknown as Window & typeof globalThis;

    vi.resetModules();
    const { handleSessionExpired } = await import('./session-manager');

    await handleSessionExpired();
    expect(replaceMock).toHaveBeenCalledWith('https://isharp.in/login');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reason: 'session_expired',
          returnUrl: '/dashboard/student',
        }),
      }),
    );
  });

  it('clears returnUrl on manual logged_out and redirects to clean URL', async () => {
    const replaceMock = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    globalThis.window = {
      location: {
        pathname: '/dashboard/superadmin',
        origin: 'https://isharp.in',
        search: '',
        replace: replaceMock,
      },
      localStorage: {
        removeItem: vi.fn(),
      },
      sessionStorage: {
        clear: vi.fn(),
      },
    } as unknown as Window & typeof globalThis;

    vi.resetModules();
    const { handleSessionExpired } = await import('./session-manager');

    await handleSessionExpired({ reason: 'logged_out' });
    expect(replaceMock).toHaveBeenCalledWith(
      'https://isharp.in/administration',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reason: 'logged_out',
        }),
      }),
    );
  });

  it('does nothing in non-browser environments', async () => {
    delete (globalThis as unknown as { window?: unknown }).window;
    vi.resetModules();
    const { handleSessionExpired } = await import('./session-manager');
    await expect(handleSessionExpired()).resolves.toBeUndefined();
  });
});
