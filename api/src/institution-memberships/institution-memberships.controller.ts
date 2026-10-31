import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { InstitutionMembershipsService } from './institution-memberships.service.js';

@Controller('api/institution-memberships')
@UseGuards(AuthGuard, RolesGuard)
export class InstitutionMembershipsController {
  constructor(private readonly memberships: InstitutionMembershipsService) {}

  @Post('me/submission')
  @Roles('STUDENT')
  submit(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.memberships.submit(request.user, body);
  }

  @Get('me')
  @Roles('STUDENT')
  getStatus(@Req() request: AuthenticatedRequest) {
    return this.memberships.getStatus(request.user);
  }

  @Post('me/verify')
  @Roles('STUDENT')
  verify(@Req() request: AuthenticatedRequest) {
    return this.memberships.verifyAgainstTrustedSource(request.user);
  }

  @Patch(':id/verification')
  @Roles('ADMIN', 'SUPERADMIN')
  decide(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.memberships.recordManualDecision(request.user, id, body);
  }
}
