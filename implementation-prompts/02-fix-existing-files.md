# Prompt 02: Fix the existing root rule files and README

> Self-contained; safe in a fresh session. Roadmap: Phase 0, §2, §7.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §2 (the defect table), then the §7 entries for core/behavior, nextjs, react-native-expo, nestjs, supabase and cypress.
3. These root files stay in place for existing users until the release prompt replaces them with stubs. Make **minimal, correct** fixes; don't rewrite them. Line numbers in ROADMAP §2 may have shifted, so find the text. If a file is already a stub pointing into `rules/`, skip it.

## Task
1. **`supabase-rules` → `supabase-rules.md`** (`git mv`). Then:
   - replace "service role policies" with a note that the secret/service key bypasses RLS and must never reach clients;
   - `SECURITY DEFINER` only with `set search_path = ''` and schema-qualified names;
   - per-function `deno.json` with `npm:` specifiers instead of `import_map.json` and esm.sh;
   - add a line on the new publishable/secret keys, since legacy `anon`/`service_role` are deprecated by end of 2026 (verify the date).
2. **`react-native-rules.md`:**
   - Expo Router's `app/` may contain only routes and `_layout` files. Move the guidance for screen `styles.ts`/`types.ts` to `src/features/<screen>/` or `components/`.
   - Make the `apis` example consistent (define and call the same function name).
   - Add a top note that RN 0.82+ is New Architecture only and that a full rewrite is coming.
3. **`nestjs-rules.md`:**
   - the queue processor must rethrow so Bull or BullMQ retries;
   - make the controller and service examples use the same method names and arguments;
   - camelCase DTO properties;
   - replace every client-specific package scope and service name with generic ones (`@app/common`, generic service names);
   - a note that BullMQ replaces Bull.
4. **`cypress-testing-rules.md`:**
   - register `cy.intercept()` before the action that triggers the request;
   - set frontmatter `alwaysApply: false` with `globs: cypress/**, **/*.cy.{ts,tsx,js}`;
   - select by `data-testid` (consistent with the global rules).
5. **`next-rules.md`:**
   - resolve the Zustand-vs-Redux contradiction per D4;
   - replace prop-types with TypeScript props;
   - note that Formik/React Hook Form need client components, and keep `'use client'` at leaf form components;
   - remove the dangling "Code Implementation Guidelines" reference;
   - remove PurgeCSS (Tailwind 4 detects content automatically);
   - add two lines: `proxy.ts` replaces `middleware.ts` in Next 16, and every Server Action must authenticate, authorize and validate input.
6. **`react-typescript-rules.md`:**
   - memoization: with React Compiler enabled, don't add `useMemo`/`useCallback` by default;
   - make it clear this file is for Vite single-page apps, and that Next.js projects use `next-rules.md`.
7. **`global-rules.md`:** replace "remove comments without asking" with "don't add explanatory comments; don't remove existing comments outside the lines you change". Keep everything else.
8. **`angular-rules.md`:**
   - add a top note that it targets Angular 15 (end of life) and that an Angular 22 rule is coming;
   - fix the section numbering gap (§16).
9. **`README.md`** (keep the intro):
   - list all 8 rule files;
   - add **Install**:
     - Cursor project rules must be `.mdc` files in `.cursor/rules/`;
     - copy and rename them, or paste `global-rules.md` into Cursor User Rules;
     - other tools can use the content in `AGENTS.md`;
   - add **Works with** (Cursor; AGENTS.md tools such as Codex, Copilot, Claude Code and Gemini CLI);
   - add a "keep Cursor updated" note (2026 Cursor CVEs, see ROADMAP §5.3);
   - add a link to `ROADMAP.md`;
   - if a `LICENSE` file exists, add the license line.

## Done when
Every fix above is applied and the old files read cleanly, and you've completed the shared-context workflow.
