import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('handleSessionExpired', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('determines the correct admin destination when path starts with /admin', async () => {
    const replaceMock = vi.fn();
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
      'https://isharp.in/administration?reason=session_expired&returnUrl=%2Fadmin%2Fcourses',
    );
  });

  it('determines the correct student destination when path starts with /dashboard/student', async () => {
    const replaceMock = vi.fn();
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
    expect(replaceMock).toHaveBeenCalledWith(
      'https://isharp.in/login?reason=session_expired&returnUrl=%2Fdashboard%2Fstudent',
    );
  });

  it('does nothing in non-browser environments', async () => {
    delete (globalThis as unknown as { window?: unknown }).window;
    vi.resetModules();
    const { handleSessionExpired } = await import('./session-manager');
    await expect(handleSessionExpired()).resolves.toBeUndefined();
  });
});
