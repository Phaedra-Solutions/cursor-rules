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
- Project CodeGuard evaluation and OWASP 2025 gap analysis under D2 in `docs/decisions.md`; adapted-file list in `NOTICE.md`.

### Changed

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

- `cypress-testing-rules.md`: register `cy.intercept()` before the triggering action.
- `nestjs-rules.md`: queue processor rethrows so retries happen; controller and service examples use the same method names and arguments; DTO property is camelCase.
- `react-native-rules.md`: the `apis` example defines and calls the same function.
- `next-rules.md`: remove the dangling "Code Implementation Guidelines" reference and the PurgeCSS advice.
- `angular-rules.md`: fix the section numbering gap.
- `global-rules.md`: the comment rule no longer contradicts "change only what's asked".

### Security

- `supabase-rules.md`: the secret/service key bypasses RLS and must never reach clients (replaces "service role policies"); `SECURITY DEFINER` only with `set search_path = ''` and schema-qualified names; per-function `deno.json` with `npm:` specifiers instead of `import_map.json` and esm.sh; use the publishable/secret keys, since legacy `anon`/`service_role` keys are deprecated by the end of 2026.
- `next-rules.md`: every Server Action authenticates, authorizes and validates input.
