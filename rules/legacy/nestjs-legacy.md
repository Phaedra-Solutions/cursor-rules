---
id: legacy/nestjs-legacy
title: NestJS 11 and older, and Bull queues
description: Safe maintenance of NestJS 11 and older (including NestJS 10 and earlier, which get no fixes) and Bull (@nestjs/bull) queues - support status, minimum safe versions, unfixed advisories on 10.x, the processor retry rule, devtools-integration CVE-2025-54782 and the migration path to NestJS 12 and BullMQ. Use when the installed @nestjs/core is below 12 or the project uses @nestjs/bull.
applies_to: "@nestjs/core >=8.0 <12"
globs: ["src/**/*.module.ts", "src/**/*.controller.ts", "src/**/*.service.ts", "src/**/*.guard.ts", "src/**/*.dto.ts", "src/**/*.processor.ts", "nest-cli.json"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://github.com/nestjs/nest/issues/18247
  - https://www.herodevs.com/support/nestjs-nes
  - https://docs.nestjs.com/v11/migration-guide
  - https://trilon.io/blog/announcing-nestjs-11-whats-new
  - https://docs.nestjs.com/migration-guide
  - https://www.npmjs.com/package/@nestjs/core
  - https://docs.nestjs.com/techniques/queues
  - https://github.com/OptimalBits/bull
  - https://endoflife.date/nodejs
  - https://osv.dev/vulnerability/GHSA-96h4-vgxj-gvm2
  - https://osv.dev/vulnerability/GHSA-m8vh-jmq9-5rjg
  - https://osv.dev/vulnerability/GHSA-9c5c-9qcx-q35q
  - https://osv.dev/vulnerability/GHSA-6v32-fjc9-9qf6
  - https://osv.dev/vulnerability/GHSA-hpwf-8g29-85qm
  - https://osv.dev/vulnerability/GHSA-36xv-jgw5-4q75
  - https://osv.dev/vulnerability/GHSA-wf42-42fg-fg84
  - https://osv.dev/vulnerability/GHSA-r4wm-x892-vjmx
  - https://osv.dev/vulnerability/GHSA-8wpr-639p-ccrj
  - https://osv.dev/vulnerability/GHSA-cj7v-w2c7-cp7c
  - https://osv.dev/vulnerability/GHSA-4jpv-8r57-pv7j
  - https://osv.dev/vulnerability/GHSA-85cg-cmq5-qjm7
---

# NestJS 11 and older, and Bull

Also apply `core/legacy-mode`. Don't upgrade as part of an unrelated task. The layout, controller and service, data-access and transport-security conventions in `backend/nestjs`, `backend/nestjs-data` and `backend/nestjs-microservices` still apply, except the v12-only APIs listed below.

## Version check

- Read `@nestjs/core`, `@nestjs/common`, the platform package, `@nestjs/microservices`, `@nestjs/bull`/`bull` or `@nestjs/bullmq`/`bullmq`, and the Node version from the lockfile, and state the rule you're applying:

  ```text
  Applying legacy/nestjs-legacy (@nestjs/core 11.2.8, platform-express, @nestjs/bull 11.0.5, Node 22, from package-lock.json).
  ```

- **Support status:**
  - **11.x:** maintained; the maintainers expect patches "very likely until the end of 2027". Latest 11.2.8. Minimum safe **11.2.5**.
  - **10.x:** unsupported. Last release 10.4.22 (Jan 2026). The 2026 Fastify middleware-bypass and microservice DoS advisories have **no 10.x fix**. Report it as end of life and propose `upgrade-nestjs`; commercial extended support exists for 6.x–10.x (HeroDevs NES).
  - **9.x and older:** unsupported; same handling as 10.x.
- Node: v11 needs Node ≥ 20 (use 22 or 24; Node 20 is EOL). v10 runs on Node 16+, but Node 16, 18 and 20 are EOL; note it in the summary.
- **12.x or newer:** use `backend/nestjs` (and this rule only for files that still use Bull).

## Conventions

- Keep the project's validation, test runner and module format. v11 apps are CommonJS with `ValidationPipe` + class-validator and Jest; leave them that way.
- Don't use v12-only APIs: the `schema` option on `@Body`/`@Query`/`@Param`/`@Payload`, `StandardSchemaValidationPipe`, `StandardSchemaSerializerInterceptor`, built-in `cookies`, `app.enableCsrfProtection()`, `app.useSecurityHeaders()`, `@nestjs/observe`, `nest upgrade`. Use their predecessors:

  | Need | NestJS ≤ 11 |
  |---|---|
  | Validation | `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` + class-validator DTOs, or a Zod pipe the project already has |
  | Response shaping | `ClassSerializerInterceptor` with `@Exclude()`, or explicit response DTOs |
  | Security headers | `helmet` (Express) / `@fastify/helmet` (Fastify) |
  | Cookies | `cookie-parser` / `@fastify/cookie` |
  | CSRF (cookie auth) | `csrf-csrf` / `@fastify/csrf-protection` |
  | Rate limiting | `@nestjs/throttler` as an `APP_GUARD` |

- v11 on Express 5: route wildcards must be named (`@Get('files/*splat')`, `forRoutes('{*splat}')`), optional segments use braces (`/:file{.:ext}`), and the query parser is `simple` (no nested objects) unless the app sets `query parser` to `extended`. Write routes for the installed Express major.
- `Reflector.getAllAndOverride()` returns `T | undefined` on v11; handle the `undefined` case in guards.
- Register the auth guard globally with `APP_GUARD` and a `@Public()` opt-out, as in `backend/nestjs`.

### Bull (`@nestjs/bull`)

Bull is in maintenance mode (bug fixes only); its last release is 4.16.5 (Dec 2024). Keep existing Bull queues working; create new queues with BullMQ (`backend/nestjs-microservices`).

```ts
@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-welcome')
  async sendWelcome(job: Job<{ userId: string }>): Promise<void> {
    try {
      await this.emailService.sendWelcome(job.data.userId);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
```

- **A processor must throw on failure.** Returning a value from `catch` (`return { success: false }`) marks the job completed, and `attempts`/`backoff` never retry it. When you touch a processor, fix any catch-and-return you find and say so in the summary.
- Set `attempts` and `backoff` (`{ type: 'exponential', delay: 5000 }`) on every job or in `defaultJobOptions`, plus `removeOnComplete` and `removeOnFail` limits.
- Bull registers Redis with `redis: { … }`; BullMQ uses `connection: { … }`. Don't mix the two packages on one queue name: they store jobs differently.
- Validate `job.data` at the start of the handler; keep IDs, not secrets, in job data.

## Safe maintenance

- Stay on the latest patch of the installed major. For 11.x, move every `@nestjs/*` framework package to the same latest 11.2.x.
- Never use middleware for authentication or authorization, on any version; the Fastify bypasses below hit path-scoped middleware. On 10.x with Fastify, move any auth middleware into guards now.
- On 10.x with `@nestjs/microservices`, keep TCP transports off shared networks and in front of nothing reachable from the internet; there is no patched 10.x release.
- `@nestjs/devtools-integration`: ≥ 0.2.1 (or the v12 package), development only, never imported in production builds.
- Don't add new dependencies that require Node newer than the project runs, or NestJS 12 peers.

## Security

See `core/security-baseline` and the Security sections of `backend/nestjs`, `backend/nestjs-data` and `backend/nestjs-microservices`; they apply here with the ≤ 11 equivalents above. Legacy specifics:

- class-validator only validates class-typed parameters. A handler parameter typed as an interface, `any` or `Record<…>` is unvalidated; give it a DTO class.
- Without `whitelist: true`, extra body fields reach `create`/`update` (mass assignment). Turn it on globally; if that breaks clients, list the fields they send and ask the user before forbidding them.
- Server-Sent Events below 11.1.18: never put user input into SSE `data`, `id` or `event` fields (CVE-2026-35515).
- `@nestjs/common` below 10.4.16 or 11.0.16 is affected by CVE-2024-29409 (Content-Type handling); upgrade within the major.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed in 11.x | 10.x |
|---|---|---|---|
| GHSA-96h4-vgxj-gvm2: TCP transport unbounded memory growth | microservices | 11.2.5 | no fix |
| CVE-2026-102281: process crash from a deeply nested message pattern | microservices | 11.2.4 | no fix |
| GHSA-9c5c-9qcx-q35q: middleware bypass via absolute-form request targets | platform-fastify | 11.2.4 | no fix |
| CVE-2026-54281: middleware bypass via trailing slash | platform-fastify | 11.1.24 | no fix |
| CVE-2026-40879: `JsonSocket` recursion DoS (TCP) | microservices | 11.1.19 | no fix |
| CVE-2026-35515: SSE event injection | core | 11.1.18 | no fix |
| CVE-2026-33011: middleware bypass via `HEAD` | platform-fastify | 11.1.16 | no fix |
| CVE-2026-2293: middleware bypass via URL encoding | platform-fastify | 11.1.14 | no fix |
| CVE-2025-69211: middleware bypass via URL encoding (TOCTOU) | platform-fastify | 11.1.11 | no fix |
| CVE-2024-29409: Content-Type handling | common | 11.0.16 | 10.4.16 |
| CVE-2023-26108: information exposure via `StreamableFile` | core | not affected | not affected (fixed in 9.0.5) |
| CVE-2025-54782: devtools CSRF to RCE on the developer machine | devtools-integration | 0.2.1 | 0.2.1 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

1. Patch the installed major (11.x → latest 11.2.x). Record a passing baseline of build, tests and e2e.
2. On 10.x or older, upgrade **one major at a time** to 11 first: Node 20+ (prefer 22/24), Express 5 route syntax, Fastify 5, `@nestjs/config` 4, `@nestjs/cache-manager` with Keyv, reversed shutdown-hook order.
3. Upgrade 11 → 12 with `nest upgrade` (TypeScript 6, keeps CommonJS). Jest loads v12 packages only on Node 24.9+; otherwise plan Vitest.
4. Move Bull queues to BullMQ one queue at a time, draining the old queue first (see `upgrade-nestjs`).
5. Afterwards, offer optional follow-ups: Standard Schema validation, built-in CSRF/headers/cookies, ESM, Vitest and oxlint. Never bundle them into the version upgrade.

Use the `upgrade-nestjs` skill for each step.

## Testing

- Keep the existing runner (usually Jest). Before any upgrade, make sure e2e tests cover auth (401/403), validation (400 on unknown fields) and one route per controller.
- Bull: test that a failing handler throws and the job is retried (`attemptsMade` > 1), and that a job succeeding on retry ends in `completed`.
- On Fastify, test `HEAD`, trailing-slash and percent-encoded variants of protected routes.

## Before you finish

```sh
npx tsc --noEmit -p tsconfig.json
npm run lint
npm test
npm run test:e2e                      # if present
npm run build
npm audit --audit-level=moderate
npm ls @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/platform-fastify @nestjs/microservices   # one version, ≥ 11.2.5 on 11.x
```
