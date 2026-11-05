import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { InstitutionMembershipsService } from '../institution-memberships/institution-memberships.service.js';
import { AdminService } from './admin.service.js';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly memberships: InstitutionMembershipsService,
  ) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  users(@Query('query') query?: string) {
    return this.admin.listUsers(query);
  }

  @Get('internal-students')
  internalStudents() {
    return this.admin.listInternalStudents();
  }

  @Post('internal-students')
  createInternalStudent(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.admin.createInternalStudent(request.user, body);
  }

  @Patch('internal-students/:id')
  updateInternalStudent(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.admin.updateInternalStudent(request.user, id, body);
  }

  @Delete('internal-students/:id')
  deleteInternalStudent(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.admin.deleteInternalStudent(request.user, id);
  }

  @Patch('users/:id/status')
  setUserStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.admin.setUserStatus(request.user, id, body);
  }

  @Get('memberships')
  membershipQueue(@Query('status') status?: string) {
    return this.admin.listMemberships(status);
  }

  @Patch('memberships/:id/verification')
  decideMembership(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.memberships.recordManualDecision(request.user, id, body);
  }

  @Patch('memberships/:id/access')
  setStudentAccess(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.admin.setStudentAccess(request.user, id, body);
  }

  @Get('catalog')
  catalog() {
    return this.admin.catalog();
  }

  @Post('courses')
  createCourse(@Body() body: unknown) {
    return this.admin.createCourse(body);
  }

  @Patch('courses/:id')
  updateCourse(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.admin.updateCourse(id, body);
  }
}
