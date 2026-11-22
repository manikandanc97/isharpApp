import { createApiClient } from '@/lib/api-client';

export const roleNames = [
  'STUDENT',
  'ADMIN',
  'SUPERADMIN',
  'QUESTION_MANAGER',
  'ACADEMIC_MANAGER',
  'EXAM_MANAGER',
  'EVALUATOR',
] as const;
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

// The session route may make two 10-second attempts while the API wakes from a
// cold start. Keep the browser timeout slightly above that retry window.
const frontendApi = createApiClient({ baseUrl: '', defaultTimeoutMs: 25_000 });

export function getAuthenticatedSession(accessToken: string) {
  return frontendApi.request<AuthenticatedSession>('/api/session', {
    accessToken,
    cache: 'no-store',
  });
}
