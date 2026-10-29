# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- MIT `LICENSE`, `NOTICE.md` with Project CodeGuard (CC BY 4.0) attribution, `SECURITY.md` and `CONTRIBUTING.md`.
- `.github/CODEOWNERS` with placeholder owners and stricter entries for security-sensitive paths.
- `.github/PULL_REQUEST_TEMPLATE.md` with sources, version range, lint/build and eval checklist.
- `docs/decisions.md` recording decisions D1–D8.
- `conventions/phaedra.md` house-style overlay.
- Folder skeleton for `rules/`, `skills/`, `presets/`, `security/`, `templates/ci/`, `evals/` and `scripts/`.
- `ROADMAP.md` and `implementation-prompts/`.
- `.gitignore` for `dist/` and `node_modules/`.

### Changed

- `README.md` notes that the project is being restructured.
- `README.md` lists all 8 rule files and adds Install, Works with, Keep Cursor updated (3.1.2 or later), Roadmap and License sections.
- Rename `supabase-rules` to `supabase-rules.md`.
- `next-rules.md`: state follows the project (Redux Toolkit where present, otherwise Zustand; TanStack Query for server state); forms follow the project (Formik + Yup where present, otherwise React Hook Form + Zod) with `'use client'` on leaf form components; TypeScript props replace prop-types; add `proxy.ts` and Server Action security lines.
- `react-typescript-rules.md`: scope to Vite single-page apps; no default `useMemo`/`useCallback` with React Compiler.
- `react-native-rules.md`: add a New Architecture note (RN 0.82+); keep Expo Router `app/` to routes and layouts, with screens in `src/features/<screen>/`.
- `angular-rules.md`: add an Angular 15 end-of-life note.
- `nestjs-rules.md`: replace client-specific package scope, service and helper names with generic ones (`@app/common`); add a BullMQ note.
- `cypress-testing-rules.md`: scope with globs (`alwaysApply: false`) and select by `data-testid`.

### Fixed

- `cypress-testing-rules.md`: register `cy.intercept()` before the triggering action.
- `nestjs-rules.md`: queue processor rethrows so retries happen; controller and service examples use the same method names and arguments; DTO property is camelCase.
- `react-native-rules.md`: the `apis` example defines and calls the same function.
- `next-rules.md`: remove the dangling "Code Implementation Guidelines" reference and the PurgeCSS advice.
- `angular-rules.md`: fix the section numbering gap.
- `global-rules.md`: the comment rule no longer contradicts "change only what's asked".

### Security

- `supabase-rules.md`: the secret/service key bypasses RLS and must never reach clients (replaces "service role policies"); `SECURITY DEFINER` only with `set search_path = ''` and schema-qualified names; per-function `deno.json` with `npm:` specifiers instead of `import_map.json` and esm.sh; use the publishable/secret keys, since legacy `anon`/`service_role` keys are deprecated by the end of 2026.
- `next-rules.md`: every Server Action authenticates, authorizes and validates input.
