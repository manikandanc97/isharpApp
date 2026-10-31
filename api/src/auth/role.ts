export const ROLE_NAMES = ['STUDENT', 'ADMIN', 'SUPERADMIN'] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export function isRoleName(value: unknown): value is RoleName {
  return typeof value === 'string' && ROLE_NAMES.includes(value as RoleName);
}
