CREATE SEQUENCE "trusted_institution_students_isa_seq" START WITH 1 INCREMENT BY 1;

CREATE FUNCTION "generate_isa_student_id"() RETURNS TEXT
LANGUAGE SQL
VOLATILE
AS $$
  SELECT 'ISA' ||
    CASE
      WHEN LENGTH(value::TEXT) < 3 THEN LPAD(value::TEXT, 3, '0')
      ELSE value::TEXT
    END
  FROM (SELECT nextval('trusted_institution_students_isa_seq') AS value) generated;
$$;

CREATE TEMPORARY TABLE "isa_student_id_migration" ON COMMIT DROP AS
SELECT
  "id",
  'ISA' ||
    CASE
      WHEN LENGTH(ROW_NUMBER() OVER (ORDER BY "created_at", "id")::TEXT) < 3
        THEN LPAD(ROW_NUMBER() OVER (ORDER BY "created_at", "id")::TEXT, 3, '0')
      ELSE ROW_NUMBER() OVER (ORDER BY "created_at", "id")::TEXT
    END AS "student_id",
  ROW_NUMBER() OVER (ORDER BY "created_at", "id") AS "sequence_number"
FROM "trusted_institution_students";

-- Move old values out of the way before assigning the compact sequential IDs.
UPDATE "trusted_institution_students"
SET "student_id" = 'MIG-' || UPPER(REPLACE("id"::TEXT, '-', ''));

UPDATE "institution_memberships" AS membership
SET "student_id" = 'MIG-' || UPPER(REPLACE(membership."id"::TEXT, '-', ''))
WHERE membership."trusted_record_id" IS NOT NULL;

UPDATE "trusted_institution_students" AS student
SET "student_id" = migration."student_id"
FROM "isa_student_id_migration" AS migration
WHERE student."id" = migration."id";

UPDATE "institution_memberships" AS membership
SET "student_id" = migration."student_id"
FROM "isa_student_id_migration" AS migration
WHERE membership."trusted_record_id" = migration."id";

SELECT setval(
  'trusted_institution_students_isa_seq',
  COALESCE((SELECT MAX("sequence_number") FROM "isa_student_id_migration"), 0) + 1,
  false
);

ALTER TABLE "trusted_institution_students"
ALTER COLUMN "student_id" SET DEFAULT generate_isa_student_id();
