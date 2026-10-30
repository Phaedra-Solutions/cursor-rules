---
id: cms-commerce/wordpress
title: WordPress plugins and themes
description: WordPress 7.1 plugin and theme development - version status and the update policy (7.1.4 security release, auto-updates), capability checks with current_user_can, nonces for every state change, sanitize input and escape output late (esc_html, esc_attr, esc_url, wp_kses), $wpdb->prepare with %s, %d and %i, REST routes with a real permission_callback and argument validation, admin-ajax handlers, safe file uploads, no direct file access, plugin and theme vetting, secrets and wp-config hardening, and WordPress Coding Standards with PHPCS. Use when editing plugin or theme PHP, functions.php or wp-config.php.
applies_to: "wordpress >=6.8 <8, php >=8.2 <9"
globs: ["wp-content/**/*.php", "**/wp-content/**/*.php", "functions.php", "**/functions.php", "plugins/**/*.php", "themes/**/*.php", "wp-config*.php"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://wordpress.org/download/releases/
  - https://wordpress.org/news/category/security/
  - https://developer.wordpress.org/apis/security/
  - https://developer.wordpress.org/apis/security/nonces/
  - https://developer.wordpress.org/apis/security/sanitizing/
  - https://developer.wordpress.org/apis/security/escaping/
  - https://developer.wordpress.org/plugins/security/
  - https://developer.wordpress.org/plugins/security/checking-user-capabilities/
  - https://developer.wordpress.org/reference/classes/wpdb/prepare/
  - https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/
  - https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/
  - https://developer.wordpress.org/advanced-administration/security/hardening/
  - https://wordpress.org/documentation/article/configuring-automatic-background-updates/
  - https://github.com/WordPress/WordPress-Coding-Standards
  - https://patchstack.com/whitepaper/state-of-wordpress-security-in-2026/
---

# WordPress plugins and themes

Also apply `languages/php`. WooCommerce and page-builder extensions follow the same rules plus their own APIs.

## Version check

- Read the WordPress version (`wp core version`, `$wp_version` in `wp-includes/version.php`, or the Docker image / Composer `johnpbloch/wordpress` or `roots/wordpress` pin), the PHP version, and the plugin header (`Requires at least`, `Requires PHP`, `Tested up to`). State them:

  ```text
  Applying cms-commerce/wordpress (WordPress 7.1.4, PHP 8.3, custom plugin with REST routes, Bedrock layout).
  ```

- **Current (Oct 2026):** WordPress **7.1** (released 19 Aug 2026); **7.1.4** (28 Oct 2026) is a security release, as was 7.1.3 (6 Oct, 7 security fixes). Only the latest branch is fully supported; older branches get backported security fixes as a courtesy (7.0.8 shipped the same day). Run the latest 7.1.x.
- WordPress still accepts PHP 7.4, but run a supported PHP (8.3+ recommended, see `languages/php`).

## Conventions

- Prefix everything global (functions, options, hooks, constants, CSS classes) or use PHP namespaces; one plugin bootstrap file with the header, code in `includes/` or `src/` with Composer autoload.
- Guard every PHP file against direct access: `defined( 'ABSPATH' ) || exit;`.
- Hooks over core edits: never modify core, parent themes or third-party plugins; use child themes, actions and filters.
- Enqueue assets with `wp_enqueue_script`/`wp_enqueue_style` and versions; pass data with `wp_localize_script` or `wp_add_inline_script` with `wp_json_encode`.
- Options and meta with `register_setting`/`register_meta` and sanitize callbacks; custom tables only when needed, created with `dbDelta` on activation.
- Block development with `@wordpress/scripts` and `block.json`; server-rendered blocks escape output like templates.
- Code style: WordPress Coding Standards via PHPCS (`WordPress` ruleset with `WordPress.Security` sniffs on); PHPStan with WordPress stubs where the project uses it.

## Security

- **Capabilities:** check `current_user_can( 'edit_post', $post_id )` (or a specific capability) before every privileged action and before showing privileged UI; `is_admin()` and `is_user_logged_in()` are not authorization. Broken access control was the most exploited WordPress vulnerability class in 2025.
- **Nonces:** every form, link and AJAX call that changes state carries a nonce (`wp_nonce_field`, `wp_create_nonce`) verified with `check_admin_referer`, `check_ajax_referer` or `wp_verify_nonce`. Nonces stop CSRF; they don't authorize, so check capabilities as well.
- **Sanitize input, escape output late:**
  - input: `sanitize_text_field`, `sanitize_email`, `sanitize_key`, `absint`, `esc_url_raw`, `wp_kses_post` for allowed HTML, after `wp_unslash()`; validate against allowlists for enums;
  - output: `esc_html`, `esc_attr`, `esc_url`, `esc_textarea`, `wp_kses` / `wp_kses_post`, and `wp_json_encode` for JavaScript, at the point of output, including translated strings (`esc_html__`, `esc_attr_e`).
- **SQL:** `$wpdb->prepare( "SELECT * FROM %i WHERE user_id = %d AND status = %s", $table, $user_id, $status )`; placeholders unquoted, `%i` for identifiers (WordPress 6.2+), `$wpdb->esc_like()` for `LIKE`; never concatenate request data. Prefer `WP_Query`, `get_posts` and meta APIs.
- **REST API:** every `register_rest_route` has a `permission_callback` that checks capabilities (`__return_true` only for truly public read endpoints) and `args` with `type`, `validate_callback` and `sanitize_callback`; return `WP_Error` with proper status codes; don't expose user emails or private meta in responses.
- **AJAX:** `wp_ajax_{action}` handlers check nonce and capability; `wp_ajax_nopriv_` only for public actions with rate limiting.
- **Files:** uploads through `wp_handle_upload` / `media_handle_upload` with `wp_check_filetype_and_ext` and an allowlist; no user-controlled paths in `include`, `file_get_contents` or `unlink` (use `validate_file` and `realpath` checks); no `eval`, `unserialize` on user data (`maybe_unserialize` included) or `extract`.
- **Redirects and HTTP:** `wp_safe_redirect` with allowed hosts; outbound calls through `wp_remote_get`/`wp_safe_remote_get` with timeouts.
- **Secrets and config:** keys and salts unique per site, credentials from environment variables in `wp-config.php` (never committed); `DISALLOW_FILE_EDIT` true in production (`DISALLOW_FILE_MODS` where deployments are Git-based); `WP_DEBUG_DISPLAY` false; disable XML-RPC if unused.
- **Plugin and theme vetting:** before adding one, check active installs, last update, open support threads, whether it's closed on WordPress.org, and its history in Patchstack or WPScan; avoid nulled premium plugins; remove unused plugins and themes.
- **Update policy:** automatic minor/security core updates on; security updates for plugins applied within days (heavily targeted vulnerabilities were mass-exploited a median of 5 hours after disclosure in 2025); use staging plus auto-updates or a managed virtual-patching service for production sites.

## Known vulnerabilities

- **Ecosystem (Patchstack, 2025 data):** 11,334 new vulnerabilities; 91% in plugins, 9% in themes, 6 low-priority issues in core; 46% weren't fixed by the vendor in time for public disclosure.
- **Core:** 7.1.3 (6 Oct 2026) and 7.1.4 (28 Oct 2026) are security releases; run 7.1.4 or later on the 7.1 branch.

This list goes stale; verify with the `cve-check` skill, the WordPress security release posts, Patchstack or WPScan before relying on it.

## Testing

- PHPUnit with the WordPress test suite (`wp scaffold plugin-tests`) or `wp-env`; tests that unauthorized users and missing nonces get 403 on REST routes and AJAX handlers.
- Plugin Check (`wp plugin check`) for WordPress.org plugins; E2E with Playwright and `@wordpress/e2e-test-utils-playwright`.

## Before you finish

```sh
vendor/bin/phpcs --standard=WordPress --extensions=php wp-content/plugins/<plugin>
vendor/bin/phpunit
wp core version && wp plugin list --update=available   # against the target environment
grep -rnE '\$_(GET|POST|REQUEST)\[' wp-content/plugins/<plugin> | grep -vE "sanitize_|absint|wp_unslash|isset"   # review each hit
```
