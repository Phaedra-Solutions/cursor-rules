---
name: git-commit
description: Write and make a git commit. Inspects the changes with git, drafts a short dash-list message in present tense, shows it as plain text for approval, scans staged files for secrets, then commits. Use when the user asks to commit, write a commit message, or save their work to git.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-29"
  sources: "https://git-scm.com/docs/git-commit https://git-scm.com/docs/git-diff https://git-scm.com/docs/git-status https://github.com/gitleaks/gitleaks https://www.conventionalcommits.org/en/v1.0.0/"
---

# Git commit

## When to use

- The user asks you to commit, write a commit message, or "save this to git".

Never commit on your own initiative, even at the end of a task.

## Before you start

- Check the repo state with `git status --short` and the current branch with `git branch --show-current`.
- If changes are already staged, the commit covers only those. If nothing is staged, ask which files to include; never stage unrelated changes or files you didn't touch without asking.
- Check for a project commit convention (Conventional Commits, `commitlint.config.*`, a `CONTRIBUTING.md` section, a commit template). If one exists, follow it and keep the dash-list body below the required header. Otherwise use the format below.

## Steps

1. **Inspect the changes with git.** Read the actual diff, not just file names:

   ```sh
   git diff --staged --stat
   git diff --staged
   ```

   (Use `git diff` for unstaged changes the user wants to include, after they confirm.)
2. **Make notes** of what changed, grouped by intent rather than by file.
3. **Draft the message** as a dash list, one line per change:
   - concise, in present tense ("Add", "Fix", "Remove", not "Added" or "Adds");
   - focused on what changed, not how you did it;
   - short lines; keep the whole message small. Split unrelated work into separate commits instead of one long message.
4. **Show the message as plain text and ask for approval.** Show only the message, not the command:

   ```text
   - Add rate limiting to the login endpoint
   - Fix the empty-state message on the orders page
   - Remove the unused date helper
   ```

   Wait for the user to approve or edit it.
5. **Scan staged files for secrets** if gitleaks is installed (see `secrets-scan`):

   ```sh
   gitleaks git --staged --redact --no-banner -v
   ```

   If it finds anything, stop, tell the user what and where (never the value), and follow `secrets-scan`. If gitleaks isn't installed, check the diff yourself for keys, tokens, passwords, `.env` files and private keys, and say that you did a manual check.
6. **Commit** with the approved lines, one argument per line:

   ```sh
   printf '%s\n' "- Add rate limiting to the login endpoint" "- Fix the empty-state message on the orders page" | git commit -F -
   ```

   If a line contains `"`, `$` or a backtick, wrap that argument in single quotes instead. Add any trailer lines the project or tool requires (for example `Co-Authored-By:`) after an empty `""` argument.
7. **Report** the short commit hash and the subject line (`git log --oneline -1`).

## Verify

- `git log -1 --format=%B` shows exactly the approved message.
- `git status --short` shows only the changes the user chose to leave uncommitted.
- Hooks ran and passed. If a pre-commit hook failed, the commit didn't happen: fix the cause, re-stage, and ask again before retrying.

## Safety

- Never commit without the user's approval of the message.
- Never commit secrets, `.env` files, private keys or credentials. If the user insists, explain that anything committed must be treated as leaked, suggest a secret manager, and let them make that commit themselves.
- Never use `--no-verify`, `--amend` on pushed commits, `git commit -a` without confirming, or `git push`, unless the user explicitly asks.
- Never change git config, hooks or author identity.
