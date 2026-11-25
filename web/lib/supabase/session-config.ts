import { AUTH_REDIRECT_TTL_SECONDS } from '../auth-redirect';

export const AUTH_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export const authCookieOptions = {
  maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function isSecureCookieContext(request?: {
  nextUrl?: { protocol?: string };
  headers?: Pick<Headers, 'get'>;
  url?: string;
}): boolean {
  if (!request) {
    return process.env.NODE_ENV === 'production';
  }

  const forwardedProto = request.headers
    ?.get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto) {
    return forwardedProto === 'https';
  }

  if (request.nextUrl?.protocol) {
    return request.nextUrl.protocol === 'https:';
  }

  if (request.url) {
    try {
      return new URL(request.url).protocol === 'https:';
    } catch {
      // Fallback to NODE_ENV
    }
  }

  return process.env.NODE_ENV === 'production';
}

export function getTemporaryAuthCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: AUTH_REDIRECT_TTL_SECONDS,
  };
}
