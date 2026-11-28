import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AnswerKeyAuditDto,
  AutosaveAnswerDto,
  SubmitAttemptDto,
} from './dto/examination.dto.js';
import { AttemptLifecycleService } from './services/attempt-lifecycle.service.js';
import { AttemptSubmissionService } from './services/attempt-submission.service.js';
import { ResultRecalculationService } from './services/result-recalculation.service.js';

/**
 * Compatibility facade for the examination engine.
 * Delegates attempt lifecycle, autosave, submission/evaluation, and
 * answer-key recalculation to focused domain services.
 */
@Injectable()
export class ExaminationEngineService {
  private readonly lifecycle: AttemptLifecycleService;
  private readonly submission: AttemptSubmissionService;
  private readonly recalculation: ResultRecalculationService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() lifecycle?: AttemptLifecycleService,
    @Optional() submission?: AttemptSubmissionService,
    @Optional() recalculation?: ResultRecalculationService,
  ) {
    this.submission = submission ?? new AttemptSubmissionService(prisma);
    this.lifecycle =
      lifecycle ?? new AttemptLifecycleService(prisma, this.submission);
    this.recalculation =
      recalculation ?? new ResultRecalculationService(prisma);
  }

  startOrResumeAttempt(
    profileId: string | null,
    testId: string,
    clientInfo?: { ip?: string; userAgent?: string },
  ) {
    return this.lifecycle.startOrResumeAttempt(profileId, testId, clientInfo);
  }

  getAttempt(profileId: string | null, attemptId: string) {
    return this.lifecycle.getAttempt(profileId, attemptId);
  }

  autosaveAnswer(
    profileId: string | null,
    attemptId: string,
    dto: AutosaveAnswerDto,
  ) {
    return this.lifecycle.autosaveAnswer(profileId, attemptId, dto);
  }

  submitAttempt(
    profileId: string | null,
    attemptId: string,
    dto?: SubmitAttemptDto,
  ) {
    return this.submission.submitAttempt(profileId, attemptId, dto);
  }

  getAttemptResult(profileId: string | null, attemptId: string) {
    return this.submission.getAttemptResult(profileId, attemptId);
  }

  auditAnswerKeyChange(
    adminProfileId: string | null,
    testId: string,
    dto: AnswerKeyAuditDto,
  ) {
    return this.recalculation.auditAnswerKeyChange(adminProfileId, testId, dto);
  }

  recalculateTestResults(testId: string) {
    return this.recalculation.recalculateTestResults(testId);
  }
}
