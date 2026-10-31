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

The existing Supabase login forms remain in place. After sign-in, the frontend
passes the Supabase access token in an `Authorization: Bearer` header to the
same-origin session route. That route calls NestJS `GET /api/auth/me`; NestJS
validates the JWT and loads roles from PostgreSQL. Client-provided role labels
are never used for authorization.

## Checks

```powershell
cd api
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

```powershell
cd web
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```
