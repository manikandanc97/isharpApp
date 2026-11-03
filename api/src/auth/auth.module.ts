import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { DevAuthController } from './dev-auth.controller.js';
import { DevAuthService } from './dev-auth.service.js';
import { RolesGuard } from './roles.guard.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';
import { StudentAccessResolver } from './student-access-resolver.service.js';

@Module({
  controllers: [AuthController, DevAuthController],
  providers: [
    SupabaseTokenVerifier,
    StudentAccessResolver,
    DevAuthService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [SupabaseTokenVerifier, StudentAccessResolver, DevAuthService, AuthGuard, RolesGuard],
})
export class AuthModule {}
