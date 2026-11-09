# I-Sharp Academy local development

The repository contains two applications:

- `web/`: Next.js App Router frontend on `http://localhost:3000`
- `api/`: NestJS API on `http://localhost:3001`

## Environment

For a fresh checkout only, create missing local files from the tracked examples.
These guards preserve existing settings:

```powershell
if (-not (Test-Path web/.env.local)) { Copy-Item web/.env.example web/.env.local }
if (-not (Test-Path api/.env)) { Copy-Item api/.env.example api/.env }
```

The frontend uses the server-only `API_BASE_URL` setting. The API allows the
local origin from `FRONTEND_LOCAL_ORIGIN` and, when deployed, only the explicit
`FRONTEND_PRODUCTION_ORIGIN`. Do not put a Supabase service-role key in `web/`.

## Run locally

Open two terminals from the repository root.

```powershell
cd api
npm.cmd run start:dev
```

```powershell
cd web
npm.cmd run dev
```

Open `http://localhost:3000`. The footer reports loading, connected, or error
state for the NestJS `GET http://localhost:3001/api/health` endpoint through
the frontend's same-origin `GET /api/health` route.

## Authentication

The frontend uses `@supabase/ssr` with PKCE and cookie-backed sessions. Password
and Google sign-in share the same Supabase session lifecycle. Next.js refreshes
the session in `web/proxy.ts`; same-origin API routes forward only the access
token to NestJS. NestJS validates the Supabase JWT issuer, audience, signature
and expiry, then loads roles from PostgreSQL. Browser metadata and client-
provided role labels are never used for authorization.

### Frontend environment (`web/.env.local`)

Use these exact names. Values below are placeholders only:

```dotenv
API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-or-publishable-key>
```

The Supabase publishable/anon key is designed for browser use. Never add a
Google client secret, Supabase secret/service-role key, database password or JWT
secret to `web/` or to a `NEXT_PUBLIC_*` variable. Local `.env*` files are
ignored; only placeholder `.env.example` files are tracked.

### Google OAuth configuration

The application initiates Google OAuth from `/login` and `/administration` and
uses this callback:

```text
http://localhost:3000/auth/callback
```

In Supabase **Authentication → URL Configuration**:

- Set **Site URL** to the real production application origin in production.
- Add `http://localhost:3000/auth/callback` to **Redirect URLs** for local work.
- Add the exact production callback `https://<your-domain>/auth/callback`.
- Prefer exact production URLs instead of a broad wildcard.

In Google Cloud, the OAuth client **Authorized redirect URI** must be the
Supabase callback shown in Supabase's Google provider settings, normally:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

The Google client ID and secret belong only in Supabase's Google provider
configuration. They are not application environment variables.

### Authentication email delivery

Password signup sends a confirmation email. Supabase's built-in mail service is
only suitable for initial testing and is limited to two Auth emails per hour for
the whole project. Before accepting student registrations, configure a custom
SMTP provider in **Supabase Dashboard → Authentication → Email → SMTP
Settings**, then set the required project email quota in **Authentication →
Rate Limits**. Keep **Confirm email** enabled: the verified address is used to
match a student safely against the I-Sharp roster.

SMTP credentials are configured in Supabase, never in `web/.env.local` or any
`NEXT_PUBLIC_*` variable. Google signup remains available while confirmation
email delivery is temporarily rate-limited.

After `/auth/callback` exchanges the one-time PKCE code, it calls NestJS
`GET /api/auth/me`. Existing `STUDENT`, `ADMIN`, or `SUPERADMIN` database roles
select the destination. A valid Google identity with no approved database role
goes to `/auth/pending`; Google sign-in never auto-assigns a privileged role.

Protected API test endpoints:

- `GET /api/test/student` (`STUDENT` or `SUPERADMIN`)
- `GET /api/test/admin` (`ADMIN` or `SUPERADMIN`)
- `GET /api/test/superadmin` (`SUPERADMIN` only)

The browser reaches these through same-origin `/api/access/{area}` routes. API
guards remain the authorization boundary; hidden frontend navigation is not
treated as proof of access.

### Local Google OAuth test

1. Start the API and frontend with Supabase and PostgreSQL configured.
2. Verify the local callback is allow-listed in Supabase.
3. Open `http://localhost:3000/login` and select **Continue with Google**.
4. Cancel once to verify the friendly cancellation state on `/login`.
5. Complete sign-in with an identity already linked to a `UserProfile` and role;
   verify it reaches the correct dashboard.
6. With an unapproved Google identity (only if your test policy permits), verify
   `/auth/pending` appears and protected API calls remain forbidden. Do not use a
   production identity merely to perform this test.

## Checks

```powershell
cd api
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

```powershell
cd web
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```
