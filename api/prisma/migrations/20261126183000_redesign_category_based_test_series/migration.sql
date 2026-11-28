-- Non-destructive migration for category-based Test Series redesign
-- Preserves all existing TestSeries, AssessmentTest, TestAttempt, TestResult, and Question records.

ALTER TABLE "assessment_tests"
  ADD COLUMN IF NOT EXISTS "category_id" UUID,
  ADD COLUMN IF NOT EXISTS "exam_pattern_mode" VARCHAR(32) NOT NULL DEFAULT 'DEFAULT_NEET',
  ADD COLUMN IF NOT EXISTS "exam_pattern_version" VARCHAR(32) NOT NULL DEFAULT 'NEET_2026_V1',
  ADD COLUMN IF NOT EXISTS "question_selection_mode" VARCHAR(32) NOT NULL DEFAULT 'AUTOMATIC',
  ADD COLUMN IF NOT EXISTS "duration_mode" VARCHAR(32) NOT NULL DEFAULT 'AUTOMATIC',
  ADD COLUMN IF NOT EXISTS "subject_distribution" JSONB;

-- Backfill category_id from existing parent test_series records
UPDATE "assessment_tests" AS at
SET "category_id" = ts."category_id"
FROM "test_series" AS ts
WHERE at."test_series_id" = ts."id"
  AND at."category_id" IS NULL;

-- Add foreign key constraint safely if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessment_tests_category_id_fkey'
  ) THEN
    ALTER TABLE "assessment_tests"
      ADD CONSTRAINT "assessment_tests_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "test_series_categories"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Add index for fast category-scoped test queries
CREATE INDEX IF NOT EXISTS "assessment_tests_category_active_idx"
  ON "assessment_tests"("category_id", "is_active");
