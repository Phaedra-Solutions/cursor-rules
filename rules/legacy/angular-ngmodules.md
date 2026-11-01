---
id: legacy/angular-ngmodules
title: Angular NgModule apps and Angular 19 or older
description: NgModule-based Angular apps on any version, and every app on Angular 2–19 (all end of life). Covers the layered core/shared/modules architecture, safe maintenance, EOL status per version, unfixed 2026 CVEs with compensating controls, and the migration path to standalone, control flow and signals. Use when editing *.module.ts files or when the installed @angular/core is below 20.
applies_to: "@angular/core >=2.0 <23"
globs: ["**/*.module.ts", "**/*.component.ts", "**/*.component.html", "**/*.service.ts", "angular.json"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://angular.dev/reference/releases
  - https://angular.dev/reference/versions
  - https://endoflife.date/angular
  - https://angular.dev/best-practices/security
  - https://angular.dev/reference/migrations
  - https://angular.dev/reference/migrations/standalone
  - https://angular.dev/reference/migrations/control-flow
  - https://angular.dev/guide/zoneless
  - https://github.com/angular/angular/security/advisories
  - https://www.herodevs.com/blog-posts/angular-cves-cve-2026-101895-cve-2026-88056-no-fix-angular-19
  - https://www.herodevs.com/support/nes-angular
  - https://osv.dev/vulnerability/GHSA-hh8m-fm6v-7cvg
  - https://osv.dev/vulnerability/GHSA-jj27-h5hq-8x99
  - https://osv.dev/vulnerability/GHSA-f3m7-gqxr-g87x
  - https://osv.dev/vulnerability/GHSA-58w9-8g37-x9v5
  - https://osv.dev/vulnerability/GHSA-jfgx-762w-99vr
  - https://osv.dev/vulnerability/GHSA-qxh6-94w6-9r5p
  - https://osv.dev/vulnerability/GHSA-f6mr-pjwc-34m4
  - https://osv.dev/vulnerability/GHSA-hqr9-c56f-3x7f
  - https://osv.dev/vulnerability/GHSA-x288-3778-4hhx
  - https://osv.dev/vulnerability/GHSA-7g7c-h8rr-7p6q
  - https://www.npmjs.com/package/@angular/core
---

# Angular NgModule apps and Angular ≤ 19

Also apply `core/legacy-mode`. Don't migrate as part of an unrelated task.

## Version check

- Read `@angular/core`, `@angular/cli`, `typescript`, `rxjs`, `zone.js` and any SSR package (`@angular/ssr`, `@nguniversal/*`) from the lockfile. Find the bootstrap (`bootstrapModule(AppModule)` or `bootstrapApplication`). State the rule:

  ```text
  Applying legacy/angular-ngmodules (@angular/core 15.2.10 from package-lock.json; NgModule bootstrap; EOL since 18 May 2024).
  ```

- **v20–22 with NgModules:** use this rule for the module structure and `frontend/angular` for everything else (security, patches, new components).
- **AngularJS (`angular` 1.x):** this rule doesn't apply. Stop and tell the user.
- **Support status** (angular.dev; endoflife.date):

  | Major | Security support ended | Last release |
  |---|---|---|
  | 20 | ends 28 Nov 2026 | latest 20.3.x |
  | 19 | 19 May 2026 | 19.2.25 |
  | 18 | 21 Nov 2025 | 18.2.14 |
  | 17 | 15 May 2025 | 17.3.12 |
  | 16 | 8 Nov 2024 | 16.2.12 |
  | 15 | 18 May 2024 | 15.2.10 |
  | 14 | 18 Nov 2023 | 14.3.0 |
  | ≤ 13 | 2023 or earlier | |

  Every major below 20 is unsupported; say so in the summary of every change and point to `upgrade-angular`.
- Never use APIs newer than the installed major:
  - 14: `inject()` (in constructors and field initializers), typed reactive forms; standalone is developer preview only.
  - 15: standalone stable, functional guards and interceptors, `NgOptimizedImage`.
  - 16: signals (preview), `takeUntilDestroyed`, `@Input({ required: true })`, `withComponentInputBinding()`.
  - 17: built-in control flow and `@defer`; `input()`/`model()` from 17.1–17.2.
  - 18: `@let` (18.1), experimental zoneless.
  - 19: components default to standalone; NgModule-declared ones need `standalone: false`.
- Runtimes: v14–19 need Node 14–22 depending on the major (see the angular.dev versions table); Node 20 and older are EOL. Note the Node status too.

## Conventions

Keep the project's existing layered architecture. Typical shape:

```text
src/app/
├── core/                  # app-wide singletons, imported once by AppModule
│   ├── services/          # flat: one service per feature, <feature>-api.service.ts, index.ts
│   ├── interfaces/        # grouped by feature folder, each with index.ts; root index.ts re-exports
│   ├── enums/             # same grouping as interfaces
│   ├── guards/  interceptors/
│   └── utils/             # pure, stateless: constants.ts, helpers.ts, validators.ts, mocks.ts
├── layout/                # header, footer, sidebar, layout shells + layout.module.ts
├── shared/                # stateless reusable UI: components, directives, pipes + shared.module.ts
├── modules/               # feature modules: components/, views/, models/, helpers/, <feature>.module.ts
└── <domain>/              # domain modules for a large integration (maps, payments, editor) with its own module
```

- **Layering:** `core/` services are provided once (`providedIn: 'root'` or `CoreModule` imported only by `AppModule`). `shared/` holds no feature state and never imports feature modules. Feature and domain modules don't import each other.
- **Services:** one data/API service per feature in `core/services/`, prefixed with the feature name (`user-api.service.ts`) and re-exported from `core/services/index.ts`.
- **Types:** interfaces and enums live in `core/interfaces/` and `core/enums/`, grouped by feature, with `index.ts` barrels.
- **Utils** are pure functions with no Angular dependencies.
- **Naming:** kebab-case files with type suffixes (`user-profile.component.ts`, `user.module.ts`), camelCase variables, PascalCase classes.
- **Lazy loading:** keep every feature module lazy (`loadChildren: () => import(...).then(m => m.UserModule)`). Never switch to the string form `'./user/user.module#UserModule'` (removed in v9+ Ivy builds).
- **Components:** `ChangeDetectionStrategy.OnPush` on new components. Prefer the `async` pipe; for manual subscriptions use `takeUntilDestroyed()` on ≥ 16, otherwise `takeUntil(this.destroy$)` with `ngOnDestroy`.
- Use `trackBy` on every `*ngFor` over data. Keep logic out of templates; use pure pipes or getters backed by cached fields.
- Debounce search and filter inputs (`debounceTime` + `distinctUntilChanged`) before calling the API.
- Strict TypeScript (`"strict": true`, `strictTemplates`) where already on; never turn it off. No `any`.
- New code in an NgModule app: on ≥ 15 a new component may be standalone and imported into the module; keep the surrounding style otherwise. Don't mix in a second state library or form approach.

## Safe maintenance

- Keep diffs minimal. Add characterization tests before refactoring a component or service.
- Upgrade within the major first: move to the last release in the table above, all `@angular/*` packages on the same version, with `ng update @angular/core@<major> @angular/cli@<major>`.
- Never add a dependency that requires a newer Angular, TypeScript or Node than installed; check its `peerDependencies`.
- Don't hand-edit `node_modules` or vendor-patch Angular. If the user needs patched EOL builds, mention commercial extended support (for example HeroDevs NES for Angular) as an option, without endorsing it.
- Don't enable experimental flags (zoneless on 18, preview APIs) in production code to fix a bug.

## Security

See `core/security-baseline`. Angular-specific rules from `frontend/angular` apply to every version (sanitizer bypasses, `[innerHTML]`, DOM access, XSRF). On EOL versions, add these compensating controls:

- **Template XSS** (sanitizer bypasses, i18n, SVG, namespaces, two-way bindings, host bindings):
  - Never bind user data to URL attributes (`href`, `src`, `action`, `formaction`, `xlink:href`) that also have `i18n-*` markers, or to SVG `href`.
  - Never bind untrusted values to `[innerHTML]`, even though the sanitizer runs; render text with interpolation.
  - Avoid `[(ngModel)]` or two-way bindings on sanitized properties (`href`, `src`) with user data.
  - Never accept user-controlled component types, templates or attribute names for dynamic components.
  - Add Trusted Types (`trusted-types angular angular#unsafe-bypass; require-trusted-types-for 'script'` on ≥ 11) and a strict CSP. Test that the app still loads; older versions may need `angular#unsafe-bypass`.
- **HttpClient XSRF token leaks:** call only relative URLs or an allowlist of absolute API origins; reject protocol-relative (`//host`) and backslash URLs in interceptors.
- **HttpTransferCache leaks (v16+ with hydration):** exclude authenticated and credentialed requests with `withHttpTransferCacheOptions` (a `filter`, plus `includeRequestsWithAuthHeaders: false` where the installed version has it), or disable the transfer cache.
- **SSR (`@nguniversal/*`, `@angular/ssr`, `platform-server`):** XSS, SSRF and DoS fixes since 2026 exist only in v20+.
  - Validate the `Host` header against an allowlist at the reverse proxy; strip `X-Forwarded-Prefix`, `X-Forwarded-Host` and `Forwarded` from client requests.
  - Set request timeouts, body and URL length limits, and rate limits in front of the SSR server.
  - Don't render untrusted HTML server-side. Where SSR isn't needed, prerender or serve the CSR build.
  - Run the Node server on Linux, not Windows (CommonEngine path traversal).
- **Service worker:** remove credentialed `dataGroups` from `ngsw-config.json`, or disable the service worker, since the header-leak and credential-stripping fixes aren't backported.
- **`formatDate`/`DecimalPipe` DoS:** never pass user-controlled format strings or `digitsInfo`.
- Keep `zone.js`, `rxjs`, the build tooling and the server runtime on their latest compatible patches; `npm audit` findings in build-only tooling are lower priority than runtime packages.

## Known vulnerabilities (as of 2026-10)

No release below 20 has a fix for these; v20.3.34+, v21.2.25+ and v22.2.1+ do (`@angular/ssr` 20.3.36+).

| Advisory | Package | Affected (no fix on ≤ 19) |
|---|---|---|
| GHSA-hh8m-fm6v-7cvg / CVE-2026-88057: sanitization bypass via directive host bindings | core, compiler | ≤ 19.2.25 |
| GHSA-jj27-h5hq-8x99 / CVE-2026-69151: i18n event-handler attribute XSS | core, compiler | ≤ 19.2.25 |
| GHSA-58w9-8g37-x9v5 / CVE-2026-54265: two-way binding sanitization bypass | compiler | ≤ 19.2.25 |
| GHSA-rgjc-h3x7-9mwg / CVE-2026-54267: hydration DOM clobbering and cache poisoning | core | ≤ 19.2.25 |
| GHSA-jfgx-762w-99vr / CVE-2026-111753: XSRF token leak via URL parsing | common | ≤ 19.2.25 |
| GHSA-qxh6-94w6-9r5p / CVE-2026-54264: service worker leaks auth headers on redirects | service-worker | ≤ 19.2.25 |
| GHSA-f6mr-pjwc-34m4 / CVE-2026-88056 and SSR XSS CVE-2026-88058, -88060, -69149 | platform-server | ≤ 19.2.25 |
| GHSA-7g7c-h8rr-7p6q / CVE-2026-104871: CommonEngine path traversal on Windows | ssr | ≤ 19.2.27 |

Older majors are also affected by advisories that were fixed only on 19.2.x, for example CVE-2026-22610 (SVG `href` XSS, fixed 19.2.18), CVE-2026-50557 (namespace sanitization bypass, fixed 19.2.22), CVE-2026-50555 (SSR XSS, fixed 19.2.25) and CVE-2026-27739 (SSR SSRF, also affecting the deprecated `@nguniversal/*` packages). On 18 and older, every one of them is open. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

Use the `upgrade-angular` skill; each step ships and is verified on its own.

1. **Patch** to the last release of the current major.
2. **Upgrade one major at a time** with `ng update` to at least 20, then 22 (see the Angular update guide). Switch builders to `@angular/build:application` when the update offers it.
3. **Standalone** (≥ 15.2): `ng generate @angular/core:standalone`, run three times in order with `--mode=convert-to-standalone`, `--mode=prune-ng-modules`, then `--mode=standalone-bootstrap`. Use `--path` to go one domain module at a time. Build and test between runs.
4. **Templates** (≥ 17): `ng generate @angular/core:control-flow`, then check `@for` `track` expressions.
5. **DI and signals:** `ng generate @angular/core:inject`, then `signal-inputs`, `outputs` and `signal-queries`.
6. **Change detection:** OnPush everywhere, then zoneless (`provideZonelessChangeDetection()`, remove `zone.js` from polyfills) once nothing depends on `NgZone.onStable`.
7. **Layout:** move `modules/<feature>` to `features/<feature>` with `<feature>.routes.ts`, and `shared.module.ts` exports to direct imports. Then follow `frontend/angular`.

## Testing

- Before any refactor, add characterization tests for the component or service you'll touch, using the project's runner (Karma/Jasmine or Jest).
- Test that untrusted content renders as text, guards redirect when logged out, and interceptors reject non-allowlisted URLs.
- E2E (Playwright or Cypress) selects by `data-testid`. Protractor is deprecated; don't add new Protractor tests.

## Before you finish

```sh
npx ng lint                 # if a lint builder is configured
npx tsc --noEmit -p tsconfig.app.json
npx ng test --watch=false --browsers=ChromeHeadless   # Karma; or the project's Jest command
npx ng build
npm audit --audit-level=moderate
npm ls @angular/core zone.js typescript
```
