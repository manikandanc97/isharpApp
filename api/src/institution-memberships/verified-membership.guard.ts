import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import {
  MembershipVerificationStatus,
  StudentCategory,
  StudentPaymentStatus,
} from '../generated/prisma/client.js';
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
    if (!membership) throw new ForbiddenException('Student access record is required');
    if (membership.status !== MembershipVerificationStatus.VERIFIED) {
      throw new ForbiddenException('A verified student membership is required');
    }
    if (
      membership.studentCategory !== StudentCategory.INTERNAL &&
      membership.studentCategory !== StudentCategory.EXTERNAL
    ) {
      throw new ForbiddenException('Student access classification is required');
    }
    if (membership.studentCategory === StudentCategory.EXTERNAL) {
      const paidAndCurrent =
        membership.paymentStatus === StudentPaymentStatus.PAID &&
        (!membership.paidAccessUntil ||
          membership.paidAccessUntil > new Date());
      if (!paidAndCurrent)
        throw new ForbiddenException(
          'An active paid plan is required for external students',
        );
    }
    return true;
  }
}
