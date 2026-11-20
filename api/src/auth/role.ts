export const ROLE_NAMES = [
  'STUDENT',
  'ADMIN',
  'SUPERADMIN',
  'QUESTION_MANAGER',
  'ACADEMIC_MANAGER',
  'EXAM_MANAGER',
  'EVALUATOR',
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export const ROLE_GRANTS: Readonly<Record<RoleName, readonly RoleName[]>> = {
  STUDENT: ['STUDENT'],
  QUESTION_MANAGER: ['QUESTION_MANAGER'],
  ACADEMIC_MANAGER: ['ACADEMIC_MANAGER'],
  EXAM_MANAGER: ['EXAM_MANAGER'],
  EVALUATOR: ['EVALUATOR'],
  ADMIN: [
    'ADMIN',
    'QUESTION_MANAGER',
    'ACADEMIC_MANAGER',
    'EXAM_MANAGER',
    'EVALUATOR',
  ],
  SUPERADMIN: [
    'STUDENT',
    'ADMIN',
    'SUPERADMIN',
    'QUESTION_MANAGER',
    'ACADEMIC_MANAGER',
    'EXAM_MANAGER',
    'EVALUATOR',
  ],
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
      ROLE_GRANTS[assignedRole]?.includes(requiredRole) ?? false,
    ),
  );
}
