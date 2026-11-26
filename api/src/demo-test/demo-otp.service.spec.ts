import { BadRequestException, HttpException, ServiceUnavailableException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { DemoLeadsService } from './demo-leads.service.js';
import { MockDemoOtpProvider } from './demo-otp-provider.js';
import { DemoOtpService } from './demo-otp.service.js';
import { maskPhoneNumber, normalizeIndianMobile } from './demo-test-phone.helper.js';

describe('Indian Mobile Number Normalization & Masking', () => {
  it('normalizes valid Indian mobile formats to +91XXXXXXXXXX', () => {
    expect(normalizeIndianMobile('9876543210')).toBe('+919876543210');
    expect(normalizeIndianMobile('+91 98765-43210')).toBe('+919876543210');
    expect(normalizeIndianMobile('919876543210')).toBe('+919876543210');
    expect(normalizeIndianMobile('09876543210')).toBe('+919876543210');
  });

  it('rejects invalid mobile numbers', () => {
    expect(() => normalizeIndianMobile('')).toThrow(BadRequestException);
    expect(() => normalizeIndianMobile('1234567890')).toThrow(BadRequestException);
    expect(() => normalizeIndianMobile('987654321')).toThrow(BadRequestException);
    expect(() => normalizeIndianMobile('abcdefghij')).toThrow(BadRequestException);
  });

  it('masks normalized phone numbers for logs', () => {
    expect(maskPhoneNumber('+919876543210')).toBe('+91******3210');
  });
});

describe('DemoOtpService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.DEMO_OTP_PROVIDER = 'mock';
    process.env.DEMO_MOCK_OTP = '123456';
    process.env.DEMO_OTP_EXPIRY_SECONDS = '300';
    process.env.DEMO_OTP_RESEND_COOLDOWN_SECONDS = '60';
    process.env.DEMO_OTP_MAX_ATTEMPTS = '5';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('disables mock OTP provider in production environments', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DEMO_OTP_PROVIDER = 'mock';
    const service = new DemoOtpService({} as PrismaService, new MockDemoOtpProvider());

    expect(service.getPublicOtpStatus().isAvailable).toBe(false);
    expect(service.getPublicOtpStatus().isMockMode).toBe(false);
    await expect(
      service.requestOtp({ phone: '9876543210', requestIp: '127.0.0.1' }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('creates an OTP challenge without exposing the OTP value and enforces resend cooldown', async () => {
    const now = new Date();
    let storedChallenge: Record<string, unknown> | null = null;

    const prismaMock = {
      demoOtpChallenge: {
        findFirst: vi.fn(async () => storedChallenge),
      },
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          demoOtpChallenge: {
            updateMany: vi.fn(async () => ({ count: 0 })),
            create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
              storedChallenge = {
                id: '11111111-1111-4111-8111-111111111111',
                ...data,
                lastSentAt: now,
              };
              return storedChallenge;
            }),
            update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
              storedChallenge = { ...storedChallenge, ...data };
              return storedChallenge;
            }),
          },
        }),
      ),
    } as unknown as PrismaService;

    const service = new DemoOtpService(prismaMock, new MockDemoOtpProvider());
    const res = await service.requestOtp({
      phone: '98765 43210',
      marketingConsent: false,
      requestIp: '10.0.0.1',
    });

    expect(res.challengeId).toBe('11111111-1111-4111-8111-111111111111');
    expect(res.isMockMode).toBe(true);
    expect(res.verificationMethod).toBe('MOCK');
    expect(JSON.stringify(res)).not.toContain('123456');

    // Immediate second request within 60s cooldown must be rejected
    await expect(
      service.requestOtp({ phone: '+919876543210', requestIp: '10.0.0.1' }),
    ).rejects.toThrow(HttpException);
  });

  it('verifies valid mock OTP, prevents replay, and preserves returning lead notes/consent', async () => {
    const challengeId = '22222222-2222-4222-8222-222222222222';
    let challengeState: Record<string, unknown> = {
      id: challengeId,
      normalizedPhone: '+919876543210',
      otpHash: '',
      verificationMethod: 'MOCK',
      status: 'PENDING',
      marketingConsent: false,
      attemptCount: 0,
      maxAttempts: 5,
      resendCount: 0,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + 300_000),
      verifiedAt: null,
      consumedAt: null,
    };

    const existingLead = {
      id: 'lead-1',
      normalizedPhone: '+919876543210',
      visitorId: 'visitor-1',
      verificationMethod: 'MOCK',
      marketingConsent: true,
      followUpStatus: 'INTERESTED',
      adminNotes: 'Parent requested call back',
    };

    const leadUpdateSpy = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      ...existingLead,
      ...data,
    }));

    const prismaMock = {
      demoOtpChallenge: {
        findFirst: vi.fn(async () => null),
      },
      $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({
          demoOtpChallenge: {
            updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
              if (where.status === 'PENDING' && where.consumedAt === null && challengeState.status === 'PENDING') {
                challengeState = { ...challengeState, ...data };
                return { count: 1 };
              }
              return { count: 0 };
            }),
            create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
              challengeState = { ...challengeState, ...data, id: challengeId };
              return challengeState;
            }),
            update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
              challengeState = { ...challengeState, ...data };
              return challengeState;
            }),
            findUnique: vi.fn(async () => challengeState),
          },
          demoLead: {
            findUnique: vi.fn(async () => existingLead),
            update: leadUpdateSpy,
          },
          demoAccessSession: {
            create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
              id: 'session-1',
              ...data,
            })),
          },
        }),
      ),
    } as unknown as PrismaService;

    const service = new DemoOtpService(prismaMock, new MockDemoOtpProvider());
    await service.requestOtp({ phone: '9876543210', requestIp: '10.0.0.2' });

    // Wrong OTP increments attemptCount
    await expect(
      service.verifyOtp({ challengeId, otp: '000000', requestIp: '10.0.0.2' }),
    ).rejects.toThrow('Incorrect OTP');
    expect(challengeState.attemptCount).toBe(1);

    // Correct OTP succeeds and reuses existing lead without overwriting notes/consent
    const verified = await service.verifyOtp({
      challengeId,
      otp: '123456',
      marketingConsent: false,
      requestIp: '10.0.0.2',
    });
    expect(verified.verified).toBe(true);
    expect(verified.sessionToken).toBeTruthy();
    expect(leadUpdateSpy).toHaveBeenCalledTimes(1);
    const updatePayload = leadUpdateSpy.mock.calls[0][0].data;
    expect(updatePayload.adminNotes).toBeUndefined();
    expect(updatePayload.followUpStatus).toBeUndefined();
    expect(updatePayload.marketingConsent).toBeUndefined();

    // Replay attempt must fail
    await expect(
      service.verifyOtp({ challengeId, otp: '123456', requestIp: '10.0.0.2' }),
    ).rejects.toThrow('already been used');
  });
});

describe('DemoLeadsService', () => {
  it('rejects invalid follow-up status updates', async () => {
    const prismaMock = {
      demoLead: {
        findUnique: vi.fn(async () => ({
          id: 'lead-1',
          normalizedPhone: '+919876543210',
        })),
      },
    } as unknown as PrismaService;

    const service = new DemoLeadsService(prismaMock);
    await expect(
      service.updateLeadFollowUp('lead-1', { followUpStatus: 'INVALID_STATUS' }),
    ).rejects.toThrow(BadRequestException);
  });
});
