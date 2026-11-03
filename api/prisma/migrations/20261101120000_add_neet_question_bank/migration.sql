CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CORRECT', 'MULTIPLE_CORRECT', 'NUMERICAL');
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "QuestionLanguage" AS ENUM ('ENGLISH', 'TAMIL', 'BILINGUAL');
CREATE TYPE "MockTestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "questions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "external_id" VARCHAR(64) NOT NULL,
  "course_subject_id" UUID NOT NULL,
  "chapter_id" UUID,
  "type" "QuestionType" NOT NULL DEFAULT 'SINGLE_CORRECT',
  "language" "QuestionLanguage" NOT NULL DEFAULT 'BILINGUAL',
  "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
  "text_en" TEXT,
  "text_ta" TEXT,
  "question_image_url" TEXT,
  "solution_en" TEXT,
  "solution_ta" TEXT,
  "solution_image_url" TEXT,
  "numerical_answer" VARCHAR(100),
  "correct_marks" SMALLINT NOT NULL DEFAULT 4,
  "negative_marks" SMALLINT NOT NULL DEFAULT 1,
  "source" VARCHAR(200),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "questions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "questions_content_check" CHECK ("text_en" IS NOT NULL OR "text_ta" IS NOT NULL OR "question_image_url" IS NOT NULL),
  CONSTRAINT "questions_marks_check" CHECK ("correct_marks" > 0 AND "negative_marks" >= 0)
);

CREATE TABLE "question_options" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "question_id" UUID NOT NULL,
  "label" VARCHAR(8) NOT NULL,
  "text_en" TEXT,
  "text_ta" TEXT,
  "image_url" TEXT,
  "is_correct" BOOLEAN NOT NULL DEFAULT false,
  "position" SMALLINT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "question_options_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "question_options_content_check" CHECK ("text_en" IS NOT NULL OR "text_ta" IS NOT NULL OR "image_url" IS NOT NULL)
);

CREATE TABLE "mock_tests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(64) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "duration_minutes" SMALLINT NOT NULL DEFAULT 180,
  "total_marks" SMALLINT NOT NULL DEFAULT 720,
  "status" "MockTestStatus" NOT NULL DEFAULT 'DRAFT',
  "instructions_en" TEXT,
  "instructions_ta" TEXT,
  "scheduled_at" TIMESTAMPTZ(3),
  "available_until" TIMESTAMPTZ(3),
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "mock_tests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mock_tests_limits_check" CHECK ("duration_minutes" > 0 AND "total_marks" > 0)
);

CREATE TABLE "mock_test_questions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "mock_test_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "position" SMALLINT NOT NULL,
  "section" VARCHAR(50) NOT NULL,
  "correct_marks" SMALLINT NOT NULL DEFAULT 4,
  "negative_marks" SMALLINT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mock_test_questions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "questions_external_id_key" ON "questions"("external_id");
CREATE INDEX "questions_course_subject_chapter_idx" ON "questions"("course_subject_id", "chapter_id");
CREATE INDEX "questions_type_difficulty_active_idx" ON "questions"("type", "difficulty", "is_active");
CREATE INDEX "questions_created_by_id_idx" ON "questions"("created_by_id");
CREATE UNIQUE INDEX "question_options_question_id_label_key" ON "question_options"("question_id", "label");
CREATE UNIQUE INDEX "question_options_question_id_position_key" ON "question_options"("question_id", "position");
CREATE UNIQUE INDEX "mock_tests_code_key" ON "mock_tests"("code");
CREATE INDEX "mock_tests_status_scheduled_at_idx" ON "mock_tests"("status", "scheduled_at");
CREATE INDEX "mock_tests_created_by_id_idx" ON "mock_tests"("created_by_id");
CREATE UNIQUE INDEX "mock_test_questions_test_question_key" ON "mock_test_questions"("mock_test_id", "question_id");
CREATE UNIQUE INDEX "mock_test_questions_test_position_key" ON "mock_test_questions"("mock_test_id", "position");
CREATE INDEX "mock_test_questions_question_id_idx" ON "mock_test_questions"("question_id");

ALTER TABLE "questions" ADD CONSTRAINT "questions_course_subject_id_fkey" FOREIGN KEY ("course_subject_id") REFERENCES "course_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mock_test_questions" ADD CONSTRAINT "mock_test_questions_mock_test_id_fkey" FOREIGN KEY ("mock_test_id") REFERENCES "mock_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mock_test_questions" ADD CONSTRAINT "mock_test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
