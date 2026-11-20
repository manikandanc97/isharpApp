import type { RoleName } from '@/lib/auth-session';

export const roleGrants: Readonly<Record<RoleName, readonly RoleName[]>> = {
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

export function hasRequiredRole(
  assignedRoles: readonly RoleName[],
  requiredRole: RoleName,
): boolean {
  return assignedRoles.some(
    (role) => roleGrants[role]?.includes(requiredRole) ?? false,
  );
}
