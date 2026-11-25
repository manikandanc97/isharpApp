import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import {
  getLoginPathForRoute,
  isProtectedRoute,
} from '../auth-redirect';
import { setAuthRedirectCookies } from '../auth-redirect-cookies';
import { isSupabaseConfigured } from './config';
import {
  authCookieOptions,
  isSecureCookieContext,
} from './session-config';

function applyProtectedNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private',
  );
  response.headers.set('Pragma', 'no-cache');
  return response;
}

function getLoginRedirect(
  pathname: string,
  request: NextRequest,
  authCookies: ReturnType<NextRequest['cookies']['getAll']>,
) {
  const loginPath = getLoginPathForRoute(pathname);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = loginPath;
  redirectUrl.search = '';

  const redirectResponse = NextResponse.redirect(redirectUrl);
  const requestedTarget = `${pathname}${request.nextUrl.search}`;

  setAuthRedirectCookies(redirectResponse, {
    returnUrl: requestedTarget,
    notice: 'session_expired',
    secure: isSecureCookieContext(request),
  });

  // Clear stale Supabase auth cookies on redirect
  authCookies.forEach((c) => {
    redirectResponse.cookies.delete(c.name);
  });

  return applyProtectedNoStoreHeaders(redirectResponse);
}

const AUTH_TOKEN_COOKIE_PATTERN = /^sb-.*-auth-token(?:\.(\d+))?$/;

export function getAuthTokenCookies(
  cookies: ReturnType<NextRequest['cookies']['getAll']>,
) {
  return cookies
    .filter((c) => AUTH_TOKEN_COOKIE_PATTERN.test(c.name))
    .sort((a, b) => {
      const aMatch = a.name.match(AUTH_TOKEN_COOKIE_PATTERN);
      const bMatch = b.name.match(AUTH_TOKEN_COOKIE_PATTERN);
      const aIndex = aMatch?.[1] ? Number(aMatch[1]) : -1;
      const bIndex = bMatch?.[1] ? Number(bMatch[1]) : -1;
      return aIndex - bIndex;
    });
}

export function isTransientSupabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: unknown; status?: unknown; message?: unknown };
  if (err.name === 'AuthRetryableFetchError') return true;
  if (typeof err.status === 'number') {
    if (
      err.status === 0 ||
      err.status === 408 ||
      err.status === 429 ||
      err.status >= 500
    ) {
      return true;
    }
  }
  if (typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    if (
      msg.includes('fetch failed') ||
      msg.includes('network') ||
      msg.includes('timeout')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether any Supabase auth session cookie is present and near expiration.
 * If no session exists, or if the current token is fresh (> 2 minutes remaining),
 * we bypass the blocking remote network call.
 */
export function shouldRefreshSession(request: NextRequest): boolean {
  const authCookies = getAuthTokenCookies(request.cookies.getAll());

  if (authCookies.length === 0) {
    return false;
  }

  try {
    let raw = authCookies.map((c) => c.value).join('');
    if (raw.startsWith('base64-')) {
      raw = Buffer.from(raw.slice(7), 'base64').toString('utf-8');
    }
    const session = JSON.parse(raw);
    const expiresAt = session?.expires_at;
    if (typeof expiresAt === 'number') {
      const now = Math.floor(Date.now() / 1000);
      return expiresAt < now + 120;
    }
  } catch {
    return true;
  }

  return true;
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedRoute(pathname);

  if (isProtected) {
    applyProtectedNoStoreHeaders(response);
  }

  if (!isSupabaseConfigured()) return response;

  const authCookies = getAuthTokenCookies(request.cookies.getAll());

  // If visiting a protected page without any auth session cookies, redirect to login immediately
  if (isProtected && authCookies.length === 0) {
    return getLoginRedirect(pathname, request, authCookies);
  }

  // A fresh signed session is already locally verifiable. Avoid making every
  // protected navigation depend on a remote auth request; refresh only near
  // the access-token expiry.
  if (!shouldRefreshSession(request)) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          if (isProtected) {
            applyProtectedNoStoreHeaders(response);
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  try {
    // Allow Supabase SSR to refresh an expiring access token before verifying user
    await supabase.auth.getSession();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error && isTransientSupabaseError(error)) {
      return response;
    }

    // If accessing a protected route and the user token is expired or invalid
    if (isProtected && (error || !user)) {
      return getLoginRedirect(pathname, request, authCookies);
    }
  } catch {
    // A temporary Supabase/network failure must not destroy an otherwise
    // valid session. API authorization will still reject an invalid token.
    return response;
  }

  return response;
}
