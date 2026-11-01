---
id: backend/express
title: Express 5
description: Express 5 APIs and security - async errors reaching the error handler, path-to-regexp v8 route syntax, the simple query parser, middleware order, request validation with a Standard Schema library, one error handler, helmet, CORS allowlists, express-rate-limit, body limits, trust proxy, CSRF for cookie sessions, uploads and patched transitive dependencies. Use when editing Express apps, routers or middleware.
applies_to: "express >=5.0 <6"
legacy_rule: legacy/express-4
globs: ["src/**/*.{ts,js}", "server.*", "app.*"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://expressjs.com/en/guide/migrating-5.html
  - https://expressjs.com/en/blog/2025-03-31-v5-1-latest-release/
  - https://expressjs.com/en/support/
  - https://expressjs.com/en/advanced/best-practice-security.html
  - https://expressjs.com/en/guide/behind-proxies.html
  - https://expressjs.com/en/guide/error-handling.html
  - https://github.com/pillarjs/path-to-regexp
  - https://helmetjs.github.io/
  - https://express-rate-limit.mintlify.app/
  - https://standardschema.dev/
  - https://www.npmjs.com/package/express
  - https://www.npmjs.com/package/csrf-csrf
  - https://osv.dev/vulnerability/GHSA-27v5-c462-wpq7
  - https://osv.dev/vulnerability/GHSA-j3q9-mxjg-w52f
  - https://osv.dev/vulnerability/GHSA-27r3-jxmh-p828
  - https://osv.dev/vulnerability/GHSA-v422-hmwv-36x6
  - https://osv.dev/vulnerability/GHSA-6pq8-jhm2-2vcw
  - https://osv.dev/vulnerability/GHSA-46wh-pxpv-q5gq
  - https://osv.dev/vulnerability/GHSA-q7qp-rjg7-q26m
---

# Express 5

Also apply `languages/javascript-node` (and `languages/typescript` for TS). Generic web security is in `core/security-baseline`; this rule adds Express specifics.

## Version check

- Read `express`, `router`, `path-to-regexp`, `body-parser`, `qs`, `helmet`, `express-rate-limit` and `multer` from the lockfile, and state it:

  ```text
  Applying backend/express (express 5.3.0, router 2.2, path-to-regexp 8.4, helmet 8, from package-lock.json).
  ```

- Express 5 is the active line (latest 5.3.0) and needs Node ≥ 18; use a supported Node LTS (see `languages/javascript-node`). **Express 4.x** is in maintenance (since 1 Apr 2025, EOL no sooner than 1 Oct 2026) → use `legacy/express-4` and offer `upgrade-express`.
- Transitive packages decide most Express advisories; check that the lockfile resolves `path-to-regexp` ≥ 8.4.0, `body-parser` ≥ 2.4.0 and `qs` ≥ 6.16.1 (see Known vulnerabilities).

## Conventions

### App structure

```text
src/
├── app.ts            # builds the app: middleware, routers, error handler; no listen()
├── server.ts         # listen(), timeouts, graceful shutdown
├── config.ts         # env parsed and validated once
├── middleware/       # auth, validate, request-id, error-handler
└── modules/orders/   # orders.router.ts, orders.service.ts, orders.schemas.ts
```

- Export the app from `app.ts` so tests can use it without opening a port.
- Routers per feature; handlers call services; services don't see `req`/`res`.

### Middleware order

1. `app.disable('x-powered-by')`, `trust proxy` setting
2. request ID and logging
3. `helmet()`
4. CORS
5. rate limiting
6. body parsers with limits (`express.json({ limit: '100kb' })`, `express.urlencoded({ extended: false, limit: '100kb' })`)
7. cookies and sessions, then CSRF protection for cookie-authenticated routes
8. authentication
9. routers (with per-route authorization and validation)
10. a 404 handler, then the error handler (four arguments) last

### Express 5 specifics

- Async handlers: a rejected promise or thrown error reaches the error handler automatically. Don't wrap handlers in `asyncHandler` helpers or add `try/catch` just to call `next(err)`.
- Route syntax (path-to-regexp 8): wildcards are named (`/*splat`, or `/{*splat}` to also match the root), optional parts use braces (`/:file{.:ext}`), regex characters and `?` aren't supported in strings; use arrays of paths or a `RegExp`. `req.params` wildcard values are arrays.
- `req.query` uses the `simple` parser (no nested objects or arrays from `a[b]=1`). Don't turn on `query parser: 'extended'` unless needed; if you do, validate the result and cap depth.
- `req.body` is `undefined` when no body parser ran or the body is empty; validate before use.
- Removed in 5: `app.del`, `req.param()`, `res.send(status, body)` and `res.json(obj, status)`, `res.sendfile`, pluralized `req.accepts*` singular forms. Use `res.status(201).json(…)`.

### Validation

Validate `params`, `query` and `body` at the edge with a Standard Schema library (Zod by default; see `conventions/phaedra`), replace the raw values with the parsed output, and return 400 with field errors:

```ts
export const validate = <S extends StandardSchemaV1>(part: 'body' | 'query' | 'params', schema: S) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema['~standard'].validate(req[part]);
    if (result.issues) return res.status(400).json({ error: 'invalid_request', issues: result.issues });
    res.locals[part] = result.value;
    next();
  };

router.post('/orders', requireAuth, validate('body', createOrderSchema), createOrder);
```

- Read validated data from `res.locals` (Express 5 makes `req.query` a getter, so don't reassign it).
- Strip unknown keys (`z.object`) or reject them (`z.strictObject`) on write routes; never pass `req.body` straight to the ORM.

### Errors

- One error handler that maps known errors (validation, not found, forbidden, conflict) to status codes and returns a generic 500 for the rest. Log the error with the request ID; never send stack traces or internal messages in production.
- Set `NODE_ENV=production` in production (Express hides stack traces and caches views).

## Security

- **Headers:** `helmet()` (v8) with a CSP tuned for the app; `app.disable('x-powered-by')`.
- **CORS:** `cors({ origin: [allowlist], credentials: true })` from config. Never reflect any `Origin` with credentials, never `'*'` with cookies.
- **Rate limiting:** `express-rate-limit` (≥ 8.2.2) globally and stricter on login, reset, OTP and expensive routes; use a shared store (Redis) with more than one instance.
- **Trust proxy:** set `app.set('trust proxy', <hop count or proxy IPs>)` to match the real deployment, never `true` behind an unknown chain; otherwise `req.ip`, rate limits and `req.secure` are wrong or spoofable.
- **Sessions and cookies:** `httpOnly`, `secure`, `sameSite: 'lax'` (or `strict`), a server-side session store, and regenerating the session ID on login. `csurf` is deprecated; for cookie-authenticated forms use `csrf-csrf` or a same-origin check on `Origin`/`Sec-Fetch-Site` for state-changing requests.
- **Authorization:** check permissions per route and per resource in the service (owner or tenant), not only "is logged in".
- **Static files and downloads:** `express.static` with `dotfiles: 'ignore'` (default) and an explicit root; `res.sendFile` / `res.download` with the `root` option and a validated name, never a user-built absolute path.
- **Redirects:** only to relative paths or an allowlist of hosts.
- **Uploads:** `multer` (≥ 2.5.0) with `limits` (`fileSize`, `files`, `fields`), memory or disk storage outside the web root, type checks on content, not just the extension.
- **Server timeouts:** set `server.requestTimeout`, `headersTimeout` and `keepAliveTimeout`, and run behind a reverse proxy that limits body size and slow clients.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Affected | Fixed |
|---|---|---|---|
| CVE-2026-4923, CVE-2026-4926: ReDoS and DoS via multiple wildcards and sequential optional groups | path-to-regexp (via router) | 8.0.0 – 8.3.x | 8.4.0 |
| CVE-2026-111181: DoS via trailing bytes after a compressed body | body-parser | < 1.20.9; 2.0.0 – 2.3.x | 1.20.9 / 2.4.0 |
| CVE-2026-12590: invalid `limit` value silently disables the size limit | body-parser | < 1.20.6; 2.0.0 – 2.2.x | 1.20.6 / 2.3.0 |
| CVE-2026-110816, CVE-2026-82417, CVE-2026-82562 and earlier `arrayLimit` bypasses: DoS | qs | < 6.16.1 | 6.16.1 |
| CVE-2026-30827: IPv4-mapped IPv6 addresses bypass per-client limits | express-rate-limit | 8.0.0 – 8.2.1 | 8.2.2 |
| CVE-2026-113872 and 13 other 2025–2026 DoS and size-limit bypasses | multer | < 2.5.0 | 2.5.0 |
| CVE-2024-43796: XSS via `res.redirect()` | express | 5.0.0 betas | 5.0.0 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Use `supertest` against the exported app. For each route: 401 without auth, 403/404 for another user's resource, 400 for invalid or unknown fields, and the success case.
- Test the error handler returns no stack traces with `NODE_ENV=production`.
- Test rate limits and body-size limits once each, and that `req.ip` is correct behind the configured proxy.

## Before you finish

```sh
npx tsc --noEmit                    # TypeScript projects
npm run lint
npm test
npm audit --audit-level=moderate
npm ls express path-to-regexp body-parser qs multer express-rate-limit   # at or above the fixed versions
```
