# iSharp Academy — Performance Benchmark Report

## 1. Frontend Bundle & Live Next.js Production HTTP Measurements

Measured on the `next build` production server running locally at `http://localhost:3210` (5 requests per route):

| Route | HTTP Status | Redirect Target | Payload (Bytes) | Min (ms) | Median (ms) | Max (ms) | ExcelJS Chunk Loaded? |
|---|---:|---|---:|---:|---:|---:|---|
| `/` | 200 | — | 396,276 | 15.1 | 17.0 | 194.2 | No (`false`) |
| `/login` | 200 | — | 227,657 | 32.1 | 42.3 | 265.8 | No (`false`) |
| `/administration` | 200 | — | 198,202 | 23.8 | 38.1 | 65.9 | No (`false`) |
| `/register` | 200 | — | 176,168 | 26.3 | 31.4 | 58.9 | No (`false`) |
| `/demo-test` | 200 | — | 134,465 | 6.1 | 6.8 | 26.5 | No (`false`) |
| `/admin` | 307 | `/administration` | 15 | 2.1 | 2.3 | 2.5 | No (`false`) |
| `/dashboard/student` | 307 | `/login` | 6 | 2.0 | 2.2 | 2.6 | No (`false`) |
| `/plans` | 307 | `/login` | 6 | 2.3 | 2.9 | 5.7 | No (`false`) |

### Bundle Inspection (`web/.next/static/chunks`)
- `0_kac8o7ap509.js`: **909.1 KB** — Verified to contain `exceljs` and verified **absent** from all initial route/app manifests (lazy-loaded only on Excel export).
- Next largest chunks: `0lwncvcvviz-r.js` (253.6 KB), `2tqmk9olg34tv.js` (223.8 KB), `3pkejbz0cj2nr.js` (156.6 KB), `1dx9aji0svtk8.js` (121.7 KB).

---

## 2. Live Browser Core Web Vitals & Resource Metrics (Playwright Chromium on `localhost:3210`)

Measured via `web/e2e/public-and-responsive.spec.ts` on the `next build` production server:

| Route | DOMContentLoaded (ms) | Load (ms) | CLS | Requests | JS Files | JS Transfer (KB) | JS Heap (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 85 | 395 | 0 | 38 | 17 | 330 | 11.6 |
| `/login` | 84 | 94 | 0 | 31 | 15 | 0 (cached) | 13.8 |
| `/administration` | 72 | 92 | 0 | 32 | 16 | 0 (cached) | 17.1 |
| `/register` | 71 | 72 | 0 | 31 | 15 | 0 (cached) | 20.1 |
| `/demo-test` | 39 | 82 | 0 | 31 | 15 | 7 | 24.5 |

---

## 3. In-Process Compute & Parsing Benchmarks (Vitest)

| Workload | Sample Size | Measured Duration | Status |
|---|---|---|---|
| 305-Row Bilingual Excel Parse + 15 Image Extraction + Intra-File Dedup | 305 rows | **355 ms** total (`excel-300-roundtrip.test.ts`) | PASS |
| 300-Question Bilingual Fingerprint Calculation | 300 questions | **< 2000 ms** total, P95 **< 20 ms** (`ssrf-and-scale.spec.ts`) | PASS |
| 180-Question NEET Randomization + Payload Sanitization + Evaluation | 180 questions | **49 ms** total (`full-180-exam-lifecycle.spec.ts`) | PASS |
| Bilingual Excel Export (`phase1-regression.test.ts`) | 1 workbook | **1855 ms** (includes dynamic `exceljs` load) | PASS |

---

## 4. Remaining Blocked Benchmarks (Not Executed)

- **Authenticated Admin/Exam Browser Metrics (305-Q upload, 180-Q exam navigation)**: `BLOCKED` (awaiting isolated PostgreSQL 16).
- **Live PostgreSQL Query Latency, Pool Saturation & Multi-User Load (`1–100` users)**: `BLOCKED` (`PostgreSQL.PostgreSQL.16` `winget` download from `get.enterprisedb.com` stalled for 16+ min; production DB protected).
