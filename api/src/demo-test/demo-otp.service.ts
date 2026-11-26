import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { DemoVerificationMethod } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  MockDemoOtpProvider,
  resolveDemoOtpRuntimeConfig,
  type DemoOtpDeliveryProvider,
} from './demo-otp-provider.js';
import { normalizeIndianMobile } from './demo-test-phone.helper.js';
import { SlidingWindowRateLimiter } from './demo-test-rate-limit.helper.js';

export interface RequestOtpInput {
  phone: string;
  marketingConsent?: boolean;
  requestIp?: string;
}

export interface VerifyOtpInput {
  challengeId: string;
  otp: string;
  marketingConsent?: boolean;
  requestIp?: string;
}

export interface ResendOtpInput {
  challengeId: string;
  requestIp?: string;
}

@Injectable()
export class DemoOtpService {
  private readonly requestIpLimiter = new SlidingWindowRateLimiter(15, 15 * 60_000);
  private readonly requestPhoneLimiter = new SlidingWindowRateLimiter(5, 15 * 60_000);
  private readonly verifyLimiter = new SlidingWindowRateLimiter(15, 15 * 60_000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockProvider: MockDemoOtpProvider,
  ) {}

  private getSigningSecret(): string {
    return (
      process.env.DEMO_OTP_SECRET ||
      process.env.DEMO_VISITOR_SECRET ||
      process.env.SUPABASE_JWT_SECRET ||
      'isharp-demo-otp-signing-key-2026'
    );
  }

  private getActiveProvider(): DemoOtpDeliveryProvider {
    const config = resolveDemoOtpRuntimeConfig();
    if (!config.isAvailable) {
      throw new ServiceUnavailableException(
        'Demo Test OTP verification is currently unavailable. Please contact iSharp Academy.',
      );
    }
    return this.mockProvider;
  }

  private hashOtp(challengeId: string, normalizedPhone: string, otp: string): string {
    return createHmac('sha256', this.getSigningSecret())
      .update(`${challengeId}:${normalizedPhone}:${otp}`)
      .digest('hex');
  }

  private hashSessionToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private generateOtpValue(provider: DemoOtpDeliveryProvider): string {
    const config = resolveDemoOtpRuntimeConfig();
    if (provider.isMock) {
      return config.mockOtp;
    }
    return randomInt(100000, 1000000).toString();
  }

  getPublicOtpStatus() {
    const config = resolveDemoOtpRuntimeConfig();
    return {
      isAvailable: config.isAvailable,
      isMockMode: config.isMockMode,
      expirySeconds: config.expirySeconds,
      resendCooldownSeconds: config.resendCooldownSeconds,
      maxAttempts: config.maxAttempts,
    };
  }

  async requestOtp(input: RequestOtpInput) {
    const config = resolveDemoOtpRuntimeConfig();
    const provider = this.getActiveProvider();
    const normalizedPhone = normalizeIndianMobile(input.phone);
    const ip = input.requestIp?.trim() || 'unknown';

    this.requestIpLimiter.consume(`ip:${ip}`);
    this.requestPhoneLimiter.consume(`phone:${normalizedPhone}`);

    const now = new Date();
    const existingPending = await this.prisma.demoOtpChallenge.findFirst({
      where: {
        normalizedPhone,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPending) {
      const elapsedSeconds = Math.floor(
        (now.getTime() - existingPending.lastSentAt.getTime()) / 1000,
      );
      if (elapsedSeconds < config.resendCooldownSeconds) {
        const retryAfter = config.resendCooldownSeconds - elapsedSeconds;
        throw new HttpException(
          `Please wait ${retryAfter} seconds before requesting another OTP.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const challengeId = randomBytes(16).toString('hex');
    const otp = this.generateOtpValue(provider);
    const expiresAt = new Date(now.getTime() + config.expirySeconds * 1000);
    const createdChallenge = await this.prisma.$transaction(async (tx) => {
      await tx.demoOtpChallenge.updateMany({
        where: { normalizedPhone, status: 'PENDING' },
        data: { status: 'SUPERSEDED' },
      });

      const created = await tx.demoOtpChallenge.create({
        data: {
          normalizedPhone,
          otpHash: 'pending',
          verificationMethod: provider.method,
          status: 'PENDING',
          marketingConsent: Boolean(input.marketingConsent),
          attemptCount: 0,
          maxAttempts: config.maxAttempts,
          resendCount: 0,
          lastSentAt: now,
          expiresAt,
          requestIp: ip.slice(0, 64),
        },
      });

      const otpHash = this.hashOtp(created.id, normalizedPhone, otp);
      return tx.demoOtpChallenge.update({
        where: { id: created.id },
        data: { otpHash },
      });
    });

    void challengeId;

    await provider.sendOtp({
      normalizedPhone,
      otp,
      expirySeconds: config.expirySeconds,
    });

    return {
      challengeId: createdChallenge.id,
      expiresAt: createdChallenge.expiresAt.toISOString(),
      expiresInSeconds: config.expirySeconds,
      resendCooldownSeconds: config.resendCooldownSeconds,
      verificationMethod: provider.method,
      isMockMode: provider.isMock,
      message: provider.isMock
        ? 'Development mock OTP challenge created (SMS not sent).'
        : 'Verification code sent to your mobile number.',
    };
  }

  async resendOtp(input: ResendOtpInput) {
    const config = resolveDemoOtpRuntimeConfig();
    const provider = this.getActiveProvider();
    const ip = input.requestIp?.trim() || 'unknown';

    this.requestIpLimiter.consume(`ip:${ip}`);

    const challenge = await this.prisma.demoOtpChallenge.findUnique({
      where: { id: input.challengeId },
    });
    if (!challenge) {
      throw new BadRequestException('OTP challenge not found. Please request a new OTP.');
    }
    if (challenge.status !== 'PENDING' || challenge.consumedAt) {
      throw new BadRequestException('This OTP challenge is no longer active. Please request a new OTP.');
    }

    const now = new Date();
    if (challenge.expiresAt <= now) {
      await this.prisma.demoOtpChallenge.update({
        where: { id: challenge.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    this.requestPhoneLimiter.consume(`phone:${challenge.normalizedPhone}`);

    const elapsedSeconds = Math.floor((now.getTime() - challenge.lastSentAt.getTime()) / 1000);
    if (elapsedSeconds < config.resendCooldownSeconds) {
      const retryAfter = config.resendCooldownSeconds - elapsedSeconds;
      throw new HttpException(
        `Please wait ${retryAfter} seconds before resending OTP.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (challenge.resendCount >= 5) {
      throw new HttpException(
        'Maximum OTP resend limit reached. Please start a new verification request.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = this.generateOtpValue(provider);
    const otpHash = this.hashOtp(challenge.id, challenge.normalizedPhone, otp);
    const newExpiresAt = new Date(now.getTime() + config.expirySeconds * 1000);

    const updated = await this.prisma.demoOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        otpHash,
        verificationMethod: provider.method,
        resendCount: { increment: 1 },
        lastSentAt: now,
        expiresAt: newExpiresAt,
      },
    });

    await provider.sendOtp({
      normalizedPhone: challenge.normalizedPhone,
      otp,
      expirySeconds: config.expirySeconds,
    });

    return {
      challengeId: updated.id,
      expiresAt: updated.expiresAt.toISOString(),
      expiresInSeconds: config.expirySeconds,
      resendCooldownSeconds: config.resendCooldownSeconds,
      verificationMethod: provider.method,
      isMockMode: provider.isMock,
      message: provider.isMock
        ? 'Development mock OTP challenge refreshed (SMS not sent).'
        : 'A new verification code has been sent to your mobile number.',
    };
  }

  async verifyOtp(input: VerifyOtpInput) {
    const config = resolveDemoOtpRuntimeConfig();
    if (!config.isAvailable) {
      throw new ServiceUnavailableException(
        'Demo Test OTP verification is currently unavailable.',
      );
    }

    const otp = (input.otp ?? '').trim();
    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Please enter a valid 6-digit OTP.');
    }

    const ip = input.requestIp?.trim() || 'unknown';
    this.verifyLimiter.consume(`verify:${ip}:${input.challengeId}`);

    const now = new Date();
    const rawSessionToken = randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashSessionToken(rawSessionToken);
    const sessionExpiresAt = new Date(now.getTime() + config.sessionTtlSeconds * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const challenge = await tx.demoOtpChallenge.findUnique({
        where: { id: input.challengeId },
      });
      if (!challenge) {
        throw new BadRequestException('Invalid or expired OTP challenge.');
      }

      if (challenge.status !== 'PENDING' || challenge.consumedAt || challenge.verifiedAt) {
        throw new BadRequestException('This OTP has already been used or invalidated. Please request a new OTP.');
      }

      if (challenge.expiresAt <= now) {
        await tx.demoOtpChallenge.update({
          where: { id: challenge.id },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('OTP has expired. Please request a new OTP.');
      }

      if (challenge.attemptCount >= challenge.maxAttempts) {
        await tx.demoOtpChallenge.update({
          where: { id: challenge.id },
          data: { status: 'LOCKED' },
        });
        throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
      }

      const expectedHash = this.hashOtp(challenge.id, challenge.normalizedPhone, otp);
      const actualBuf = Buffer.from(expectedHash, 'utf8');
      const storedBuf = Buffer.from(challenge.otpHash, 'utf8');
      const isMatch =
        actualBuf.length === storedBuf.length && timingSafeEqual(actualBuf, storedBuf);

      if (!isMatch) {
        const nextAttempts = challenge.attemptCount + 1;
        const locked = nextAttempts >= challenge.maxAttempts;
        await tx.demoOtpChallenge.update({
          where: { id: challenge.id },
          data: {
            attemptCount: nextAttempts,
            ...(locked ? { status: 'LOCKED' } : {}),
          },
        });
        const remaining = Math.max(0, challenge.maxAttempts - nextAttempts);
        throw new BadRequestException(
          locked
            ? 'Maximum verification attempts exceeded. Please request a new OTP.'
            : `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        );
      }

      // Single-use atomic consumption to prevent replay / concurrent race
      const consumed = await tx.demoOtpChallenge.updateMany({
        where: {
          id: challenge.id,
          status: 'PENDING',
          consumedAt: null,
        },
        data: {
          status: 'VERIFIED',
          verifiedAt: now,
          consumedAt: now,
        },
      });
      if (consumed.count !== 1) {
        throw new ConflictException('OTP challenge has already been consumed.');
      }

      const explicitConsent =
        typeof input.marketingConsent === 'boolean'
          ? input.marketingConsent
          : challenge.marketingConsent;

      const existingLead = await tx.demoLead.findUnique({
        where: { normalizedPhone: challenge.normalizedPhone },
      });

      let lead;
      if (existingLead) {
        // Preserve existing adminNotes, followUpStatus, firstAccessAt, totalAttempts.
        // Only upgrade marketingConsent if explicitly granted now.
        lead = await tx.demoLead.update({
          where: { id: existingLead.id },
          data: {
            lastAccessAt: now,
            verificationMethod: challenge.verificationMethod,
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
          data: {
            guestTokenHash,
          },
        });
        lead = await tx.demoLead.create({
          data: {
            normalizedPhone: challenge.normalizedPhone,
            visitorId: visitor.id,
            verificationMethod: challenge.verificationMethod,
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
          verificationMethod: challenge.verificationMethod,
          expiresAt: sessionExpiresAt,
          lastUsedAt: now,
        },
      });

      return { lead, session };
    });

    return {
      verified: true,
      sessionToken: rawSessionToken,
      expiresAt: result.session.expiresAt.toISOString(),
      verificationMethod: result.lead.verificationMethod as DemoVerificationMethod,
      marketingConsent: result.lead.marketingConsent,
    };
  }

  async resolveSession(rawToken?: string | null) {
    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length < 32) {
      return null;
    }

    const tokenHash = this.hashSessionToken(rawToken.trim());
    const now = new Date();

    const session = await this.prisma.demoAccessSession.findUnique({
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

    await this.prisma.demoAccessSession
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
}
