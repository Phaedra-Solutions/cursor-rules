---
id: legacy/vue2-nuxt2
title: Vue 2, Nuxt 2 and Nuxt 3
description: Safe maintenance of Vue 2 (EOL 31 Dec 2023), Nuxt 2 and Nuxt 3 (EOL 31 Jul 2026) - status and last releases, unfixed advisories (Vue 2 template compiler, Nuxt 3 route-rule bypass), compensating controls, the Options API and Vuex patterns to keep, and migration paths through the @vue/compat build and Nuxt 4. Use when vue is 2.x or nuxt is 2.x or 3.x.
applies_to: "vue >=2.0 <3"
globs: ["**/*.vue", "nuxt.config.*", "store/**", "plugins/**", "middleware/**", "server/**"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://v2.vuejs.org/eol/
  - https://v3-migration.vuejs.org/migration-build.html
  - https://v3-migration.vuejs.org/breaking-changes/
  - https://nuxt.com/docs/4.x/community/roadmap
  - https://nuxt.com/docs/4.x/getting-started/upgrade
  - https://www.herodevs.com/blog-posts/nuxt-3-reaches-end-of-life-on-july-31-2026-what-are-your-options
  - https://www.npmjs.com/package/vue
  - https://www.npmjs.com/package/nuxt
  - https://osv.dev/vulnerability/GHSA-5j4c-8p2g-v4jx
  - https://osv.dev/vulnerability/GHSA-g3ch-rx76-35fx
  - https://osv.dev/vulnerability/GHSA-vjh5-4x84-xrqp
  - https://osv.dev/vulnerability/GHSA-9473-5f9j-94wq
---

# Vue 2, Nuxt 2 and Nuxt 3

Also apply `core/legacy-mode` and the Security sections of `frontend/vue` and `frontend/nuxt` (`v-html`, URL bindings, runtime config, server-route validation); they apply to these versions too. Don't migrate as part of an unrelated task.

## Version check

- Read `vue`, `vue-template-compiler`, `vuex`, `vue-router`, `nuxt`, `@nuxt/*` and `nuxt-bridge` from the lockfile, and state them:

  ```text
  Applying legacy/vue2-nuxt2 (vue 2.7.16, vuex 3.6, nuxt 2.18.1, Options API, from yarn.lock).
  ```

- **Status:**
  - **Vue 2:** EOL 31 Dec 2023; last release 2.7.16. No security fixes.
  - **Nuxt 2:** unsupported (last release 2.18.1).
  - **Nuxt 3:** EOL **31 Jul 2026**; last release 3.21.11. Advisories after that date aren't fixed on 3.x.
  - Commercial extended support exists (HeroDevs) for Vue 2 and Nuxt 2/3.
- Report EOL status in the summary and offer `migrate-vue2` or `upgrade-nuxt`.

## Conventions

- Keep the existing style. Vue 2.7 supports the Composition API and `<script setup>` natively; use it for new components in 2.7 projects if the codebase already does, otherwise stay with the Options API.
- Vuex stays in Vuex projects; Pinia 2 also supports Vue 2.7 if the user wants to start moving.
- Don't add libraries that require Vue 3 or Nuxt 4; check `peerDependencies` first.
- Prepare for migration while touching code: avoid filters (`{{ value | currency }}`), `$listeners`, `$children`, `Vue.set` where not needed, event-bus `$on/$off`, and `.native` modifiers, which Vue 3 removes.
- Nuxt 2: `asyncData`/`fetch` hooks, `@nuxtjs/axios`, `store/` modules. Nuxt 3: root-level `pages/`, `components/` (no `app/` srcDir) and `data` defaulting to `null`.

## Safe maintenance

- Stay on the last release of each line (Vue 2.7.16, Nuxt 2.18.1, Nuxt 3.21.11) and keep other dependencies patched within what they support.
- **Vue 2 template compiler** (`vue-template-compiler`, the full build): has unfixed XSS and ReDoS advisories. Ship the runtime-only build, precompile templates at build time, and never compile templates from user or CMS input.
- **Nuxt 3** (unfixed CVE-2026-114132: server-side route rules skipped for some paths): don't rely on `routeRules` for redirects, headers, proxying or auth; enforce them in Nitro server middleware or the reverse proxy.
- Compensating controls: a CSP that blocks inline script, security headers at the proxy, and server-side authorization on every API.
- Keep devtools and dev servers off shared networks.

## Security

- Every rule in the Security sections of `frontend/vue` and `frontend/nuxt` applies: no `v-html` on untrusted content, validated URL bindings, secrets only in server-side config, validated and authorized server routes.
- Nuxt 2 `env` and `publicRuntimeConfig` values are public; secrets go in `privateRuntimeConfig` (Nuxt 2.13+) or server-only code.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Status |
|---|---|---|
| CVE-2024-6783: client-side XSS in `vue-template-compiler` | Vue 2 | No fix |
| CVE-2024-9506: ReDoS in the template parser | Vue 2 | No fix in 2.x |
| CVE-2026-114132: server-side route rules skipped for some paths | Nuxt 3.0+ | Fixed only in Nuxt 4.6.2; upgrade to ≥ 4.6.3, which also fixes CVE-2026-119200 |
| CVE-2026-71320 (runtime template injection RCE), island DoS and payload advisories | Nuxt 3 | Fixed in 3.21.10 (use 3.21.11) |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

1. **Vue 2 → Vue 3** with the `migrate-vue2` skill: move to 2.7 first, replace incompatible libraries, then switch to Vue 3 with `@vue/compat` (migration build), fix compat warnings feature by feature, and remove the compat build.
2. **Nuxt 2 → Nuxt 4:** there is no in-place path. Either migrate to Nuxt 3 behavior through Nuxt Bridge and then follow `upgrade-nuxt`, or rebuild pages in a new Nuxt 4 app and move routes over incrementally. Agree the approach with the user.
3. **Nuxt 3 → Nuxt 4** with the `upgrade-nuxt` skill (`npx nuxt upgrade`, the official codemods, `app/` directory).

## Testing

- Before migrating, make sure tests cover main flows (component tests with `@vue/test-utils` v1 for Vue 2, plus E2E with Playwright or Cypress).
- Run the E2E suite against both the old and the migrated app to compare behavior.

## Before you finish

```sh
npm test
npm run build
npm audit --audit-level=moderate
npm ls vue vue-template-compiler nuxt 2>/dev/null
grep -rn "v-html" components pages layouts 2>/dev/null
```
