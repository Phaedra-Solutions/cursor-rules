---
id: legacy/nextjs-pages-router
title: Next.js Pages Router and Next.js 15 or older
description: Pages Router (pages/, getServerSideProps, API routes, middleware.ts) on any Next.js version, and App Router on Next.js 13–15. Covers data-fetching and API route security, CVE-2025-29927, supported patch lines and the migration path. Use when editing pages/ or when the installed next is below 16.
applies_to: "next >=12.0 <17"
globs: ["pages/**/*.{js,jsx,ts,tsx}", "src/pages/**/*.{js,jsx,ts,tsx}", "middleware.{js,ts}", "next.config.*"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://nextjs.org/support-policy
  - https://nextjs.org/blog/next-15-5
  - https://nextjs.org/blog/cve-2025-29927
  - https://github.com/advisories/GHSA-f82v-jwr5-mffw
  - https://github.com/vercel/next.js/security/advisories
  - https://nextjs.org/blog/nextjs-security-update-october-14-2026
  - https://nextjs.org/docs/pages/guides/migrating/app-router-migration
  - https://nextjs.org/docs/app/guides/upgrading/version-15
  - https://nextjs.org/docs/app/guides/upgrading/codemods
  - https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props
  - https://nextjs.org/docs/pages/building-your-application/routing/api-routes
  - https://nextjs.org/docs/pages/api-reference/config/next-config-js/env
  - https://osv.dev/vulnerability/GHSA-36qx-fr4f-26g5
  - https://osv.dev/vulnerability/GHSA-4jqv-mc3x-m676
  - https://osv.dev/vulnerability/GHSA-2464-fhr4-w9xw
  - https://osv.dev/vulnerability/GHSA-p3m5-59mp-jv5r
  - https://github.com/vercel/next.js/releases
---

# Next.js Pages Router and Next.js ≤ 15

Also apply `core/legacy-mode`. Don't migrate as part of an unrelated task.

## Version check

- Read `next`, `react` and `react-dom` from the lockfile and state the rule you're applying:

  ```text
  Applying legacy/nextjs-pages-router (next 15.5.28, react 19.2.8 from pnpm-lock.yaml; Pages Router).
  ```

- **Next 16 with a `pages/` directory:** use this rule for `pages/` files and `frontend/nextjs` for `app/` and `proxy.ts`.
- **Support status (Next.js support policy):**
  - 16.x is Active LTS.
  - 15.x is Maintenance LTS, with security releases **through 31 Jan 2027** (extended from 21 Oct 2026). Only the 15.5 line gets new patches; 15.0–15.4 had no releases in 2026, so move them to the latest 15.5.x.
  - 14.x and older are unsupported. 14.2.35 is the last 14.x release and is still affected by unfixed critical advisories (for example GHSA-2464-fhr4-w9xw). Report this as EOL and propose `upgrade-nextjs`.
- **Minimum safe versions:** 15.5.28 on 15.x, 16.4.1 on 16.x. Nothing is safe on 14.x or older.
- React: the App Router on 15 needs React 19. The Pages Router on 15 and 16 also accepts React ≥ 18.2. Next 14 needs React 18. Never use APIs newer than the installed React.
- Node: Next 15 runs on Node ≥ 18.18, but Node 18 and 20 are EOL; note it in the summary (see `core/legacy-mode`).

## Conventions

- Keep the project's router. Pages live in `pages/`; data loads in `getServerSideProps`, `getStaticProps` and `getStaticPaths`; APIs live in `pages/api/*`; shared shell in `_app` and `_document`; navigation uses `next/router`.
- Don't use App Router APIs in `pages/` (`next/navigation` hooks other than through `next/compat/router`, `'use server'`, `cookies()` from `next/headers`).
- Prefer `getStaticProps` with `revalidate` for public content and `getServerSideProps` for per-request or per-user pages. Avoid `getInitialProps` in new code: it also runs in the browser.
- `middleware.ts` on ≤ 15 defaults to the Edge runtime; the Node runtime is stable from 15.5. Keep it small and fast.
- `next lint` is deprecated in 15.5 and removed in 16. When touching lint config, move to the ESLint CLI (`npx @next/codemod@canary next-lint-to-eslint-cli .`) only if asked.
- App Router on 13–14: `params`, `cookies()` and `headers()` are synchronous, and `fetch` is cached by default on 14. On 15 they're async with temporary sync compatibility, and `fetch` isn't cached by default. Write code for the installed version.
- Forms and state follow the project (Formik + Yup stays where it exists; see `conventions/phaedra`).

## Security

See `core/security-baseline` and `frontend/react`. Pages Router specifics:

### getServerSideProps and getStaticProps

- Everything returned in `props` is serialized into the HTML (`__NEXT_DATA__`) and served as JSON from `/_next/data/<buildId>/<page>.json`. Return a minimal DTO, never raw records, tokens or internal fields.
- Authenticate and authorize inside `getServerSideProps` for every protected page. Return `{ redirect }` or `{ notFound: true }` when access is denied; never return the data and hide it on the client.
- Validate `params` and `query` with a schema before using them.
- Never return per-user data from `getStaticProps`: the output is shared by all visitors and cached (ISR cache poisoning advisories affected self-hosted SSG/ISR below 15.5.27).
- Protect on-demand revalidation (`res.revalidate`) with a secret compared in constant time, and validate the path.

### API routes (`pages/api/*`)

- Each handler is a public endpoint. Check `req.method` and return 405 for anything else. Authenticate, authorize the specific resource, validate `req.body` and `req.query` with a schema, and rate-limit.
- Keep the default body parser limit (1 MB) unless a route needs more; set `export const config = { api: { bodyParser: { sizeLimit } } }` on that route only.
- Set CORS per route with an explicit origin allowlist; never reflect `Origin` with credentials.
- Return minimal JSON and generic error messages; log details server-side.

### Middleware

- **CVE-2025-29927** (critical): an attacker could skip middleware by sending the internal `x-middleware-subrequest` header. It affected 12.x–15.2.2 and is fixed in 12.3.5, 13.5.9, 14.2.25 and 15.2.3. If you can't patch, strip that header at the edge or reverse proxy.
- The lesson applies on every version: middleware is for redirects, headers and optimistic checks. Repeat the authorization check in `getServerSideProps`, API routes and Server Actions.
- With `i18n` configured, locale-less `/_next/data/` requests skipped middleware-based auth below 15.5.16 (GHSA-36qx-fr4f-26g5). Another reason to authorize in the data function itself.

### Config and secrets

- `next.config.*` `env` values are inlined into the client bundle at build time, so never put secrets there. The same goes for `NEXT_PUBLIC_*` and `publicRuntimeConfig`.
- Use `images.remotePatterns`, not `images.domains`; keep `dangerouslyAllowSVG` off; keep `sharp` ≥ 0.35.5.
- Set security headers and a CSP in `headers()` in `next.config.*` or in middleware.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed |
|---|---|---|
| GHSA-2464-fhr4-w9xw: Image Optimization RCE with SVG on glibc Linux (critical) | 10.0.0–15.5.27 | 15.5.28; `sharp` 0.35.5; no 14.x fix |
| GHSA-p3m5-59mp-jv5r / CVE-2026-94482: Server Actions DoS (high) | 13.0.0–15.5.27 | 15.5.28 |
| GHSA-2xp9-vwfh-vxw4: Image Optimization RCE with AVIF (critical); GHSA-p293-qw3h-jr36 / CVE-2026-75604: RCE on Windows hosts (critical) | < 15.5.24 | 15.5.24 |
| GHSA-4jqv-mc3x-m676 / CVE-2026-94543: SSG/ISR cache poisoning, self-hosted Pages Router (moderate) | < 15.5.27 | 15.5.27 |
| GHSA-36qx-fr4f-26g5 / CVE-2026-44573: middleware bypass with Pages Router `i18n` (high) | < 15.5.16 | 15.5.16 |
| GHSA-f82v-jwr5-mffw / CVE-2025-29927: middleware authorization bypass (critical) | 12.x–15.2.2 | 12.3.5, 13.5.9, 14.2.25, 15.2.3 |

Next 14.x and older get none of the 2026 fixes. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

1. **Patch first:** move to the latest 15.5.x (or the latest 14.2.x as a stopgap, which still leaves unfixed advisories), with tests passing.
2. **Get to 15:** from 14, run `npx @next/codemod@canary upgrade 15` and `npx @next/codemod@canary next-async-request-api .`, and upgrade React to 19 if the app uses the App Router. Ship and verify.
3. **Move to the App Router incrementally:** `pages/` and `app/` work side by side.
   - Add `app/layout.tsx` (it replaces `_app` and `_document`) and move `next/head` to the Metadata API.
   - Move one route at a time: page component → Client Component imported by a Server Component `page.tsx`. Then `getServerSideProps` → fetching in the Server Component (DAL with `server-only`), `getStaticPaths` → `generateStaticParams` plus `dynamicParams`, and `pages/api/*` → `route.ts` Route Handlers or Server Actions.
   - Switch `next/router` to `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`, `useParams`); use `next/compat/router` for components shared by both routers.
   - Re-implement `i18n` routing with an `app/[locale]` segment (App Router has no built-in i18n config).
   - Navigations between the routers are hard navigations; migrate linked routes together where possible.
4. **Upgrade to 16** with the `upgrade-nextjs` skill, then follow `frontend/nextjs`.

## Testing

- Test `getServerSideProps` directly with a mocked context: unauthenticated → redirect, another user's resource → `notFound`, and returned props contain only allowed fields.
- Test API routes for method handling, authorization, validation errors and response shape (`node-mocks-http` or a test server, whichever the project uses).
- E2E tests (Playwright or Cypress) select by `data-testid` and request one protected `/_next/data/...json` URL directly to prove authorization doesn't live only in middleware.

## Before you finish

```sh
npx tsc --noEmit
npm run lint            # next lint on ≤ 15; ESLint CLI or Biome where configured
npm test
npx next build
npm audit --audit-level=moderate
npm ls next sharp
```
