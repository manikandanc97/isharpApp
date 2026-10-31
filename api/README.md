<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

This project is already instrumented. To connect it, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It writes the app key and secret into `.env` and makes every `nest start` script (`start`, `start:dev`, `start:debug`) load it. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand: create an application and an API key at [observe.nestjs.com](https://observe.nestjs.com), and set the pair as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment the app runs in.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Authentication and RBAC

Protected endpoints require a Supabase access token in `Authorization: Bearer <token>`. Configure:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
# Optional; defaults to "authenticated"
SUPABASE_JWT_AUDIENCE=authenticated
# Only for a project still using legacy HS256 signing. Prefer Supabase JWKS.
SUPABASE_JWT_SECRET=<server-side-secret>
```

The API verifies signature, issuer, audience, expiry/not-before, and the UUID subject. Authorization roles are then loaded from PostgreSQL; token metadata and request bodies are never trusted as role sources. The authenticated Supabase UUID remains separate from academic data in `UserProfile.authUserId`.

`GET /api/auth/me` returns the authenticated UUID, linked profile ID, and
database-backed roles. It requires a valid Supabase Bearer token.

## Frontend connection and CORS

The API listens on `PORT` (default `3001`). `GET /api/health` checks both the
API and PostgreSQL. CORS allows `FRONTEND_LOCAL_ORIGIN` (default
`http://localhost:3000`) and the optional explicit
`FRONTEND_PRODUCTION_ORIGIN`; all other browser origins are rejected. Wildcard
origins are not used with credentials.

The reviewed migration `prisma/migrations/20261031090000_seed_rbac_roles/migration.sql` only upserts the canonical `STUDENT`, `ADMIN`, and `SUPERADMIN` role rows. Review and apply it through the normal deployment process; the application does not apply migrations automatically.

### Initial SUPERADMIN and ADMIN

The initial-admin setup is a CLI-only, two-stage operation. It creates exactly
one marked Supabase Auth account for each role through normal email signup.
Configure the distinct target addresses with `INITIAL_SUPERADMIN_EMAIL` and
`INITIAL_ADMIN_EMAIL`. The command does not auto-confirm either account. After
both people confirm their Supabase emails, rerunning the command atomically
creates or links their active profiles and idempotently assigns the roles.

1. Confirm that Supabase email confirmation is enabled and the canonical role
   migration has been deployed. The project must allow email signup from this
   trusted environment; if Auth CAPTCHA is enforced for signup, complete account
   creation through a separately reviewed operator process instead of weakening
   CAPTCHA or auto-confirming users.
2. Configure the initial-admin variables documented in `.env.example` in the
   existing `.env` file without replacing its database or Supabase settings.
   Never commit `.env`. `DATABASE_URL` must be a complete `postgresql://` URL;
   URL-encode any reserved characters in its password. The setup explicitly
   loads `.env`; values already set by the operating environment take
   precedence and are not overwritten.
3. From `api/`, verify authenticated PostgreSQL connectivity without making any
   Supabase request or creating accounts:

   ```powershell
   $env:INITIAL_ADMINS_SETUP_CONFIRM = 'CREATE_INITIAL_PRIVILEGED_ACCOUNTS'
   try {
     npm.cmd run setup-initial-admins -- --check-database-only
   } finally {
     Remove-Item Env:INITIAL_ADMINS_SETUP_CONFIRM -ErrorAction SilentlyContinue
   }
   ```

   This performs `SELECT 1` and stops. Correct `DATABASE_URL`, network, SSL, or
   database availability problems before continuing.

4. After the connectivity check succeeds, run the setup:

   ```powershell
   $env:INITIAL_ADMINS_SETUP_CONFIRM = 'CREATE_INITIAL_PRIVILEGED_ACCOUNTS'
   try {
     npm.cmd run setup-initial-admins
   } finally {
     Remove-Item Env:INITIAL_ADMINS_SETUP_CONFIRM -ErrorAction SilentlyContinue
   }
   ```

5. If the command reports that confirmation is pending, both users must use the
   Supabase verification emails. Then rerun the exact same command.
6. After success, remove the four `INITIAL_*` setup values from `.env` and
   rotate the initial passwords through Supabase Auth.

The command refuses existing unmarked email accounts, duplicate setup
markers, existing unexpected privileged assignments, inactive profiles,
auto-confirm configuration, and insufficient service-role permissions. Auth
users created during a partial first run are recognized by protected
`app_metadata`, so retrying does not create duplicates. Database profile and
role writes run in one transaction. No public initial-admin endpoint exists, and
the command never prints credentials, keys, tokens, emails, or user UUIDs.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
