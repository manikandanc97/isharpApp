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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';
import { SlidingWindowRateLimiter } from './demo-test-rate-limit.helper.js';
import {
  DemoTestService,
  type SaveDemoAnswerInput,
  type StartDemoAttemptInput,
} from './demo-test.service.js';

export const DEMO_VISITOR_COOKIE = 'isharp_demo_vid';

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
  ) {}

  private extractVisitorToken(req: Request): string | null {
    const headerToken = req.headers['x-demo-visitor-token'];
    if (typeof headerToken === 'string' && headerToken.trim()) {
      return headerToken.trim();
    }
    const cookies = parseCookieHeader(req.headers.cookie);
    return cookies[DEMO_VISITOR_COOKIE] ?? null;
  }

  private setVisitorCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(DEMO_VISITOR_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
    });
  }

  private getClientKey(req: Request, visitorId: string): string {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
    return `${visitorId}:${ip}`;
  }

  @Get('config')
  getConfiguration() {
    return this.configuration.get(false);
  }

  @Post('attempts')
  async startAttempt(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: StartDemoAttemptInput,
  ) {
    const { visitorId, guestToken } =
      await this.demoTestService.resolveOrCreateVisitor({
        guestToken: this.extractVisitorToken(req),
      });
    this.setVisitorCookie(res, guestToken);
    this.startLimiter.consume(this.getClientKey(req, visitorId));

    const attempt = await this.demoTestService.startAttempt({
      visitorId,
      input: {
        subject: body?.subject,
        language: body?.language,
        questionCount: body?.questionCount,
        idempotencyKey: body?.idempotencyKey,
        isPreview: false,
      },
    });

    return {
      ...attempt,
      visitorToken: guestToken,
    };
  }

  @Get('attempts/:id')
  async getAttempt(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { visitorId, guestToken } =
      await this.demoTestService.resolveOrCreateVisitor({
        guestToken: this.extractVisitorToken(req),
      });
    this.setVisitorCookie(res, guestToken);
    return this.demoTestService.getAttemptForClient(id, visitorId, false);
  }

  @Patch('attempts/:id/answer')
  async saveAnswer(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Body() body: SaveDemoAnswerInput,
  ) {
    const { visitorId } = await this.demoTestService.resolveOrCreateVisitor({
      guestToken: this.extractVisitorToken(req),
    });
    return this.demoTestService.saveAnswer(id, visitorId, body);
  }

  @Post('attempts/:id/submit')
  async submitAttempt(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Body() body?: { answers?: Record<string, SaveDemoAnswerInput> },
  ) {
    const { visitorId } = await this.demoTestService.resolveOrCreateVisitor({
      guestToken: this.extractVisitorToken(req),
    });
    this.submitLimiter.consume(this.getClientKey(req, visitorId));
    return this.demoTestService.submitAttempt(id, visitorId, body?.answers);
  }

  @Post('attempts/:id/abandon')
  async abandonAttempt(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ) {
    const { visitorId } = await this.demoTestService.resolveOrCreateVisitor({
      guestToken: this.extractVisitorToken(req),
    });
    return this.demoTestService.abandonAttempt(id, visitorId);
  }

  @Post('events/cta')
  async trackCta(
    @Req() req: Request,
    @Body() body: { ctaName?: string; attemptId?: string },
  ) {
    const { visitorId } = await this.demoTestService.resolveOrCreateVisitor({
      guestToken: this.extractVisitorToken(req),
    });
    return this.demoTestService.trackCtaEvent(
      visitorId,
      body?.ctaName || 'unknown',
      body?.attemptId,
    );
  }
}
