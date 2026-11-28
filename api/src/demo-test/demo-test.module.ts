import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DemoLeadsService } from './demo-leads.service.js';
import { MockDemoOtpProvider } from './demo-otp-provider.js';
import { DemoOtpService } from './demo-otp.service.js';
import { DemoTestAdminController } from './demo-test-admin.controller.js';
import { DemoTestConfigurationService } from './demo-test-configuration.service.js';
import { DemoTestController } from './demo-test.controller.js';
import { DemoTestService } from './demo-test.service.js';
import { DemoAttemptService } from './services/demo-attempt.service.js';
import { DemoEvaluationService } from './services/demo-evaluation.service.js';
import { DemoExposureService } from './services/demo-exposure.service.js';
import { DemoVisitorService } from './services/demo-visitor.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DemoTestController, DemoTestAdminController],
  providers: [
    DemoTestService,
    DemoVisitorService,
    DemoExposureService,
    DemoEvaluationService,
    DemoAttemptService,
    DemoTestConfigurationService,
    DemoOtpService,
    MockDemoOtpProvider,
    DemoLeadsService,
  ],
  exports: [
    DemoTestService,
    DemoVisitorService,
    DemoExposureService,
    DemoEvaluationService,
    DemoAttemptService,
    DemoTestConfigurationService,
    DemoOtpService,
    DemoLeadsService,
  ],
})
export class DemoTestModule {}
