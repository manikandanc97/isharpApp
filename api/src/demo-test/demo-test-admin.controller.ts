import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';

@Controller('api/admin/demo-test')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class DemoTestAdminController {
  constructor(private readonly configuration: DemoTestConfigurationService) {}

  @Get()
  getConfiguration() {
    return this.configuration.get(true);
  }

  @Patch()
  updateConfiguration(@Body() body: unknown) {
    return this.configuration.update(body);
  }

  @Put('questions')
  setQuestionPool(@Body() body: unknown) {
    return this.configuration.setQuestionPool(body);
  }
}
