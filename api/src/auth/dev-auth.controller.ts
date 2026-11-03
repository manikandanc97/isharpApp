import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import {
  DEV_AUTH_IDENTITIES,
  DevAuthService,
  type DevIdentityName,
} from './dev-auth.service.js';

@Controller('api/dev-auth')
export class DevAuthController {
  constructor(private readonly devAuth: DevAuthService) {}

  @Post('login')
  login(@Body() body: unknown) {
    if (!isLoginBody(body)) {
      throw new BadRequestException(
        'Request must contain exactly one supported development identity and password',
      );
    }
    return this.devAuth.login(body.identity, body.password);
  }

  @Post('logout')
  logout(@Headers('authorization') authorization?: string) {
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      throw new BadRequestException('Bearer development session is required');
    }
    this.devAuth.logout(match[1]);
    return { signedOut: true };
  }
}

function isLoginBody(
  body: unknown,
): body is { identity: DevIdentityName; password: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const keys = Object.keys(body);
  if (
    keys.length !== 2 ||
    !keys.includes('identity') ||
    !keys.includes('password')
  ) {
    return false;
  }
  const { identity, password } = body as {
    identity?: unknown;
    password?: unknown;
  };
  return (
    typeof identity === 'string' &&
    identity in DEV_AUTH_IDENTITIES &&
    typeof password === 'string' &&
    password.length > 0 &&
    password.length <= 256
  );
}
