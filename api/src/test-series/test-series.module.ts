import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TestSeriesController } from './test-series.controller.js';
import { TestSeriesService } from './test-series.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TestSeriesController],
  providers: [TestSeriesService],
  exports: [TestSeriesService],
})
export class TestSeriesModule {}
