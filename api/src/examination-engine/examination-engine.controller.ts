import {
  Body,
  Controller,
  Get,
  Ip,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type {
  AnswerKeyAuditDto,
  AutosaveAnswerDto,
  SubmitAttemptDto,
} from './dto/examination.dto.js';
import { ExaminationEngineService } from './examination-engine.service.js';

@Controller('api/exam')
@UseGuards(AuthGuard)
export class ExaminationEngineController {
  constructor(private readonly service: ExaminationEngineService) {}

  // --------------------------------------------------------------------------
  // STUDENT EXAMINATION ENDPOINTS
  // --------------------------------------------------------------------------

  @Post('tests/:testId/start')
  startOrResume(
    @Req() req: AuthenticatedRequest,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.service.startOrResumeAttempt(req.user.profileId, testId, {
      ip,
      userAgent,
    });
  }

  @Get('attempts/:attemptId')
  getAttempt(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
  ) {
    return this.service.getAttempt(req.user.profileId, attemptId);
  }

  @Post('attempts/:attemptId/answer')
  autosaveAnswer(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Body() body: AutosaveAnswerDto,
  ) {
    return this.service.autosaveAnswer(req.user.profileId, attemptId, body);
  }

  @Post('attempts/:attemptId/submit')
  submitAttempt(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
    @Body() body?: SubmitAttemptDto,
  ) {
    return this.service.submitAttempt(req.user.profileId, attemptId, body);
  }

  @Get('attempts/:attemptId/result')
  getAttemptResult(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', new ParseUUIDPipe({ version: '4' })) attemptId: string,
  ) {
    return this.service.getAttemptResult(req.user.profileId, attemptId);
  }

  // --------------------------------------------------------------------------
  // ADMIN AUDIT & RECALCULATION ENDPOINTS
  // --------------------------------------------------------------------------

  @Post('admin/tests/:testId/audit-answer-key')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  auditAnswerKey(
    @Req() req: AuthenticatedRequest,
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
    @Body() body: AnswerKeyAuditDto,
  ) {
    return this.service.auditAnswerKeyChange(req.user.profileId, testId, body);
  }

  @Post('admin/tests/:testId/recalculate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  recalculateTestResults(
    @Param('testId', new ParseUUIDPipe({ version: '4' })) testId: string,
  ) {
    return this.service.recalculateTestResults(testId);
  }
}
