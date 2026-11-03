ALTER TABLE "user_profiles" ADD COLUMN "email" VARCHAR(320);
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

ALTER TABLE "trusted_institution_students"
  ADD COLUMN "full_name" VARCHAR(150),
  ADD COLUMN "email" VARCHAR(320);
CREATE UNIQUE INDEX "trusted_institution_students_email_key" ON "trusted_institution_students"("email");
CREATE INDEX "trusted_institution_students_email_active_idx" ON "trusted_institution_students"("email", "is_active");

ALTER TABLE "student_access_audits" ALTER COLUMN "actor_user_id" DROP NOT NULL;
