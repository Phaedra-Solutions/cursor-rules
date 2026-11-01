# Prompt 16: Supabase and Postgres (+ upgrade skill)

> Self-contained; safe in a fresh session. Roadmap: Phase 2, §7 (`data/supabase`, `data/postgres`), §12 (D4, Postgres naming).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §7 entries `data/supabase` and `data/postgres`.
3. Use the root `supabase-rules.md` (or `supabase-rules`) as source material.
4. Research:
   - the Supabase API keys docs (publishable and secret keys, the legacy-key deprecation date);
   - RLS performance guidance (`(select auth.uid())`, indexes);
   - `security_invoker` views; the Security Advisor and database linter;
   - Edge Function dependencies (`deno.json`, `npm:`); `supabase secrets`; pgTAP testing;
   - Supabase-related CVEs and incidents.

## Task
1. **`rules/data/supabase.md`:**
   - tier P0; globs `supabase/**`, `**/*.sql`, `supabase/functions/**/*.ts`;
   - `legacy_rule: legacy/supabase-legacy`;
   - cover the §7 entry, including the Stripe webhook guidance from the old file (verify signatures; idempotent handlers);
   - include a ✓ migration example: a table with RLS enabled, per-command policies, an index, and an `updated_at` trigger.
2. **`rules/data/postgres.md`:**
   - tier P1; globs `**/*.sql`, `migrations/**`, `prisma/schema.prisma`, `drizzle/**`;
   - migrations, constraints, indexes, `timestamptz`, roles, parameterized queries;
   - naming per D4.
3. **`rules/legacy/supabase-legacy.md`:**
   - projects on the legacy `anon`/`service_role` keys and import maps;
   - what to check; the deprecation timeline; migration path.
4. **`skills/upgrade-supabase/SKILL.md`:**
   - migrate to publishable and secret keys (rotation order, env updates, testing);
   - move Edge Functions to per-function `deno.json`;
   - run the Security Advisor and fix its findings.

## Done when
All four files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
