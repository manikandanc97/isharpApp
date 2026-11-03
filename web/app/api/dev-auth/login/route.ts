import { cookies } from 'next/headers';

import { ApiClientError } from '@/lib/api-client';
import { DEV_AUTH_COOKIE, isDummyAuthEnabled } from '@/lib/dev-auth-config';
import { getNestApiClient } from '@/lib/nest-api';

type DevLoginResponse = {
  token: string;
  expiresInSeconds: number;
  identity: {
    authUserId: string;
    email: string;
    profileId: null;
    roles: ('STUDENT' | 'ADMIN' | 'SUPERADMIN')[];
  };
};

export async function POST(request: Request) {
  if (!isDummyAuthEnabled()) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const session = await getNestApiClient().request<DevLoginResponse>(
      '/api/dev-auth/login',
      { method: 'POST', body, cache: 'no-store' },
    );
    const cookieStore = await cookies();
    cookieStore.set(DEV_AUTH_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      path: '/',
      maxAge: session.expiresInSeconds,
      priority: 'high',
    });

    return Response.json(
      { identity: session.identity },
      { headers: { 'Cache-Control': 'no-store, private' } },
    );
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : 503;
    return Response.json(
      {
        message:
          status === 0 || status >= 500
            ? 'Development authentication service is unavailable'
            : error instanceof Error
              ? error.message
              : 'Development login failed',
      },
      { status: status === 0 ? 503 : status },
    );
  }
}
