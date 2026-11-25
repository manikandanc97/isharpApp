-- Additive enterprise demo test system migration

ALTER TABLE "questions"
  ADD COLUMN IF NOT EXISTS "is_restricted_for_demo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "demo_test_configurations"
  ADD COLUMN IF NOT EXISTS "pool_mode" VARCHAR(16) NOT NULL DEFAULT 'HYBRID',
  ADD COLUMN IF NOT EXISTS "selection_rules" JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS "blueprints" JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS "guest_access_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "show_results_immediately" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "show_solutions_after_submit" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "admission_cta_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "publish_status" VARCHAR(24) NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN IF NOT EXISTS "published_version_id" UUID,
  ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS "draft_snapshot" JSONB;

ALTER TABLE "demo_test_questions"
  ADD COLUMN IF NOT EXISTS "is_approved" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "added_by_id" UUID,
  ADD COLUMN IF NOT EXISTS "added_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "notes" VARCHAR(255);

CREATE INDEX IF NOT EXISTS "demo_test_questions_config_approved_idx"
  ON "demo_test_questions"("config_id", "is_approved");

CREATE TABLE IF NOT EXISTS "demo_configuration_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "config_id" VARCHAR(32) NOT NULL DEFAULT 'login-demo',
  "version_number" INTEGER NOT NULL,
  "status" VARCHAR(24) NOT NULL DEFAULT 'PUBLISHED',
  "snapshot" JSONB NOT NULL,
  "change_summary" VARCHAR(500),
  "created_by_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_configuration_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "demo_configuration_versions_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "demo_test_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "demo_config_versions_config_version_key"
  ON "demo_configuration_versions"("config_id", "version_number");
CREATE INDEX IF NOT EXISTS "demo_config_versions_config_created_idx"
  ON "demo_configuration_versions"("config_id", "created_at");

CREATE TABLE IF NOT EXISTS "demo_visitors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "guest_token_hash" VARCHAR(64) NOT NULL,
  "user_profile_id" UUID,
  "first_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "total_attempts" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "demo_visitors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "demo_visitors_guest_token_hash_key"
  ON "demo_visitors"("guest_token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "demo_visitors_user_profile_id_key"
  ON "demo_visitors"("user_profile_id");
CREATE INDEX IF NOT EXISTS "demo_visitors_last_seen_idx"
  ON "demo_visitors"("last_seen_at");

CREATE TABLE IF NOT EXISTS "demo_attempts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "visitor_id" UUID NOT NULL,
  "user_profile_id" UUID,
  "config_version_id" UUID,
  "is_preview" BOOLEAN NOT NULL DEFAULT false,
  "status" VARCHAR(24) NOT NULL DEFAULT 'IN_PROGRESS',
  "subject_mode" VARCHAR(32) NOT NULL,
  "language_mode" VARCHAR(8) NOT NULL,
  "question_count" SMALLINT NOT NULL,
  "duration_minutes" SMALLINT NOT NULL,
  "max_marks" SMALLINT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "instructions_en" TEXT,
  "instructions_ta" TEXT,
  "paper_fingerprint" VARCHAR(64) NOT NULL,
  "controlled_reuse_used" BOOLEAN NOT NULL DEFAULT false,
  "pool_exhausted" BOOLEAN NOT NULL DEFAULT false,
  "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "submitted_at" TIMESTAMPTZ(3),
  "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
  "total_score" DOUBLE PRECISION,
  "correct_count" SMALLINT,
  "incorrect_count" SMALLINT,
  "unanswered_count" SMALLINT,
  "accuracy_percentage" DOUBLE PRECISION,
  "result_snapshot" JSONB,
  "idempotency_key" VARCHAR(64),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "demo_attempts_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "demo_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "demo_attempts_config_version_id_fkey" FOREIGN KEY ("config_version_id") REFERENCES "demo_configuration_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "demo_attempts_idempotency_key_key"
  ON "demo_attempts"("idempotency_key");
CREATE INDEX IF NOT EXISTS "demo_attempts_visitor_preview_created_idx"
  ON "demo_attempts"("visitor_id", "is_preview", "created_at");
CREATE INDEX IF NOT EXISTS "demo_attempts_status_expires_idx"
  ON "demo_attempts"("status", "expires_at");
CREATE INDEX IF NOT EXISTS "demo_attempts_paper_fp_created_idx"
  ON "demo_attempts"("paper_fingerprint", "created_at");
CREATE INDEX IF NOT EXISTS "demo_attempts_preview_created_idx"
  ON "demo_attempts"("is_preview", "created_at");

CREATE TABLE IF NOT EXISTS "demo_attempt_questions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "attempt_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "position" SMALLINT NOT NULL,
  "option_order_json" JSONB NOT NULL,
  "selected_option_id" UUID,
  "numerical_answer" VARCHAR(100),
  "is_marked_for_review" BOOLEAN NOT NULL DEFAULT false,
  "is_visited" BOOLEAN NOT NULL DEFAULT false,
  "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
  "correct_marks" SMALLINT NOT NULL DEFAULT 4,
  "negative_marks" SMALLINT NOT NULL DEFAULT 1,
  "is_correct" BOOLEAN,
  "marks_awarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "demo_attempt_questions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "demo_attempt_questions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "demo_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "demo_attempt_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "demo_attempt_questions_attempt_pos_key"
  ON "demo_attempt_questions"("attempt_id", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "demo_attempt_questions_attempt_q_key"
  ON "demo_attempt_questions"("attempt_id", "question_id");
CREATE INDEX IF NOT EXISTS "demo_attempt_questions_question_idx"
  ON "demo_attempt_questions"("question_id");

CREATE TABLE IF NOT EXISTS "demo_visitor_question_exposures" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "visitor_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "content_fingerprint" VARCHAR(64),
  "equivalent_fingerprint" VARCHAR(64),
  "exposure_count" INTEGER NOT NULL DEFAULT 1,
  "first_exposed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_exposed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_visitor_exposures_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "demo_visitor_exposures_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "demo_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "demo_visitor_exposures_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "demo_visitor_exposures_visitor_q_key"
  ON "demo_visitor_question_exposures"("visitor_id", "question_id");
CREATE INDEX IF NOT EXISTS "demo_visitor_exposures_visitor_last_idx"
  ON "demo_visitor_question_exposures"("visitor_id", "last_exposed_at");
CREATE INDEX IF NOT EXISTS "demo_visitor_exposures_visitor_cfp_idx"
  ON "demo_visitor_question_exposures"("visitor_id", "content_fingerprint");
CREATE INDEX IF NOT EXISTS "demo_visitor_exposures_visitor_efp_idx"
  ON "demo_visitor_question_exposures"("visitor_id", "equivalent_fingerprint");

CREATE TABLE IF NOT EXISTS "demo_question_global_stats" (
  "question_id" UUID NOT NULL,
  "exposure_count" INTEGER NOT NULL DEFAULT 0,
  "last_exposed_at" TIMESTAMPTZ(3),
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_question_global_stats_pkey" PRIMARY KEY ("question_id"),
  CONSTRAINT "demo_question_global_stats_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "demo_global_stats_count_last_idx"
  ON "demo_question_global_stats"("exposure_count", "last_exposed_at");

CREATE TABLE IF NOT EXISTS "demo_admin_audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_user_id" UUID,
  "action" VARCHAR(64) NOT NULL,
  "details" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "demo_admin_audit_logs_created_idx"
  ON "demo_admin_audit_logs"("created_at");

CREATE TABLE IF NOT EXISTS "demo_analytics_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "visitor_id" UUID,
  "attempt_id" UUID,
  "event_type" VARCHAR(64) NOT NULL,
  "subject_mode" VARCHAR(32),
  "language_mode" VARCHAR(8),
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "demo_analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "demo_analytics_events_type_created_idx"
  ON "demo_analytics_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "demo_analytics_events_created_idx"
  ON "demo_analytics_events"("created_at");
