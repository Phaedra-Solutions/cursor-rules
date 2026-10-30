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
- `rules/core/behavior.md`: always-on working rules (scoped changes, small steps, existing patterns, one-line security findings, rule and version disclosure).
- `rules/core/security-baseline.md`: always-on secure coding rules grouped by OWASP Top 10:2025 with 2025 CWE Top 25 IDs, partly adapted from Project CodeGuard.
- `README.md` catalog table.
- `rules/core/supply-chain.md`: always-on dependency, lockfile, release-age cooldown (npm, pnpm, Yarn, Bun, uv), install-script, CI hardening, publishing, SBOM and suspected-compromise rules.
- `rules/core/agent-safety.md`: always-on rules for prompt injection, secrets, risky commands, tool config files, MCP servers and keeping the coding tool updated (2026 Cursor advisories).
- `rules/core/legacy-mode.md`: on-demand rules for working on versions below a rule's range or past end of life.
- `skills/security-audit`: detect the stack, run the audit toolbox, triage by severity, reachability, CISA KEV and EPSS, and write `security-report.md`; includes `scripts/detect-stack.sh`.
- `skills/dependency-vet`: pre-install checks (existence, typosquats, malware, age, maintainers, downloads, scripts, license, provenance) with registry queries for npm, PyPI, crates.io, Packagist, RubyGems, NuGet, Maven Central and pub.dev.
- `skills/cve-check`: `package@version` lookups through OSV, the GitHub Advisory Database, vendor pages, CISA KEV and EPSS.
- `skills/secrets-scan`: gitleaks scans of staged changes, the working tree, ranges and history, with revoke-first rotation and consent-only history rewrites.
- `skills/threat-model-lite`: 10-minute STRIDE pass producing abuse cases, controls mapped to OWASP Top 10:2025, and tests.
- `skills/incident-supply-chain`: response steps for compromised dependencies, including token-monitor wipers, persistence hunting, rotation order, reporting and a timeline; indicators from Shai-Hulud through Miasma.
- `skills/git-commit`: the team's dash-list commit flow with approval and a staged-files secret scan.
- `scripts/lint-rules.mjs` (Node ≥ 22, no dependencies): validates rule, convention and skill frontmatter, required headings, size, `alwaysApply` scope and cross-references; scans every tracked text file for hidden Unicode; `--network` checks packages in install commands; `--json` output.
- `scripts/lint-rules.test.mjs` with fixtures in `scripts/fixtures/`.
- `.github/workflows/lint.yml`: lint script, its tests, markdownlint and lychee, with SHA-pinned actions and read-only permissions.
- `.markdownlint.jsonc` and `lychee.toml`.
- `.DS_Store` in `.gitignore`.
- `security/watchlist.yml`: 25 packages from ROADMAP §5.8 with documented safe versions, cited advisories and rule IDs, re-verified against OSV and GHSA.
- `scripts/check-advisories.mjs`: OSV batch check of the watchlist with CISA KEV flags; `--create-issues` (de-duplicated), `--dry-run`, `--json`, `--min-severity`.
- `scripts/check-freshness.mjs`: compares `applies_to` with npm, PyPI, Maven Central, NuGet, Packagist and endoflife.date, and flags reviews older than 90 days.
- `scripts/lib/automation.mjs` and `scripts/automation.test.mjs` (mocked fetch and `gh`).
- Workflows: `advisories.yml` (daily), `freshness.yml` (weekly), `monthly-review.yml` (monthly checklist issue).
- `templates/ci/github/security.yml`: OSV-Scanner (official reusable workflows), Semgrep CE, gitleaks (checksum-verified binary), zizmor and opt-in Trivy, with per-job permissions and SARIF upload.
- `templates/ci/github/dependabot.yml`: npm, pip, composer, gomod and GitHub Actions with a 7-day cooldown.
- `templates/ci/gitlab/security.gitlab-ci.yml`: OSV-Scanner, Semgrep CE and gitleaks with digest-pinned images.
- `templates/package-managers/`: `.npmrc`, `pnpm-workspace.yaml`, `.yarnrc.yml`, `bunfig.toml` and `uv.toml` with release-age cooldowns and install-script policy.
- `templates/ci/README.md`: setup, pin updates, false-positive tuning and mapping to rules and skills.
- `scripts/build.mjs`: builds Cursor `.mdc` rules, `AGENTS.md`, generated `<category>-<name>-conventions` skills, `CLAUDE.md` and skill copies into `dist/`, with a sha256 manifest; `--preset` selects a preset.
- `scripts/install.mjs`: builds a preset and copies it into a project for `cursor`, `agents` and `claude`, with `--dry-run`, conflict protection, `--force` and a version file.
- Presets: `next-supabase`, `nest-angular`, `rn-expo`, `react-vite`, `python-fastapi`, `laravel`, `ai-app`, `all-core`.
- `scripts/build.test.mjs` with fixtures; the lint workflow now builds and runs these tests.
- `rules/languages/typescript.md`: strictness, boundary validation with Standard Schema, ESM config, and TypeScript 7 native-compiler compatibility (hard errors, no programmatic API until 7.1).
- `rules/frontend/react.md`: React 19.3 components, hooks, React Compiler memoization, security and testing; RSC advisories with minimum safe 19.2.8.
- `rules/frontend/react-vite-spa.md`: Vite 8 (Rolldown/Oxc) config renames, public `VITE_*` env, dev-server exposure, React Router 8, TanStack Query; Vite and React Router advisories.
- `conventions/phaedra.md`: React section with the house component layout, API module, toast error handling and Tailwind theme colors.
- `react-router` in `security/watchlist.yml`.
- Project CodeGuard evaluation and OWASP 2025 gap analysis under D2 in `docs/decisions.md`; adapted-file list in `NOTICE.md`.
- `rules/frontend/nextjs.md`: Next.js 16 App Router conventions, Cache Components, Server Action and Route Handler checks with a Zod example, `proxy.ts` limits, `next/image` and CSP settings; advisories with minimum safe 16.4.1.
- `rules/legacy/nextjs-pages-router.md`: Pages Router and Next.js 12–15 rules for `getServerSideProps`, API routes and middleware (CVE-2025-29927, i18n data-route bypass), support status (15.x Maintenance LTS through 2027-01-31, 14.x unsupported), and the App Router migration path.
- `skills/upgrade-nextjs`: one-major-at-a-time upgrades with the official codemods, a React and Node compatibility table, 14 → 15 and 15 → 16 follow-ups (`proxy.ts`, async request APIs, ESLint CLI, `images` config), and build, test and smoke-test checks.
- `rules/frontend/angular.md`: Angular 20–22 conventions (standalone, `inject()`, signals, zoneless, OnPush by default, built-in control flow, `@defer`, Signal Forms, `httpResource`, `@angular/aria`, Vitest), a `core/`, `shared/`, `features/` layout, and security for sanitizer bypasses, Trusted Types, CSP, XSRF and SSR `allowedHosts`; 2026 advisories with minimum safe 22.2.1, 21.2.25 and 20.3.34.
- `rules/legacy/angular-ngmodules.md`: NgModule apps and Angular 2–19, adapted from `angular-rules.md`, with the layered architecture, version-gated APIs, safe-maintenance rules, EOL dates per major, unfixed 2026 CVEs with compensating controls, and the standalone → control flow → signals → zoneless migration path.
- `skills/upgrade-angular`: one-major-at-a-time `ng update` with the update guide, per-hop checks through v22 (`Eager` change detection, `paramsInheritanceStrategy`, Fetch backend, `trustProxyHeaders`), the standalone, control-flow, `inject()` and signal migrations, zoneless adoption checks, the Karma → Vitest switch, and build, test, e2e and smoke-test checks.
- `rules/mobile/react-native-expo.md`: React Native 0.82+ / Expo SDK 55+ (current RN 0.88, SDK 58) on the New Architecture, with `app/` for routes and `_layout` files only, screens in `src/features/<screen>/`, the single `apis` object with a matching definition and call, config plugins for native changes, keyboard handling, and security for `EXPO_PUBLIC_*` secrets, `expo-secure-store`, deep and universal links (`+native-intent`), WebView, EAS Update code signing and Metro4Shell, with MASVS pointers.
- `rules/legacy/react-native-old-arch.md`: React Native below 0.82, Expo SDK 54 or older and bare React Native CLI apps, with architecture detection on both platforms, native-module compatibility checks, unsupported-version status, the Metro4Shell exposure of old CLI versions, and the path through RN 0.81 / SDK 54 to the New Architecture.
- `skills/upgrade-react-native`: one Expo SDK (or one RN minor for bare apps) at a time with `npx expo install --fix` and the Upgrade Helper, per-library New Architecture readiness checks, `expo prebuild --clean` caveats, and release builds on iOS and Android plus an EAS build smoke test.
- `rules/backend/nestjs.md`: NestJS 12 module layout, controllers and services with shared method names, Standard Schema or class-validator validation (and what each pipe skips), a global auth guard with `@Public()`, response serializers, 12.1 built-in CSRF, security headers and cookies, throttling, body limits, config validated at boot, ESM path aliases, and 2026 Fastify and microservice advisories with minimum safe 12.0.3.
- `rules/backend/nestjs-microservices.md`: per-transport TLS and authentication table (TCP is plaintext), typed `ClientProxy` wrappers with timeouts, payload validation with `RpcException`, a provider-neutral `RealtimePublisher` for real-time updates, and BullMQ processors that throw so retries work.
- `rules/backend/nestjs-data.md`: Sequelize, TypeORM and Prisma 7 variants of injection and managed transactions, allow-listed query helpers, parameterized raw SQL, capped offset and keyset pagination, N+1 avoidance, migrations and database TLS; Sequelize and TypeORM advisories.
- `rules/legacy/nestjs-legacy.md`: NestJS 11 and older and Bull, with support status (11.x patched likely until the end of 2027; 10.x unsupported with unfixed 2026 advisories), v12-API substitutes, the Bull processor retry fix and the migration path.
- `skills/upgrade-nestjs`: manual 9 → 10 → 11 hops, `nest upgrade --dry-run` for 11 → 12, Jest, NATS, gRPC, Terminus and Lambda follow-ups, optional ESM conversion, and a Bull → BullMQ migration through new queues that drain the old ones.
- `rules/data/supabase.md`: publishable and secret keys, explicit Data API grants (30 Oct 2026 change), per-command RLS with `(select auth.uid())` and indexed policy columns, `security_invoker` views, `SECURITY DEFINER` in a private schema, Storage and Realtime policies, Edge Functions on per-function `deno.json` with `@supabase/server` caller checks, Stripe webhook signatures and idempotent handlers, pgTAP and `supabase db advisors`; includes a ✓ migration example.
- `rules/data/postgres.md`: PostgreSQL 14–18 naming (snake_case for new schemas), types, constraints, indexes, migrations that are safe under load, least-privilege roles, tenant RLS, parameterized and dynamic SQL, TLS and pooling; the August 2026 security release (28 CVEs) and PostgreSQL 14 EOL on 12 Nov 2026.
- `rules/legacy/supabase-legacy.md`: projects on legacy `anon`/`service_role` keys, import maps, URL imports or auth-helpers, with what to check (leaked service-role keys, `pg_net` headers, `verify_jwt` with the public anon JWT), the deprecation timeline and migration order.
- `skills/upgrade-supabase`: key migration per component with Vault-backed `apikey` headers and `verify_jwt` changes, Edge Functions moved to `deno.json`, and Security Advisor fixes by lint code.
- `rules/testing/cypress.md`: Cypress 15–16 with `cy.intercept()` registered before the action (✓/✗ example), verified test-ID selectors (ask before adding), no fixed waits, `cy.session()` login, seeding through `cy.task()` or the API, `cy.env()` for secrets and `Cypress.expose()` for public values, no responsive tests unless asked, and reuse of the existing config and types.
- `rules/testing/playwright.md`: Playwright 1.5x–1.6x locator priority, web-first assertions, ARIA snapshots, `storageState` per role, route mocking, traces on retry, and review rules for test agents and the MCP server (a healed test must not weaken assertions); CVE-2025-59288 and CVE-2025-9611.
- `rules/testing/unit-js.md`: Vitest by default and Jest where it exists, Vitest 5 behavior changes, Testing Library query priority and user-event, mocking only at boundaries with MSW and fake timers, coverage for changed code, and 2026 Vitest server advisories (minimum safe 5.0.5 / 4.1.11).
- `rules/ai/llm-apps.md`: server-side keys, model IDs in config, structured outputs validated against a schema with short OpenAI, Anthropic, Gemini and AI SDK notes, refusal and truncation handling, timeouts, retries, quotas and cost tracking, streaming with abort, prompt caching, promptfoo regression evals without paid calls in PR CI, PII-redacted logging, and controls for each OWASP Top 10 for LLM Applications 2026 entry; LangChain, LlamaIndex and LiteLLM advisories.
- `rules/ai/rag.md`: structure-aware chunking with tenant, ACL and provenance metadata, server-side tenant and ACL filters inside the query with a second isolation layer, pgvector iterative scans and partitioning, indirect prompt injection from documents, validated citations, embedding model versioning, ingestion safety, and deletion for right-to-be-forgotten requests.
- `rules/ai/agents.md`: least agency, tools acting with the end user's permissions, approval for destructive and external tools (LangGraph `interrupt()`, OpenAI Agents approvals, Claude Agent SDK `canUseTool`), step, time and cost limits, sandboxed code execution, per-tenant memory with expiry, authenticated agent-to-agent calls, audit logs and a kill switch, mapped to ASI01–ASI10; LangGraph checkpointer and Claude Agent SDK advisories.
- `rules/ai/mcp-servers.md`: MCP 2026-07-28 servers as OAuth 2.1 resource servers (protected resource metadata, audience-bound tokens, no token passthrough, scope challenges), per-tool scopes, strict input schemas, no shell passthrough, output sanitization, honest and versioned tool descriptions, `Origin` checks and localhost binding, stdio rules, rate limits and audit logs; MCP SDK, FastMCP and mcp-remote advisories.
- `rules/devops/github-actions.md`: SHA pinning with a lookup command (never invent a SHA), per-job permissions, OIDC trust conditions, trigger safety including the 2 Dec 2026 `pull_request_target` default block and checkout v7 protections, injection-safe `run:` and `$GITHUB_ENV`, caches and artifacts, environments, reusable workflows, runners, zizmor and actionlint, and a ✓ hardened workflow skeleton with placeholder SHAs.
- `rules/devops/docker.md`: multi-stage builds, minimal bases pinned by digest, non-root users, read-only filesystems and dropped capabilities, BuildKit secret mounts, health checks, `.dockerignore`, scanning, Cosign signing and attestations, and a hardened Compose example; runc, containerd, BuildKit, Engine and Compose advisories.
- `rules/languages/javascript-node.md`: Node 22, 24 and 26 LTS (26 LTS since 28 Oct 2026) with minimum safe versions from the 21 Oct 2026 security release, ESM and `node:` imports, `execFile` without a shell, path traversal guards, crypto, timeouts, stream limits, process-level handlers and the permission model.
- `rules/backend/express.md`: Express 5 middleware order, async errors, path-to-regexp 8 route syntax, the `simple` query parser, a Standard Schema validation middleware, one error handler, helmet, CORS, rate limits, trust proxy, sessions and CSRF, uploads; path-to-regexp, body-parser, qs, multer and express-rate-limit advisories.
- `rules/legacy/express-4.md`: Express 4 maintenance status, async error wrappers, patched transitive packages, the deprecated csurf and the migration path.
- `rules/legacy/node-legacy.md`: EOL Node lines with last releases, API limits per version, compensating controls and the migration path to Node 24 or 26.
- `skills/upgrade-express`: the official codemods through `npx codemod@latest @expressjs/v5-migration-recipe` (the npm `@expressjs/codemod` package is deprecated), manual route-syntax fixes, behavior changes and verification.
- `skills/upgrade-node`: target LTS choice, updating every Node pin together, native-module rebuilds, API changes and verification.
- `rules/languages/python.md`: Python 3.11–3.15 (3.10 EOL 1 Oct 2026), uv with lockfile, cooldown and malware check, Ruff, pyright or mypy, and security rules for deserialization, subprocess, secrets, paths, SQL, HTTP timeouts and XML.
- `rules/backend/fastapi.md`: per-direction Pydantic v2 models with `response_model`, strict and extra-forbidding inputs, auth and scopes through dependencies, async rules with SQLAlchemy 2, `pydantic-settings`, CORS, trusted hosts and limits; Starlette, python-multipart and PyJWT advisories.
- `rules/backend/django.md`: Django 5.2 LTS, 6.0 and 6.1 with minimum safe patches, allow-listed ORM filters (CVE-2025-64459), N+1 avoidance, the deployment checklist including 6.0 CSP, and DRF permissions and explicit serializer fields; Django and DRF advisories.
- `rules/legacy/python-legacy.md` and `rules/legacy/django-legacy.md`: EOL status, version limits, advisories left unfixed after EOL, compensating controls and migration paths.
- `skills/upgrade-python`: one minor version at a time with pyupgrade, warnings as errors, re-locking and pin updates.
- `skills/upgrade-django`: one feature release at a time with `django-upgrade --target-version`, add-on compatibility, migration checks and `check --deploy`.
- `rules/languages/php.md`: PHP 8.3–8.5 with minimum safe 8.5.11/8.4.26/8.3.35, `strict_types`, PER coding style, PHPStan or Psalm taint analysis, `composer audit`, PDO prepared statements, `password_hash`, no `unserialize`/`eval` on input, context escaping, uploads, sessions and TLS.
- `rules/backend/laravel.md`: Laravel 12 and 13 with Form Requests, Policies on every action, `$fillable`, bound raw queries, Blade escaping, CSRF (`PreventRequestForgery` on 13), Sanctum, rate limiting, signed URLs and queues; Laravel, Livewire and Filament advisories.
- `rules/legacy/php-legacy.md`: PHP ≤ 8.2, Laravel ≤ 11 and CodeIgniter 3 with EOL status, advisories unfixed on Laravel 10/11, Livewire RCEs, compensating controls and the migration path.
- `skills/upgrade-php`: one minor at a time with Rector `withPhpSets`, PHPStan with a baseline, deprecations as failures and pin updates.
- `skills/upgrade-laravel`: one major at a time following the official guide, package compatibility, optional rector-laravel sets and Laravel Shift.

### Changed

- `scripts/check-freshness.mjs` no longer reports EOL non-LTS releases (such as Node 25) inside a range when the runtime has LTS lines; new test in `scripts/automation.test.mjs`.
- `scripts/check-freshness.mjs` maps `postgresql`/`postgres` in `applies_to` to endoflife.date; `CONTRIBUTING.md` shows the example.
- `README.md` notes that the project is being restructured.
- `CONTRIBUTING.md` documents the lint commands; the PR template asks for lint and test results.
- `CONTRIBUTING.md` documents `applies_to` ecosystem prefixes and the scheduled jobs; the lint workflow also runs the automation tests.
- `README.md` Install section leads with the install script; `CONTRIBUTING.md` documents build outputs and presets.
- Markdown fixes for markdownlint in `README.md`, `CONTRIBUTING.md`, `NOTICE.md`, `SECURITY.md`, core rules and skills (code-fence languages, list spacing, bare URLs).
- `README.md` lists all 8 rule files and adds Install, Works with, Keep Cursor updated (3.1.2 or later), Roadmap and License sections.
- Rename `supabase-rules` to `supabase-rules.md`.
- `next-rules.md`: state follows the project (Redux Toolkit where present, otherwise Zustand; TanStack Query for server state); forms follow the project (Formik + Yup where present, otherwise React Hook Form + Zod) with `'use client'` on leaf form components; TypeScript props replace prop-types; add `proxy.ts` and Server Action security lines.
- `react-typescript-rules.md`: scope to Vite single-page apps; no default `useMemo`/`useCallback` with React Compiler.
- `react-native-rules.md`: add a New Architecture note (RN 0.82+); keep Expo Router `app/` to routes and layouts, with screens in `src/features/<screen>/`.
- `angular-rules.md`: add an Angular 15 end-of-life note.
- `nestjs-rules.md`: replace client-specific package scope, service and helper names with generic ones (`@app/common`); add a BullMQ note.
- `cypress-testing-rules.md`: scope with globs (`alwaysApply: false`) and select by `data-testid`.

### Fixed

- `security/watchlist.yml`: `langgraph-checkpoint-sqlite` listed 3.1.3 as safe, a version that doesn't exist; the fix is 3.1.2.
- `cypress-testing-rules.md`: register `cy.intercept()` before the triggering action.
- `nestjs-rules.md`: queue processor rethrows so retries happen; controller and service examples use the same method names and arguments; DTO property is camelCase.
- `react-native-rules.md`: the `apis` example defines and calls the same function.
- `next-rules.md`: remove the dangling "Code Implementation Guidelines" reference and the PurgeCSS advice.
- `angular-rules.md`: fix the section numbering gap.
- `global-rules.md`: the comment rule no longer contradicts "change only what's asked".

### Security

- `security/watchlist.yml`: add the 2026 Next.js advisories cited in the new rules to the `next` entry's `known` list.
- `security/watchlist.yml`: add `@angular/common`, `@angular/router` and `@angular/ssr`; set Angular minimum safe versions to those verified in OSV (22.2.1, 21.2.25, 20.3.34; `@angular/ssr` 22.1.7, 21.2.23, 20.3.36) and link `legacy/angular-ngmodules`.
- `security/watchlist.yml`: add `react-native`, `expo` and `react-native-webview`, and link the React Native CLI entries to `legacy/react-native-old-arch`.
- `security/watchlist.yml`: add `@nestjs/core`, `@nestjs/common`, `@nestjs/microservices`, `@nestjs/platform-fastify`, `sequelize` and `typeorm` with the advisories cited in the NestJS rules, and link `@nestjs/devtools-integration` to `legacy/nestjs-legacy`.
- `security/watchlist.yml`: add `@supabase/auth-js` (CVE-2025-48370).
- `security/watchlist.yml`: add `vitest`, `@vitest/browser`, `playwright`, `@playwright/test` and `@playwright/mcp`.
- `security/watchlist.yml`: add `langchain-community`, `llama-index-core` and `litellm`, and CVE-2025-65106 to `langchain-core`.
- `security/watchlist.yml`: add `langgraph-checkpoint`, `langgraph-checkpoint-postgres`, `claude-agent-sdk`, `@modelcontextprotocol/sdk`, `@modelcontextprotocol/server`, `mcp` and `fastmcp`; raise `langgraph` to 1.2.14.
- `security/watchlist.yml`: add containerd v2 and BuildKit.
- `security/watchlist.yml`: add `express`, `path-to-regexp`, `body-parser`, `qs`, `multer` and `express-rate-limit`.
- `security/watchlist.yml`: add `djangorestframework`, `starlette`, `python-multipart` and `pyjwt`; add Django 6.1 and the 2026 Django CVEs, and point the Django entry at `legacy/django-legacy`.
- `security/watchlist.yml`: add `laravel/framework`, `filament/filament` and `guzzlehttp/guzzle`.
- `supabase-rules.md`: the secret/service key bypasses RLS and must never reach clients (replaces "service role policies"); `SECURITY DEFINER` only with `set search_path = ''` and schema-qualified names; per-function `deno.json` with `npm:` specifiers instead of `import_map.json` and esm.sh; use the publishable/secret keys, since legacy `anon`/`service_role` keys are deprecated by the end of 2026.
- `next-rules.md`: every Server Action authenticates, authorizes and validates input.
