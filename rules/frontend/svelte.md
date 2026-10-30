---
id: frontend/svelte
title: Svelte 5 and SvelteKit 3
description: Svelte 5 (runes) and SvelteKit 3 (1 Oct 2026) - runes ($state, $derived, $effect, $props), config in vite.config.ts, #lib imports, $app/state and $app/env, secrets only in server modules and $app/env/private, load functions and validated form actions, CSRF trustedOrigins, hooks for auth, remote functions cautions, adapters and body limits, and the 2026 Svelte and SvelteKit advisories. Use when editing .svelte files, src/routes or the Vite/Svelte config.
applies_to: "svelte >=5.0 <6, @sveltejs/kit >=3.0 <4"
globs: ["**/*.svelte", "src/routes/**", "svelte.config.*", "vite.config.*"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://svelte.dev/docs/svelte/what-are-runes
  - https://svelte.dev/docs/kit/migrating-to-sveltekit-3
  - https://svelte.dev/docs/kit/configuration
  - https://svelte.dev/docs/kit/form-actions
  - https://svelte.dev/docs/kit/server-only-modules
  - https://svelte.dev/docs/cli/sv-migrate
  - https://www.npmjs.com/package/@sveltejs/kit
  - https://osv.dev/vulnerability/GHSA-f3cj-j4f6-wq85
---

# Svelte 5 and SvelteKit 3

Also apply `languages/typescript`. Styling with Tailwind: `frontend/tailwind`; forms: `frontend/forms-validation`.

## Version check

- Read `svelte`, `@sveltejs/kit`, `@sveltejs/vite-plugin-svelte`, the adapter and `vite` from the lockfile, and whether config lives in `svelte.config.js` (Kit ≤ 2) or `vite.config.ts` (Kit 3). State them:

  ```text
  Applying frontend/svelte (svelte 5.57.3, @sveltejs/kit 3.1.1, adapter-node 6, Vite 8, from pnpm-lock.yaml).
  ```

- **SvelteKit 3** (1 Oct 2026; latest 3.1.1) needs Node 22.17+, TypeScript 6, Svelte 5.57.1+, Vite 8 and `@sveltejs/vite-plugin-svelte` 7. Migrate from Kit 2 with `npx sv migrate sveltekit-3` as its own change.
- **Svelte 3/4, SvelteKit 1–2:** follow `core/legacy-mode` (stores, `export let`, `$:` statements); Kit 2 is still common, so write Kit 2 code there (`svelte.config.js`, `$lib`, `$app/stores` in older code, `$env/static/private`).
- **Minimum safe:** svelte 5.55.7+, @sveltejs/kit 3.0.0+ (2.70.2 on 2.x lacks two October fixes), @sveltejs/adapter-node patched.

## Conventions

- **Runes:** `let count = $state(0)`, `const total = $derived(items.length)`, `$derived.by(() => …)` for complex derivations, `let { title, onSave } = $props()` with a typed `Props` interface, `$bindable()` only where two-way binding is intended. `$effect` only for side effects that sync with the outside world (DOM APIs, subscriptions); never to set other state (use `$derived`).
- Events as callback props (`onclick`, `onSave`), not `createEventDispatcher`; snippets (`{#snippet}`/`{@render}`) instead of slots in new components.
- Shared state in `.svelte.ts` modules exporting `$state` objects or classes; avoid module-level mutable state in SSR code (it's shared across requests).
- **Kit 3 project layout:** config in `vite.config.ts` via `sveltekit({ … })`; `#lib/*` subpath imports declared in `package.json`; `$app/state` (not `$app/stores`); `$app/env` (not `$app/environment`); `refreshAll()` instead of `invalidateAll()`; `goto(url, { shallow: true })` instead of `pushState`.
- Data loading: `+page.server.ts`/`+layout.server.ts` `load` for anything using secrets or the database; universal `+page.ts` only for public data. Return minimal, serializable data.
- Use the project's form approach: form actions with progressive enhancement (`use:enhance`), or remote functions (experimental) only if the project already opted in.

## Security

- **Secrets:** only in server modules (`*.server.ts`, `src/lib/server/**`) and `$app/env/private` (Kit 3; `$env/static/private` / `$env/dynamic/private` on Kit 2). Everything from `$app/env/public` / `PUBLIC_*` reaches the browser. SvelteKit refuses to import server-only modules into client code; don't work around it.
- **Form actions and endpoints are public:** authenticate in `hooks.server.ts` (`handle` sets `event.locals.user`), authorize in every action, `load` and `+server.ts` handler, and validate `request.formData()`/`json()` with a schema before use. Return `fail(400, { errors })` for invalid input.
- **CSRF:** SvelteKit checks the `Origin` for form submissions; keep it on. On Kit 3 list extra origins in `csrf.trustedOrigins` instead of disabling checks (Kit 2's `csrf.checkOrigin: false` is the anti-pattern to avoid).
- **HTML:** `{@html}` only with sanitized content (DOMPurify); patched Svelte versions fixed several SSR XSS bugs in spread attributes, `<svelte:element>`, `<option>` and `bind:innerText`, but don't pass user-controlled objects to spread attributes or tag names.
- **Redirects:** `redirect(303, url)` only to relative paths or allowlisted hosts.
- **Cookies:** `event.cookies.set(name, value, { path: '/', httpOnly: true, secure: true, sameSite: 'lax' })`.
- **Headers and CSP:** set CSP via the `csp` option (nonces or hashes) and security headers in `handle`.
- **Adapters:** set `BODY_SIZE_LIMIT` for adapter-node and keep the adapter patched; behind a proxy set `ORIGIN`/`PROTOCOL_HEADER`/`HOST_HEADER` only to headers your proxy controls.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2026-114060 (open redirect via enhanced form submission), CVE-2026-114061 (XSS via untrusted `cache-control` in prerendered page) | @sveltejs/kit | 3.0.0 |
| CVE-2026-66062: ReDoS in content negotiation | @sveltejs/kit | 2.70.2 |
| CVE-2026-82256, CVE-2026-82257 and earlier remote-function DoS and prototype pollution | @sveltejs/kit (remote functions) | 2.69.1 |
| CVE-2026-40073: adapter-node `BODY_SIZE_LIMIT` bypass (fixed in the Kit runtime) | @sveltejs/kit | 2.57.1 |
| CVE-2026-42599, CVE-2026-42573, GHSA-f3cj-j4f6-wq85 and other 2026 SSR XSS issues | svelte | 5.55.7 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Vitest with `@testing-library/svelte` (or `vitest-browser-svelte`) for components; Playwright for routes and form actions.
- For each action and `+server.ts`: anonymous requests are refused, other users' data is not returned, invalid input returns 400, and cross-origin form posts are rejected.

## Before you finish

```sh
npx svelte-check --fail-on-warnings
npx eslint .
npx vitest run
npx vite build
npm audit --audit-level=moderate
npm ls svelte @sveltejs/kit   # at or above the minimum safe versions
```
