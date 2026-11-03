import type { NextRequest } from 'next/server';

import { ApiClientError } from '@/lib/api-client';
import type { AuthenticatedSession } from '@/lib/auth-session';
import { getNestApiClient } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';

// Route is inherently dynamic (reads Authorization header per request)

export async function GET(request: NextRequest) {
  const accessToken = await getRequestAccessToken(request);
  if (!accessToken) {
    return Response.json(
      { message: 'Bearer access token is required' },
      { status: 401 },
    );
  }

  try {
    const session = await getNestApiClient().request<AuthenticatedSession>(
      '/api/auth/me',
      { accessToken, cache: 'no-store' },
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
          status === 503
            ? 'Authentication service is unavailable'
            : 'Session is not authorized',
      },
      { status, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
