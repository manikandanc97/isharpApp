# iSharp Academy — Database Integration Test Report

## 1. Environment & Safety Status

- **Local PostgreSQL / Docker**: `psql`, `pg_isready`, and `docker` are **not installed** on this workstation.
- **Configured `api/.env` `DATABASE_URL`**: Points to the existing remote Supabase PostgreSQL project; per strict safety rules, no destructive writes, concurrency stress tests, resets, or migrations were executed against it.
- **Prisma Static & Client Verification**:
  - `npx prisma validate` (`api/prisma/schema.prisma`): **PASS**
  - `npx prisma generate` (Prisma Client `7.10.1`): **PASS**
  - Single `PrismaService` (`extends PrismaClient`) verified across `api/src/`.
  - Transaction client (`Prisma.TransactionClient`) propagation verified statically in `question-persistence.helper.ts` and `question-duplicate-check.helper.ts` (no nested `$transaction`).

---

## 2. Real PostgreSQL Integration & Concurrency Test Status

| Test ID | Scenario | Status | Blocker / Notes |
|---|---|---|---|
| `DB-01` | Simultaneous exam start & duplicate active attempt prevention | BLOCKED | Requires isolated PostgreSQL instance |
| `DB-02` | Maximum attempt enforcement under concurrent requests | BLOCKED | Requires isolated PostgreSQL instance |
| `DB-03` | Concurrent answer updates & out-of-order autosave races | BLOCKED | Requires isolated PostgreSQL instance |
| `DB-04` | Autosave vs. submission race & simultaneous submit idempotency | BLOCKED | Requires isolated PostgreSQL instance |
| `DB-05` | Finalized attempt immutability & transaction rollback on partial failure | BLOCKED | Requires isolated PostgreSQL instance |
| `DB-06` | Question snapshot, option mapping & result recalculation consistency | BLOCKED | Unit-mocked PASS; real PG `BLOCKED` |
| `DB-07` | Concurrent demo visitor exposure updates & pool exhaustion | BLOCKED | Requires isolated PostgreSQL instance |
| `DB-08` | Concurrent 300-question imports & duplicate fingerprint protection | BLOCKED | Requires isolated PostgreSQL instance |
| `DB-09` | Pending 6-index migration execution, locking & `EXPLAIN ANALYZE` plans | BLOCKED | Requires isolated PostgreSQL instance |

---

## 3. PostgreSQL 16 Detection & Remaining Action

- **Re-checked Workstation**: `Get-Service *postgres*`, `C:\Program Files\PostgreSQL`, alternate paths, listening ports `5432/5433/54322`, and `winget list --name PostgreSQL` all confirmed PostgreSQL 16 is **not yet installed** on this workstation.
- **Earlier Automated Attempt**: `winget install --id PostgreSQL.PostgreSQL.16 --exact` stalled downloading from `https://get.enterprisedb.com/postgresql/postgresql-16.16-2-windows-x64.exe` for 16+ minutes and was cancelled.
- **Action Needed from User**:
  1. Install PostgreSQL 16 locally on port `5432` (localhost only) or provide a dedicated non-production staging Supabase `DATABASE_URL` in `api/.env.test`.
  2. Create database `isharp_test` and run:
     ```powershell
     cd api
     npx prisma migrate deploy
     npx tsx test/concurrency-load-test.ts
     npx tsx test/http-load-test.ts
     npx tsx test/question-bank-scalability.ts
     npx tsx test/benchmark-overview-consolidation.ts
     ```
