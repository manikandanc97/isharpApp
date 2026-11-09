import type { Prisma, StudentCategory } from '../generated/prisma/client.js';

export async function generateStudentCode(
  tx: Prisma.TransactionClient,
  category: StudentCategory,
): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ studentCode: string }>>`
    SELECT generate_student_code(${category}::"StudentCategory") AS "studentCode"
  `;
  const code = rows[0]?.studentCode;
  if (!code) throw new Error('Student code generation failed');
  return code;
}

export async function setStudentIdAuditContext(
  tx: Prisma.TransactionClient,
  changedBy: string | null,
  reason: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT
      set_config('app.student_id_changed_by', ${changedBy ?? ''}, true),
      set_config('app.student_id_change_reason', ${reason}, true)
  `;
}
