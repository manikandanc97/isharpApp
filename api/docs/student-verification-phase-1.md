# Phase 1 student verification

Institution affiliation is stored separately from RBAC roles. A `STUDENT` role does
not imply that an `InstitutionMembership` is verified. Free internal access must
be granted only when `eligibleForFreeAccess` is `true` (membership status
`VERIFIED`). No academic content model is changed or duplicated.

## Authenticated endpoints

All routes require a Supabase bearer access token and an active `UserProfile`.

- `POST /api/institution-memberships/me/submission` (`STUDENT`), body
  `{ "studentId": "..." }`: creates one canonical, immutable student-ID claim
  per user and immediately attempts an exact trusted-roster match.
- `GET /api/institution-memberships/me` (`STUDENT`): returns the caller's safe
  membership status and `eligibleForFreeAccess`; it returns `membership: null`
  before submission.
- `POST /api/institution-memberships/me/verify` (`STUDENT`): retries trusted
  matching for a pending claim. Rejected and revoked memberships require an
  administrator review and cannot self-reactivate.
- `PATCH /api/institution-memberships/:id/verification`
  (`ADMIN`/`SUPERADMIN`), body
  `{ "status": "VERIFIED|REJECTED|REVOKED", "reason": "..." }`: records a
  manual decision and immutable audit event. Self-decisions are forbidden;
  `ADMIN` cannot review another administrator's membership.

Student IDs are trimmed and uppercased only for canonical storage and duplicate
prevention. Passing input validation never proves that an ID is genuine.

The existing `GET /api/learning` placeholder is protected by
`VerifiedMembershipGuard`: students need a `VERIFIED` membership, while
`ADMIN`/`SUPERADMIN` retain their existing administrative access. Future paid
course entitlements should be added as a separate access path rather than
changing roles or duplicating course content.

## Trusted roster prerequisite

No trusted institute roster existed in the repository before this phase. The
new `trusted_institution_students` table is intentionally not writable through
student-facing APIs. Automated approval requires all of the following:

1. An active roster row with the same canonical `student_id`.
2. A non-null `auth_user_id` populated from the corresponding Supabase Auth user.
3. An exact match between that UUID and the authenticated token's `sub` claim.

Before enabling free-access checks in production, an institute-authorized
operator must load the roster through a reviewed, server-side import. The import
should be run with a least-privilege service account, in a transaction, from an
encrypted source export; normalize IDs to uppercase, reject duplicate student
IDs and auth UUIDs, reconcile each auth UUID through Supabase administration,
and retain the source batch/checksum outside the public API. Rows without a
reliably reconciled auth UUID should keep `auth_user_id` null, which results in
`PENDING` and manual review—not automatic approval.

Manual reviewers must compare the authenticated account with original institute
records before selecting `VERIFIED`, and put a non-sensitive justification in
`reason`. They must never approve based only on the submitted ID or its format.

## Migration

`prisma/migrations/20261031123000_add_institution_membership_verification/migration.sql`
was generated with the installed Prisma CLI 7.10.1 and then reviewed. It is
additive: two enums and three tables, uniqueness/indexes, foreign keys, and
canonical/verified-state check constraints. It does not update or delete
existing rows.

The migration has not been applied. After backup and staging review, deploy it
through the normal migration pipeline with `npx prisma migrate deploy`; do not
use `prisma db push`.
