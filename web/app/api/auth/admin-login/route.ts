import { ApiClientError } from '@/lib/api-client';
import type { AuthenticatedSession } from '@/lib/auth-session';
import { retryTransientAuth } from '@/lib/auth-verification';
import { getNestApiClient } from '@/lib/nest-api';
import { createClient } from '@/lib/supabase/server';

type LoginBody = { email: string; password: string };

function isLoginBody(body: unknown): body is LoginBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const keys = Object.keys(body);
  const input = body as Record<string, unknown>;
  return (
    keys.length === 2 &&
    keys.includes('email') &&
    keys.includes('password') &&
    typeof input.email === 'string' &&
    typeof input.password === 'string' &&
    input.email.length <= 320 &&
    input.password.length >= 6 &&
    input.password.length <= 128
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isLoginBody(body)) {
    return Response.json(
      { message: 'A valid email and password are required.' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const cleanEmail = body.email.trim().toLowerCase();
    let { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: body.password,
    });

    // Fallback: If failed and password had accidental whitespace (e.g., from copy-paste or autocorrect)
    if (error && body.password.trim() !== body.password) {
      const retryResult = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: body.password.trim(),
      });
      if (!retryResult.error && retryResult.data.session) {
        data = retryResult.data;
        error = null;
      }
    }

    if (error || !data.session?.access_token || !data.user) {
      console.warn(`[AdminLogin] Auth failed for ${cleanEmail}:`, error?.message, error?.status);

      const isRateLimited =
        error?.status === 429 ||
        error?.message?.toLowerCase().includes('rate limit') ||
        error?.message?.toLowerCase().includes('too many requests');

      const isNetworkError =
        error?.message?.toLowerCase().includes('fetch failed') ||
        error?.name === 'AuthRetryableFetchError' ||
        error?.status === 0;

      const message = isRateLimited
        ? 'Too many sign-in attempts. Please wait a minute and try again.'
        : isNetworkError
        ? 'Unable to reach the authentication service. Please check your internet connection or Supabase connectivity.'
        : 'Invalid email or password.';

      return Response.json(
        { message },
        {
          status: isRateLimited ? 429 : isNetworkError ? 503 : 401,
          headers: { 'Cache-Control': 'no-store, private' },
        },
      );
    }

    let session: AuthenticatedSession;
    try {
      session = await retryTransientAuth(() =>
        getNestApiClient({ timeoutMs: 10_000 }).request<AuthenticatedSession>(
          '/api/auth/me',
          { accessToken: data.session!.access_token, cache: 'no-store' },
        ),
      );
    } catch (nestErr) {
      console.error('[AdminLogin] NestApiClient request to /api/auth/me failed:', nestErr);
      const status =
        nestErr instanceof ApiClientError && [401, 403].includes(nestErr.status)
          ? nestErr.status
          : 503;
      return Response.json(
        {
          message:
            status === 401
              ? 'Your session could not be verified. Please sign in again.'
              : status === 403
                ? 'This account is not authorized.'
                : 'The authorization service is temporarily unavailable. Please try again.',
        },
        { status, headers: { 'Cache-Control': 'no-store, private' } },
      );
    }

    const isSuperadmin = session.roles.includes('SUPERADMIN');
    const isAdmin = session.roles.includes('ADMIN');
    if (!isAdmin && !isSuperadmin) {
      await supabase.auth.signOut();
      return Response.json(
        { message: 'This account does not have administrator access.' },
        { status: 403, headers: { 'Cache-Control': 'no-store, private' } },
      );
    }

    return Response.json(
      {
        destination: '/admin',
        role: isSuperadmin ? 'Super Administrator' : 'Academy Administrator',
        displayName: data.user.user_metadata?.display_name ?? 'Administrator',
      },
      { headers: { 'Cache-Control': 'no-store, private' } },
    );
  } catch {
    return Response.json(
      { message: 'The authentication service is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }
}
