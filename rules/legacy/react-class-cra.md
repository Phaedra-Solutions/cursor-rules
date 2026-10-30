---
id: legacy/react-class-cra
title: React class components, legacy Redux and Create React App
description: Safe maintenance of React apps built with class components, legacy Redux (connect, hand-written reducers, redux-thunk/saga boilerplate) and Create React App or custom webpack setups - CRA's deprecation (14 Feb 2025) and maintenance mode, REACT_APP_ env exposure, react-scripts dependency debt, React 16-18 limits, error boundaries, and the migration path to hooks, Redux Toolkit and Vite or a framework. Use when the project uses react-scripts, class components or connect().
applies_to: "react-scripts >=1.0 <6"
globs: ["src/**/*.{js,jsx,ts,tsx}", "package.json", "config-overrides.js", "craco.config.*", "webpack.config.*"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://react.dev/blog/2025/02/14/sunsetting-create-react-app
  - https://react.dev/reference/react/Component
  - https://react.dev/learn/you-might-not-need-an-effect
  - https://redux.js.org/usage/migrating-to-modern-redux
  - https://react-redux.js.org/api/hooks
  - https://vite.dev/guide/env-and-mode
  - https://www.npmjs.com/package/react-scripts
  - https://react.dev/blog/2024/04/25/react-19-upgrade-guide
---

# React class components, legacy Redux and Create React App

Also apply `core/legacy-mode` and the Security section of `frontend/react` (no `dangerouslySetInnerHTML` with untrusted data, URL validation, no secrets in the bundle). Don't migrate as part of an unrelated task.

## Version check

- Read `react`, `react-dom`, `react-scripts` (or webpack and Babel), `redux`, `react-redux`, `@reduxjs/toolkit`, `redux-saga`/`redux-thunk` and the test stack from the lockfile, and state them:

  ```text
  Applying legacy/react-class-cra (react 17.0.2, react-scripts 5.0.1, redux 4.2 + connect, Jest 27 via CRA).
  ```

- **Create React App** was deprecated for new apps on **14 Feb 2025** and continues only in maintenance mode; `react-scripts` 5.0.1 (Apr 2022) is the last major and pins an old webpack, Babel and Jest toolchain with many transitive `npm audit` findings (mostly dev-only). Offer `migrate-cra-to-vite`.
- **React:** 19 is current (see `frontend/react`). On 16–18, don't use React 19 APIs (`use`, Actions, `ref` as a prop, `useActionState`); on 16.8 or older there are no hooks. Class components still work in React 19, but legacy APIs (`string refs`, `contextTypes`, `propTypes` checking, `findDOMNode`) are removed in 19.

## Conventions

- **Class components:** keep them where they are; write new components as function components with hooks if the React version allows (16.8+), even in a class-heavy codebase. Offer `migrate-class-to-hooks` for files you need to change substantially.
- In classes: bind handlers with class fields (`handleClick = () => {}`), never mutate `this.state` directly, use the updater form of `setState` when depending on previous state, and clean up subscriptions in `componentWillUnmount`.
- Remove `UNSAFE_componentWillMount`/`WillReceiveProps`/`WillUpdate` when touching a component (use `componentDidMount`, `getDerivedStateFromProps` sparingly, or `componentDidUpdate`).
- Error boundaries are still class components (`componentDidCatch`, `getDerivedStateFromError`); keep at least one around each route.
- **Legacy Redux:** keep `connect` where it exists; new code uses `useSelector`/`useDispatch` (react-redux 7.1+). New slices use Redux Toolkit (`createSlice`, `configureStore`) alongside old reducers; RTK can wrap an existing store. Never mutate state outside RTK's Immer reducers.
- **Env:** CRA exposes `REACT_APP_*` and `NODE_ENV` in the bundle; treat them as public. Don't eject (`npm run eject`) to fix config; use the migration instead.

## Safe maintenance

- Patch React within its major (17.0.2, 18.3.1) and Redux libraries within theirs.
- `npm audit` noise from `react-scripts` is mostly build-time; check whether a finding reaches the browser bundle or the dev server before acting, and don't use `npm audit fix --force` (it can "fix" by downgrading `react-scripts` to an old major). Use `overrides` for specific transitive fixes if needed.
- Don't expose the CRA dev server (`HOST=0.0.0.0`) on shared networks; webpack-dev-server had source-exposure advisories.
- Keep the build reproducible: commit the lockfile, pin Node to a supported LTS (`legacy/node-legacy` if old).

## Security

- Every rule in the Security section of `frontend/react` applies. Class-specific: don't render `this.props.html` with `dangerouslySetInnerHTML`; don't store tokens in Redux state persisted to `localStorage` (`redux-persist`) when the backend can use `HttpOnly` cookies.
- No secrets in `REACT_APP_*` or `.env*` files committed to the repo.

## Known vulnerabilities (as of 2026-10)

- `react-scripts` 5.0.1 has no direct OSV advisory but pulls old transitive packages (webpack-dev-server, `nth-check`, `postcss`) with known advisories; most affect the dev server and build only.
- React DOM itself has no current advisories for 16–18 client rendering; React Server Components advisories (`react-server-dom-*`) don't apply to CRA apps.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

1. Move the build off CRA with `migrate-cra-to-vite` (or to a framework: Next.js, React Router framework mode, Expo for native targets).
2. Upgrade React one major at a time (17 → 18 → 19) after the build moves, following the React upgrade guides; run codemods where they exist.
3. Convert class components gradually with `migrate-class-to-hooks`, starting with leaf components that you're changing anyway.
4. Move Redux to Redux Toolkit slice by slice (`redux.js.org` "Migrating to Modern Redux"); replace `connect` with hooks as components convert.

## Testing

- Keep the existing Jest + Testing Library tests green; add tests for components before converting them.
- After moving the build, run the same tests under Vitest (see `testing/unit-js`).

## Before you finish

```sh
npm test -- --watchAll=false
npm run build
npm audit --omit=dev --audit-level=moderate   # runtime dependencies first
npm ls react react-dom react-scripts redux react-redux @reduxjs/toolkit
```
