import { NextResponse, type NextRequest } from 'next/server';
import { getNestApiBaseUrl } from '@/lib/nest-api';

const DEMO_COOKIE_NAME = 'isharp_demo_vid';

export async function proxyDemoRequest(
  request: NextRequest,
  upstreamPath: string,
  methodOverride?: string,
) {
  const baseUrl = getNestApiBaseUrl();
  const method = methodOverride ?? request.method;
  const cookieToken = request.cookies.get(DEMO_COOKIE_NAME)?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cookieToken) {
    headers['x-demo-visitor-token'] = cookieToken;
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
    const response = NextResponse.json(data, {
      status: upstreamRes.status,
      headers: { 'Cache-Control': 'no-store, private' },
    });

    if (data && typeof data.visitorToken === 'string' && data.visitorToken) {
      response.cookies.set(DEMO_COOKIE_NAME, data.visitorToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 180 * 24 * 60 * 60,
      });
      delete data.visitorToken;
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Demo test service is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
