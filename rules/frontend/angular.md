---
id: frontend/angular
title: Angular
description: Angular 20–22 conventions and security (standalone components, signals, zoneless, OnPush by default, built-in control flow, Signal Forms, httpResource, SSR, Trusted Types and CSP). Use when editing components, services, templates, routes or angular.json in an Angular 20+ project.
applies_to: "@angular/core >=20.0 <23"
legacy_rule: legacy/angular-ngmodules
globs: ["**/*.component.ts", "**/*.component.html", "**/*.service.ts", "angular.json", "src/app/**/*.ts"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://angular.dev/reference/releases
  - https://endoflife.date/angular
  - https://www.infoq.com/news/2026/08/angular-v22-released/
  - https://angular.love/angular-22-key-features-and-changes
  - https://angular.dev/style-guide
  - https://angular.dev/guide/zoneless
  - https://angular.dev/guide/forms/signals/overview
  - https://angular.dev/best-practices/security
  - https://angular.dev/guide/testing/migrating-to-vitest
  - https://angular.dev/reference/migrations
  - https://github.com/angular/angular/security/advisories
  - https://github.com/angular/angular-cli/security/advisories
  - https://osv.dev/vulnerability/GHSA-hh8m-fm6v-7cvg
  - https://osv.dev/vulnerability/GHSA-jj27-h5hq-8x99
  - https://osv.dev/vulnerability/GHSA-g93w-mfhg-p222
  - https://osv.dev/vulnerability/GHSA-jrmj-c5cx-3cw6
  - https://osv.dev/vulnerability/GHSA-58w9-8g37-x9v5
  - https://osv.dev/vulnerability/GHSA-qxh6-94w6-9r5p
  - https://osv.dev/vulnerability/GHSA-jfgx-762w-99vr
  - https://osv.dev/vulnerability/GHSA-w739-gvwx-grc3
  - https://osv.dev/vulnerability/GHSA-57xq-rjx2-v5xh
  - https://osv.dev/vulnerability/GHSA-f6mr-pjwc-34m4
  - https://osv.dev/vulnerability/GHSA-7g7c-h8rr-7p6q
  - https://www.npmjs.com/package/@angular/core
  - https://www.npmjs.com/package/@angular/aria
---

# Angular 20–22

Also apply `languages/typescript`. For security basics see `core/security-baseline`; this rule adds only Angular specifics.

## Version check

- Read `@angular/core`, `@angular/cli`, `@angular/ssr` (if present), `typescript` and `zone.js` from the lockfile, and state the rule you're applying:

  ```text
  Applying frontend/angular (@angular/core 22.2.4, typescript 6.0.x, zoneless, from package-lock.json).
  ```

- **Below 20, or an app still bootstrapped with `AppModule`:** use `legacy/angular-ngmodules`. For AngularJS (`angular` 1.x), stop and tell the user this rule doesn't apply.
- **Support (angular.dev releases page):** v22 Active until Jun 2027, LTS until Jun 2028; v21 LTS until Jun 2027; **v20 LTS ends 28 Nov 2026**. v2–v19 are unsupported. From v22 there is one major a year with 24 months of support.
- On v20, mention in your summary that support ends 28 Nov 2026 and offer the `upgrade-angular` skill.
- Requirements: v22 needs TypeScript 6.0 and Node `^22.22.3 || ^24.15 || >=26`; v21 needs TypeScript 5.9–6.0 and Node ≥ 20.19; v20 needs TypeScript 5.8–5.9.
- Write code for the installed version. Version-gated features:
  - v20: zoneless is opt-in (`provideZonelessChangeDetection()`); `resource` and `httpResource` are experimental; no Signal Forms or `@angular/aria`.
  - v21: zoneless and Vitest are the defaults for new apps; Signal Forms are experimental.
  - v22: OnPush is the default (`Default` is renamed `Eager`); Signal Forms, `resource`, `rxResource` and `httpResource` are stable; `@Service()` and `injectAsync()` exist; HttpClient uses Fetch by default.

## Conventions

### Layout

Keep the project's existing structure. For new apps or new areas, use:

```text
src/app/
├── core/            # app-wide singletons, imported only by the app shell and features
│   ├── services/    # flat, one API/data service per feature: user-api.service.ts, index.ts
│   ├── interceptors/   # functional HttpInterceptorFn
│   ├── guards/         # functional CanActivateFn / CanMatchFn
│   ├── models/         # interfaces and enums grouped by feature, each with index.ts
│   └── utils/          # pure, stateless helpers: constants.ts, validators.ts, index.ts
├── shared/          # reusable presentational components, directives, pipes (no feature state)
├── layout/          # shell, header, sidebar
├── features/
│   └── users/
│       ├── users.routes.ts      # lazy-loaded with loadChildren / loadComponent
│       ├── pages/               # routed components
│       └── components/          # feature-only components
├── app.config.ts    # ApplicationConfig: provideRouter, provideHttpClient, …
├── app.routes.ts
└── app.ts
```

- Every component, directive and pipe is standalone. Don't add `NgModule`s; import dependencies in the component's `imports`.
- One concept per file. Use `index.ts` barrels at folder level (`core/services/`, `core/models/`, `shared/`), never one barrel that re-exports the whole app (it defeats lazy loading).
- `shared/` never imports from `features/`; features never import from each other. Move shared code to `core/` or `shared/`.
- File names are kebab-case. Follow the project's suffix style: v20+ CLI generates `user-profile.ts` without `.component`; existing apps that use `.component.ts` keep it.
- Lazy-load every feature route. Don't import feature code from `app.routes.ts` eagerly.

### Components and DI

- Use `inject()`, not constructor parameters. On v22, use `@Service()` for root singletons in new code; `@Injectable({ providedIn: 'root' })` stays fine elsewhere.
- Use `input()`, `input.required()`, `output()`, `model()` and signal queries (`viewChild()`, `contentChildren()`). Mark them `readonly`. Make template-only members `protected`.
- State: `signal`, `computed` and `linkedSignal`. Use `effect()` only for syncing to non-Angular APIs (DOM, storage, logging), never to set other signals; use `computed` or `linkedSignal` instead.
- Keep RxJS for event streams; bridge with `toSignal()` / `toObservable()`. Unsubscribe with `takeUntilDestroyed()`.
- Change detection: on v22 OnPush is implied; on v20–21 set `changeDetection: ChangeDetectionStrategy.OnPush` on new components. Don't add `Eager` (or `Default`) to new components.
- Zoneless: never rely on Zone.js to refresh the view. Update a signal, use the `async` pipe, or call `markForCheck()`. Don't use `NgZone.onStable`/`onMicrotaskEmpty`; use `afterNextRender()` / `afterEveryRender()`. Wrap SSR async work in `PendingTasks`.
- Use `host: {}` in the decorator, not `@HostBinding`/`@HostListener`, in new code. Use `[class.x]`/`[style.x]` bindings, not `NgClass`/`NgStyle`.
- Name handlers for what they do (`saveUser()`), not the event (`onClick()`).

### Templates

- Use built-in control flow: `@if`, `@for` with `track` (a stable id, not `$index` for mutable lists), `@switch`, `@let`. Don't add `*ngIf`/`*ngFor` to new templates.
- Use `@defer` (with `on viewport`/`on idle` and a `@placeholder`) for heavy below-the-fold components.
- Keep logic in the class: no method calls that do work in bindings; use `computed` or pure pipes.
- Use `NgOptimizedImage` (`ngSrc`, `width`, `height`, `priority` for the LCP image).
- On v21+, use `@angular/aria` (accordion, combobox, grid, listbox, menu, tabs, toolbar, tree) or the project's existing component library for interactive widgets; don't hand-roll ARIA patterns. Add `data-testid` to interactive elements.

### Forms and data

- New forms on v22: Signal Forms (`form()`, `[formField]`, `submit()` from `@angular/forms/signals`). Validate with schema rules (`required`, `email`, `min`, …) or `validateStandardSchema()` with the project's Standard Schema library (Zod by default; see `conventions/phaedra`).
- Keep Reactive Forms in existing code and on v20–21 (Signal Forms are experimental in v21). Never use template-driven forms for non-trivial forms.
- Data loading: `httpResource()` for reads bound to signals; `rxResource()` when an Observable source is needed. Use `HttpClient` methods for writes. Type every response.
- Put HTTP calls in `core/services/<feature>-api.service.ts`, not in components. Use functional interceptors (`withInterceptors`) for auth headers and error handling.
- Use `withComponentInputBinding()` to read route params as inputs. On v22, `paramsInheritanceStrategy` defaults to `'always'`; don't assume a child route sees only its own params.

### Do / Don't

```ts
// ✓
export class UserCard {
  readonly user = input.required<User>();
  readonly selected = output<string>();
  protected readonly initials = computed(() => toInitials(this.user().name));
  private readonly api = inject(UserApiService);
}

// ✗
export class UserCard {
  @Input() user!: User;
  constructor(private api: UserApiService) {}
  get initials() { return toInitials(this.user.name); }
}
```

## Security

- **Sanitization:** never pass user-controlled data to `bypassSecurityTrustHtml`, `…Url`, `…ResourceUrl`, `…Script` or `…Style`. If a bypass is unavoidable, sanitize first (for example DOMPurify), keep it in one reviewed pipe or service, and comment the reason in the PR, not the code.
- Don't bind untrusted HTML with `[innerHTML]`; render text with interpolation. Don't put `i18n-href`, `i18n-src` or similar on attributes bound to user data on unpatched versions (CVE-2026-32635).
- Never build templates or components from user input (`createComponent` with user-chosen types, runtime JIT, `new Function`). Keep AOT on.
- Don't touch the DOM directly (`ElementRef.nativeElement.innerHTML`, `document.write`). Use bindings or `Renderer2`.
- **Trusted Types and CSP:** send `require-trusted-types-for 'script'; trusted-types angular angular#bundler;` and add `angular#unsafe-bypass` only if the app calls `bypassSecurityTrust*`. Use a strict CSP: per-request nonces via `ngCspNonce` or `CSP_NONCE` on SSR, or `"security": { "autoCsp": true }` in `angular.json` for static hosting.
- **XSRF:** keep HttpClient's XSRF protection. Never add `withNoXsrfProtection()`; configure names with `withXsrfConfiguration()` if the backend differs. Send credentials only to your own API origin; build URLs with absolute, allow-listed bases (CVE-2026-111753 leaked XSRF tokens via URL parsing).
- **Auth:** guards and route hiding are UX only. The API enforces authorization. Don't store tokens in `localStorage` when the backend can use `HttpOnly` cookies.
- **SSR (`@angular/ssr`):**
  - set `"security": { "allowedHosts": [...] }` in `angular.json`; never use `"*"`;
  - set `trustProxyHeaders` on `AngularAppEngine` only for headers your verified reverse proxy sets;
  - never let `TransferState`/`HttpTransferCache` cache per-user or credentialed responses (`includeRequestsWithAuthHeaders` stays off);
  - keep SSR packages on the latest patch; most 2026 advisories are SSR XSS, SSRF and DoS.
- **Service worker:** cache only public assets and public API responses in `ngsw-config.json`; never cache authenticated `dataGroups`.
- Environment files (`environment*.ts`) ship to the browser. No secrets.

## Known vulnerabilities (as of 2026-10)

Minimum safe framework versions (`@angular/core`, `common`, `compiler`, `platform-server`, `router`, `service-worker`): **22.2.1, 21.2.25, 20.3.34**; `@angular/ssr`: **22.1.7, 21.2.23, 20.3.36**. Latest: 22.2.4 / CLI 22.2.5. Keep every `@angular/*` package on the same version.

| Advisory | Package | Fixed in (22 / 21 / 20) |
|---|---|---|
| GHSA-w739-gvwx-grc3 / CVE-2026-111754: SSR open redirect via protocol-relative URLs | platform-server | 22.2.1 / 21.2.25 / 20.3.33 |
| GHSA-57xq-rjx2-v5xh / CVE-2026-111751 and GHSA-62vg-58rm-qff7 / CVE-2026-111752: SSR DoS in router | router | 22.2.1 / 21.2.25 / 20.3.33 (111752 only) |
| GHSA-jfgx-762w-99vr / CVE-2026-111753: XSRF token leak via URL parsing (incomplete fix of CVE-2025-66035) | common | not affected / 21.0.3 / 20.3.34 |
| GHSA-7g7c-h8rr-7p6q / CVE-2026-104871: CommonEngine path traversal on Windows | ssr | 22.1.7 / 21.2.23 / 20.3.36 |
| GHSA-f6mr-pjwc-34m4 / CVE-2026-88056 and related SSR XSS (CVE-2026-88058, -88060, -69149) | platform-server | 22.1.4 / 21.2.22 / 20.3.30 |
| GHSA-hh8m-fm6v-7cvg / CVE-2026-88057: sanitization bypass via directive host bindings | core, compiler | 22.1.0 / 21.2.20 / 20.3.28 |
| GHSA-jj27-h5hq-8x99 / CVE-2026-69151: i18n event-handler attribute XSS | core, compiler | 22.0.1 / 21.2.19 / 20.3.27 |
| GHSA-qxh6-94w6-9r5p / CVE-2026-54264: service worker leaks auth headers on cross-origin redirects | service-worker | 22.0.1 / 21.2.17 / 20.3.25 |
| GHSA-58w9-8g37-x9v5 / CVE-2026-54265: two-way binding sanitization bypass | compiler | 22.0.1 / 21.2.17 / 20.3.25 |
| GHSA-g93w-mfhg-p222 / CVE-2026-32635: i18n attribute binding XSS | core, compiler | 22.0.0 / 21.2.4 / 20.3.18 |
| GHSA-jrmj-c5cx-3cw6 / CVE-2026-22610: SVG `href` script XSS | compiler | 22.0.0 / 21.0.7 / 20.3.16 |

v19 and older get none of the fixes from June 2026 onward. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Unit tests: Vitest (`@angular/build:unit-test`) for new projects; keep Karma/Jasmine or Jest where they exist, and offer the move in `upgrade-angular`.
- Use `TestBed` with zoneless change detection; prefer `await fixture.whenStable()` over manual `detectChanges()`. Set inputs with `fixture.componentRef.setInput()`.
- Mock HTTP with `provideHttpClientTesting()` and `HttpTestingController`; assert there are no outstanding requests.
- Query by role and label first (Angular Testing Library if the project uses it); E2E (Playwright or Cypress) selects by `data-testid`.
- Add a test for each sanitization-sensitive binding (user content rendered as text, not HTML) and for guards redirecting when logged out.

## Before you finish

```sh
npx ng lint                 # or the project's ESLint/Biome command
npx tsc --noEmit -p tsconfig.app.json
npx ng test --watch=false
npx ng build
npm audit --audit-level=moderate
npm ls @angular/core @angular/ssr   # one version, at or above the minimum above
```
