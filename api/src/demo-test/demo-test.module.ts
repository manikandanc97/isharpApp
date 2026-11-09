import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DemoTestController } from './demo-test.controller.js';
import { DemoTestService } from './demo-test.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [DemoTestController],
  providers: [DemoTestService],
  exports: [DemoTestService],
})
export class DemoTestModule {}

