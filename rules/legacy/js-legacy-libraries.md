---
id: legacy/js-legacy-libraries
title: Maintenance-mode and deprecated JavaScript libraries
description: Recognizing and safely using JavaScript libraries that are in maintenance mode or deprecated - Bull (maintenance, last release 4.16.5) vs BullMQ 6, Moment.js and moment-timezone (maintenance mode; CVE-2026-17495 fixed in 2.31.0) vs Temporal (Chrome/Edge 144, Firefox 139, Node 26, Deno 2.7, Bun 1.4; not yet in stable Safari, so polyfill), date-fns, Day.js or Luxon, and deprecated packages such as request, node-sass, TSLint, babel-eslint, Protractor, istanbul and querystring - how to spot them (npm deprecation notices, last release date, README status), rules for keeping them, and replacements. Use when package.json depends on one of these or when adding a date, queue, HTTP or tooling library.
applies_to: "any"
globs: ["package.json", "**/package.json"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://github.com/OptimalBits/bull
  - https://docs.bullmq.io/
  - https://www.npmjs.com/package/bullmq
  - https://momentjs.com/docs/
  - https://osv.dev/vulnerability/GHSA-4p3w-j4w9-5jqw
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
  - https://github.com/mdn/browser-compat-data/tree/main/javascript/builtins/Temporal
  - https://www.npmjs.com/package/temporal-polyfill
  - https://www.npmjs.com/package/@js-temporal/polyfill
  - https://github.com/request/request/issues/3142
  - https://www.npmjs.com/package/node-sass
  - https://www.npmjs.com/package/tslint
---

# Maintenance-mode and deprecated JavaScript libraries

Also apply `core/legacy-mode` and `core/supply-chain`. NestJS projects with Bull queues also follow `legacy/nestjs-legacy`; jQuery is in `legacy/jquery`. Don't replace a library as part of an unrelated task.

## Version check

- Read the library and version from the lockfile and check its status before advising:
  - `npm view <pkg> deprecated` (an npm deprecation notice is definitive);
  - last release date (`npm view <pkg> time --json`) and the README's project status section;
  - open advisories (`npm audit`, OSV).
  State it:

  ```text
  Applying legacy/js-legacy-libraries (moment 2.29.4 in maintenance mode, bull 4.16.5 in maintenance mode, node-sass 9.0.0 deprecated).
  ```

## Conventions

- **Keeping a maintenance-mode library is fine** when it works and has no unfixed advisories; stay on its latest release, don't add new usages, and record the replacement plan.
- **Deprecated packages** (npm `deprecated` set) get no fixes; replace them when you next touch that area or when an advisory appears.
- For new code, pick the replacement below; don't add a second library for the same job alongside the old one without a migration plan.

## Library status and replacements

| Library | Status (Oct 2026) | Use instead |
| --- | --- | --- |
| `bull` | Maintenance mode (bug fixes only); last release 4.16.5 (Dec 2024) | `bullmq` 6 (`@nestjs/bullmq` in NestJS) |
| `moment`, `moment-timezone` | Maintenance mode since 2020; still patched (moment 2.31.0, Sep 2026) | `Temporal` (with a polyfill where needed), `date-fns` 4, Day.js or Luxon |
| `request`, `request-promise` | Deprecated (2020) | `fetch` (Node 18+), `undici`, `ky` or `axios` |
| `node-sass` | Deprecated | `sass` or `sass-embedded` |
| `tslint` | Deprecated | ESLint with `typescript-eslint` |
| `babel-eslint` | Deprecated | `@babel/eslint-parser` |
| `protractor` | Deprecated, end of life 2023 | Playwright or Cypress (`testing/playwright`, `testing/cypress`) |
| `istanbul` | Deprecated | `c8` or `nyc`, or the test runner's coverage (Vitest, Jest) |
| `querystring` (npm package and Node module) | Legacy | `URLSearchParams` |
| `left-pad` and similar micro-packages | Deprecated | built-ins (`String.prototype.padStart`) |

## Security

- **Bull:** a failing processor must throw (or reject) so retries happen; keep Redis private with auth and TLS; don't put secrets or personal data in job payloads (they sit in Redis); set `removeOnComplete`/`removeOnFail` limits. When moving to BullMQ, drain the Bull queue first; the two store jobs differently, so never share a queue name.
- **Moment:** update to **2.31.0+** (CVE-2026-17495, path traversal via a crafted non-string locale name) and never pass user input to `moment.locale()` without an allowlist; older ReDoS fixes (CVE-2022-31129, CVE-2017-18214) need 2.29.4+. Parse user dates with an explicit format (`moment(input, 'YYYY-MM-DD', true)`), not free-form parsing.
- **Temporal:** native in Chrome/Edge 144+, Firefox 139+, Node 26+, Deno 2.7+ and Bun 1.4+, but **not in stable Safari or iOS yet**; browser code needs `temporal-polyfill` or `@js-temporal/polyfill` (load conditionally). Store and transmit instants as ISO 8601 with offset or as `Temporal.Instant`, and do time-zone math with `ZonedDateTime`, never by adding hours.
- **request:** no fixes for new advisories (it pulls in old `tough-cookie`, `form-data` versions); replace it rather than patching transitive dependencies with overrides.
- Treat every deprecated package as unpatched: if `npm audit` reports it, replace instead of suppressing.

## Known vulnerabilities

- `moment`: CVE-2026-17495 (moderate), fixed in 2.31.0; CVE-2022-31129 and CVE-2022-24785, fixed in 2.29.4 / 2.29.2.
- `bull`: no OSV advisories as of 2026-10; Redis and `ioredis` advisories still apply.
- `request`: unmaintained; transitive advisories won't be fixed upstream.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

1. Inventory usages (`git grep -n "from 'moment'"`, `require('request')`, Bull queue definitions) and pick one replacement per job.
2. Wrap the old library behind a small module (date helpers, HTTP client, queue producer) so call sites change once.
3. Replace module by module with tests; for Bull → BullMQ, migrate one queue at a time: new producer and worker on BullMQ, drain the old Bull queue, then remove it.
4. Remove the old package when the last import is gone; run `npm ls <pkg>` to confirm no direct use remains.

## Testing

- Dates: tests across time zones and DST transitions (set `TZ` in CI), and for parsing invalid input.
- Queues: a failing job is retried and ends in `failed` after the last attempt; a job that succeeds on retry ends in `completed`.

## Before you finish

```sh
npm ls moment bull request node-sass tslint 2>/dev/null
npm view <pkg> deprecated                 # for any library you add or keep
npm audit --audit-level=moderate
npm test
```
