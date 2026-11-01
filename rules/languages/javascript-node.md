---
id: languages/javascript-node
title: JavaScript on Node.js
description: Node.js 22, 24 and 26 LTS - ESM, node: imports, supported release lines and security releases, child_process without a shell, path traversal guards, crypto usage, timeouts on fetch and sockets, stream limits, process-level error handling and the permission model. Use when editing .js, .mjs or .cjs files or package.json in a Node.js project.
applies_to: "node >=22 <27"
legacy_rule: legacy/node-legacy
globs: ["**/*.{js,mjs,cjs}", "package.json"]
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
  - https://nodejs.org/api/permissions.html
  - https://nodejs.org/api/child_process.html
  - https://nodejs.org/api/path.html
  - https://nodejs.org/api/crypto.html
  - https://nodejs.org/api/globals.html#fetch
  - https://nodejs.org/api/process.html#event-unhandledrejection
  - https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require
  - https://nodejs.org/api/packages.html#subpath-imports
  - https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html
---

# JavaScript on Node.js

TypeScript projects also apply `languages/typescript`. Generic secure-coding rules are in `core/security-baseline`; dependency rules in `core/supply-chain`.

## Version check

- Read the Node version from `.nvmrc`, `.node-version`, `engines.node`, the Dockerfile and CI, and `node --version` if you can run it. State it:

  ```text
  Applying languages/javascript-node (Node 24.22 from .nvmrc, ESM, "type": "module").
  ```

- **Release lines (Oct 2026):**
  - **26** Active LTS since 28 Oct 2026 (maintenance from Oct 2027, EOL 30 Apr 2029);
  - **24** Maintenance LTS (EOL 30 Apr 2028);
  - **22** Maintenance LTS (EOL 30 Apr 2027) — note the date in the summary;
  - **20 and older, and odd-numbered lines (25, 23, …)** are EOL → use `legacy/node-legacy` and offer `upgrade-node`.
- **Minimum safe (21 Oct 2026 security release):** 26.12.1, 24.22.1, 22.23.4. It fixed a Brotli decoder out-of-bounds write (CVE-2026-111497) and TLS hostname-check bypasses (CVE-2026-105483, CVE-2026-106069).
- Use only APIs available in the lowest version in `engines`. Examples: the permission model is stable from 22.13; `require(esm)` works without a flag from 22.12 and 20.19.

## Conventions

- **ESM** for new packages (`"type": "module"`, `import`/`export`). Keep CommonJS in existing CommonJS packages; don't convert as part of another change. Don't mix `require` and `import` in one file.
- Import built-ins with the `node:` prefix (`import { readFile } from 'node:fs/promises'`).
- Prefer built-ins to dependencies: `fetch`, `AbortSignal.timeout`, `node:test`, `crypto.randomUUID()`, `structuredClone`, `util.parseArgs`, `--env-file` (instead of `dotenv` where it fits).
- Use `async`/`await` and the promise APIs (`node:fs/promises`, `node:timers/promises`). No synchronous fs calls in request paths.
- Internal path aliases: `package.json` `"imports"` (`#lib/*`), not bundler-only aliases, so Node resolves them at runtime.
- Read config once at startup from the environment, validate it with a schema, and fail fast on missing values.

## Security

### Processes

- Never pass user input to `exec`, `execSync` or `spawn(..., { shell: true })`. Use `execFile`/`spawn` with an argument array and no shell, an allowlisted command, and validated arguments; add `--` before user-supplied file names.

  ```js
  // ✓
  await execFile('git', ['log', '--format=%H', '--', userPath], { timeout: 10_000 });
  // ✗
  exec(`git log ${userPath}`);
  ```

- Never `eval`, `new Function`, `vm.runInNewContext` on untrusted input (`node:vm` is not a security boundary).

### Files and paths

- Resolve user-supplied paths against a fixed base and check the result stays inside it:

  ```js
  const base = path.resolve(UPLOAD_DIR);
  const target = path.resolve(base, userName);
  if (target !== base && !target.startsWith(base + path.sep)) throw new Error('invalid path');
  ```

- Reject NUL bytes and absolute paths in names; use `fs.realpath` when symlinks could point outside the base. Generate stored file names yourself (`crypto.randomUUID()`); never trust upload names.

### Crypto

- Randomness: `crypto.randomBytes`, `crypto.randomUUID`, `crypto.randomInt`; never `Math.random` for tokens or IDs.
- Passwords: `crypto.scrypt` (or argon2/bcrypt libraries the project uses) with a per-user salt; compare secrets with `crypto.timingSafeEqual` on equal-length buffers.
- Encryption: AES-256-GCM with a unique 12-byte IV per message and the auth tag stored; never ECB, never reuse an IV with the same key. Hashing: SHA-256 or better; never MD5 or SHA-1 for security.
- Don't disable TLS verification (`NODE_TLS_REJECT_UNAUTHORIZED=0`, `rejectUnauthorized: false`).

### Network and resources

- Every outbound request has a timeout: `fetch(url, { signal: AbortSignal.timeout(5_000) })`; set timeouts on sockets, database pools and HTTP servers (`server.requestTimeout`, `server.headersTimeout`).
- Cap sizes when reading bodies, streams, archives and JSON; don't buffer unbounded input into memory. Use `stream.pipeline` so errors and backpressure are handled.
- Validate outbound URLs built from user input (allowlisted hosts, no private or metadata addresses) to prevent SSRF.
- Prototype pollution: don't merge untrusted objects into plain objects with recursive merges; use `Object.create(null)` or `Map` for keyed data, and reject `__proto__`, `constructor` and `prototype` keys.

### Process-level handling

- Handle `unhandledRejection` and `uncaughtException` by logging and exiting with a non-zero code (the default since Node 15 for rejections); let the supervisor restart the process. Never swallow them and keep serving.
- Handle `SIGTERM`: stop accepting connections, finish in-flight work with a deadline, close pools, then exit.

### Permission model

- For CLIs, build scripts and workers that only need limited access, run with `node --permission` plus the needed `--allow-fs-read`, `--allow-fs-write`, `--allow-child-process` and `--allow-worker` flags. It's a seat belt for trusted code, not a sandbox for malicious code; keep Node patched (two permission-model bypasses were fixed in Oct 2026).

## Known vulnerabilities (as of 2026-10)

| Release | Highest-severity fixes | Fixed in |
|---|---|---|
| 21 Oct 2026 | CVE-2026-111497 Brotli out-of-bounds write (RCE); CVE-2026-105483, CVE-2026-106069 TLS hostname bypasses; CVE-2026-105482 `dns.resolve` NUL truncation | 26.12.1 / 24.22.1 / 22.23.4 |
| 29 Jul, 18 Jun and 24 Mar 2026 | Earlier 2026 security releases | Included in the versions above |
| Node 20 and older | No fixes after 30 Apr 2026 (last release 20.20.2) | Upgrade to 24 or 26 |

This list goes stale; verify with the `cve-check` skill, OSV/GHSA or the Node.js vulnerability blog before relying on it.

## Testing

- Use the project's runner (`node:test`, Vitest or Jest; see `testing/unit-js`).
- Test path guards with `../`, encoded traversal, absolute paths and symlinks; test that command wrappers reject shell metacharacters and option injection (`--upload-pack=…`).
- Test graceful shutdown and that an unhandled rejection exits non-zero.

## Before you finish

```sh
node --version                       # at or above the minimum safe version for its line
npm run lint
npm test                             # or: node --test
npm audit --audit-level=moderate
grep -rnE "child_process.*exec\(|shell: ?true|eval\(|new Function\(" --include='*.js' --include='*.mjs' --include='*.cjs' src lib 2>/dev/null
```
