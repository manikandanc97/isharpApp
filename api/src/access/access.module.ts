import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InstitutionMembershipsModule } from '../institution-memberships/institution-memberships.module.js';
import { AccessController } from './access.controller.js';

@Module({
  imports: [AuthModule, InstitutionMembershipsModule],
  controllers: [AccessController],
})
export class AccessModule {}
