---
id: legacy/angularjs
title: AngularJS 1.x
description: Working safely in AngularJS 1.x (EOL 31 Dec 2021; last release 1.8.3) - $sce and strict contextual escaping, no ng-bind-html or $sce.trustAs* on untrusted input, no template or expression injection from user data, ng-csp mode and a strict CSP, $http XSRF settings, the unfixed CVEs (CVE-2026-11998 and others) with compensating controls, commercial extended support, and migration options (hybrid with ngUpgrade, per-route rewrite, full rewrite). Use when the project depends on the angular 1.x package.
applies_to: "angular >=1.0 <2"
globs: ["**/*.js", "**/*.html", "bower.json", "package.json"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://docs.angularjs.org/guide/security
  - https://docs.angularjs.org/api/ng/service/$sce
  - https://docs.angularjs.org/api/ng/directive/ngCsp
  - https://www.npmjs.com/package/angular
  - https://www.herodevs.com/support/nes-angularjs
  - https://v17.angular.io/guide/upgrade
  - https://www.npmjs.com/package/@angular/upgrade
  - https://github.com/advisories/GHSA-7x27-g8rg-x87w
  - https://osv.dev/vulnerability/GHSA-j58c-ww9w-pwp5
  - https://osv.dev/vulnerability/GHSA-prc3-vjfx-vhm9
  - https://osv.dev/vulnerability/GHSA-m9gf-397r-hwpg
  - https://osv.dev/vulnerability/GHSA-mqm9-c95h-x2p6
  - https://osv.dev/vulnerability/GHSA-4w4v-5hc9-xrr2
  - https://osv.dev/vulnerability/GHSA-2qqx-w9hr-q5gx
---

# AngularJS 1.x

Also apply `core/legacy-mode`. For Angular 2+ see `frontend/angular` and `legacy/angular-ngmodules`. Don't migrate as part of an unrelated task.

## Version check

- Read `angular` (and `angular-sanitize`, `angular-route`, `@uirouter/angularjs`, `angular-animate`) from `package.json`/`bower.json` or the script tags, and state it:

  ```text
  Applying legacy/angularjs (angular 1.8.3, angular-sanitize 1.8.3, ui-router 1.0, script tags + gulp build).
  ```

- **Status:** AngularJS reached end of life on 31 Dec 2021; **1.8.3 (Apr 2022) is the last release** and the npm package is deprecated. Nothing is fixed upstream. Commercial extended support (HeroDevs NES for AngularJS) provides patched builds.
- On anything below 1.8.3, move to 1.8.3 first (fixes for older XSS and prototype-pollution bugs landed in 1.7.9 and 1.8.0). Report EOL status in every summary and offer `migrate-angularjs`.

## Conventions

- Keep the codebase's style (controllers with `controllerAs`, components via `.component()` on 1.5+, services, `$q`). New code uses `.component()` with one-way bindings (`<`) and `&` callbacks; it eases migration.
- No new global dependencies or jQuery plugins; keep jqLite/jQuery usage confined to directives.
- Use `$http` interceptors for auth and errors in one place; never build URLs from unvalidated input.
- Track `$scope.$on` and `$watch` listeners and remove them in `$onDestroy` to avoid leaks.

## Security

- **Keep Strict Contextual Escaping on.** Never `$sceProvider.enabled(false)`. Never call `$sce.trustAsHtml`, `trustAsResourceUrl`, `trustAsUrl` or `trustAsJs` on user or API data.
- **`ng-bind-html`:** only with `ngSanitize` and content you control; never with user input. Render text with `{{ }}` or `ng-bind`.
- **Template and expression injection:** never put user input into templates, `$compile`, `$parse`, `$eval`, `$interpolate`, `ng-include` URLs or server-rendered HTML inside an `ng-app` element. Server-side templating that echoes user data into an AngularJS-controlled page enables client-side template injection (`{{constructor.constructor('…')()}}`); add `ng-non-bindable` around server-rendered user content.
- **Resource URLs:** keep `$sceDelegateProvider.resourceUrlWhitelist` (`trustedResourceUrlList` on 1.8) to your own origins; the unfixed CVE-2026-11998 bypasses resource-URL checks, so also restrict `ng-include`, `templateUrl` and `<iframe ng-src>` sources server-side and with CSP.
- **CSP:** enable `ng-csp` (no `eval`/`Function`, no inline styles injected by Angular) and send a strict CSP (`script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, a tight `img-src` because of the `ng-src`/`srcset` image-restriction bypasses CVE-2024-8372/8373).
- **XSRF:** keep `$http`'s XSRF cookie/header (`XSRF-TOKEN` → `X-XSRF-TOKEN`) or configure `$httpProvider.defaults.xsrfCookieName`/`xsrfHeaderName` to match the backend; the server validates it.
- **ReDoS:** several unfixed regex DoS bugs (`$resource`, `angular.copy`, `<input type="url">`, `ng-srcset`) — cap input lengths before they reach these APIs.
- **SVG and `<a xlink:href>`:** don't render user-supplied SVG (CVE-2025-0716).

## Known vulnerabilities (as of 2026-10)

All affect 1.8.3 and have **no official fix**:

| Advisory | Issue |
|---|---|
| CVE-2026-11998 | `$sce` resource-URL bypass → XSS |
| CVE-2025-0716 | Improper sanitization of SVG elements |
| CVE-2024-8372, CVE-2024-8373 | Bypass of image source restrictions (`srcset`, `<source>`) |
| CVE-2024-21490 | ReDoS via `ng-srcset` |
| CVE-2023-26116, CVE-2023-26117, CVE-2023-26118 | ReDoS in `angular.copy`, `$resource`, `<input type="url">` |
| CVE-2022-25869 | XSS in IE textarea placeholder handling |
| CVE-2022-25844 | ReDoS in `NUMBER_FORMATS.PATTERNS` |

Compensating controls: strict CSP and Trusted Types where the app can support them, input length limits, no user-controlled templates or URLs, server-side sanitization of rich text, and a WAF rule set for template-injection payloads. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

Choose with the user, based on size, test coverage and how long the app must live:

1. **Incremental hybrid** (`@angular/upgrade`, ngUpgrade): run AngularJS and Angular side by side, downgrade new Angular components into AngularJS templates, upgrade services, and move feature by feature. Works best on 1.5+ component-style code with a module bundler.
2. **Per-route rewrite (strangler):** serve new routes from a new Angular (or other) app behind the same domain, moving routes one at a time; share auth through cookies or tokens.
3. **Full rewrite:** for small apps or ones with little reusable code; keep the old app frozen and patched behind compensating controls until cut-over.

Use the `migrate-angularjs` skill for the steps.

## Testing

- Keep Karma/Jasmine (or the existing runner) green; add Protractor-free E2E tests (Playwright or Cypress) for main flows before migrating.
- Add tests that user-supplied text containing `{{ }}` and HTML renders literally.

## Before you finish

```sh
npm test                                  # or the project's Karma/gulp task
npm audit --audit-level=moderate
grep -rnE "trustAs(Html|ResourceUrl|Url|Js)|\\\$sceProvider\.enabled|ng-bind-html|\\\$compile\(" --include='*.js' --include='*.html' . 2>/dev/null | grep -v node_modules
```
