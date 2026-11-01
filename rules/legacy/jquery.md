---
id: legacy/jquery
title: jQuery 1-3 (and jQuery 4)
description: Working safely with jQuery - XSS-safe DOM APIs (.text(), .attr() with validated values, element creation instead of HTML strings), the htmlPrefilter and selector-injection bugs fixed in 3.5.0, $.ajax CSRF headers and dataType handling, jQuery UI and plugin advisories, version status (3.7.1 critical fixes only; 4.0.0 released 17 Jan 2026), and upgrading to 3.7.x or 4.x with jQuery Migrate. Use when the project loads jquery.
applies_to: "jquery >=1.0 <5"
globs: ["**/*.js", "**/*.html", "**/*.php", "**/*.erb", "**/*.cshtml", "package.json", "bower.json"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://blog.jquery.com/2026/01/17/jquery-4-0-0/
  - https://jquery.com/upgrade-guide/4.0/
  - https://jquery.com/upgrade-guide/3.5/
  - https://github.com/jquery/jquery-migrate
  - https://api.jquery.com/text/
  - https://api.jquery.com/html/
  - https://www.npmjs.com/package/jquery
  - https://osv.dev/vulnerability/GHSA-gxr4-xjj5-5px2
  - https://osv.dev/vulnerability/GHSA-jpcq-cgw6-v4j6
  - https://osv.dev/vulnerability/GHSA-6c3j-c64m-qhgq
  - https://osv.dev/vulnerability/GHSA-rmxg-73gg-4p98
  - https://osv.dev/vulnerability/GHSA-h6gj-6jjq-h8g9
---

# jQuery

Also apply `core/legacy-mode` and `core/security-baseline`. For server-rendered pages, the backend framework rule applies too (`backend/laravel`, `backend/django`, …).

## Version check

- Find the version from `package.json`, `bower.json`, vendored files (`jquery-3.7.1.min.js`, the header comment) or CDN URLs, plus jQuery UI and plugins. State it:

  ```text
  Applying legacy/jquery (jquery 3.4.1 vendored in public/js, jQuery UI 1.12.1, 6 plugins).
  ```

- **Status:** jQuery **4.0.0** was released on 17 Jan 2026 (ES modules, Trusted Types support, removed deprecated APIs, IE 10 and older dropped). **3.7.1** (Aug 2023) is the last 3.x release and gets critical fixes only. 1.x and 2.x are unsupported.
- **Below 3.5.0:** affected by the `htmlPrefilter` XSS bugs (CVE-2020-11022, CVE-2020-11023). Move to 3.7.1 as the minimum (see `upgrade-jquery`).

## Conventions

- Prefer plain DOM APIs for new code (`querySelector`, `classList`, `fetch`) when the page doesn't otherwise need jQuery; don't add jQuery to new projects.
- Keep one jQuery version per page; multiple copies and `noConflict` juggling hide unpatched versions.
- Load jQuery from your own build or a pinned CDN URL with Subresource Integrity (`integrity` and `crossorigin`).
- Use delegated events (`$(document).on('click', '[data-action="delete"]', …)`) for dynamic content; namespace events so they can be removed.

## Security

- **Insert text, not HTML:** `.text(value)` and `.val(value)`; `.attr('href', url)` only after validating the URL scheme. Never pass untrusted strings to `.html()`, `.append()`, `.prepend()`, `.after()`, `.before()`, `.replaceWith()`, `.wrap()` or `$(htmlString)`.
- **Build elements safely:** `$('<a>', { text: name, href: safeUrl })` or `document.createElement`, not string concatenation.
- **Selectors:** never build selectors from user input (`$('#' + location.hash)` was a classic XSS); use `document.getElementById` or `$.escapeSelector` (3.0+).
- **Sanitize when HTML is required:** use DOMPurify, then insert; jQuery doesn't sanitize.
- **`$.ajax`:**
  - set the CSRF header for same-origin state-changing requests (for example `$.ajaxSetup({ headers: { 'X-CSRF-TOKEN': token } })` with the token from a meta tag), and never send it cross-origin;
  - set `dataType: 'json'` explicitly; never request untrusted URLs with `dataType: 'script'` or `jsonp` (cross-domain `$.ajax` without `dataType` executed script responses before 3.0, CVE-2015-9251);
  - don't pass user-controlled URLs to `$.get`/`$.getScript`/`.load()`.
- **`$.extend(true, …)` / deep merges:** don't merge untrusted objects (prototype pollution, CVE-2019-11358 fixed in 3.4.0).
- **jQuery UI and plugins:** jQuery UI below 1.13.2 has several XSS issues in options (`closeText`, `altField`, `*Text`, `of`, checkboxradio labels); keep it patched and never pass user input into widget options that accept HTML.
- On 4.0, use Trusted Types (`TrustedHTML`) with a CSP `require-trusted-types-for 'script'` where possible.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed |
|---|---|---|
| CVE-2020-11022, CVE-2020-11023: XSS via `htmlPrefilter` when inserting untrusted HTML (even sanitized) | 1.0.3 – 3.4.x | 3.5.0 |
| CVE-2019-11358: prototype pollution in `$.extend(true, …)` | < 3.4.0 | 3.4.0 |
| CVE-2015-9251: cross-domain `$.ajax` executes script responses | < 3.0.0 | 3.0.0 |
| CVE-2012-6708, CVE-2020-7656: selector and `load()` XSS | < 1.9.0 | 1.9.0 |
| CVE-2022-31160, CVE-2021-41182/41183/41184, CVE-2016-7103: jQuery UI option XSS | jquery-ui < 1.13.2 | 1.13.2 |

No OSV advisories for 3.5.0+ or 4.0.0 as of 2026-10. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

1. Upgrade to 3.7.1 with jQuery Migrate 3.x in development to log deprecated APIs; fix them, then remove Migrate (`upgrade-jquery`).
2. Upgrade to 4.0 with jQuery Migrate 4.x: replace removed utilities (`$.trim`, `$.isArray`, `$.parseJSON`, `$.type`, `$.now`, `$.isFunction`, …) with native equivalents, check focus/blur event order and JSONP assumptions.
3. Over time, replace jQuery with plain DOM code or the app's framework, page by page.

## Testing

- Add browser tests (Playwright or Cypress) for pages with dynamic jQuery behavior before upgrading.
- Test that user input containing `<img src=x onerror=…>` renders as text everywhere it's displayed.

## Before you finish

```sh
grep -rnE "\.html\(|\.append\(|\.prepend\(|\.after\(|\.before\(|\\\$\(['\"]<" --include='*.js' . 2>/dev/null | grep -v -e node_modules -e '\.min\.js'   # review HTML insertion sites
grep -rnE "jquery[-.]?[0-9]" --include='*.html' --include='*.php' --include='*.js' . 2>/dev/null | grep -v node_modules | head   # every loaded version
npm audit --audit-level=moderate        # if jQuery comes from npm
```
