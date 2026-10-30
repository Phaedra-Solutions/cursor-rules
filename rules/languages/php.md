---
id: languages/php
title: PHP
description: PHP 8.3-8.5 - supported versions and minimum safe patches, declare(strict_types=1), PER coding style, PHPStan or Psalm (with taint analysis), Composer with a committed lock and composer audit, PDO prepared statements, password_hash, no unserialize or eval on input, context-aware output escaping, file-upload safety, sessions and TLS. Use when editing .php files or composer.json.
applies_to: "php >=8.3 <9"
legacy_rule: legacy/php-legacy
globs: ["**/*.php", "composer.json"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://www.php.net/supported-versions.php
  - https://endoflife.date/php
  - https://www.php.net/ChangeLog-8.php
  - https://www.php-fig.org/per/coding-style/
  - https://phpstan.org/user-guide/rule-levels
  - https://psalm.dev/docs/security_analysis/
  - https://getcomposer.org/doc/03-cli.md#audit
  - https://www.php.net/manual/en/pdo.prepared-statements.php
  - https://www.php.net/manual/en/function.password-hash.php
  - https://www.php.net/manual/en/function.unserialize.php
  - https://www.php.net/manual/en/function.htmlspecialchars.php
  - https://www.php.net/manual/en/features.file-upload.php
  - https://www.php.net/manual/en/session.security.ini.php
  - https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html
---

# PHP

Laravel projects also apply `backend/laravel`. Generic secure-coding rules are in `core/security-baseline`; dependency rules in `core/supply-chain`.

## Version check

- Read `require.php` and `config.platform.php` in `composer.json`, the Dockerfile and CI, and `php -v`. State it:

  ```text
  Applying languages/php (PHP 8.4.27, Composer 2, PHPStan level 8, from composer.lock).
  ```

- **Supported (Oct 2026):** 8.5 (active to Dec 2027, security to Dec 2029); 8.4 (active to Dec 2026, security to Dec 2028); 8.3 (security only, to Dec 2027). **8.2 reaches EOL on 31 Dec 2026**; 8.1 and older are EOL → `legacy/php-legacy`, offer `upgrade-php`.
- **Minimum safe:** the 24 Sep 2026 security releases 8.5.11, 8.4.26, 8.3.35 (11 CVEs); latest patches 8.5.12, 8.4.27, 8.3.36.
- Use only features available in the lowest version in `require.php` (property hooks and asymmetric visibility need 8.4; the pipe operator `|>` needs 8.5; typed class constants need 8.3).

## Conventions

- `declare(strict_types=1);` at the top of every new file. Type every parameter, return and property; use `readonly` properties and classes, enums and `never` where they fit.
- PSR-4 autoloading via Composer; PER Coding Style (enforced with PHP-CS-Fixer, PHP_CodeSniffer or Laravel Pint, whichever the project uses).
- Static analysis in CI: PHPStan (level 8+ for new code, a baseline for legacy) or Psalm; Larastan for Laravel. Psalm's taint analysis (`--taint-analysis`) for code that handles untrusted input.
- Composer: commit `composer.lock`, install with `composer install --no-dev --prefer-dist --no-interaction` in production, run `composer audit` in CI, set `"config": {"allow-plugins": {...}}` explicitly.
- Use exceptions, not error suppression (`@`). Log with PSR-3 (Monolog); never log secrets.

## Security

- **SQL:** PDO with prepared statements and bound parameters; set `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION` and `PDO::ATTR_EMULATE_PREPARES => false`. Never interpolate input into SQL; identifiers (columns, sort direction) through allowlists.
- **Passwords:** `password_hash($pw, PASSWORD_ARGON2ID)` (or `PASSWORD_DEFAULT`), `password_verify`, `password_needs_rehash`. Never `md5`/`sha1`/`crypt` for passwords.
- **Deserialization and code execution:** never `unserialize()` on input (if unavoidable, `['allowed_classes' => false]`); use `json_decode(..., flags: JSON_THROW_ON_ERROR)`. Never `eval`, `assert` with strings, `create_function`, `preg_replace` with `/e`, or `extract()` on request data.
- **Shell:** avoid `exec`, `system`, `passthru`, `shell_exec`, backticks; if needed, `escapeshellarg()` every argument and allowlist the command, or use `proc_open` with an argument array (PHP 7.4+).
- **Output:** escape for the context: `htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` in HTML, `json_encode` with `JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT` inside `<script>`, `rawurlencode` in URLs. Use the framework's templating (Blade, Twig autoescape) instead of raw `echo`.
- **Includes and paths:** never `include`/`require` a path built from input; resolve file paths with `realpath()` and check they're inside the base directory. Keep `allow_url_include=Off`.
- **Uploads:** check `$_FILES[...]['error']`, size limits, the real MIME type (`finfo_file`), generate the stored name yourself, store outside the web root (or with execution disabled), and never trust the client file name or type.
- **Randomness:** `random_bytes()`, `random_int()`, `bin2hex(random_bytes(32))` for tokens; never `rand`, `mt_rand`, `uniqid` for secrets. Compare secrets with `hash_equals()`.
- **Sessions and cookies:** `session.use_strict_mode=1`, `session.cookie_httponly=1`, `session.cookie_secure=1`, `session.cookie_samesite=Lax`; `session_regenerate_id(true)` after login.
- **HTTP clients:** timeouts on every request (Guzzle `timeout`, `connect_timeout`); keep TLS verification on; validate outbound URLs from input (SSRF).
- **Configuration:** `display_errors=Off`, `expose_php=Off`, `log_errors=On` in production; keep `disable_functions` for unused dangerous functions where the platform allows.
- **XML:** disable external entities (libxml ≥ 2.9 does by default; never pass `LIBXML_NOENT` or `LIBXML_DTDLOAD` on untrusted XML).

## Known vulnerabilities (as of 2026-10)

| Release | Notes | Fixed in |
|---|---|---|
| 24 Sep 2026 security releases | 11 CVEs across core and bundled extensions (BCMath among them) | 8.5.11 / 8.4.26 / 8.3.35 / 8.2.34 |
| PHP 8.1 and older | EOL; no fixes after 8.1.34 (Dec 2025) | Upgrade |

Library advisories (Guzzle cookie and proxy bugs fixed in 7.15.2, `league/commonmark` XSS and DoS fixed in 2.10.2, Symfony HttpFoundation fixes) come through Composer; run `composer audit`. This list goes stale; verify with the `cve-check` skill, `composer audit` or OSV before relying on it.

## Testing

- PHPUnit or Pest; data providers for validation and escaping cases.
- Test that queries with metacharacters are handled as data, that upload handling rejects wrong types and paths, and that output is escaped.
- Run static analysis (PHPStan/Psalm) as part of the test job.

## Before you finish

```sh
composer validate --strict
composer install --no-interaction
vendor/bin/phpstan analyse              # or: vendor/bin/psalm (add --taint-analysis for input-handling code)
vendor/bin/php-cs-fixer fix --dry-run --diff   # or: vendor/bin/pint --test / vendor/bin/phpcs
vendor/bin/phpunit                      # or: vendor/bin/pest
composer audit
```
