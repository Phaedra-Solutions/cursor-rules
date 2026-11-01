---
id: testing/cypress
title: Cypress
description: Cypress 15-16 end-to-end and component tests - register cy.intercept before the action that sends the request, test-ID selectors that exist in the code (ask before adding them), no fixed waits, cy.session for login, data seeding through tasks or the API, cy.env for secrets, no responsive tests unless asked, and reuse of the existing config and types. Use when editing cypress/, *.cy.* files or cypress.config.*.
applies_to: "cypress >=15.0 <17"
globs: ["cypress/**", "**/*.cy.{ts,tsx,js}", "cypress.config.*"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://docs.cypress.io/app/references/changelog
  - https://docs.cypress.io/app/references/migration-guide
  - https://docs.cypress.io/app/core-concepts/best-practices
  - https://docs.cypress.io/app/core-concepts/test-isolation
  - https://docs.cypress.io/api/commands/intercept
  - https://docs.cypress.io/api/commands/session
  - https://docs.cypress.io/api/commands/env
  - https://docs.cypress.io/api/cypress-api/expose
  - https://docs.cypress.io/api/commands/getbyrole
  - https://docs.cypress.io/api/commands/task
  - https://docs.cypress.io/api/commands/prompt
  - https://www.npmjs.com/package/cypress
---

# Cypress

Selectors and test IDs follow `conventions/phaedra` on house projects. Security basics for test code (no real secrets, no production data) are in `core/security-baseline`.

## Version check

- Read `cypress` from the lockfile and state it:

  ```text
  Applying testing/cypress (cypress 16.2.1, TypeScript specs, e2e + component, from package-lock.json).
  ```

- **16.x** (current 16.2.1, Sep 2026): needs Node 22, 24 or 26. `Cypress.env()` and `cy.exec()` are removed; use `Cypress.expose()`, `cy.env()` and `cy.task()`. `cy.getByRole()` exists from 16.2. Component testing needs Angular ≥ 21 and Vite ≥ 8; Next.js 14 isn't supported.
- **15.x**: write `Cypress.env()` where the project uses it; don't use 16-only APIs. Offer the upgrade separately.
- Below 15: apply `core/legacy-mode`; keep the project's existing patterns.

## Conventions

- **Reuse what exists.** Before creating config, read `cypress.config.*`, `cypress/support/*` (custom commands, `e2e.ts`, `component.ts`) and `cypress/fixtures/`. Add to them; don't create a second config, support file or command for the same job.
- **Reuse types.** Find existing types (API response types, `cypress/support/index.d.ts`, the app's `types/`) before declaring new ones. Don't create new type files unless nothing fits.
- One spec per feature or user flow: `cypress/e2e/<feature>/<flow>.cy.ts`. Each `it` runs alone (test isolation is on by default); put shared setup in `beforeEach`, never rely on test order.
- Use `baseUrl` in config and relative `cy.visit('/orders')`.
- **No responsive or viewport tests** unless the user asks for them.
- Don't assign command results to variables (`const el = cy.get(…)`); chain, or use `.then()` and aliases.

### Selectors

- Select by the project's test attribute (`data-testid` by default; `data-cy` or `data-test` where the project uses them):

  ```ts
  cy.get('[data-testid="login-submit-button"]').click();
  ```

- Wrap it in the project's custom command if one exists (`cy.getByTestId('login-submit-button')`).
- **Verify every test ID exists** in the component code before using it. If an element has no test ID, tell the user and ask before adding one; don't invent IDs the app doesn't render.
- `cy.getByRole('button', { name: 'Save' })` (16.2+) is fine for accessible elements and pairs well with test IDs. Never select by CSS classes, generated IDs, DOM position or copy that changes.

### Network

Register `cy.intercept()` with an alias **before** the action that sends the request, then wait on the alias:

```ts
// ✓
cy.intercept('POST', '/api/orders').as('createOrder');
cy.get('[data-testid="order-submit-button"]').click();
cy.wait('@createOrder').its('response.statusCode').should('eq', 201);

// ✗ the request can fire before the intercept exists, so the wait times out or matches nothing
cy.get('[data-testid="order-submit-button"]').click();
cy.intercept('POST', '/api/orders').as('createOrder');
cy.wait('@createOrder');
```

- Stub responses (`cy.intercept('GET', '/api/orders*', { fixture: 'orders.json' })`) for edge cases and error states; keep at least one happy path per flow against the real backend.
- Assert on the request too when it matters: `cy.wait('@createOrder').its('request.body').should('deep.include', { quantity: 2 })`.

### Waiting

- Never `cy.wait(<ms>)`. Wait on aliases, or assert on the UI state you expect (`.should('be.visible')`, `.should('have.text', …)`); commands retry until the assertion passes.
- Raise `timeout` on one command when a step is legitimately slow, not globally.

### Login and data

- Log in programmatically with `cy.session()`, caching per user, and validate the session:

  ```ts
  Cypress.Commands.add('login', (user: TestUser) => {
    cy.session(['login', user.email], () => {
      cy.request('POST', '/api/auth/login', { email: user.email, password: user.password });
    }, {
      validate: () => { cy.request('/api/auth/me').its('status').should('eq', 200); },
      cacheAcrossSpecs: true,
    });
  });
  ```

- Test the login UI itself in one spec; every other spec uses `cy.login()`.
- Seed and reset data through `cy.task()` (Node side, in `setupNodeEvents`) or API calls with `cy.request()`, not by clicking through the UI. Each test creates the data it needs with unique values.
- Never visit or depend on third-party sites; stub them.

## Security

- Secrets (passwords, API tokens) come from `cy.env()` on 16+ (values from `CYPRESS_*` env vars or config `env`), which keeps them out of the browser. `Cypress.expose()` values are visible to app code and third-party scripts: public config only. On 15, `Cypress.env()` values reach the browser, so use test-only accounts with no real privileges.
- Never commit `cypress.env.json` or `.env` with real values; commit an example file.
- Run against local, preview or staging environments with test accounts and synthetic data. Never point a suite at production unless the user asks for a read-only smoke test.
- `cy.task()` runs Node code: keep tasks narrow (`db:seed`, `db:reset`) and refuse to run them when the target looks like production.
- `cy.prompt()` sends steps and page context to Cypress Cloud's AI. Use it only if the user agrees, with placeholders for sensitive values, and commit the generated plain Cypress commands after review.

## Known vulnerabilities

No current advisories for `cypress` in OSV as of 2026-10. Cypress 16 validates TLS natively in Chrome and adds `trustedCertificates` (16.1) for self-signed dev certificates; don't disable certificate checks instead. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Each new spec must fail when the feature is broken: break the behavior once locally (or stub an error response) and confirm the spec fails.
- Cover per flow: the happy path, one validation error, one server error (stubbed 500), and the logged-out redirect for protected pages.
- Component tests (`*.cy.tsx`) mount with the app's real providers from `cypress/support/component.ts`.
- AI-generated or `cy.prompt()` tests get the same review as hand-written ones; never accept a test that passes because its assertions were removed.

## Before you finish

```sh
npx cypress verify
npx tsc --noEmit -p cypress/tsconfig.json     # if the project has one
npx cypress run --spec "cypress/e2e/<feature>/**/*.cy.ts"
npx cypress run --component                   # if component tests changed
npm run lint
grep -rnE "cy\.wait\([0-9]" cypress/          # no fixed waits
```
