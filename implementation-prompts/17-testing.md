# Prompt 17: Cypress, Playwright, unit tests

> Self-contained; safe in a fresh session. Roadmap: §6 (Testing), §7 (`testing/cypress` and `testing/playwright`).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it. D4 covers test IDs.
2. Read the `ROADMAP.md` §7 entry for Cypress and Playwright.
3. Use the root `cypress-testing-rules.md` as source material if it still has content.
4. Research:
   - the latest Cypress (intercept docs, `cy.session`, best practices);
   - the latest Playwright (locators, ARIA snapshots, test agents, MCP);
   - Vitest and Jest current majors.

## Task
1. **`rules/testing/cypress.md`:**
   - tier P0; globs `cypress/**`, `**/*.cy.{ts,tsx,js}`, `cypress.config.*`;
   - intercept-before-action, with a ✓/✗ example;
   - test-ID selectors (ask before adding them; verify they exist);
   - no fixed waits; `cy.session`; data seeding;
   - no responsive tests unless asked; reuse the existing config and types.
2. **`rules/testing/playwright.md`:**
   - tier P1; globs `tests/**/*.spec.ts`, `e2e/**`, `playwright.config.*`;
   - locator priority; web-first assertions; ARIA snapshots; `storageState`; traces;
   - rules for AI test agents (human review; healed tests must not weaken assertions).
3. **`rules/testing/unit-js.md`:**
   - tier P1; globs `**/*.test.{ts,tsx,js}`, `**/*.spec.{ts,tsx}`, `vitest.config.*`, `jest.config.*`;
   - Vitest by default (Jest where it already exists); Testing Library query order;
   - mocking boundaries; coverage expectations for changed code.

## Done when
All three rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
