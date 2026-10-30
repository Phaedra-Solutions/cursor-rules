---
id: legacy/php-legacy
title: PHP 8.2 and older, Laravel 11 and older, CodeIgniter 3
description: Safe maintenance of PHP 8.2 and older (8.2 EOL 31 Dec 2026; 8.1 EOL Dec 2025), Laravel 11 and older (11 security support ended 12 Mar 2026) and CodeIgniter 3 - status and last releases, advisories left unfixed, Livewire 2 and early 3, safe-maintenance rules, compensating controls and the migration path to PHP 8.4/8.5 and Laravel 13. Use when composer.json requires PHP below 8.3, laravel/framework below 12, or codeigniter/framework 3.x.
applies_to: "php >=5.6 <8.3"
globs: ["**/*.php", "composer.json", "application/**/*.php", "system/**/*.php"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://www.php.net/supported-versions.php
  - https://endoflife.date/php
  - https://www.php.net/ChangeLog-8.php
  - https://laravel.com/docs/13.x/releases
  - https://endoflife.date/laravel
  - https://laravel.com/docs/12.x/upgrade
  - https://github.com/bcit-ci/CodeIgniter
  - https://codeigniter.com/user_guide/installation/upgrade_4xx.html
  - https://github.com/livewire/livewire/security/advisories/GHSA-29cq-5w36-x7w3
  - https://osv.dev/vulnerability/GHSA-f9x3-7vq9-cph6
  - https://osv.dev/vulnerability/GHSA-jh5r-qr3c-85q8
  - https://osv.dev/vulnerability/GHSA-crmm-hgp2-wgrp
  - https://osv.dev/vulnerability/GHSA-5vg9-5847-vvmq
  - https://osv.dev/vulnerability/GHSA-gv7v-rgg6-548h
  - https://osv.dev/vulnerability/GHSA-f3cx-396f-7jqp
  - https://getrector.com/documentation
---

# PHP 8.2 and older, Laravel 11 and older, CodeIgniter 3

Also apply `core/legacy-mode` and the Security sections of `languages/php` and `backend/laravel`; SQL, escaping, uploads, mass assignment and authorization rules don't depend on the version. Don't upgrade as part of an unrelated task.

## Version check

- Read `require.php`, `config.platform.php`, `laravel/framework`, `livewire/livewire` or `codeigniter/framework` from `composer.json`/`composer.lock` (CodeIgniter 3 apps often vendor `system/` without Composer: check `system/core/CodeIgniter.php` for `CI_VERSION`). State it:

  ```text
  Applying legacy/php-legacy (PHP 8.1.34, laravel/framework 10.50.4, Livewire 2.12, from composer.lock).
  ```

- **PHP:** 8.2 gets security fixes until **31 Dec 2026** (latest 8.2.35); 8.1 EOL 31 Dec 2025 (last 8.1.34); 8.0 EOL Nov 2023; 7.4 EOL Nov 2022; 5.x long EOL. On 8.2, apply the 24 Sep 2026 security release (8.2.34) or later and plan the upgrade now.
- **Laravel:** 11 security support ended 12 Mar 2026 (releases continue, but OSV still lists four 2026 advisories as unfixed on 11.57.1); 10 ended Feb 2025; 9 and older earlier.
- **CodeIgniter 3:** last release 3.1.13 (Mar 2022); the repository has had no release since. Treat it as unmaintained; CodeIgniter 4 (4.7.x, PHP 8.2+) is a rewrite, not an upgrade.
- Report EOL components in the summary and offer `upgrade-php` / `upgrade-laravel`.

## Conventions

- Write code for the installed PHP: no readonly classes, `true` type or DNF types below 8.2; no enums, `readonly` properties, fibers or `never` below 8.1; no named arguments, nullsafe `?->`, `match` or constructor promotion below 8.0.
- Laravel ≤ 11: follow the project's structure (pre-11 apps have `app/Http/Kernel.php` and `RouteServiceProvider`); don't add Laravel 12/13-only APIs.
- CodeIgniter 3: use the Query Builder with bindings (`$this->db->query($sql, [$id])`, `where('col', $value)`), `$this->security->xss_clean()` is not a substitute for output escaping (use `html_escape()`), keep `$config['csrf_protection'] = TRUE`, and store sessions in the database or files with `sess_match_ip`/`sess_regenerate` settings.
- Pin Composer dependencies to versions that support the installed PHP (`config.platform.php`), and don't add packages that require newer PHP.

## Safe maintenance

- Stay on the last patch of each component; run `composer audit` and update within constraints (`composer update --with-all-dependencies` for one package at a time).
- **Livewire:** v3 below 3.6.4 has an unauthenticated RCE (CVE-2025-54068, CISA KEV); upgrade to ≥ 3.8.3 even on old Laravel (Livewire 3 supports Laravel 10+). Livewire 2 below 2.12.7 has a file-upload RCE (CVE-2024-47823).
- **Unfixed Laravel 10/11 advisories** (TokenGuard bypass, debug-page XSS, signed-URL path confusion, CRLF in the `email` rule). Compensating controls:
  - `APP_DEBUG=false` everywhere reachable from the internet;
  - don't use the `token` guard with API credentials taken from request bodies or JSON (prefer Sanctum);
  - avoid relying on `temporarySignedRoute()` for sensitive downloads, or add your own authorization check in the controller;
  - validate email input with a strict regex rejecting CR/LF before using it in mail headers.
- **Laravel environment manipulation** (CVE-2024-52301): patched in late 9.x/10.x/11.x releases; make sure `register_argc_argv` is off in web SAPIs.
- Run behind a patched web server or reverse proxy with request-size limits and a WAF rule set, with `expose_php=Off` and `display_errors=Off`.

## Security

- Every rule in the Security sections of `languages/php` and `backend/laravel` applies.
- Old PHP defaults: on PHP 7.x, `unserialize` without `allowed_classes`, `assert()` with strings and `mt_rand` for tokens are common; fix them when you touch the code.
- Never disable TLS verification in old cURL or Guzzle setups to work around outdated CA bundles; update the bundle.

## Known vulnerabilities (as of 2026-10)

| Advisory | Component | Status |
|---|---|---|
| CVE-2026-114509 (TokenGuard bypass), CVE-2026-102279 (debug-page XSS), GHSA-crmm-hgp2-wgrp (signed URL path confusion), CVE-2026-48019 (CRLF in `email` rule) | laravel/framework 10.x, 11.x | Fixed only in 12.x/13.x |
| CVE-2025-54068: unauthenticated RCE (CISA KEV) | livewire/livewire 3.0.0-beta.1 – 3.6.3 | 3.6.4 (use ≥ 3.8.3) |
| CVE-2024-47823: RCE via file uploads | livewire/livewire < 2.12.7, 3.0 – 3.5.1 | 2.12.7 / 3.5.2 |
| CVE-2024-52301: environment manipulation via query string | laravel/framework | 10.48.23 / 11.31.0 (and backports) |
| PHP 8.1 and older | PHP | No fixes after EOL |

This list goes stale; verify with the `cve-check` skill, `composer audit` or OSV before relying on it.

## Migration path

1. Patch everything within its current line; get tests and static analysis (PHPStan with a baseline) running.
2. PHP: use `upgrade-php` (Rector set per version, one minor at a time) to 8.3, then 8.4/8.5.
3. Laravel: use `upgrade-laravel`, one major at a time (10 → 11 → 12 → 13), after PHP meets each version's minimum.
4. CodeIgniter 3: plan a rewrite to CodeIgniter 4 or a port to Laravel; strangle the app route by route rather than all at once. Until then, apply the compensating controls above.

## Testing

- Before any upgrade, make sure feature tests cover auth, authorization and main flows; add characterization tests where there are none.
- Run tests on the current and target PHP in CI during the migration.

## Before you finish

```sh
php -v
composer audit
vendor/bin/phpstan analyse              # with a baseline on legacy code
vendor/bin/phpunit                      # or: php artisan test
composer show laravel/framework livewire/livewire 2>/dev/null | grep -E "^versions"
```
