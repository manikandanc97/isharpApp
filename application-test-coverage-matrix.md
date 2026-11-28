# iSharp Academy — Application Test Coverage Matrix

## 1. Discovered Application Surface

- **Next.js App Pages (`web/app/**/page.tsx`)**: 21 routes (`/`, `/login`, `/administration`, `/register`, `/plans`, `/demo-test`, `/exam/[attemptId]`, `/auth/pending`, `/dashboard/admin`, `/dashboard/student`, `/dashboard/superadmin`, `/admin`, `/admin/audit-logs`, `/admin/courses`, `/admin/question-bank`, `/admin/results`, `/admin/roles`, `/admin/settings`, `/admin/students`, `/admin/test-series`, `/admin/tests`).
- **Next.js API Route Handlers (`web/app/api/**/route.ts`)**: 46 route files covering auth, session, profile, health, admin proxy/import/export/roles/settings/results/test-series, demo OTP/attempts/events, exam attempts, and student portal.
- **NestJS Controllers (`api/src/**/*.controller.ts`)**: 14 controllers (`AppController`, `AccessController`, `AdminController`, `AuthController`, `DemoTestAdminController`, `DemoTestController`, `ExaminationEngineController`, `HealthController`, `InstitutionMembershipsController`, `OfflineExaminationController`, `ProfilesController`, `QuestionBankController`, `StudentPortalController`, `TestSeriesController`).

---

## 2. Feature-to-Test Coverage Matrix

| Feature Area | Discovered Routes / Controllers | Automated Unit / Mocked Tests | Live HTTP / Build Checks | Real DB / Browser Coverage | Status |
|---|---|---|---|---|---|
| Public Landing, Plans, Register | `/`, `/plans`, `/register` | `validation.test.ts` | `localhost:3210` HTTP 200/307 + `next build` | Browser UI (`BLOCKED`) | PARTIAL (Static/HTTP PASS; Browser BLOCKED) |
| Student & Admin Auth | `/login`, `/administration`, `/auth/pending`, `/api/auth/*`, `AuthController` | `auth-error.test.ts`, `auth-redirect.test.ts`, `oauth-flow.test.ts`, `supabase-token-verifier.service.spec.ts`, `proxy.test.ts` | `localhost:3210` `307` auth redirects | Live Supabase Auth E2E (`BLOCKED`) | PARTIAL |
| Access Control & Memberships | `AccessController`, `InstitutionMembershipsController`, `ProfilesController` | `institution-memberships.service.spec.ts`, `verified-membership.guard.spec.ts`, `student-learning-access.policy.spec.ts`, `profiles.service.spec.ts`, `student-access-resolver.service.spec.ts` | — | Live RBAC/IDOR DB E2E (`BLOCKED`) | PARTIAL |
| Admin Dashboard, Curriculum & Users | `/admin`, `/admin/courses`, `/admin/students`, `/admin/roles`, `/admin/settings`, `/admin/audit-logs`, `AdminController` | `admin.service.spec.ts`, `curriculum.test.ts`, `student-search-utils.test.ts`, `roles-store.test.ts`, `audit-logs-store.test.ts` | `/admin` `307` redirect, `next build` | Browser E2E (`BLOCKED`) | PARTIAL |
| Test Categories & Inline Test Editor | `/admin/test-series`, `/admin/tests`, `TestSeriesController` | `test-series.service.spec.ts`, `app.module.di.spec.ts` | `next build` | Browser E2E (`BLOCKED`) | PARTIAL |
| Question Bank & Duplicate Detection | `/admin/question-bank`, `QuestionBankController` | `question-bank.service.spec.ts`, `question-duplicate-detection.service.spec.ts`, `question-duplicate-integration.spec.ts`, `ssrf-and-scale.spec.ts`, `use-question-bank-filters.test.ts` | `next build` | Live DB backfill/import (`BLOCKED`) | PARTIAL |
| Excel Import (300+ Q) & Export | `/api/admin/questions/import`, `/template`, `/failed-rows` | `excel-300-roundtrip.test.ts`, `question-import.test.ts`, `question-import-retry.test.ts`, `excel-embedded-images.test.ts`, `excel-patch.test.ts`, `phase1-regression.test.ts` | ExcelJS async chunk verified (`0_kac8o7ap509.js`) | Live upload stream E2E (`BLOCKED`) | PARTIAL |
| Student Portal | `/dashboard/student`, `/api/student/*`, `StudentPortalController` | `student-portal.service.spec.ts`, `student-portal.controller.spec.ts`, `student-analytics-calculator.test.ts`, `student-dpp-utils.test.ts` | `/dashboard/student` `307` redirect | Browser E2E (`BLOCKED`) | PARTIAL |
| 180-Q Online Examination Engine | `/exam/[attemptId]`, `/api/exam/*`, `ExaminationEngineController` | `full-180-exam-lifecycle.spec.ts`, `examination-engine.service.spec.ts`, `examination-evaluation.helper.spec.ts`, `examination-randomization.helper.spec.ts` | `/exam/[attemptId]` `next build` prerender PASS | Real PG concurrency (`BLOCKED`) | PARTIAL |
| Demo OTP & Demo Test | `/demo-test`, `/api/demo/*`, `DemoTestController`, `DemoTestAdminController` | `demo-otp.service.spec.ts`, `demo-test.service.spec.ts`, `demo-test-calculator.test.ts`, `demo-test-workflow.test.ts` | `/demo-test` HTTP 200 | Real SMS & DB pool (`BLOCKED`) | PARTIAL |
| Offline Examinations & Results | `/admin/results`, `OfflineExaminationController` | `offline-examination.service.spec.ts`, `results-store.test.ts` | `next build` | Live DB persistence (`BLOCKED`) | PARTIAL |
| Health & Error Sanitization | `/api/health`, `HealthController` | `health.controller.spec.ts`, `health.service.spec.ts`, `http-exception.filter.spec.ts`, `cors.spec.ts` | `/api/health` 503 when API down | Live DB health (`BLOCKED`) | PARTIAL |
