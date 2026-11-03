import { ConfigService } from '@nestjs/config';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DevAuthService } from './dev-auth.service.js';

function createService(
  environment: Record<string, string> = {
    NODE_ENV: 'development',
    DUMMY_AUTH_ENABLED: 'true',
    DUMMY_AUTH_PASSWORD: 'test-password-123',
  },
) {
  return new DevAuthService(new ConfigService(environment));
}

describe('DevAuthService', () => {
  it('rejects startup when dummy auth is enabled outside development', () => {
    expect(() =>
      createService({ NODE_ENV: 'production', DUMMY_AUTH_ENABLED: 'true' }),
    ).toThrow('may only be true when NODE_ENV=development');
  });

  it('is disabled by default and exposes no login capability', () => {
    const service = createService({ NODE_ENV: 'development' });
    expect(service.isEnabled()).toBe(false);
    expect(() => service.login('student', 'anything')).toThrow(
      NotFoundException,
    );
  });

  it('rejects startup without a sufficiently strong configured password', () => {
    expect(() =>
      createService({
        NODE_ENV: 'development',
        DUMMY_AUTH_ENABLED: 'true',
        DUMMY_AUTH_PASSWORD: 'short',
      }),
    ).toThrow('at least 12 characters');
  });

  it('rejects an incorrect password', () => {
    const service = createService();
    expect(() => service.login('admin', 'incorrect-password')).toThrow(
      UnauthorizedException,
    );
  });

  it('issues unpredictable opaque sessions for fixed server identities', () => {
    const service = createService();
    const first = service.login('admin', 'test-password-123');
    const second = service.login('admin', 'test-password-123');

    expect(first.token).not.toBe(second.token);
    expect(first.token).toMatch(/^isharp_dev_[A-Za-z0-9_-]{43}$/);
    expect(service.authenticate(first.token)).toEqual({
      authUserId: '10000000-0000-4000-8000-000000000002',
      profileId: null,
      roles: ['ADMIN'],
    });
  });

  it('rejects a fabricated development token', () => {
    const service = createService();
    expect(() => service.authenticate('isharp_dev_fabricated')).toThrow(
      UnauthorizedException,
    );
  });
});
