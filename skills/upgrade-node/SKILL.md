---
name: upgrade-node
description: Upgrade a project's Node.js version to a supported LTS (24 or 26) - pick the target, update .nvmrc, engines, package-manager and type versions, CI matrices, Dockerfiles and deploy runtimes together, rebuild native modules, handle removed or changed APIs, and verify with tests and a production-image smoke test. Use when asked to upgrade Node, when legacy/node-legacy applies (Node 20 or older, or an odd-numbered line), or before Node 22 reaches EOL on 30 Apr 2027.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-29"
  sources: "https://nodejs.org/en/about/previous-releases https://endoflife.date/nodejs https://github.com/nodejs/release#release-schedule https://nodejs.org/en/blog/vulnerability/october-2026-security-releases https://nodejs.org/en/blog/migrations https://github.com/nodejs/userland-migrations https://docs.npmjs.com/cli/v11/configuring-npm/package-json#engines"
---

# Upgrade Node.js

## When to use

- The user asks to upgrade Node, or the project runs an EOL line (20 or older, or 25/23/21) — see `legacy/node-legacy`.
- Node 22 is in use and the user wants to move before its EOL on 30 Apr 2027.
- A dependency now requires a newer Node.

For a minor or patch update on a supported line, update the pins (step 3) and run Verify.

## Before you start

- List every place that pins Node, and note mismatches: `.nvmrc`, `.node-version`, `.tool-versions`, `volta`, `engines.node`, `packageManager`, Dockerfiles (`FROM node:…`), CI (`node-version:`, matrices), serverless and PaaS runtimes (`runtime: nodejs20.x`, `vercel.json`, buildpacks), and `@types/node`.
- List native and toolchain-sensitive dependencies: `bcrypt`, `sharp`, `canvas`, `sqlite3`/`better-sqlite3`, `node-sass`, `grpc`, anything with `binding.gyp` or `node-gyp`/`prebuild` in its install scripts (`npm ls --all | grep -E "gyp|prebuild"`).
- Working tree clean; new branch (`chore/node-26`).
- Ask the user:
  - the target: **Node 26** (Active LTS since 28 Oct 2026, EOL 30 Apr 2029; longest runway) or **Node 24** (Maintenance LTS, EOL 30 Apr 2028; more conservative). Default to 26 for apps, and for libraries keep `engines` as wide as the supported lines (`>=22`);
  - where it runs (containers, serverless, PaaS) and whether that platform offers the target runtime yet;
  - whether network installs are approved (`core/supply-chain` cooldown applies).

## Steps

1. **Baseline** on the current version: clean install, lint, typecheck, tests, build, and start the production image. Record failures; don't blame them on the upgrade later.
2. **Plan the hop.** Go straight to the target when tests are good and there are no unmaintained native modules. From 18 or older with native modules or old toolchains (Webpack 4, `node-sass`, Jest < 29), hop one LTS at a time (18 → 20 → 22 → 24/26) and fix each hop.
3. **Update all pins in one change:**
   - `.nvmrc` / `.node-version` / `.tool-versions` → the exact target (for example `26.13.0`);
   - `engines.node` → `>=26` for apps (or the supported range for libraries);
   - `@types/node` → the target major (`npm install -D @types/node@26`);
   - Dockerfiles → `node:26-slim@sha256:<digest>` (look up the real digest; see `devops/docker`);
   - CI → `node-version-file: .nvmrc` or the matrix of supported lines;
   - deploy runtimes → the platform's matching runtime identifier.
4. **Reinstall and rebuild:** delete `node_modules`, run the clean install, and run `npm rebuild` for native modules. Update native packages that have no prebuilt binaries for the new ABI to versions that do; replace unmaintained ones (`node-sass` → `sass`).
5. **Fix API changes.** Run the tests and read deprecation warnings (`node --trace-deprecation`). The Node.js userland migrations project publishes codemods for common removals; review their diffs. Typical items: removed or runtime-deprecated `util.is*`, `url.parse()` → `new URL()`, `Buffer()` constructor → `Buffer.from/alloc`, `fs.rmdir(…, { recursive })` → `fs.rm`, crypto defaults, and stricter TLS (old ciphers and certificates rejected).
6. **Tooling:** update the test runner, bundler and TypeScript if they don't support the new Node (Vitest 5 and Jest 30 support current LTS lines), and the package manager (`corepack` or the pinned `packageManager` version).
7. **Verify** (next section), show the diff and results, and wait for approval; commit only when asked (`git-commit` skill). Then use `languages/javascript-node`.

## Verify

```sh
node --version                         # the target, on every runner
npm ci
npm rebuild
npm run lint
npx tsc --noEmit                       # TypeScript projects
npm test
npm run build
npm audit --audit-level=moderate
grep -rnE "node-version|FROM node:|\"node\":|nodejs[0-9]+" .github/ Dockerfile* package.json .nvmrc serverless.y*ml vercel.json 2>/dev/null   # no old pins left
```

Then build the production image and start it: the app boots without native-module errors (`NODE_MODULE_VERSION` mismatch), key routes respond, background workers start, and TLS calls to external services succeed.

## Safety

- Never update only some pins; production and CI must run the same major.
- Never upgrade Node, a framework major and the module system in one change.
- Never skip a failing native module with `--ignore-scripts` or by deleting it; fix or replace it.
- Never disable TLS checks or deprecation errors to make the upgrade pass.
- Never auto-commit, push or deploy; never hand-edit the lockfile.
