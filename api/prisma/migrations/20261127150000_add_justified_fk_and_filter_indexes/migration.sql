-- Phase 2: Justified additive indexes for FK deletes/counts and standalone chapter filtering.
-- Non-destructive: creates indexes only; no tables, columns, constraints, or existing indexes are modified or dropped.

-- 1. Standalone chapterId filtering in Question Bank & Question Selection Engine
CREATE INDEX IF NOT EXISTS "questions_chapter_id_idx" ON "questions"("chapter_id");

-- 2. Foreign key CASCADE index for question deletion
CREATE INDEX IF NOT EXISTS "demo_visitor_exposures_question_id_idx" ON "demo_visitor_question_exposures"("question_id");

-- 3. Foreign key CASCADE index for QuestionOption replacement during question updates
CREATE INDEX IF NOT EXISTS "attempt_option_mapping_canonical_opt_idx" ON "attempt_option_mappings"("canonical_option_id");

-- 4. Foreign key RESTRICT / count index for question deletion & usage checks
CREATE INDEX IF NOT EXISTS "attempt_answers_question_id_idx" ON "attempt_answers"("question_id");

-- 5. Foreign key SET NULL index for QuestionOption replacement during question updates
CREATE INDEX IF NOT EXISTS "attempt_answers_selected_opt_idx" ON "attempt_answers"("selected_option_id");

-- 6. Foreign key RESTRICT / count index for question deletion & usage checks
CREATE INDEX IF NOT EXISTS "answer_key_audits_question_id_idx" ON "answer_key_audits"("question_id");
