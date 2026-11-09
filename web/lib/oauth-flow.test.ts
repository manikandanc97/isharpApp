import { describe, expect, it } from 'vitest';

import { selectAccessToken } from './auth-token';
import {
  buildOAuthCallbackUrl,
  buildOAuthPopupCallbackUrl,
  getOAuthCallbackState,
  getPostAuthDestination,
} from './oauth-flow';

describe('Google OAuth flow', () => {
  it('initiates OAuth with the exact App Router callback URL', () => {
    expect(buildOAuthCallbackUrl('http://localhost:3000')).toBe(
      'http://localhost:3000/auth/callback',
    );
    expect(buildOAuthCallbackUrl('https://academy.example/')).toBe(
      'https://academy.example/auth/callback',
    );
    expect(buildOAuthPopupCallbackUrl('https://academy.example/')).toBe(
      'https://academy.example/auth/callback?popup=1',
    );
  });

  it('classifies cancellation and malformed callback errors without reflecting provider text', () => {
    expect(
      getOAuthCallbackState(
        new URLSearchParams('error=access_denied&error_description=sensitive'),
      ),
    ).toBe('cancelled');
    expect(getOAuthCallbackState(new URLSearchParams('error=server_error'))).toBe(
      'invalid_callback',
    );
    expect(getOAuthCallbackState(new URLSearchParams())).toBe('invalid_callback');
    expect(getOAuthCallbackState(new URLSearchParams('code=one-time-code'))).toBeNull();
  });

  it('routes only from trusted backend roles and sends unassigned users to pending access', () => {
    expect(
      getPostAuthDestination({ authUserId: 'u', profileId: null, roles: [] }),
    ).toBe('/auth/pending');
    expect(
      getPostAuthDestination({ authUserId: 'u', profileId: 'p', roles: ['STUDENT'] }),
    ).toBe('/dashboard/student');
    expect(
      getPostAuthDestination({
        authUserId: 'u',
        profileId: 'p',
        roles: ['STUDENT'],
        studentAccess: {
          category: 'EXTERNAL',
          paymentStatus: 'PENDING',
          paidAccessUntil: null,
          hasLearningAccess: false,
        },
      }),
    ).toBe('/plans');
    expect(
      getPostAuthDestination({
        authUserId: 'u',
        profileId: 'p',
        roles: ['STUDENT'],
        studentAccess: {
          category: 'INTERNAL',
          paymentStatus: 'NOT_REQUIRED',
          paidAccessUntil: null,
          hasLearningAccess: true,
        },
      }),
    ).toBe('/dashboard/student');
    expect(
      getPostAuthDestination({ authUserId: 'u', profileId: 'p', roles: ['ADMIN'] }),
    ).toBe('/admin');
  });
});

describe('server session token selection', () => {
  it('prefers explicit bearer authentication and supports Supabase sessions', () => {
    expect(
      selectAccessToken({
        authorization: 'Bearer request-token',
        supabaseToken: 'cookie-token',
      }),
    ).toBe('request-token');
    expect(selectAccessToken({ supabaseToken: 'cookie-token' })).toBe(
      'cookie-token',
    );
  });

  it('returns null for unauthenticated requests', () => {
    expect(selectAccessToken({})).toBeNull();
    expect(selectAccessToken({ authorization: 'Basic unsupported' })).toBeNull();
  });
});
