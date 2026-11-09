import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InstitutionMembershipsModule } from '../institution-memberships/institution-memberships.module.js';
import { StudentPortalController } from './student-portal.controller.js';
import { StudentPortalService } from './student-portal.service.js';

@Module({
  imports: [AuthModule, InstitutionMembershipsModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService],
})
export class StudentPortalModule {}
