-- Additive and idempotent: preserves all existing roles and assignments.
-- The application recognizes only these canonical RBAC names.
INSERT INTO "roles" ("name", "description", "created_at", "updated_at")
VALUES
  ('ADMIN', 'Academy administrator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SUPERADMIN', 'System administrator with privileged account management', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('STUDENT', 'Enrolled learner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE
SET "description" = EXCLUDED."description", "updated_at" = CURRENT_TIMESTAMP;
