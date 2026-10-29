# Shared context for every implementation prompt

Every prompt in this folder tells you to read this file first. It holds everything a fresh session needs. **No prompt depends on another prompt having run.** If something a prompt expects is missing (a folder, a script, a section in a file), create it or skip that step. Never stop because an earlier prompt wasn't run.

## 1. Project

- Repo: `Phaedra-Solutions/cursor-rules` (public). It holds AI coding rules and skills that make agents code like a senior engineer, follow best practices, and check for vulnerabilities, for modern and legacy stacks.
- The full plan is `ROADMAP.md` at the repo root. Read only the sections your prompt names.
- ROADMAP facts were checked on 29 Oct 2026. **Before writing about any stack, re-verify its current version, support dates and CVEs with web search**, and use the newer facts if they changed. Put every source you used in the file's `sources`.

## 2. Approved decisions (the recommended options from ROADMAP §12)

| # | Decision |
|---|---|
| D1 | **Multi-tool.** One canonical source generates Cursor `.mdc` rules, `AGENTS.md` and Agent Skills (Codex, Copilot, Claude Code, Gemini CLI, …). Keep the repo name `cursor-rules`; the README gets a "Works with" section. |
| D2 | **Adopt and extend Project CodeGuard** (github.com/cosai-oasis/project-codeguard, CC BY 4.0) as the generic security layer. Adapt its content where it fits, with attribution in `NOTICE.md` and the file's `sources`. Our rules add the stack-specific and house layers. |
| D3 | **License:** MIT for the repo. Adapted CodeGuard content keeps its CC BY 4.0 attribution in `NOTICE.md`. |
| D4 | **House conventions** live in `conventions/phaedra.md` (an optional overlay). Generic rules say "follow the project's existing choice; for new projects default to …":<br>• **Forms:** React Hook Form + Zod for new React/Next/RN code. Keep Formik + Yup where a project already uses them. Angular uses Signal Forms.<br>• **Validation:** a Standard Schema library (Zod by default; Valibot or ArkType are fine).<br>• **Exports:** use whatever the framework requires (Next.js route files, Expo Router screens). Otherwise follow the project. The house overlay keeps "component folder with `index.tsx` default export, `styles.ts`, `types.ts`".<br>• **Formatting:** follow the project's Prettier/ESLint/Biome config. With no config, use Prettier defaults.<br>• **Comments:** don't add explanatory comments. Don't remove existing comments outside the lines you change.<br>• **State:** TanStack Query for server state. Zustand for client state in new projects; Redux Toolkit where it already exists.<br>• **Postgres naming:** snake_case for new schemas. Respect existing camelCase schemas.<br>• **Test IDs:** add `data-testid` to interactive elements. Unit tests query by role/label first; E2E uses test IDs. |
| D5 | **Legacy priority:** legacy pack 1 first (AngularJS, CRA/class components, Vue 2/Nuxt 2–3, Express 4, Node ≤ 20, PHP ≤ 8.2/Laravel ≤ 11, Django ≤ 4.2/Python 3.10, jQuery), then pack 2. |
| D6 | **Owners:** use the placeholder `@Phaedra-Solutions/maintainers` everywhere. The team replaces it later. |
| D7 | **Evals:** promptfoo, run locally or by manual `workflow_dispatch`. No paid model calls in pull-request CI by default. |
| D8 | **Distribution:** clone the repo and run the install script. No npm package. |

## 3. Repository layout (create any folder you need)

```
README.md  LICENSE  NOTICE.md  SECURITY.md  CONTRIBUTING.md  CHANGELOG.md  ROADMAP.md
docs/decisions.md            # D1–D8 record
.github/  CODEOWNERS  PULL_REQUEST_TEMPLATE.md  workflows/
rules/<category>/<name>.md   # categories: core languages frontend mobile backend data testing devops ai cms-commerce legacy
skills/<name>/SKILL.md       # optional scripts/ subfolder
conventions/phaedra.md
presets/<name>.yml
security/watchlist.yml       # packages + advisories the watcher tracks
templates/ci/                # workflows for consumer projects
evals/<category>/<name>.yaml
scripts/                     # build.mjs, install.mjs, lint-rules.mjs, … (Node ≥ 22, zero dependencies)
dist/                        # build output, git-ignored
implementation-prompts/      # these prompts + PROGRESS.md
```

The old root rule files (`global-rules.md`, `react-native-rules.md`, …) stay until the release prompt replaces them with pointer stubs. If you need one as source material and it's already a stub, use the rule it points to.

## 4. Rule file format

Path: `rules/<category>/<kebab-name>.md`. The `id` is `<category>/<kebab-name>`.

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

- **Required headings** for every rule outside `rules/core/` and `conventions/`: `## Version check`, `## Conventions`, `## Security`, `## Known vulnerabilities`, `## Testing`, `## Before you finish`. Legacy rules also need `## Migration path`. You may add other `##` sections.
- `## Version check`: tell the agent to read the installed version from the lockfile or manifest, and which rule to use instead when it's out of range.
- `## Known vulnerabilities`: a short, dated table (advisory, affected versions, fixed version), plus the line *"This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it."*
- `## Before you finish`: the exact commands to run (lint, typecheck, test, the audit command for the ecosystem).
- **Size:** 500 lines maximum, 80–250 target.
- **Don't repeat core rules.** Link them instead ("see `core/security-baseline`"). Put only stack-specific security in a stack rule.

## 5. Skill format (Agent Skills standard)

Path: `skills/<name>/SKILL.md`. The folder name equals `name`: lowercase letters, digits and hyphens, at most 64 characters.

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

Keep `description` under 1,024 characters and say *when* to use the skill. Helper scripts go in `skills/<name>/scripts/` and use only POSIX shell or Node with no dependencies.

## 6. Writing rules

- Write imperative, concrete bullets ("Do X", "Never Y"). Use short ✓/✗ code examples only where they remove ambiguity.
- Every version, date or CVE claim needs a source in `sources`.
- No client or company-internal identifiers. Use generic names (`@app/common`, `acme`).
- Never invent packages or CLI flags. Verify each one exists (registry page or official docs) before naming it.
- Never use hidden or zero-width Unicode or bidirectional control characters. Arrows (→) and ≤/≥ are fine.
- Use kebab-case for every new file and folder.
- Rules are instructions to an AI agent, not tutorials. Don't explain what a framework is.

## 7. Workflow (do this in every prompt)

1. **Branch:** run `git switch roadmap/v1`. If that branch doesn't exist, run `git switch -c roadmap/v1`. If the tree has uncommitted changes you didn't make, stop and ask the user.
2. **Look before writing:** check whether the files you're asked to create already exist. If they do, improve them instead of duplicating them.
3. **Research:** web-search current versions, EOL dates and CVEs for the stacks in scope.
4. **Write** the files.
5. **Validate:**
   - if `scripts/lint-rules.mjs` exists, run `node scripts/lint-rules.mjs` and fix every error;
   - otherwise, self-check against §4–§6;
   - if `scripts/build.mjs` exists, run it to confirm the files build.
6. **README:** add or update rows in the `## Catalog` table in `README.md`. If the section doesn't exist, create it with the columns `| Item | Type | Path | Applies to | Status |`. Status is one of `draft`, `stable` or `legacy`; new work is `draft`.
7. **CHANGELOG.md:** add bullets under `## [Unreleased]`. Create the file or section if it's missing (Keep a Changelog format).
8. **PROGRESS.md:** append `- [x] NN <prompt title> (YYYY-MM-DD)` to `implementation-prompts/PROGRESS.md`. Create the file if it's missing.
9. **Commit:**
   - stage only the files you touched;
   - write the message as a dash list in present tense, one line per change;
   - commit with `printf '%s\n' "- change 1" "- change 2" | git commit -F -`;
   - don't push.
10. **Report** to the user: the files changed, the key sources used, anything you couldn't verify, and suggested follow-ups.
