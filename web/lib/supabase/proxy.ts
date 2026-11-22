import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { authCookieOptions } from '@/lib/supabase/session-config';

function isProtectedRoute(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/exam') ||
    pathname === '/role-dashboard'
  );
}

function getLoginRedirect(pathname: string, request: NextRequest, authCookies: ReturnType<NextRequest['cookies']['getAll']>) {
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');
  const loginPath = isAdminArea ? '/administration' : '/login';

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = loginPath;
  redirectUrl.search = '';
  redirectUrl.searchParams.set('reason', 'session_expired');
  redirectUrl.searchParams.set('returnUrl', pathname);

  const redirectResponse = NextResponse.redirect(redirectUrl);
  // Clear stale cookies on redirect
  authCookies.forEach((c) => {
    redirectResponse.cookies.delete(c.name);
  });
  return redirectResponse;
}

/**
 * Checks whether any Supabase auth session cookie is present and near expiration.
 * If no session exists, or if the current token is fresh (> 2 minutes remaining),
 * we bypass the blocking remote network call.
 */
function shouldRefreshSession(request: NextRequest): boolean {
  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'),
  );

  if (authCookies.length === 0) {
    return false;
  }

  try {
    authCookies.sort((a, b) => a.name.localeCompare(b.name));
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
  if (!isSupabaseConfigured()) return response;

  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedRoute(pathname);

  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'),
  );

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
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

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
