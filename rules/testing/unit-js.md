---
id: testing/unit-js
title: Unit and component tests (Vitest, Jest)
description: JavaScript and TypeScript unit and component tests - Vitest by default and Jest where it already exists, Vitest 5 behavior changes, Testing Library query priority and user-event, mocking only at boundaries (MSW for HTTP, fake timers), coverage expectations for changed code, and Vitest dev-server advisories. Use when editing *.test.* or *.spec.* files, vitest.config.* or jest.config.*.
applies_to: "vitest >=4.0 <6, jest >=29 <31"
globs: ["**/*.test.{ts,tsx,js}", "**/*.spec.{ts,tsx}", "vitest.config.*", "jest.config.*"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://vitest.dev/blog/vitest-5
  - https://vitest.dev/guide/migration
  - https://vitest.dev/guide/mocking
  - https://vitest.dev/guide/coverage
  - https://jestjs.io/blog/2025/06/04/jest-30
  - https://testing-library.com/docs/queries/about/#priority
  - https://testing-library.com/docs/user-event/intro
  - https://mswjs.io/docs/
  - https://www.npmjs.com/package/vitest
  - https://www.npmjs.com/package/jest
  - https://www.npmjs.com/package/@testing-library/jest-dom
  - https://www.npmjs.com/package/msw
  - https://osv.dev/vulnerability/GHSA-p458-7748-mcp3
  - https://osv.dev/vulnerability/GHSA-82fw-gwwq-j7x9
  - https://osv.dev/vulnerability/GHSA-5xrq-8626-4rwp
  - https://osv.dev/vulnerability/GHSA-g8mr-85jm-7xhm
  - https://osv.dev/vulnerability/GHSA-p63j-vcc4-9vmv
  - https://osv.dev/vulnerability/GHSA-2h32-95rg-cppp
---

# Unit and component tests (Vitest, Jest)

Test IDs and query order follow `conventions/phaedra` on house projects. Framework-specific test setup is in the framework rule (`frontend/angular`, `backend/nestjs`, `mobile/react-native-expo`).

## Version check

- Read the runner (`vitest` or `jest`), `@testing-library/*`, `msw`, `jsdom`/`happy-dom` and the coverage provider from the lockfile, and state them:

  ```text
  Applying testing/unit-js (vitest 5.0.5, jsdom, @testing-library/react 16, msw 3, from package-lock.json).
  ```

- **Runner:** use the project's runner. Vitest for new projects (the default for Vite, Angular 21+ and ESM NestJS 12); keep Jest where it's configured. Never add a second runner to a package.
- **Vitest 5** (5.0.5, Sep 2026; Node ≥ 22.12, Vite ≥ 6.4):
  - `clearMocks` is on by default, so call history doesn't carry over between tests;
  - `vi.mock()`, `vi.unmock()` and `vi.hoisted()` must be at the top level of the file;
  - unawaited `resolves`/`rejects` assertions fail the test; `expect.poll()` fails on timeout;
  - `test.sequential` is removed (use `concurrent: false`); `toThrow('')` matches any error;
  - output goes to `.vitest/`; add it to `.gitignore`.
- **Vitest 4.1.x**: still common; write v4 code there. Below 4, and Jest below 29: apply `core/legacy-mode`.
- **Jest 30**: `jest.mock` hoisting and `jest.requireActual`; ESM needs the project's existing setup (`--experimental-vm-modules` or a transform). Don't convert to Vitest unless asked.
- `@testing-library/jest-dom` 7 needs Node ≥ 22; `msw` 3 needs Node ≥ 22.12.

## Conventions

- Place tests where the project does: next to the source (`order-total.ts` → `order-total.test.ts`) or in `__tests__/`. Name tests for behavior: `it('rejects a negative quantity')`.
- Arrange, act, assert. One behavior per test. Build inputs with small typed factories (`makeOrder({ quantity: 2 })`), not shared mutable fixtures.
- Tests run in any order and in parallel. No shared state between tests; reset in `beforeEach`. Turn on `sequence.shuffle` in CI where the suite allows it.
- Environment: `node` by default. Use `jsdom` or `happy-dom` only for DOM tests, per file (`// @vitest-environment jsdom`) or per project in config.
- Snapshots only for small, stable output (a serialized error, a generated SQL string). Never snapshot whole component trees or API payloads with timestamps and IDs.
- Use `it.each` / `test.each` for input tables instead of copy-pasted tests.

### Testing Library

- Query in this order: `getByRole` (with `name`), `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`, `getByAltText`, `getByTitle`, then `getByTestId` as the last resort.
- Use `screen`, not destructured render results. Never use `container.querySelector` or class names.
- Interact through `const user = userEvent.setup()` and `await user.click(…)`, `await user.type(…)`; avoid `fireEvent` except for events user-event can't produce.
- Use `findBy*` (or `waitFor` around an assertion) for async UI. Use `queryBy*` only to assert absence.
- Assert with jest-dom matchers (`toBeInTheDocument`, `toBeDisabled`, `toHaveAccessibleName`).
- Test what the user sees and does, not internals: no assertions on component state, hook internals, private methods or CSS.
- Render with the app's real providers (router, query client, theme, i18n) through one `renderWithProviders` helper; create a fresh `QueryClient` per test with `retry: false`.

### Mocking

- Mock at boundaries only: the network, time, randomness, the file system and third-party SDKs. Don't mock the module under test or its pure helpers.
- HTTP: MSW handlers (`http.get('/api/orders', …)`) shared between tests, with `server.listen({ onUnhandledRequest: 'error' })`; override per test with `server.use(…)`. Don't stub `fetch` or `axios` by hand when MSW is available.
- Time: `vi.useFakeTimers()` / `jest.useFakeTimers()` with `setSystemTime`, restored in `afterEach`. Never test with real timeouts.
- Module mocks: top-level `vi.mock('./payments-client')` with `vi.mocked()` for types; use `vi.importActual()` (`jest.requireActual()`) to keep the rest of a module real. Prefer injecting dependencies over module mocks when the code allows.
- Spies: `vi.spyOn(obj, 'method')`; set `restoreMocks: true` in config, or restore in `afterEach`.
- Mocks must match the real contract: type them against the real interface or response schema, and keep at least one test of the real adapter (an integration test against a container or recorded response).

### Coverage

- Every changed or added branch in the diff has a test that exercises it. Run coverage on the changed files and check the uncovered lines before you finish.
- Bug fixes come with a regression test that fails without the fix.
- Follow the project's thresholds (`coverage.thresholds` / `coverageThreshold`). Never lower them, and never add `/* v8 ignore */` or `/* istanbul ignore */` to reach a number; explain uncovered lines in the summary instead.
- Coverage provider: `@vitest/coverage-v8` (Vitest) or Jest's built-in; keep the project's choice.

## Security

- Tests never call real external services, real payment providers or production databases, and never use real credentials. Put fake values in `.env.test`; real ones stay out of the repo.
- Don't let snapshots, fixtures or recorded responses capture tokens, cookies or personal data. Scrub recordings before committing.
- **Vitest servers:** the UI (`--ui`), API (`--api`) and browser-mode servers can read files and run code. Run them on localhost only; never `--api.host 0.0.0.0` or `--host` on shared networks, and keep Vitest at or above the fixed versions below.
- Run `dependency-vet` before adding new test libraries; test dependencies run with full access on developer machines and CI.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Affected | Fixed |
|---|---|---|---|
| CVE-2026-112948: servers misapply `server.fs.deny`, exposing `.env`, keys, `.git` and the API token | vitest, @vitest/ui | 5.0.0-beta.6 – 5.0.4 (and < 1.3.0) | 5.0.5 |
| CVE-2026-84373: path traversal and file read via `@vitest/mocker` redirect mocks | vitest | 2.1.0 – 4.1.10 | 4.1.11 / 5.0.0 |
| CVE-2026-47429: file read and execution while the UI server listens | vitest | < 3.2.6; 4.0.0 – 4.0.x | 3.2.6 / 4.1.0 |
| CVE-2026-53633: exposed browser-mode API proxies CDP and overwrites config (RCE) | @vitest/browser | < 3.2.5; 4.0.0 – 4.1.7 | 3.2.5 / 4.1.8 / 5.0.0 |
| CVE-2026-73653: browser-mode provider commands bypass the file-access gate | @vitest/browser | < 3.2.7; 4.0.0 – 4.1.9 | 3.2.7 / 4.1.10 / 5.0.0 |
| CVE-2026-47428: browser mode serves an unsanitized query parameter as inline script | @vitest/browser | 4.0.17 – 4.1.5 | 4.1.6 / 5.0.0 |

Minimum safe Vitest: **5.0.5** or **4.1.11**; 3.x has no fix for CVE-2026-84373. No current OSV advisories for `jest`. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Check that each new test can fail: break the code under test once (or invert the assertion) and confirm the test goes red.
- Run the changed tests several times and in random order to catch shared state and timing flakiness.
- No `.only`, `.skip` or `todo` left behind without a reason in the summary.

## Before you finish

```sh
npx tsc --noEmit
npx vitest run --changed --coverage          # Vitest: tests related to changed files, with coverage
npx vitest run                               # full suite before you finish
npx jest --findRelatedTests <changed files> --coverage   # Jest projects
npm run lint
grep -rnE "\.(only|skip)\(" --include='*.test.*' --include='*.spec.*' src 2>/dev/null
npm audit --audit-level=moderate
npm ls vitest @vitest/browser               # ≥ 5.0.5 or ≥ 4.1.11
```
