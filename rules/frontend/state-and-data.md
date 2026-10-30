---
id: frontend/state-and-data
title: React state and server data
description: Framework-neutral React state and data rules - classify state (server, client, URL, form, local), TanStack Query for server state with query-key factories, invalidation and optimistic updates with rollback, Zustand for client state in new projects and Redux Toolkit (with RTK Query) where it exists (decision D4), URL state for shareable filters, and no secrets, tokens or personal data in persisted state. Use when adding or changing data fetching, caches or stores in React, Next.js or React Native apps.
applies_to: "any"
globs: ["**/*{store,Store,query,Query,slice,Slice,hooks,api}*.{ts,tsx,js,jsx}", "**/stores/**", "**/queries/**", "**/state/**"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
  - https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
  - https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
  - https://zustand.docs.pmnd.rs/
  - https://redux-toolkit.js.org/rtk-query/overview
  - https://redux.js.org/usage/migrating-to-modern-redux
  - https://react.dev/learn/choosing-the-state-structure
  - https://www.npmjs.com/package/@tanstack/react-query
  - https://www.npmjs.com/package/zustand
---

# React state and server data

Applies with `frontend/react` (and `frontend/nextjs`, `frontend/react-vite-spa`, `mobile/react-native-expo`). House defaults are in `conventions/phaedra`.

## Version check

- Read `@tanstack/react-query`, `zustand`, `@reduxjs/toolkit`, `react-redux`, `swr` and persistence libraries (`zustand/middleware`, `redux-persist`) from the lockfile, and state them:

  ```text
  Applying frontend/state-and-data (@tanstack/react-query 5.105, zustand 5.0, no Redux, from package-lock.json).
  ```

- Current: TanStack Query 5 (5.105), Zustand 5 (5.0.16), Redux Toolkit 2 (2.13). On TanStack Query 4 or Zustand 3/4, write that version's API (`isLoading` vs `isPending`, `create` imports) and follow `core/legacy-mode`.

## Conventions

### Pick the right home for each piece of state

| State | Home |
|---|---|
| Data from the server (lists, entities, user profile) | TanStack Query (or RTK Query in Redux projects, SWR where the project uses it) |
| UI state shared across components (sidebar open, selected tab across routes, draft wizard steps) | Zustand in new projects; Redux Toolkit where it already exists (D4) |
| Shareable view state (filters, sort, page, search) | the URL (search params), via the router |
| Form state | the form library (`frontend/forms-validation`) |
| State used by one component or a small subtree | `useState`/`useReducer`, lifted only as far as needed |

- Never copy server data into a client store "to share it"; read it from the query cache with the same key. Don't mirror props into state; derive during render.

### TanStack Query

- One query-key factory per feature, keys as arrays from general to specific:

  ```ts
  export const orderKeys = {
    all: ['orders'] as const,
    list: (filters: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
    detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  }
  ```

- Wrap queries in hooks (`useOrders(filters)`) using `queryOptions()`; include every variable the `queryFn` uses in the key.
- Set `staleTime` deliberately per query (the default `0` refetches on every mount and focus); keep `gcTime` defaults unless measured.
- **Mutations:** invalidate affected keys in `onSuccess` (`queryClient.invalidateQueries({ queryKey: orderKeys.all })`), or update the cache with `setQueryData` from the server response.
- **Optimistic updates:** in `onMutate`, cancel in-flight queries for the key, snapshot the previous data, apply the optimistic change, and return the snapshot; restore it in `onError`; invalidate in `onSettled`. Or use the simpler `variables`-based optimistic UI for single components.
- Handle `isPending`, `isError` and empty states in the UI; use error boundaries with `throwOnError` only where a boundary exists.
- Next.js App Router: prefetch on the server and hydrate (`HydrationBoundary`), with a new `QueryClient` per request on the server.

### Zustand (new projects) and Redux Toolkit (existing)

- Zustand: small stores per concern, actions inside the store, selectors with `useStore(s => s.value)` (and `useShallow` for object selections) to avoid re-renders; no async server caching in stores.
- Redux Toolkit: `createSlice` and `configureStore`; RTK Query for server data in Redux apps instead of hand-written thunks; typed `useAppSelector`/`useAppDispatch`. Don't add Zustand to a Redux project or vice versa.
- Never mutate state outside Immer-backed reducers or Zustand `set`.

## Security

- **No secrets, tokens or personal data in persisted state.** `persist` middleware, `redux-persist`, `localStorage`, `sessionStorage` and AsyncStorage are readable by any script on the origin (XSS) or on a rooted device. Keep auth in `HttpOnly` cookies (web) or secure storage (`expo-secure-store`, Keychain/Keystore) and persist only preferences.
- Clear user-scoped caches and stores on logout (`queryClient.clear()`, store reset) so the next user on the device doesn't see the previous user's data.
- Don't put personal data in query keys that end up in logs or devtools exports, or in the URL (search params are logged by servers and analytics).
- Treat cached server data as untrusted when rendering (`frontend/react` rules on HTML and URLs still apply).
- Ship React Query Devtools and Redux DevTools only in development builds.

## Known vulnerabilities

- No current OSV advisories for `@tanstack/react-query`, `zustand` or `@reduxjs/toolkit` as of 2026-10; the risk is in what gets cached and persisted.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Test hooks with a fresh `QueryClient` per test (`retry: false`) and MSW for HTTP; assert loading, error and success states.
- Test optimistic updates roll back on a failed mutation, and that logout clears cached user data.
- Zustand: reset stores between tests (`store.setState(initialState, true)`).

## Before you finish

```sh
npx tsc --noEmit
npm test
grep -rnE "persist\(|redux-persist|localStorage\.setItem|AsyncStorage\.setItem" src 2>/dev/null   # nothing secret is persisted
```
