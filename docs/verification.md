# Release verification checklist

Run this before tagging a release. Steps marked **(human)** need someone with the tool open; the rest can be scripted. Record the result, the date and the versions used.

Last run: **v1.0.0, 2026-10-30**, on macOS with Node.js 24, from commit `0167442` plus the release changes.

## 1. Repository checks

| Step | Command | v1.0.0 result |
| --- | --- | --- |
| Lint rules and skills | `node scripts/lint-rules.mjs` (and `--network`) | Pass: 0 errors; 2 warnings for planned references (`testing/mobile-e2e`, `languages/c-cpp`) |
| Script tests | `node --test scripts/*.test.mjs` | Pass: 65 tests |
| Build everything | `node scripts/build.mjs` | Pass |
| Build each preset | `node scripts/build.mjs --preset <name>` for all 8 | Pass; `python-fastapi` and `rn-expo` warn about planned rules (`testing/pytest`, `testing/mobile-e2e`) |
| README catalog current | `node scripts/build.mjs --catalog --check` | Pass |
| Advisory watchlist | `node scripts/check-advisories.mjs --dry-run` | 1 known open item: `vite` CVE-2026-118662 (fixed in 6.4.5) not yet in the watchlist |
| Freshness | `node scripts/check-freshness.mjs --dry-run` | Pass: no findings |
| Markdown lint | markdownlint-cli2 (runs in CI) | Not run locally (not installed); runs in the Lint workflow |
| Links | lychee (runs in CI) | Not run locally; `lint-rules.mjs --network` checked source URLs |

## 2. Install a preset into a temporary project

```sh
dest=$(mktemp -d) && (cd "$dest" && git init -q && echo '{"private":true}' > package.json)
node scripts/install.mjs --preset next-supabase --tool cursor,agents,claude --dest "$dest" --dry-run
node scripts/install.mjs --preset next-supabase --tool cursor,agents,claude --dest "$dest"
```

| Check | v1.0.0 result |
| --- | --- |
| Dry run writes nothing and lists the plan | Pass: 61 new files planned, nothing written |
| Install writes the planned files | Pass: 61 files |
| Re-running reports the files as unchanged, and a changed file blocks the install without `--force` | Pass: 60 unchanged plus the refreshed version file; after editing `AGENTS.md` the install reports `CONFLICT AGENTS.md` and writes nothing (also covered by `scripts/build.test.mjs`) |
| `.cursor/rules/.cursor-rules-version` records source, version, preset, tools and manifest hash | Pass |
| Skills aren't duplicated for Cursor (Cursor also loads `.agents/skills/`) | Pass: the installer skips `.cursor/skills` when `agents` is selected and prints a note |

## 3. Cursor files

| Check | Expected location (Cursor docs) | v1.0.0 result |
| --- | --- | --- |
| Project rules are `.mdc` files under `.cursor/rules/` | `.cursor/rules/**/*.mdc` | Pass: 16 files (15 rules, 1 convention) |
| Frontmatter has only `description` (quoted string), optional `globs` (comma-separated, no braces or brackets) and `alwaysApply` (`true`/`false`) | Rules docs | Pass for all 16 |
| Only the four core rules are `alwaysApply: true` | — | Pass: `core/agent-safety`, `core/behavior`, `core/security-baseline`, `core/supply-chain` |
| Skills load from `.agents/skills/` or `.cursor/skills/` | Skills docs | Pass: `.agents/skills/<name>/SKILL.md` |
| **(human)** Open the project in Cursor 3.1.2+, check **Settings → Rules** lists the core rules as always applied and the stack rules as auto-attached | — | Not done: needs Cursor |
| **(human)** Edit a file matching a stack rule (for example `app/page.tsx`) and confirm the agent states the rule and versions it applies | — | Not done: needs Cursor |
| **(human)** Ask for a task a skill covers (for example "vet the package left-pad") and confirm the skill loads | — | Not done: needs Cursor |

## 4. Codex and other `AGENTS.md` tools

| Check | Expected location (Codex docs) | v1.0.0 result |
| --- | --- | --- |
| `AGENTS.md` at the project root with core rules, conventions, stack guidance and task skills | repo root | Pass: 506 lines, 4 sections |
| Skills under `.agents/skills/<name>/SKILL.md` with `name` matching the folder (kebab-case, ≤ 64 characters) and `description` ≤ 1024 characters | `$CWD/.agents/skills` up to the repo root | Pass for all 20 skills |
| **(human)** Start Codex in the project and confirm it lists the skills and follows `AGENTS.md` | — | Not done: needs Codex |
| **(human)** Repeat with GitHub Copilot (agent mode) and Gemini CLI | — | Not done |

## 5. Claude Code

| Check | Expected location (Claude Code docs) | v1.0.0 result |
| --- | --- | --- |
| `CLAUDE.md` at the root imports `@AGENTS.md` | repo root | Pass |
| Skills under `.claude/skills/<name>/SKILL.md` | `.claude/skills/` | Pass for all 20 skills |
| **(human)** Start Claude Code in the project, run `/memory` to confirm `AGENTS.md` is loaded, and check the skills appear | — | Not done: needs an interactive session |

## 6. Release artifacts

| Check | v1.0.0 result |
| --- | --- |
| `.github/workflows/release.yml` triggers on `v*` tags, runs lint, tests and the catalog check, and fails if CHANGELOG has no section for the tag | Reviewed; runs on the first tag push |
| Archives per tool (`cursor`, `agents`, `claude`), the manifest and `SHA256SUMS`; checksums verified before publishing | Reviewed; runs on the first tag push |
| **(human)** After the first release run, download one archive, check `sha256sum -c SHA256SUMS --ignore-missing`, and unzip it into a test project | Not done: needs the pushed tag |
| **(human)** Sign release tags (`git tag -s`) once a maintainer signing key is set up | Not done: the v1.0.0 tag is annotated, not signed |
