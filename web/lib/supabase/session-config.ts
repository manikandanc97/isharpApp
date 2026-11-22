export const AUTH_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export const authCookieOptions = {
  maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};
