import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProfileAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const targetId = request.params.id;
    if (
      typeof targetId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        targetId,
      )
    ) {
      throw new BadRequestException('A valid profile UUID is required');
    }
    if (request.user.roles.includes('SUPERADMIN')) {
      return true;
    }
    if (request.user.profileId === targetId) {
      return true;
    }
    if (!request.user.roles.includes('ADMIN')) {
      throw new ForbiddenException(
        'Students may only access their own private data',
      );
    }

    const target = await this.prisma.userProfile.findUnique({
      where: { id: targetId },
      select: { userRoles: { select: { role: { select: { name: true } } } } },
    });
    const targetRoles = target?.userRoles.map(({ role }) => role.name) ?? [];
    if (
      !targetRoles.includes('STUDENT') ||
      targetRoles.some((role) => role === 'ADMIN' || role === 'SUPERADMIN')
    ) {
      throw new ForbiddenException(
        'Only SUPERADMIN can manage administrator accounts',
      );
    }
    return true;
  }
}
