import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health/health.controller.js';
import { HealthService } from './health/health.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AccessModule } from './access/access.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';
import { InstitutionMembershipsModule } from './institution-memberships/institution-memberships.module.js';
import { AdminModule } from './admin/admin.module.js';
import { QuestionBankModule } from './question-bank/question-bank.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AccessModule,
    ProfilesModule,
    InstitutionMembershipsModule,
    AdminModule,
    QuestionBankModule,
    ...(process.env.OBSERVE_APP_KEY &&
    process.env.OBSERVE_APP_SECRET &&
    process.env.OBSERVE_APP_KEY !== 'YOUR_APP_KEY'
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY,
            appSecret: process.env.OBSERVE_APP_SECRET,
            serviceId: 'api',
          }),
        ]
      : []),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, HealthService],
})
export class AppModule {}
