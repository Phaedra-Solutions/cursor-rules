---
id: devops/docker
title: Docker images and Compose
description: Dockerfile and Compose security - multi-stage builds, minimal or hardened base images pinned by digest, a non-root user, read-only filesystem and dropped capabilities, BuildKit secret mounts instead of ARG or ENV, .dockerignore, health checks, scanning with Trivy or Grype, signing with Cosign, and Compose rules (no privileged containers, no host Docker socket, no host networking); runc, containerd, BuildKit and Docker Engine advisories. Use when editing Dockerfiles, Compose files or .dockerignore.
applies_to: "any"
globs: ["**/Dockerfile*", "**/*.dockerfile", "compose*.y*ml", "docker-compose*.y*ml", "**/compose*.y*ml", "**/docker-compose*.y*ml", ".dockerignore"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://docs.docker.com/build/building/best-practices/
  - https://docs.docker.com/build/building/multi-stage/
  - https://docs.docker.com/build/building/secrets/
  - https://docs.docker.com/reference/dockerfile/#healthcheck
  - https://docs.docker.com/engine/security/
  - https://docs.docker.com/engine/security/rootless/
  - https://docs.docker.com/compose/how-tos/use-secrets/
  - https://docs.docker.com/dhi/
  - https://docs.docker.com/build/ci/github-actions/attestations/
  - https://docs.docker.com/engine/release-notes/29/
  - https://github.com/GoogleContainerTools/distroless
  - https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
  - https://docs.sigstore.dev/cosign/signing/signing_with_containers/
  - https://github.com/opencontainers/runc/security/advisories
  - https://github.com/containerd/containerd/security/advisories
  - https://osv.dev/vulnerability/GHSA-9493-h29p-rfm2
  - https://osv.dev/vulnerability/GHSA-cgrx-mc8f-2prm
  - https://osv.dev/vulnerability/GHSA-qw9x-cqr3-wc7r
  - https://osv.dev/vulnerability/GHSA-xjvp-4fhw-gc47
  - https://osv.dev/vulnerability/GHSA-pg57-6jwg-q645
  - https://osv.dev/vulnerability/GHSA-p7v4-vr35-mj6f
  - https://osv.dev/vulnerability/GHSA-7236-3392-c5c6
  - https://osv.dev/vulnerability/GHSA-x86f-5xw2-fm2r
  - https://osv.dev/vulnerability/GHSA-gv8h-7v7w-r22q
---

# Docker images and Compose

Secrets and dependency rules are in `core/security-baseline` and `core/supply-chain`; this rule adds container specifics. For Kubernetes manifests use `devops/kubernetes` when it exists.

## Version check

- Note the base images and tags, whether they're pinned by digest, the `# syntax=` line, and the Docker Engine, BuildKit and Compose versions in CI (`docker version`, `docker buildx version`, `docker compose version`). State them:

  ```text
  Applying devops/docker (2 Dockerfiles, node:24 base unpinned, multi-stage, Compose v5, Engine 29.9 in CI).
  ```

- Current (Oct 2026): Docker Engine 29.9.2, BuildKit 0.34.1, Compose 5.6.1, runc 1.5.2, containerd 2.4.2. Engine below 29.5.1 (including all of 28.x) is affected by the `docker cp` host-escape advisories below.

## Conventions

### Dockerfile

- Start with `# syntax=docker/dockerfile:1` so BuildKit features (secret and cache mounts) are available.
- **Multi-stage builds:** compile and install dev dependencies in a `build` stage; copy only the runtime artifacts into a minimal final stage.
- **Base images:** use the smallest image that runs the app: distroless, Chainguard, Docker Hardened Images, UBI micro, or a `-slim` / `alpine` variant when a shell is needed. Use the runtime's current LTS (for example Node 24, Python 3.13). Never `latest`.
- **Pin by digest** in production images, with the tag in a comment, and let Dependabot or Renovate update it:

  ```dockerfile
  FROM node:24-slim@sha256:<digest> AS build   # node:24-slim
  ```

  Get the real digest with `docker buildx imagetools inspect node:24-slim` (or `crane digest`); never invent one.
- **Layers:** copy lockfiles first and install with the frozen command (`npm ci`, `pnpm install --frozen-lockfile`, `uv sync --locked`), then copy the source. Use `RUN --mount=type=cache` for package caches instead of leaving them in the layer. Clean apt lists in the same `RUN`.
- **Non-root:** create or use an unprivileged user and switch to it before `CMD` (`USER 10001:10001`, or the image's `nonroot`/`node` user). Files the app only reads are owned by root and not writable by the app user.
- `COPY` over `ADD` (no remote URLs or auto-extraction). Use exec-form `CMD`/`ENTRYPOINT` (`["node", "server.js"]`) so signals reach the process; add an init (`--init` or `tini`) when the app spawns children.
- **Health checks:** `HEALTHCHECK` that hits a cheap readiness endpoint, with a timeout and interval; on distroless use a small binary or the orchestrator's probe instead of `curl`.
- **`.dockerignore`:** exclude `.git`, `.env*`, `node_modules`, build outputs, test data, keys, `*.pem` and local config, so they never enter the build context.
- Labels: `org.opencontainers.image.source`, `.revision`, `.version`.

### Secrets

- Never put secrets in `ARG`, `ENV`, `COPY`d files or the build context; they persist in layers and image history.
- Use BuildKit secret mounts for build-time secrets (private registries, package tokens):

  ```dockerfile
  RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
  ```

  ```sh
  docker buildx build --secret id=npmrc,src=$HOME/.npmrc .
  ```

- Runtime secrets come from the orchestrator or Compose `secrets:` (mounted files), not baked-in environment variables.

### Runtime hardening

- Run with a read-only root filesystem and explicit writable mounts (`tmpfs` for `/tmp`), all capabilities dropped (add back only what's needed, for example `NET_BIND_SERVICE`), `no-new-privileges`, and memory, CPU and PID limits.
- Keep the default seccomp and AppArmor/SELinux profiles; never `seccomp=unconfined`.
- Prefer rootless Docker or user-namespace remapping on shared hosts.

### Compose

```yaml
services:
  api:
    image: ghcr.io/acme/api@sha256:<digest>
    user: "10001:10001"
    read_only: true
    tmpfs: [/tmp]
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
    mem_limit: 512m
    pids_limit: 200
    secrets: [db_password]
    ports: ["127.0.0.1:8080:8080"]
    healthcheck:
      test: ["CMD", "/app/healthcheck"]
      interval: 30s
      timeout: 3s
      retries: 3
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

- Never `privileged: true`, never mount `/var/run/docker.sock` (it's root on the host), never `network_mode: host` or `pid: host` without a written reason.
- Bind published ports to `127.0.0.1` for local development; Docker's published ports bypass host firewalls like `ufw`.
- Databases and caches in Compose get passwords and no published ports unless needed.

## Security

- **Scan** every image in CI (Trivy or Grype) and fail on fixable critical and high findings; rebuild regularly so base-image patches land even when the app doesn't change.
- **Sign and attest:** sign release images with Cosign (keyless OIDC in CI) and attach SBOM and provenance attestations (`docker buildx build --sbom=true --provenance=mode=max`, or `actions/attest-build-provenance`). Verify signatures at deploy.
- Patch the host runtime: runc, containerd, BuildKit and Docker Engine releases fix container-escape bugs several times a year.
- Don't run untrusted images or Dockerfiles with custom frontends (`# syntax=` pointing at an unknown image) on shared builders.

## Known vulnerabilities (as of 2026-10)

| Advisory | Component | Fixed |
|---|---|---|
| CVE-2025-31133, CVE-2025-52565, CVE-2025-52881: container escape via mount races and procfs writes | runc | 1.2.8 / 1.3.3 / 1.4.0 |
| CVE-2026-41579: malicious image with a `/dev` symlink writes to the host filesystem | runc | 1.3.6 / 1.4.3 |
| CVE-2026-95837, CVE-2026-53493 and other 2026 CRI and image-pull advisories (security-context bypass, DoS) | containerd | 2.4.1+ (2.3.6 / 2.2.9 / 1.7.36 on older lines) |
| CVE-2026-61711: custom frontend bypasses seccomp/AppArmor; CVE-2026-33747: frontend file escape | BuildKit | 0.31.1 |
| CVE-2026-41567, CVE-2026-42306, CVE-2026-41568: `docker cp` and archive API races write to or run binaries on the host | Docker Engine | 29.5.1 (28.5.2 and older affected) |
| CVE-2025-62725: path traversal via OCI artifact layer annotations | Compose | 2.40.2 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Build the image in CI from a clean context and run the container with the hardened flags (read-only, `cap_drop: ALL`, non-root) in a smoke test, so hardening doesn't break at deploy.
- Check `docker history --no-trunc` (or the scanner's secret check) shows no secrets in layers.
- Check the health check fails when the app is unhealthy.

## Before you finish

```sh
docker buildx build --pull -t app:test .
docker run --rm --read-only --cap-drop=ALL --security-opt no-new-privileges --user 10001:10001 app:test --version
trivy image --exit-code 1 --severity CRITICAL,HIGH --ignore-unfixed app:test   # or: grype app:test --fail-on high
hadolint Dockerfile                      # if the project uses it
docker compose config --quiet            # Compose files parse
grep -nE "^(ARG|ENV) .*(TOKEN|SECRET|PASSWORD|KEY)" -r --include='Dockerfile*' .
```
