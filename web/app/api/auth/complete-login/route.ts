import { NextResponse, type NextRequest } from 'next/server';

import { ApiClientError } from '@/lib/api-client';
import { resolvePostAuthDestination } from '@/lib/auth-redirect';
import {
  clearAuthRedirectCookies,
  readAuthRedirectCookiesFromRequest,
} from '@/lib/auth-redirect-cookies';
import type { AuthenticatedSession } from '@/lib/auth-session';
import { retryTransientAuth } from '@/lib/auth-verification';
import { getNestApiClient } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';
import { isSecureCookieContext } from '@/lib/supabase/session-config';

export async function POST(request: NextRequest) {
  const accessToken = await getRequestAccessToken(request);
  if (!accessToken) {
    return NextResponse.json(
      {
        message: 'Session has expired. Please sign in again.',
        code: 'SESSION_EXPIRED',
      },
      {
        status: 401,
        headers: { 'Cache-Control': 'no-store, private' },
      },
    );
  }

  try {
    const session = await retryTransientAuth(() =>
      getNestApiClient({ timeoutMs: 20_000 }).request<AuthenticatedSession>(
        '/api/auth/me',
        { accessToken, cache: 'no-store' },
      ),
    );

    const { returnUrl } = readAuthRedirectCookiesFromRequest(request);
    const destination = resolvePostAuthDestination(session, returnUrl);

    const response = NextResponse.json(
      { session, destination },
      { headers: { 'Cache-Control': 'no-store, private' } },
    );

    clearAuthRedirectCookies(response, isSecureCookieContext(request));
    return response;
  } catch (error) {
    const status =
      error instanceof ApiClientError && [401, 403].includes(error.status)
        ? error.status
        : 503;
    return NextResponse.json(
      {
        message:
          status === 401
            ? 'Session has expired. Please sign in again.'
            : status === 403
              ? 'Session is not authorized'
              : 'Authentication service is unavailable',
        code: status === 401 ? 'SESSION_EXPIRED' : undefined,
      },
      { status, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
