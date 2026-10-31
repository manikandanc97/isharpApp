import { createApiClient } from '@/lib/api-client';

export const roleNames = ['STUDENT', 'ADMIN', 'SUPERADMIN'] as const;
export type RoleName = (typeof roleNames)[number];

export type AuthenticatedSession = {
  authUserId: string;
  profileId: string | null;
  roles: RoleName[];
};

const frontendApi = createApiClient({ baseUrl: '', defaultTimeoutMs: 8_000 });

export function getAuthenticatedSession(accessToken: string) {
  return frontendApi.request<AuthenticatedSession>('/api/session', {
    accessToken,
    cache: 'no-store',
  });
}
