# iSharp Academy — Browser E2E Test Report

## 1. Environment & Tooling

- **Installed Package**: `@playwright/test` in `web/package.json` (`web/node_modules/@playwright/test`).
- **Browser Binary**: `playwright install chromium` timed out downloading from `cdn.playwright.dev` (`ECONNRESET` / `ETIMEDOUT`); configured `web/playwright.config.ts` to launch system Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) in a **fresh isolated browser context** (`headless: true`, zero access to personal Chrome profile/cookies/passwords).
- **Target Server**: Local Next.js 16.4.6 production server (`npx next start -p 3210`).

---

## 2. Executed Playwright E2E & Responsive Results (`10/10 PASSED`)

| Test ID | Scope | Viewports | Result | Notes |
|---|---|---|---|---|
| `PW-01` | Public pages (`/`, `/login`, `/administration`, `/register`, `/demo-test`): uncaught errors, hydration, broken images, eager ExcelJS check | `1280x720` | **PASS** | 0 uncaught errors, 0 hydration errors, 0 broken images, `0_kac8o7ap509.js` (ExcelJS) NOT loaded; expected 503 on `/api/*` when NestJS API offline |
| `PW-02` | Auth route guards: `/admin` -> `/administration`, `/dashboard/student` -> `/login`, `/plans` -> `/login` | `1280x720` | **PASS** | All 3 redirects verified in browser |
| `PW-03` | Interactive form controls & keyboard focus on `/login`, `/administration`, `/register` | `1280x720` | **PASS** | Inputs visible & focusable |
| `PW-04`..`PW-10` | Responsive layout check across `/`, `/login`, `/register`, `/demo-test` (`scrollWidth <= innerWidth + 1`) | `360px`, `390px`, `768px`, `1024px`, `1280px`, `1440px`, `1920px` | **PASS** (7/7) | Zero horizontal overflow at all 7 widths |

---

## 3. Remaining Blocked Browser E2E Workflows

Authenticated end-to-end browser flows requiring a running NestJS API + isolated PostgreSQL database (`E2E-02` Admin CRUD/Test Editor, `E2E-03` 305-Q Excel upload/export, `E2E-04` Demo OTP + Runner, `E2E-05` 180-Q Student Exam Runner) remain **BLOCKED** until local PostgreSQL 16 is installed.
