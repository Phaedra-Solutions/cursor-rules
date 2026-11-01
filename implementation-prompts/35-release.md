# Prompt 35: Release (stubs for old files, final README, release workflow, version tag)

> Self-contained; safe in a fresh session. Roadmap: §9.5, §10, §11 (Phase 4 exit).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §9.5, §10 and §11.
3. Inventory what exists: `rules/`, `skills/`, `presets/`, `scripts/`, `.github/workflows/` and `PROGRESS.md`. **This prompt works with whatever exists.** Missing items become "planned" in the README; nothing gets invented.

## Task
1. **Old root rule files** (`global-rules.md`, `react-native-rules.md`, `angular-rules.md`, `nestjs-rules.md`, `cypress-testing-rules.md`, `next-rules.md`, `react-typescript-rules.md`, `supabase-rules(.md)`):
   - if the replacement rule exists, replace the file's content with a short stub: "This file moved to `rules/…`", the link, and a note that the old content is in git history before tag `vX`;
   - if no replacement exists yet, leave the file unchanged and list it in the report.
2. **`README.md`**, the final structure:
   - intro;
   - **Works with**;
   - **Quick start** (clone, `node scripts/install.mjs --preset …`, or copy `dist/` from a release);
   - **Presets**;
   - **Catalog**, regenerated from the actual files: rules, skills, status and applies-to;
   - **Security** (what the rules enforce; the CI templates; `SECURITY.md`);
   - **Keep your tools updated**;
   - **Contributing**; **License**.
   - If the build script exists, generate the catalog with a `--catalog` option (add the option if needed) so it stays in sync.
3. **`.github/workflows/release.yml`:**
   - triggers on `v*` tags;
   - runs lint, tests and build, then zips `dist/` per tool with a `SHA256SUMS` file, and creates a GitHub Release with the CHANGELOG section;
   - `permissions: contents: write` only on that job; actions pinned to real SHAs.
4. **Version:**
   - **v1.0.0** if every P0 and P1 rule from ROADMAP §6 exists;
   - otherwise **v0.2.0** if all the P0 rules exist;
   - otherwise **v0.1.0**.
   - Move the `[Unreleased]` CHANGELOG entries under that version with today's date.
5. **Manual verification checklist:** create `docs/verification.md` and work through it where you can:
   - install a preset into a temp project;
   - confirm the `.mdc` files have valid frontmatter;
   - confirm AGENTS.md and the skills folders are where Cursor, Codex and Claude Code expect them.
   - Mark the steps that need a human with Cursor open.
6. Commit. Then create an **annotated** tag locally (`git tag -a vX.Y.Z -m "…"`). **Don't push.** Tell the user the commands to push the branch and tag, and to open a PR.

## Done when
The stubs, README, release workflow, CHANGELOG version and verification doc are done, the tag exists locally, and you've completed the shared-context workflow.
