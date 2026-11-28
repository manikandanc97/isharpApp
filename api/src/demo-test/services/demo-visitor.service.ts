import { Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class DemoVisitorService {
  constructor(private readonly prisma: PrismaService) {}

  private getSigningSecret(): string {
    return (
      process.env.DEMO_VISITOR_SECRET ||
      process.env.SUPABASE_JWT_SECRET ||
      'isharp-demo-visitor-signing-key-2026'
    );
  }

  /**
   * Issues a tamper-evident guest visitor token (tokenId.hmac).
   */
  issueGuestToken(): string {
    const rawId = randomBytes(24).toString('hex');
    const sig = createHmac('sha256', this.getSigningSecret())
      .update(rawId)
      .digest('hex');
    return `${rawId}.${sig}`;
  }

  /**
   * Verifies a guest visitor token using constant-time comparison.
   */
  verifyGuestToken(token?: string | null): string | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [rawId, sig] = parts;
    if (!rawId || !sig || rawId.length < 16) return null;
    const expected = createHmac('sha256', this.getSigningSecret())
      .update(rawId)
      .digest('hex');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
    return rawId;
  }

  hashGuestId(rawId: string): string {
    return createHash('sha256').update(rawId).digest('hex');
  }

  /**
   * Resolves or creates a persistent DemoVisitor record.
   * If `userProfileId` is provided alongside a guest cookie, safely links them.
   */
  async resolveOrCreateVisitor(params: {
    guestToken?: string | null;
    userProfileId?: string | null;
  }): Promise<{ visitorId: string; guestToken: string; isNewCookie: boolean }> {
    const verifiedRaw = this.verifyGuestToken(params.guestToken);
    const guestToken = verifiedRaw ? params.guestToken! : this.issueGuestToken();
    const rawId = verifiedRaw ?? guestToken.split('.')[0];
    const tokenHash = this.hashGuestId(rawId);

    if (params.userProfileId) {
      const byUser = await this.prisma.demoVisitor.findUnique({
        where: { userProfileId: params.userProfileId },
      });
      if (byUser) {
        await this.prisma.demoVisitor.update({
          where: { id: byUser.id },
          data: { lastSeenAt: new Date() },
        });
        return { visitorId: byUser.id, guestToken, isNewCookie: !verifiedRaw };
      }
    }

    const byToken = await this.prisma.demoVisitor.findUnique({
      where: { guestTokenHash: tokenHash },
    });

    if (byToken) {
      if (params.userProfileId && !byToken.userProfileId) {
        await this.prisma.demoVisitor.update({
          where: { id: byToken.id },
          data: { userProfileId: params.userProfileId, lastSeenAt: new Date() },
        });
      } else {
        await this.prisma.demoVisitor.update({
          where: { id: byToken.id },
          data: { lastSeenAt: new Date() },
        });
      }
      return { visitorId: byToken.id, guestToken, isNewCookie: !verifiedRaw };
    }

    const created = await this.prisma.demoVisitor.create({
      data: {
        guestTokenHash: tokenHash,
        userProfileId: params.userProfileId ?? null,
      },
    });

    return { visitorId: created.id, guestToken, isNewCookie: true };
  }
}
