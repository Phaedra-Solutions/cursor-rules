---
id: frontend/astro
title: Astro 7
description: Astro 7 - islands with explicit client directives, the Rust compiler's strict HTML, content collections with schemas, typed environment variables (astro:env) with secrets server-only, validated endpoints and Actions, middleware and the new src/fetch.ts routing pipeline, security.checkOrigin, image and remote-allowlist settings, @tailwindcss/vite instead of the deprecated @astrojs/tailwind, adapters, and the 2025-2026 Astro advisories (minimum safe 7.3.3). Use when editing .astro files, astro.config.* or src/pages.
applies_to: "astro >=7.0 <8"
globs: ["**/*.astro", "astro.config.*", "src/pages/**"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://astro.build/blog/astro-7/
  - https://docs.astro.build/en/guides/upgrade-to/v7/
  - https://docs.astro.build/en/concepts/islands/
  - https://docs.astro.build/en/guides/environment-variables/
  - https://docs.astro.build/en/guides/endpoints/
  - https://docs.astro.build/en/guides/actions/
  - https://docs.astro.build/en/reference/configuration-reference/
  - https://www.npmjs.com/package/astro
  - https://osv.dev/vulnerability/GHSA-26w7-cxv4-gfx2
  - https://osv.dev/vulnerability/GHSA-xfq5-w38q-pc2x
---

# Astro 7

Also apply `languages/typescript` and `frontend/tailwind`. Framework islands follow their own rules (`frontend/react`, `frontend/vue`, `frontend/svelte`).

## Version check

- Read `astro`, the adapter (`@astrojs/node`, `@astrojs/vercel`, `@astrojs/cloudflare`, `@astrojs/netlify`) and integrations from the lockfile, plus `output` in `astro.config.*`. State them:

  ```text
  Applying frontend/astro (astro 7.4.4, output server, @astrojs/node 11, React islands, from package-lock.json).
  ```

- Current: Astro **7.4.4** (Rust compiler, Vite 8, queued rendering, Advanced Routing). Astro 6 and older → follow `core/legacy-mode`; upgrade with `npx @astrojs/upgrade` as its own change (Astro 7 rejects unclosed tags and invalid HTML, changes whitespace handling with `compressHTML: 'jsx'`, replaces remark/rehype with Sätteri unless `@astrojs/markdown-remark` is installed, removes `Astro.glob()` and `@astrojs/db`).
- **Minimum safe:** astro **7.3.3**; `@astrojs/node` **11.1.3**.

## Conventions

- Ship zero JavaScript by default: render with `.astro` components and add islands only where interaction is needed, with the lightest directive that works (`client:visible`, `client:idle`, `client:media`, then `client:load`). Server islands (`server:defer`) for personalized fragments.
- Write valid, closed HTML (the compiler errors on unclosed tags); use `{" "}` where whitespace between inline elements matters.
- Content collections with schemas (`defineCollection` with a Zod schema) for Markdown/MDX and data; `import.meta.glob()` instead of the removed `Astro.glob()`.
- **Environment:** declare variables with `astro:env` (`env.schema` in config) using `envField.string({ context: 'server', access: 'secret' })` for secrets and `context: 'client', access: 'public'` only for public values; import secrets from `astro:env/server` in server code only.
- Endpoints (`src/pages/api/*.ts` exporting `GET`/`POST`) and Actions (`defineAction` with an `input` schema) for server logic; `export const prerender = false` on dynamic routes in hybrid sites.
- Styling: Tailwind 4 through `@tailwindcss/vite` in `vite.plugins`; don't add the deprecated `@astrojs/tailwind`.
- `src/fetch.ts` is reserved for Advanced Routing in Astro 7; rename unrelated files with that name.

## Security

- **Endpoints and Actions are public:** authenticate in middleware (`onRequest` sets `context.locals.user`) and authorize again in each endpoint or Action; validate input with the Action's `input` schema or Zod in endpoints; return generic errors.
- **Don't base authorization on `url.pathname` string checks** in middleware; Astro fixed several bypasses with double encoding, missing segment boundaries and rewrites (CVE-2025-64765, CVE-2025-66202, CVE-2026-84376, CVE-2026-59731). Normalize paths and check in the page or endpoint too.
- **CSRF:** keep `security.checkOrigin` enabled (default for on-demand rendering) for form posts; patched 7.0.6+ also applies it in the `astro/hono` pipeline.
- **Host headers:** configure `security.allowedDomains` (or the adapter's trusted host settings) behind proxies; several SSRF and redirect issues came from unvalidated `Host`/`X-Forwarded-Host`.
- **HTML injection:** `set:html` only with sanitized content; don't pass user input into `define:vars`, spread attributes, `transition:*` directives, slot names or `<script>`/`<style>` content; patched versions fixed XSS in each of these.
- **Images:** limit `image.domains`/`image.remotePatterns` to hosts you trust; keep Astro patched (AVIF optimization RCE fixed in 7.2.8).
- **Adapters:** set request body limits on the Node adapter; don't expose the dev server (`astro dev --host`) on shared networks (dev server file-read and XSS advisories).

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2026-114127 (CSS injection in View Transitions), CVE-2026-114128 (XSS via unescaped `<script>`/`<style>` content in JSX) | astro | 7.3.3 / 7.3.2 |
| GHSA-26w7-cxv4-gfx2: RCE through AVIF image optimization | astro | 7.2.8 |
| CVE-2026-84376: authorization bypass from missing path-segment boundary check | astro | 7.2.4 |
| CVE-2026-73423: `astro/hono` pipeline bypasses `security.checkOrigin` | astro 7.0.0–7.0.5 | 7.0.6 |
| CVE-2026-102984 (malformed Host port crashes the adapter), CVE-2026-59730 (backslash paths), CVE-2026-29772 (no body size limit) | @astrojs/node | 11.1.3 / 11.0.2 / 10.0.0 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- `astro check` for types; Vitest with the Container API (`experimental_AstroContainer`) for components; Playwright for pages, islands and Actions.
- For each endpoint and Action: anonymous and wrong-user requests are refused, invalid input is rejected, and paths with encoded segments don't bypass protection.

## Before you finish

```sh
npx astro check
npx astro build
npx vitest run                          # if the project has unit tests
npm audit --audit-level=moderate
npm ls astro @astrojs/node 2>/dev/null   # at or above the minimum safe versions
```
