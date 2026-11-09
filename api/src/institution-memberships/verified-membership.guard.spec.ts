import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { VerifiedMembershipGuard } from './verified-membership.guard.js';

function context(user: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

describe('VerifiedMembershipGuard', () => {
  it('rejects paid access when the membership is not verified', async () => {
    const prisma = {
      institutionMembership: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'PENDING',
          studentCategory: 'EXTERNAL',
          paymentStatus: 'PAID',
          paidAccessUntil: null,
        }),
      },
    };
    const guard = new VerifiedMembershipGuard(prisma as never);

    await expect(
      guard.canActivate(
        context({ profileId: 'profile-id', roles: ['STUDENT'] }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a verified internal student', async () => {
    const prisma = {
      institutionMembership: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'VERIFIED',
          studentCategory: 'INTERNAL',
          paymentStatus: 'NOT_REQUIRED',
          paidAccessUntil: null,
        }),
      },
    };
    const guard = new VerifiedMembershipGuard(prisma as never);

    await expect(
      guard.canActivate(
        context({ profileId: 'profile-id', roles: ['STUDENT'] }),
      ),
    ).resolves.toBe(true);
  });
});
