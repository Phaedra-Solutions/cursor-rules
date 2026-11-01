---
id: data/supabase
title: Supabase
description: Supabase conventions and security - publishable and secret API keys, explicit Data API grants, Row Level Security (one policy per command, (select auth.uid()), indexed policy columns, security_invoker views), SECURITY DEFINER rules, Storage policies, Edge Functions with per-function deno.json and npm specifiers, caller authentication, CORS, secrets, Stripe webhooks, pgTAP tests and the Security Advisor. Use when editing supabase/ migrations, SQL, Edge Functions or Supabase client code.
applies_to: "supabase >=2.0 <3"
legacy_rule: legacy/supabase-legacy
globs: ["supabase/**", "**/*.sql", "supabase/functions/**/*.ts"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://supabase.com/docs/guides/api/api-keys
  - https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
  - https://supabase.com/changelog/45329
  - https://github.com/orgs/supabase/discussions/45329
  - https://supabase.com/docs/guides/database/postgres/row-level-security
  - https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
  - https://supabase.com/docs/guides/database/functions
  - https://supabase.com/docs/guides/database/hardening-data-api
  - https://supabase.com/docs/guides/database/database-advisors
  - https://supabase.com/docs/guides/storage/security/access-control
  - https://supabase.com/docs/guides/realtime/authorization
  - https://supabase.com/docs/guides/auth/server-side/creating-a-client
  - https://supabase.com/docs/guides/auth/signing-keys
  - https://supabase.com/docs/guides/functions/dependencies
  - https://supabase.com/docs/guides/functions/secrets
  - https://supabase.com/docs/guides/functions/auth
  - https://supabase.com/docs/guides/functions/cors
  - https://supabase.com/docs/guides/database/vault
  - https://supabase.com/docs/guides/local-development/testing/overview
  - https://supabase.com/docs/guides/deployment/database-migrations
  - https://supabase.com/docs/guides/getting-started/mcp
  - https://supabase.com/docs/reference/cli/introduction
  - https://www.postgresql.org/support/security/
  - https://docs.stripe.com/webhooks
  - https://docs.stripe.com/webhooks/signature
  - https://docs.stripe.com/api/idempotent_requests
  - https://www.npmjs.com/package/@supabase/server
  - https://osv.dev/vulnerability/GHSA-8r88-6cj9-9fh5
  - https://techcrunch.com/2026/09/25/some-supabase-customers-are-publicly-exposing-reams-of-peoples-data-to-the-web/
---

# Supabase

Also apply `data/postgres` for schema design and `core/security-baseline`. This rule adds Supabase specifics.

## Version check

- Read the CLI version (`supabase --version`, or `supabase` in `package.json`), `@supabase/supabase-js`, `@supabase/ssr` and `@supabase/server` from the lockfile, and the Postgres major from `supabase/config.toml` (`[db] major_version`). State the rule you're applying:

  ```text
  Applying data/supabase (CLI 2.122, supabase-js 2.118, Postgres 17, publishable/secret keys).
  ```

- Find which keys the project uses: `sb_publishable_…`/`sb_secret_…`, `SUPABASE_PUBLISHABLE_KEYS`/`SUPABASE_SECRET_KEYS` → this rule. JWT-shaped `anon`/`service_role` keys (`eyJ…`), `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or an `import_map.json` under `supabase/functions/` → also apply `legacy/supabase-legacy` and offer the `upgrade-supabase` skill.
- Legacy keys are deprecated by the end of 2026 (removal date not yet announced). Projects restored since 1 Nov 2025 come back without them.
- `@supabase/auth-js` (bundled by `supabase-js`) must be ≥ 2.70.0 (CVE-2025-48370). Check with `npm ls @supabase/auth-js`.
- `security_invoker` views need Postgres 15+.

## Conventions

### Layout

```text
supabase/
├── config.toml
├── migrations/<timestamp>_<name>.sql     # created with `supabase migration new <name>`
├── seed.sql                              # local and preview data only
├── tests/database/*.test.sql             # pgTAP
└── functions/
    ├── _shared/                          # cors.ts, clients, validation helpers
    └── create-checkout/                  # kebab-case, one folder per function
        ├── index.ts
        └── deno.json
```

- Every schema change is a migration in `supabase/migrations/`. Never change the hosted schema in the Dashboard without capturing it (`supabase db diff -f <name>`), and never edit a migration that has already run anywhere.
- Apply locally with `supabase db reset`; deploy with `supabase db push` from CI, not from a laptop.
- Generate types after schema changes: `supabase gen types typescript --local > src/types/database.ts`, and type clients with them.
- Naming: snake_case for new tables and columns. Keep an existing schema's quoted camelCase (`"userId"`) consistently; don't mix (see `conventions/phaedra`).

### Example migration ✓

```sql
create schema if not exists private;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;
grant select, insert, update, delete on table public.notes to authenticated;
create index notes_user_id_idx on public.notes (user_id);

create policy notes_select_own on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy notes_insert_own on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy notes_update_own on public.notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy notes_delete_own on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function private.set_updated_at();
```

### Clients

- Browser, mobile, desktop and CLI code: the publishable key only. Server code (API routes, Server Actions, workers, Edge Functions): the secret key, read from server-only environment variables.
- SSR frameworks: `@supabase/ssr` (`createBrowserClient`, `createServerClient` with the framework's cookie API).
- On the server, authenticate with `supabase.auth.getClaims()` (verifies the JWT) or `getUser()`. Never trust `getSession()` on the server; it reads unverified cookie data.
- Keep one admin (secret-key) client in a server-only module. Never import it into code that ships to the browser.

## Security

### Keys and the Data API

- The secret key (and legacy `service_role`) authorizes as `service_role`, which has `BYPASSRLS`. Writing "service role policies" does nothing; protect the key instead. Never put it in client code, `NEXT_PUBLIC_*`/`VITE_*`/`EXPO_PUBLIC_*` variables, mobile apps, logs or SQL.
- Create one secret key per backend service (named keys), so each can be rotated alone.
- **Grants:** since 30 Oct 2026, new `public` tables aren't exposed to the Data and GraphQL APIs until you grant them. Grant only what each role needs, in the same migration as the table and its RLS (`grant select … to anon` only for public data). Never fix error 42501 with `grant all … to anon, authenticated`.
- Keep tables that clients never read in a schema that isn't exposed (`private`), with no grants to `anon`/`authenticated`.

### Row Level Security

- Enable RLS on every table in an exposed schema, in the migration that creates it. A table with RLS enabled and no policy denies everything; that's the safe default for server-only tables.
- One policy per command (`select`, `insert`, `update`, `delete`) with `to authenticated` (or `anon`). `insert` needs `with check`; `update` needs `using` and `with check`, plus a `select` policy.
- Write `(select auth.uid())` and `(select auth.jwt())`, not bare calls, so Postgres evaluates them once per statement. Index every column a policy filters on.
- Never base policies on `raw_user_meta_data` / `user_metadata` (users can edit it). Use `app_metadata`, or a roles or membership table read through a `SECURITY DEFINER` helper.
- Avoid joins inside policies. For membership checks, call a `private` helper (`private.is_team_member(team_id)`) or use `team_id in (select …)` against an indexed table.
- Don't add `using (true)` to anything but deliberately public reads, and say so in the PR.
- Views: `create view … with (security_invoker = true)`. Materialized and foreign tables can't enforce RLS; keep them out of exposed schemas.
- Anonymous sign-ins use the `authenticated` role. If they're enabled, check `(select auth.jwt() ->> 'is_anonymous')::boolean` in policies that need a permanent account.

### Functions

- Default to `security invoker` (the default). Use `security definer` only when the function must read data the caller can't, and then:
  - create it in `private`, never in an exposed schema;
  - set `search_path = ''` and schema-qualify every name (`public.notes`, `auth.uid()`);
  - `revoke execute on function … from public, anon, authenticated;` then grant to the role that needs it.
- Validate arguments inside RPC functions; they're public endpoints for every role with `execute`.
- Read secrets in SQL from Vault (`vault.decrypted_secrets`), never from literals in migrations, triggers, cron jobs or `pg_net` calls.

### Storage and Realtime

- Buckets are private by default; make one public only for truly public assets, and disable listing. Set `file_size_limit` and `allowed_mime_types` on each bucket.
- Write `storage.objects` policies per command, scoped by `bucket_id` and owner folder: `(storage.foldername(name))[1] = (select auth.uid())::text`. Serve private files through short-lived signed URLs.
- Realtime `postgres_changes` follows table RLS. Broadcast and Presence: use private channels with RLS policies on `realtime.messages`.

### Edge Functions

- One `deno.json` per function with `npm:` (or `jsr:`) imports at pinned versions; commit `deno.lock`. No `import_map.json`, no `esm.sh` or `deno.land/x` URLs in new code.
- Authenticate every caller:
  - user calls: keep `verify_jwt = true` and use `withSupabase({ auth: 'user' }, …)` from `npm:@supabase/server@1` (or `getClaims()`), then query with the user-scoped client so RLS applies;
  - server-to-server calls: `withSupabase({ auth: 'secret' }, …)` and the `apikey` header; `verify_jwt` alone doesn't authenticate a caller that sends only an API key;
  - third-party webhooks: `verify_jwt = false` in `config.toml` for that function only, plus the provider's signature check.
- CORS: answer `OPTIONS`, and return an explicit origin allowlist from `_shared/cors.ts`. Use `*` only for public, credential-free endpoints.
- Validate the request body with a schema (`npm:zod`) before use. Return generic error messages; log details without secrets or tokens.
- Secrets: `supabase secrets set NAME=value` (or `--env-file`) for production; `supabase/functions/.env` locally, git-ignored. Names can't start with `SUPABASE_`.

### Stripe webhooks

- Read the raw body with `await req.text()` and verify before parsing:

  ```ts
  const event = await stripe.webhooks.constructEventAsync(
    body, req.headers.get('stripe-signature') ?? '', webhookSecret,
    undefined, Stripe.createSubtleCryptoProvider(),
  );
  ```

- Return 400 on a bad signature and 2xx quickly on success; move slow work to a queue.
- Make handlers idempotent: insert `event.id` into a table with a unique constraint first and skip duplicates. Stripe retries and can deliver events out of order, so re-fetch the object from Stripe when state matters.
- Grant access only from webhook-confirmed state, never from a client redirect. Pass `idempotencyKey` when creating Stripe objects from your server.

### AI tools

- Connect the Supabase MCP server only to development projects, scoped to one project and read-only where possible (see `core/agent-safety`). Never give an agent a production secret key.

## Known vulnerabilities (as of 2026-10)

| Advisory or incident | Affected | Action |
|---|---|---|
| CVE-2025-48370: auth-js path routing from malformed user input | `@supabase/auth-js` < 2.70.0 | Update `supabase-js` so auth-js ≥ 2.70.0 |
| UpGuard (Sep 2026): 16,326 projects with publicly readable tables, mostly RLS off | Misconfigured projects | RLS on every exposed table; run the Security Advisor |
| Data API grants change (30 Oct 2026) | All projects; new `public` tables | Grant per role explicitly; never `grant all` to `anon` |
| PostgreSQL Aug 2026 release (28 CVEs, several CVSS 8.8 code execution) | Postgres < 18.6 / 17.11 / 16.15 / 15.19 | Hosted: apply the Dashboard upgrade; self-hosted: update images |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Write pgTAP tests in `supabase/tests/database/` and run `supabase test db`. For each table: RLS is enabled (check `pg_class.relrowsecurity`), the owner can read and write, another user can't, and `anon` gets nothing unless intended. Switch users inside the test transaction with `set local role authenticated` and `select set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true)`.
- Test `security definer` functions as `anon` and `authenticated` to prove `execute` is revoked where intended.
- Test Edge Functions locally (`supabase functions serve`): missing or invalid JWT returns 401, a bad webhook signature returns 400, and a replayed event is processed once.

## Before you finish

```sh
supabase db reset                       # migrations apply cleanly from zero
supabase test db
supabase db advisors --type security --fail-on warn   # Security Advisor (local by default; --linked for the project)
supabase db lint --fail-on error        # plpgsql_check on functions
supabase gen types typescript --local > src/types/database.ts
deno check supabase/functions/*/index.ts
npm audit --audit-level=moderate
git grep -nE "sb_secret_|service_role|SUPABASE_SERVICE_ROLE_KEY" -- ':!supabase/functions' ':!*.md'   # no secret keys in client code
```
