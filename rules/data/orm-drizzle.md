---
id: data/orm-drizzle
title: Drizzle ORM
description: Drizzle ORM 0.45 stable and the 1.0 release candidate with drizzle-kit - version status (0.45.4 on latest, 1.0.0-rc on the rc tag), schema-first TypeScript tables with snake_case casing, relational queries v1 vs v2 (defineRelations in 1.0), generated and reviewed migrations with drizzle-kit generate and migrate instead of push in production, the sql template tag versus sql.raw, allowlisting dynamic identifiers (CVE-2026-39356), transactions, prepared statements, connection pooling for serverless, and drizzle.config.ts without secrets. Use when editing Drizzle schema, queries, migrations or drizzle.config.ts.
applies_to: "drizzle-orm >=0.44 <2"
globs: ["drizzle/**", "**/schema.ts", "**/db/schema/**", "drizzle.config.*"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://orm.drizzle.team/docs/overview
  - https://orm.drizzle.team/docs/sql
  - https://orm.drizzle.team/docs/migrations
  - https://orm.drizzle.team/docs/kit-overview
  - https://orm.drizzle.team/docs/transactions
  - https://orm.drizzle.team/docs/rqb
  - https://orm.drizzle.team/docs/upgrade-v1
  - https://orm.drizzle.team/docs/relations-v1-v2
  - https://orm.drizzle.team/docs/latest-releases
  - https://www.npmjs.com/package/drizzle-orm
  - https://github.com/drizzle-team/drizzle-orm/security/advisories/GHSA-gpj5-g38j-94v9
---

# Drizzle ORM

Also apply `data/postgres` for Postgres projects, `data/supabase` when the database is Supabase, and `languages/typescript`.

## Version check

- Read `drizzle-orm` and `drizzle-kit` from the lockfile and the driver (`postgres`, `pg`, `@neondatabase/serverless`, `mysql2`, `better-sqlite3`, `@libsql/client`). State them:

  ```text
  Applying data/orm-drizzle (drizzle-orm 0.45.4, drizzle-kit 0.31.11, postgres-js, relational queries v1).
  ```

- **Status (Oct 2026):** `drizzle-orm` **0.45.4** and `drizzle-kit` **0.31.11** are on `latest`; **1.0 is a release candidate** (`1.0.0-rc.5` on the `rc` tag). Stay on 0.45 for production unless the team has chosen the RC; don't mix 0.x and 1.0 packages.
- **1.0 changes:** relational queries v2 with `defineRelations()`, object-style `where` and `orderBy` (v1 queries move to `db._query` during migration), a new migrations folder layout without `journal.json` (convert with `drizzle-kit up`), and `drizzle-kit drop` removed. Follow the official upgrade guide.
- Minimum safe: **0.45.2** (or 1.0.0-beta.20+) for CVE-2026-39356.

## Conventions

- Schema in TypeScript (`src/db/schema/*.ts`) as the source of truth; export tables and relations from one entry the config points at.
- New Postgres schemas use snake_case columns: set `casing: 'snake_case'` on the client and in `drizzle.config.ts` (or name columns explicitly), with camelCase in TypeScript.
- Primary keys `uuid` (`defaultRandom()`) or identity columns; `timestamp('created_at', { withTimezone: true }).defaultNow().notNull()`; foreign keys with explicit `onDelete`; indexes for every foreign key and query filter.
- Use the query builder (`db.select().from(orders).where(eq(orders.userId, userId))`) or relational queries (`db.query.orders.findMany({ with: { items: true } })`) to avoid N+1; select only the columns you need.
- Types from the schema: `typeof orders.$inferSelect` / `$inferInsert`; validation schemas from `drizzle-zod` (or the project's Standard Schema library) for inputs.
- One client per process; in serverless use the provider's pooled or HTTP driver (Neon, Supabase pooler on port 6543 with `prepare: false` for postgres-js in transaction mode).

## Migrations

- `drizzle-kit generate` creates SQL migrations from schema changes; review every generated SQL file (renames can appear as drop + add) and commit it.
- Apply with `drizzle-kit migrate` or the runtime `migrate()` in a deploy step; never `drizzle-kit push` against shared or production databases (it's for local prototyping).
- Destructive changes in two steps (add new column, backfill, switch reads, drop later); custom SQL migrations (`drizzle-kit generate --custom`) for data backfills and RLS policies.
- `drizzle.config.ts` reads the URL from the environment (`process.env.DATABASE_URL`); no credentials in the file.

## Security

- **Raw SQL:** the `sql` template tag parameterizes values: `` sql`select * from orders where id = ${id}` `` is safe. **`sql.raw()` inserts text as-is**; never pass user input to it.
- **Dynamic identifiers:** sort columns, table names and aliases from requests must map through an allowlist to schema objects (`const sortable = { createdAt: orders.createdAt, total: orders.total }`). Don't build identifiers with `sql.identifier()` or `.as()` from user input; before 0.45.2 they didn't escape quote characters (CVE-2026-39356).
- **Authorization:** every query on user data includes the tenant or owner filter; consider Postgres RLS for multi-tenant data (`pgPolicy` in the schema, or SQL migrations) with a non-owner database role.
- **Mass assignment:** insert and update from validated objects with allowlisted fields; never `db.update(users).set(req.body)`.
- **Least privilege:** the app connects with a role that can't alter the schema; migrations run with a separate role.
- **Errors:** don't return driver errors with SQL or values to clients.

## Known vulnerabilities

- `drizzle-orm`: **CVE-2026-39356** (high), SQL injection via improperly escaped identifiers in `sql.identifier()`, `.as()` and related APIs on PostgreSQL, MySQL, SQLite, SingleStore and Gel; fixed in 0.45.2 and 1.0.0-beta.20.
- No OSV advisories for `drizzle-kit` as of 2026-10.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Integration tests against a real database (Testcontainers, PGlite for Postgres-compatible unit tests, or a disposable branch database); run migrations from scratch in CI.
- Test allowlisted sorting and filtering with hostile values (`"name\"; drop table x; --"`) and expect validation errors.

## Before you finish

```sh
npx drizzle-kit generate          # expect "No schema changes" if migrations are committed
npx drizzle-kit check             # validates migration consistency
npx tsc --noEmit
npm test
grep -rn "sql.raw(" src/          # each use must be static text
```
