import { createHash, randomBytes } from 'node:crypto';
import type { DemoVerificationMethod, Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

export function hashOtpSessionToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function upsertLeadAndCreateSessionInTx(
  tx: Prisma.TransactionClient,
  params: {
    normalizedPhone: string;
    verificationMethod: DemoVerificationMethod;
    explicitConsent: boolean;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
    now: Date;
  },
) {
  const {
    normalizedPhone,
    verificationMethod,
    explicitConsent,
    sessionTokenHash,
    sessionExpiresAt,
    now,
  } = params;

  const existingLead = await tx.demoLead.findUnique({
    where: { normalizedPhone },
  });

  let lead;
  if (existingLead) {
    lead = await tx.demoLead.update({
      where: { id: existingLead.id },
      data: {
        lastAccessAt: now,
        verificationMethod,
        isVerified: true,
        verifiedAt: now,
        ...(explicitConsent && !existingLead.marketingConsent
          ? { marketingConsent: true, consentTimestamp: now }
          : {}),
      },
    });
  } else {
    const guestTokenHash = createHash('sha256')
      .update(randomBytes(24).toString('hex'))
      .digest('hex');
    const visitor = await tx.demoVisitor.create({
      data: { guestTokenHash },
    });
    lead = await tx.demoLead.create({
      data: {
        normalizedPhone,
        visitorId: visitor.id,
        verificationMethod,
        isVerified: true,
        verifiedAt: now,
        firstAccessAt: now,
        lastAccessAt: now,
        totalAttempts: 0,
        marketingConsent: explicitConsent,
        consentTimestamp: explicitConsent ? now : null,
        followUpStatus: 'NEW',
      },
    });
  }

  const session = await tx.demoAccessSession.create({
    data: {
      leadId: lead.id,
      visitorId: lead.visitorId,
      tokenHash: sessionTokenHash,
      verificationMethod,
      expiresAt: sessionExpiresAt,
      lastUsedAt: now,
    },
  });

  return { lead, session };
}

export async function resolveDemoOtpSession(
  prisma: PrismaService,
  rawToken?: string | null,
) {
  if (
    !rawToken ||
    typeof rawToken !== 'string' ||
    rawToken.trim().length < 32
  ) {
    return null;
  }

  const tokenHash = hashOtpSessionToken(rawToken.trim());
  const now = new Date();

  const session = await prisma.demoAccessSession.findUnique({
    where: { tokenHash },
    include: {
      lead: {
        select: {
          id: true,
          visitorId: true,
          verificationMethod: true,
          marketingConsent: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= now) {
    return null;
  }

  await prisma.demoAccessSession
    .update({
      where: { id: session.id },
      data: { lastUsedAt: now },
    })
    .catch(() => {});

  return {
    sessionId: session.id,
    leadId: session.lead.id,
    visitorId: session.lead.visitorId,
    verificationMethod: session.lead.verificationMethod,
    marketingConsent: session.lead.marketingConsent,
    expiresAt: session.expiresAt.toISOString(),
  };
}
