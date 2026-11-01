---
id: data/orm-prisma
title: Prisma ORM 7
description: Prisma ORM 7 - the prisma-client generator with a required output path, driver adapters, prisma.config.ts with defineConfig and explicit env loading, aligned CLI and client versions (the prisma CLI latest tag points at an 8.0 RC), migrations with migrate dev and migrate deploy, selecting only needed fields, $queryRaw and Prisma.sql instead of $queryRawUnsafe, TypedSQL, interactive transactions, client extensions instead of middleware, and connection pooling for serverless. Use when editing prisma/ files, prisma.config.ts or Prisma client code.
applies_to: "@prisma/client >=7.0 <8"
globs: ["prisma/**", "**/*prisma*.ts", "prisma.config.ts"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
  - https://www.prisma.io/docs/orm/reference/prisma-config-reference
  - https://www.prisma.io/docs/orm/prisma-migrate
  - https://www.prisma.io/docs/orm/prisma-client/queries/select-fields
  - https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
  - https://www.prisma.io/docs/orm/prisma-client/queries/transactions
  - https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool
  - https://www.prisma.io/docs/orm/reference/prisma-schema-reference
  - https://www.prisma.io/docs/orm/reference/prisma-cli-reference
  - https://www.npmjs.com/package/prisma
  - https://www.npmjs.com/package/@prisma/client
---

# Prisma ORM 7

Apply with `data/postgres` for schema design and migrations safety; NestJS projects also apply `backend/nestjs-data`.

## Version check

- Read `prisma`, `@prisma/client` and the adapter (`@prisma/adapter-pg`, `@prisma/adapter-better-sqlite3`, …) from the lockfile, the `generator` block in `schema.prisma`, and whether `prisma.config.ts` exists. State it:

  ```text
  Applying data/orm-prisma (prisma 7.10.1, @prisma/client 7.10.1, prisma-client generator, adapter-pg, prisma.config.ts).
  ```

- Current stable: 7.10.1. **The `prisma` CLI's `latest` npm tag currently points at an 8.0 release candidate** (8.0.0-rc.28) while `@prisma/client` is 7.10.1. Pin both to the same 7.x version (`npm install -D prisma@7.10.1`), never `prisma@latest`.
- Prisma 7 needs Node ≥ 20.19, TypeScript ≥ 5.4 and an ESM project (`"type": "module"`).
- **Prisma 6 or older** (`prisma-client-js`, client in `node_modules/.prisma`, URL in `schema.prisma` via `env()`, `$use` middleware): write code for the installed version and offer the upgrade through the official v7 guide as a separate change.

## Conventions

- **Generator:** `provider = "prisma-client"` with an explicit `output` (for example `../src/generated/prisma`); import the client from that path. Commit or generate it in CI consistently, and run `prisma generate` after every schema change.
- **Driver adapter:** create the client with an adapter: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. One client instance per process (a module singleton); in Next.js dev, reuse it across hot reloads.
- **Config:** `prisma.config.ts` with `defineConfig` from `prisma/config` holds `schema`, `migrations.path`, `migrations.seed` and `datasource.url`. Environment variables aren't loaded automatically; import `dotenv/config` (or use the runtime's env loading) explicitly.
- **Schema:** snake_case database names via `@map`/`@@map` for new schemas (see `conventions/phaedra`); `@db.Timestamptz(3)` for timestamps; `@relation` with explicit `onDelete`; `@@index` on foreign keys and filter columns.
- **Migrations:** `prisma migrate dev --name <change>` locally, review the generated SQL, commit `prisma/migrations/`; `prisma migrate deploy` in CI/CD. Never `prisma db push` against shared databases; never edit applied migrations. Seed with `prisma db seed` explicitly (no automatic seeding in v7).
- **Queries:** `select` only the fields you return (or `omit` for secrets); never return whole models with `passwordHash` or tokens. Paginate with `take` (capped) and cursor pagination for large tables; avoid N+1 by loading relations with `include`/`select` instead of querying in loops.
- **Transactions:** `$transaction(async (tx) => …)` for read-modify-write logic, using `tx` (not the outer client) for every query, with `timeout` and `isolationLevel` when needed; the array form for independent writes. No network calls inside.
- **Extensions:** client extensions (`$extends`) replace the removed `$use` middleware (soft delete, auditing, row-level tenant filters).

## Security

- **Raw SQL:** `$queryRaw` / `$executeRaw` tagged templates or `Prisma.sql` only; values become bound parameters. Never `$queryRawUnsafe` / `$executeRawUnsafe` with user input; for dynamic identifiers use allowlists and `Prisma.raw` only on allowlisted values. Prefer TypedSQL (`prisma/sql/*.sql`) for complex queries.
- **Filters from requests:** never pass request objects straight into `where`, `orderBy` or `data`; map validated fields explicitly so clients can't filter on hidden columns or write `role`, `tenantId` or `id`.
- **Tenancy:** add the tenant or owner condition to every query (an extension or repository method), or use Postgres RLS with a per-transaction setting (see `data/postgres`).
- **Credentials:** the database URL comes from the environment or secret manager; use TLS (`sslmode=verify-full` in the connection string or adapter config) and a least-privilege application role separate from the migration role.
- **Logging:** don't enable query logging with parameters in production (`log: ['query']`); it records PII.

## Connection pooling

- Long-running servers: set the adapter's pool size (`max` for `pg`) to fit the database's connection limit divided by instances.
- Serverless and edge: use a pooler (PgBouncer, Supavisor, Prisma Postgres or Accelerate) and its pooled URL for queries, with a direct URL for migrations; keep one client per function instance.

## Known vulnerabilities

No OSV advisories for `prisma` or `@prisma/client` as of 2026-10; the main risks are `$queryRawUnsafe` misuse and over-broad `select`. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Integration tests against a real database in a container (`prisma migrate deploy` on a fresh database first); reset between tests with transactions or truncation.
- Test that endpoints don't return secret fields, that another tenant's rows are invisible, and that raw-query helpers treat metacharacters as data.

## Before you finish

```sh
npx prisma validate
npx prisma format --check
npx prisma generate
npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code   # exit 2 if schema and migrations differ (uses the shadow database from prisma.config.ts)
npx tsc --noEmit
npm test
npm ls prisma @prisma/client   # same 7.x version
```
