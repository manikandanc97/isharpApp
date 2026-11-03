import { describe, expect, it } from 'vitest';

import { resolveDummyAuthMode } from './dev-auth-config';

describe('development authentication configuration', () => {
  it('is disabled by default', () => {
    expect(resolveDummyAuthMode({ NODE_ENV: 'development' })).toBe(false);
  });

  it('is enabled only when explicitly requested in development', () => {
    expect(
      resolveDummyAuthMode({
        NODE_ENV: 'development',
        DUMMY_AUTH_ENABLED: 'true',
      }),
    ).toBe(true);
  });

  it('rejects production build or runtime enablement', () => {
    expect(() =>
      resolveDummyAuthMode({
        NODE_ENV: 'production',
        DUMMY_AUTH_ENABLED: 'true',
      }),
    ).toThrow('may only be true when NODE_ENV=development');
  });
});
