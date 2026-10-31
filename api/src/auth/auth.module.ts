import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';

@Module({
  controllers: [AuthController],
  providers: [SupabaseTokenVerifier, AuthGuard, RolesGuard],
  exports: [SupabaseTokenVerifier, AuthGuard, RolesGuard],
})
export class AuthModule {}
