import { NextResponse, type NextRequest } from 'next/server';
import { getNestApiBaseUrl } from '@/lib/nest-api';

const DEMO_SESSION_COOKIE = 'isharp_demo_session';

export async function proxyDemoRequest(
  request: NextRequest,
  upstreamPath: string,
  methodOverride?: string,
) {
  const baseUrl = getNestApiBaseUrl();
  const method = methodOverride ?? request.method;
  const sessionToken = request.cookies.get(DEMO_SESSION_COOKIE)?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionToken) {
    headers['x-demo-session-token'] = sessionToken;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    headers['x-forwarded-for'] = forwardedFor;
  }

  let body: string | undefined;
  if (['POST', 'PATCH', 'PUT'].includes(method)) {
    const raw = await request.text().catch(() => '');
    body = raw || '{}';
  }

  try {
    const upstreamRes = await fetch(`${baseUrl}${upstreamPath}`, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const data = await upstreamRes.json().catch(() => ({}));

    let newSessionToken: string | null = null;
    let sessionExpiresAt: string | null = null;
    if (data && typeof data.sessionToken === 'string' && data.sessionToken) {
      newSessionToken = data.sessionToken;
      sessionExpiresAt =
        typeof data.expiresAt === 'string' ? data.expiresAt : null;
      delete data.sessionToken;
    }

    const response = NextResponse.json(data, {
      status: upstreamRes.status,
      headers: { 'Cache-Control': 'no-store, private' },
    });

    if (newSessionToken) {
      const maxAgeSeconds = sessionExpiresAt
        ? Math.max(
            60,
            Math.floor((new Date(sessionExpiresAt).getTime() - Date.now()) / 1000),
          )
        : 4 * 60 * 60;
      response.cookies.set(DEMO_SESSION_COOKIE, newSessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: maxAgeSeconds,
      });
    } else if (data && data.cleared === true) {
      response.cookies.delete(DEMO_SESSION_COOKIE);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Demo test service is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
