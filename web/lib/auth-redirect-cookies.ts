import 'server-only';

import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_NOTICE_COOKIE,
  AUTH_REDIRECT_COOKIE,
  sanitizeReturnUrl,
  type AuthNoticeCode,
} from '@/lib/auth-redirect';
import { getTemporaryAuthCookieOptions } from '@/lib/supabase/session-config';

export function setAuthRedirectCookies(
  response: NextResponse,
  options: {
    returnUrl?: string | null;
    notice?: AuthNoticeCode | null;
    secure: boolean;
  },
) {
  const cookieOpts = getTemporaryAuthCookieOptions(options.secure);
  const sanitized = sanitizeReturnUrl(options.returnUrl);

  if (sanitized) {
    response.cookies.set(AUTH_REDIRECT_COOKIE, sanitized, cookieOpts);
  }

  if (options.notice) {
    response.cookies.set(AUTH_NOTICE_COOKIE, options.notice, cookieOpts);
  }
}

export function clearAuthRedirectCookies(
  response: NextResponse,
  secure: boolean,
) {
  const clearOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 0,
  };
  response.cookies.set(AUTH_REDIRECT_COOKIE, '', clearOpts);
  response.cookies.set(AUTH_NOTICE_COOKIE, '', clearOpts);
}

export function clearAuthNoticeCookie(
  response: NextResponse,
  secure: boolean,
) {
  response.cookies.set(AUTH_NOTICE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 0,
  });
}

export function readAuthRedirectCookiesFromRequest(request: NextRequest): {
  returnUrl: string | null;
  notice: string | null;
} {
  return {
    returnUrl: sanitizeReturnUrl(
      request.cookies.get(AUTH_REDIRECT_COOKIE)?.value,
    ),
    notice: request.cookies.get(AUTH_NOTICE_COOKIE)?.value ?? null,
  };
}

export async function readAuthRedirectCookiesFromStore(): Promise<{
  returnUrl: string | null;
  notice: string | null;
}> {
  try {
    const store = await cookies();
    return {
      returnUrl: sanitizeReturnUrl(store.get(AUTH_REDIRECT_COOKIE)?.value),
      notice: store.get(AUTH_NOTICE_COOKIE)?.value ?? null,
    };
  } catch {
    return { returnUrl: null, notice: null };
  }
}
