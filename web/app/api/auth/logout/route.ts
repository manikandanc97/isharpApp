import { NextResponse, type NextRequest } from 'next/server';

import { sanitizeReturnUrl } from '@/lib/auth-redirect';
import {
  clearAuthRedirectCookies,
  setAuthRedirectCookies,
} from '@/lib/auth-redirect-cookies';
import { getAuthTokenCookies } from '@/lib/supabase/proxy';
import { createClient } from '@/lib/supabase/server';
import { isSecureCookieContext } from '@/lib/supabase/session-config';

type LogoutPayload = {
  reason?: string;
  returnUrl?: string;
};

export async function POST(request: NextRequest) {
  let payload: LogoutPayload | null = null;
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      payload = raw as LogoutPayload;
    }
  } catch {
    payload = null;
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // An unavailable auth service should not trap the browser on a protected page.
  }

  const response = NextResponse.json(
    { signedOut: true },
    { headers: { 'Cache-Control': 'no-store, private' } },
  );

  // Ensure any Supabase auth token cookies (including chunked ones) are cleared
  const authCookies = getAuthTokenCookies(request.cookies.getAll());
  authCookies.forEach((c) => {
    response.cookies.delete(c.name);
  });

  const secure = isSecureCookieContext(request);
  const reason = payload?.reason;

  if (reason === 'session_expired' || reason === 'unauthorized') {
    setAuthRedirectCookies(response, {
      returnUrl: sanitizeReturnUrl(payload?.returnUrl),
      notice: reason,
      secure,
    });
  } else {
    // Manual logout or unspecified reason clears all temporary redirect/notice state
    clearAuthRedirectCookies(response, secure);
  }

  return response;
}
