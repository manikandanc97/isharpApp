import { BadRequestException } from '@nestjs/common';
import { ProfilesService } from './profiles.service.js';

describe('ProfilesService profile updates', () => {
  const prisma = { userProfile: { update: vi.fn() } };
  const service = new ProfilesService(prisma as never);

  it.each(['role', 'roles', 'roleId', 'userRoles', 'authUserId'])(
    'rejects escalation through the %s profile field',
    async (field) => {
      await expect(
        service.updateProfile('20000000-0000-4000-8000-000000000001', {
          displayName: 'Student',
          [field]: 'SUPERADMIN',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.userProfile.update).not.toHaveBeenCalled();
    },
  );
});
