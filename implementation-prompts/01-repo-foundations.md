# Prompt 01: Repo foundations

> Self-contained; safe in a fresh session. Roadmap: Phase 0, §4.3, §10, §12.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it, especially §7 (Workflow).
2. Read these `ROADMAP.md` sections: §3, §4.3, §10, §12.

## Task
Create the repository scaffolding. If any of these files already exist, review and complete them instead of overwriting.

1. **`LICENSE`:** MIT, copyright "2026 Phaedra Solutions".
2. **`NOTICE.md`:** third-party attributions. Add a "Project CodeGuard (CoSAI), CC BY 4.0" section with a link to the repo and the license, and a note that adapted files list it in their `sources`.
3. **`SECURITY.md`:**
   - Report through GitHub private vulnerability reporting (the Security tab), with hello@phaedrasolutions.com as a fallback.
   - In scope: malicious or unsafe instructions in rules, hidden-Unicode tampering, rules that would make an agent produce vulnerable code, compromised scripts.
   - Response targets: acknowledge in 3 business days; fix critical issues in 7 days.
4. **`CONTRIBUTING.md`:**
   - how to add a rule and a skill, embedding the formats from shared context §4–§5;
   - the writing rules (§6);
   - the definition of done from ROADMAP §10;
   - the review checklist: sources cited, versions verified, under 500 lines, no client identifiers, no invented packages, lint passes;
   - the license note (contributions are MIT; adapted third-party content keeps its license and attribution).
5. **`.github/CODEOWNERS`:**
   - `* @Phaedra-Solutions/maintainers`;
   - stricter entries for `/rules/core/`, `/skills/security-*`, `/security/` and `/.github/workflows/`, using the same placeholder team;
   - a comment telling the team to replace the placeholder.
6. **`.github/PULL_REQUEST_TEMPLATE.md`:** a checklist covering what changed, version range covered, sources, lint/build results, eval results if any, and "no client identifiers".
7. **`CHANGELOG.md`:** Keep a Changelog format, with an `## [Unreleased]` section.
8. **`docs/decisions.md`:** an ADR-style record of D1–D8 from shared context §2, dated today, each with its alternatives and a link to ROADMAP §12.
9. **`conventions/phaedra.md`:** the house-style overlay from D4.
   - Rule frontmatter: `id: conventions/phaedra`, `alwaysApply: false`, `globs: []`, `applies_to: "any"`, `tier: P0`.
   - Include the conventions still worth keeping from the root `global-rules.md`: terse code-first answers, small steps, kebab-case files, test IDs, the existing component-folder layout.
   - Leave out the commit flow (that becomes the `git-commit` skill) and personal tone preferences (those belong in each developer's User Rules).
10. **Folder skeleton:** create these with `.gitkeep` files where empty: `rules/{core,languages,frontend,mobile,backend,data,testing,devops,ai,cms-commerce,legacy}`, `skills`, `presets`, `security`, `templates/ci`, `evals`, `scripts`.
11. **`.gitignore`:** add `dist/` and `node_modules/`.
12. If `ROADMAP.md` or `implementation-prompts/` are untracked, include them in this commit.

Don't change the old root rule files in this prompt.

## Done when
All files above exist and are internally consistent, and the shared-context workflow steps 6–10 are complete. Skip the README catalog step if no rules exist yet, but add a short "Project status: being restructured, see ROADMAP.md" note under the README title.
