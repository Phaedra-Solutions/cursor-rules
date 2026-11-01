# Prompt 23: PHP and Laravel (+ legacy, upgrade skills)

> Self-contained; safe in a fresh session. Roadmap: Phase 3, §7 (`backend/laravel`), §8.2.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §7 entry `backend/laravel`, the Livewire row of §5.8, and the PHP/Laravel row of §8.2.
3. Research:
   - PHP supported versions and EOL dates;
   - the latest Laravel release and support policy; the Laravel security docs;
   - Livewire CVEs (CVE-2025-54068 and newer);
   - `composer audit`; Rector; Psalm taint analysis; PHPStan;
   - CodeIgniter 3 status.

## Task
1. **`rules/languages/php.md`:**
   - tier P1; globs `**/*.php`, `composer.json`;
   - `legacy_rule: legacy/php-legacy`;
   - `declare(strict_types=1)`; PER coding style; PDO prepared statements;
   - `password_hash`; no `unserialize` or `eval` on input; output escaping; file-upload safety.
2. **`rules/backend/laravel.md`:**
   - tier P1; globs `app/**/*.php`, `routes/**/*.php`, `resources/views/**/*.blade.php`, `config/**/*.php`, `database/migrations/**`;
   - `legacy_rule: legacy/php-legacy`;
   - cover the §7 entry; queues and jobs; signed URLs; rate limiting.
3. **`rules/legacy/php-legacy.md`:**
   - PHP ≤ 8.2, Laravel ≤ 11 and CodeIgniter 3;
   - EOL status; known CVEs; safe-maintenance rules; compensating controls;
   - migration path.
4. **`skills/upgrade-php/SKILL.md`:** Rector rule sets per version; PHPStan level checks; tests.
5. **`skills/upgrade-laravel/SKILL.md`:** one major at a time, following the official upgrade guide; dependency compatibility checks; tests. Mention Laravel Shift as an optional paid tool.

## Done when
All five files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
