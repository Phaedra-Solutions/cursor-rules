---
id: conventions/phaedra
title: Phaedra house conventions
description: Optional Phaedra Solutions house-style overlay (forms, state, file layout, test IDs, comments, formatting). Use on Phaedra projects on top of the generic rules.
applies_to: "any"
globs: []
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://react-hook-form.com/
  - https://github.com/react-hook-form/resolvers
  - https://standardschema.dev/
  - https://zod.dev/
  - https://valibot.dev/
  - https://arktype.io/
  - https://formik.org/
  - https://github.com/jquense/yup
  - https://angular.dev/guide/forms/signals/overview
  - https://tanstack.com/query/latest
  - https://zustand.docs.pmnd.rs/
  - https://redux-toolkit.js.org/
  - https://prettier.io/docs/options
  - https://testing-library.com/docs/queries/about/#priority
---

# Phaedra house conventions

This overlay sits on top of the generic rules. When it conflicts with a generic rule, this overlay wins. When it conflicts with a framework requirement or with the project's own established pattern, the framework or project wins.

## Working style

- Answer with code, not overviews. Keep explanations short unless the user asks for one.
- Do only what was asked. Don't refactor, rename or reformat code outside the requested change.
- When asked to read docs or references, read them and wait for instructions before writing code.
- Work in small steps. Change one coherent piece at a time and keep each diff reviewable.
- When editing code the user provided, show only the changed lines with a little surrounding context, not the whole file.
- Before writing new code, scan the codebase and match its existing patterns.
- Watch for edge cases in the code you produce.

## Files and folders

- Use kebab-case for every new file and folder: `user-profile.ts`, `create-team-modal/`.
- Split code into focused files and folders; don't pile unrelated code into one file.
- Where the framework doesn't dictate the file layout, put each component in its own folder:

```text
user-card/
├── index.tsx   # component, default export
├── styles.ts   # styles (React Native, or CSS-in-JS)
└── types.ts    # component-only types (optional)
```

- Framework-required files keep the framework's export shape: Next.js route files (`page.tsx`, `layout.tsx`, `route.ts`), Expo Router screens and layouts.
- Put types shared across components in a shared `types/` folder; keep component-only types in the component's `types.ts`.

## Formatting and comments

- Follow the project's Prettier, ESLint or Biome config. With no config, use Prettier defaults.
- Don't add explanatory comments to code.
- Don't remove existing comments outside the lines you change.

## Forms and validation

- New React, Next.js or React Native forms: React Hook Form + Zod, wired with `standardSchemaResolver` from `@hookform/resolvers/standard-schema`.
- Any Standard Schema library is fine for validation: Zod by default, Valibot or ArkType when the project already uses them.
- Projects that already use Formik + Yup: keep Formik + Yup. Don't mix form libraries in one project.
- Angular: use Signal Forms for new forms; keep the project's existing forms approach elsewhere.

## State

- Server state: TanStack Query.
- Client state in new projects: Zustand.
- Projects that already use Redux Toolkit: keep Redux Toolkit.
- Keep component-local state in the component.

## Data

- New Postgres schemas: snake_case table and column names.
- Existing schemas with quoted camelCase identifiers: keep their naming; don't mix styles in one schema.

## Test IDs

- Add `data-testid` (React Native: `testID`) to every interactive element and to elements shown or hidden by logic: inputs, buttons, links, toggles, modals, error messages.
- Use kebab-case IDs scoped by feature: `login-email-input`, `login-submit-button`.
- Unit and component tests query by role or label first; use test IDs only when no accessible query fits.
- E2E tests (Cypress, Playwright) select by test ID.

## Before you finish

- Run the project's lint, typecheck and test scripts on the changed files.
- Confirm every new file and folder is kebab-case and every new interactive element has a test ID.
