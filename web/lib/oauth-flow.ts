import type { AuthenticatedSession } from '@/lib/auth-session';

export type OAuthCallbackState = 'cancelled' | 'invalid_callback' | 'exchange_failed';

export function buildOAuthCallbackUrl(origin: string) {
  return `${origin.replace(/\/$/, '')}/auth/callback`;
}

export function getOAuthCallbackState(searchParams: URLSearchParams): OAuthCallbackState | null {
  if (searchParams.get('error') === 'access_denied') return 'cancelled';
  if (searchParams.has('error')) return 'invalid_callback';
  if (!searchParams.get('code')) return 'invalid_callback';
  return null;
}

export function getPostAuthDestination(session: AuthenticatedSession) {
  if (session.roles.includes('SUPERADMIN')) return '/admin';
  if (session.roles.includes('ADMIN')) return '/admin';
  if (session.roles.includes('STUDENT')) return '/dashboard/student';
  return '/auth/pending';
}

export const oauthStatusMessages: Record<string, string> = {
  cancelled: 'Google sign-in was cancelled. You can try again when ready.',
  invalid_callback: 'Google sign-in returned an invalid response. Please start again.',
  exchange_failed: 'We could not complete Google sign-in. Please try again.',
};
