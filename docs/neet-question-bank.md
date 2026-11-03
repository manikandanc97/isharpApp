# NEET question bank setup

The admin Question Bank supports English, Tamil and bilingual single-correct, multiple-correct and numerical questions. Question diagrams, each answer option and the worked solution may each have a JPG, PNG or WebP image. NEET defaults are +4 correct and -1 incorrect.

## Database and media storage

1. Review and deploy `api/prisma/migrations/20261101120000_add_neet_question_bank/migration.sql` through the normal release pipeline.
2. In Supabase Storage, create a public bucket named `question-media`. Restrict uploads to JPG, PNG and WebP and set a 5 MB file limit.
3. Set `QUESTION_MEDIA_BUCKET=question-media` only in the API server environment. The Supabase service-role key must remain API-only.
4. Restart the API and web services after deployment.

The new database tables are `questions`, `question_options`, `mock_tests` and `mock_test_questions`. Foreign keys connect questions to the existing course, subject, chapter and trusted administrator profile records.

## Excel import

Download the current `.xlsx` template from **Admin → Question Bank → Excel template**. Do not rename its columns.

- `external_id` is the stable unique key. Importing the same ID updates the question and replaces its options.
- Use `course_code` = `NEET`. Allowed `subject_code` values are only `PHYSICS`, `CHEMISTRY` and `BIOLOGY`.
- `question_type`: `SINGLE_CORRECT`, `MULTIPLE_CORRECT` or `NUMERICAL`.
- `language`: `ENGLISH`, `TAMIL` or `BILINGUAL`.
- `difficulty`: `EASY`, `MEDIUM` or `HARD`.
- `correct_options`: `A` for one correct option or `A,C` for multiple correct options. Leave blank for numerical questions and use `numerical_answer`.
- Image columns accept embedded JPG/PNG pictures. In Excel use **Insert → Pictures**, place and resize one picture completely inside the matching `*_image` cell. Import extracts it, uploads it through the protected API to Supabase Storage and saves the generated URL. Existing public HTTPS URLs and older `*_image_url` templates remain supported.
- A question, option and solution can use text, an image, or both.
- Import size is limited to 500 rows, 100 embedded pictures, 5 MB per picture and 25 MB per workbook. Invalid rows are reported without discarding valid rows.

## Local verification

Run the API at `http://localhost:3001`, the web app at `http://localhost:3000`, sign in as an approved ADMIN/SUPERADMIN, then open `http://localhost:3000/dashboard/admin` and select **Question Bank**.
