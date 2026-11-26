-- CreateEnum
CREATE TYPE "DemoLeadFollowUpStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'JOINED', 'NOT_INTERESTED');

-- CreateEnum
CREATE TYPE "DemoVerificationMethod" AS ENUM ('MOCK', 'SMS');

-- CreateEnum
CREATE TYPE "DemoOtpChallengeStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "demo_attempts" ADD COLUMN     "lead_id" UUID,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "demo_question_global_stats" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "demo_test_configurations" ADD COLUMN     "default_duration_minutes" SMALLINT NOT NULL DEFAULT 20,
ADD COLUMN     "exam_category" VARCHAR(32) NOT NULL DEFAULT 'NEET',
ALTER COLUMN "default_question_count" SET DEFAULT 15,
ALTER COLUMN "count_options" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "demo_visitor_question_exposures" RENAME CONSTRAINT "demo_visitor_exposures_pkey" TO "demo_visitor_question_exposures_pkey";

-- AlterTable
ALTER TABLE "demo_visitors" ALTER COLUMN "last_seen_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "demo_leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "normalized_phone" VARCHAR(20) NOT NULL,
    "visitor_id" UUID NOT NULL,
    "verification_method" "DemoVerificationMethod" NOT NULL DEFAULT 'MOCK',
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "verified_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "first_access_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_access_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "latest_score" DOUBLE PRECISION,
    "latest_max_marks" SMALLINT,
    "latest_percentage" DOUBLE PRECISION,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "consent_timestamp" TIMESTAMPTZ(3),
    "follow_up_status" "DemoLeadFollowUpStatus" NOT NULL DEFAULT 'NEW',
    "admin_notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "demo_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_otp_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "normalized_phone" VARCHAR(20) NOT NULL,
    "otp_hash" VARCHAR(128) NOT NULL,
    "verification_method" "DemoVerificationMethod" NOT NULL DEFAULT 'MOCK',
    "status" "DemoOtpChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "attempt_count" SMALLINT NOT NULL DEFAULT 0,
    "max_attempts" SMALLINT NOT NULL DEFAULT 5,
    "resend_count" SMALLINT NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "verified_at" TIMESTAMPTZ(3),
    "consumed_at" TIMESTAMPTZ(3),
    "request_ip" VARCHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "demo_otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_access_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "visitor_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "verification_method" "DemoVerificationMethod" NOT NULL DEFAULT 'MOCK',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_access_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demo_leads_normalized_phone_key" ON "demo_leads"("normalized_phone");

-- CreateIndex
CREATE UNIQUE INDEX "demo_leads_visitor_id_key" ON "demo_leads"("visitor_id");

-- CreateIndex
CREATE INDEX "demo_leads_followup_created_idx" ON "demo_leads"("follow_up_status", "created_at");

-- CreateIndex
CREATE INDEX "demo_leads_consent_created_idx" ON "demo_leads"("marketing_consent", "created_at");

-- CreateIndex
CREATE INDEX "demo_leads_last_access_idx" ON "demo_leads"("last_access_at");

-- CreateIndex
CREATE INDEX "demo_otp_challenges_phone_status_idx" ON "demo_otp_challenges"("normalized_phone", "status", "created_at");

-- CreateIndex
CREATE INDEX "demo_otp_challenges_expires_idx" ON "demo_otp_challenges"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "demo_access_sessions_token_hash_key" ON "demo_access_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "demo_access_sessions_lead_expires_idx" ON "demo_access_sessions"("lead_id", "expires_at");

-- CreateIndex
CREATE INDEX "demo_access_sessions_visitor_expires_idx" ON "demo_access_sessions"("visitor_id", "expires_at");

-- CreateIndex
CREATE INDEX "demo_attempts_lead_created_idx" ON "demo_attempts"("lead_id", "created_at");

-- RenameForeignKey
ALTER TABLE "demo_visitor_question_exposures" RENAME CONSTRAINT "demo_visitor_exposures_question_id_fkey" TO "demo_visitor_question_exposures_question_id_fkey";

-- RenameForeignKey
ALTER TABLE "demo_visitor_question_exposures" RENAME CONSTRAINT "demo_visitor_exposures_visitor_id_fkey" TO "demo_visitor_question_exposures_visitor_id_fkey";

-- AddForeignKey
ALTER TABLE "demo_attempts" ADD CONSTRAINT "demo_attempts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "demo_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_leads" ADD CONSTRAINT "demo_leads_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "demo_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_access_sessions" ADD CONSTRAINT "demo_access_sessions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "demo_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

