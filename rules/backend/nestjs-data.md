---
id: backend/nestjs-data
title: NestJS data access (Sequelize, TypeORM, Prisma)
description: Database access in NestJS 12 with Sequelize, TypeORM or Prisma - repository and client injection, the transaction pattern per ORM, query helpers with allow-listed filters and sort fields, no raw SQL with user input, pagination, N+1 avoidance, migrations and connection security. Use when editing services, query helpers, models, entities, schema.prisma or migrations in a NestJS project.
applies_to: "@nestjs/core >=12.0 <13"
legacy_rule: legacy/nestjs-legacy
globs: ["src/**/*.service.ts", "src/**/*.helper.ts", "src/**/*.entity.ts", "src/**/*.model.ts", "src/**/migrations/**/*.ts", "prisma/schema.prisma", "prisma.config.ts", "libs/**/models/**/*.ts"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://docs.nestjs.com/techniques/database
  - https://docs.nestjs.com/recipes/sql-sequelize
  - https://docs.nestjs.com/recipes/prisma
  - https://sequelize.org/docs/v6/other-topics/transactions/
  - https://sequelize.org/docs/v6/core-concepts/raw-queries/
  - https://typeorm.io/docs/advanced-topics/transactions/
  - https://typeorm.io/docs/releases/1.0/release-notes/
  - https://www.infoq.com/news/2026/06/typeorm-1-released/
  - https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
  - https://www.prisma.io/docs/orm/prisma-client/queries/transactions
  - https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
  - https://www.npmjs.com/package/typeorm
  - https://www.npmjs.com/package/sequelize
  - https://www.npmjs.com/package/@prisma/client
  - https://osv.dev/vulnerability/GHSA-6457-6jrx-69cr
  - https://osv.dev/vulnerability/GHSA-v8fg-2rw7-q452
  - https://osv.dev/vulnerability/GHSA-wrh9-cjv3-2hpw
  - https://osv.dev/vulnerability/GHSA-2rp8-mm9q-fp49
  - https://osv.dev/vulnerability/GHSA-9ggv-8w38-r7pm
  - https://osv.dev/vulnerability/GHSA-q2pj-6v73-8rgj
---

# NestJS data access

Apply with `backend/nestjs`. Use `data/postgres` for schema and SQL rules when the project is on Postgres.

## Version check

- Detect the ORM from the lockfile and state it with its version:
  - **Sequelize:** `@nestjs/sequelize`, `sequelize` (6.x), usually `sequelize-typescript`. Minimum safe 6.37.8.
  - **TypeORM:** `@nestjs/typeorm`, `typeorm`. 1.x is current (1.1.2); 0.3.x is still common. Minimum safe 1.1.0 or 0.3.31.
  - **Prisma:** `prisma`, `@prisma/client`. 7.x is current (7.10.1); Prisma 8 is a release candidate, so don't adopt it unasked.
- Follow the ORM and version the project uses. Never add a second ORM.
- Prisma 7 changed setup: the `prisma-client` generator with a required `output`, a driver adapter (for example `@prisma/adapter-pg`) passed to `PrismaClient`, and the connection URL in `prisma.config.ts`. Don't write Prisma 6 setup in a Prisma 7 project, or the reverse.
- TypeORM 1.0 removed the global helpers (`getRepository`, `getConnection`, `createConnection`) and now throws on `null`/`undefined` in `where`. On 0.3.x those values are silently dropped (see Security).

## Conventions

### Injection

```ts
// Sequelize
constructor(@InjectModel(Order) private readonly orderModel: typeof Order, private readonly sequelize: Sequelize) {}
// TypeORM
constructor(@InjectRepository(Order) private readonly orders: Repository<Order>, private readonly dataSource: DataSource) {}
// Prisma
constructor(private readonly prisma: PrismaService) {}
```

- Register models with `SequelizeModule.forFeature([...])` or `TypeOrmModule.forFeature([...])` in the feature module. Use `forRootAsync` with `ConfigService` for connection settings.
- Prisma: one `PrismaService` that extends `PrismaClient` (with the driver adapter on 7.x), exported from a `PrismaModule`.
- Data access lives in services and `helpers/*-query.helper.ts`. Controllers never touch models, repositories or `PrismaService`.

### Transactions

Use the ORM's managed (callback) transaction: it commits when the callback resolves and rolls back when it throws. Every query inside must use the transaction handle.

```ts
// Sequelize
return this.sequelize.transaction(async (transaction) => {
  const order = await this.orderModel.create(data, { transaction });
  await this.stockModel.decrement('quantity', { by: data.quantity, where: { productId: data.productId }, transaction });
  return order;
});

// TypeORM: use the manager, not the injected repositories (they run outside the transaction)
return this.dataSource.transaction(async (manager) => {
  const order = await manager.getRepository(Order).save(data);
  await manager.getRepository(Stock).decrement({ productId: data.productId }, 'quantity', data.quantity);
  return order;
});

// Prisma: use tx, not this.prisma
return this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data });
  await tx.stock.update({ where: { productId: data.productId }, data: { quantity: { decrement: data.quantity } } });
  return order;
});
```

- Forgetting `{ transaction }` (Sequelize) or using `this.orders` / `this.prisma` inside the callback runs that query outside the transaction. Check every call.
- Keep transactions short. No HTTP calls, queue jobs, emails or real-time publishes inside; do them after the commit (or write an outbox row in the transaction).
- Set an isolation level when the logic reads then writes the same rows (balances, stock), or use row locks (`lock: transaction.LOCK.UPDATE`, `setLock('pessimistic_write')`, `SELECT … FOR UPDATE` via `$queryRaw`), or an atomic update.
- Use a manual try/commit/rollback only where the project already does, and always roll back in `catch` and rethrow.

### Query helpers

- Build `where` clauses in pure helper functions from already-validated filter DTOs: `buildOrderWhere(filters, user)`. Always add the tenant or owner condition inside the helper.
- Sort fields and directions come from an allowlist map, never straight from the query string:

  ```ts
  const ORDER_SORT = { createdAt: 'created_at', total: 'total' } as const;
  const column = ORDER_SORT[query.sortBy] ?? 'created_at';
  const direction = query.sortDir === 'asc' ? 'ASC' : 'DESC';
  ```

- Escape `%` and `_` in user text used in `LIKE`/`ILIKE` patterns.
- Select only the columns you return (`attributes`, `select`). Don't load whole rows to read one field.
- New Postgres schemas use snake_case: `underscored: true` (Sequelize), a snake-case naming strategy (TypeORM), `@map`/`@@map` (Prisma). Keep an existing schema's naming.

### Pagination

- Every list endpoint paginates. Default `limit` 20, maximum 100, enforced in the query schema.
- Offset pagination (`limit`/`offset`, `take`/`skip`) is fine for admin tables and small sets. Use keyset (cursor) pagination for feeds, exports and large or growing tables: `WHERE (created_at, id) < (:cursorCreatedAt, :cursorId) ORDER BY created_at DESC, id DESC LIMIT :n`.
- Always order by a unique tie-breaker (`id`) so pages don't repeat or skip rows.
- Return `{ items, nextCursor }` or `{ items, total, page, limit }`. Run the total count only when the UI needs it.

### N+1 queries

- Never query inside a loop over results. Load relations with the parent query (`include` in Sequelize and Prisma, `relations` or `leftJoinAndSelect` in TypeORM) or batch with one `IN (...)` query and a map.
- Sequelize `hasMany` includes with `limit`: use `separate: true`, or the row count explodes.
- Don't use TypeORM lazy relations or `eager: true` on entities; load relations explicitly per query.
- GraphQL resolvers: batch field loads with a request-scoped DataLoader.
- Add indexes for the columns used in filters, joins and sort orders.

## Security

- **No raw SQL with user input.** Parameterize every value:
  - Sequelize: `sequelize.query(sql, { bind: { id }, type: QueryTypes.SELECT })` (`bind` is sent separately to the database; `replacements` are escaped into the SQL text).
  - TypeORM: `.where('o.status = :status', { status })`; `dataSource.query(sql, [param])`. Never interpolate into `.where()`, `.orderBy()` or `.andWhere()` strings.
  - Prisma: `$queryRaw` and `$executeRaw` tagged templates or `Prisma.sql`. Never pass user input to `$queryRawUnsafe` or `$executeRawUnsafe`.
- Identifiers (column, table, sort direction, JSON path) can't be parameterized; map them through an allowlist.
- TypeORM 0.3.x: `findOne({ where: { id: undefined } })` ignores the condition and returns the first row. Check that every `where` value is defined before querying; on 1.x this throws.
- Never spread a request DTO into `create`/`update` without validation that strips unknown keys. Set `tenantId`, `ownerId`, `role` and `id` from the authenticated context, never from the body.
- Sequelize: keep `operatorsAliases` off. Don't let user input choose JSON paths or casts (CVE-2026-30951).
- Migrations, not schema sync: `synchronize: false` (TypeORM) and no `sequelize.sync({ alter | force })` outside local development. Review generated migrations before committing.
- Connect over TLS with CA verification (`ssl: { ca, rejectUnauthorized: true }` or the driver equivalent); never `rejectUnauthorized: false` in production. Use a least-privilege database user per service.
- Turn off SQL logging with bound values in production; it writes PII and secrets to logs.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Affected | Fixed |
|---|---|---|---|
| CVE-2026-30951: SQL injection via JSON column cast type | sequelize | 6.0.0-beta.1 – 6.37.7 | 6.37.8 |
| CVE-2026-69240: SQL injection (Oracle dialect) | sequelize | < 6.37.4 | 6.37.4 |
| CVE-2023-25813: SQL injection via `replacements` | sequelize | < 6.19.1 | 6.19.1 |
| CVE-2026-73651: code injection in `migration:generate` output | typeorm | < 0.3.31; 1.0.x | 0.3.31 / 1.1.0 |
| GHSA-9ggv-8w38-r7pm: SQL injection in update/soft-delete `orderBy` (MySQL, MariaDB) | typeorm | 0.1.12 – 0.3.28 | 0.3.29 |
| CVE-2025-60542: SQL injection via crafted `save`/`update` input | typeorm | < 0.3.26 | 0.3.26 |

No OSV advisories for `prisma` or `@prisma/client` as of 2026-10. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Integration-test services against a real database in a container (Testcontainers or Compose), not SQLite standing in for Postgres or MySQL.
- For each transaction: force a failure on the second write and assert the first was rolled back.
- For each list endpoint: assert `limit` is capped, ordering is stable across pages, and another tenant's rows never appear.
- Assert query counts for list endpoints with relations (enable ORM query logging in the test and count), so N+1 regressions fail.
- Feed SQL metacharacters and unknown sort fields through filters and assert a 400 or a safe default.

## Before you finish

```sh
npx tsc --noEmit -p tsconfig.json
npm run lint
npm test
npm run test:e2e                         # if present
npx prisma validate && npx prisma generate   # Prisma projects
npx prisma migrate status                # or: npx typeorm migration:show -d <data-source>, npx sequelize-cli db:migrate:status
npm audit --audit-level=moderate
npm ls sequelize typeorm @prisma/client  # at or above the minimums above
```
