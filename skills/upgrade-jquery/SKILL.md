---
name: upgrade-jquery
description: Upgrade jQuery 1.x/2.x/3.x to 3.7.1 and then 4.x with jQuery Migrate - find every loaded copy, upgrade plugins and jQuery UI, add the matching jQuery Migrate build in development to log deprecated and removed APIs, fix each warning (removed utilities like $.trim and $.isArray, htmlPrefilter changes, JSONP auto-promotion, focus event order), remove Migrate, and verify with browser tests. Use when asked to upgrade jQuery or when legacy/jquery reports a vulnerable version.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-30"
  sources: "https://jquery.com/upgrade-guide/4.0/ https://jquery.com/upgrade-guide/3.5/ https://jquery.com/upgrade-guide/3.0/ https://github.com/jquery/jquery-migrate https://blog.jquery.com/2026/01/17/jquery-4-0-0/ https://www.npmjs.com/package/jquery-migrate"
---

# Upgrade jQuery

## When to use

- The project loads jQuery below 3.5.0 (vulnerable) or below 3.7.1, or the user wants jQuery 4.
- `legacy/jquery` applies.

## Before you start

- Find every copy: `package.json`/`bower.json`, vendored files, CDN script tags, WordPress or CMS-bundled jQuery, and libraries that bundle their own. List plugins and jQuery UI with versions, and check each plugin's supported jQuery range.
- Browser support: jQuery 4 drops IE 10 and older, Edge Legacy, iOS < 11, Firefox < 65 and the Android Browser. Confirm with the user before targeting 4.
- Working tree clean; new branch; browser tests (Playwright or Cypress) for pages with jQuery behavior. Add them first if missing.

## Steps

1. **Baseline:** run the browser tests and click through key pages with the console open; record existing errors.
2. **Hop to 3.7.1** (from 1.x/2.x, this is the big hop):
   - load `jquery@3.7.1` plus `jquery-migrate@3` (development build) right after it;
   - exercise every page; Migrate logs `JQMIGRATE:` warnings for deprecated and removed APIs;
   - fix each warning, for example: `.size()` → `.length`, `.bind/.unbind/.delegate` → `.on/.off`, `$(document).ready` variants, `.andSelf()` → `.addBack()`, `$.parseJSON` → `JSON.parse`, `jQuery.event.props`, self-closing tag handling changed by the 3.5.0 `htmlPrefilter` fix (`$('<div/>')` is fine, `'<div/><span/>'` strings aren't expanded);
   - upgrade jQuery UI to 1.13.2+ and plugins to versions that support 3.x; replace unmaintained plugins.
3. **Remove jQuery Migrate** once no warnings remain, run the tests, and ship 3.7.1 as its own change.
4. **Hop to 4.x** (if the user agreed):
   - load `jquery@4` plus `jquery-migrate@4` in development;
   - replace removed utilities with native code: `$.trim` → `String.prototype.trim`, `$.isArray` → `Array.isArray`, `$.parseJSON` → `JSON.parse`, `$.now` → `Date.now`, `$.isFunction` → `typeof fn === 'function'`, `$.type`, `$.isNumeric`, `$.isWindow`, `$.camelCase`, `$.nodeName`;
   - check code that relied on JSON → JSONP auto-promotion, on `push`/`sort`/`splice` on jQuery objects, or on the old focus/blur event order;
   - if the slim build is used, replace Deferreds/Callbacks with native Promises;
   - consider Trusted Types (`require-trusted-types-for 'script'`) now that jQuery 4 supports them.
5. **Remove jQuery Migrate**, run everything again, and ship.
6. Load jQuery from your build or a pinned CDN URL with `integrity`/`crossorigin`; remove other copies.
7. Show the diff and results at each hop; commit only when asked (`git-commit` skill).

## Verify

```sh
grep -rnE "jquery[-.@]?[0-9]+\.[0-9]+" --include='*.html' --include='*.php' --include='*.js' --include='package.json' . 2>/dev/null | grep -v node_modules   # one version everywhere
grep -rn "jquery-migrate" --include='*.html' --include='*.php' --include='*.js' --include='package.json' . 2>/dev/null | grep -v node_modules   # gone after each hop
npx playwright test                    # or: npx cypress run
npm audit --audit-level=moderate       # if jQuery comes from npm
```

In the browser: no `JQMIGRATE` or other console errors, forms, modals, date pickers, AJAX submissions (with CSRF headers) and dynamic lists work on every page you tested in the baseline.

## Safety

- Never jump from 1.x/2.x straight to 4.x; go through 3.7.1 with Migrate first.
- Never ship jQuery Migrate to production as a permanent fix; it's a diagnostic and bridge.
- Never keep a vulnerable copy loaded alongside the upgraded one.
- Never auto-commit, push or deploy.
