---
name: secrets-scan
description: Scan staged changes, the working tree or git history for leaked secrets with gitleaks, and guide the user through revoking and rotating anything found, then optionally removing it from history. Use before a commit, when asked to check for secrets or leaked keys, after a secret was pasted or committed, or as part of a security audit.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-29"
  sources: "https://github.com/gitleaks/gitleaks https://raw.githubusercontent.com/gitleaks/gitleaks/master/cmd/git.go https://raw.githubusercontent.com/gitleaks/gitleaks/master/cmd/root.go https://github.com/newren/git-filter-repo https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation https://docs.npmjs.com/revoking-access-tokens"
---

# Secrets scan

## When to use

- Before a commit (the `git-commit` skill calls this on staged files).
- When the user asks to check for secrets, keys or credentials.
- After a secret was pasted into code, a log, an issue or chat, or committed by mistake.
- As part of `security-audit`, which only scans the working tree; this skill also covers history.

## Before you start

- Check that gitleaks is installed: `gitleaks version`. If it isn't, ask before installing it, and install only from the official source (package manager or the GitHub releases page).
- Agree the scope with the user: staged changes (default), the working tree, a commit range, or the full history. A full-history scan can be slow on large repos.
- Never print, echo or paste a secret value, even partly. Always pass `--redact` so gitleaks hides values in its output.
- Don't write a report file into the repo. If the user wants one, write it outside the working tree with `--redact` and delete it when done.

## Steps

1. **Run the scan for the agreed scope** (from the repo root):

   | Scope | Command |
   |---|---|
   | Staged changes | `gitleaks git --staged --redact --no-banner -v` |
   | Unstaged changes | `gitleaks git --pre-commit --redact --no-banner -v` |
   | Working tree (all files, tracked or not) | `gitleaks dir . --redact --no-banner -v` |
   | A commit range | `gitleaks git --log-opts="origin/main..HEAD" --redact --no-banner -v` |
   | Full history | `gitleaks git . --redact --no-banner -v` |

   Exit code 1 means leaks were found; 0 means none. Respect an existing `.gitleaks.toml` and `.gitleaksignore`.
2. **Triage each finding.** For each one, note the rule ID, file, line, commit (for history scans) and author. Decide:
   - **Real secret:** go to step 3.
   - **Test fixture or example value:** confirm it grants no access, then suggest a `gitleaks:allow` comment on that line, or a fingerprint in `.gitleaksignore`. Ask the user first; never add an ignore on your own.
   - **False positive:** same as above, with the reason.
3. **Contain a real secret.** Explain to the user, in this order:
   1. **Revoke or rotate it first,** at the provider (cloud console, GitHub token settings, `npm token revoke`, the API vendor's dashboard). A secret that reached a remote, a CI log, a package or chat is compromised even after it's deleted. Removing it from history doesn't make it safe.
   2. **Check for misuse:** review the provider's access logs for the period since the leak.
   3. **Replace it** with a reference to an env var or secret manager (`process.env.STRIPE_SECRET_KEY`, a CI secret, a vault). Add the file to `.gitignore` if it's a local config file.
   4. **Remove it from the code** in a normal commit.
4. **Only if the user asks, rewrite history.** Explain the cost first:
   - every commit hash after the first affected commit changes;
   - a force-push is required, and every collaborator must re-clone or rebase; forks, open PRs, caches and existing clones keep the old data;
   - on GitHub, cached views and PR refs may need GitHub Support to purge.

   With the user's consent, work in a fresh clone and use git-filter-repo (≥ 2.47 for `--sensitive-data-removal`):

   ```sh
   git filter-repo --sensitive-data-removal --invert-paths --path config/secrets.yml
   # or replace the literal values listed one per line in a file kept outside the repo:
   git filter-repo --sensitive-data-removal --replace-text ../expressions.txt
   ```

   The user runs the force-push; never run it yourself.
5. **Prevent recurrence.** Suggest gitleaks as a pre-commit hook or CI step, and GitHub secret scanning with push protection where available. Ask before adding hooks or workflows (see `core/agent-safety`).

## Verify

- Re-run the same scan; it must report no leaks (or only approved, documented ignores).
- The user has confirmed the secret is revoked at the provider. Rewriting history isn't a substitute.
- If history was rewritten: `gitleaks git . --redact --no-banner` on a fresh clone of the remote finds nothing.

## Safety

- Never print a secret's value, in full or in part, in chat, files, commit messages or logs.
- Never send a secret to an external service to "check" it.
- Never rewrite history or force-push without explicit consent; never force-push yourself.
- Never add `.gitleaksignore` entries or `gitleaks:allow` comments without the user's approval.
- Never disable push protection or a secret-scanning hook to get a commit through.
