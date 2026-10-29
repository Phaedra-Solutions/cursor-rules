---
id: legacy/node-legacy
title: Node.js 20 and older, and non-LTS lines
description: Safe maintenance on end-of-life Node.js (20 and older, and odd-numbered lines such as 25 and 23) and on Node 22 as it nears EOL - support dates, what the last releases miss, API limits to respect, CommonJS handling, compensating controls, and the migration path to Node 24 or 26 LTS. Use when .nvmrc, engines, Docker images or CI pin Node below 22 or a non-LTS line.
applies_to: "node >=12 <22"
globs: [".nvmrc", ".node-version", "package.json", "**/Dockerfile*", ".github/workflows/**"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://nodejs.org/en/about/previous-releases
  - https://endoflife.date/nodejs
  - https://github.com/nodejs/release#release-schedule
  - https://nodejs.org/en/blog/vulnerability
  - https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
  - https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require
  - https://nodejs.org/api/permissions.html
  - https://www.herodevs.com/support/node-nes
---

# Node.js 20 and older, and non-LTS lines

Also apply `core/legacy-mode` and the Security section of `languages/javascript-node`; process, path, crypto and timeout rules don't depend on the version.

## Version check

- Read the version from `.nvmrc`, `.node-version`, `engines.node`, `volta`, Dockerfiles (`FROM node:…`) and CI (`node-version:`), and note any mismatch between them. State it:

  ```text
  Applying legacy/node-legacy (Node 20.20.2 in Dockerfile, 18 in CI, engines ">=16", CommonJS).
  ```

- **Status (Oct 2026):**

  | Line | Status | Last release |
  |---|---|---|
  | 25 | EOL 1 Jun 2026 (odd line, never LTS) | 25.9.0 |
  | 22 | Maintenance LTS, **EOL 30 Apr 2027** (use `languages/javascript-node`, but plan the move) | 22.23.4 |
  | 20 | EOL 30 Apr 2026 | 20.20.2 (24 Mar 2026) |
  | 18 | EOL 30 Apr 2025 | 18.20.8 |
  | 16 and older | EOL | — |

- EOL lines missed the June, July and October 2026 security releases (including a Brotli out-of-bounds write and TLS hostname-check bypasses). Report the line as unsupported in the summary and offer `upgrade-node`. Commercial extended support exists (HeroDevs NES) if the user can't upgrade yet.

## Conventions

- Write code that runs on the oldest version the project supports; check `engines` before using newer APIs:
  - Node 20: `require(esm)` only from 20.19; permission model experimental (`--experimental-permission`); no `fs.glob`.
  - Node 18: no `--env-file` (20.6+) or `import.meta.dirname` (20.11+); global `fetch` is still experimental.
  - Node 16 and older: no global `fetch`; `structuredClone` only from 17.
- Keep the project's module system. Most legacy apps are CommonJS; don't convert to ESM without a plan.
- Don't add dependencies whose `engines` exclude the project's Node version; many current packages (`cookie` 2, `@testing-library/jest-dom` 7, Vitest 5, Cypress 16) need Node 22+.
- Pin the exact version in one place and make the others match (Dockerfile, CI, `.nvmrc`), so production doesn't run a different Node than tests.

## Safe maintenance

- Stay on the last release of the line (20.20.2, 18.20.8); nothing newer will come.
- Compensating controls while on an EOL line:
  - put a patched reverse proxy (TLS termination, body-size and decompression limits) in front of the app;
  - avoid decompressing untrusted Brotli or gzip in-process; let the proxy do it;
  - validate TLS peer identities explicitly for outbound mTLS or pinned services;
  - keep dependencies patched; `npm audit` still applies to packages.
- Set a dated upgrade plan in the summary; EOL Node blocks dependency upgrades over time.

## Security

- Every rule in the Security section of `languages/javascript-node` applies (no shell with user input, path guards, crypto, timeouts, process handlers).
- Don't disable TLS verification to work around old CA bundles; update the CA bundle or the image instead.
- Container images on EOL Node (`node:18`, `node:20`) stop getting OS patches too; scan them (see `devops/docker`).

## Known vulnerabilities (as of 2026-10)

| Release | Affects | Fixed only in |
|---|---|---|
| 21 Oct 2026: CVE-2026-111497 Brotli OOB write (RCE), CVE-2026-105483 / CVE-2026-106069 TLS hostname bypasses and 7 more | All lines; 20 and older not patched | 26.12.1 / 24.22.1 / 22.23.4 |
| 29 Jul and 18 Jun 2026 security releases | 20 and older not patched | Supported lines |

This list goes stale; verify with the `cve-check` skill or the Node.js vulnerability blog before relying on it.

## Migration path

1. Pick the target: Node 24 (Maintenance LTS, EOL Apr 2028) for conservative upgrades, or Node 26 (Active LTS, EOL Apr 2029) for the longest runway. From 20 or older, go to 22 first only if a dependency blocks 24.
2. Use the `upgrade-node` skill: one major at a time when native modules or old toolchains are involved, otherwise straight to the target with full tests.
3. Update `.nvmrc`, `engines`, Dockerfiles, CI matrices and deploy runtimes together.
4. Rebuild native modules, run the full suite, and smoke-test the production image.

## Testing

- Run the test suite on both the current and the target Node version in CI during the migration.
- Add a CI check that `.nvmrc`, `engines` and the Dockerfile agree.

## Before you finish

```sh
node --version
grep -rnE "node-version|FROM node:|\"node\":" .github/ Dockerfile* package.json .nvmrc 2>/dev/null   # every place that pins Node
npm test
npm audit --audit-level=moderate
```
