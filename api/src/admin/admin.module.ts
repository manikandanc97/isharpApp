import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InstitutionMembershipsModule } from '../institution-memberships/institution-memberships.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [AuthModule, InstitutionMembershipsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
