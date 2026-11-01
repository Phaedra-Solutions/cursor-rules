---
id: core/supply-chain
title: Supply chain
description: Always-on dependency, lockfile, install-script, CI and publishing rules that block typosquats, hallucinated packages and compromised releases.
applies_to: "any"
globs: []
alwaysApply: true
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://github.com/cosai-oasis/project-codeguard
  - https://docs.npmjs.com/cli/v12/using-npm/config
  - https://github.com/npm/cli/releases/tag/v11.10.0
  - https://github.com/npm/cli/releases/tag/v12.0.0
  - https://pnpm.io/settings/dependency-resolution
  - https://pnpm.io/blog/releases/11.0
  - https://yarnpkg.com/configuration/yarnrc
  - https://github.com/yarnpkg/berry/releases/tag/%40yarnpkg%2Fcli%2F4.10.0
  - https://bun.com/docs/runtime/bunfig
  - https://bun.com/docs/pm/lifecycle
  - https://docs.astral.sh/uv/reference/settings/
  - https://github.com/astral-sh/uv/releases/tag/0.9.17
  - https://github.com/astral-sh/uv/releases/tag/0.11.31
  - https://docs.github.com/en/actions/reference/security/secure-use
  - https://docs.github.com/en/actions/concepts/security/openid-connect
  - https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available/
  - https://github.blog/changelog/2026-06-18-safer-pull_request_target-defaults-for-github-actions-checkout/
  - https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/
  - https://docs.npmjs.com/trusted-publishers/
  - https://docs.pypi.org/trusted-publishers/
  - https://docs.npmjs.com/cli/v12/commands/npm-sbom
  - https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act
  - https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/
  - https://github.com/axios/axios/issues/10636
  - https://thehackernews.com/2026/05/mini-shai-hulud-worm-compromises.html
  - https://www.microsoft.com/en-us/security/blog/2026/08/04/chaindrop-supply-chain-compromise-anatomy-self-propagating-worm/
  - https://docs.litellm.ai/blog/security-update-march-2026
  - https://docs.litellm.ai/blog/security-incident-oct-21-2026
  - https://www.theregister.com/security/2026/10/26/worm-armed-42-github-repos-by-hiding-a-payload-too-big-to-fail/5305570
---

# Supply chain

Covers OWASP Top 10:2025 A03. Stack rules add the ecosystem's audit command. For a full package check use the `dependency-vet` skill; for a suspected compromise use the `incident-supply-chain` skill.

## Adding dependencies

- Never invent a package. Before naming or adding one, confirm it exists on the official registry under exactly that name. If you aren't sure it exists, say so.
- Ask before adding any dependency. Prefer the standard library or a package already installed.
- Before adding, check: age and release history, maintainers, weekly downloads, a linked source repository that matches, install scripts, and open advisories. Reject look-alike names (typosquats) and packages first published in the last few days.
- Never add a dependency from a URL, git branch or tarball unless the user asks. Pin it to an exact commit or version.

## Lockfiles

- Commit the lockfile. Never delete or regenerate it to fix a conflict; resolve the conflict.
- Install in CI with the frozen command: `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`, `bun install --frozen-lockfile`, `uv sync --locked`, `pip install --require-hashes -r requirements.txt`, `composer install`, Bundler with `bundle config set frozen true`.

## Release-age cooldown

Most malicious versions are found and pulled within days, so don't install versions younger than about 7 days. Keep the project's setting if it already has one; add exclusions only for packages the user names.

```ini
# .npmrc — npm ≥ 11.10.0, in days
min-release-age=7
```

```yaml
# pnpm-workspace.yaml — pnpm ≥ 10.16, in minutes (default 1440 since pnpm 11)
minimumReleaseAge: 10080
```

```yaml
# .yarnrc.yml — Yarn ≥ 4.10.0 (default 1 day since 4.15.0)
npmMinimalAgeGate: "1w"
```

```toml
# bunfig.toml — Bun ≥ 1.3, in seconds
[install]
minimumReleaseAge = 604800
```

```toml
# pyproject.toml — uv ≥ 0.9.17 for durations; malware-check needs uv ≥ 0.11.31
[tool.uv]
exclude-newer = "7 days"

[tool.uv.audit]
malware-check = true
```

## Install scripts

- Don't let dependencies run install scripts unless they are reviewed and allowlisted:
  - npm ≥ 12 blocks dependency lifecycle scripts by default; approve with `npm install-scripts approve <pkg>` (recorded in `package.json` `allowScripts`) and set `strict-allow-scripts=true` to fail on unreviewed ones;
  - pnpm doesn't run them by default; allowlist with `allowBuilds` (pnpm ≥ 11) or `onlyBuiltDependencies` (pnpm 10);
  - Yarn: keep `enableScripts: false` (the default);
  - Bun: list only needed packages in `trustedDependencies`;
  - older npm: use `--ignore-scripts` where the project still builds.
- Treat a new `preinstall`, `install` or `postinstall` script in a dependency update as a red flag; report it.

## CI hardening (GitHub Actions)

- Pin every third-party action to a full commit SHA, with the version in a comment.
- Set `permissions: contents: read` at the top level; grant more per job only where needed.
- Use OIDC for cloud and registry access instead of long-lived secrets.
- Don't use `pull_request_target` or `workflow_run` with untrusted code. GitHub disables `pull_request_target` by default for affected public repositories from 2 Dec 2026, and `actions/checkout` v7 refuses to check out fork code in those events.
- Set `persist-credentials: false` on checkout.
- Never put untrusted `${{ }}` expressions (PR titles, branch names, issue bodies) directly in `run:`; pass them through `env:`.

```yaml
permissions:
  contents: read
steps:
  - uses: actions/checkout@<full-commit-sha> # v7.x.y
    with:
      persist-credentials: false
  - run: echo "$PR_TITLE"
    env:
      PR_TITLE: ${{ github.event.pull_request.title }}
```

## Publishing

- Publish from CI with trusted publishing (OIDC) on npm and PyPI, with provenance. Never publish from a laptop or with a long-lived token. npm revoked classic tokens on 9 Dec 2025; granular write tokens expire within 90 days.
- Require 2FA for maintainers. Protect release branches and tags.

## SBOM

- Generate a CycloneDX or SPDX SBOM in CI for every release (`npm sbom --sbom-format cyclonedx`, or the ecosystem's CycloneDX tool) and keep it with the release artifacts.
- EU Cyber Resilience Act: reporting of actively exploited vulnerabilities applies from 11 Sep 2026 (early warning within 24 hours); the main obligations, including SBOMs, apply from 11 Dec 2027.

## Suspected compromise

If a dependency, action or tool you use is reported compromised, or you see the signs, stop and tell the user. Then:

1. Stop all installs and CI runs that resolve dependencies. Don't run the package's scripts.
2. Find the affected versions in the lockfile and in CI logs for the exposure window.
3. Rotate every credential the machine or runner could reach: npm, PyPI, GitHub, cloud, AI-provider and database tokens.
4. Look for persistence: new or changed workflow files, git hooks, AI-assistant hook or rule files (`.cursor/`, `.claude/`), `postinstall` scripts, `.pth` files, unknown repos created under the user's account.
5. Pin to the last known-good version and reinstall from a clean lockfile.
6. Follow the `incident-supply-chain` skill.

Recent examples (as of 2026-10): npm — Shai-Hulud (Sep and Nov 2025), axios (31 Mar 2026), Mini Shai-Hulud (May 2026; TanStack and 160+ packages), ChainDrop (Aug 2026; hundreds of packages), Miasma (disclosed Oct 2026; plants AI-assistant hooks). PyPI — LiteLLM (24 Mar 2026 and 21 Oct 2026). This list goes stale; check OSV and GHSA.
