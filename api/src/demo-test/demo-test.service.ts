import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';
import { DemoAttemptService } from './services/demo-attempt.service.js';
import { DemoEvaluationService } from './services/demo-evaluation.service.js';
import { DemoExposureService } from './services/demo-exposure.service.js';
import { DemoVisitorService } from './services/demo-visitor.service.js';

export interface StartDemoAttemptInput {
  subject?: string;
  language?: string;
  questionCount?: number;
  idempotencyKey?: string;
  isPreview?: boolean;
}

export interface SaveDemoAnswerInput {
  questionId: string;
  selectedOptionId?: string | null;
  numericalAnswer?: string | null;
  isMarkedForReview?: boolean;
  isVisited?: boolean;
  timeSpentSeconds?: number;
}

/**
 * Compatibility facade coordinating demo visitor identity, attempt lifecycle,
 * question exposure tracking, and attempt evaluation.
 */
@Injectable()
export class DemoTestService {
  private readonly visitor: DemoVisitorService;
  private readonly exposure: DemoExposureService;
  private readonly evaluation: DemoEvaluationService;
  private readonly attempts: DemoAttemptService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configuration: DemoTestConfigurationService,
    @Optional() visitor?: DemoVisitorService,
    @Optional() exposure?: DemoExposureService,
    @Optional() evaluation?: DemoEvaluationService,
    @Optional() attempts?: DemoAttemptService,
  ) {
    this.visitor = visitor ?? new DemoVisitorService(prisma);
    this.exposure = exposure ?? new DemoExposureService();
    this.evaluation = evaluation ?? new DemoEvaluationService(prisma);
    this.attempts =
      attempts ??
      new DemoAttemptService(
        prisma,
        configuration,
        this.exposure,
        this.evaluation,
      );
  }

  issueGuestToken(): string {
    return this.visitor.issueGuestToken();
  }

  verifyGuestToken(token?: string | null): string | null {
    return this.visitor.verifyGuestToken(token);
  }

  hashGuestId(rawId: string): string {
    return this.visitor.hashGuestId(rawId);
  }

  resolveOrCreateVisitor(params: {
    guestToken?: string | null;
    userProfileId?: string | null;
  }) {
    return this.visitor.resolveOrCreateVisitor(params);
  }

  startAttempt(params: {
    visitorId: string;
    leadId?: string | null;
    userProfileId?: string | null;
    input: StartDemoAttemptInput;
  }) {
    return this.attempts.startAttempt(params);
  }

  getAttemptForClient(
    attemptId: string,
    visitorId: string,
    allowAdminPreview = false,
  ) {
    return this.evaluation.getAttemptForClient(
      attemptId,
      visitorId,
      allowAdminPreview,
    );
  }

  saveAnswer(
    attemptId: string,
    visitorId: string,
    input: SaveDemoAnswerInput,
  ) {
    return this.attempts.saveAnswer(attemptId, visitorId, input);
  }

  submitAttempt(
    attemptId: string,
    visitorId: string,
    answersPayload?: Record<string, SaveDemoAnswerInput>,
  ) {
    return this.evaluation.submitAttempt(attemptId, visitorId, answersPayload);
  }

  abandonAttempt(attemptId: string, visitorId: string) {
    return this.attempts.abandonAttempt(attemptId, visitorId);
  }

  trackCtaEvent(visitorId: string, ctaName: string, attemptId?: string) {
    return this.attempts.trackCtaEvent(visitorId, ctaName, attemptId);
  }
}
