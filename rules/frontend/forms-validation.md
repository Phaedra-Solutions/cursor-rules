---
id: frontend/forms-validation
title: Forms and validation
description: Framework-neutral form and validation rules - one Standard Schema per form shared with the server where possible, mandatory server-side re-validation, React Hook Form + Zod for new React, Next.js and React Native code and Formik + Yup kept where they exist, Vue (VeeValidate) and Angular (Signal Forms) notes, submission states, error mapping from the server, and accessible error messages. Use when building or editing forms and validation schemas.
applies_to: "any"
globs: ["**/*{form,Form,schema,Schema,validation}*.{ts,tsx,js,jsx,vue}", "**/schemas/**", "**/forms/**"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://standardschema.dev/
  - https://zod.dev/v4
  - https://valibot.dev/
  - https://react-hook-form.com/get-started
  - https://github.com/react-hook-form/resolvers
  - https://formik.org/
  - https://github.com/jquense/yup
  - https://vee-validate.logaretm.com/v4/
  - https://github.com/logaretm/vee-validate/blob/main/packages/vee-validate/CHANGELOG.md
  - https://angular.dev/guide/forms/signals/overview
  - https://www.w3.org/WAI/tutorials/forms/notifications/
  - https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
  - https://osv.dev/vulnerability/GHSA-mrhx-c7xc-m3w5
---

# Forms and validation

Framework rules (`frontend/react`, `frontend/nextjs`, `frontend/vue`, `frontend/angular`, `mobile/react-native-expo`) add their specifics; house defaults are in `conventions/phaedra`.

## Version check

- Find the form library and validator in the lockfile and state them:

  ```text
  Applying frontend/forms-validation (react-hook-form 7.91, @hookform/resolvers 6.0, zod 4.6, from package-lock.json).
  ```

- Defaults for **new** code: React, Next.js and React Native → React Hook Form + Zod via `standardSchemaResolver` (`@hookform/resolvers/standard-schema`); Vue → a small composable around the schema's Standard Schema `validate`, or VeeValidate where the project uses it; Angular → Signal Forms (v21+, stable on v22; see `frontend/angular`). Any Standard Schema library is fine (Zod by default; Valibot or ArkType where the project uses them).
- **Existing projects:** keep the library they use. Formik + Yup stays Formik + Yup; don't mix two form libraries in one project, and don't migrate as part of another change.
- Zod 4 is current (4.6.7); write Zod 3 syntax in Zod 3 projects (`z.string().email()` vs Zod 4's `z.email()`), and use Zod ≥ 4.6.6 (oversized-collection DoS fix).

## Conventions

- **One schema per form**, in its own module (`schemas/create-order.ts`), and infer the TypeScript type from it (`type CreateOrder = z.infer<typeof createOrderSchema>`). Don't hand-write a parallel interface.
- **Share the schema with the server** when client and server are in the same repo or a shared package (Next.js Server Actions, Nuxt server routes, tRPC, a monorepo package). The server imports the same schema; the client never has rules the server lacks.
- **Server-side re-validation is mandatory.** Client validation is UX only: every endpoint, Server Action or route validates the full input again and rejects unknown fields, whatever the client did.
- Coerce types deliberately (`z.coerce.number()` for numeric inputs, trimming strings) and set limits (`max` lengths, numeric ranges, array sizes) in the schema.
- Default values for every field (`defaultValues` in React Hook Form, `initialValues` in Formik); controlled components only where needed (`Controller` for custom inputs).
- Submission: disable the submit control while pending, prevent double submits, show success and failure, and keep entered values on failure.
- Map server errors back to fields (`setError('email', { message })` / `setFieldError`) and show non-field errors in a form-level message. Show generic text for unexpected errors; never display raw server messages.
- Validate on submit first, then on change or blur for fields that already have errors (React Hook Form `mode: 'onSubmit'`, `reValidateMode: 'onChange'`), so users aren't shouted at while typing.

### Per framework

- **React / Next.js:** `useForm({ resolver: standardSchemaResolver(schema), defaultValues })`; in Next.js App Router forms, validate again in the Server Action with the same schema and return field errors through `useActionState`. Mark form leaf components `'use client'`.
- **React Native:** React Hook Form `Controller` around `TextInput`; set `keyboardType`, `autoComplete`, `textContentType` and `secureTextEntry` correctly; keep the submit button visible above the keyboard.
- **Vue / Nuxt:** VeeValidate 4 `useForm({ validationSchema: toTypedSchema(schema) })` with `@vee-validate/zod` supports Zod 3 only (Standard Schema support lands in the next VeeValidate major); with Zod 4, Valibot or ArkType, use a small composable that calls `schema['~standard'].validate()`. Validate again in Nuxt server routes with `readValidatedBody`.
- **Angular:** Signal Forms with `validateStandardSchema()` on v22; Reactive Forms with typed `FormGroup` on older versions.

## Accessibility

- Every input has a visible `<label>` (or `aria-label` when visually hidden by design); don't use placeholders as labels.
- Link errors to inputs: `aria-invalid="true"` on the field and `aria-describedby` pointing at the error text; give the error an `id`.
- On submit failure, move focus to the first invalid field or an error summary; announce form-level errors with `role="alert"` (or an `aria-live="polite"` region).
- Describe errors in text that says how to fix them ("Enter an email like name@example.com"), not just color or an icon.
- Mark required fields in the label and with `required`/`aria-required`; group related controls with `fieldset` and `legend`.
- Add `data-testid` to inputs, buttons and error messages on house projects.

## Security

- Never trust hidden fields, disabled inputs, client-computed totals or role selectors; the server derives them.
- Validate file inputs on the server (type by content, size, count); client `accept` attributes are hints.
- Don't log full form payloads with passwords, tokens or personal data; redact before logging or sending to analytics.
- Use `autocomplete` values (`current-password`, `new-password`, `one-time-code`) so password managers work; never disable paste on password fields.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2023-54404: memory exhaustion validating oversized constrained collections | zod | 4.6.6 |

No current OSV advisories for `react-hook-form`, `formik`, `yup` or `vee-validate`. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Unit-test schemas directly: valid input passes, each rule fails with the expected message, unknown fields are stripped or rejected.
- Component tests: submit with empty and invalid values and assert the accessible error text (`getByRole('alert')`, `toHaveAccessibleDescription`), focus moves to the first error, and the submit button is disabled while pending.
- Server tests: the endpoint rejects input that bypasses the client (missing, extra or malformed fields).

## Before you finish

```sh
npx tsc --noEmit
npm test
npm audit --audit-level=moderate
npm ls zod react-hook-form @hookform/resolvers formik yup 2>/dev/null
```
