-- Student UUIDs remain institution_memberships.id. Only the human-readable
-- code is rotated when a student's enrollment category changes.

BEGIN;

CREATE SEQUENCE "student_code_internal_seq" START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE "student_code_external_seq" START WITH 1 INCREMENT BY 1;

CREATE FUNCTION "generate_student_code"("category" "StudentCategory") RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  sequence_value BIGINT;
BEGIN
  IF category = 'INTERNAL' THEN
    sequence_value := nextval('student_code_internal_seq');
    RETURN 'ISAI' || LPAD(sequence_value::TEXT, GREATEST(4, LENGTH(sequence_value::TEXT)), '0');
  END IF;

  sequence_value := nextval('student_code_external_seq');
  RETURN 'ISAE' || LPAD(sequence_value::TEXT, GREATEST(4, LENGTH(sequence_value::TEXT)), '0');
END;
$$;

CREATE TEMPORARY TABLE "student_code_roster_backfill" ON COMMIT DROP AS
SELECT
  "id",
  'ISAI' || LPAD(
    ROW_NUMBER() OVER (ORDER BY "created_at", "id")::TEXT,
    GREATEST(4, LENGTH(ROW_NUMBER() OVER (ORDER BY "created_at", "id")::TEXT)),
    '0'
  ) AS "student_code",
  ROW_NUMBER() OVER (ORDER BY "created_at", "id") AS "sequence_number"
FROM "trusted_institution_students";

CREATE TEMPORARY TABLE "student_code_membership_backfill" ON COMMIT DROP AS
WITH internal_unlinked AS (
  SELECT
    membership."id",
    ROW_NUMBER() OVER (ORDER BY membership."created_at", membership."id") AS "position"
  FROM "institution_memberships" membership
  WHERE membership."student_category" = 'INTERNAL'
    AND membership."trusted_record_id" IS NULL
),
external_students AS (
  SELECT
    membership."id",
    ROW_NUMBER() OVER (ORDER BY membership."created_at", membership."id") AS "position"
  FROM "institution_memberships" membership
  WHERE membership."student_category" = 'EXTERNAL'
)
SELECT
  membership."id",
  CASE
    WHEN membership."student_category" = 'INTERNAL' AND roster."student_code" IS NOT NULL
      THEN roster."student_code"
    WHEN membership."student_category" = 'INTERNAL' THEN
      'ISAI' || LPAD(
        ((SELECT COUNT(*) FROM "student_code_roster_backfill") + internal_unlinked."position")::TEXT,
        GREATEST(4, LENGTH(((SELECT COUNT(*) FROM "student_code_roster_backfill") + internal_unlinked."position")::TEXT)),
        '0'
      )
    ELSE 'ISAE' || LPAD(
      external_students."position"::TEXT,
      GREATEST(4, LENGTH(external_students."position"::TEXT)),
      '0'
    )
  END AS "student_code",
  membership."student_category" AS "student_type"
FROM "institution_memberships" membership
LEFT JOIN "student_code_roster_backfill" roster
  ON roster."id" = membership."trusted_record_id"
LEFT JOIN internal_unlinked ON internal_unlinked."id" = membership."id"
LEFT JOIN external_students ON external_students."id" = membership."id";

-- Move current values aside so existing unique indexes cannot conflict while
-- deterministic codes are assigned.
UPDATE "trusted_institution_students"
SET "student_id" = 'MIG-' || UPPER(REPLACE("id"::TEXT, '-', ''));

UPDATE "institution_memberships"
SET "student_id" = 'MIG-' || UPPER(REPLACE("id"::TEXT, '-', ''));

UPDATE "trusted_institution_students" roster
SET "student_id" = backfill."student_code"
FROM "student_code_roster_backfill" backfill
WHERE roster."id" = backfill."id";

UPDATE "institution_memberships" membership
SET "student_id" = backfill."student_code"
FROM "student_code_membership_backfill" backfill
WHERE membership."id" = backfill."id";

SELECT setval(
  'student_code_internal_seq',
  GREATEST(
    (SELECT COUNT(*) FROM "student_code_roster_backfill") +
      (SELECT COUNT(*) FROM "institution_memberships" WHERE "student_category" = 'INTERNAL' AND "trusted_record_id" IS NULL) + 1,
    1
  ),
  false
);

SELECT setval(
  'student_code_external_seq',
  GREATEST(
    (SELECT COUNT(*) FROM "institution_memberships" WHERE "student_category" = 'EXTERNAL') + 1,
    1
  ),
  false
);

ALTER TABLE "trusted_institution_students"
  ALTER COLUMN "student_id" SET DEFAULT generate_student_code('INTERNAL'::"StudentCategory");
ALTER TABLE "institution_memberships"
  ALTER COLUMN "student_id" SET DEFAULT generate_student_code('EXTERNAL'::"StudentCategory");

ALTER TABLE "trusted_institution_students"
  DROP CONSTRAINT "trusted_institution_students_student_id_canonical_check";
ALTER TABLE "trusted_institution_students"
  ADD CONSTRAINT "trusted_institution_students_student_code_check"
  CHECK ("student_id" ~ '^ISAI[0-9]{4,}$');

ALTER TABLE "institution_memberships"
  DROP CONSTRAINT "institution_memberships_student_id_canonical_check";
ALTER TABLE "institution_memberships"
  ADD CONSTRAINT "institution_memberships_student_code_check"
  CHECK (
    ("student_category" = 'INTERNAL' AND "student_id" ~ '^ISAI[0-9]{4,}$') OR
    ("student_category" = 'EXTERNAL' AND "student_id" ~ '^ISAE[0-9]{4,}$')
  );

ALTER TABLE "user_profiles" ADD COLUMN "phone" VARCHAR(32);
CREATE UNIQUE INDEX "user_profiles_phone_key" ON "user_profiles"("phone");

CREATE TABLE "student_id_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "student_code" VARCHAR(64) NOT NULL,
  "student_type" "StudentCategory" NOT NULL,
  "is_current" BOOLEAN NOT NULL DEFAULT true,
  "changed_by" UUID,
  "change_reason" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_id_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_id_history_code_check" CHECK (
    ("student_type" = 'INTERNAL' AND "student_code" ~ '^ISAI[0-9]{4,}$') OR
    ("student_type" = 'EXTERNAL' AND "student_code" ~ '^ISAE[0-9]{4,}$')
  ),
  CONSTRAINT "student_id_history_reason_check" CHECK (char_length(btrim("change_reason")) BETWEEN 3 AND 500)
);

CREATE UNIQUE INDEX "student_id_history_student_code_key" ON "student_id_history"("student_code");
CREATE UNIQUE INDEX "student_id_history_one_current_key" ON "student_id_history"("student_id") WHERE "is_current";
CREATE INDEX "student_id_history_student_created_idx" ON "student_id_history"("student_id", "created_at");
CREATE INDEX "student_id_history_changed_by_idx" ON "student_id_history"("changed_by");

ALTER TABLE "student_id_history" ADD CONSTRAINT "student_id_history_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "institution_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_id_history" ADD CONSTRAINT "student_id_history_changed_by_fkey"
  FOREIGN KEY ("changed_by") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "student_id_history" (
  "student_id", "student_code", "student_type", "is_current", "change_reason"
)
SELECT "id", "student_id", "student_category", true, 'ENTERPRISE_STUDENT_ID_BACKFILL'
FROM "institution_memberships";

CREATE FUNCTION "sync_student_id_history"() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  actor_setting TEXT;
  reason_setting TEXT;
BEGIN
  actor_setting := NULLIF(current_setting('app.student_id_changed_by', true), '');
  reason_setting := NULLIF(current_setting('app.student_id_change_reason', true), '');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO "student_id_history" (
      "student_id", "student_code", "student_type", "is_current", "changed_by", "change_reason"
    ) VALUES (
      NEW."id", NEW."student_id", NEW."student_category", true,
      actor_setting::UUID, COALESCE(reason_setting, 'STUDENT_ACCOUNT_CREATED')
    );
    RETURN NEW;
  END IF;

  IF OLD."student_id" IS DISTINCT FROM NEW."student_id"
     OR OLD."student_category" IS DISTINCT FROM NEW."student_category" THEN
    UPDATE "student_id_history"
    SET "is_current" = false
    WHERE "student_id" = NEW."id" AND "is_current" = true;

    INSERT INTO "student_id_history" (
      "student_id", "student_code", "student_type", "is_current", "changed_by", "change_reason"
    ) VALUES (
      NEW."id", NEW."student_id", NEW."student_category", true,
      actor_setting::UUID, COALESCE(reason_setting, 'STUDENT_ID_CHANGED')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "institution_membership_student_id_history_trigger"
AFTER INSERT OR UPDATE OF "student_id", "student_category" ON "institution_memberships"
FOR EACH ROW EXECUTE FUNCTION "sync_student_id_history"();

DROP FUNCTION "generate_isa_student_id"();
DROP SEQUENCE "trusted_institution_students_isa_seq";

COMMIT;
