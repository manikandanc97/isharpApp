import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { VerifiedMembershipGuard } from '../institution-memberships/verified-membership.guard.js';

@Controller('api')
@UseGuards(AuthGuard, RolesGuard)
export class AccessController {
  @Get('test/student')
  @Roles('STUDENT')
  studentTest() {
    return { access: 'student', message: 'Student API access confirmed' };
  }

  @Get('test/admin')
  @Roles('ADMIN')
  adminTest() {
    return { access: 'admin', message: 'Admin API access confirmed' };
  }

  @Get('test/superadmin')
  @Roles('SUPERADMIN')
  superadminTest() {
    return {
      access: 'superadmin',
      message: 'Superadmin API access confirmed',
    };
  }

  @Get('learning')
  @Roles('STUDENT', 'ADMIN', 'SUPERADMIN')
  @UseGuards(VerifiedMembershipGuard)
  learning() {
    return { access: 'learning' };
  }

  @Get('admin/content')
  @Roles('ADMIN', 'SUPERADMIN')
  academicContent() {
    return { access: 'academic-content' };
  }

  @Get('system/settings')
  @Roles('SUPERADMIN')
  systemSettings() {
    return { access: 'system-settings' };
  }
}
