import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DemoTestAdminController } from './demo-test-admin.controller.js';
import { DemoTestAnalyticsService } from './demo-test-analytics.service.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';
import { DemoTestController } from './demo-test.controller.js';
import { DemoTestService } from './demo-test.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DemoTestController, DemoTestAdminController],
  providers: [
    DemoTestService,
    DemoTestConfigurationService,
    DemoTestAnalyticsService,
  ],
  exports: [DemoTestService, DemoTestConfigurationService],
})
export class DemoTestModule {}
