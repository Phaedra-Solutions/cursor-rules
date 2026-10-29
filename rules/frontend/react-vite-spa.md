---
id: frontend/react-vite-spa
title: React single-page app with Vite
description: Vite 8 (Rolldown) React SPA structure, config, env, dev-server safety, routing and data fetching. Use when editing vite.config.*, index.html or src/ in a Vite React app.
applies_to: "vite >=7.0 <9"
legacy_rule: legacy/react-class-cra
globs: ["vite.config.*", "src/**/*.{ts,tsx}", "index.html"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://vite.dev/guide/migration
  - https://vite.dev/config/server-options
  - https://vite.dev/guide/env-and-mode
  - https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react
  - https://reactrouter.com/upgrading/v7
  - https://tanstack.com/query/latest
  - https://react.dev/blog/2025/02/14/sunsetting-create-react-app
  - https://github.com/vitejs/vite/security/advisories
  - https://github.com/remix-run/react-router/security/advisories
---

# React SPA with Vite 8

## Version check

- Read `vite`, `@vitejs/plugin-react` (or `-swc`), `react-router` and `react` from the lockfile.
- Vite 8: Rolldown and Oxc replace esbuild and Rollup. Vite 7: same structure, but keep `build.rollupOptions` and `esbuild` keys and plan the upgrade.
- Vite 6 or older, or Create React App (`react-scripts`): follow `legacy/react-class-cra` and `core/legacy-mode`; CRA was deprecated in February 2025.
- Node: Vite 8 needs Node 20.19+ or 22.12+; React Router 8 needs Node 22.22+.
- Also apply `frontend/react` and `languages/typescript`.

## Conventions

- Structure by feature, with kebab-case folders:

  ```text
  src/
  ├── app/            # providers, router, root layout
  ├── features/<feature>/   # components, hooks, api, types for one feature
  ├── components/     # shared UI (buttons, inputs, modals)
  ├── lib/api/        # the single API client and request helpers
  ├── lib/            # utils, constants, env validation
  └── types/          # types shared across features
  ```

- Keep one API module (`src/lib/api/`) that owns the base URL, auth headers, error mapping and response validation. Components never call `fetch` directly.
- Show API errors through the project's toast or notification helper, with a user-friendly message; log the detail.
- Add i18n only if the project already uses it (then put every user-facing string through it).
- Styling: follow the project (Tailwind in new projects; see `frontend/tailwind`). No inline styles for anything reusable.

## Vite 8 config

- Rename Rollup/esbuild-era options: `build.rollupOptions` → `build.rolldownOptions`, `worker.rollupOptions` → `worker.rolldownOptions`, `esbuild` → `oxc`, `optimizeDeps.esbuildOptions` → `optimizeDeps.rolldownOptions`.
- Default `build.target` is now Chrome/Edge 111, Firefox 114, Safari 16.4; set it explicitly only if the project supports older browsers.
- React Compiler with `@vitejs/plugin-react` 6: Babel path with `@rolldown/plugin-babel` and `reactCompilerPreset()`, or the experimental native `react({ compiler: true })` (needs `oxc-transform-react`). Ask before switching an existing setup.
- Check third-party Vite plugins for Vite 8 support before upgrading.

## Routing, data and state

- Routing: React Router in data mode (`createBrowserRouter` + `RouterProvider`), with loaders and lazy routes for code splitting. In React Router 8, import from `react-router` and DOM APIs from `react-router/dom`; `react-router-dom` no longer exists.
- Server state: TanStack Query, with query keys in one place per feature. Don't mirror server data into global client state.
- Client state: local component state first; Zustand for shared state in new projects; Redux Toolkit where the project already uses it.
- Forms: React Hook Form + Zod for new forms; keep Formik + Yup where the project uses them.

## Environment variables

- Only variables prefixed `VITE_` reach the client, through `import.meta.env`, and they are **public**: they're inlined into the bundle. Never put secrets, private API keys or service tokens in them.
- Validate `import.meta.env` with a schema at startup and export a typed `env` object; declare types in `vite-env.d.ts`.
- Don't widen `envPrefix` to expose non-`VITE_` variables.

## Security

- See `core/security-baseline` and `frontend/react`. Vite-specific points:
  - The dev server listens on `localhost` by default. Don't use `--host` / `server.host: true` on untrusted networks, and never expose it to the internet.
  - Never set `server.allowedHosts: true` or `server.cors: true`; both let any website read your source through the dev server. List hosts explicitly.
  - Keep `server.fs.strict` on and the default `server.fs.deny` list (`.env`, `.env.*`, keys and certs, `.npmrc`, `.git`).
  - `vite preview` is for local checks only; serve production builds from a real web server or CDN with security headers and a CSP.
  - An SPA can't keep secrets or enforce authorization: every API call must be authorized on the server.
  - Store tokens in `HttpOnly` cookies where the backend supports it, not `localStorage`.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed |
|---|---|---|
| CVE-2026-39363, CVE-2026-39364 (dev server file read, `fs.deny` bypass; high) | `vite` < 8.0.5, < 7.3.2 | 8.0.5, 7.3.2 |
| CVE-2026-112942, -112944, -112945, -112946 (`launch-editor` command issues, `fs.allow` bypass, cross-origin script) | `vite` < 8.3.3, < 7.3.7, < 6.4.4 | 8.3.3, 7.3.7, 6.4.4 |
| CVE-2025-30208 (`server.fs.deny` bypass) | `vite` < 6.2.3 and older lines | 6.2.3, 6.1.2, 6.0.12, 5.4.15, 4.5.10 |
| GHSA-qwww-vcr4-c8h2 (RSC-mode CSRF), plus 13 earlier 2025–26 advisories | `react-router` < 8.3.0, < 7.18.2 | 8.3.0, 7.18.2 |

Minimum safe: `vite` 8.3.3 (or 7.3.7 / 6.4.4) and `react-router` 8.3.0 (or 7.18.2). Most Vite issues affect only an exposed dev server, which is another reason never to expose it. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Unit and component tests: Vitest with Testing Library and `jsdom` or `happy-dom`, querying by role and label (see `frontend/react`).
- E2E: Playwright (or Cypress where the project uses it), selecting by `data-testid`.
- Mock the network at the boundary (MSW or the API module), not inside components.

## Before you finish

```sh
npx tsc --noEmit
npm run lint
npx vitest run
npm run build           # vite build must succeed
npm audit --audit-level=moderate
```
