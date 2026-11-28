# iSharp Academy — Security Test Report

## 1. Security Controls Verified

| Control | Implementation | Verification Method | Status |
|---|---|---|---|
| SSRF URL & IP Literal Filtering | `isAllowedIpAddress` / `isAllowedRemoteImageUrl` blocks `localhost`, `*.local`, `0.0.0.0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16`, `172.16/12`, `192.168/16`, `>=224`, `::`, `::1`, `fe80:`, `fc/fd`, and `::ffff:*` IPv4-mapped IPv6 | Unit (`ssrf-and-scale.spec.ts`, `question-duplicate-detection.service.spec.ts`) | PASS |
| SSRF Redirects, DNS & Size Cap | `redirect: 'error'`, pre-fetch `dnsLookup` IP check, pinned-IP `node:http`/`node:https` socket transport (`fetchWithPinnedIp` with Node 24 `opts.all` support) preventing DNS rebinding, 4s socket idle timeout + 4s hard overall request deadline (`deadlineTimer`), 10MB streaming byte-limit abort (`readFetchStreamWithLimit` & `res.on('data')`) | Unit + streaming `ReadableStream` + real `node:http` server redirect/chunked-stream tests (`ssrf-and-scale.spec.ts` 5/5) | PASS |
| Image Hash Cache Revalidation | `If-None-Match`, `If-Modified-Since`, `cache: 'no-store'`, `304` handling | Unit (`question-duplicate-detection.service.spec.ts`) | PASS |
| Mutation Replay Protection | `web/components/admin/admin-api.ts` restricts auto-retry after 401 refresh to `GET`/`HEAD`/`OPTIONS` | Code audit + `api-client.test.ts` | PASS |
| Answer-Key Confidentiality | `formatSanitizedAttempt` & `demo-evaluation.service.ts` strip `isCorrect`, `numericalAnswer`, `solutionEn`, `solutionTa`, `solutionImageUrl` while `IN_PROGRESS` | Unit (`full-180-exam-lifecycle.spec.ts`, `examination-engine.service.spec.ts`, `demo-test.service.spec.ts`) | PASS |
| Production OTP Fail-Closed | `demo-otp-provider.ts` disables `mock` default when `NODE_ENV === 'production'` | Unit (`demo-otp.service.spec.ts`) | PASS |
| Error Sanitization & CORS | `AllExceptionsFilter` redacts Prisma/DB details; CORS origin allowlist enforced | Unit (`http-exception.filter.spec.ts`, `cors.spec.ts`) | PASS |
| Auth Route Guards | Unauthenticated `/admin` -> `307 /administration`; `/dashboard/student`, `/plans` -> `307 /login` | Live HTTP (`localhost:3210`) | PASS |

---

## 2. Dependency Audit (`npm audit --omit=dev`)

- **`api/`**: **3 high** severity advisories in transitive `effect` (`@prisma/config` -> `prisma`). Automated `npm audit fix --force` would downgrade `prisma` to `6.12.0` (breaking change from `7.10.1`). **Exposure**: `@prisma/config` is CLI/config-time; not exposed to untrusted HTTP user input at runtime.
- **`web/`**: **6 moderate** severity advisories in transitive `uuid` (`exceljs`). Automated `npm audit fix --force` would downgrade `exceljs` to `3.4.0` (breaking change). **Exposure**: `uuid` is used internally by `exceljs` for archive generation.
- **Decision**: Kept current `prisma@7.10.1` and `exceljs` versions per non-breaking dependency policy; track upstream patch releases.

---

## 3. Blocked Live Security Tests

- Live IDOR / cross-user JWT testing against real NestJS + PostgreSQL (blocked by lack of isolated PostgreSQL).
- Live file-upload malware/zip-bomb testing against `/api/admin/questions/import` + Supabase Storage.
