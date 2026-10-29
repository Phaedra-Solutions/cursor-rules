# Prompt 12: Next.js (+ Pages Router legacy, upgrade skill)

> Self-contained; safe in a fresh session. Roadmap: Phase 2, §7 (`frontend/nextjs`), §5.8.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §7 entry `frontend/nextjs` and the Next.js and React rows of §5.8.
3. Use the root `next-rules.md` as source material if it still has content.
4. Research:
   - the latest Next.js version and its security releases (https://nextjs.org/blog);
   - the Next.js upgrade guides and codemods;
   - the current `proxy.ts`, Cache Components and Server Actions docs;
   - the Next.js security guide.

## Task
1. **`rules/frontend/nextjs.md`:**
   - tier P0; globs `app/**/*.{ts,tsx}`, `proxy.ts`, `middleware.ts`, `next.config.*`;
   - `legacy_rule: legacy/nextjs-pages-router`;
   - cover everything in the §7 entry;
   - include a short ✓/✗ Server Action example that authenticates, authorizes the resource, validates with Zod, then mutates.
2. **`rules/legacy/nextjs-pages-router.md`:**
   - covers Next ≤ 15 and Pages Router projects;
   - `getServerSideProps` and API route security, CVE-2025-29927, and the patch lines still receiving fixes (verify the 15.5.x status);
   - migration path to the App Router.
3. **`skills/upgrade-nextjs/SKILL.md`:**
   - one major at a time with the official codemod;
   - rename `middleware.ts` to `proxy.ts`; move to async request APIs; replace `next lint`; update `images` config;
   - verify with build, tests and a smoke test;
   - never upgrade React and Next.js across mismatched majors.

## Done when
All three files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
