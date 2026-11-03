INSERT INTO "courses" ("id", "code", "title", "description", "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'NEET', 'NEET Coaching Programme', 'I-Sharp Academy NEET Physics, Chemistry and Biology programme', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description", "is_active" = TRUE, "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "subjects" ("id", "code", "name", "description", "is_active", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'PHYSICS', 'Physics', 'NEET Physics', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'CHEMISTRY', 'Chemistry', 'NEET Chemistry', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'BIOLOGY', 'Biology', 'NEET Biology (Botany and Zoology)', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "is_active" = TRUE, "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "course_subjects" ("id", "course_id", "subject_id", "position", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid(), c."id", s."id", CASE s."code" WHEN 'PHYSICS' THEN 1 WHEN 'CHEMISTRY' THEN 2 ELSE 3 END, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "courses" c JOIN "subjects" s ON s."code" IN ('PHYSICS', 'CHEMISTRY', 'BIOLOGY') WHERE c."code" = 'NEET'
ON CONFLICT ("course_id", "subject_id") DO UPDATE SET "position" = EXCLUDED."position", "is_active" = TRUE, "updated_at" = CURRENT_TIMESTAMP;
