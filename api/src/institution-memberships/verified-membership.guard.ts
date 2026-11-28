import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { assertStudentLearningAccess } from '../auth/student-learning-access.policy.js';
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
      select: {
        status: true,
        studentCategory: true,
        paymentStatus: true,
        paidAccessUntil: true,
      },
    });
    assertStudentLearningAccess(membership);
    return true;
  }
}
