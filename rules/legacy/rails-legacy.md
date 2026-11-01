---
id: legacy/rails-legacy
title: Rails 7.2 and older
description: Safe maintenance of unsupported Ruby on Rails versions (7.2 ended 9 Aug 2026, 7.1 ended 1 Oct 2025, 7.0, 6.x and older) - support policy and last releases, the 2025-2026 advisories they don't get (Active Storage CVE-2026-66066 file read and RCE via libvips, Active Support and Action View XSS and ReDoS, Rack fixes), compensating controls (VIPS_BLOCK_UNTRUSTED, patched Rack, strong parameters, CSP), Ruby version limits, Rails LTS as a commercial option, and the one-minor-at-a-time upgrade path to Rails 8.1 with dual boot via next_rails. Use when the installed rails gem is below 8.0.
applies_to: "any"
globs: ["Gemfile", "Gemfile.lock", "config/application.rb", "config/environments/**", "config/initializers/**", "app/**/*.rb", "app/views/**", "config/routes.rb", ".ruby-version"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://rubyonrails.org/maintenance
  - https://endoflife.date/rails
  - https://endoflife.date/ruby
  - https://rubyonrails.org/security
  - https://discuss.rubyonrails.org/c/security-announcements/9
  - https://osv.dev/vulnerability/GHSA-xr9x-r78c-5hrm
  - https://guides.rubyonrails.org/upgrading_ruby_on_rails.html
  - https://github.com/fastruby/next_rails
  - https://railslts.com/
  - https://brakemanscanner.org/
---

# Rails 7.2 and older

Also apply `core/legacy-mode`. Don't upgrade as part of an unrelated task.

## Version check

- Read `rails` (and the component gems), `rack`, `ruby-vips`/`mini_magick`, and Ruby (`.ruby-version`, `Gemfile` `ruby`, Docker image) from `Gemfile.lock`. State them:

  ```text
  Applying legacy/rails-legacy (rails 7.1.6, rack 2.2.20, ruby-vips 2.2, Ruby 3.2, from Gemfile.lock).
  ```

- **Rails support (Oct 2026):**
  - **8.1:** bug fixes ended 10 Oct 2026; security fixes until 10 Oct 2027 (latest 8.1.4).
  - **8.0:** security fixes until **7 Nov 2026**.
  - **7.2:** EOL 9 Aug 2026 (last 7.2.4); **7.1:** EOL 1 Oct 2025 (7.1.6); **7.0:** EOL 1 Apr 2025; **6.1** and older: long unsupported.
- **Ruby:** 3.3, 3.4 and 4.0 are supported; 3.2 reached EOL 31 Mar 2026. Old Rails often pins the project to an EOL Ruby too; record both.
- Report the EOL status in every change summary and offer `upgrade-rails`. Rails LTS (makandra) sells patched builds for old Rails lines; mention it, don't decide for the user.

## Conventions

- Write code for the installed Rails: no 8.x features (built-in authentication generator, Solid Queue/Cache/Cable defaults, `params.expect`) on 7.x; check the guide for that version.
- Fix deprecation warnings in the code you touch (`ActiveSupport::Deprecation` output in test logs); they're the next version's removals.
- Add gems only if their supported Rails and Ruby ranges include the installed ones.
- Keep `config.load_defaults` at the version the app has been migrated to; change it deliberately, one framework default at a time.

## Security

- **Patch what you can:** update `rack` to **2.2.23** (or 3.1.21 / 3.2.6 if the app uses Rack 3): it fixes 2026 directory traversal, `Rack::Static` and multipart DoS issues that also affect old Rails apps. Update `nokogiri`, `puma`, `ruby-vips` and other gems independently of Rails.
- **Active Storage variants (CVE-2026-66066, critical):** unauthenticated file read (including `secret_key_base` from the environment) and possible RCE through libvips loaders on uploaded files. Unfixed below 7.2.3.2. Mitigate with libvips ≥ 8.13 and `VIPS_BLOCK_UNTRUSTED=1` in the environment, or `Vips.block_untrusted(true)` in an initializer with ruby-vips ≥ 2.2.1; remove `ruby-vips` if you don't generate variants. Rotate `secret_key_base` and credentials if exposure is possible.
- **Other unfixed advisories on 7.1 and older:** Active Storage `DiskService` path traversal and glob injection, proxy-mode DoS and direct-upload content-type bypass (CVE-2026-33195, CVE-2026-33202, CVE-2026-33174, CVE-2026-33173); Active Support `SafeBuffer#%` XSS and number-helper ReDoS/DoS (CVE-2026-33170, CVE-2026-33169, CVE-2026-33176); Action View tag-helper XSS (CVE-2026-33168). Compensating controls:
  - store Active Storage files in a cloud service rather than `DiskService` where possible; don't use proxy mode for public files; validate content types server-side after upload;
  - don't format user input with `SafeBuffer#%` or pass it to number helpers without length limits;
  - a strict Content Security Policy (`config/initializers/content_security_policy.rb`) with nonces to limit XSS impact.
- **Baseline rules that matter most on old versions:** strong parameters (`params.require(...).permit(...)`, never `permit!`), no `html_safe`/`raw` on user input, parameterized queries (`where(name: value)`, `sanitize_sql_array`), CSRF protection on, `config.force_ssl = true`, secrets in credentials or the environment, not in the repo.
- Run Brakeman and bundler-audit on every change.

## Known vulnerabilities

| Advisory | Component | Fixed in (supported lines) |
| --- | --- | --- |
| CVE-2026-66066 file read / RCE via libvips variants | activestorage | 7.2.3.2, 8.0.5.1, 8.1.3.1 |
| CVE-2026-33195, CVE-2026-33202 DiskService path traversal, glob injection | activestorage | 7.2.3.1, 8.0.4.1, 8.1.2.1 |
| CVE-2026-33170 XSS in `SafeBuffer#%`; CVE-2026-33169, CVE-2026-33176 ReDoS/DoS | activesupport | 7.2.3.1, 8.0.4.1, 8.1.2.1 |
| CVE-2026-33168 XSS in tag helpers | actionview | 7.2.3.1, 8.0.4.1, 8.1.2.1 |
| CVE-2025-24293 unsafe image transformation methods | activestorage | 7.1.5.2, 7.2.2.2, 8.0.2.1 |
| CVE-2025-55193 ANSI escape injection in logs | activerecord | 7.1.5.2, 7.2.2.2, 8.0.2.1 |
| CVE-2026-22860, CVE-2026-34785 and others (traversal, static files, multipart DoS) | rack | 2.2.23, 3.1.21, 3.2.6 |

This list goes stale; verify with the `cve-check` skill, the Rails security announcements or OSV (RubyGems) before relying on it.

## Migration path

1. Patch to the last release of the current minor (for example 7.1.6) and update Rack and other gems; fix deprecation warnings.
2. Upgrade **one minor at a time** (6.1 → 7.0 → 7.1 → 7.2 → 8.0 → 8.1) with the `upgrade-rails` skill: dual boot with `next_rails` (`Gemfile.next`), run `rails app:update`, flip `load_defaults` per framework default, keep CI green on both.
3. Move Ruby to a supported version along the way (Rails 8 needs Ruby 3.2+; target 3.4 or 4.0) as separate steps.
4. After 8.1 is stable, adopt new defaults (Solid Queue, authentication generator) as separate changes.

## Testing

- Before upgrading, make sure tests cover authentication, authorization, uploads and the main forms; add request specs for critical flows.
- Track deprecations in CI (`next_rails` deprecation tracker: `DEPRECATION_TRACKER=save` then `compare`).

## Before you finish

```sh
bundle exec rails about                    # Rails, Ruby, Rack versions in use
bundle exec rspec                          # or: bin/rails test
bundle exec brakeman --no-pager -q
bundle exec bundle-audit check --update
```
