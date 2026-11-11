import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Checks whether any Supabase auth session cookie is present and near expiration.
 * If no session exists, or if the current token is fresh (> 2 minutes remaining),
 * we bypass the blocking remote network call to Supabase in Stockholm.
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
    // Handle standard or chunked Supabase SSR cookies
    authCookies.sort((a, b) => a.name.localeCompare(b.name));
    let raw = authCookies.map((c) => c.value).join('');
    if (raw.startsWith('base64-')) {
      raw = Buffer.from(raw.slice(7), 'base64').toString('utf-8');
    }
    const session = JSON.parse(raw);
    const expiresAt = session?.expires_at;
    if (typeof expiresAt === 'number') {
      const now = Math.floor(Date.now() / 1000);
      // Refresh only when token expires in less than 2 minutes (120 seconds)
      return expiresAt < now + 120;
    }
  } catch {
    // If parsing fails, safely proceed with standard refresh
    return true;
  }

  return true;
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response;

  // Performance optimization: Avoid blocking remote network requests on every
  // route navigation when no auth cookies exist or when session is still fresh.
  if (!shouldRefreshSession(request)) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  // Verifies claims and refreshes an expiring cookie session. Authorization
  // remains in NestJS, where roles are loaded from trusted database records.
  try {
    await supabase.auth.getClaims();
  } catch {
    // Network resilience: do not crash proxy if Supabase remote endpoint is temporarily unreachable
  }

  return response;
}
