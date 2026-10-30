---
id: backend/laravel
title: Laravel
description: Laravel 12 and 13 on PHP 8.3+ - support dates and minimum safe patches, Form Requests, Policies and Gates on every action, $fillable mass assignment, bound raw queries, Blade escaping, CSRF, Sanctum, rate limiting, signed URLs, queues and jobs that fail loudly and retry safely, encrypted secrets and APP_DEBUG off, Livewire and Filament advisories. Use when editing app/, routes/, Blade views, config/ or migrations in a Laravel project.
applies_to: "packagist:laravel/framework >=12.0 <14, php >=8.3 <9"
legacy_rule: legacy/php-legacy
globs: ["app/**/*.php", "routes/**/*.php", "resources/views/**/*.blade.php", "config/**/*.php", "database/migrations/**"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://laravel.com/docs/13.x/releases
  - https://endoflife.date/laravel
  - https://laravel.com/docs/13.x/validation
  - https://laravel.com/docs/13.x/authorization
  - https://laravel.com/docs/13.x/eloquent#mass-assignment
  - https://laravel.com/docs/13.x/queues
  - https://laravel.com/docs/13.x/urls#signed-urls
  - https://laravel.com/docs/13.x/rate-limiting
  - https://laravel.com/docs/13.x/routing#rate-limiting
  - https://laravel.com/docs/13.x/sanctum
  - https://laravel.com/docs/13.x/csrf
  - https://laravel.com/docs/13.x/blade
  - https://laravel.com/docs/13.x/configuration
  - https://laravel.com/docs/13.x/filesystem
  - https://livewire.laravel.com/docs/security
  - https://github.com/livewire/livewire/security/advisories/GHSA-29cq-5w36-x7w3
  - https://www.cisa.gov/known-exploited-vulnerabilities-catalog
  - https://osv.dev/vulnerability/GHSA-f9x3-7vq9-cph6
  - https://osv.dev/vulnerability/GHSA-5wcm-3v2w-8362
  - https://osv.dev/vulnerability/GHSA-jh5r-qr3c-85q8
  - https://osv.dev/vulnerability/GHSA-crmm-hgp2-wgrp
  - https://osv.dev/vulnerability/GHSA-5vg9-5847-vvmq
  - https://osv.dev/vulnerability/GHSA-g3hc-697w-wm82
  - https://osv.dev/vulnerability/GHSA-mhf7-xp6r-6qrc
  - https://osv.dev/vulnerability/GHSA-52xp-w8hr-xv3c
---

# Laravel

Also apply `languages/php`. Database rules are in `data/postgres`; generic web security in `core/security-baseline`.

## Version check

- Read `laravel/framework`, `livewire/livewire`, `filament/filament`, `laravel/sanctum`, `inertiajs/inertia-laravel` and PHP from `composer.lock`, and state them:

  ```text
  Applying backend/laravel (laravel/framework 13.39.0, PHP 8.4, Livewire 4.4, Sanctum 4.3, from composer.lock).
  ```

- **Support:** Laravel 13 (PHP 8.3–8.5): bug fixes to Q3 2027, security to 17 Mar 2028. Laravel 12 (PHP 8.2–8.5): security only, to 24 Feb 2027. **Laravel 11 security support ended 12 Mar 2026**; 10 and older are EOL → `legacy/php-legacy`, offer `upgrade-laravel`.
- **Minimum safe:** `laravel/framework` 13.30.0 or 12.69.0; Livewire 3.8.3 or 4.4.8 (v3 below 3.6.4 has the CISA KEV-listed CVE-2025-54068); Filament 5.8.3 or 4.13.3.

## Conventions

- Keep controllers thin: validate with a Form Request, authorize with a Policy, call an action or service class, return a Resource (API) or view.
- **Validation:** Form Requests (`php artisan make:request`) with explicit rules for every field; use `$request->validated()` / `$request->safe()`, never `$request->all()`, for writes.
- **Authorization:** a Policy per model, registered or auto-discovered, and `$this->authorize()` / `Gate::authorize()` / `can` middleware on **every** action that reads or changes a model. Scope queries to the user or tenant (`$user->orders()->findOrFail($id)`).
- **Mass assignment:** `$fillable` on every model; never `$guarded = []` or `Model::unguard()`. Don't put `is_admin`, `role`, `user_id` or `tenant_id` in `$fillable`; set them from the authenticated context.
- **API responses:** Eloquent API Resources with explicit fields; `$hidden` for secrets on models as a backstop.
- **Queries:** Eloquent or the query builder with bindings. `whereRaw`, `selectRaw`, `orderByRaw`, `havingRaw` and `DB::raw()` only with `?` bindings, never interpolated input; column and sort names from allowlists. Eager-load relations (`with()`), and enable `Model::preventLazyLoading()` outside production to catch N+1 queries.
- **Migrations:** one per change, reversible `down()`, safe for large tables (see `data/postgres`).
- **Config:** read `env()` only inside `config/` files; elsewhere use `config()`. Run `php artisan config:cache` in production.
- **Queues and jobs:**
  - set `$tries`, `$backoff`, `$timeout` and (for idempotency) `ShouldBeUnique` or a unique key on every job;
  - let exceptions bubble so the job fails and retries; use `$this->fail()` for permanent failures; implement `failed()` to log or notify;
  - pass IDs, not whole models with sensitive data; the queue payload is stored in Redis or the database;
  - dispatch after commit (`afterCommit()` or `'after_commit' => true`) so jobs don't run on rolled-back data;
  - run workers under Supervisor or Horizon with `--max-time`/`--max-jobs` and restart them on deploy (`php artisan queue:restart`).

## Security

- **Debug:** `APP_DEBUG=false` and `APP_ENV=production` in production; debug pages leak environment and source (and had an XSS until 12.69.0/13.30.0). Never expose Telescope, Horizon, Pulse or Debugbar without auth.
- **Secrets:** `APP_KEY` set and secret; never committed `.env`. Use `php artisan env:encrypt` or a secret manager for deploy-time secrets.
- **Blade:** `{{ }}` escapes; `{!! !!}` only for HTML you sanitized (for example with an HTML purifier); never put user data into JavaScript blocks or attributes without encoding (`Js::from()`).
- **CSRF:** keep the CSRF middleware in the `web` group (`PreventRequestForgery` on Laravel 13, which checks `Sec-Fetch-Site` and then the token; `ValidateCsrfToken` on 12); exclude only signature-verified webhooks.
- **Auth:** Sanctum for SPA (cookie) and mobile/API (token) auth with token abilities; Fortify or Breeze/Jetstream for login flows with throttling and 2FA where needed. Hash with the default `Hash` (bcrypt or argon2id).
- **Rate limiting:** define limiters in `AppServiceProvider` (`RateLimiter::for('login', …)`) and apply `throttle:` middleware to login, registration, password reset, OTP and expensive routes, keyed by user and IP.
- **Signed URLs:** `URL::temporarySignedRoute()` for email verification, downloads and unsubscribe links, verified with the `signed` middleware; keep expirations short. Patch to 12.61.1/13.12.0 or later (signed URL path confusion).
- **Files:** store uploads on a private disk; serve them through a controller that authorizes and uses `Storage::download()`; validate with `file`, `mimes`/`mimetypes`, `max` rules; never use client file names as paths.
- **Livewire:** public properties are user-controllable: validate and authorize in every action, lock properties that shouldn't change (`#[Locked]`), and never put secrets in component state. Keep Livewire patched.
- **Headers:** add security headers and a CSP via middleware or the web server; set `SESSION_SECURE_COOKIE=true` and `SameSite` on cookies; configure `TrustProxies` with your proxy IPs only.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2025-54068: unauthenticated RCE via component property updates (CISA KEV) | livewire/livewire 3.0.0-beta.1 – 3.6.3 | 3.6.4 |
| CVE-2026-81887: DOM XSS in client-side state handling; GHSA-mhf7-xp6r-6qrc: `#[Authorize]` bypass | livewire/livewire | 3.8.3 / 4.3.4; 4.4.8 |
| CVE-2026-114509: TokenGuard authentication bypass via non-string API credentials | laravel/framework | 12.68.0 / 13.29.0 |
| CVE-2026-114508: relationship inclusion triggers unauthorized data destruction | laravel/framework 12.45+ | 12.68.0 / 13.27.0 |
| CVE-2026-102279: XSS in the debug page | laravel/framework | 12.69.0 / 13.30.0 |
| GHSA-crmm-hgp2-wgrp: temporary signed URL path confusion; CVE-2026-48019: CRLF injection in the `email` rule | laravel/framework | 12.61.1 / 13.12.0; 12.60.0 / 13.10.0 |
| CVE-2026-77567, CVE-2026-104181 and other 2026 MFA bypasses | filament/filament | 4.13.3 / 5.8.3 |

This list goes stale; verify with the `cve-check` skill, `composer audit` or OSV before relying on it.

## Testing

- Feature tests (PHPUnit or Pest) per route: guests are redirected or get 401, another user's model returns 403/404, invalid input returns 422 with errors, and the success case.
- Test Policies directly, and that mass assignment ignores protected fields.
- `Queue::fake()` / `Bus::fake()` to assert dispatches; a test that a failing job is retried and `failed()` runs.
- Livewire: `Livewire::test()` that actions authorize and that locked properties can't be changed.

## Before you finish

```sh
composer validate --strict
vendor/bin/pint --test
vendor/bin/phpstan analyse              # with Larastan
php artisan test                        # or: vendor/bin/pest
composer audit
php artisan about --only=environment    # APP_DEBUG and APP_ENV as expected for the target
composer show laravel/framework livewire/livewire filament/filament 2>/dev/null | grep -E "^versions"   # at or above the fixed versions
```
