---
id: data/orm-sequelize-typeorm
title: Sequelize and TypeORM
description: Sequelize 6 and TypeORM 1.x (0.3 legacy) outside or alongside NestJS - version status (Sequelize 6.37.8 with v7 still alpha; TypeORM 1.1 with Node.js 20+), raw-query safety with replacements, bind parameters and query-builder parameters, allowlisted dynamic identifiers, reviewed migrations instead of sync/synchronize, transactions passed through every call, N+1 avoidance with includes, relations and batching, snake_case for new Postgres schemas, and the 2025-2026 SQL injection advisories. Use when editing Sequelize models, TypeORM entities, data sources or migrations.
applies_to: "sequelize >=6.0 <8, typeorm >=0.3 <2"
globs: ["**/*.entity.ts", "**/models/**/*.{ts,js}", "ormconfig.*", "**/data-source.ts", "**/migrations/**", ".sequelizerc"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://sequelize.org/docs/v6/core-concepts/raw-queries/
  - https://sequelize.org/docs/v6/other-topics/migrations/
  - https://sequelize.org/docs/v6/other-topics/transactions/
  - https://sequelize.org/docs/v6/core-concepts/assocs/
  - https://typeorm.io/docs/migrations/why/
  - https://typeorm.io/docs/advanced-topics/transactions/
  - https://typeorm.io/docs/query-builder/select-query-builder/
  - https://typeorm.io/docs/releases/1.0/release-notes/
  - https://www.npmjs.com/package/sequelize
  - https://www.npmjs.com/package/typeorm
  - https://osv.dev/list?ecosystem=npm&q=typeorm
---

# Sequelize and TypeORM

NestJS projects also follow `backend/nestjs-data` (module wiring, injected repositories, transaction patterns). Postgres specifics are in `data/postgres`.

## Version check

- Read `sequelize`, `sequelize-cli`, `sequelize-typescript` or `typeorm` and the database driver (`pg`, `mysql2`, `mssql`, `sqlite3`) from the lockfile. State them:

  ```text
  Applying data/orm-sequelize-typeorm (typeorm 1.1.2, pg 8, migrations in src/migrations, Node.js 24).
  ```

- **Sequelize:** 6.37.8 is current and the minimum safe version; v7 (`@sequelize/core`) is still alpha, so don't adopt it for production. `sequelize-cli` 6.6 runs migrations.
- **TypeORM:** 1.1.2 is current; 0.3.31 is the legacy line (minimum safe 1.1.0 / 0.3.31). TypeORM 1.0 requires Node.js 20+ and removed the global helpers (`getRepository`, `getConnection`, `getManager`); use a `DataSource` and its repositories. Read the upgrade guide before moving from 0.3.
- New projects: prefer the team's default ORM (see `data/orm-prisma` or `data/orm-drizzle`); keep Sequelize or TypeORM where they already exist.

## Conventions

- **Schema changes only through migrations**: Sequelize `sequelize-cli` migrations or TypeORM `migration:generate`/`migration:create`; `sync()` / `sync({ alter: true })` and `synchronize: true` only in throwaway local databases or tests, never in shared or production environments.
- Review generated migrations (TypeORM may drop and recreate columns on renames); write `down` migrations; data backfills in separate migrations; destructive changes in two releases.
- New Postgres schemas use snake_case: Sequelize `underscored: true` in model defaults; TypeORM a snake_case naming strategy (or explicit `name` on columns); camelCase in code.
- Entities and models describe columns with explicit types, nullability and lengths; indexes for foreign keys and filter columns.
- Connections: one `Sequelize` instance or `DataSource` per process, pool sizes set for the deployment, timeouts configured; credentials from the environment or a secret manager.

## Queries and N+1

- Never query inside a loop over results. Load relations with the parent query:
  - Sequelize: `include: [{ model: Item, attributes: ['id', 'sku'] }]`; with `hasMany` plus `limit`, use `separate: true` to avoid row multiplication;
  - TypeORM: `relations: { items: true }` on `find`, or `leftJoinAndSelect` in the query builder; avoid `eager: true` and lazy relations on entities.
- Batch lookups with `Op.in` / `In([...])` or a DataLoader in GraphQL resolvers.
- Select only needed columns (`attributes`, `select`); paginate with `limit`/`take` and stable ordering; `raw: true` or `getRawMany()` for read-only reporting.
- Log slow queries in staging and check plans with `EXPLAIN` for new queries.

## Transactions

- Sequelize: managed transactions (`sequelize.transaction(async (t) => { ... })`) and pass `{ transaction: t }` to **every** call inside, or enable CLS for automatic propagation.
- TypeORM: `dataSource.transaction(async (manager) => { ... })` and use `manager` (or `manager.getRepository(...)`) inside; injected or module-level repositories run outside the transaction.
- Keep transactions short; no network calls inside; set isolation levels deliberately for counters and balances, or use row locks (`lock: true` / `setLock('pessimistic_write')`).

## Security

- **Raw queries:**
  - Sequelize: `sequelize.query(sql, { replacements: { id } })` or `bind: [id]`, never string concatenation; don't put user input into `literal()`, `fn()` arguments as SQL text, or JSON path/cast expressions (CVE-2026-30951).
  - TypeORM: query-builder parameters (`.where('o.id = :id', { id })`), `dataSource.query(sql, [id])`; never interpolate into `where`, `orderBy`, `addSelect` or `query()` strings.
- **Dynamic identifiers:** sort fields, columns and directions from requests go through an allowlist (`{ createdAt: 'o.created_at' }`, direction limited to `ASC`/`DESC`).
- **Mass assignment:** create and update from validated DTOs with allowlisted fields (`fields` option in Sequelize); never `Model.update(req.body)` or `repository.save(req.body)`; the latter is also the CVE-2025-60542 vector on old TypeORM.
- **Authorization:** tenant and owner filters on every query; scopes or base repositories can enforce them but don't replace checks in services.
- **Migration code:** review generated migration files like code; TypeORM before 0.3.31 / 1.1.0 could emit injected code from crafted schema names (CVE-2026-73651).
- **Errors and logging:** don't return SQL errors to clients; disable `logging` of queries with parameters in production.

## Known vulnerabilities

| Advisory | Package | Fixed in |
| --- | --- | --- |
| CVE-2026-30951 SQL injection via JSON column cast type | sequelize | 6.37.8 |
| CVE-2026-69240 SQL injection (Oracle dialect) | sequelize | 6.37.4 |
| CVE-2026-73651 code injection in `migration:generate` output | typeorm | 0.3.31, 1.1.0 |
| GHSA-9ggv-8w38-r7pm SQL injection in update/soft-delete `orderBy` (MySQL/MariaDB) | typeorm | 0.3.29 |
| CVE-2025-60542 SQL injection via crafted `save`/`update` input | typeorm | 0.3.26 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Integration tests against the real database engine (Testcontainers); run all migrations up and down in CI.
- Tests for N+1 (count queries per request with query logging) and for injection attempts on sort and filter parameters.

## Before you finish

```sh
npx sequelize-cli db:migrate:status                     # Sequelize
npx typeorm migration:show -d src/data-source.ts        # TypeORM (use typeorm-ts-node-commonjs/esm for TS sources)
npx tsc --noEmit && npm test
npm audit --audit-level=moderate
grep -rnE 'synchronize: *true|sync\(\{ *alter|query\(`[^`]*\$\{' src/   # expect no matches outside tests
```
