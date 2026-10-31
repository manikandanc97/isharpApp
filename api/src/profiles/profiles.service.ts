import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from '../auth/auth-user.js';
import { isRoleName, type RoleName } from '../auth/role.js';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findPrivate(id: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id },
      select: { id: true, displayName: true, isActive: true, createdAt: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(id: string, body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('A profile update object is required');
    }
    const input = body as Record<string, unknown>;
    const forbidden = ['role', 'roles', 'roleId', 'userRoles', 'authUserId'];
    if (forbidden.some((key) => key in input)) {
      throw new BadRequestException(
        'Identity and roles cannot be changed through profile updates',
      );
    }
    if (Object.keys(input).some((key) => !['displayName'].includes(key))) {
      throw new BadRequestException('Unsupported profile field');
    }
    if (
      typeof input.displayName !== 'string' ||
      input.displayName.trim().length < 1 ||
      input.displayName.length > 150
    ) {
      throw new BadRequestException(
        'displayName must contain 1 to 150 characters',
      );
    }
    return this.prisma.userProfile.update({
      where: { id },
      data: { displayName: input.displayName.trim() },
      select: { id: true, displayName: true, isActive: true },
    });
  }

  async assignRole(actor: AuthUser, targetProfileId: string, rawRole: unknown) {
    const role = this.authorizeRoleMutation(actor, targetProfileId, rawRole);
    const targetRoles = await this.getTargetRoles(targetProfileId);
    this.assertTargetCanBeManaged(actor, targetRoles);

    const roleRecord = await this.prisma.role.findUnique({
      where: { name: role },
    });
    if (!roleRecord)
      throw new NotFoundException(`Role ${role} is not configured`);
    try {
      return await this.prisma.userRole.create({
        data: { userProfileId: targetProfileId, roleId: roleRecord.id },
        select: { userProfileId: true, role: { select: { name: true } } },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already has this role');
      }
      throw error;
    }
  }

  async revokeRole(actor: AuthUser, targetProfileId: string, rawRole: unknown) {
    const role = this.authorizeRoleMutation(actor, targetProfileId, rawRole);
    const targetRoles = await this.getTargetRoles(targetProfileId);
    this.assertTargetCanBeManaged(actor, targetRoles);
    const roleRecord = await this.prisma.role.findUnique({
      where: { name: role },
    });
    if (!roleRecord)
      throw new NotFoundException(`Role ${role} is not configured`);
    try {
      return await this.prisma.userRole.delete({
        where: {
          userProfileId_roleId: {
            userProfileId: targetProfileId,
            roleId: roleRecord.id,
          },
        },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Role assignment not found');
      }
      throw error;
    }
  }

  private authorizeRoleMutation(
    actor: AuthUser,
    targetId: string,
    rawRole: unknown,
  ): RoleName {
    if (!actor.profileId || actor.profileId === targetId) {
      throw new ForbiddenException('Users cannot change their own roles');
    }
    if (!isRoleName(rawRole)) throw new BadRequestException('Unknown role');
    if (!actor.roles.includes('SUPERADMIN') && rawRole !== 'STUDENT') {
      throw new ForbiddenException(
        'Only SUPERADMIN can assign or revoke privileged roles',
      );
    }
    return rawRole;
  }

  private async getTargetRoles(profileId: string): Promise<string[]> {
    const target = await this.prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { userRoles: { select: { role: { select: { name: true } } } } },
    });
    if (!target) throw new NotFoundException('Profile not found');
    return target.userRoles.map(({ role }) => role.name);
  }

  private assertTargetCanBeManaged(
    actor: AuthUser,
    targetRoles: string[],
  ): void {
    if (
      !actor.roles.includes('SUPERADMIN') &&
      targetRoles.some((role) => role === 'ADMIN' || role === 'SUPERADMIN')
    ) {
      throw new ForbiddenException(
        'Only SUPERADMIN can manage administrator accounts',
      );
    }
  }
}
