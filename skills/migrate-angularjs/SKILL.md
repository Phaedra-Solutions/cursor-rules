---
name: migrate-angularjs
description: Plan and run a migration off AngularJS 1.x (EOL since 31 Dec 2021, unfixed CVEs) to Angular - choose between an incremental hybrid with ngUpgrade (@angular/upgrade), a per-route strangler rewrite, or a full rewrite; prepare the AngularJS code (1.8.3, components, TypeScript, a bundler, tests); then move services and components feature by feature and remove AngularJS. Use when asked to migrate, upgrade or replace AngularJS, or when legacy/angularjs applies and the user wants out.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-30"
  sources: "https://v17.angular.io/guide/upgrade https://www.npmjs.com/package/@angular/upgrade https://docs.angularjs.org/guide/component https://docs.angularjs.org/guide/security https://www.herodevs.com/support/nes-angularjs https://angular.dev/reference/releases"
---

# Migrate AngularJS → Angular

## When to use

- The app depends on `angular` 1.x and the user wants to move to Angular (or another framework).
- Security review flagged the unfixed AngularJS CVEs (see `legacy/angularjs`).

## Before you start

- Inventory: AngularJS version, module count, routes (`ngRoute` or ui-router), directives with `link`/`compile` functions, filters, `$scope` usage, third-party AngularJS modules, build tool (none, gulp, grunt, webpack), and test coverage.
- Ask the user to choose an approach (explain the trade-offs):
  - **Hybrid (ngUpgrade):** AngularJS and Angular run in one page; migrate component by component. Best for large apps that must keep shipping. Requires a bundler and TypeScript.
  - **Strangler (per route):** a new Angular app serves migrated routes; a proxy or server routes the rest to the old app. Simpler runtime, but shared UI (header, auth) must exist in both.
  - **Full rewrite:** for small apps or ones with little reusable logic; freeze the old app behind compensating controls until cut-over.
- Target: the current Angular major (22; see `frontend/angular`) with standalone components.
- Working tree clean; new branch; E2E tests (Playwright or Cypress) for main flows. Add them first if missing.

## Steps

### Prepare the AngularJS app (all approaches)

1. Upgrade to AngularJS 1.8.3 and fix console warnings.
2. Follow the AngularJS style that maps to Angular: one component per file, `.component()` with `<`/`&` bindings instead of `$scope`-heavy controllers and two-way `=` bindings, services instead of `$rootScope` events, `controllerAs` syntax.
3. Introduce a module bundler (webpack or Vite) and TypeScript for the AngularJS code if they're missing; replace script-tag ordering with imports.
4. Replace jQuery-heavy directives and AngularJS-only third-party modules with plain code or libraries that have Angular equivalents.

### Hybrid with ngUpgrade

1. Create the Angular app (standalone bootstrap) and add `@angular/upgrade`; bootstrap the hybrid with `UpgradeModule` (or `downgradeModule` for lazy Angular).
2. Migrate **services first** (upgrade AngularJS services with providers, or write Angular services and downgrade them with `downgradeInjectable`).
3. Migrate **leaf components** to Angular and expose them to AngularJS templates with `downgradeComponent`; upgrade AngularJS components that Angular needs with `UpgradeComponent` only temporarily.
4. Move routing last: switch the router to Angular's once most routes' components are Angular, keeping AngularJS routes behind a catch-all during the transition.
5. Remove AngularJS when no AngularJS components, services or routes remain; drop `@angular/upgrade`.

### Strangler

1. Put both apps behind one origin (reverse proxy or server routing); share auth via `HttpOnly` cookies.
2. Rebuild a route in Angular, switch the proxy for that path, and delete the AngularJS route; repeat.
3. Keep shared chrome (header, navigation) visually consistent; move it early or render it in both.

### Every step

- Verify (next section); show the diff and results; wait for approval before the next feature. Commit only when asked (`git-commit` skill).
- Keep the security controls from `legacy/angularjs` (CSP, no `trustAs*`, no user-controlled templates) on the AngularJS side until it's gone.

## Verify

```sh
npm ci
npx ng build && npx ng test --watch=false    # Angular side
npm test                                     # AngularJS side (Karma or the existing runner)
npx playwright test                          # or Cypress: the same E2E suite against the current build
npm audit --audit-level=moderate
npm ls angular @angular/core @angular/upgrade
```

Check in the browser: migrated features behave the same (forms, validation messages, routing, deep links), no console errors from either framework, and change detection works across the boundary (values update both ways).

## Safety

- Never rewrite everything in one change; migrate one feature or route per change with E2E coverage.
- Never relax `$sce` or CSP to make hybrid templates work.
- Never leave two-way data sharing via `$rootScope` events as the integration layer; use services.
- Never auto-commit, push or deploy.
