export const DEV_AUTH_COOKIE = 'isharp_dev_session';

export function resolveDummyAuthMode(environment: {
  NODE_ENV?: string;
  DUMMY_AUTH_ENABLED?: string;
}): boolean {
  const requested = environment.DUMMY_AUTH_ENABLED === 'true';
  const isDevelopment = environment.NODE_ENV === 'development';

  if (requested && !isDevelopment) {
    throw new Error(
      'DUMMY_AUTH_ENABLED may only be true when NODE_ENV=development',
    );
  }
  return requested && isDevelopment;
}

export function isDummyAuthEnabled(): boolean {
  return resolveDummyAuthMode(process.env);
}
