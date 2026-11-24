-- AlterTable
ALTER TABLE "questions" ADD COLUMN "content_fingerprint" VARCHAR(64);
ALTER TABLE "questions" ADD COLUMN "equivalent_fingerprint" VARCHAR(64);
ALTER TABLE "questions" ADD COLUMN "fingerprint_version" SMALLINT NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "questions_content_fingerprint_idx" ON "questions"("content_fingerprint");
CREATE INDEX "questions_equivalent_fingerprint_idx" ON "questions"("equivalent_fingerprint");
