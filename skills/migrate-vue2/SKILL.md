---
name: migrate-vue2
description: Migrate a Vue 2 app to Vue 3 with the official @vue/compat migration build, step by step - move to Vue 2.7 and replace Vue 3-incompatible libraries first, switch the build to Vue 3 plus @vue/compat in MODE 2, fix compat warnings feature by feature (filters, v-model, $listeners, events API, async components, transitions), migrate Vuex to Pinia or Vuex 4 and Vue Router 3 to the current router, then remove the compat build. Use when asked to migrate or upgrade Vue 2, or when legacy/vue2-nuxt2 applies to a Vue 2 app (not Nuxt 2).
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-30"
  sources: "https://v3-migration.vuejs.org/migration-build.html https://v3-migration.vuejs.org/breaking-changes/ https://v2.vuejs.org/eol/ https://router.vuejs.org/ https://pinia.vuejs.org/ https://test-utils.vuejs.org/ https://www.npmjs.com/package/@vue/compat"
---

# Migrate Vue 2 → Vue 3

## When to use

- The app runs Vue 2 (EOL 31 Dec 2023) and the user wants to move to Vue 3.
- For Nuxt 2 apps, use the Nuxt path in `legacy/vue2-nuxt2` instead (Nuxt Bridge or a rebuild); this skill covers Vue apps built with Vite, Vue CLI or webpack.

## Before you start

- Read `vue`, `vue-template-compiler`, `vue-router`, `vuex`, `@vue/test-utils`, the build tool (Vue CLI, webpack, Vite) and every Vue plugin and UI library from the lockfile.
- For each library, find a Vue 3 version or a replacement (for example Vuetify 2 → 3, BootstrapVue → a Vue 3 alternative, `vue-i18n` 8 → 9+). Libraries without a Vue 3 path are the main blockers; list them for the user.
- Working tree clean; new branch (`chore/vue-3`); a test suite and E2E smoke tests for main flows (add them first if missing).
- Ask the user:
  - whether to migrate the build tool (Vue CLI → Vite) in the same project, as a separate step before or after;
  - Vuex → Pinia now, or Vuex 4 first;
  - whether network installs are approved (`core/supply-chain` cooldown applies).

## Steps

1. **Baseline:** install, lint, unit tests, E2E and a production build. Record failures.
2. **Move to Vue 2.7** (`vue@2.7`), remove `@vue/composition-api` if present, and fix deprecation warnings. 2.7 lets you start writing `<script setup>` and Composition API code that also works in Vue 3.
3. **Remove patterns the compat build can't cover well** while still on Vue 2: filters → methods or computed; event bus (`$on`/`$off`/`$once`) → a tiny emitter (`mitt`) or Pinia; `$children` → refs; `.native` modifiers → explicit `emits`; functional components with templates → plain components.
4. **Switch to Vue 3 + compat build:**
   - install `vue@^3.5` and `@vue/compat@^3.5` (same version) and `@vue/compiler-sfc` (remove `vue-template-compiler`);
   - alias `vue` to `@vue/compat` in the bundler and set the compiler's `compatConfig: { MODE: 2 }` (Vite: `resolve.alias` plus `@vitejs/plugin-vue` `template.compilerOptions.compatConfig`; Vue CLI: `chainWebpack` alias and `vue-loader` options);
   - update `vue-router` to v4+ API (`createRouter`, `createWebHistory`) and Vuex to 4 (`createStore`) or Pinia;
   - replace `new Vue({...})` with `createApp(App).use(router).use(store).mount('#app')`.
5. **Run the app and fix compat warnings feature by feature.** Each warning names a compat flag (for example `COMPONENT_V_MODEL`, `INSTANCE_LISTENERS`, `RENDER_FUNCTION`, `ATTR_FALSE_VALUE`, `TRANSITION_CLASSES`). Fix the code, then disable that flag per component (`compatConfig: { COMPONENT_V_MODEL: false }`) or globally (`configureCompat`). Typical fixes:
   - `v-model` on components: `value`/`input` → `modelValue`/`update:modelValue` (or `defineModel`);
   - `$listeners` merged into `$attrs`; `inheritAttrs` behavior with `class`/`style`;
   - `v-if`/`v-for` precedence changed; `key` on `<template v-for>`;
   - async components → `defineAsyncComponent`;
   - transition class renames (`v-enter` → `v-enter-from`);
   - global API (`Vue.use`, `Vue.component`, `Vue.prototype`) → app instance (`app.use`, `app.component`, `app.config.globalProperties`).
6. **Update tests:** `@vue/test-utils` v2 (`mount` options changed: `props`, `global.plugins`, `global.stubs`).
7. **Remove the compat build** when no warnings remain: drop the alias and `@vue/compat`, set `MODE: 3` or remove `compatConfig`, and run everything again. Then switch to `frontend/vue`.
8. Show the diff and results at each step and wait for approval; commit only when asked (`git-commit` skill).

## Verify

```sh
npm ci
npm ls vue @vue/compat vue-router vuex pinia   # one Vue version; @vue/compat gone at the end
npx vue-tsc --noEmit                            # TypeScript projects
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
```

Then run the E2E suite and click through the main flows with the browser console open: no compat warnings, no Vue warnings, forms and `v-model` bindings work, router navigation and guards behave as before.

## Safety

- Never remove the compat build while warnings remain; never globally disable compat flags you haven't fixed.
- Never upgrade a UI library major and Vue in the same step without telling the user; keep each step reviewable.
- Never ship the full template compiler build to production after the migration.
- Never auto-commit, push or deploy; don't hand-edit the lockfile.
