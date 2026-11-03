CREATE TYPE "StudentCategory" AS ENUM ('INTERNAL', 'EXTERNAL');
CREATE TYPE "StudentPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

ALTER TABLE "institution_memberships"
  ADD COLUMN "student_category" "StudentCategory" NOT NULL DEFAULT 'EXTERNAL',
  ADD COLUMN "payment_status" "StudentPaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "paid_access_until" TIMESTAMPTZ(3);

UPDATE "institution_memberships"
SET "student_category" = 'INTERNAL', "payment_status" = 'NOT_REQUIRED'
WHERE "trusted_record_id" IS NOT NULL OR "method" = 'TRUSTED_ROSTER';

CREATE TABLE "student_access_audits" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "membership_id" UUID NOT NULL,
  "actor_user_id" UUID NOT NULL,
  "previous_category" "StudentCategory" NOT NULL,
  "new_category" "StudentCategory" NOT NULL,
  "previous_payment_status" "StudentPaymentStatus" NOT NULL,
  "new_payment_status" "StudentPaymentStatus" NOT NULL,
  "previous_access_until" TIMESTAMPTZ(3),
  "new_access_until" TIMESTAMPTZ(3),
  "reason" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_access_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_access_audits_membership_created_idx" ON "student_access_audits"("membership_id", "created_at");
CREATE INDEX "student_access_audits_actor_user_id_idx" ON "student_access_audits"("actor_user_id");
ALTER TABLE "student_access_audits" ADD CONSTRAINT "student_access_audits_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "institution_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_access_audits" ADD CONSTRAINT "student_access_audits_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
