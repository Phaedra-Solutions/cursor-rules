---
id: legacy/supabase-legacy
title: Supabase on legacy API keys and import maps
description: Supabase projects still on the legacy JWT anon and service_role keys, the shared JWT secret, import_map.json or URL imports in Edge Functions, or the deprecated auth-helpers packages - what to check (secret-key exposure, pg_net and webhook headers, verify_jwt assumptions, Data API grants), the deprecation timeline and the migration path. Use when the project reads SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY, has supabase/functions/**/import_map.json, or imports @supabase/auth-helpers-*.
applies_to: "supabase >=1.0 <3"
globs: ["supabase/config.toml", "supabase/functions/**/import_map.json", "supabase/functions/**/*.ts", "supabase/migrations/**/*.sql", "**/.env.example"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://supabase.com/docs/guides/api/api-keys
  - https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
  - https://github.com/orgs/supabase/discussions/29260
  - https://supabase.com/changelog/45329
  - https://supabase.com/docs/guides/auth/signing-keys
  - https://supabase.com/docs/guides/functions/dependencies
  - https://supabase.com/docs/guides/functions/secrets
  - https://supabase.com/docs/guides/functions/auth
  - https://supabase.com/docs/guides/database/webhooks
  - https://supabase.com/docs/guides/database/vault
  - https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers
  - https://www.npmjs.com/package/@supabase/auth-helpers-nextjs
  - https://www.npmjs.com/package/@supabase/supabase-js
  - https://osv.dev/vulnerability/GHSA-8r88-6cj9-9fh5
---

# Supabase on legacy keys and import maps

Also apply `core/legacy-mode` and the Security sections of `data/supabase` (RLS, functions, Storage); they don't depend on the key type. Don't migrate keys as part of an unrelated task.

## Version check

- Detect the legacy setup and list what you found:
  - `anon` / `service_role` keys: JWT-shaped values (`eyJ…`), `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and similar;
  - Edge Functions: `import_map.json`, `https://esm.sh/…` or `https://deno.land/x/…` imports, `serve()` from `deno.land/std/http`;
  - auth: `@supabase/auth-helpers-*` (no longer supported on npm) or `supabase-js` 1.x (last release 1.35.7);
  - third-party services that verify Supabase JWTs with the shared JWT secret.

  ```text
  Applying legacy/supabase-legacy (legacy anon/service_role keys, 3 functions with import_map.json, supabase-js 2.49).
  ```

- **Timeline:**
  - Legacy keys are deprecated by the end of 2026; Supabase lists removal as "Late 2026, TBC". Treat every legacy key as something to migrate before then.
  - Projects restored since 1 Nov 2025 come back without legacy keys; restoring a paused legacy project can break its clients.
  - Since 30 Oct 2026, new `public` tables need explicit grants before the Data API exposes them (existing tables keep their grants).
- Once the project uses publishable and secret keys and per-function `deno.json`, use `data/supabase` only.

## Conventions

- Keep the project working on its current keys until the migration is planned; don't half-migrate one client.
- New code reads keys through one config module (`env.supabaseKey`), so the later swap is one change.
- New Edge Functions get their own `deno.json` with `npm:` imports even in a legacy project; `deno.json` takes precedence over `import_map.json` for that function. Use `Deno.serve`, not `serve` from `deno.land/std`.
- New auth code uses `@supabase/ssr`, not `@supabase/auth-helpers-*`. Don't add auth-helpers to new files.
- `supabase-js` 1.x: don't write v2 APIs against it; propose the upgrade.

## What to check

Report each finding with file and line:

- **`service_role` key in client code** (browser bundle, mobile app, desktop app, public repo, `NEXT_PUBLIC_*`/`VITE_*`/`EXPO_PUBLIC_*`). This is critical: the key bypasses RLS. Tell the user to rotate it immediately (`secrets-scan` skill); a JWT key can't be revoked alone, so plan the move to secret keys or a JWT secret rotation.
- **`service_role` in SQL**: `pg_net` calls, Database Webhooks, cron jobs or triggers with `Authorization: Bearer <service_role>` literals. Move the value to Vault now; the secret-key migration changes these to the `apikey` header.
- **`verify_jwt` assumptions:** the legacy `anon` key is a valid JWT, so `verify_jwt = true` lets any holder of the public anon key call the function. Functions that touch user data must check the user (`auth.getUser()` / `getClaims()` and `role = 'authenticated'`), not just rely on `verify_jwt`.
- **Shared JWT secret** used by another service to verify Supabase tokens: note it; the signing-keys migration replaces it with JWKS.
- **Tables relying on default grants:** list tables where `anon` has write grants it doesn't need, and tables with RLS off in exposed schemas.
- **Import maps and URL imports:** unpinned versions (`esm.sh/stripe` with no version) and mixed versions of one package across functions.

## Security

- Every rule in the Security sections of `data/supabase` applies: RLS on every exposed table, `(select auth.uid())`, `security definer` only in `private` with `search_path = ''`, private Storage buckets, webhook signature checks.
- Never paste a legacy key into a migration, seed, test fixture or documentation. `.env.example` holds placeholders only.
- Pin every URL import to an exact version while it still exists; prefer moving it to `npm:` in `deno.json`.

## Known vulnerabilities (as of 2026-10)

| Advisory or risk | Affected | Action |
|---|---|---|
| CVE-2025-48370: auth-js path routing from malformed input | `@supabase/auth-js` < 2.70.0 | Update `supabase-js` 2.x |
| Unsupported auth helpers | `@supabase/auth-helpers-*` | Move to `@supabase/ssr` |
| Leaked `service_role` JWT | Any legacy project | Can't be revoked individually; migrate to secret keys and deactivate legacy keys |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

Use the `upgrade-supabase` skill. Order:

1. Create publishable and secret keys (legacy keys keep working alongside).
2. Swap the publishable key into clients; ship mobile app updates early, since old builds keep the anon key until users update.
3. Swap secret keys into servers, workers and Edge Functions (`SUPABASE_SECRET_KEYS`), and change `pg_net`/webhook headers to `apikey` read from Vault.
4. Move each Edge Function to its own `deno.json` with `npm:` imports.
5. Run the Security Advisor and fix its findings; add explicit grants.
6. Deactivate the legacy keys once nothing uses them (they can be re-activated).
7. Optionally move to JWT signing keys.

## Testing

- Before changing keys, add a smoke test per client type (web, mobile, server, each Edge Function, each webhook and cron job) that proves it can read and write what it should and nothing more.
- Test that each Edge Function rejects a call made with only the public key when it should require a signed-in user.

## Before you finish

```sh
supabase db advisors --type security --fail-on warn
supabase test db                       # if pgTAP tests exist
git grep -nE "SUPABASE_SERVICE_ROLE_KEY|service_role|eyJhbGciOi" -- ':!*.md'
git ls-files 'supabase/functions/**/import_map.json' 'supabase/functions/import_map.json'
npm ls @supabase/supabase-js @supabase/auth-js
npm audit --audit-level=moderate
```
