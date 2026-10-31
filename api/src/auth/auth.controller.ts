import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth-user.js';
import { AuthGuard } from './auth.guard.js';

@Controller('api/auth')
@UseGuards(AuthGuard)
export class AuthController {
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }
}
