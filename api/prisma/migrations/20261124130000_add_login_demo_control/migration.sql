ALTER TABLE "mock_tests" ADD COLUMN "is_login_demo" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "demo_test_configurations" (
  "id" VARCHAR(32) NOT NULL DEFAULT 'login-demo',
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "title" VARCHAR(200) NOT NULL DEFAULT 'NEET Bilingual Diagnostic Demo Test',
  "code" VARCHAR(64) NOT NULL DEFAULT 'NEET-DEMO-2026',
  "instructions_en" TEXT,
  "instructions_ta" TEXT,
  "allowed_subjects" TEXT[] NOT NULL DEFAULT ARRAY['ALL', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']::TEXT[],
  "allowed_languages" TEXT[] NOT NULL DEFAULT ARRAY['en', 'ta']::TEXT[],
  "default_subject" VARCHAR(32) NOT NULL DEFAULT 'ALL',
  "default_language" VARCHAR(8) NOT NULL DEFAULT 'ta',
  "default_question_count" SMALLINT NOT NULL DEFAULT 9,
  "count_options" JSONB NOT NULL DEFAULT '[{"count":6,"durationMinutes":10,"label":"Quick Drill"},{"count":9,"durationMinutes":15,"label":"Standard NEET"},{"count":12,"durationMinutes":20,"label":"Deep Mock"}]'::JSONB,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_test_configurations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "demo_test_questions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "config_id" VARCHAR(32) NOT NULL,
  "question_id" UUID NOT NULL,
  "position" SMALLINT NOT NULL,
  CONSTRAINT "demo_test_questions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "demo_test_questions_config_question_key" ON "demo_test_questions"("config_id", "question_id");
CREATE UNIQUE INDEX "demo_test_questions_config_position_key" ON "demo_test_questions"("config_id", "position");
CREATE INDEX "demo_test_questions_question_id_idx" ON "demo_test_questions"("question_id");
ALTER TABLE "demo_test_questions" ADD CONSTRAINT "demo_test_questions_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "demo_test_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demo_test_questions" ADD CONSTRAINT "demo_test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "demo_test_configurations" ("id") VALUES ('login-demo');
