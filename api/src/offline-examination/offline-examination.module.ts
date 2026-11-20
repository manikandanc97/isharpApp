import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OfflineExaminationController } from './offline-examination.controller.js';
import { OfflineExaminationService } from './offline-examination.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OfflineExaminationController],
  providers: [OfflineExaminationService],
  exports: [OfflineExaminationService],
})
export class OfflineExaminationModule {}
