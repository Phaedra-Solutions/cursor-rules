---
id: frontend/nextjs
title: Next.js (App Router)
description: Next.js 16 App Router conventions and security (Cache Components, proxy.ts, Server Actions, Route Handlers, next/image, CSP). Use when editing app/, proxy.ts, middleware.ts or next.config.* in a Next.js 16 project.
applies_to: "next >=16.0 <17"
legacy_rule: legacy/nextjs-pages-router
globs: ["app/**/*.{ts,tsx}", "proxy.ts", "middleware.ts", "next.config.*"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://nextjs.org/blog
  - https://nextjs.org/blog/next-16
  - https://nextjs.org/blog/next-16-4
  - https://nextjs.org/support-policy
  - https://nextjs.org/docs/app/guides/upgrading/version-16
  - https://nextjs.org/docs/app/api-reference/file-conventions/proxy
  - https://nextjs.org/docs/app/api-reference/directives/use-cache
  - https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
  - https://nextjs.org/docs/app/guides/data-security
  - https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions
  - https://nextjs.org/docs/app/guides/content-security-policy
  - https://nextjs.org/docs/app/guides/ai-agents
  - https://nextjs.org/blog/next-security-release-program
  - https://nextjs.org/blog/nextjs-security-update-october-14-2026
  - https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026
  - https://github.com/vercel/next.js/security/advisories
  - https://github.com/advisories/GHSA-f82v-jwr5-mffw
  - https://osv.dev/vulnerability/GHSA-673q-mjm6-r5xr
  - https://osv.dev/vulnerability/GHSA-2464-fhr4-w9xw
  - https://osv.dev/vulnerability/GHSA-p3m5-59mp-jv5r
  - https://osv.dev/vulnerability/GHSA-wq5f-xc86-pv6w
  - https://github.com/vercel/next.js/releases
  - https://nextjs.org/docs/app/getting-started/server-and-client-components
---

# Next.js 16 (App Router)

## Version check

- Read `next`, `react` and `react-dom` from the lockfile. This rule covers 16.x (16.4.3 is current; 16.x is Active LTS).
- Next.js 15 or older, or files under `pages/`: follow `legacy/nextjs-pages-router` for those files.
- Minimum safe version is **16.4.1** (see Known vulnerabilities). Below that, say so in one line and suggest the patch upgrade.
- Next 16 needs Node ≥ 20.9 and TypeScript ≥ 5.1. Node 20 is EOL; prefer Node 22 or 24 LTS (see `core/legacy-mode`).
- Check `next.config.*` for `cacheComponents`, `partialPrefetching` and `reactCompiler`; the caching and memoization guidance below depends on them.
- Since 16.2, Next.js bundles version-matched docs in `node_modules/next/dist/docs/`, and `next dev` keeps a managed `<!-- BEGIN:nextjs-agent-rules -->` block in `AGENTS.md`. Keep that block and read the bundled docs for API details; this rule adds security and house conventions on top.
- Also apply `frontend/react` and `languages/typescript`.

## Conventions

- Server Components by default. Put `'use client'` on the smallest interactive leaf, never on a page or layout just to use one hook.
- Framework files use the default exports Next.js requires (`page`, `layout`, `loading`, `error`, `not-found`, `default`, `route` handlers as named `GET`/`POST`).
- `params`, `searchParams`, `cookies()`, `headers()` and `draftMode()` are async; always `await` them. Type pages with the generated `PageProps<'/route/[slug]'>`, `LayoutProps` and `RouteContext` helpers (`npx next typegen`).
- Every parallel route slot needs a `default.tsx`.
- Use the Metadata API (`metadata`, `generateMetadata`), not `<head>` tags. Use `next/font` and `next/image`.
- Request interception lives in `proxy.ts` with `export function proxy`. Don't add `middleware.ts`; it's deprecated. Keep an existing `middleware.ts` only if it needs the Edge runtime (`proxy.ts` is Node only).
- Turbopack is the default for `next dev` and `next build`. Use `--webpack` only where a webpack-only plugin forces it, and say why.
- `next lint` is removed. Lint with the ESLint CLI (`eslint-config-next`, flat config) or Biome, whichever the project uses.
- React Compiler is opt-in (`reactCompiler: true` plus `babel-plugin-react-compiler`). Don't turn it on as a side effect of another task.
- Forms: Server Actions with `useActionState`. For client-side validation follow the project; new code uses React Hook Form + Zod, and the server validates again (see `conventions/phaedra`).
- Use the project's existing data-fetching approach (external HTTP API, data access layer, or component-level queries); don't mix them in one codebase. New projects use a data access layer (DAL).

## Caching and rendering

- Cache Components is opt-in in 16 (`cacheComponents: true`), on by default in new `create-next-app` projects since 16.4, and planned as the default in 17. Follow whatever the project has; don't enable it just to finish another task.
- **With Cache Components:**
  - Cache with `'use cache'`. Set `cacheLife(...)` explicitly in every cached scope and `cacheTag(...)` for anything you invalidate on demand.
  - Cached scopes can't read `cookies()`, `headers()` or `searchParams`. Read them outside and pass the values in as arguments; arguments and captured variables become the cache key.
  - Wrap request-time data in `<Suspense>` so the static shell can prerender. Use `export const ensureStatic` on routes that must stay static.
- **Without Cache Components:** `fetch` and `GET` Route Handlers are not cached by default; opt in explicitly.
- **Invalidation:**
  - `revalidateTag(tag, 'max')` takes a profile; the one-argument form is deprecated.
  - Inside Server Actions, use `updateTag(tag)` for read-your-writes and `refresh()` to refresh the client router.
- **Per-user data:**
  - Never cache per-user or per-tenant data under a shared key. Make the user or tenant ID an argument of the cached function, or use `'use cache: private'`.
  - Never cache responses that depend on auth headers you didn't pass in.
- No side effects during render (setting cookies, mutations, revalidation). Use Server Actions or Route Handlers.

## Server Actions and Route Handlers

Every exported Server Action is reachable by a direct `POST`, and every Route Handler is a public URL. A page-level auth check does not protect the actions defined or used on that page. In each one:

1. Authenticate the caller (read the session server-side).
2. Authorize the specific resource: check ownership or role for the ID being changed (prevents IDOR).
3. Validate every argument with a schema (`safeParse`); treat `FormData`, `params` and bound arguments as untrusted.
4. Rate-limit expensive or abusable operations (email, auth, payments, AI calls).
5. Return a minimal result or DTO, never a raw database record. Return expected errors as values.

- Keep checks and queries in a DAL module that starts with `import 'server-only'`; keep `'use server'` files thin. Only the DAL reads `process.env` secrets.
- Closure variables in inline actions are encrypted, but don't put secrets in them. When self-hosting on several instances, set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (from the secret store) so all instances share it.
- Keep the default same-origin check. Add hosts to `experimental.serverActions.allowedOrigins` only for known reverse proxies; never use a broad wildcard. Raise `bodySizeLimit` (default 1 MB) only on the route that needs it.
- Route Handlers: check the method, set CORS per route with an explicit origin allowlist, and don't mutate state on `GET`.

```ts
// ✗ trusts the caller and the input
'use server'
export async function renameProject(id: string, name: string) {
  await db.project.update({ where: { id }, data: { name } })
}

// ✓ authenticate → authorize the resource → validate → mutate
'use server'
import { z } from 'zod'
import { updateTag } from 'next/cache'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

const schema = z.object({ id: z.uuid(), name: z.string().trim().min(1).max(100) })

export async function renameProject(input: unknown) {
  const session = await getSession()
  if (!session) return { ok: false, error: 'unauthenticated' } as const
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid' } as const
  const project = await db.project.findUnique({ where: { id: parsed.data.id }, select: { ownerId: true } })
  if (!project || project.ownerId !== session.userId) return { ok: false, error: 'forbidden' } as const
  await db.project.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name } })
  updateTag(`project-${parsed.data.id}`)
  return { ok: true } as const
}
```

## proxy.ts

- Use it for redirects, rewrites, headers, the CSP nonce and optimistic checks (for example "session cookie present → else redirect to login"). Never use it as the only authorization layer. CVE-2025-29927 bypassed middleware-only auth, and Server Functions run as `POST`s to their route, so a matcher change silently removes coverage.
- Exclude static assets in `matcher` (`_next/static`, `_next/image`, `favicon.ico`) and skip prefetches where the logic doesn't need them.
- Pass data upstream with `NextResponse.next({ request: { headers } })`. Passing `NextResponse.next({ headers })` sends those headers to the browser.
- Don't rely on module globals or shared state in `proxy.ts`.

## Security

See `core/security-baseline` and `frontend/react`. Next.js-specific points:

- **Secrets and env:**
  - `NEXT_PUBLIC_*` values are inlined into the client bundle; never put secrets there.
  - Validate env once at startup in a `server-only` module (`env.ts` with a Zod schema) and fail fast.
  - Use `await connection()` before reading env that must be resolved at runtime rather than build time.
  - Consider `experimental.taint` with React's taint APIs for tokens and records, as a backstop to DTOs.
- **Data to the client:** props passed to Client Components are serialized into the page. Pass only the fields the component renders; type props narrowly.
- **`next/image`:**
  - Allowlist hosts with `images.remotePatterns` (protocol plus hostname, with a pathname where possible); `images.domains` is deprecated.
  - Leave `images.dangerouslyAllowLocalIP` and `images.dangerouslyAllowSVG` off.
  - Local images with query strings need `images.localPatterns` with `search`.
  - Keep `sharp` ≥ 0.35.5 (`npm ls sharp`).
- **Headers:**
  - Set a nonce-based CSP in `proxy.ts`: a fresh nonce per request, `'strict-dynamic'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, and `'unsafe-eval'` in development only.
  - Nonces force dynamic rendering and don't work with prerendered static shells. For static routes, use a hash-based CSP with `experimental.sri` and `headers()` in `next.config.*`, and say which trade-off you chose.
  - Set HSTS, `X-Content-Type-Options: nosniff` and `Referrer-Policy` in `headers()`, and set `poweredByHeader: false`.
- **Self-hosting:**
  - Run behind a proxy that pins the `Host` and `X-Forwarded-Host` headers (several Server Action and rewrite SSRF advisories needed attacker-controlled host headers).
  - Don't host on Windows below 16.3.3.
  - Set `cacheMaxMemorySize` or a cache handler deliberately.
- **Rewrites and redirects:** never build a destination from user input; allowlist hosts.
- **Patching:** stay on the latest 16.x patch.
  - Next.js publishes scheduled security releases about monthly (announced on the blog), plus out-of-band fixes. The next one is on 3 Nov 2026.
  - `experimental.agentUpgrade` (default `'security'`) reminds you about security upgrades during `next dev` and `next build`; don't disable it.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected (16.x) | Fixed |
|---|---|---|
| GHSA-673q-mjm6-r5xr: unauthenticated RCE in `use cache` functions returning typed arrays (critical) | 16.0.0–16.4.0 | 16.4.1 |
| GHSA-2464-fhr4-w9xw: RCE in the Image Optimization API with SVG on glibc Linux (critical; upstream librsvg CVE-2026-96889) | 16.0.0–16.4.0 (also 10.x–15.5.27) | 16.4.1, 15.5.28; `sharp` 0.35.5 |
| GHSA-p3m5-59mp-jv5r / CVE-2026-94482: Server Actions DoS (high) | 16.0.0–16.4.0 | 16.4.1 |
| GHSA-2xp9-vwfh-vxw4: Image Optimization RCE with AVIF (critical); GHSA-p293-qw3h-jr36 / CVE-2026-75604: RCE on Windows hosts (critical) | < 16.3.3 | 16.3.3 |
| GHSA-mcj8-r9mp-w47p / CVE-2026-94484: SSG/ISR cache poisoning (moderate) | < 16.3.8 | 16.3.8 |
| GHSA-89xv-2m56-2m9x / CVE-2026-64649: SSRF in Server Actions on custom servers; GHSA-p9j2-gv94-2wf4 / CVE-2026-64645: SSRF in rewrites (high) | < 16.2.11 | 16.2.11 |
| CVE-2025-29927 (GHSA-f82v-jwr5-mffw): middleware authorization bypass (critical) | 12.x–15.2.2 only | lesson: never authorize in `proxy.ts` alone |

React Server Components advisories (`react-server-dom-*`) are listed in `frontend/react`; Next.js ships its own compiled copy of those packages, so upgrade `next` to pick up the fixes. The 3 Nov 2026 release will fix seven more moderate issues. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Unit-test DAL functions and Server Actions directly: unauthenticated → rejected; another user's resource → forbidden; invalid input → rejected; happy path → mutated and tag updated.
- Component tests use Testing Library and query by role and label (see `frontend/react`). Async Server Components are best covered by E2E tests.
- E2E tests (Playwright) select by `data-testid` and cover auth redirects, forms and at least one protected route hit directly by URL.
- Test `proxy.ts` matchers with `unstable_doesProxyMatch` from `next/experimental/testing/server`.
- Run `next build` in CI: it catches prerender, Cache Components and parallel-route errors that `next dev` may not.

## Before you finish

```sh
npx next typegen
npx tsc --noEmit
npx eslint .            # or: npx biome check .
npm test
npx next build
npm audit --audit-level=moderate
npm ls next sharp
```
