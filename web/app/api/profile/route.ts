import type { NextRequest } from 'next/server';

import { ApiClientError } from '@/lib/api-client';
import { getNestApiClient } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';

async function proxy(request: NextRequest) {
  const accessToken = await getRequestAccessToken(request);
  if (!accessToken) {
    return Response.json(
      { message: 'Authentication is required' },
      { status: 401 },
    );
  }

  const body = request.method === 'PATCH'
    ? await request.json().catch(() => undefined)
    : undefined;

  try {
    const profile = await getNestApiClient().request('/api/profiles/me', {
      method: request.method,
      accessToken,
      body,
      cache: 'no-store',
    });
    return Response.json(profile, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 503;
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : 'Profile service is unavailable',
      },
      { status, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}

export const GET = proxy;
export const PATCH = proxy;
