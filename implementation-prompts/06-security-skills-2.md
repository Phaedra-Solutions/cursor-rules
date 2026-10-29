# Prompt 06: Security skills 2: secrets-scan, threat-model-lite, incident-supply-chain, git-commit

> Self-contained; safe in a fresh session. Roadmap: Phase 1, §5.2, §5.7, §7 (core/behavior).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` (§5 is the skill format) and follow it.
2. Read `ROADMAP.md` §5.2 (the "Suspected compromise" bullet) and §5.7.
3. Read the "Rules for making commit messages" section of the root `global-rules.md`. If the file is a stub, skip this step and use the rules described below.

## Task
1. **`skills/secrets-scan/SKILL.md`:**
   - run gitleaks on the staged diff, the working tree and (when asked) the full history; verify its current CLI syntax first;
   - when something leaks, guide the user through rotation: revoke first, then remove it from history only with the user's consent (`git filter-repo`), and warn that force-pushing affects collaborators;
   - never print a secret's value back to the user.
2. **`skills/threat-model-lite/SKILL.md`:**
   - a 10-minute STRIDE pass for a new feature;
   - inputs: a feature description and data flows;
   - output: a table of assets, entry points, abuse cases, the required controls (each mapped to an OWASP Top 10:2025 category), and tests to add.
3. **`skills/incident-supply-chain/SKILL.md`:**
   - steps for a suspected compromised dependency: stop installs and CI, identify affected versions in the lockfiles, check for injected `.github/workflows` files and unexpected `postinstall` scripts;
   - rotate npm, GitHub, cloud and AI-provider tokens; pin to known-good versions;
   - report to the registry; write a timeline.
   - Include example patterns from recent worms (Shai-Hulud family and later; re-verify).
4. **`skills/git-commit/SKILL.md`**, ported from the team's existing commit rules:
   - inspect the changes with git;
   - write a dash-list message: concise, present tense, one line per change;
   - show the message as plain text, without the command, and ask for approval;
   - then commit with `printf '%s\n' "- change 1" "- change 2" | git commit -F -`;
   - never commit secrets; run `secrets-scan` on staged files first if gitleaks is available.

## Done when
All four skills follow the Agent Skills format, and you've completed the shared-context workflow.
