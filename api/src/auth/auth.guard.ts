import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedRequest } from './auth-user.js';
import { DevAuthService } from './dev-auth.service.js';
import { isRoleName } from './role.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';
import { StudentAccessResolver } from './student-access-resolver.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenVerifier: SupabaseTokenVerifier,
    private readonly devAuth: DevAuthService,
    private readonly studentAccess: StudentAccessResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      throw new UnauthorizedException('Bearer access token is required');
    }

    const devUser = this.devAuth.authenticate(match[1]);
    if (devUser) {
      (request as AuthenticatedRequest).user = devUser;
      return true;
    }

    const payload = await this.tokenVerifier.verify(match[1]);
    const profile = await this.studentAccess.resolve(payload.sub!, payload);

    if (profile && !profile.isActive) {
      throw new ForbiddenException('User profile is inactive');
    }

    (request as AuthenticatedRequest).user = {
      authUserId: payload.sub!,
      profileId: profile?.id ?? null,
      roles:
        profile?.userRoles.map(({ role }) => role.name).filter(isRoleName) ??
        [],
    };
    return true;
  }
}
