import type { Request } from 'express';
import type { RoleName } from './role.js';

export type AuthUser = {
  authUserId: string;
  profileId: string | null;
  roles: RoleName[];
};

export type AuthenticatedRequest = Request & { user: AuthUser };
