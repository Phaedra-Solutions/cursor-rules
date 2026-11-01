# Prompt 03: Core rules: behavior + security baseline

> Self-contained; safe in a fresh session. Roadmap: Phase 1, §5.1, §7 (core/behavior), §12 (D2).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §3, §4.5, §5.1, and the §7 entry `core/behavior`.
3. Read the root `global-rules.md`. If it's a stub, read `rules/core/behavior.md` instead.

## Task
1. **Evaluate Project CodeGuard (D2).**
   - Read its repo (https://github.com/cosai-oasis/project-codeguard): its `sources/` core and OWASP rules, and its license.
   - Decide which parts to adapt into our baseline and which to reference instead.
   - Record the decision, with a short gap analysis against OWASP Top 10:2025, under D2 in `docs/decisions.md` (create the file if it's missing).
   - Add attribution to `NOTICE.md` (create it if missing).
2. **`rules/core/behavior.md`** (`alwaysApply: true`):
   - Keep from `global-rules.md`:
     - terse, code-first answers; do only what's asked; ask before reading docs then coding;
     - change only the requested lines; small incremental steps;
     - follow existing codebase patterns (scan first); kebab-case new files;
     - test IDs on interactive elements; respect lint settings.
   - Comment rule: don't add explanatory comments, and don't remove existing ones outside the lines you change.
   - New:
     - always report security findings in one line, even in terse mode;
     - say which rule and version you're applying when it matters.
   - Leave out personal tone preferences, and point to User Rules for them. Leave out the commit flow, and point to the `git-commit` skill.
   - Under 120 lines.
3. **`rules/core/security-baseline.md`** (`alwaysApply: true`):
   - Turn the §5.1 table into imperative rules grouped by OWASP Top 10:2025 category (A01–A10), and cite the related 2025 CWE Top 25 IDs.
   - Note that SSRF is folded into A01, and point to `core/supply-chain` for A03.
   - Point to OWASP ASVS 5.0, the OpenSSF AI-assistant guide and CodeGuard for detail.
   - Include short ✓/✗ examples only for injection and access control.
   - Under 150 lines.
   - Verify the OWASP 2025 category names and the CWE list against the sources before writing.

## Done when
Both rules exist and follow shared context §4 (core rules don't need the stack headings), the CodeGuard decision is recorded, and you've completed the shared-context workflow.
