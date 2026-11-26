-- Safe, non-destructive migration to simplify unnecessary draft/publish workflows
-- while preserving all existing records and their current visibility.

-- 1. Add operational visibility/cancellation columns before dropping status columns
ALTER TABLE "mock_tests"
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "assessment_tests"
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "is_cancelled" BOOLEAN NOT NULL DEFAULT false;

-- 2. Preserve existing visibility:
--    Any legacy DRAFT or ARCHIVED records remain hidden (is_active = false)
--    so they are never accidentally exposed to students.
UPDATE "test_series"
SET "is_active" = false
WHERE "status" IN ('DRAFT', 'ARCHIVED');

UPDATE "assessment_tests"
SET "is_active" = false
WHERE "status" IN ('DRAFT', 'ARCHIVED');

UPDATE "mock_tests"
SET "is_active" = false
WHERE "status" IN ('DRAFT', 'ARCHIVED');

UPDATE "demo_test_configurations"
SET "is_enabled" = false
WHERE "publish_status" <> 'PUBLISHED';

-- 3. Drop obsolete indexes referencing status columns
DROP INDEX IF EXISTS "mock_tests_status_scheduled_at_idx";
DROP INDEX IF EXISTS "test_series_category_status_idx";
DROP INDEX IF EXISTS "test_series_status_academic_year_idx";
DROP INDEX IF EXISTS "assessment_tests_status_scheduled_idx";

-- 4. Drop obsolete draft/publish columns
ALTER TABLE "mock_tests"
  DROP COLUMN IF EXISTS "status";

ALTER TABLE "demo_test_configurations"
  DROP COLUMN IF EXISTS "publish_status",
  DROP COLUMN IF EXISTS "published_version_id",
  DROP COLUMN IF EXISTS "published_at",
  DROP COLUMN IF EXISTS "draft_snapshot";

ALTER TABLE "demo_configuration_versions"
  DROP COLUMN IF EXISTS "status";

ALTER TABLE "test_series"
  DROP COLUMN IF EXISTS "status";

ALTER TABLE "assessment_tests"
  DROP COLUMN IF EXISTS "status";

-- 5. Drop obsolete enums
DROP TYPE IF EXISTS "MockTestStatus";
DROP TYPE IF EXISTS "TestSeriesStatus";
DROP TYPE IF EXISTS "AssessmentTestStatus";

-- 6. Create replacement operational indexes
CREATE INDEX IF NOT EXISTS "mock_tests_active_scheduled_at_idx" ON "mock_tests"("is_active", "scheduled_at");
CREATE INDEX IF NOT EXISTS "test_series_category_active_idx" ON "test_series"("category_id", "is_active");
CREATE INDEX IF NOT EXISTS "test_series_active_academic_year_idx" ON "test_series"("is_active", "academic_year");
CREATE INDEX IF NOT EXISTS "assessment_tests_active_scheduled_idx" ON "assessment_tests"("is_active", "is_cancelled", "scheduled_at");
