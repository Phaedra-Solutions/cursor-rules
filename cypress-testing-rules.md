---
description: Rules file for cursor for cypress e2e testing
globs: cypress/**, **/*.cy.{ts,tsx,js}
alwaysApply: false
---

### Cypress testing rules

- Before creating configuration for cypress, Always check for existing cypress configuration
- Elements in the tests should be targeted by their `data-testid` attributes, e.g. `cy.get('[data-testid="login-submit-button"]')`. If test IDs are not found in the code, inform me and ask for my permission to add them
- Cross verify the test IDs when you generate the code for interactable elements. The test IDs should be present in the code
- Register `cy.intercept()` (with an alias) before the action that triggers the request, then `cy.wait('@alias')` after the action. An intercept registered after the action misses the request
- Do not add responsive UI testing unless explicitly asked for
- Sometimes when you have to create interfaces or types, please always check where the existing types are. Do not jump to create new files unless necessary
