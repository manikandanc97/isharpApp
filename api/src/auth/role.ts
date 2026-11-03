export const ROLE_NAMES = ['STUDENT', 'ADMIN', 'SUPERADMIN'] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export const ROLE_GRANTS: Readonly<Record<RoleName, readonly RoleName[]>> = {
  STUDENT: ['STUDENT'],
  ADMIN: ['ADMIN'],
  SUPERADMIN: ['STUDENT', 'ADMIN', 'SUPERADMIN'],
};

export function isRoleName(value: unknown): value is RoleName {
  return typeof value === 'string' && ROLE_NAMES.includes(value as RoleName);
}

export function hasRequiredRole(
  assignedRoles: readonly RoleName[],
  requiredRoles: readonly RoleName[],
): boolean {
  return requiredRoles.some((requiredRole) =>
    assignedRoles.some((assignedRole) =>
      ROLE_GRANTS[assignedRole].includes(requiredRole),
    ),
  );
}
