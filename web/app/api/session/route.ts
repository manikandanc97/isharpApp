import type { NextRequest } from 'next/server';

import { ApiClientError } from '@/lib/api-client';
import type { AuthenticatedSession } from '@/lib/auth-session';
import { retryTransientAuth } from '@/lib/auth-verification';
import { getNestApiClient } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';

// Route is inherently dynamic (reads Authorization header or cookie per request)

export async function GET(request: NextRequest) {
  const accessToken = await getRequestAccessToken(request);
  if (!accessToken) {
    return Response.json(
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
    return Response.json(session, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  } catch (error) {
    const status =
      error instanceof ApiClientError && [401, 403].includes(error.status)
        ? error.status
        : 503;
    return Response.json(
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
