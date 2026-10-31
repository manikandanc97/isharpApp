import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedRequest } from './auth-user.js';
import { isRoleName } from './role.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenVerifier: SupabaseTokenVerifier,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      throw new UnauthorizedException('Bearer access token is required');
    }

    const payload = await this.tokenVerifier.verify(match[1]);
    const profile = await this.prisma.userProfile.findUnique({
      where: { authUserId: payload.sub },
      select: {
        id: true,
        isActive: true,
        userRoles: { select: { role: { select: { name: true } } } },
      },
    });

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
