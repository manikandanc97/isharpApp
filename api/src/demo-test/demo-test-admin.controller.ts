import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { DemoLeadsService, type UpdateDemoLeadInput } from './demo-leads.service.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';

@Controller('api/admin/demo-test')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class DemoTestAdminController {
  constructor(
    private readonly configuration: DemoTestConfigurationService,
    private readonly demoLeads: DemoLeadsService,
  ) {}

  @Get()
  getSettings() {
    return this.configuration.get(true);
  }

  @Patch()
  updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.configuration.update(body, req.user.profileId);
  }

  @Get('leads/stats')
  getLeadStats() {
    return this.demoLeads.getStats();
  }

  @Get('leads')
  listLeads(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('query') query?: string,
    @Query('followUpStatus') followUpStatus?: string,
    @Query('consent') consent?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.demoLeads.listLeads({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      query,
      followUpStatus,
      consent,
      from,
      to,
    });
  }

  @Get('leads/:id/attempts')
  getLeadAttempts(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.demoLeads.getLeadAttempts(id);
  }

  @Patch('leads/:id')
  updateLeadFollowUp(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateDemoLeadInput,
  ) {
    return this.demoLeads.updateLeadFollowUp(id, body, req.user.profileId);
  }

  @Delete('leads/:id')
  deleteLead(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.demoLeads.deleteLead(id, req.user.profileId);
  }
}
