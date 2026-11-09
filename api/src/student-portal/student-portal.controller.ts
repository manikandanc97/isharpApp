import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { VerifiedMembershipGuard } from '../institution-memberships/verified-membership.guard.js';
import { StudentPortalService } from './student-portal.service.js';

@Controller('api/student')
@UseGuards(AuthGuard, RolesGuard, VerifiedMembershipGuard)
@Roles('STUDENT')
export class StudentPortalController {
  constructor(private readonly portal: StudentPortalService) {}

  @Get('dashboard')
  async dashboard(@Req() request: AuthenticatedRequest) {
    const dashboard = await this.portal.getDashboard(request.user.profileId);

    // The dashboard request has already authenticated the JWT and resolved the
    // database-backed roles. Returning that result avoids making the browser
    // repeat the complete auth pipeline through /api/auth/me before it can
    // request the dashboard.
    return { ...dashboard, session: request.user };
  }
}
