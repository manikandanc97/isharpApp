import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InstitutionMembershipsController } from './institution-memberships.controller.js';
import { InstitutionMembershipsService } from './institution-memberships.service.js';
import { VerifiedMembershipGuard } from './verified-membership.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [InstitutionMembershipsController],
  providers: [InstitutionMembershipsService, VerifiedMembershipGuard],
  exports: [InstitutionMembershipsService, VerifiedMembershipGuard],
})
export class InstitutionMembershipsModule {}
