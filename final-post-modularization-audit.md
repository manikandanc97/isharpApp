# iSharp Academy — Final Post-Modularization Regression Audit

## 1. Executive Summary

A full-stack post-modularization regression audit was performed against the `phase-6.2-baseline` checkpoint (`b175b49dee7a7bee5deb7cc51df9464c6318eafd`) across both `web/` (Next.js 16.4.6) and `api/` (NestJS + Prisma 7.10.1).

- **Architecture & Integration**: Every extracted module (56 newly created source files across `api/src/` and `web/`) has verified consumers, clean NestJS DI registration (`app.module.di.spec.ts` passes), zero circular dependencies, and preserved client/server boundaries.
- **Independent Fixes Applied**:
  1. Wrapped `<ScrollToTop />` in `<Suspense fallback={null}>` in `web/app/layout.tsx`, resolving the Next.js 16 Cache Components prerender failure on `/exam/[attemptId]` observed at baseline.
  2. Added `redirect: 'error'` to remote image fetches in `api/src/question-bank/question-duplicate-detection.service.ts` to block open-redirect SSRF bypasses.
  3. Updated `web/lib/phase1-regression.test.ts` to assert lazy `await import("exceljs")` in the extracted `results-export.ts` module.
- **Verification Status**: All static, lint, unit, DI, schema validation, and production build checks pass (`api`: 216 tests / 27 files; `web`: 124 tests / 28 files; 55/55 Next.js routes generated).
- **Release Status**: **NOT READY FOR PRODUCTION** until mandatory live PostgreSQL concurrency/rollback integration tests, Playwright browser E2E, 250-question Excel import, 180-question exam stress tests, and production SMS OTP verification are executed in an isolated staging environment.

---

## 2. Phase 6.2 Regression Findings

Compared against git tag `phase-6.2-baseline`:
- **No accidental file deletions or route changes**: Next.js route paths (`/` through `/register`, `/exam/[attemptId]`, `/demo-test`, `/admin/*`, `/api/*`) match the baseline manifest.
- **No unintended edits to protected artifacts**: `api/prisma/schema.prisma`, `api/prisma/migrations/.../migration.sql`, `api/package-lock.json`, `web/package-lock.json`, and `web/app/globals.css` remain byte-identical to baseline.
- **ScrollToTop Suspense Boundary**: `web/components/scroll-to-top.tsx` returns `null` and resets scroll position on `usePathname()` changes. Wrapping it in `<Suspense fallback={null}>` in `web/app/layout.tsx` preserves client-side scroll restoration while allowing static/partial prerendering of `/exam/[attemptId]`.
- **ExcelJS Lazy Loading Preserved**: Static `import ExcelJS from "exceljs"` exists only in server-only routes/utilities (`web/app/api/admin/questions/template/route.ts`, `web/lib/question-import-stream.ts`, `web/lib/question-import-retry.ts`, `web/lib/excel-patch.ts`) and test files. Client export modules (`web/lib/question-export.ts`, `web/components/admin/results/results-export.ts`) load `exceljs` strictly via dynamic `await import("exceljs")`.

---

## 3. Architecture Verification

- **Consumer Coverage**: Automated scan across `api/src/` and `web/` confirmed all newly extracted Phase 6.2 modules are imported and used (0 orphaned modules).
- **NestJS DI & Module Wiring**: `api/src/test-series/test-series.module.ts` registers and exports `AssessmentTestQueryService`, `AssessmentTestDuplicationService`, and `TestSeriesCrudService` alongside `AssessmentTestService` and `TestSeriesService`. `api/src/app.module.di.spec.ts` passes.
- **Shared Frontend Logic**: Exam palette status and summary calculation were consolidated into `web/components/shared/examination/exam-palette-utils.ts` and reused by both `production-exam-runner.tsx` and `demo-test-runner.tsx`.
- **React Hooks**: `use-live-test-editor.ts` deferred state resets resolve `react-hooks/set-state-in-effect`; ESLint reports 0 hook-dependency errors across `web/`.

---

## 4. Frontend Functionality Verification

Verified by static analysis, TypeScript, ESLint, Vitest (28 files, 124 tests), and `next build`:
- Admin workspaces (`live-test-editor`, `demo-leads-tab`, `demo-settings-tab`, `question-bank-list`, `question-import-dialog`, `results-section`, `tests-table`, `test-preview-dialog`, `test-series-section`, `chapter-table`, `roles-section`, `category-panel`) retain all props, API endpoints, debounced search, pagination, and Excel export/import workflows.
- Demo & Student workflows (`demo-otp-gate`, `demo-test-lobby`, `demo-test-runner`, `scorecard-question-review`, `production-exam-runner`, `exam-result-view`, `student-mocks-tab`) retain bilingual Tamil/English rendering, timers, palette states, and scorecard review.

---

## 5. Backend Functionality Verification

Verified by `tsc --noEmit`, `oxlint`, Vitest (27 files, 216 tests), `prisma validate`, and `nest build`:
- `AssessmentTestService`, `TestSeriesService`, `DemoTestConfigurationService`, `DemoEvaluationService`, `DemoTestSelectionEngine`, `DemoOtpService`, `QuestionSelectionEngine`, `QuestionPersistenceHelper`, and `QuestionDuplicateDetectionService` preserve all public method signatures, validation rules, and modular helper delegations.

---

## 6. Security Findings

- **SSRF Protection (`api/src/question-bank/question-duplicate-detection.service.ts` & `question-fingerprint.util.ts`)**:
  - `isAllowedRemoteImageUrl` blocks non-HTTP(S) schemes, `localhost`, `*.local`, private IPv4 ranges (`0.0.0.0/8`, `10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.168.0.0/16`), and private IPv6 prefixes (`::1`, `fe80:*`, `fc*`, `fd*`).
  - **Fix Applied**: Added `redirect: 'error'` to `fetch(trimmed, ...)` to prevent HTTP redirect SSRF bypasses.
  - **Remaining Hardening Gap**: Hostnames are checked lexically without custom DNS `lookup` IP validation; a public domain resolving to a private IP (DNS rebinding) is not blocked at socket connect time.
- **Image Hash Cache Revalidation**: Sends `If-None-Match` and `If-Modified-Since` with `cache: 'no-store'` and handles `304 Not Modified`.
- **Session Refresh & Mutation Replay Protection (`web/components/admin/admin-api.ts`)**: Preserved — only safe methods (`GET`, `HEAD`, `OPTIONS`) auto-retry after session refresh; mutating requests throw `ApiClientError(401)` instead of replaying.
- **OTP Fail-Closed Behavior (`api/src/demo-test/demo-otp-provider.ts`)**: When `NODE_ENV === 'production'`, `DEMO_OTP_PROVIDER` defaults to `''` (disabling `mock` fallback unless explicitly configured).
- **Answer-Key Confidentiality**: `attempt-payload.helper.ts` and `demo-evaluation.service.ts` strip `isCorrect`, `numericalAnswer`, `solutionEn`, `solutionTa`, and `solutionImageUrl` while an attempt is `IN_PROGRESS` (verified by unit tests in `examination-engine.service.spec.ts` and `demo-test.service.spec.ts`).
- **Production Dependency Audit (`npm audit --omit=dev`)**:
  - `api`: 3 high severity advisories in transitive `effect` (`@prisma/config` -> `prisma`); automated fix requires breaking downgrade to `prisma@6.12.0`.
  - `web`: 6 moderate severity advisories in transitive `uuid` (`exceljs`); automated fix requires breaking downgrade to `exceljs@3.4.0`.
  - Both left unchanged per dependency stability constraints; track upstream `prisma` and `exceljs` patch releases.

---

## 7. Database Integrity Findings

- **Single PrismaClient**: Confirmed via codebase scan — only `api/src/prisma/prisma.service.ts` (`extends PrismaClient`) instantiates PrismaClient.
- **Transaction Client Propagation**: `question-persistence.helper.ts` and `question-duplicate-check.helper.ts` pass the active `Prisma.TransactionClient` without creating nested `$transaction` calls.
- **Concurrency & Transaction Risks (Unverified at Runtime)**:
  - Concurrent attempt creation, concurrent autosave/submission race conditions, demo question exposure distribution under load, and transaction rollback behavior **have NOT been verified against a real PostgreSQL instance** and remain unit-mocked only.

---

## 8. API Compatibility

- No backend controller routes, DTO shapes, HTTP status codes, or frontend `/api/*` proxy endpoints were altered in Phase 6.2.
- All compatibility facades (`AssessmentTestService`, `TestSeriesService`, `question-duplicate-detection.service.ts` re-exports) maintain backward-compatible signatures.

---

## 9. Test and Build Results (Post-Final Edit)

### Backend (`api/`)
- `npx tsc --noEmit`: **Passed** (0 errors)
- `npm run lint` (`oxlint --type-aware src/ test/ scripts/`): **Passed** (0 errors, 13 pre-existing warnings in `test/` benchmark scripts)
- `npm run test` (`vitest run`): **Passed** — **27 test files, 216 tests passed** (includes `app.module.di.spec.ts`)
- `npx prisma validate`: **Passed**
- `npm run build` (`prisma generate && nest build`): **Passed**

### Frontend (`web/`)
- `npm run typecheck` (`tsc --noEmit`): **Passed** (0 errors)
- `npm run lint` (`eslint`): **Passed** (0 errors, 12 pre-existing warnings)
- `npm run test` (`vitest run`): **Passed** — **28 test files, 124 tests passed**
- `npm run build` (`next build`): **Passed** — Compiled and generated **55/55** static & partial-prerender routes (Turbopack)

---

## 10. Bundle Verification

Inspected `web/.next/static/chunks` and build manifests after `next build`:
- Largest chunk: `0_kac8o7ap509.js` (**909.1 KB**) — verified to contain `exceljs` and **verified absent from all initial route/app build manifests** (loaded strictly on demand when exporting Excel).
- Next largest chunks: `0lwncvcvviz-r.js` (253.6 KB), `2tqmk9olg34tv.js` (223.8 KB), `3pkejbz0cj2nr.js` (156.6 KB), `1dx9aji0svtk8.js` (121.7 KB).

---

## 11. Actual Fixes Implemented

1. `web/app/layout.tsx`: Wrapped `<ScrollToTop />` in `<Suspense fallback={null}>` to fix Next.js 16 Cache Components prerender failure on `/exam/[attemptId]`.
2. `web/lib/phase1-regression.test.ts`: Updated ExcelJS lazy-import assertion to inspect `web/components/admin/results/results-export.ts` alongside `results-section.tsx`.
3. `api/src/question-bank/question-duplicate-detection.service.ts`: Added `redirect: 'error'` on remote image `fetch()` calls to prevent open-redirect SSRF.

---

## 12. Remaining Production Blockers

1. **No Live PostgreSQL Integration Execution**: Concurrent attempt creation, autosave/submit race conditions, demo question exposure distribution, and Prisma transaction rollbacks are only tested with mocks.
2. **No Browser E2E Verification**: Full UI flows (admin inline editor, bilingual Tamil/English rendering, exam timer expiry, OTP gate) have not been run in Playwright.
3. **No Production SMS Provider Verification**: `DEMO_OTP_PROVIDER` has only been tested with `MockDemoOtpProvider`.
4. **No Scale / Load Execution**: 250-question bilingual Excel import, 180-question full NEET mock attempt, and `api/test/*` benchmark scripts have not been run against live DB/storage.
5. **DNS-level SSRF & Transitive Advisories**: Socket-level DNS IP validation on remote image fetch and upstream `prisma`/`exceljs` transitive advisories remain open for hardening/patching.

---

## 13. Required Isolated Testing Environment

Before production deployment, provision an isolated staging environment with:
- **PostgreSQL 16+ / Isolated Supabase Project** (separate from production) with `prisma migrate deploy` applied.
- **Local / Staging NestJS + Next.js instances** configured with isolated Supabase Auth & Storage buckets.
- **Test Data & Fixtures**: 250-question bilingual (English + Tamil) `.xlsx` workbook with embedded images, seeded NEET 180-question mock test, and demo test configuration.
- **Playwright E2E Suite** covering Admin Question Bank import/export, Test Series/Live Test Editor, Demo OTP + Runner, and Production 180-question Exam Runner (autosave, reload/resume, timer submit, result confidentiality).
- **Concurrency & Benchmark Scripts** (`api/test/concurrency-load-test.ts`, `api/test/http-load-test.ts`, `api/test/question-bank-scalability.ts`) executed against the isolated PostgreSQL instance.
- **Sandbox/Staging SMS Gateway Credentials** for verifying non-mock `DEMO_OTP_PROVIDER` delivery and fail-closed behavior with `NODE_ENV=production`.

---

## 14. Final Release Recommendation

**Hold for Integration & E2E Gate (Do Not Deploy Yet).**  
Code structure, TypeScript/lint cleanliness, unit test suites, NestJS DI wiring, and Next.js production builds are all verified and healthy after Phase 6.2 modularization. Release approval should be granted only after passing the isolated PostgreSQL concurrency/rollback tests, 250-question Excel import, 180-question exam E2E flow, and staging SMS OTP verification listed in Section 13.
