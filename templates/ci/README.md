# Security CI templates

Templates to copy into client projects. They put the checks from `core/supply-chain` and the `security-audit` skill into CI, so they run on every pull request and not only when someone asks an agent.

Last verified: 2026-10-29. Every action is pinned to a full commit SHA and every container image to a digest. Versions younger than 7 days were skipped, to follow the project's own cooldown rule.

## What's here

| Template | Copy to | What it does |
|---|---|---|
| `github/security.yml` | `.github/workflows/security.yml` | OSV-Scanner, Semgrep CE, gitleaks, zizmor and optional Trivy, with SARIF upload to code scanning |
| `github/dependabot.yml` | `.github/dependabot.yml` | Weekly version updates for npm, pip, composer, gomod and GitHub Actions, with a 7-day cooldown |
| `gitlab/security.gitlab-ci.yml` | `ci/security.gitlab-ci.yml`, then `include:` it | OSV-Scanner, Semgrep CE (GitLab SAST report) and gitleaks |
| `../package-managers/.npmrc` | `.npmrc` | npm release-age cooldown and install-script policy |
| `../package-managers/pnpm-workspace.yaml` | merge into `pnpm-workspace.yaml` | pnpm cooldown, build-script allowlist, exotic-dependency block, trust policy |
| `../package-managers/.yarnrc.yml` | merge into `.yarnrc.yml` | Yarn 4 age gate and script policy |
| `../package-managers/bunfig.toml` | merge into `bunfig.toml` | Bun age gate |
| `../package-managers/uv.toml` | `uv.toml` (or `[tool.uv]` in `pyproject.toml`) | uv cooldown and OSV malware check |

Each package-manager file comments every setting with the minimum tool version it needs.

## GitHub workflow (`security.yml`)

Runs on pull requests, on pushes to `main` and weekly (Monday 04:17 UTC). Change `branches: [main]` if the default branch has another name. The workflow has no permissions at the top level; each job asks only for `contents: read`, plus `security-events: write` to upload SARIF (and `actions: read` for OSV-Scanner).

| Job | Tool | Notes |
|---|---|---|
| `osv-scanner` / `osv-scanner-pr` | Google's official OSV-Scanner reusable workflows (v2.7.0) | Full scan on push and schedule; on pull requests, only vulnerabilities the PR introduces |
| `semgrep` | `semgrep/semgrep` 1.181.0 container, `p/default` rules | `--metrics off`; on pull requests, only findings new since the base commit (`--baseline-commit`). Skipped for Dependabot PRs |
| `gitleaks` | gitleaks 8.30.1 release binary, SHA-256 checked | Scans the PR's commits on pull requests, full history otherwise. Uses the MIT CLI because `gitleaks-action` needs a license key for organization repos |
| `zizmor` | `zizmorcore/zizmor-action` v0.7.1 with zizmor 1.31.1 | Audits `.github/` workflows |
| `trivy` | `aquasecurity/trivy-action` v0.36.0 with Trivy v0.76.1 | Off by default; set the repository variable `ENABLE_TRIVY=true`. Cache disabled |

### Before you enable it

- **Code scanning:** SARIF upload works on public repositories. Private repositories need GitHub Code Security; without it, set the repository variable `UPLOAD_SARIF=false`. The jobs still fail on findings and print them in the log.
- **Forks:** pull requests from forks get a read-only token, so the workflow skips SARIF upload for them.
- **Trivy:** in March 2026 attackers force-pushed 76 of 77 `trivy-action` tags and published malicious Trivy 0.69.4–0.69.6 builds. The template pins v0.36.0 (an immutable release) by commit and sets the Trivy version explicitly. Check the Trivy advisories before you raise either.

### Updating pins

Keep the `github-actions` entry in `dependabot.yml`: Dependabot updates pinned SHAs and their version comments. To pin a new version by hand, resolve the tag to its commit (dereference annotated tags) and keep the version comment:

```sh
gh api repos/OWNER/REPO/git/ref/tags/vX.Y.Z --jq '.object.type + " " + .object.sha'
gh api repos/OWNER/REPO/git/tags/<sha> --jq .object.sha   # only if the type was "tag"
```

For container images, update the tag and the `@sha256:` digest together. For gitleaks, update `GITLEAKS_VERSION` and take `GITLEAKS_SHA256` from the release's `gitleaks_<version>_checksums.txt`.

## Dependabot (`dependabot.yml`)

- Delete the ecosystems the project doesn't use, and set `directory` (or `directories`) for monorepos.
- `cooldown` waits 7 days before proposing a new version (30 for majors). It applies to version updates only; Dependabot security updates still open immediately.
- `npm` also covers pnpm and Yarn lockfiles; `pip` covers Poetry, Pipenv and pip-compile. Add `package-ecosystem: uv` for uv projects.

## GitLab (`security.gitlab-ci.yml`)

Runs on merge requests, the default branch and scheduled pipelines, in the `test` stage. On merge requests, Semgrep and gitleaks only check changes since the merge-request base. Semgrep writes a GitLab SAST report, which shows up in the merge request where the GitLab tier supports it.

## Tuning false positives

Fix the finding when you can. When you can't, suppress it as narrowly as possible, with a reason and an expiry date, and get it reviewed like code.

| Tool | Narrow suppression |
|---|---|
| OSV-Scanner | `osv-scanner.toml` next to the lockfile: `[[IgnoredVulns]]` with `id`, `reason` and `effectiveUntil` |
| Semgrep | `# nosemgrep: <rule-id>` on the line; `.semgrepignore` for generated or vendored paths |
| gitleaks | `gitleaks:allow` comment on a test value, or the finding's fingerprint in `.gitleaksignore`. Never ignore a real secret; revoke it (see the `secrets-scan` skill) |
| zizmor | `# zizmor: ignore[<rule>]` on the line, or `rules.<id>.disable` in `zizmor.yml` |
| Trivy | `.trivyignore` with the advisory ID |

## How this maps to the rules and skills

| Rule or skill | Where the template enforces it |
|---|---|
| `core/supply-chain`: release-age cooldown | Package-manager snippets; Dependabot `cooldown` |
| `core/supply-chain`: install-script policy | `.npmrc`, `pnpm-workspace.yaml`, `.yarnrc.yml`, Bun `trustedDependencies` |
| `core/supply-chain`: CI hardening | SHA-pinned actions, per-job permissions, `persist-credentials: false`, no `pull_request_target`, untrusted values passed through `env:`; zizmor checks the project's own workflows |
| `core/security-baseline` (A01–A10) | Semgrep `p/default` |
| `security-audit` skill | The same scanners (OSV-Scanner, Semgrep, gitleaks, Trivy, zizmor) run on every change |
| `secrets-scan` skill | gitleaks job |
| `cve-check` skill | Use it to triage an OSV-Scanner finding before you fix or ignore it |
