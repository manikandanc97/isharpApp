import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedRequest } from '../auth/auth-user.js';
import { StudentPortalController } from './student-portal.controller.js';

describe('StudentPortalController', () => {
  it('returns the already-resolved session with the dashboard payload', async () => {
    const dashboard = {
      student: { profileId: 'profile-id' },
      summary: { activeCourses: 1 },
    };
    const portal = { getDashboard: vi.fn().mockResolvedValue(dashboard) };
    const controller = new StudentPortalController(portal as never);
    const user = {
      authUserId: 'auth-user-id',
      profileId: 'profile-id',
      roles: ['STUDENT'],
      studentAccess: null,
    } as const;

    const result = await controller.dashboard({ user } as AuthenticatedRequest);

    expect(portal.getDashboard).toHaveBeenCalledWith('profile-id');
    expect(result).toEqual({ ...dashboard, session: user });
  });
});
