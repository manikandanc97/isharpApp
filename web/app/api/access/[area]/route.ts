import type { NextRequest } from 'next/server';

import { ApiClientError } from '@/lib/api-client';
import { getNestApiClient } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';

const endpoints = {
  student: '/api/test/student',
  admin: '/api/test/admin',
  superadmin: '/api/test/superadmin',
} as const;

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/access/[area]'>,
) {
  const { area } = await context.params;
  const endpoint = endpoints[area as keyof typeof endpoints];
  if (!endpoint) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  const token = await getRequestAccessToken(request);
  if (!token) {
    return Response.json(
      { message: 'Authentication is required' },
      { status: 401 },
    );
  }

  try {
    const payload = await getNestApiClient().request(endpoint, {
      accessToken: token,
      cache: 'no-store',
    });
    return Response.json(payload, {
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
            ? 'API connection failed'
            : error instanceof Error
              ? error.message
              : 'Access denied',
      },
      { status, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
