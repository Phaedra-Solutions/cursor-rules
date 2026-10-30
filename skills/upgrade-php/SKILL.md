---
name: upgrade-php
description: Upgrade a project's PHP version one minor release at a time (for example 8.1 → 8.2 → 8.3 → 8.4) with Rector's PHP sets (withPhpSets), PHPStan at a fixed level with a baseline, Composer platform and dependency updates, deprecation notices treated as errors, and every runtime pin (composer.json, Docker, CI, hosting) updated together; verify with tests and a smoke test. Use when asked to upgrade PHP, when legacy/php-legacy applies (8.2 EOL 31 Dec 2026), or when a framework upgrade needs a newer PHP.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-30"
  sources: "https://www.php.net/supported-versions.php https://endoflife.date/php https://getrector.com/documentation https://getrector.com/documentation/set-lists https://phpstan.org/user-guide/rule-levels https://phpstan.org/user-guide/baseline https://www.php.net/manual/en/migration84.php https://www.php.net/manual/en/migration85.php https://getcomposer.org/doc/06-config.md#platform"
---

# Upgrade PHP

## When to use

- The user asks to upgrade PHP, or the project runs PHP 8.2 or older (see `legacy/php-legacy`).
- A dependency (Laravel 13 needs 8.3+) requires a newer PHP.

## Before you start

- List every place that pins PHP: `require.php` and `config.platform.php` in `composer.json`, Dockerfiles (`FROM php:…`), CI (`php-version:`), hosting/PaaS settings, and PHPStan/Psalm `phpVersion`.
- List extensions in use (`php -m`, `ext-*` in `composer.json`) and check they exist for the target (PECL extensions lag).
- Working tree clean; new branch (`chore/php-8.4`).
- Ask the user:
  - the target: **8.4** (security support to Dec 2028) or **8.5** (to Dec 2029); default 8.4 for existing apps;
  - whether to stop for review after each minor hop;
  - whether network installs are approved (`core/supply-chain` cooldown applies).

## Steps

1. **Baseline** on the current version: `composer install`, PHPStan, tests, and the app starting. Record failures. If PHPStan isn't set up, add it at a level the code passes and generate a baseline (`vendor/bin/phpstan analyse --generate-baseline`), so new errors stand out.
2. **Surface deprecations** on the current version: run the tests with `error_reporting=E_ALL` and deprecations converted to failures (PHPUnit `failOnDeprecation="true"` or `convertDeprecationsToExceptions`), and fix them first.
3. **Add Rector** (`composer require --dev rector/rector`) with a config that targets the next minor only:

   ```php
   // rector.php
   use Rector\Config\RectorConfig;

   return RectorConfig::configure()
       ->withPaths([__DIR__ . '/src', __DIR__ . '/app', __DIR__ . '/tests'])
       ->withPhpSets(php83: true);   // the hop's target: php82, php83, php84, php85
   ```

   ```sh
   vendor/bin/rector process --dry-run
   vendor/bin/rector process
   ```

   Review the diff; Rector's PHP sets modernize syntax but don't fix every runtime change.
4. **Hop one minor version:** update `require.php` (for example `"^8.3"`), `config.platform.php`, Docker, CI and hosting together; run `composer update --with-all-dependencies` for packages that need newer versions (one package group at a time); install missing extensions.
5. **Fix runtime changes** from the PHP migration guide for that version (backward-incompatible changes and deprecations). Examples: 8.2 dynamic properties deprecated (`#[\AllowDynamicProperties]` only as a temporary bridge); 8.3 typed class constants and `json_validate`; 8.4 implicitly nullable parameter types deprecated (`?Type $x = null`), new `Deprecated` attribute; 8.5 removals listed in its migration guide.
6. **Verify** (next section), show the diff and results, and wait for approval before the next hop. Commit only when asked (`git-commit` skill).
7. At the target, raise the PHPStan level gradually as a separate change, and switch to `languages/php`.

## Verify

```sh
php -v                                   # the hop's target, on every runner
composer validate --strict
composer install --no-interaction
vendor/bin/rector process --dry-run      # nothing left for this target
vendor/bin/phpstan analyse
vendor/bin/phpunit                       # or: vendor/bin/pest / php artisan test
composer audit
grep -rnE "\"php\":|php-version|FROM php:" composer.json Dockerfile* .github/ 2>/dev/null   # no old pins left
```

Then start the app on the target PHP: no deprecation or warning output in logs during a smoke test of key routes, CLI commands and queue workers.

## Safety

- Never skip minor versions in one hop, and never upgrade PHP and a framework major in the same change.
- Never silence deprecations with `error_reporting` or `@` to make the upgrade pass; never grow the PHPStan baseline to hide new errors.
- Never apply Rector to `vendor/`; review every Rector change.
- Never auto-commit, push or deploy; don't hand-edit `composer.lock`.
