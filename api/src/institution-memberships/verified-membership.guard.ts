import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { MembershipVerificationStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class VerifiedMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPERADMIN')) {
      return true;
    }
    if (!user.profileId) {
      throw new ForbiddenException('An active user profile is required');
    }

    const membership = await this.prisma.institutionMembership.findUnique({
      where: { userId: user.profileId },
      select: { status: true },
    });
    if (membership?.status !== MembershipVerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'A verified I-Sharp institution membership is required',
      );
    }
    return true;
  }
}
