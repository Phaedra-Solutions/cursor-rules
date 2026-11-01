---
id: frontend/react
title: React
description: React 19 component, hooks, React Compiler, security and testing conventions. Use when editing .tsx or .jsx components in any React project (Vite, Next.js, React Native).
applies_to: "react >=19.0 <20"
legacy_rule: legacy/react-class-cra
globs: ["**/*.tsx", "**/*.jsx"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://react.dev/blog/2026/09/09/react-19-3
  - https://react.dev/blog/2025/10/07/react-compiler-1
  - https://react.dev/learn/react-compiler/introduction
  - https://react.dev/blog/2024/04/25/react-19-upgrade-guide
  - https://react.dev/learn/you-might-not-need-an-effect
  - https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components
  - https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components
  - https://raw.githubusercontent.com/facebook/react/main/packages/react-dom-bindings/src/shared/sanitizeURL.js
  - https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
  - https://testing-library.com/docs/queries/about/#priority
  - https://github.com/cure53/DOMPurify
  - https://www.cisa.gov/known-exploited-vulnerabilities-catalog
---

# React 19

## Version check

- Read `react` and `react-dom` from the lockfile. This rule covers 19.x (19.3 is current).
- React 18 or older, class components, or Create React App: follow `legacy/react-class-cra` and `core/legacy-mode`.
- Check whether React Compiler is on: `babel-plugin-react-compiler` or `react({ compiler: true })` / `reactCompilerPreset` in `vite.config.*`, or `reactCompiler: true` in `next.config.*`. Memoization guidance below depends on it.
- For frameworks, also apply `frontend/nextjs` or `frontend/react-vite-spa`; for mobile, `mobile/react-native-expo`.

## Conventions

- Function components only. Declare them as arrow functions or function declarations to match the project; one component per file.
- Type props with an interface or type (see `languages/typescript`). No `propTypes` or `defaultProps` on function components; React 19 ignores them. Use default parameter values.
- `ref` is a regular prop in React 19; don't add `forwardRef` to new components.
- Use the context directly as a provider (`<ThemeContext value={...}>`), not `<ThemeContext.Provider>`.
- Keep components small; extract custom hooks (`useXxx`) for reusable logic.
- Reuse existing components (buttons, inputs, modals, loaders) before creating new ones.
- Add test IDs to interactive elements and to elements shown or hidden by logic (see `core/behavior`).

## Hooks and effects

- Follow the Rules of Hooks; keep `eslint-plugin-react-hooks` on with its `recommended` config (it includes the React Compiler rules).
- Use effects only to synchronize with external systems (subscriptions, timers, imperative widgets, non-React DOM). Don't use them to derive state, transform data for rendering, or respond to user events; compute during render or handle it in the event handler.
- Every effect that subscribes or starts work cleans up.
- Use `useEffectEvent` for non-reactive logic read inside an effect instead of disabling the dependency lint.
- Prefer framework data loading (route loaders, Server Components, TanStack Query) over fetching in effects.

## Memoization and React Compiler

- **Compiler on** (React Compiler 1.0): don't add `useMemo`, `useCallback` or `React.memo` by default. Add them only for precise control, such as a value used as an effect dependency, and keep existing memoization unless profiling shows it's safe to remove.
- **Compiler off:** memoize only where profiling shows a real cost, or where referential identity is required.
- Never mutate props, state or values used during render; the compiler relies on it.

## Newer APIs to prefer

- Forms and mutations: Actions with `useActionState`, `useOptimistic` and `useFormStatus`.
- `use()` to read a promise or context.
- `<Suspense>` for loading states; `<Activity>` to keep hidden UI's state.
- React 19.3: `<ViewTransition>` and `addTransitionType` for animated transitions; refs on `<Fragment>`; `browser()` from `react-dom` with `use()` to opt a subtree out of server rendering.

## Do / Don't

```tsx
// ✗ state derived in an effect
const [fullName, setFullName] = useState('')
useEffect(() => setFullName(`${first} ${last}`), [first, last])

// ✓ derived during render
const fullName = `${first} ${last}`
```

- ✓ Keys from stable IDs; ✗ array indexes as keys for reorderable lists.
- ✓ Controlled inputs managed by the project's form library; ✗ reading the DOM to get form values.
- ✗ Defining components inside other components.

## Forms and state

- Follow the project's existing choices. For new code: React Hook Form with a Standard Schema resolver (Zod by default) for forms; TanStack Query for server state; Zustand for shared client state (keep Redux Toolkit where it already exists). See `conventions/phaedra`.
- Keep local UI state in the component; lift it only as far as needed.

## Security

- See `core/security-baseline`. React-specific points:
  - Don't use `dangerouslySetInnerHTML` with untrusted HTML. If rendering HTML is unavoidable, sanitize it with DOMPurify first, and prefer Trusted Types (React 19.3 passes `TrustedHTML` through).
  - React 19 neutralizes `javascript:` URLs, but not `data:` or other schemes. Allowlist schemes (`https:`, `mailto:`) for any user-supplied `href`, `src` or `action`.
  - Never put secrets in client code or in public env vars (`VITE_*`, `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`); everything shipped to the browser is public.
  - Don't spread untrusted objects into JSX props (`<a {...userProps}>`); pick known fields.
  - Server Components and Server Functions are server endpoints: authenticate, authorize and validate input in each one (framework rules give details).

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed |
|---|---|---|
| CVE-2025-55182 "React2Shell", RSC remote code execution (critical, in CISA KEV) | `react-server-dom-webpack`/`-turbopack`/`-parcel` 19.0.0–19.2.0 | 19.0.1, 19.1.2, 19.2.1 |
| CVE-2025-55183 (source exposure), CVE-2025-55184, CVE-2025-67779 (DoS) | same packages | 19.0.3, 19.1.4, 19.2.3 |
| CVE-2026-23864, CVE-2026-23869, CVE-2026-23870, CVE-2026-44907 (RSC DoS) | same packages | 19.0.8, 19.1.9, 19.2.8 |

Minimum safe: 19.2.8 on the 19.2 line, or any 19.3.x. These packages are usually pulled in by a framework (Next.js, React Router RSC), so check the lockfile, not just `package.json`. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Unit and component tests use Testing Library and query by role, label or text first (`getByRole('button', { name: 'Save' })`); use `getByTestId` only when no accessible query fits.
- E2E tests (Playwright, Cypress) select by `data-testid` (house convention).
- Test behavior through the UI (user events), not implementation details or internal state.
- Run tests in Strict Mode, which double-invokes effects to surface missing cleanup.

## Before you finish

```sh
npx tsc --noEmit
npm run lint            # includes eslint-plugin-react-hooks
npm test                # Vitest or Jest with Testing Library
npm audit --audit-level=moderate
```
