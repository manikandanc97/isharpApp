import type { NextRequest } from 'next/server';

import { ApiClientError } from '@/lib/api-client';
import { getNestApiClient } from '@/lib/nest-api';
import { getRequestAccessToken } from '@/lib/server-access-token';

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const token = await getRequestAccessToken(request);
  if (!token) {
    return Response.json({ message: 'Authentication is required' }, { status: 401 });
  }

  const search = request.nextUrl.search;
  const body = ['POST', 'PATCH', 'PUT'].includes(request.method)
    ? await request.json().catch(() => undefined)
    : undefined;

  try {
    const payload = await getNestApiClient().request(
      `/api/admin/${path.map(encodeURIComponent).join('/')}${search}`,
      {
        method: request.method,
        accessToken: token,
        body,
        cache: 'no-store',
      },
    );
    return Response.json(payload, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 503;
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : 'Admin service is unavailable',
      },
      { status, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
