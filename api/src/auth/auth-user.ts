import type { Request } from 'express';
import type { RoleName } from './role.js';

export type AuthUser = {
  authUserId: string;
  profileId: string | null;
  displayName?: string | null;
  email?: string | null;
  roles: RoleName[];
  studentAccess?: {
    studentId?: string;
    category: 'INTERNAL' | 'EXTERNAL';
    paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
    paidAccessUntil: string | null;
    hasLearningAccess: boolean;
  } | null;
};

export type AuthenticatedRequest = Request & { user: AuthUser };
