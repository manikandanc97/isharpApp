import type { AuthenticatedSession } from './auth-session';
import { hasRequiredRole } from './role-policy';

export const AUTH_REDIRECT_COOKIE = 'isharp_auth_redirect';
export const AUTH_NOTICE_COOKIE = 'isharp_auth_notice';
export const AUTH_REDIRECT_TTL_SECONDS = 300; // 5 minutes

export type AuthNoticeCode =
  | 'session_expired'
  | 'unauthorized'
  | 'oauth_cancelled'
  | 'oauth_invalid_callback'
  | 'oauth_exchange_failed';

const AUTH_QUERY_PARAMS_TO_STRIP = [
  'reason',
  'returnUrl',
  'oauth',
  'forgot',
  'token',
  'access_token',
  'refresh_token',
  'code',
] as const;

const PROTECTED_ROUTE_PREFIXES = [
  '/admin',
  '/dashboard',
  '/exam',
  '/plans',
  '/auth/pending',
  '/role-dashboard',
] as const;

const ALLOWED_RETURN_PREFIXES = [
  '/admin',
  '/dashboard',
  '/exam',
  '/plans',
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
}

export function isAdminRoute(pathname: string): boolean {
  return (
    matchesPrefix(pathname, '/admin') ||
    matchesPrefix(pathname, '/administration') ||
    matchesPrefix(pathname, '/dashboard/admin') ||
    matchesPrefix(pathname, '/dashboard/superadmin')
  );
}

export function getLoginPathForRoute(
  pathname: string,
): '/administration' | '/login' {
  return isAdminRoute(pathname) ? '/administration' : '/login';
}

export function getDefaultPostAuthDestination(
  session: AuthenticatedSession,
): string {
  if (session.roles.includes('SUPERADMIN')) return '/admin';
  if (session.roles.includes('ADMIN')) return '/admin';
  if (session.roles.includes('STUDENT')) {
    if (session.studentAccess?.hasLearningAccess === false) return '/plans';
    return '/dashboard/student';
  }
  return '/auth/pending';
}

/**
 * Validates and normalizes a return destination to prevent open redirects,
 * protocol-relative URLs, auth-loop targets, and sensitive query parameters.
 */
export function sanitizeReturnUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 512) return null;
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('\\') || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, 'https://isharp.internal');
  } catch {
    return null;
  }

  if (parsed.origin !== 'https://isharp.internal') return null;

  const { pathname } = parsed;
  const isAllowedPrefix = ALLOWED_RETURN_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
  if (!isAllowedPrefix) return null;

  for (const param of AUTH_QUERY_PARAMS_TO_STRIP) {
    parsed.searchParams.delete(param);
  }

  const search = parsed.searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function isRouteAuthorizedForSession(
  pathname: string,
  session: AuthenticatedSession,
): boolean {
  if (matchesPrefix(pathname, '/dashboard/superadmin')) {
    return hasRequiredRole(session.roles, 'SUPERADMIN');
  }

  if (
    matchesPrefix(pathname, '/admin') ||
    matchesPrefix(pathname, '/dashboard/admin')
  ) {
    return hasRequiredRole(session.roles, 'ADMIN');
  }

  if (
    matchesPrefix(pathname, '/dashboard/student') ||
    matchesPrefix(pathname, '/exam')
  ) {
    if (!hasRequiredRole(session.roles, 'STUDENT')) return false;
    return session.studentAccess?.hasLearningAccess !== false;
  }

  if (matchesPrefix(pathname, '/plans')) {
    return (
      session.roles.includes('STUDENT') &&
      session.studentAccess?.hasLearningAccess === false
    );
  }

  if (pathname === '/dashboard' || pathname === '/role-dashboard') {
    return session.roles.length > 0;
  }

  return false;
}

export function resolvePostAuthDestination(
  session: AuthenticatedSession,
  candidateReturnUrl?: string | null,
): string {
  const sanitized = sanitizeReturnUrl(candidateReturnUrl);
  if (sanitized) {
    const pathname = sanitized.split('?')[0] ?? sanitized;
    if (isRouteAuthorizedForSession(pathname, session)) {
      return sanitized;
    }
  }
  return getDefaultPostAuthDestination(session);
}

export function getAuthNoticeMessage(
  code: string | null | undefined,
  portal: 'admin' | 'student',
): { authError: string; sessionExpiredNotice: string } {
  if (!code) {
    return { authError: '', sessionExpiredNotice: '' };
  }

  if (code === 'session_expired') {
    return {
      authError: '',
      sessionExpiredNotice:
        portal === 'admin'
          ? 'Your administrative session has expired. Please sign in again with your credentials.'
          : 'Your session has expired. Please sign in again to continue.',
    };
  }

  if (code === 'unauthorized') {
    return {
      authError:
        portal === 'admin'
          ? 'Your session is not authorized for this administrative resource. Please sign in.'
          : 'Please sign in to access this page.',
      sessionExpiredNotice: '',
    };
  }

  if (code === 'oauth_cancelled') {
    return {
      authError: 'Google sign-in was cancelled. You can try again when ready.',
      sessionExpiredNotice: '',
    };
  }

  if (code === 'oauth_invalid_callback') {
    return {
      authError:
        'Google sign-in returned an invalid response. Please start again.',
      sessionExpiredNotice: '',
    };
  }

  if (code === 'oauth_exchange_failed') {
    return {
      authError: 'We could not complete Google sign-in. Please try again.',
      sessionExpiredNotice: '',
    };
  }

  return { authError: '', sessionExpiredNotice: '' };
}
