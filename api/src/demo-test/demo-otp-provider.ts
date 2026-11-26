import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { DemoVerificationMethod } from '../generated/prisma/client.js';

export interface DemoOtpSendParams {
  normalizedPhone: string;
  otp: string;
  expirySeconds: number;
}

export interface DemoOtpDeliveryProvider {
  readonly method: DemoVerificationMethod;
  readonly isMock: boolean;
  sendOtp(params: DemoOtpSendParams): Promise<void>;
}

export interface DemoOtpRuntimeConfig {
  providerName: string;
  isProduction: boolean;
  isMockMode: boolean;
  isAvailable: boolean;
  mockOtp: string;
  expirySeconds: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
  sessionTtlSeconds: number;
}

function parsePositiveInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

export function resolveDemoOtpRuntimeConfig(): DemoOtpRuntimeConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawProvider = (process.env.DEMO_OTP_PROVIDER ?? (isProduction ? '' : 'mock'))
    .trim()
    .toLowerCase();

  const mockOtpRaw = (process.env.DEMO_MOCK_OTP ?? '123456').trim();
  const mockOtp = /^\d{6}$/.test(mockOtpRaw) ? mockOtpRaw : '123456';

  const expirySeconds = parsePositiveInt(process.env.DEMO_OTP_EXPIRY_SECONDS, 300, 60, 1800);
  const resendCooldownSeconds = parsePositiveInt(
    process.env.DEMO_OTP_RESEND_COOLDOWN_SECONDS,
    60,
    15,
    300,
  );
  const maxAttempts = parsePositiveInt(process.env.DEMO_OTP_MAX_ATTEMPTS, 5, 1, 10);
  const sessionTtlSeconds = parsePositiveInt(
    process.env.DEMO_SESSION_TTL_SECONDS,
    4 * 60 * 60,
    300,
    24 * 60 * 60,
  );

  // Security requirement: disable mock OTP provider in public production environments.
  // If no real SMS provider is configured in production, fail securely.
  const isMockMode = !isProduction && rawProvider === 'mock';
  const isAvailable = isMockMode; // Future real SMS providers (e.g. 'msg91', 'twilio') will be enabled here.

  return {
    providerName: rawProvider || 'none',
    isProduction,
    isMockMode,
    isAvailable,
    mockOtp,
    expirySeconds,
    resendCooldownSeconds,
    maxAttempts,
    sessionTtlSeconds,
  };
}

@Injectable()
export class MockDemoOtpProvider implements DemoOtpDeliveryProvider {
  private readonly logger = new Logger(MockDemoOtpProvider.name);
  readonly method: DemoVerificationMethod = 'MOCK';
  readonly isMock = true;

  async sendOtp(params: DemoOtpSendParams): Promise<void> {
    const config = resolveDemoOtpRuntimeConfig();
    if (config.isProduction || !config.isMockMode) {
      throw new ServiceUnavailableException(
        'Mock OTP provider is disabled in production environments.',
      );
    }
    // Never log the OTP value or full phone number.
    this.logger.debug(
      `Simulated mock OTP challenge prepared (expiry=${params.expirySeconds}s, SMS not sent).`,
    );
  }
}
