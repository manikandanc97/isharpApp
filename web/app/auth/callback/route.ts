import { NextResponse, type NextRequest } from 'next/server';

import type { AuthenticatedSession } from '@/lib/auth-session';
import { getNestApiClient } from '@/lib/nest-api';
import { getOAuthCallbackState, getPostAuthDestination } from '@/lib/oauth-flow';
import { createClient } from '@/lib/supabase/server';

function loginErrorRedirect(request: NextRequest, state: string) {
  const url = new URL('/login', request.url);
  url.searchParams.set('oauth', state);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const state = getOAuthCallbackState(request.nextUrl.searchParams);
  if (state) return loginErrorRedirect(request, state);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      request.nextUrl.searchParams.get('code')!,
    );
    if (error || !data.session?.access_token) {
      return loginErrorRedirect(request, 'exchange_failed');
    }

    const session = await getNestApiClient().request<AuthenticatedSession>(
      '/api/auth/me',
      { accessToken: data.session.access_token, cache: 'no-store' },
    );
    return NextResponse.redirect(
      new URL(getPostAuthDestination(session), request.url),
    );
  } catch {
    return loginErrorRedirect(request, 'exchange_failed');
  }
}
