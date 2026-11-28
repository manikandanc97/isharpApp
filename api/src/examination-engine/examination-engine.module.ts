import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ExaminationEngineController } from './examination-engine.controller.js';
import { ExaminationEngineService } from './examination-engine.service.js';
import { AttemptLifecycleService } from './services/attempt-lifecycle.service.js';
import { AttemptSubmissionService } from './services/attempt-submission.service.js';
import { ResultRecalculationService } from './services/result-recalculation.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ExaminationEngineController],
  providers: [
    ExaminationEngineService,
    AttemptLifecycleService,
    AttemptSubmissionService,
    ResultRecalculationService,
  ],
  exports: [
    ExaminationEngineService,
    AttemptLifecycleService,
    AttemptSubmissionService,
    ResultRecalculationService,
  ],
})
export class ExaminationEngineModule {}
