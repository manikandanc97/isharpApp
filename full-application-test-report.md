# iSharp Academy — Full Application Test Report

## 1. Executive Summary

- **Rollback Checkpoint**: `pre-full-testing-baseline` (`b175b49dee7a7bee5deb7cc51df9464c6318eafd`)
- **Automated Verification Executed**:
  - **Backend (`api/`)**: 30 test files, **224 tests passed**, 0 failed (`vitest run`), 0 TypeScript errors (`tsc --noEmit`), 0 lint errors (`oxlint`), `prisma validate` passed, `nest build` passed.
  - **Frontend (`web/`)**: 29 test files, **125 tests passed**, 0 failed (`vitest run`), 0 TypeScript errors (`tsc --noEmit`), 0 lint errors (`eslint`), `next build` passed (55/55 routes).
  - **Playwright Browser E2E & Responsive**: **10 tests passed** (`web/e2e/public-and-responsive.spec.ts` on `localhost:3210`).
  - **Total Automated + Browser Tests Passing**: **359 passing tests**.
- **Bugs Found & Fixed**: 2 confirmed security defects (SSRF IPv4-mapped IPv6 bypass + SSRF oversized remote image download) + 1 Vitest path/server-only boundary fix + prior `<ScrollToTop />` Suspense build fix.
- **Blocked Categories**: Real PostgreSQL concurrency/rollback & 6-index migration execution (`psql`/`docker` not installed; `api/.env` points to production/shared Supabase DB), live Chrome DevTools / Playwright browser E2E (`DevToolsActivePort` not enabled / Playwright not installed), and production SMS OTP delivery.

---

## 2. Test Execution Summary by Environment

| Execution Environment | Executed | Passed | Failed | Blocked |
|---|---:|---:|---:|---:|
| Unit & Mocked Integration (`api` Vitest) | 224 | 224 | 0 | 0 |
| Unit & Mocked Integration (`web` Vitest) | 125 | 125 | 0 | 0 |
| Live Local Next.js Production HTTP (`localhost:3210`) | 9 | 9 | 0 | 0 |
| Playwright Browser E2E & Responsive (`360px`–`1920px`) | 10 | 10 | 0 | 5 (auth E2E) |
| Real PostgreSQL Concurrency / Rollback / Migration | 0 | 0 | 0 | 17 |
| Production SMS OTP Delivery | 0 | 0 | 0 | 2 |

---

## 3. Detailed Test Cases

| Test ID | Module | Scenario | Expected Result | Actual Result | Environment | Evidence | Status | Related Bug Fix | Retest Result |
|---|---|---|---|---|---|---|---|---|---|
| `TC-AUTH-01` | Auth & Session | Admin/student login, token verification, session refresh no-replay | Safe methods retry on 401 refresh; mutations throw 401 | Verified | Unit (`web` Vitest) | `api-client.test.ts` (12), `session-manager.test.ts` (4), `supabase-token-verifier.service.spec.ts` (2) | PASS | — | — |
| `TC-AUTH-02` | Auth Guards | Unauthenticated `/admin`, `/dashboard/student`, `/plans` | Redirect `307` to `/administration` or `/login` | `307` -> `/administration` (2.3ms), `/login` (2.2ms, 2.9ms) | Live Local Next.js (`localhost:3210`) | Node HTTP check on `localhost:3210` | PASS | — | — |
| `TC-AUTH-03` | Access Policy | Verified membership guard & student learning access policy | Enforces verified membership and role permissions | Verified | Unit (`api` Vitest) | `verified-membership.guard.spec.ts` (4), `student-learning-access.policy.spec.ts` (3), `student-access-resolver.service.spec.ts` (6) | PASS | — | — |
| `TC-ADMIN-01` | Admin Service | Overview, users, internal roster, courses, subjects, chapters | CRUD & overview queries behave as contracted | Verified | Mocked Integration (`api` Vitest) | `admin.service.spec.ts` (11), `roles-store.test.ts` (3), `audit-logs-store.test.ts` (2) | PASS | — | — |
| `TC-TS-01` | Test Series & Editor | Series CRUD, test creation, duplication, blueprint, DI wiring | All `TestSeriesModule` providers resolve and execute | Verified | Mocked Integration (`api` Vitest) | `test-series.service.spec.ts` (12), `app.module.di.spec.ts` (1) | PASS | — | — |
| `TC-QB-01` | Question Bank | Question creation, search, filtering, bilingual format | Filters and formatters work for Tamil & English | Verified | Unit (`api` & `web` Vitest) | `question-bank.service.spec.ts` (12), `use-question-bank-filters.test.ts` (6), `question-format.test.ts` (5) | PASS | — | — |
| `TC-XLS-01` | Excel 300+ Import | Parse 305-row bilingual workbook with 15 embedded PNGs & dupes | 305 rows parsed, 15 images extracted, 4 skipped, 301 candidates | 305 parsed, 15 images, 4 skipped, 301 candidates in 355ms | Unit (`web` Vitest) | `web/lib/excel-300-roundtrip.test.ts` | PASS | Fixed `server-only` & `nest-api` Vitest mock | PASS |
| `TC-XLS-02` | Excel Export | Lazy `await import("exceljs")` & bilingual export | Exports `.xlsx` without static ExcelJS import in client | Passed; `0_kac8o7ap509.js` excluded from initial manifests | Unit (`web` Vitest) + `next build` | `phase1-regression.test.ts` (4), manifest check | PASS | Updated `results-export.ts` check | PASS |
| `TC-EXAM-180` | 180-Q Exam Lifecycle | 180-Q randomization, `IN_PROGRESS` key strip, +4/-1 scoring | Keys/solutions hidden during `IN_PROGRESS`; score=360/720 | Passed in 49ms | Unit (`api` Vitest) | `full-180-exam-lifecycle.spec.ts` (1), `examination-engine.service.spec.ts` (10) | PASS | — | — |
| `TC-OFF-01` | Offline Exam | Create session, enter raw answers, evaluate with -1 | Score=3 (+4/-1), `testResult.upsert` invoked | Passed | Mocked Integration (`api` Vitest) | `offline-examination.service.spec.ts` (2) | PASS | — | — |
| `TC-DEMO-01` | Demo OTP & Test | OTP generation, cooldown, prod fail-closed, scoring | Prod disables mock OTP; scoring & selection verified | Passed | Mocked Integration (`api` & `web` Vitest) | `demo-otp.service.spec.ts` (7), `demo-test.service.spec.ts` (13), `demo-test-calculator.test.ts` (2) | PASS | — | — |
| `TC-SEC-SSRF` | SSRF Hardening | Block IPv4-mapped IPv6, redirects, >10MB image, timeouts | All unsafe URLs/redirects/oversized payloads blocked | Passed | Unit (`api` Vitest) | `ssrf-and-scale.spec.ts` (4), `question-duplicate-detection.service.spec.ts` (24) | PASS | `BUG-SEC-01`, `BUG-SEC-02` | PASS |
| `TC-DB-CONC` | Real PG Concurrency | Simultaneous starts, autosave/submit races, rollback, 6 indexes | Atomicity & constraint enforcement on live PostgreSQL | Not executed — no local PostgreSQL/Docker; prod DB protected | Blocked | Environment check (`psql`/`docker` NOT FOUND) | BLOCKED | — | — |
| `TC-E2E-01` | Playwright Public & Responsive | Public routes (`/`, `/login`, `/administration`, `/register`, `/demo-test`), auth guards, forms & `360px`–`1920px` viewports | Zero console/hydration/overflow/image errors | 10/10 Playwright tests passed on `localhost:3210` | Isolated Playwright Chrome (`localhost:3210`) | `web/e2e/public-and-responsive.spec.ts` | PASS | — | — |
| `TC-E2E-AUTH` | Authenticated Browser E2E | Admin CRUD, 305-Q Excel upload, 180-Q exam runner in browser | End-to-end persistence & UI | Not executed — `PostgreSQL.PostgreSQL.16` installer stalled | Blocked | `task-544` download stall | BLOCKED | — | — |
| `TC-SMS-01` | Prod SMS OTP | Real SMS OTP delivery in production mode | SMS delivered via configured provider | Not executed — no SMS provider configured/safe to trigger | Blocked | `demo-otp-provider.ts` | BLOCKED | — | — |
