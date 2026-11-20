import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ExaminationEngineController } from './examination-engine.controller.js';
import { ExaminationEngineService } from './examination-engine.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ExaminationEngineController],
  providers: [ExaminationEngineService],
  exports: [ExaminationEngineService],
})
export class ExaminationEngineModule {}
