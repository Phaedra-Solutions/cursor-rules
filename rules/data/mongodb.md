---
id: data/mongodb
title: MongoDB and Mongoose
description: MongoDB 7.0-9.0 with Mongoose 8-9, the Node.js driver 6-7 or PyMongo 4 - supported server versions, schema design and $jsonSchema validation, Mongoose schemas with strict mode, NoSQL operator injection prevention (no user objects in filters, sanitizeFilter, casting, $where and $function banned), projection and lean reads, indexes, transactions on replica sets, least-privilege database users, TLS and network access, and the 2024-2026 Mongoose and PyMongo advisories. Use when editing Mongoose models, MongoDB queries or driver configuration.
applies_to: "mongoose >=8.0 <10, mongodb >=6.0 <8"
globs: ["**/*.model.{ts,js}", "**/models/**", "**/*mongo*"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://endoflife.date/mongodb
  - https://www.mongodb.com/docs/manual/core/schema-validation/
  - https://www.mongodb.com/docs/manual/administration/security-checklist/
  - https://www.mongodb.com/docs/manual/core/authorization/
  - https://www.mongodb.com/docs/manual/core/transactions/
  - https://mongoosejs.com/docs/guide.html
  - https://mongoosejs.com/docs/api/mongoose.html#Mongoose.prototype.sanitizeFilter()
  - https://mongoosejs.com/docs/migrating_to_9.html
  - https://mongoosejs.com/docs/version-support.html
  - https://mongoosejs.com/docs/tutorials/lean.html
  - https://cheatsheetseries.owasp.org/cheatsheets/NoSQL_Security_Cheat_Sheet.html
  - https://www.mongodb.com/docs/languages/python/pymongo-driver/current/
  - https://osv.dev/list?ecosystem=npm&q=mongoose
---

# MongoDB and Mongoose

Language rules apply too (`languages/typescript`, `languages/javascript-node`, `languages/python`); NestJS projects also follow `backend/nestjs-data`.

## Version check

- Read `mongoose`, `mongodb` (Node.js driver) or `pymongo` from the lockfile and the server version (Atlas cluster tier, `db.version()`, Docker image tag). State them:

  ```text
  Applying data/mongodb (Atlas MongoDB 8.0, mongoose 9.11, mongodb driver 7.7, replica set).
  ```

- **Server (endoflife.date, Oct 2026):** 9.0 (Sep 2026), 8.3 and 8.0 are supported; 7.0 ends on 31 Aug 2027; 8.2 and 6.0 are past end of life.
- **Mongoose:** 9.x is current (9.11.4); 8.x still gets fixes (8.24.x); 7.x is in legacy support. Mongoose 9 removed `next()` in pre middleware (use `async` functions); read the 8→9 migration guide before upgrading. Minimum safe versions: **9.7.2, 8.24.1, 7.8.10, 6.13.10**.
- **Drivers:** Node.js `mongodb` 7.x (6.21 still maintained); PyMongo 4.19 with the built-in async API (`AsyncMongoClient`). Motor was deprecated on 14 May 2026; migrate to PyMongo Async. Minimum safe PyMongo: **4.18.3**.

## Conventions

- Model for the queries you run: embed data read together, reference data that grows unbounded or is shared; no unbounded arrays in documents.
- Mongoose schemas with types, `required`, enums, `min`/`max`, `trim`; `strict: true` (the default) so unknown fields are dropped; `timestamps: true`.
- Database-level validation with `$jsonSchema` validators for collections written by more than one service; `validationAction: "error"`.
- Indexes declared in code and created by migrations or a deploy step (`autoIndex: false` in production); compound indexes match query order (equality, sort, range); check with `explain()`.
- Reads with projection (`.select()`), `.lean()` when you don't need documents, and pagination with range queries on indexed fields instead of large `skip`.
- Multi-document writes that must succeed together use transactions (`session.withTransaction`) on a replica set or Atlas; keep them short.
- Field names in camelCase for Mongoose models; a migration tool (`migrate-mongo` or the project's choice) for data changes.

## Security

- **Operator injection:** never pass request objects straight into filters or updates. `User.find({ email: req.body.email })` with `{ "email": { "$ne": null } }` returns every user.
  - validate input with the project's schema library (types must be strings, numbers, ObjectIds);
  - cast explicitly (`String(value)`, `new Types.ObjectId(id)` after `isValidObjectId`);
  - enable Mongoose `sanitizeFilter` (`mongoose.set('sanitizeFilter', true)`) and use `mongoose.trusted()` only for operators you add yourself;
  - build updates from allowlisted fields with `$set`, never `Model.updateOne(filter, req.body)`.
- **Server-side JavaScript:** no `$where`, `$function`, `$accumulator` or `mapReduce` with user input; disable server-side scripting (`security.javascriptEnabled: false`) on self-hosted servers.
- **Prototype pollution:** reject keys starting with `$` or containing `.`/`__proto__` in user-supplied objects used as paths.
- **Mass assignment:** separate input DTOs from models; never let clients set `role`, `isAdmin`, `ownerId` or `balance`.
- **Authorization:** every query that reads or modifies user data includes the tenant or owner filter.
- **Database users:** one user per service with built-in or custom roles limited to its database and collections (`readWrite` on one db, not `root` or `dbAdminAnyDatabase`); SCRAM-SHA-256 or X.509; credentials from a secret manager.
- **Network and TLS:** TLS on (`mongodb+srv` on Atlas does this); IP access lists or private endpoints; never bind self-hosted servers to `0.0.0.0` without auth and a firewall. Enable auditing and encryption at rest for sensitive data; consider Queryable Encryption or CSFLE for regulated fields.
- **Errors:** don't return driver errors (duplicate-key messages include values) to clients.

## Known vulnerabilities

| Package | Advisory | Fixed in |
| --- | --- | --- |
| mongoose | CVE-2026-73562 prototype pollution in update casting via `__proto__`-prefixed paths | 9.7.2, 8.24.1, 7.8.10, 6.13.10 |
| mongoose | CVE-2026-42334 `$nor` not sanitized by `sanitizeFilter` (NoSQL injection) | 9.1.6, 8.22.1, 7.8.9, 6.13.9 |
| mongoose | CVE-2025-23061 and CVE-2024-53900 `$where` in `populate()` `match` (search injection) | 8.9.5, 7.8.4, 6.13.6 |
| pymongo | CVE-2026-106435 out-of-bounds read decoding malformed BSON regex | 4.18.3 |
| pymongo | CVE-2026-96748 host injection in connection-string parsing; CVE-2026-96749 heap overflow in BSON encoding; CVE-2026-96747 forced Unix socket via KMS endpoint | 4.18.2 |
| pymongo | CVE-2026-88029 GridFS delete by non-exact file ID | 4.18.1 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Integration tests against a real MongoDB (Testcontainers or `mongodb-memory-server` with a replica set for transactions); no mocks for query behavior.
- Injection tests: send `{ "$ne": null }`, `{ "$gt": "" }` and `$where` payloads to login, search and update endpoints and expect validation errors.
- Check new queries with `explain('executionStats')` for collection scans.

## Before you finish

```sh
npm ls mongoose mongodb           # or: pip show pymongo
npm test                          # integration tests with a real server
npm audit --audit-level=moderate  # or: pip-audit
grep -rnE '\$where|\$function|mapReduce|updateOne\([^,]+, *req\.body|find\(req\.(body|query)\)' src/ 2>/dev/null
```
