---
id: frontend/vue
title: Vue 3
description: Vue 3.5 single-file components - script setup with TypeScript, typed defineProps, defineEmits and defineModel, composables, Pinia, Vue Router, Vapor Mode only after 3.6 is stable, template security (v-html, URL bindings, no runtime template compilation from user input), vue-i18n escaping and testing with Vitest and Vue Test Utils. Use when editing .vue files or Vue TypeScript modules.
applies_to: "vue >=3.4 <4"
legacy_rule: legacy/vue2-nuxt2
globs: ["**/*.vue", "src/**/*.ts"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://vuejs.org/guide/introduction.html
  - https://vuejs.org/api/sfc-script-setup.html
  - https://vuejs.org/guide/best-practices/security.html
  - https://vuejs.org/guide/reusability/composables.html
  - https://vuejs.org/guide/components/v-model.html
  - https://www.npmjs.com/package/vue
  - https://pinia.vuejs.org/
  - https://router.vuejs.org/
  - https://test-utils.vuejs.org/
  - https://osv.dev/vulnerability/GHSA-83rm-6c8r-g728
  - https://osv.dev/vulnerability/GHSA-8rc2-428q-7ww3
---

# Vue 3

Also apply `languages/typescript`. Nuxt apps also apply `frontend/nuxt`; styling with Tailwind, `frontend/tailwind`; forms, `frontend/forms-validation`.

## Version check

- Read `vue`, `vue-router`, `pinia`, `vue-tsc`, `@vitejs/plugin-vue` and `vue-i18n` from the lockfile, and state them:

  ```text
  Applying frontend/vue (vue 3.5.44, vue-router 5.4, pinia 4.1, vue-tsc 3.3, from pnpm-lock.yaml).
  ```

- Current (Oct 2026): Vue 3.5.44; **3.6 (Vapor Mode) is still a release candidate** (3.6.0-rc.13). Don't adopt Vapor Mode or 3.6-only APIs until 3.6 is stable and the user asks.
- Version-gated APIs: `defineModel` (3.4+), reactive props destructure with defaults, `useTemplateRef`, `useId` and lazy hydration (3.5+).
- **Vue 2** (`vue` 2.x, Options API with `Vue.extend`, `new Vue`): use `legacy/vue2-nuxt2` and offer `migrate-vue2`.

## Conventions

- SFCs with `<script setup lang="ts">`, then `<template>`, then `<style scoped>` (or the project's Tailwind setup). One component per file, PascalCase names (`UserCard.vue`).
- Composition API for new code. Keep the Options API in existing components unless asked to convert.
- Props and events typed with type-only declarations:

  ```vue
  <script setup lang="ts">
  const { user, compact = false } = defineProps<{ user: User; compact?: boolean }>()
  const emit = defineEmits<{ select: [id: string] }>()
  const open = defineModel<boolean>('open', { default: false })
  </script>
  ```

- Never mutate props; emit events or use `defineModel`. Use `computed` for derived state, `watch` only for side effects, and stop custom effects in `onScopeDispose`.
- Logic shared between components goes into composables (`useOrders()` in `composables/`), returning refs and functions; no global mutable module state outside Pinia.
- **State:** Pinia stores (setup syntax) for client state; TanStack Query (`@tanstack/vue-query`) or the project's data layer for server state (see `conventions/phaedra`). Keep component-local state local.
- **Routing:** lazy-load route components (`component: () => import('./pages/Orders.vue')`); route guards are UX only, not security.
- `v-for` always with a stable `:key` (not the index for mutable lists); never `v-if` and `v-for` on the same element.
- Accessible markup: real `<button>`/`<a>`, labels for inputs, `data-testid` on interactive elements on house projects.
- Run `vue-tsc --noEmit` in CI; ESLint with `eslint-plugin-vue` (flat config).

## Security

- Vue escapes `{{ }}` and attribute bindings. **`v-html` renders raw HTML**: never with user or API content unless sanitized with DOMPurify in one reviewed helper.
- URL bindings (`:href`, `:src`, `:action`, `<a :href>` in `router-link` `to` as strings) don't block `javascript:` URLs: validate schemes (`https:`, `mailto:`, relative) before binding user-supplied URLs.
- Never build templates from user input (runtime template compilation, `new Function`, `compile()` with user strings); use the runtime-only build.
- Don't bind user-controlled objects to `v-bind="obj"` on elements (attribute injection such as `onclick`, `style`, `srcdoc`).
- `vue-i18n`: use the latest patch (≥ 11.4.14); don't put HTML in translation messages that carry user values, and don't use `v-html` with `$t()` output.
- Secrets never go in client code or `VITE_*` variables; everything in the bundle is public.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2026-118256, CVE-2026-118257: `escapeParameter` doesn't escape named values or prevent `srcdoc` XSS | vue-i18n 9.0 – 11.4.13 | 11.4.14 |
| CVE-2024-9506: ReDoS in the Vue 2 template parser | vue 2.x | No fix in 2.x; Vue 3 |
| CVE-2024-6783: client-side XSS in `vue-template-compiler` | vue-template-compiler 2.x | No fix |

Vue 3 core has no current OSV advisories. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Vitest with `@vue/test-utils` (or `@testing-library/vue`); query by role and label first (see `testing/unit-js`).
- Test emitted events and `v-model` updates, not internal state. Mock HTTP with MSW.
- Add a test that user content renders as text, not HTML, wherever `v-html` is avoided on purpose.

## Before you finish

```sh
npx vue-tsc --noEmit
npx eslint .
npx vitest run
npm audit --audit-level=moderate
grep -rn "v-html" src 2>/dev/null       # each use sanitized and justified
```
