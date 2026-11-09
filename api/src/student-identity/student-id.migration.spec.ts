import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../../prisma/migrations/20261109120000_enterprise_student_identity/migration.sql',
    import.meta.url,
  ),
  'utf8',
);

describe('enterprise student identity migration', () => {
  it('uses independent atomic PostgreSQL sequences without truncating growth', () => {
    expect(migration).toContain('CREATE SEQUENCE "student_code_internal_seq"');
    expect(migration).toContain('CREATE SEQUENCE "student_code_external_seq"');
    expect(migration).toContain("nextval('student_code_internal_seq')");
    expect(migration).toContain("nextval('student_code_external_seq')");
    expect(migration).toContain(
      "LPAD(sequence_value::TEXT, GREATEST(4, LENGTH(sequence_value::TEXT)), '0')",
    );
    expect(migration).not.toMatch(/RIGHT\s*\(/i);
  });

  it('backfills by the stored enrollment category and enforces uniqueness', () => {
    expect(migration).toContain('membership."student_category"');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "student_id_history_student_code_key"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "student_id_history_one_current_key"',
    );
  });

  it('automatically records every code or type change', () => {
    expect(migration).toContain('CREATE FUNCTION "sync_student_id_history"()');
    expect(migration).toContain(
      'AFTER INSERT OR UPDATE OF "student_id", "student_category"',
    );
  });
});
