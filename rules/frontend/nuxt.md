---
id: frontend/nuxt
title: Nuxt 4
description: Nuxt 4 conventions and security - the app/ directory layout, useFetch and useAsyncData with explicit keys and shallow data, runtimeConfig with only public keys on the client, server routes with validated h3 readers and auth, route middleware as UX only, nuxt-security headers and limits, server islands and payload caching cautions, devtools off in production, and the 2026 Nuxt advisories with minimum safe 4.6.2. Use when editing nuxt.config.*, app/ or server/ in a Nuxt 4 project.
applies_to: "nuxt >=4.0 <5"
legacy_rule: legacy/vue2-nuxt2
globs: ["nuxt.config.*", "app/**", "server/**"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-11-01
sources:
  - https://github.com/nuxt/nuxt/security/advisories/GHSA-9v7c-q64q-vv33
  - https://nuxt.com/docs/4.x/community/roadmap
  - https://nuxt.com/docs/4.x/getting-started/upgrade
  - https://nuxt.com/docs/4.x/getting-started/data-fetching
  - https://nuxt.com/docs/4.x/guide/going-further/runtime-config
  - https://nuxt.com/docs/4.x/guide/directory-structure/server
  - https://v1.h3.dev/utils/request
  - https://nuxt-security.vercel.app/
  - https://www.npmjs.com/package/nuxt
  - https://osv.dev/vulnerability/GHSA-vjh5-4x84-xrqp
  - https://osv.dev/vulnerability/GHSA-xfq5-w38q-pc2x
  - https://osv.dev/vulnerability/GHSA-jjm6-p2m9-9w4x
  - https://osv.dev/vulnerability/GHSA-9473-5f9j-94wq
  - https://osv.dev/vulnerability/GHSA-wm8w-6qjm-cv43
  - https://osv.dev/vulnerability/GHSA-6gq8-jgmh-3ffp
  - https://osv.dev/vulnerability/GHSA-279x-mwfv-vcqv
  - https://osv.dev/vulnerability/GHSA-5w89-w975-hf9q
---

# Nuxt 4

Also apply `frontend/vue`. Server code also follows `languages/javascript-node`; generic web security is in `core/security-baseline`.

## Version check

- Read `nuxt`, `nitropack`, `h3`, `@nuxt/devtools` and modules (`nuxt-security`, `@nuxtjs/i18n`, `@nuxt/content`, `@nuxtjs/mdc`) from the lockfile, and state them:

  ```text
  Applying frontend/nuxt (nuxt 4.6.3, nitropack 2.13, h3 1.15 via @nuxt/nitro-server, nuxt-security 2.7, from pnpm-lock.yaml).
  ```

- **Status:** Nuxt 4 is stable (released 16 Jul 2025; latest 4.6.3) and supported until at least six months after Nuxt 5; **Nuxt 5 (Nitro v3) is scheduled for Q4 2026**. You can preview its changes with `future: { compatibilityVersion: 5 }` on 4.2+, only if the user asks.
- **Nuxt 3 reached EOL on 31 Jul 2026** and Nuxt 2 earlier → `legacy/vue2-nuxt2`, offer `upgrade-nuxt`.
- **Minimum safe:** `nuxt` 4.6.3, `@nuxt/devtools` 3.3.1, `nitropack` 2.13.4, `h3` 1.15.9 (see Known vulnerabilities).

## Conventions

- Layout: `app/` holds `pages/`, `components/`, `composables/`, `layouts/`, `middleware/`, `plugins/`, `utils/`, `app.vue`; `server/` holds `api/`, `routes/`, `middleware/`, `utils/`; `shared/` for code used by both. Don't add Nuxt 3 root-level folders to a Nuxt 4 project.
- **Data fetching:** `useFetch` / `useAsyncData` with an explicit, unique key when the call is shared or dynamic; `data` is a `shallowRef` and starts as `undefined`, so replace values instead of mutating deeply. Use `$fetch` for event-driven calls (form submits), not `useFetch` inside handlers.
- `server/` handlers: `defineEventHandler`, one file per route (`server/api/orders/[id].get.ts`), shared logic in `server/utils/`.
- Use `useState` only for SSR-safe shared state; Pinia (`@pinia/nuxt`) for app state.
- Use auto-imports as the project does; import server helpers from the documented paths (`#imports`, `nuxt/server` where the version uses it).
- `useHead`/`useSeoMeta` for metadata; `useHeadSafe` for anything containing user data.

## Security

- **Runtime config:** secrets in top-level `runtimeConfig` (server only), set through `NUXT_*` environment variables; only `runtimeConfig.public` reaches the browser. Never put secrets in `public`, `app.config.ts` or `NUXT_PUBLIC_*`.
- **Server routes are public endpoints.** In every handler: authenticate (session or token), authorize the specific resource, and validate input with h3's validated readers and a schema:

  ```ts
  export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    const { id } = await getValidatedRouterParams(event, idParamsSchema.parse)
    const body = await readValidatedBody(event, updateOrderSchema.parse)
    return updateOrder(user, id, body)
  })
  ```

- **Route middleware (`app/middleware`) runs on navigation and is UX only.** Several 2026 advisories bypassed route rules and middleware (case, percent-encoding, island rendering). Enforce auth in server handlers or Nitro server middleware, not in route rules or page middleware alone.
- **Headers and limits:** add `nuxt-security` (v2) for security headers, CSP with nonces, rate limiting and request-size limits, or set them in `routeRules`/Nitro. Configure `nuxt-security`'s CSP to work with SSR hashes or nonces rather than disabling it.
- **Server islands and payloads:** don't render per-user data in cached payloads or `routeRules` with `swr`/`isr`/`cache` (CVE-2026-71316 leaked one user's SSR data to others); keep `experimental.componentIslands` off unless needed and patched.
- **Links and redirects:** `navigateTo(url, { external: true })` and `<NuxtLink :to>` only with validated URLs (relative paths or allowlisted hosts); several XSS and open-redirect advisories came from `javascript:` and protocol-relative URLs.
- **Markdown and content:** `@nuxtjs/mdc` ≥ 0.22.1; don't render untrusted Markdown with raw HTML enabled.
- **Devtools:** `devtools: { enabled: false }` outside local development; never expose the dev server (`nuxt dev --host`) on shared networks (DevTools RPC RCE, IPC socket and path disclosure advisories).

## Known vulnerabilities (as of 2026-11)

| Advisory | Affected | Fixed |
|---|---|---|
| CVE-2026-119200 (GHSA-9v7c-q64q-vv33): `.`/`..` and `%2e` path segments render a protected page while `server/middleware` and route rules see the unnormalized path | nuxt, @nuxt/nitro-server 4.6.0 – 4.6.2 | 4.6.3 |
| CVE-2026-114132: server-side route rules (`redirect`, `headers`, `proxy`, `ssr`) skipped for some paths | nuxt 3.0+ and 4.x | 4.6.2 (no 3.x fix) |
| CVE-2026-114133: server islands render `useHeadSafe` input unsanitized | nuxt 3.13+ | 4.6.2 |
| CVE-2026-114130: incomplete fix for `javascript:` URLs in `<NuxtLink>` | nuxt | 4.6.0 |
| CVE-2026-114131: route rules matched against the raw (percent-encoded) path | nuxt | 4.4.4 / 3.21.4 |
| CVE-2026-71320: server-side RCE via runtime template injection; CVE-2026-71316: payload cache discloses other users' SSR data; island DoS and component instantiation | nuxt | 4.5.1 / 3.21.10 |
| CVE-2026-71319: unauthenticated DevTools RPC → command execution on the developer machine | @nuxt/devtools | 3.3.1 |
| CVE-2026-44373, CVE-2026-44372: `routeRules` proxy scope bypass and open redirect | nitropack | 2.13.4 |
| CVE-2026-86251, CVE-2026-86253, CVE-2026-23527: path traversal in `serveStatic`, request smuggling | h3 1.x | 1.15.9 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- `@nuxt/test-utils` with Vitest for components and composables; `$fetch` against a test server (`setup()` from `@nuxt/test-utils/e2e`) for server routes.
- For each server route: 401 without a session, 403/404 for another user's resource, 400 for invalid input.
- Playwright for E2E (`testing/playwright`), including a check that protected pages redirect when logged out and that their API calls are refused, not just hidden.

## Before you finish

```sh
npx nuxi typecheck
npx eslint .
npx vitest run
npx nuxi build
npm audit --audit-level=moderate
npm ls nuxt nitropack h3 @nuxt/devtools   # at or above the fixed versions
```
