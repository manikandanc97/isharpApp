import { createApiClient } from '@/lib/api-client';

export const roleNames = ['STUDENT', 'ADMIN', 'SUPERADMIN'] as const;
export type RoleName = (typeof roleNames)[number];

export type AuthenticatedSession = {
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

const frontendApi = createApiClient({ baseUrl: '', defaultTimeoutMs: 8_000 });

export function getAuthenticatedSession(accessToken: string) {
  return frontendApi.request<AuthenticatedSession>('/api/session', {
    accessToken,
    cache: 'no-store',
  });
}
