---
id: legacy/django-legacy
title: Django 4.2 and older
description: Safe maintenance of Django 4.2 LTS (EOL 7 Apr 2026) and older releases - status and last patches, the unfixed 2026 advisories (SQL injection, cache leaks, admin privilege abuse, ASGI header spoofing), compensating controls, ORM rules that matter most on old versions, and the migration path to Django 5.2 LTS. Use when the installed django is below 5.2.
applies_to: "pypi:django >=1.11 <5.2"
globs: ["**/settings*.py", "**/views.py", "**/models.py", "**/serializers.py", "manage.py", "**/urls.py"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://endoflife.date/django
  - https://django.readthedocs.io/en/stable/releases/security.html
  - https://django.readthedocs.io/en/stable/howto/upgrade-version.html
  - https://django.readthedocs.io/en/stable/internals/deprecation.html
  - https://django.readthedocs.io/en/stable/howto/deployment/checklist.html
  - https://www.herodevs.com/support/django-nes
  - https://github.com/adamchainz/django-upgrade
  - https://github.com/advisories/GHSA-frmv-pr5f-9mcr
  - https://osv.dev/vulnerability/GHSA-mvfq-ggxm-9mc5
  - https://osv.dev/vulnerability/GHSA-mmwr-2jhp-mc7j
  - https://osv.dev/vulnerability/GHSA-3h9f-r86x-qvjx
  - https://osv.dev/vulnerability/GHSA-wvqv-fj8w-qmhm
  - https://osv.dev/vulnerability/GHSA-5hrc-gvxj-w55p
---

# Django 4.2 and older

Also apply `core/legacy-mode` and the Security section of `backend/django`; ORM, view and deployment rules apply to old versions too. Don't upgrade as part of an unrelated task.

## Version check

- Read `django` and its add-ons (`djangorestframework`, `django-cors-headers`, `celery`, auth packages) from the lockfile, and Python. State it:

  ```text
  Applying legacy/django-legacy (django 4.2.30, DRF 3.15, Python 3.10, from requirements.txt).
  ```

- **Status:**
  - **4.2 LTS:** EOL 7 Apr 2026; last release 4.2.30. Advisories from May 2026 onward are unfixed on 4.2.
  - **5.0, 5.1:** EOL (Apr 2025, Dec 2025).
  - **4.1 and older, 3.2 LTS (EOL Apr 2024), 2.2 and 1.11:** long unsupported.
- Report the version as EOL and offer `upgrade-django`. Commercial extended support exists (HeroDevs NES) for teams that can't upgrade yet.
- Python: 4.2 supports 3.8–3.12; old Django pins often keep the project on an EOL Python too (see `legacy/python-legacy`).

## Conventions

- Write code for the installed version; don't use 5.x APIs (`LoginRequiredMiddleware`, `GeneratedField`, field groups in templates, `Field.db_default`, CSP middleware) on 4.2.
- Fix deprecation warnings as you touch code (`python -Wd manage.py test`); they're the 5.x breaking changes.
- Keep `DEFAULT_AUTO_FIELD` explicit; keep the project's existing settings layout.

## Safe maintenance

- Stay on the last patch of the line (4.2.30); upgrade within the line before anything else.
- **Unfixed on 4.2 (published after its EOL):** cache-middleware private response leaks, signed-cookie salt collisions, GeoDjango file writes and DoS, and a `DomainNameValidator` header-injection vector. Compensating controls:
  - don't use `UpdateCacheMiddleware`/`FetchFromCacheMiddleware` or `cache_page` on authenticated pages;
  - give each signing use a unique `salt`;
  - avoid GeoDjango lookups and raster construction on user input;
  - validate hostnames yourself before using `DomainNameValidator` output in headers.
- Keep the ORM rules strict: map query parameters through allowlists, never `**request.GET`/`**request.data` into `filter()`/`Q()`/`annotate()`.
- Run behind a patched reverse proxy (TLS, request-size limits, header normalization, which also blunts the ASGI underscore/hyphen header spoofing on unpatched versions).

## Security

- Every rule in the Security section of `backend/django` applies, including `check --deploy` and DRF permissions.
- DRF: 3.17.x is the last line that supports Django 4.2 (Python ≥ 3.10) and includes the 3.17.2 fixes; the 3.18.2 fixes (JSONParser codec, token revocation, Accept-header DoS) need DRF 3.18, which requires Django 5.2.

## Known vulnerabilities (as of 2026-10)

| Advisory | Status on 4.2 |
|---|---|
| CVE-2025-64459: SQL injection via `_connector` | Fixed in 4.2.26 |
| CVE-2026-1207, CVE-2026-1287, CVE-2026-1312: SQL injection | Fixed in 4.2.28 |
| CVE-2026-3902: ASGI header spoofing; CVE-2026-4292, CVE-2026-4277: admin privilege abuse; CVE-2026-33033/33034: DoS | Fixed in 4.2.30 (last release) |
| CVE-2026-48588, CVE-2026-8404, CVE-2026-48587: cache middleware exposes private responses | **Not fixed** (4.2 EOL) |
| CVE-2026-15307, CVE-2026-15830: GeoDjango file writes, outbound requests and DoS | **Not fixed** |
| CVE-2026-6873: signed-cookie salt collisions; CVE-2026-53878: `DomainNameValidator` newlines | **Not fixed** |

This list goes stale; verify with the `cve-check` skill, `pip-audit` or OSV before relying on it.

## Migration path

1. Patch to the last release of the current line; fix all deprecation warnings.
2. Upgrade **one feature release at a time** to 5.2 LTS (4.2 → 5.0 → 5.1 → 5.2), running `django-upgrade --target-version` and the tests at each step, with the `upgrade-django` skill. From older versions, step through each LTS (2.2 → 3.2 → 4.2) first.
3. Upgrade DRF and other add-ons alongside each step to versions that support it.
4. Move Python to a supported version (5.2 supports 3.10–3.14) with `upgrade-python`.
5. After 5.2 is stable, consider 6.x (Python 3.12+) as a separate change.

## Testing

- Before upgrading, make sure tests cover auth, permissions, forms and serializers, and the admin actions the business relies on.
- Run the suite with `-W error::DeprecationWarning` (or `PYTHONWARNINGS=error::DeprecationWarning`) to catch the next version's removals.

## Before you finish

```sh
python -Wd manage.py check
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python -m pytest                       # or: python manage.py test
pip-audit
```
