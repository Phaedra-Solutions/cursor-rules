# Prompt 24: Vue, Nuxt, Tailwind, forms and validation (+ Vue 2 legacy)

> Self-contained; safe in a fresh session. Roadmap: Phase 3, §7 (`frontend/vue` + `frontend/nuxt`, `frontend/tailwind`), §8.2, §12 (D4).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it. D4 sets the form and validation defaults.
2. Read the matching `ROADMAP.md` §7 entries and the Vue/Nuxt rows of §8.2.
3. Research:
   - Vue's current version and Vapor Mode status;
   - Nuxt's current version, Nuxt 3 EOL and the Nuxt 5 status; the nuxt-security module;
   - Tailwind's current version and v4 config;
   - React Hook Form; Zod's current major; the Standard Schema spec; Angular Signal Forms (to reference only).

## Task
1. **`rules/frontend/vue.md`** (tier P1; globs `**/*.vue`, `src/**/*.ts`; `legacy_rule: legacy/vue2-nuxt2`) and **`rules/frontend/nuxt.md`** (tier P1; globs `nuxt.config.*`, `app/**`, `server/**`).
2. **`rules/frontend/tailwind.md`:**
   - tier P1; globs `**/*.css`, `tailwind.config.*`, `**/*.{tsx,jsx,vue,svelte,astro,html}`;
   - CSS-first config, `@theme` tokens, no PurgeCSS;
   - v3 → v4 notes.
3. **`rules/frontend/forms-validation.md`:**
   - tier P1; framework-neutral;
   - one schema per form, shared with the server where possible;
   - server-side re-validation is mandatory;
   - React Hook Form + Zod for new projects, Formik + Yup in existing ones (D4); per-framework notes for Vue, Angular and React Native;
   - accessibility of error messages.
4. **`rules/legacy/vue2-nuxt2.md`:** Vue 2, Nuxt 2 and Nuxt 3; EOL status; CVEs; safe maintenance; migration path.
5. **`skills/migrate-vue2/SKILL.md`** (the `@vue/compat` migration build, step by step) and **`skills/upgrade-nuxt/SKILL.md`** (Nuxt 3 → 4, with codemods if they exist; verify).

## Done when
All seven files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
