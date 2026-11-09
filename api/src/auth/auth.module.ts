import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { SupabaseTokenVerifier } from './supabase-token-verifier.service.js';
import { StudentAccessResolver } from './student-access-resolver.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    SupabaseTokenVerifier,
    StudentAccessResolver,
    AuthGuard,
    RolesGuard,
  ],
  exports: [SupabaseTokenVerifier, StudentAccessResolver, AuthGuard, RolesGuard],
})
export class AuthModule {}
