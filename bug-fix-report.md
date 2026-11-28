# iSharp Academy — Bug Fix Report

## Summary

- **Total Bugs Identified**: 5 (3 Security SSRF/transport bugs, 1 Next.js Cache Components prerender build defect, 1 Vitest regression guardrail path mismatch)
- **Fixed & Retested**: 5
- **Unresolved Bugs**: 0 code defects found in static/unit/HTTP testing (runtime DB & browser defects cannot be evaluated until blocked environments are provisioned)

---

## Fixed Defects

### `BUG-SEC-01` (P1 — Security): SSRF Bypass via IPv4-Mapped IPv6 Addresses & CGNAT/Unspecified Ranges
- **Affected Workflow**: Question bank duplicate detection remote image hashing (`isAllowedRemoteImageUrl` in `api/src/question-bank/question-fingerprint.util.ts`).
- **Root Cause**: `new URL('http://[::ffff:127.0.0.1]/a.png').hostname` normalizes to `[::ffff:7f00:1]`. `isAllowedRemoteImageUrl` only checked `::1`, `fe80:`, `fc`, `fd`, and dotted IPv4 literals, allowing `::ffff:7f00:1`, `::ffff:a9fe:a9fe`, and `100.64.0.0/10` to pass.
- **Fix**: Extracted `isAllowedIpAddress()` in `api/src/question-bank/question-fingerprint.util.ts` to decode hex (`::ffff:x:y`) and dotted (`::ffff:a.b.c.d`) IPv4-mapped IPv6 addresses, block unspecified IPv6 (`::`), CGNAT (`100.64.0.0/10`), and multicast (`>=224`).
- **Regression Test & Retest**: Added `api/src/question-bank/ssrf-and-scale.spec.ts`; **PASS** (4/4 tests).

### `BUG-SEC-02` (P2 — Security/Availability): Missing Redirect Blocking, DNS IP Check, and Remote Image Size Limit
- **Affected Workflow**: Remote image fetch in `api/src/question-bank/question-duplicate-detection.service.ts`.
- **Root Cause**: `fetch(trimmed, ...)` defaulted to `redirect: 'follow'` (allowing 302 redirect to `127.0.0.1`), did not bind the TCP socket to the DNS-validated IP (leaving a DNS rebinding window), and buffered the full response before checking size.
- **Fix**: Added `redirect: 'error'`, pre-fetch `dnsLookup(..., { all: true })` validation against `isAllowedIpAddress()`, pinned-IP `node:http`/`node:https` transport (`fetchWithPinnedIp`), and a `10 MB` (`MAX_REMOTE_IMAGE_BYTES`) streaming byte-limit abort (`readFetchStreamWithLimit` & `res.on('data')`).
- **Regression Test & Retest**: Verified in `api/src/question-bank/ssrf-and-scale.spec.ts` (including chunked `ReadableStream` >10 MB without `Content-Length`) and `question-duplicate-detection.service.spec.ts`; **PASS**.

### `BUG-SEC-03` (P1 — Security/Runtime): Node 24 `lookup(opts.all)` Pinned-IP Crash & Missing Overall Request Deadline
- **Affected Workflow**: `fetchWithPinnedIp()` in `api/src/question-bank/question-duplicate-detection.service.ts`.
- **Root Cause**: Node 24's `net.connect` passes `opts.all = true` to custom `lookup` callbacks, expecting `cb(null, [{ address, family }])` rather than `cb(null, address, family)`, which threw `Invalid IP address: undefined` on real HTTP connections. Additionally, `timeout: 4000` only enforced socket idle timeout rather than an absolute request deadline against slow-drip continuous responses.
- **Fix**: Updated `lookup` to return `[{ address: pinnedIp, family }]` when `opts?.all` is true, and added a hard 4s `deadlineTimer` (`req.destroy(new Error('Overall request deadline exceeded'))`) cleared cleanly on `settle()`.
- **Regression Test & Retest**: Added real `node:http` server redirect (`302`) and chunked `>10 MB` streaming tests in `api/src/question-bank/ssrf-and-scale.spec.ts` (5/5 tests); **PASS**.

### `BUG-BUILD-01` (P1 — Production Build): `/exam/[attemptId]` Prerender Failure with Cache Components
- **Affected Workflow**: `web` `npm run build` (`next build`).
- **Root Cause**: `web/components/scroll-to-top.tsx` calls `usePathname()` directly inside `web/app/layout.tsx` without a `<Suspense>` boundary while Next.js 16 Cache Components is enabled.
- **Fix**: Wrapped `<ScrollToTop />` in `<Suspense fallback={null}>` in `web/app/layout.tsx`.
- **Retest**: `next build` now compiles and generates all **55/55** routes cleanly; **PASS**.

### `BUG-TEST-01` (P3 — Test Guardrail): ExcelJS Lazy-Load Regression Test Targeted Pre-Modularization File
- **Affected Workflow**: `web/lib/phase1-regression.test.ts`.
- **Root Cause**: After Phase 6.2 extracted Excel export logic from `results-section.tsx` into `results-export.ts`, the regression test still checked `results-section.tsx` for `await import("exceljs")`.
- **Fix**: Updated `phase1-regression.test.ts` to assert no static ExcelJS import in either file and `await import("exceljs")` in `results-export.ts`.
- **Retest**: `phase1-regression.test.ts` (4/4 tests); **PASS**.
