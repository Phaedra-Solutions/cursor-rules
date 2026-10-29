# Prompt 07: Repo lint script and CI checks

> Self-contained; safe in a fresh session. Roadmap: Phase 1, §5.5, §9.2.

## Before you start
1. Read `implementation-prompts/00-shared-context.md`. §4 and §5 define exactly what to validate.
2. Read `ROADMAP.md` §5.5 and §9.2.

## Task
1. **`scripts/lint-rules.mjs`** (Node ≥ 22, **zero dependencies**; write a small YAML frontmatter parser for the subset we use: scalars, string arrays, one-level maps). It validates `rules/**/*.md`, `conventions/*.md` and `skills/*/SKILL.md`:
   - Rule frontmatter: the required keys and types from §4; `id` matches the path; `last_reviewed` is a valid date (warn when older than 90 days); `sources` are non-empty URLs; `tier` is P0–P3.
   - Required headings for non-core rules, plus `## Migration path` for `rules/legacy/*`.
   - Size: error over 500 lines, warning over 250.
   - `alwaysApply: true` only inside `rules/core/`.
   - Skill frontmatter: `name` matches the folder, uses only `[a-z0-9-]` and is at most 64 characters; `description` is at most 1,024 characters.
   - Hidden Unicode in **every** tracked text file, not just rules: U+200B–U+200D, U+2060, U+FEFF, U+202A–U+202E, U+2066–U+2069 and U+E0000–U+E007F. Report file, line and code point.
   - `legacy_rule` references and `see core/...`-style references point to rule IDs that exist. Warn only, because other prompts may not have run yet.
   - Behind an optional `--network` flag: every package named in an install command (`npm i`, `pnpm add`, `yarn add`, `pip install`, `uv add`, `composer require`, `cargo add`, `go get`, `dotnet add package`) exists on its registry.
   - Exit code 1 on errors. Output human-readable text by default; add `--json`.
2. **Tests:** `scripts/lint-rules.test.mjs` using `node:test`, with fixtures in `scripts/fixtures/` covering a valid rule, a missing heading, hidden Unicode, a bad skill name and an oversized file. Run them.
3. **`.github/workflows/lint.yml`** (on pull_request and push to `main`):
   - jobs: the lint script, its tests, markdownlint and a link check (lychee);
   - `permissions: contents: read`;
   - pin every action to a **full commit SHA, looked up for real** (for example `gh api repos/actions/checkout/git/ref/tags/<tag>`), with the tag in a trailing comment; never invent a SHA;
   - `persist-credentials: false` on checkout;
   - add `.markdownlint.jsonc`, tuned for our long tables, and `lychee.toml` (exclude rate-limited hosts if needed).
4. Run the lint script over the whole repo and **fix every error in existing files**. Warnings about missing cross-references are acceptable.
5. Document `node scripts/lint-rules.mjs` in `CONTRIBUTING.md` (create it if missing).

## Done when
The lint script and its tests pass locally, the workflow is valid YAML with real pinned SHAs, and you've completed the shared-context workflow.
