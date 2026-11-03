import type { RoleName } from '@/lib/auth-session';

export const roleGrants: Readonly<Record<RoleName, readonly RoleName[]>> = {
  STUDENT: ['STUDENT'],
  ADMIN: ['ADMIN'],
  SUPERADMIN: ['STUDENT', 'ADMIN', 'SUPERADMIN'],
};

export function hasRequiredRole(
  assignedRoles: readonly RoleName[],
  requiredRole: RoleName,
): boolean {
  return assignedRoles.some((role) => roleGrants[role].includes(requiredRole));
}
