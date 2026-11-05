import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ProfileAccessGuard } from './profile-access.guard.js';
import { ProfilesService } from './profiles.service.js';

@Controller('api/profiles')
@UseGuards(AuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('me')
  @Roles('STUDENT', 'ADMIN', 'SUPERADMIN')
  findMe(@Req() request: AuthenticatedRequest) {
    return this.profiles.findPrivate(this.requireProfileId(request));
  }

  @Patch('me')
  @Roles('STUDENT', 'ADMIN', 'SUPERADMIN')
  updateMe(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.profiles.updateProfile(this.requireProfileId(request), body);
  }

  @Get(':id/private')
  @Roles('STUDENT', 'ADMIN', 'SUPERADMIN')
  @UseGuards(ProfileAccessGuard)
  findPrivate(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.profiles.findPrivate(id);
  }

  @Patch(':id')
  @Roles('STUDENT', 'ADMIN', 'SUPERADMIN')
  @UseGuards(ProfileAccessGuard)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.profiles.updateProfile(id, body);
  }

  @Post(':id/roles')
  @Roles('ADMIN', 'SUPERADMIN')
  assignRole(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body('role') role: unknown,
  ) {
    return this.profiles.assignRole(request.user, id, role);
  }

  @Delete(':id/roles/:role')
  @Roles('ADMIN', 'SUPERADMIN')
  revokeRole(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('role') role: string,
  ) {
    return this.profiles.revokeRole(request.user, id, role);
  }

  private requireProfileId(request: AuthenticatedRequest): string {
    if (!request.user.profileId) {
      throw new BadRequestException('An active user profile is required');
    }
    return request.user.profileId;
  }
}
