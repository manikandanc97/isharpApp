import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type {
  CreateOfflineSessionDto,
  EnterOfflineAnswersDto,
  RecordAttendanceDto,
  UpdateOfflineSessionDto,
} from './dto/offline-examination.dto.js';
import { OfflineExaminationService } from './offline-examination.service.js';

@Controller('api/admin/offline-exams')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class OfflineExaminationController {
  constructor(private readonly service: OfflineExaminationService) {}

  @Post('sessions')
  createSession(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateOfflineSessionDto,
  ) {
    return this.service.createSession(req.user.profileId, body);
  }

  @Get('sessions')
  listSessions(@Query('testId') testId?: string) {
    return this.service.listSessions(testId);
  }

  @Get('sessions/:sessionId')
  getSessionById(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ) {
    return this.service.getSessionById(sessionId);
  }

  @Patch('sessions/:sessionId')
  updateSession(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: UpdateOfflineSessionDto,
  ) {
    return this.service.updateSession(sessionId, body);
  }

  @Post('sessions/:sessionId/attendance')
  recordAttendance(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: RecordAttendanceDto,
  ) {
    return this.service.recordAttendance(req.user.profileId, sessionId, body);
  }

  @Post('sessions/:sessionId/enter-answers')
  enterAnswers(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() body: EnterOfflineAnswersDto,
  ) {
    return this.service.enterOfflineAnswers(req.user.profileId, sessionId, body);
  }
}
