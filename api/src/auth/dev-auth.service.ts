import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from './auth-user.js';
import type { RoleName } from './role.js';

export const DEV_AUTH_IDENTITIES = {
  student: {
    authUserId: '10000000-0000-4000-8000-000000000001',
    email: 'student@isharpacademy.local',
    roles: ['STUDENT'],
  },
  admin: {
    authUserId: '10000000-0000-4000-8000-000000000002',
    email: 'admin@isharpacademy.local',
    roles: ['ADMIN'],
  },
  superadmin: {
    authUserId: '10000000-0000-4000-8000-000000000003',
    email: 'superadmin@isharpacademy.local',
    roles: ['SUPERADMIN'],
  },
} as const satisfies Record<
  string,
  { authUserId: string; email: string; roles: readonly RoleName[] }
>;

export type DevIdentityName = keyof typeof DEV_AUTH_IDENTITIES;

type DevSession = {
  user: AuthUser;
  email: string;
  expiresAt: number;
};

const TOKEN_PREFIX = 'isharp_dev_';
const SESSION_TTL_MS = 60 * 60 * 1_000;

@Injectable()
export class DevAuthService {
  private readonly enabled: boolean;
  private readonly passwordDigest?: Buffer;
  private readonly sessions = new Map<string, DevSession>();

  constructor(config: ConfigService) {
    const requested = config.get<string>('DUMMY_AUTH_ENABLED') === 'true';
    const isDevelopment = config.get<string>('NODE_ENV') === 'development';

    if (requested && !isDevelopment) {
      throw new Error(
        'DUMMY_AUTH_ENABLED may only be true when NODE_ENV=development',
      );
    }
    this.enabled = requested && isDevelopment;

    if (this.enabled) {
      const password = config.get<string>('DUMMY_AUTH_PASSWORD');
      if (!password || password.length < 12) {
        throw new Error(
          'DUMMY_AUTH_PASSWORD must contain at least 12 characters when dummy auth is enabled',
        );
      }
      this.passwordDigest = digestPassword(password);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  login(identityName: DevIdentityName, password: string) {
    this.assertEnabled();
    const suppliedDigest = digestPassword(password);
    if (
      !this.passwordDigest ||
      !timingSafeEqual(this.passwordDigest, suppliedDigest)
    ) {
      throw new UnauthorizedException('Invalid development credentials');
    }
    const identity = DEV_AUTH_IDENTITIES[identityName];
    const token = `${TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const user: AuthUser = {
      authUserId: identity.authUserId,
      profileId: null,
      roles: [...identity.roles],
    };

    this.sessions.set(token, { user, email: identity.email, expiresAt });
    return {
      token,
      expiresInSeconds: SESSION_TTL_MS / 1_000,
      identity: { email: identity.email, ...user },
    };
  }

  authenticate(token: string): AuthUser | null {
    if (!token.startsWith(TOKEN_PREFIX)) return null;
    this.assertEnabled();

    const session = this.sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      throw new UnauthorizedException('Invalid or expired development session');
    }
    return session.user;
  }

  logout(token: string): void {
    this.assertEnabled();
    if (!token.startsWith(TOKEN_PREFIX) || !this.sessions.delete(token)) {
      throw new UnauthorizedException('Invalid development session');
    }
  }

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new NotFoundException();
    }
  }
}

function digestPassword(password: string): Buffer {
  return createHash('sha256').update(password, 'utf8').digest();
}
