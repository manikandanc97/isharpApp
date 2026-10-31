-- Generated with Prisma CLI 7.10.1 from the pre-verification schema to schema.prisma.
-- Additive only: no existing academic or identity data is changed.

-- CreateEnum
CREATE TYPE "MembershipVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "MembershipVerificationMethod" AS ENUM ('TRUSTED_ROSTER', 'MANUAL_ADMIN');

-- CreateTable
CREATE TABLE "trusted_institution_students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" VARCHAR(64) NOT NULL,
    "auth_user_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "trusted_institution_students_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "trusted_institution_students_student_id_canonical_check"
      CHECK (char_length("student_id") BETWEEN 1 AND 64
        AND "student_id" = upper(btrim("student_id"))
        AND "student_id" !~ '[[:cntrl:]]')
);

-- CreateTable
CREATE TABLE "institution_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "student_id" VARCHAR(64) NOT NULL,
    "status" "MembershipVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "method" "MembershipVerificationMethod",
    "trusted_record_id" UUID,
    "verified_by_id" UUID,
    "verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "institution_memberships_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "institution_memberships_student_id_canonical_check"
      CHECK (char_length("student_id") BETWEEN 1 AND 64
        AND "student_id" = upper(btrim("student_id"))
        AND "student_id" !~ '[[:cntrl:]]'),
    CONSTRAINT "institution_memberships_verified_state_check"
      CHECK (
        ("status" = 'VERIFIED' AND "method" IS NOT NULL AND "verified_at" IS NOT NULL)
        OR
        ("status" <> 'VERIFIED' AND "verified_at" IS NULL AND "verified_by_id" IS NULL)
      ),
    CONSTRAINT "institution_memberships_verification_source_check"
      CHECK (
        "status" <> 'VERIFIED'
        OR ("method" = 'TRUSTED_ROSTER' AND "trusted_record_id" IS NOT NULL AND "verified_by_id" IS NULL)
        OR ("method" = 'MANUAL_ADMIN' AND "verified_by_id" IS NOT NULL)
      )
);

-- CreateTable
CREATE TABLE "membership_verification_audits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "membership_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "previous_status" "MembershipVerificationStatus",
    "new_status" "MembershipVerificationStatus" NOT NULL,
    "method" "MembershipVerificationMethod",
    "reason" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_verification_audits_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "membership_verification_audits_reason_check"
      CHECK (char_length(btrim("reason")) BETWEEN 3 AND 500)
);

-- CreateIndex
CREATE UNIQUE INDEX "trusted_institution_students_student_id_key" ON "trusted_institution_students"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_institution_students_auth_user_id_key" ON "trusted_institution_students"("auth_user_id");

-- CreateIndex
CREATE INDEX "trusted_institution_students_is_active_idx" ON "trusted_institution_students"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "institution_memberships_user_id_key" ON "institution_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "institution_memberships_student_id_key" ON "institution_memberships"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "institution_memberships_trusted_record_id_key" ON "institution_memberships"("trusted_record_id");

-- CreateIndex
CREATE INDEX "institution_memberships_status_idx" ON "institution_memberships"("status");

-- CreateIndex
CREATE INDEX "institution_memberships_verified_by_id_idx" ON "institution_memberships"("verified_by_id");

-- CreateIndex
CREATE INDEX "membership_verification_audits_membership_created_idx" ON "membership_verification_audits"("membership_id", "created_at");

-- CreateIndex
CREATE INDEX "membership_verification_audits_actor_user_id_idx" ON "membership_verification_audits"("actor_user_id");

-- AddForeignKey
ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_trusted_record_id_fkey" FOREIGN KEY ("trusted_record_id") REFERENCES "trusted_institution_students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_verification_audits" ADD CONSTRAINT "membership_verification_audits_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "institution_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_verification_audits" ADD CONSTRAINT "membership_verification_audits_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
