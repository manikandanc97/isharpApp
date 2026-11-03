import type { AuthenticatedSession } from '@/lib/auth-session';
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email.trim().toLowerCase(),
      password: body.password,
    });
    if (error || !data.session?.access_token || !data.user) {
      return Response.json(
        { message: 'Invalid email or password.' },
        { status: 401, headers: { 'Cache-Control': 'no-store, private' } },
      );
    }

    let session: AuthenticatedSession;
    try {
      session = await getNestApiClient().request<AuthenticatedSession>(
        '/api/auth/me',
        { accessToken: data.session.access_token, cache: 'no-store' },
      );
    } catch {
      await supabase.auth.signOut();
      return Response.json(
        { message: 'The authorization service is temporarily unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store, private' } },
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
