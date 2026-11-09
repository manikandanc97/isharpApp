import type { NextRequest } from 'next/server';

import { ApiClientError } from '@/lib/api-client';
import { getNestApiClient } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return Response.json(
      { message: 'Authentication is required' },
      { status: 401, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }

  try {
    const dashboard = await getNestApiClient().request(
      '/api/student/dashboard',
      { accessToken: token, cache: 'no-store' },
    );
    return Response.json(dashboard, {
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
            ? 'Student data service is unavailable'
            : error instanceof Error
              ? error.message
              : 'Student access denied',
      },
      { status, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
