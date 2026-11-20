-- CreateEnum
CREATE TYPE "TestSeriesStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessmentTestType" AS ENUM ('CHAPTER_WISE', 'SUBJECT_WISE', 'UNIT_TEST', 'PART_TEST', 'REVISION_TEST', 'FULL_SYLLABUS', 'GRAND_TEST', 'CUSTOM_TEST');

-- CreateEnum
CREATE TYPE "AssessmentTestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TestAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'EVALUATED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ExamDeliveryMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "OfflineSessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'EVALUATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'DISQUALIFIED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestionType" ADD VALUE 'ASSERTION_REASON';
ALTER TYPE "QuestionType" ADD VALUE 'STATEMENT_BASED';
ALTER TYPE "QuestionType" ADD VALUE 'MATCH_FOLLOWING';

-- CreateTable
CREATE TABLE "test_series_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "position" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "test_series_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_series" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category_id" UUID NOT NULL,
    "academic_year" VARCHAR(32) NOT NULL DEFAULT '2026-2027',
    "cover_image_url" TEXT,
    "course_id" UUID,
    "status" "TestSeriesStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMPTZ(3),
    "end_date" TIMESTAMPTZ(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "test_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "test_series_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "instructions_en" TEXT,
    "instructions_ta" TEXT,
    "test_type" "AssessmentTestType" NOT NULL DEFAULT 'FULL_SYLLABUS',
    "status" "AssessmentTestStatus" NOT NULL DEFAULT 'DRAFT',
    "duration_minutes" SMALLINT NOT NULL DEFAULT 180,
    "total_questions" SMALLINT NOT NULL DEFAULT 180,
    "total_marks" SMALLINT NOT NULL DEFAULT 720,
    "passing_marks" SMALLINT,
    "has_negative_marking" BOOLEAN NOT NULL DEFAULT true,
    "correct_marks" SMALLINT NOT NULL DEFAULT 4,
    "negative_marks" SMALLINT NOT NULL DEFAULT 1,
    "max_attempts" SMALLINT NOT NULL DEFAULT 1,
    "randomize_questions" BOOLEAN NOT NULL DEFAULT true,
    "randomize_options" BOOLEAN NOT NULL DEFAULT true,
    "show_results_immediately" BOOLEAN NOT NULL DEFAULT false,
    "is_offline_available" BOOLEAN NOT NULL DEFAULT true,
    "order_index" SMALLINT NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMPTZ(3),
    "available_until" TIMESTAMPTZ(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "assessment_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_test_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessment_test_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "section" VARCHAR(50) NOT NULL DEFAULT 'A',
    "correct_marks" SMALLINT NOT NULL DEFAULT 4,
    "negative_marks" SMALLINT NOT NULL DEFAULT 1,
    "is_dropped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_blueprints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessment_test_id" UUID NOT NULL,
    "subject_code" VARCHAR(50) NOT NULL,
    "subject_name" VARCHAR(100) NOT NULL,
    "chapter_id" UUID,
    "section_name" VARCHAR(50) NOT NULL DEFAULT 'Section A',
    "total_questions" SMALLINT NOT NULL,
    "mandatory_count" SMALLINT NOT NULL,
    "correct_marks" SMALLINT NOT NULL DEFAULT 4,
    "negative_marks" SMALLINT NOT NULL DEFAULT 1,
    "order_index" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "test_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessment_test_id" UUID NOT NULL,
    "set_name" VARCHAR(16) NOT NULL,
    "set_key" VARCHAR(64) NOT NULL,
    "question_order_json" JSONB NOT NULL,
    "option_order_json" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paper_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessment_test_id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "membership_id" UUID,
    "paper_set_id" UUID,
    "attempt_number" SMALLINT NOT NULL DEFAULT 1,
    "mode" "ExamDeliveryMode" NOT NULL DEFAULT 'ONLINE',
    "status" "TestAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "submitted_at" TIMESTAMPTZ(3),
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "total_score" DOUBLE PRECISION,
    "random_seed" VARCHAR(64),
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "section" VARCHAR(50) NOT NULL,
    "correct_marks" SMALLINT NOT NULL DEFAULT 4,
    "negative_marks" SMALLINT NOT NULL DEFAULT 1,
    "is_dropped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_option_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_question_id" UUID NOT NULL,
    "canonical_option_id" UUID NOT NULL,
    "shuffled_position" SMALLINT NOT NULL,
    "displayed_label" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_option_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "numerical_answer" VARCHAR(100),
    "is_marked_for_review" BOOLEAN NOT NULL DEFAULT false,
    "is_visited" BOOLEAN NOT NULL DEFAULT true,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "is_correct" BOOLEAN,
    "marks_awarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "answered_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "assessment_test_id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "total_marks_scored" DOUBLE PRECISION NOT NULL,
    "max_marks" SMALLINT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "percentile" DOUBLE PRECISION,
    "rank" INTEGER,
    "correct_count" SMALLINT NOT NULL DEFAULT 0,
    "incorrect_count" SMALLINT NOT NULL DEFAULT 0,
    "unanswered_count" SMALLINT NOT NULL DEFAULT 0,
    "accuracy_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "physics_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "chemistry_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "biology_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "botany_score" DOUBLE PRECISION DEFAULT 0,
    "zoology_score" DOUBLE PRECISION DEFAULT 0,
    "subject_breakdown" JSONB,
    "calculated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_exam_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessment_test_id" UUID NOT NULL,
    "session_name" VARCHAR(150) NOT NULL,
    "center_name" VARCHAR(150) NOT NULL DEFAULT 'I-SHARP Main Campus',
    "room_number" VARCHAR(50),
    "exam_date" DATE NOT NULL,
    "start_time" VARCHAR(16) NOT NULL,
    "end_time" VARCHAR(16) NOT NULL,
    "status" "OfflineSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "total_assigned" SMALLINT NOT NULL DEFAULT 0,
    "total_present" SMALLINT NOT NULL DEFAULT 0,
    "total_absent" SMALLINT NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "offline_exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_student_attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "student_profile_id" UUID NOT NULL,
    "assigned_paper_set" VARCHAR(16) NOT NULL DEFAULT 'SET_A',
    "desk_number" VARCHAR(32),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "omr_sheet_code" VARCHAR(64),
    "marks_entered" BOOLEAN NOT NULL DEFAULT false,
    "evaluated_score" DOUBLE PRECISION,
    "raw_answers_json" JSONB,
    "recorded_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "offline_student_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_key_audits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessment_test_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "previous_key" VARCHAR(200),
    "new_key" VARCHAR(200) NOT NULL,
    "change_type" VARCHAR(50) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "changed_by_id" UUID NOT NULL,
    "recalculated" BOOLEAN NOT NULL DEFAULT false,
    "affected_attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_key_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "test_series_categories_slug_key" ON "test_series_categories"("slug");

-- CreateIndex
CREATE INDEX "test_series_categories_active_pos_idx" ON "test_series_categories"("is_active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "test_series_slug_key" ON "test_series"("slug");

-- CreateIndex
CREATE INDEX "test_series_category_status_idx" ON "test_series"("category_id", "status");

-- CreateIndex
CREATE INDEX "test_series_status_academic_year_idx" ON "test_series"("status", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_tests_code_key" ON "assessment_tests"("code");

-- CreateIndex
CREATE INDEX "assessment_tests_series_order_idx" ON "assessment_tests"("test_series_id", "order_index");

-- CreateIndex
CREATE INDEX "assessment_tests_status_scheduled_idx" ON "assessment_tests"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "assessment_test_questions_question_id_idx" ON "assessment_test_questions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_test_questions_test_q_key" ON "assessment_test_questions"("assessment_test_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_test_questions_test_pos_key" ON "assessment_test_questions"("assessment_test_id", "position");

-- CreateIndex
CREATE INDEX "test_blueprints_test_order_idx" ON "test_blueprints"("assessment_test_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "paper_sets_test_set_key" ON "paper_sets"("set_key");

-- CreateIndex
CREATE INDEX "paper_sets_test_idx" ON "paper_sets"("assessment_test_id");

-- CreateIndex
CREATE INDEX "test_attempts_student_status_idx" ON "test_attempts"("student_profile_id", "status");

-- CreateIndex
CREATE INDEX "test_attempts_test_status_idx" ON "test_attempts"("assessment_test_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "test_attempts_test_student_attempt_key" ON "test_attempts"("assessment_test_id", "student_profile_id", "attempt_number");

-- CreateIndex
CREATE INDEX "attempt_questions_question_id_idx" ON "attempt_questions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_questions_attempt_position_key" ON "attempt_questions"("attempt_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_questions_attempt_question_key" ON "attempt_questions"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_option_mapping_pos_key" ON "attempt_option_mappings"("attempt_question_id", "shuffled_position");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_option_mapping_opt_key" ON "attempt_option_mappings"("attempt_question_id", "canonical_option_id");

-- CreateIndex
CREATE INDEX "attempt_answers_attempt_idx" ON "attempt_answers"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_answers_attempt_question_key" ON "attempt_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_attempt_id_key" ON "test_results"("attempt_id");

-- CreateIndex
CREATE INDEX "test_results_test_score_idx" ON "test_results"("assessment_test_id", "total_marks_scored");

-- CreateIndex
CREATE INDEX "test_results_student_idx" ON "test_results"("student_profile_id");

-- CreateIndex
CREATE INDEX "offline_exam_sessions_test_status_idx" ON "offline_exam_sessions"("assessment_test_id", "status");

-- CreateIndex
CREATE INDEX "offline_attendance_session_status_idx" ON "offline_student_attendance"("session_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "offline_attendance_session_student_key" ON "offline_student_attendance"("session_id", "student_profile_id");

-- CreateIndex
CREATE INDEX "answer_key_audits_test_created_idx" ON "answer_key_audits"("assessment_test_id", "created_at");

-- AddForeignKey
ALTER TABLE "test_series" ADD CONSTRAINT "test_series_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "test_series_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_series" ADD CONSTRAINT "test_series_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_series" ADD CONSTRAINT "test_series_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_tests" ADD CONSTRAINT "assessment_tests_test_series_id_fkey" FOREIGN KEY ("test_series_id") REFERENCES "test_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_tests" ADD CONSTRAINT "assessment_tests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_test_questions" ADD CONSTRAINT "assessment_test_questions_assessment_test_id_fkey" FOREIGN KEY ("assessment_test_id") REFERENCES "assessment_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_test_questions" ADD CONSTRAINT "assessment_test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_blueprints" ADD CONSTRAINT "test_blueprints_assessment_test_id_fkey" FOREIGN KEY ("assessment_test_id") REFERENCES "assessment_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_blueprints" ADD CONSTRAINT "test_blueprints_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_sets" ADD CONSTRAINT "paper_sets_assessment_test_id_fkey" FOREIGN KEY ("assessment_test_id") REFERENCES "assessment_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_assessment_test_id_fkey" FOREIGN KEY ("assessment_test_id") REFERENCES "assessment_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "institution_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_option_mappings" ADD CONSTRAINT "attempt_option_mappings_attempt_question_id_fkey" FOREIGN KEY ("attempt_question_id") REFERENCES "attempt_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_option_mappings" ADD CONSTRAINT "attempt_option_mappings_canonical_option_id_fkey" FOREIGN KEY ("canonical_option_id") REFERENCES "question_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_assessment_test_id_fkey" FOREIGN KEY ("assessment_test_id") REFERENCES "assessment_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_exam_sessions" ADD CONSTRAINT "offline_exam_sessions_assessment_test_id_fkey" FOREIGN KEY ("assessment_test_id") REFERENCES "assessment_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_exam_sessions" ADD CONSTRAINT "offline_exam_sessions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_student_attendance" ADD CONSTRAINT "offline_student_attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "offline_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_student_attendance" ADD CONSTRAINT "offline_student_attendance_student_profile_id_fkey" FOREIGN KEY ("student_profile_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_student_attendance" ADD CONSTRAINT "offline_student_attendance_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_key_audits" ADD CONSTRAINT "answer_key_audits_assessment_test_id_fkey" FOREIGN KEY ("assessment_test_id") REFERENCES "assessment_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_key_audits" ADD CONSTRAINT "answer_key_audits_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_key_audits" ADD CONSTRAINT "answer_key_audits_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
