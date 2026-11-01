---
id: backend/fastify-hono
title: Fastify and Hono
description: Fastify 5 and Hono 4 HTTP services - confirm the framework from package.json, plugin and app structure, JSON Schema or Standard Schema validation (Fastify schemas with response serialization; Hono validator with Zod), error handlers, security headers, CORS allowlists, rate and body limits, trustProxy settings, cookies, JWT middleware pitfalls, static file serving, and the many 2026 Fastify and Hono advisories (minimum safe Fastify 5.12.6, Hono 4.13.11, @hono/node-server 2.1.3). Use when editing a Fastify or Hono app.
applies_to: "fastify >=5.0 <6, hono >=4.0 <5"
globs: ["src/**/*.ts", "src/**/*.js", "server.ts", "app.ts", "index.ts"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/
  - https://fastify.dev/docs/latest/Reference/Server/
  - https://fastify.dev/docs/latest/Guides/Recommendations/
  - https://hono.dev/docs/
  - https://hono.dev/docs/guides/validation
  - https://hono.dev/docs/middleware/builtin/secure-headers
  - https://hono.dev/docs/middleware/builtin/body-limit
  - https://www.npmjs.com/package/fastify
  - https://www.npmjs.com/package/hono
  - https://osv.dev/vulnerability/GHSA-389g-gv7q-r4x8
  - https://osv.dev/vulnerability/GHSA-p68q-wchp-6fh7
  - https://osv.dev/vulnerability/GHSA-3m5p-2c4r-xxw2
  - https://osv.dev/vulnerability/GHSA-247c-9743-5963
  - https://osv.dev/vulnerability/GHSA-5r4p-p66f-jhc7
  - https://osv.dev/vulnerability/GHSA-88fw-hqm2-52qc
  - https://osv.dev/vulnerability/GHSA-f67f-6cw9-8mq4
  - https://osv.dev/vulnerability/GHSA-f23p-vx2j-j53r
  - https://osv.dev/vulnerability/GHSA-rmxm-3fg6-px4f
---

# Fastify and Hono

**Confirm the framework first:** this rule's globs match any TypeScript server file, so check `package.json` for `fastify` or `hono` before applying it; for Express use `backend/express`, for NestJS `backend/nestjs`. Also apply `languages/javascript-node` (or the Bun/Deno/Workers runtime docs) and `languages/typescript`.

## Version check

- Read `fastify` and its `@fastify/*` plugins, or `hono` and its adapter (`@hono/node-server`, Bun, Deno, Cloudflare Workers, AWS Lambda), from the lockfile, and state them:

  ```text
  Applying backend/fastify-hono (hono 4.13.14 on @hono/node-server 2.1.5, zod validator, Node 24).
  ```

- Current (Oct 2026): Fastify **5.12.7**, Hono **4.13.14**. Fastify 4 is unsupported → follow `core/legacy-mode` and upgrade. **Minimum safe:** Fastify **5.12.6**, Hono **4.13.11**, `@hono/node-server` **2.1.3** (see Known vulnerabilities; both had many 2026 advisories in validation, proxy headers, static files and auth middleware).

## Conventions

### Fastify

- Structure with plugins (`fastify-plugin` for shared decorators), autoloaded routes, and encapsulation; register security plugins at the root.
- Declare a JSON Schema (or TypeBox / Zod via a type provider) for `body`, `querystring`, `params` and `headers` on every route, and a `response` schema so serialization drops undeclared fields.
- Use `setErrorHandler` to map errors to a consistent JSON body; never send `err.message` from internals; keep the default Ajv `removeAdditional`/strict settings deliberate.
- Server options: `bodyLimit`, `connectionTimeout`, `requestTimeout`, `trustProxy` set to the real hop count or proxy IPs (not `true`).

### Hono

- Group routes with `app.route('/orders', orders)`; keep handlers small; type `c.var` with `Variables` for request-scoped values.
- Validate inputs with `@hono/zod-validator` (or `@hono/standard-validator`) for `json`, `query`, `param`, `form` and `header`, and read `c.req.valid('json')` only.
- `app.onError` and `app.notFound` for a consistent error contract; don't expose stack traces.
- Pick the adapter for the runtime and read its security notes (Lambda and Lambda@Edge adapters had header-merging bugs in 2026).

## Security

- **Headers:** `@fastify/helmet` or Hono `secureHeaders()`; CSP for HTML responses.
- **CORS:** `@fastify/cors` or Hono `cors()` with an explicit origin list. Never reflect arbitrary origins with credentials (Hono below 4.12.25 did that with some `origin` settings).
- **Rate and size limits:** `@fastify/rate-limit` / a Hono rate limiter or gateway; Fastify `bodyLimit`, Hono `bodyLimit()` (patched versions handle chunked and Lambda bodies); multipart limits (`@fastify/multipart` `limits`).
- **Proxies:** trust forwarded headers only from known proxies (Fastify `trustProxy` hop-count spoofing fixed in 5.12.1; Hono IP restriction and `getConnInfo` behind proxies).
- **Auth:** with Hono `jwt()`/`jwk()`, always pass the expected `alg` and verify `exp`/`nbf`; older versions defaulted unsafely (CVE-2026-22817, CVE-2026-22818). Authorize per resource in handlers, not only by route prefix: Fastify's encapsulated-plugin auth could be bypassed with malformed URLs before 5.12.2.
- **Cookies:** use the framework helpers with `httpOnly`, `secure`, `sameSite`; never pass user input as cookie names or attributes (Hono cookie injection fixes in 4.12.x).
- **Static files:** serve from a dedicated directory with the patched `serveStatic`; several path-traversal and double-decoding bugs were fixed in 2026. Don't put secrets or source in the served root.
- **JSX/SSR (Hono):** escape user content; patched versions fix several `hono/jsx` escaping and cross-request context leaks.
- **Proxy helper (Hono):** strip hop-by-hop headers and validate upstream URLs (SSRF).

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2026-107832: header validation bypass via case-sensitive property names | fastify 5.12.2–5.12.5 | 5.12.6 |
| CVE-2026-76169 (auth bypass via malformed URLs in encapsulated plugins), CVE-2026-84504, CVE-2026-84428, CVE-2026-84469 (validation bypasses) | fastify | 5.12.2 |
| CVE-2026-16732 (`X-Forwarded-*` spoofing with hop-count `trustProxy`), CVE-2026-18504 (schema bypass) | fastify | 5.12.1 |
| CVE-2026-33806 / CVE-2026-25223 / CVE-2026-3419: body validation bypass via malformed `Content-Type` | fastify | 5.8.5 / 5.7.2 / 5.8.1 |
| CVE-2026-109955: `serveStatic` double-decodes the path | hono 4.12.4–4.13.10 | 4.13.11 |
| CVE-2026-118663: `serveStatic` double-decodes the path | @hono/node-server 1.19.10–2.1.2 | 2.1.3 |
| CVE-2026-71850 (`memo()` cross-user SSR output), CVE-2026-93981 (unescaped JSX), CVE-2026-84364 (body parser memory) | hono | 4.12.34 / 4.13.7 / 4.13.5 |
| CVE-2026-54290: CORS reflects any origin with credentials | hono | 4.12.25 |
| CVE-2026-22817, CVE-2026-22818: JWT/JWK algorithm confusion | hono | 4.11.4 |

Hono had 44 GitHub advisories published in 2026; stay on the latest patch. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Fastify: `app.inject()` per route; Hono: `app.request()` (or `testClient`). Cover 401/403/404, 400 for invalid or extra fields, oversized bodies, and responses that omit undeclared fields.
- Test static-file routes with `..`, encoded and double-encoded traversal, and protected paths with repeated slashes and mixed case.

## Before you finish

```sh
npx tsc --noEmit
npm run lint
npm test
npm audit --audit-level=moderate
npm ls fastify hono @hono/node-server 2>/dev/null   # at or above the minimum safe versions
```
