import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DemoOtpService } from './demo-otp.service.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';
import { SlidingWindowRateLimiter } from './demo-test-rate-limit.helper.js';
import {
  DemoTestService,
  type SaveDemoAnswerInput,
  type StartDemoAttemptInput,
} from './demo-test.service.js';

export const DEMO_SESSION_COOKIE = 'isharp_demo_session';

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) out[key] = val;
  }
  return out;
}

@Controller('api/demo')
export class DemoTestController {
  private readonly startLimiter = new SlidingWindowRateLimiter(20, 60_000);
  private readonly submitLimiter = new SlidingWindowRateLimiter(30, 60_000);

  constructor(
    private readonly demoTestService: DemoTestService,
    private readonly configuration: DemoTestConfigurationService,
    private readonly demoOtpService: DemoOtpService,
  ) {}

  private extractSessionToken(req: Request): string | null {
    const headerToken = req.headers['x-demo-session-token'];
    if (typeof headerToken === 'string' && headerToken.trim()) {
      return headerToken.trim();
    }
    const cookies = parseCookieHeader(req.headers.cookie);
    return cookies[DEMO_SESSION_COOKIE] ?? null;
  }

  private setSessionCookie(res: Response, token: string, expiresAtIso: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = Math.max(
      60_000,
      new Date(expiresAtIso).getTime() - Date.now(),
    );
    res.cookie(DEMO_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge,
    });
  }

  private clearSessionCookie(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(DEMO_SESSION_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
    });
  }

  private getRequestIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown'
    );
  }

  private async requireVerifiedSession(req: Request) {
    const token = this.extractSessionToken(req);
    const session = await this.demoOtpService.resolveSession(token);
    if (!session) {
      throw new UnauthorizedException(
        'Mobile OTP verification is required to access the Demo Test.',
      );
    }
    return session;
  }

  @Get('config')
  async getConfiguration() {
    const [config, otpStatus] = await Promise.all([
      this.configuration.get(false),
      Promise.resolve(this.demoOtpService.getPublicOtpStatus()),
    ]);
    return {
      ...config,
      otpStatus,
    };
  }

  @Get('session')
  async getSession(@Req() req: Request) {
    const otpStatus = this.demoOtpService.getPublicOtpStatus();
    const session = await this.demoOtpService.resolveSession(
      this.extractSessionToken(req),
    );
    if (!session) {
      return {
        authenticated: false,
        otpStatus,
      };
    }
    return {
      authenticated: true,
      otpStatus,
      session: {
        expiresAt: session.expiresAt,
        verificationMethod: session.verificationMethod,
        marketingConsent: session.marketingConsent,
      },
    };
  }

  @Post('otp/request')
  requestOtp(
    @Req() req: Request,
    @Body() body: { phone?: string; marketingConsent?: boolean },
  ) {
    return this.demoOtpService.requestOtp({
      phone: body?.phone ?? '',
      marketingConsent: body?.marketingConsent,
      requestIp: this.getRequestIp(req),
    });
  }

  @Post('otp/resend')
  resendOtp(
    @Req() req: Request,
    @Body() body: { challengeId?: string },
  ) {
    return this.demoOtpService.resendOtp({
      challengeId: body?.challengeId ?? '',
      requestIp: this.getRequestIp(req),
    });
  }

  @Post('otp/verify')
  async verifyOtp(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body()
    body: {
      challengeId?: string;
      otp?: string;
      marketingConsent?: boolean;
    },
  ) {
    const result = await this.demoOtpService.verifyOtp({
      challengeId: body?.challengeId ?? '',
      otp: body?.otp ?? '',
      marketingConsent: body?.marketingConsent,
      requestIp: this.getRequestIp(req),
    });

    this.setSessionCookie(res, result.sessionToken, result.expiresAt);
    return result;
  }

  @Post('session/logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearSessionCookie(res);
    return { cleared: true };
  }

  @Post('attempts')
  async startAttempt(
    @Req() req: Request,
    @Body() body: StartDemoAttemptInput,
  ) {
    const session = await this.requireVerifiedSession(req);
    const ip = this.getRequestIp(req);
    this.startLimiter.consume(`${session.visitorId}:${ip}`);

    return this.demoTestService.startAttempt({
      visitorId: session.visitorId,
      leadId: session.leadId,
      input: {
        subject: body?.subject,
        language: body?.language,
        questionCount: body?.questionCount,
        idempotencyKey: body?.idempotencyKey,
        isPreview: false,
      },
    });
  }

  @Get('attempts/:id')
  async getAttempt(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ) {
    const session = await this.requireVerifiedSession(req);
    return this.demoTestService.getAttemptForClient(id, session.visitorId, false);
  }

  @Patch('attempts/:id/answer')
  async saveAnswer(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Body() body: SaveDemoAnswerInput,
  ) {
    const session = await this.requireVerifiedSession(req);
    return this.demoTestService.saveAnswer(id, session.visitorId, body);
  }

  @Post('attempts/:id/submit')
  async submitAttempt(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Body() body?: { answers?: Record<string, SaveDemoAnswerInput> },
  ) {
    const session = await this.requireVerifiedSession(req);
    const ip = this.getRequestIp(req);
    this.submitLimiter.consume(`${session.visitorId}:${ip}`);
    return this.demoTestService.submitAttempt(id, session.visitorId, body?.answers);
  }

  @Post('attempts/:id/abandon')
  async abandonAttempt(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ) {
    const session = await this.requireVerifiedSession(req);
    return this.demoTestService.abandonAttempt(id, session.visitorId);
  }

  @Post('events/cta')
  async trackCta(
    @Req() req: Request,
    @Body() body: { ctaName?: string; attemptId?: string },
  ) {
    const session = await this.requireVerifiedSession(req);
    return this.demoTestService.trackCtaEvent(
      session.visitorId,
      body?.ctaName || 'unknown',
      body?.attemptId,
    );
  }
}
