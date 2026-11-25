import type { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./config', () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock('../auth-redirect-cookies', () => ({
  setAuthRedirectCookies: vi.fn(),
}));

vi.mock('./session-config', () => ({
  authCookieOptions: { maxAge: 86400, sameSite: 'lax', secure: false, path: '/' },
  isSecureCookieContext: () => false,
}));

import {
  getAuthTokenCookies,
  isTransientSupabaseError,
  shouldRefreshSession,
} from './proxy';

function makeRequest(cookies: Array<{ name: string; value: string }>) {
  return {
    cookies: {
      getAll: () => cookies,
    },
  } as unknown as NextRequest;
}

describe('supabase proxy helpers', () => {
  it('excludes code-verifier cookies and sorts chunked auth tokens numerically', () => {
    const cookies = [
      { name: 'sb-proj-auth-token.10', value: 'ten' },
      { name: 'sb-proj-auth-token-code-verifier', value: 'verifier' },
      { name: 'sb-proj-auth-token.2', value: 'two' },
      { name: 'sb-proj-auth-token.0', value: 'zero' },
      { name: 'other-cookie', value: 'x' },
    ];

    const result = getAuthTokenCookies(cookies);
    expect(result.map((c) => c.name)).toEqual([
      'sb-proj-auth-token.0',
      'sb-proj-auth-token.2',
      'sb-proj-auth-token.10',
    ]);
  });

  it('does not force refresh when a fresh session cookie coexists with code-verifier', () => {
    const freshExpiresAt = Math.floor(Date.now() / 1000) + 3600;
    const payload = `base64-${Buffer.from(
      JSON.stringify({ access_token: 'abc', expires_at: freshExpiresAt }),
    ).toString('base64')}`;

    const request = makeRequest([
      { name: 'sb-proj-auth-token.0', value: payload.slice(0, 20) },
      { name: 'sb-proj-auth-token.1', value: payload.slice(20) },
      { name: 'sb-proj-auth-token-code-verifier', value: 'pkce-verifier' },
    ]);

    expect(shouldRefreshSession(request)).toBe(false);
  });

  it('requests refresh when session expires within 2 minutes', () => {
    const expiringSoon = Math.floor(Date.now() / 1000) + 60;
    const payload = JSON.stringify({
      access_token: 'abc',
      expires_at: expiringSoon,
    });

    const request = makeRequest([
      { name: 'sb-proj-auth-token', value: payload },
    ]);

    expect(shouldRefreshSession(request)).toBe(true);
  });

  it('classifies transient Supabase errors without treating 401/403 as transient', () => {
    expect(
      isTransientSupabaseError({ name: 'AuthRetryableFetchError', status: 0 }),
    ).toBe(true);
    expect(isTransientSupabaseError({ status: 429 })).toBe(true);
    expect(isTransientSupabaseError({ status: 503 })).toBe(true);
    expect(isTransientSupabaseError({ message: 'fetch failed' })).toBe(true);

    expect(isTransientSupabaseError({ status: 401, message: 'invalid JWT' })).toBe(
      false,
    );
    expect(isTransientSupabaseError({ status: 403, message: 'forbidden' })).toBe(
      false,
    );
    expect(isTransientSupabaseError(null)).toBe(false);
  });
});
