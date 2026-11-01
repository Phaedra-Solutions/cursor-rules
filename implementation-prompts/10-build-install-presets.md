# Prompt 10: Build and install scripts, presets

> Self-contained; safe in a fresh session. Roadmap: Phase 2, §4.1, §4.2, §4.6, §9.1, §12 (D1, D8).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §4.1–§4.6 and §9.1.
3. Fetch and confirm the current formats:
   - Cursor project rules (https://cursor.com/docs/context/rules): `.mdc` frontmatter and how `globs` is written (YAML list or comma-separated string);
   - Cursor skills paths (https://cursor.com/docs/context/skills);
   - the AGENTS.md conventions (agents.md);
   - the Agent Skills spec (agentskills.io);
   - Claude Code `CLAUDE.md` imports and the `.claude/skills/` path.

## Task
1. **`scripts/build.mjs`** (Node ≥ 22, zero dependencies). It reads `rules/**`, `conventions/**` and `skills/**` and writes:
   - `dist/cursor/.cursor/rules/<category>/<name>.mdc`, keeping only the frontmatter keys Cursor reads, in Cursor's documented `globs` format;
   - `dist/cursor/.cursor/skills/<name>/` and `dist/agents/.agents/skills/<name>/` (copies, including `scripts/`);
   - `dist/agents/AGENTS.md`, containing:
     - the core rule bodies, concatenated with headers;
     - a "Stack guidance" index that lists each stack rule with its globs, and says to load the matching `<stack>-conventions` skill;
   - `dist/agents/.agents/skills/<category>-<name>-conventions/SKILL.md`, generated from each non-core rule (name and description derived from the rule; body = the rule body);
   - `dist/claude/CLAUDE.md`, which imports AGENTS.md (`@AGENTS.md`), plus `dist/claude/.claude/skills/`;
   - `dist/manifest.json` listing every output with a sha256.
   - Options: `--preset <name>` limits the output to that preset; with no preset, it builds everything.
   - If a preset or rule references a missing ID, warn and continue. Other prompts may not have created it yet.
2. **`scripts/install.mjs`:** `node scripts/install.mjs --preset <name> --tool cursor,agents,claude --dest <path> [--dry-run] [--force]`.
   - builds the preset, then copies the outputs into the destination project;
   - never overwrites existing files without `--force`; shows a diff summary first;
   - writes `.cursor/rules/.cursor-rules-version` (git describe + manifest hash).
3. **Presets** in `presets/*.yml`:
   - `next-supabase`, `nest-angular`, `rn-expo`, `react-vite`;
   - `python-fastapi`, `laravel`, `ai-app`;
   - `all-core` (core rules + security skills).

   Use the rule IDs planned in ROADMAP §6, whether or not they exist yet. Each preset also lists its skills and an optional `conventions: [conventions/phaedra]`.
4. **Tests:** `scripts/build.test.mjs` with fixtures (two rules, one skill, one preset referencing a missing rule). Assert the output paths, the `.mdc` frontmatter, the AGENTS.md sections and the warnings. Run them.
5. Add `build` and `install` usage to `README.md` (an **Install** section) and to `CONTRIBUTING.md`.

## Done when
`node scripts/build.mjs` succeeds on the current repo, the tests pass, `install --dry-run` into a temp folder prints the planned copies, and you've completed the shared-context workflow.
