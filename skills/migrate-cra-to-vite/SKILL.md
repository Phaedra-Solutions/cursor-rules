---
name: migrate-cra-to-vite
description: Move a Create React App (react-scripts) project to Vite - install Vite and @vitejs/plugin-react, move index.html to the project root with a module script, rename REACT_APP_ env variables to VITE_ and process.env to import.meta.env, handle %PUBLIC_URL%, SVG imports, path aliases, proxy and port settings, switch Jest to Vitest (or keep Jest with its own config), update scripts and CI, and verify. Use when asked to migrate off CRA or when legacy/react-class-cra applies.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-30"
  sources: "https://react.dev/blog/2025/02/14/sunsetting-create-react-app https://vite.dev/guide/ https://vite.dev/guide/env-and-mode https://vite.dev/config/server-options https://www.npmjs.com/package/@vitejs/plugin-react https://www.npmjs.com/package/vite-plugin-svgr https://vitest.dev/guide/migration"
---

# Migrate Create React App → Vite

## When to use

- The project uses `react-scripts` (CRA, deprecated since 14 Feb 2025) and the user wants a supported build.
- If the user wants a framework instead (Next.js, React Router framework mode), follow that framework's CRA guide; this skill covers a client-only SPA on Vite (see `frontend/react-vite-spa`).

## Before you start

- Read `react-scripts`, React, TypeScript, CRACO/react-app-rewired config, `src/setupProxy.js`, `.env*` files, `public/index.html`, Jest config in `package.json`, and how SVGs, CSS modules and images are imported.
- Working tree clean; new branch (`chore/vite`); record the current build output size and a list of pages to smoke-test.
- Ask the user:
  - whether to switch tests to Vitest now or keep Jest for this change;
  - the deployment base path (`homepage` in `package.json`) and the hosting setup;
  - whether network installs are approved (`core/supply-chain` cooldown applies).

## Steps

1. **Baseline:** `npm test -- --watchAll=false`, `npm run build`, and a smoke test of key pages.
2. **Install:** `npm install -D vite @vitejs/plugin-react` (and `vite-plugin-svgr` if the app imports SVGs as React components, `vite-tsconfig-paths` if it uses `baseUrl`/`paths`). Remove `react-scripts`, CRACO or react-app-rewired after the build works.
3. **Config:** add `vite.config.ts`:

   ```ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     server: { port: 3000 },          // keep CRA's port if scripts or docs depend on it
     build: { outDir: 'build' },      // keep CRA's output folder if deploys expect it
   })
   ```

   Set `base` if the app is served from a sub-path (CRA's `homepage`).
4. **`index.html`:** move `public/index.html` to the project root, remove `%PUBLIC_URL%` (use `/` paths), and add `<script type="module" src="/src/index.tsx"></script>` (the entry file). Assets in `public/` keep working at `/`.
5. **Environment variables:** rename `REACT_APP_*` to `VITE_*` in `.env*`, CI and hosting settings; replace `process.env.REACT_APP_X` with `import.meta.env.VITE_X` and `process.env.NODE_ENV` with `import.meta.env.MODE`/`DEV`/`PROD`. Add `src/vite-env.d.ts` (`/// <reference types="vite/client" />`). Everything prefixed `VITE_` is public; keep secrets out.
6. **Imports:** SVG components via `vite-plugin-svgr` (`import Logo from './logo.svg?react'`); files with JSX must use `.jsx`/`.tsx` extensions (rename `.js` files that contain JSX); replace `require()` calls with imports.
7. **Proxy:** move `setupProxy.js` or the `proxy` field to `server.proxy` in `vite.config.ts`.
8. **Scripts:** `"dev": "vite"`, `"build": "tsc -b && vite build"` (or `vite build`), `"preview": "vite preview"`; update CI and Dockerfiles that call `react-scripts`.
9. **Tests:** either move to Vitest (`vitest`, `jsdom`, `@testing-library/jest-dom`; `test.environment = 'jsdom'`, `setupFiles`; replace `jest.fn` with `vi.fn`, `jest.mock` with `vi.mock`), or keep Jest with an explicit `jest.config` and Babel/ts-jest since `react-scripts test` is gone. See `testing/unit-js`.
10. **Lint:** replace `eslint-config-react-app` with the project's flat ESLint config (`eslint-plugin-react-hooks`, `typescript-eslint`).
11. **Verify** (next section); show the diff and results; commit only when asked (`git-commit` skill). Then use `frontend/react-vite-spa`.

## Verify

```sh
npm ci
npm ls react-scripts 2>/dev/null || echo "react-scripts removed"
npx tsc --noEmit
npx eslint .
npx vitest run                     # or: npx jest
npm run build && npx vite preview  # then smoke-test
npm audit --audit-level=moderate
grep -rn "REACT_APP_\|process\.env\.\|%PUBLIC_URL%" src index.html .env* 2>/dev/null   # nothing left
```

Smoke test the preview build: deep links load (configure the host's SPA fallback), images and fonts from `public/` load, API calls reach the proxy or real API, environment-dependent features show the right values.

## Safety

- Never put secrets into `VITE_*` variables while renaming; check each `REACT_APP_*` value is safe to expose (it already was public).
- Never combine the build migration with a React major upgrade or a router change.
- Never expose the Vite dev server with `--host` on shared networks (see `frontend/react-vite-spa`).
- Never auto-commit, push or deploy; don't hand-edit the lockfile.
