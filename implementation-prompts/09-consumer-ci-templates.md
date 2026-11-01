# Prompt 09: Security CI templates for consumer projects

> Self-contained; safe in a fresh session. Roadmap: §5.2, §5.6, §9.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §5.2 and §5.6.

## Task
These files are copied into client projects. Verify every action, tool version, flag and config key against official docs, and pin actions to real full SHAs that you look up.

1. **`templates/ci/github/security.yml`:** a GitHub Actions workflow with jobs for:
   - OSV-Scanner (prefer the official reusable workflow or action);
   - Semgrep CE;
   - gitleaks;
   - zizmor (GitHub Actions lint);
   - an optional Trivy filesystem/config scan.

   Use least-privilege `permissions` and SARIF upload where it's supported. Runs on pull_request, on push to main and weekly.
2. **`templates/ci/github/dependabot.yml`:** covers npm, pip, composer, gomod and github-actions, with a `cooldown` setting if Dependabot supports it (verify; otherwise leave a comment).
3. **Release-age cooldown snippets:**
   - `templates/package-managers/.npmrc` (`min-release-age`, `ignore-scripts` guidance);
   - `templates/package-managers/pnpm-workspace.yaml` (`minimumReleaseAge`, `minimumReleaseAgeExclude`, build-script allowlist);
   - `templates/package-managers/uv.toml` (or the `pyproject.toml` snippet; `exclude-newer` and the malware check);
   - notes for Yarn and Bun.

   Comment every setting with the minimum tool version it needs.
4. **`templates/ci/README.md`:** what each template does, how to copy it into a project, how to tune false positives, and how it maps to `core/supply-chain` and the `security-audit` skill.
5. **`templates/ci/gitlab/security.gitlab-ci.yml`:** a minimal GitLab equivalent (OSV-Scanner, Semgrep, gitleaks). Keep it short.

## Done when
Every template is valid (check YAML syntax; run `zizmor` on the workflow if it's available), all actions are pinned to real SHAs, and you've completed the shared-context workflow.
