# Prompt 11: TypeScript, React, React + Vite

> Self-contained; safe in a fresh session. Roadmap: Phase 2, §6 (Languages, Frontend), §7.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it. D4 sets the house defaults.
2. Read the `ROADMAP.md` §7 entries `languages/typescript`, `frontend/react` and `frontend/react-vite-spa`, plus §5.8 (React rows).
3. Use the root `react-typescript-rules.md` as source material if it still has content.
4. Research the latest TypeScript, React, React Compiler and Vite versions, their breaking changes and React/Vite CVEs.

## Task
1. **`rules/languages/typescript.md`:**
   - tier P0; globs `**/*.ts`, `**/*.tsx`, `**/*.mts`, `**/*.cts`;
   - strictness settings; no `any`;
   - Standard Schema validation at every boundary;
   - ESM; TS 7 native-compiler compatibility checks.
2. **`rules/frontend/react.md`:**
   - tier P0; globs `**/*.tsx`, `**/*.jsx`; `legacy_rule: legacy/react-class-cra`;
   - React 19.x APIs; memoization guidance with React Compiler;
   - no prop-types; effects only for syncing with external systems;
   - XSS-safe patterns; RSC package minimums;
   - testing guidance per D4.
3. **`rules/frontend/react-vite-spa.md`:**
   - tier P0; globs `vite.config.*`, `src/**/*.{ts,tsx}`, `index.html`;
   - Vite 8 / Rolldown notes; `VITE_*` values are public;
   - dev-server exposure risk;
   - routing, data fetching and state per D4;
   - folder structure, kept from the old file where it's still good (feature folders, central API module, toast error handling, i18n only if already present).
4. **House-only conventions** from the old file go into `conventions/phaedra.md` under a "React" heading. Create the file if it's missing. Examples: a specific toast helper name, the Redux slice layout for existing projects.

## Done when
The three rules follow shared context §4, the lint script passes if it exists, and you've completed the shared-context workflow.
