---
id: legacy/express-4
title: Express 4
description: Safe maintenance of Express 4 apps - maintenance status (since 1 Apr 2025, EOL no sooner than 1 Oct 2026), async error handling without Express 5, patched transitive packages (path-to-regexp 0.1.x, body-parser 1.x, qs, send, serve-static, cookie), the deprecated csurf, and the migration path to Express 5. Use when the installed express is 4.x.
applies_to: "express >=4.0 <5"
globs: ["src/**/*.{ts,js}", "server.*", "app.*"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://expressjs.com/en/blog/2025-03-31-v5-1-latest-release/
  - https://expressjs.com/en/support/
  - https://expressjs.com/en/guide/migrating-5.html
  - https://expressjs.com/en/advanced/best-practice-security.html
  - https://www.herodevs.com/support/express-nes
  - https://www.npmjs.com/package/csurf
  - https://www.npmjs.com/package/csrf-csrf
  - https://osv.dev/vulnerability/GHSA-37ch-88jc-xwx2
  - https://osv.dev/vulnerability/GHSA-rhx6-c78j-4q9w
  - https://osv.dev/vulnerability/GHSA-27r3-jxmh-p828
  - https://osv.dev/vulnerability/GHSA-v422-hmwv-36x6
  - https://osv.dev/vulnerability/GHSA-qwcr-r2fm-qrc7
  - https://osv.dev/vulnerability/GHSA-qw6h-vgh9-j6wx
  - https://osv.dev/vulnerability/GHSA-rv95-896h-c2vc
  - https://osv.dev/vulnerability/GHSA-m6fv-jmcg-4jfg
  - https://osv.dev/vulnerability/GHSA-cm22-4g7w-348p
  - https://osv.dev/vulnerability/GHSA-pxg6-pf52-xh8x
  - https://osv.dev/vulnerability/GHSA-6rw7-vpxm-498p
---

# Express 4

Also apply `core/legacy-mode` and the Security section of `backend/express` (helmet, CORS, rate limits, trust proxy, sessions, uploads); they apply to Express 4 too. Don't migrate to Express 5 as part of an unrelated task.

## Version check

- Read `express` and its transitive packages from the lockfile (`npm ls express path-to-regexp body-parser qs send serve-static cookie`), and state it:

  ```text
  Applying legacy/express-4 (express 4.21.2, path-to-regexp 0.1.12, body-parser 1.20.3, Node 20, from package-lock.json).
  ```

- **Status:** Express 4 entered maintenance on 1 Apr 2025 with EOL no sooner than 1 Oct 2026; only the latest 4.x release (4.22.3, Sep 2026) is supported. Expect security fixes only. Commercial extended support exists (HeroDevs NES).
- **Minimum safe:** `express` 4.22.3 with `path-to-regexp` ≥ 0.1.13, `body-parser` ≥ 1.20.9, `qs` ≥ 6.16.1, `send` ≥ 0.19.0, `serve-static` ≥ 1.16.0, `cookie` ≥ 0.7.0. Old lockfiles often pin vulnerable transitive versions even when `express` looks current.
- Express 3 and older: EOL since 2015; report it and propose a rewrite or move to Express 5.

## Conventions

- **Async errors don't reach the error handler in Express 4.** A rejected promise in a handler leaves the request hanging or crashes the process. Wrap async handlers:

  ```js
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  router.get('/orders/:id', wrap(async (req, res) => { res.json(await orders.findOne(req.params.id)); }));
  ```

  Use the project's existing wrapper (`express-async-handler`, `express-async-errors`) if it has one; don't add a second.
- Keep Express 4 route syntax (`/*`, `/:id?`) until the migration; don't write Express 5 syntax (`/*splat`, `{.:ext}`) here.
- `req.query` uses the `extended` (`qs`) parser by default: nested objects and arrays come from the query string. Validate them with a schema and never pass `req.query` straight to a database filter (operator injection like `?role[$ne]=x`).
- Use `res.status(code).json(body)`, `req.params`/`req.body`/`req.query` (not `req.param()`), `app.delete` (not `app.del`); these also ease the migration.
- Validation, error handler, middleware order and structure: as in `backend/express`.

## Safe maintenance

- Update within 4.x (`npm install express@^4.22.3`), then run `npm update path-to-regexp body-parser qs send serve-static cookie` and check `npm ls` shows the fixed versions. Use `overrides` only when a transitive fix can't arrive otherwise, and remove it later.
- Don't add new middleware that requires Express 5 or a newer Node than the project runs.
- `csurf` is deprecated and unmaintained: don't add it. For existing uses, plan a replacement (`csrf-csrf` or a same-origin check on `Origin`/`Sec-Fetch-Site`).
- Keep `body-parser` limits explicit (`express.json({ limit: '100kb' })`); an invalid `limit` value silently disabled limits before 1.20.6.

## Security

- `res.redirect()` with user input: only relative paths or allowlisted hosts (CVE-2024-43796 and CVE-2024-29041 were redirect XSS and open-redirect bugs).
- Route patterns with several parameters in one segment (`/:a-:b`) or many optional parts are where path-to-regexp ReDoS bugs live; keep patterns simple and the package patched.
- Pair Express 4 with a supported Node line; Node 20 and older are EOL (see `legacy/node-legacy`).

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed in 4.x line |
|---|---|---|
| CVE-2026-4867 / CVE-2024-45296, CVE-2024-52798: ReDoS in route matching | path-to-regexp 0.1.x | 0.1.13 |
| CVE-2026-111181: DoS via trailing bytes after a compressed body | body-parser 1.x | 1.20.9 |
| CVE-2026-12590: invalid `limit` silently disables the size limit | body-parser 1.x | 1.20.6 |
| CVE-2024-45590: DoS with URL-encoded bodies | body-parser 1.x | 1.20.3 |
| CVE-2025-15284, CVE-2026-2391, CVE-2026-82417, CVE-2026-110816: `qs` array-limit bypasses and crashes (DoS) | qs | 6.16.1 |
| CVE-2024-43796: XSS via `res.redirect()`; CVE-2024-29041: open redirect | express | 4.20.0 / 4.19.2 |
| CVE-2024-43799, CVE-2024-43800: template injection → XSS | send, serve-static | 0.19.0 / 1.16.0 |
| CVE-2024-47764: out-of-bounds characters in cookie name, path, domain | cookie | 0.7.0 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

1. Patch Express 4 and its transitive packages (above); get tests green.
2. Move to a supported Node LTS if needed (`upgrade-node`).
3. Prepare in 4.x: replace removed APIs (`app.del`, `req.param()`, `res.send(status, body)`, singular `req.accepts*`), and stop relying on `req.body` defaulting to `{}`.
4. Upgrade with the `upgrade-express` skill: official codemods, route syntax changes, the `simple` query parser and async error handling.
5. Remove async wrappers after the upgrade (Express 5 handles rejected promises).

## Testing

- Before any upgrade, make sure tests cover each route's success, validation and auth failures, plus redirects and static files.
- Add a test that an async handler throwing returns your error response (proves the wrapper works).

## Before you finish

```sh
npm test
npm audit --audit-level=moderate
npm ls express path-to-regexp body-parser qs send serve-static cookie   # at or above the fixed versions
grep -rnE "\.del\(|req\.param\(|res\.(send|json)\([0-9]{3}," src 2>/dev/null   # APIs removed in Express 5
```
