---
id: devops/github-actions
title: GitHub Actions
description: GitHub Actions workflow and action security - full-SHA pinning (look up the real SHA, never invent one), least-privilege permissions, OIDC for cloud access, safe triggers (pull_request_target, workflow_run and the Dec 2026 default block), injection-safe run steps, caches and artifacts, secrets in environments, reusable workflows, self-hosted runners, and linting with zizmor and actionlint. Use when editing .github/workflows/, .github/actions/ or action.yml.
applies_to: "any"
globs: [".github/workflows/**", ".github/actions/**", "action.yml", "action.yaml"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://docs.github.com/en/actions/reference/security/secure-use
  - https://docs.github.com/en/actions/concepts/security/openid-connect
  - https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
  - https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
  - https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
  - https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
  - https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available/
  - https://github.blog/changelog/2026-06-18-safer-pull_request_target-defaults-for-github-actions-checkout/
  - https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/
  - https://docs.zizmor.sh/
  - https://docs.zizmor.sh/audits/
  - https://github.com/rhysd/actionlint
  - https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction
  - https://github.com/zizmorcore/zizmor/releases
  - https://github.com/actions/checkout/releases
---

# GitHub Actions

Extends the CI basics in `core/supply-chain` (SHA pinning, `contents: read`, OIDC, `persist-credentials: false`, no untrusted `${{ }}` in `run:`). For consumer-project security workflows see `templates/ci/github/`.

## Version check

- Read every `uses:` line and note the action, the pinned ref and the version comment. State what you found:

  ```text
  Applying devops/github-actions (5 workflows; 2 actions pinned by tag, 1 reusable workflow unpinned; zizmor 1.31 available).
  ```

- Current versions (Oct 2026): `actions/checkout` v7.0.1, `actions/cache` v6.1.0, `actions/upload-artifact` v7.0.2, zizmor 1.31.1, actionlint 1.7.12. Use the latest release of each action unless the project pins an older major on purpose.
- `actions/checkout` v7 (backported to older majors from 20 Jul 2026) refuses to check out fork PR code in `pull_request_target` and `workflow_run`; the `allow-unsafe-pr-checkout` input turns that off and must be justified in review.

## Conventions

### Pinning

- Pin every action and reusable workflow you don't own to a full 40-character commit SHA with the version in a comment: `uses: actions/checkout@<sha> # v7.0.1`. Actions in the same repository (`./.github/actions/x`) don't need pins.
- **Look up the real SHA; never invent one.** A made-up or truncated SHA either fails or, worse, matches a commit in a fork network. Resolve the tag through the API and copy the result:

  ```sh
  gh api repos/actions/checkout/commits/v7.0.1 --jq .sha
  ```

  Check that the tag is a release published by the action's owner. If you can't look it up (no network), write a `<sha-of-owner/action-vX.Y.Z>` placeholder and tell the user to fill it in; never commit a guessed value.
- Prefer actions from GitHub, the cloud providers and well-known maintainers. Read the source of any small third-party action before adopting it; replacing a trivial action with a few lines of `run:` is often safer.
- Keep pins fresh with Dependabot or Renovate (`package-ecosystem: github-actions` with a cooldown) and turn on the repository or organization policy that requires SHA pinning.

### Workflow shape

- Top-level `permissions: contents: read` (or `{}`), widened per job only where a step needs it (`pull-requests: write`, `id-token: write`, `packages: write`).
- `timeout-minutes` on every job; `concurrency` groups for deploys so two runs can't race.
- One purpose per workflow (CI, release, deploy). Untrusted-input workflows (PRs, issues, comments) never share jobs with secret-using ones.
- Reusable workflows: call them by SHA, pass only the secrets they need by name (avoid `secrets: inherit`), and declare their `permissions`.

### Triggers

- PR checks use `pull_request`, which runs fork code without secrets and with a read-only token.
- Avoid `pull_request_target`, `workflow_run` and `issue_comment` for anything that touches PR code. If one is unavoidable, never check out or run the PR's code in it, keep permissions minimal, and gate it on a label or environment approval. GitHub's workflow execution protections (GA 17 Sep 2026) can restrict who and which events trigger workflows, and GitHub blocks `pull_request_target` by default on affected public repositories from **2 Dec 2026** unless a policy allows it.
- Comment-triggered commands (`/deploy`) check `github.event.comment.author_association` and the actor's permission before doing anything.

### Injection-safe `run:`

- Never place attacker-controllable expressions in `run:`, `script:` (`actions/github-script`) or `if:` strings that build commands: PR titles and bodies, branch and tag names, commit messages, issue and comment text, `github.head_ref`, inputs from `workflow_dispatch` or `repository_dispatch`. Pass them through `env:` and quote the variable (`"$TITLE"`).
- Don't write untrusted values into `$GITHUB_ENV`, `$GITHUB_OUTPUT` or `$GITHUB_PATH`; they become variables, outputs or executables for later steps.
- Use `set -euo pipefail` in multi-line bash steps.

### Secrets, OIDC and environments

- Cloud and registry access uses OIDC (`id-token: write` on that job only). Restrict the cloud trust policy to the repository and to a branch, tag or environment `sub` claim; never trust all of a GitHub organization or every ref.
- Production secrets live in an environment with required reviewers and branch protections, not in repository secrets.
- Never echo secrets, write them to files that get uploaded, or pass them to untrusted actions. Mask derived values with `::add-mask::`.
- Prefer short-lived tokens (GitHub App installation tokens, OIDC) over personal access tokens.

### Caches and artifacts

- Caches written by PR or untrusted workflows can be restored by others with the same key. Don't restore caches in release or deploy workflows, or scope keys so untrusted runs can't write them.
- Treat artifacts downloaded from another run (`workflow_run`) as untrusted input: never execute them or unzip them over the workspace without validation.
- Set short `retention-days` on artifacts that may contain logs or build output.
- Generate build provenance for release artifacts and images (`actions/attest-build-provenance`), and verify it on deploy.

### Runners

- Use GitHub-hosted runners for public repositories; never attach self-hosted runners to public repositories. Self-hosted runners for private repos are ephemeral (one job per runner) and isolated from production networks.

### ✓ Hardened workflow skeleton

Replace each `<sha-…>` with the SHA from `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<sha-of-actions/checkout-v7.0.1> # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@<sha-of-actions/setup-node-vX.Y.Z> # vX.Y.Z
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test
      - name: Report PR title
        if: github.event_name == 'pull_request'
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: printf 'Testing: %s\n' "$PR_TITLE"

  deploy:
    if: github.event_name == 'push'
    needs: test
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment: production
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@<sha-of-actions/checkout-v7.0.1> # v7.0.1
        with:
          persist-credentials: false
      - uses: aws-actions/configure-aws-credentials@<sha-of-aws-actions/configure-aws-credentials-v6.3.0> # v6.3.0
        with:
          role-to-assume: ${{ vars.DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}
      - run: ./scripts/deploy.sh
```

## Security

- Protect `.github/workflows/**` and `.github/actions/**` with CODEOWNERS and branch protection; workflow changes are security changes.
- Review new third-party actions like dependencies (`dependency-vet`); prefer pinning to a release you've read.
- When a pinned action is reported compromised, check whether your workflows ran it during the bad window, rotate every secret those jobs could read, and follow `incident-supply-chain`.
- Never disable `actions/checkout` protections (`allow-unsafe-pr-checkout: true`) or GitHub's event policies to make a workflow pass.

## Known vulnerabilities (as of 2026-10)

| Incident or advisory | Affected | Lesson |
|---|---|---|
| CVE-2025-30066: `tj-actions/changed-files` tag rewritten to dump CI secrets to logs (Mar 2025, CISA KEV); `reviewdog/action-setup` compromised in the same chain | Workflows pinned by tag | Pin by SHA; rotate secrets exposed in logs |
| "Pwn request" pattern: `pull_request_target` or `workflow_run` running fork code with secrets | Any repository | Use `pull_request`; checkout v7 blocks the common pattern; default block from 2 Dec 2026 |
| 2025–2026 npm and PyPI worms that injected workflow files to exfiltrate secrets | Repositories of compromised maintainers | See `core/supply-chain`; review unexpected workflow changes |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA (ecosystem "GitHub Actions") before relying on it.

## Testing

- Run zizmor and actionlint locally and in CI on every change to workflows or actions; fix findings rather than suppressing them, and justify any `# zizmor: ignore[...]` in the PR.
- For a new trigger or permission, describe in the PR what a malicious fork PR, issue or comment could do with it.
- Test deploy workflows against a staging environment first.

## Before you finish

```sh
zizmor .github/                        # or: uvx zizmor .github/
actionlint
grep -rnE "uses: [^ ]+@(v?[0-9]+(\.[0-9]+)*|main|master)$" .github/ | grep -v "uses: \./"   # unpinned third-party refs
grep -rnE "pull_request_target|workflow_run|allow-unsafe-pr-checkout|secrets: inherit" .github/workflows/
```
