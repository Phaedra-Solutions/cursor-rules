# Contributing

Thanks for helping. This repo holds rules and skills that AI coding agents follow, so every line is an instruction an agent will act on. Keep it accurate, sourced and short.

The plan and its reasoning live in [`ROADMAP.md`](./ROADMAP.md). Approved decisions are recorded in [`docs/decisions.md`](./docs/decisions.md).

## Layout

| Path | What goes there |
|---|---|
| `rules/<category>/<name>.md` | Canonical rule sources. Categories: `core`, `languages`, `frontend`, `mobile`, `backend`, `data`, `testing`, `devops`, `ai`, `cms-commerce`, `legacy` |
| `skills/<name>/SKILL.md` | Agent Skills, with an optional `scripts/` subfolder |
| `conventions/` | House-style overlays (optional for outside users) |
| `presets/<name>.yml` | Bundles of rules and skills |
| `security/watchlist.yml` | Packages and advisories the watcher tracks |
| `templates/ci/` | Workflows for consumer projects |
| `evals/<category>/<name>.yaml` | Prompt tests per rule |
| `scripts/` | `build.mjs`, `install.mjs`, `lint-rules.mjs`, … (Node ≥ 22, zero dependencies) |
| `dist/` | Build output, git-ignored |

## Add a rule

1. Pick the category and a kebab-case name. The file is `rules/<category>/<name>.md` and its `id` is `<category>/<name>`.
2. Copy this template:

   ```markdown
   ---
   id: frontend/nextjs
   title: Next.js (App Router)
   description: Next.js 16 App Router conventions and security. Use when editing app/, proxy.ts or next.config.*
   applies_to: "next >=16.0 <17"          # "any" for core rules
   legacy_rule: legacy/nextjs-pages-router  # optional
   globs: ["app/**/*.{ts,tsx}", "proxy.ts", "next.config.*"]   # [] for core rules
   alwaysApply: false                     # true only in rules/core/
   tier: P0                               # P0–P3
   owner: "@Phaedra-Solutions/maintainers"
   last_reviewed: YYYY-MM-DD              # today's date (run `date +%F`)
   sources:
     - https://nextjs.org/blog
   ---

   # Next.js 16 (App Router)

   ## Version check
   ## Conventions
   ## Do / Don't
   ## Security
   ## Known vulnerabilities (as of YYYY-MM)
   ## Testing
   ## Before you finish
   ```

3. Fill in every section:
   - **Required headings** for every rule outside `rules/core/` and `conventions/`: `## Version check`, `## Conventions`, `## Security`, `## Known vulnerabilities`, `## Testing`, `## Before you finish`. Legacy rules also need `## Migration path`. You may add other `##` sections.
   - `## Version check`: tell the agent to read the installed version from the lockfile or manifest, and which rule to use instead when it's out of range.
   - `## Known vulnerabilities`: a short, dated table (advisory, affected versions, fixed version), plus the line *"This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it."*
   - `## Before you finish`: the exact commands to run (lint, typecheck, test, the audit command for the ecosystem).
4. **Size:** 500 lines maximum, 80–250 target.
5. **Don't repeat core rules.** Link them instead ("see `core/security-baseline`"). Put only stack-specific security in a stack rule.
6. Add an eval in `evals/<category>/<name>.yaml` when the rule changes agent behavior you can test (see [evals/README.md](./evals/README.md); `node scripts/run-evals.mjs --dry-run` checks the structure without model calls).
7. Add a row to the `## Catalog` table in `README.md` with status `draft`, and a bullet under `## [Unreleased]` in `CHANGELOG.md`.

## Add a skill

Skills follow the [Agent Skills](https://agentskills.io/specification) standard. Use a skill for procedures run on demand (audits, upgrades, migrations); use a rule for short conventions tied to file patterns.

1. Create `skills/<name>/SKILL.md`. The folder name equals `name`: lowercase letters, digits and hyphens, at most 64 characters.
2. Copy this template:

   ```markdown
   ---
   name: upgrade-nextjs
   description: Upgrade a Next.js app one major version at a time with codemods and checks. Use when asked to upgrade Next.js or when the project is below the version in frontend/nextjs.
   license: MIT
   metadata:
     owner: "@Phaedra-Solutions/maintainers"
     last_reviewed: "YYYY-MM-DD"
     sources: "https://… https://…"   # space-separated string
   ---

   # Upgrade Next.js

   ## When to use
   ## Before you start      # preconditions; what to ask the user
   ## Steps
   ## Verify
   ## Safety               # what never to do (e.g. never jump two majors at once, never auto-commit)
   ```

3. Keep `description` under 1,024 characters and say *when* to use the skill.
4. Helper scripts go in `skills/<name>/scripts/` and use only POSIX shell or Node with no dependencies.

## Writing rules

- Write imperative, concrete bullets ("Do X", "Never Y"). Use short ✓/✗ code examples only where they remove ambiguity.
- Every version, date or CVE claim needs a source in `sources`.
- No client or company-internal identifiers. Use generic names (`@app/common`, `acme`).
- Never invent packages or CLI flags. Verify each one exists (registry page or official docs) before naming it.
- Never use hidden or zero-width Unicode or bidirectional control characters. Arrows (→) and ≤/≥ are fine.
- Use kebab-case for every new file and folder.
- Rules are instructions to an AI agent, not tutorials. Don't explain what a framework is.
- Before writing about any stack, re-verify its current version, support dates and CVEs, and cite what you used.

## Definition of done for a rule

- Template complete, under 500 lines, sources cited.
- Examples compile and evals pass.
- Tested in Cursor (note the Cursor version in the PR).
- No client identifiers.

## Checks

Run these before opening a pull request (Node ≥ 22; the lint script has no dependencies):

```sh
node scripts/lint-rules.mjs                # frontmatter, headings, size, alwaysApply scope, hidden Unicode, references
node scripts/lint-rules.mjs --network      # also checks that packages in install commands exist on their registry
node scripts/lint-rules.mjs --json         # machine-readable output
node scripts/build.mjs                     # build dist/ for every tool (add --preset <name> for one preset)
node --test scripts/*.test.mjs             # script tests
```

Errors fail the check (exit code 1); warnings, such as references to rules that don't exist yet or a `last_reviewed` date older than 90 days, don't. CI also runs markdownlint (`.markdownlint.jsonc`) and the lychee link checker (`lychee.toml`); see `.github/workflows/lint.yml`. If you have them installed, run them locally with:

```sh
markdownlint-cli2 '**/*.md' '!scripts/fixtures/**' '!node_modules/**' '!implementation-prompts/**' '!ROADMAP.md' '!*-rules.md'
lychee --config lychee.toml './**/*.md'
```

Lint fixtures live in `scripts/fixtures/`. The hidden-Unicode fixture holds a `{{U+200B}}` placeholder that the test replaces at runtime, so the repository itself never contains hidden characters.

## Build, presets and install

`node scripts/build.mjs [--preset <name>]` turns the sources into `dist/` (git-ignored):

| Output | Contents |
|---|---|
| `dist/cursor/.cursor/rules/<category>/<name>.mdc` | Each rule and convention, with only `description`, `globs` (comma-separated, braces expanded) and `alwaysApply` |
| `dist/cursor/.cursor/skills/`, `dist/agents/.agents/skills/`, `dist/claude/.claude/skills/` | Copies of the task skills, including `scripts/` |
| `dist/agents/.agents/skills/<category>-<name>-conventions/` (and the `.claude` copy) | One generated skill per stack rule (and per core rule that isn't always on), for tools without glob-scoped rules |
| `dist/agents/AGENTS.md` | Always-on core rules, house conventions, a stack-guidance table pointing at the generated skills, and the task skills |
| `dist/claude/CLAUDE.md` | `@AGENTS.md` import (with a copy of `AGENTS.md` next to it) |
| `dist/manifest.json` | Every output with its sha256, plus the selected rules, skills and warnings |

A preset is a YAML file in `presets/` with `name`, `description`, `rules` (IDs; `core/*` style wildcards allowed), `skills` and `conventions`. Rules and skills a preset names but that don't exist yet produce a warning, not an error. `node scripts/install.mjs` builds a preset and copies it into a project (see the README's **Install** section).

## Version ranges (`applies_to`)

The weekly freshness check reads each rule's `applies_to` and compares it with the latest release. Write it as `"<package> >=X <Y"`. npm is the default registry; prefix other ecosystems:

| Prefix | Example |
|---|---|
| none (npm) | `"next >=16.0 <17"`, `"@angular/core >=22.0 <23"` |
| `pypi:` | `"pypi:django >=5.2 <6"` |
| `maven:` | `"maven:org.springframework.boot:spring-boot >=4.0 <5"` |
| `nuget:` | `"nuget:Microsoft.AspNetCore.App.Ref >=10.0 <11"` |
| `packagist:` | `"packagist:laravel/framework >=13.0 <14"` |
| runtime (endoflife.date) | `"node >=24 <27"`, `"python >=3.12 <3.15"`, `"php >=8.3 <9"`, `"postgresql >=14 <19"` |

Separate several clauses with commas (`"packagist:laravel/framework >=13.0 <14, php >=8.3 <9"`). Use `"any"` for rules that don't depend on a version. Rules under `legacy/` are only checked for review age.

## Scheduled jobs

| Workflow | When | What it does |
|---|---|---|
| `advisories.yml` | Daily, 06:00 UTC | `scripts/check-advisories.mjs` queries OSV for every package in `security/watchlist.yml` at its documented safe versions and opens an issue for each new high, critical or CISA KEV advisory |
| `freshness.yml` | Mondays, 06:00 UTC | `scripts/check-freshness.mjs` flags rules whose `applies_to` misses the latest release or covers an EOL runtime, and reviews older than 90 days |
| `monthly-review.yml` | 1st of each month | Opens "Monthly security review YYYY-MM" with the ROADMAP §10 checklist |

Run either script with `--dry-run` to see what it would report and which issues it would open; `--json` gives machine-readable output. When you cite a new advisory in a rule, add its ID to `known` in `security/watchlist.yml` and raise `safe_versions` if needed.

## Review checklist

Reviewers check every item before approving:

- [ ] Sources cited for every version, date and CVE claim
- [ ] Versions verified against the official site or registry as of the PR date
- [ ] Under 500 lines (80–250 target)
- [ ] No client or company-internal identifiers
- [ ] No invented packages, APIs or CLI flags
- [ ] `node scripts/lint-rules.mjs` passes, and `node scripts/build.mjs` builds once it exists
- [ ] Core rules repeated nowhere; linked instead
- [ ] Eval results attached when behavior changed

Changes to `rules/core/**`, `skills/security-*`, `security/` and `.github/workflows/` need two approvals, one of them from a security reviewer (see `.github/CODEOWNERS`).

## Copying from elsewhere

Don't copy from other rule collections without checking their license; many have none. Project CodeGuard is CC BY 4.0 and needs attribution: list its URL in the file's `sources` and keep the entry in [`NOTICE.md`](./NOTICE.md).

## License

By contributing, you agree that your contributions are licensed under the MIT License (see [`LICENSE`](./LICENSE)). Adapted third-party content keeps its original license and attribution, recorded in [`NOTICE.md`](./NOTICE.md) and in the file's `sources`.
