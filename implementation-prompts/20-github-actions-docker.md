# Prompt 20: GitHub Actions and Docker

> Self-contained; safe in a fresh session. Roadmap: §5.2, §7 (`devops/github-actions`, `devops/docker`).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §5.2 and the §7 entries `devops/github-actions` and `devops/docker`.
3. Research:
   - GitHub Actions security hardening docs; workflow execution protections and the `pull_request_target` changes (dates);
   - OIDC; zizmor and actionlint;
   - Docker build best practices; BuildKit secrets;
   - hardened and distroless images; runc/containerd CVEs; Cosign.

## Task
1. **`rules/devops/github-actions.md`:**
   - tier P0; globs `.github/workflows/**`, `.github/actions/**`, `action.yml`;
   - SHA pinning, explained as "look up the real SHA; never invent one";
   - `permissions`; OIDC; trigger safety; injection-safe `run:`; caches; secrets in environments; reusable workflows;
   - lint with zizmor and actionlint.
   - Include a ✓ hardened workflow skeleton with placeholder SHAs, plus the instruction to look them up.
2. **`rules/devops/docker.md`:**
   - tier P1; globs `**/Dockerfile*`, `**/*.dockerfile`, `compose*.y*ml`, `docker-compose*.y*ml`, `.dockerignore`;
   - multi-stage builds; base-image choice; digest pinning; a non-root user; read-only filesystem and dropped capabilities;
   - BuildKit secret mounts; health checks;
   - scanning and signing; Compose security notes (no privileged containers, no host Docker socket).

## Done when
Both rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
