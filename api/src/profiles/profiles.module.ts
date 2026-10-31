import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProfileAccessGuard } from './profile-access.guard.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfileAccessGuard],
})
export class ProfilesModule {}
