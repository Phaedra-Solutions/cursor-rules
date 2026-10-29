---
id: backend/django
title: Django
description: Django 5.2 LTS, 6.0 and 6.1 - supported versions and minimum safe patches, ORM safety (never splat user dicts into filter/exclude/get/Q, CVE-2025-64459; raw() only with parameters), N+1 avoidance with select_related, prefetch_related and 6.1 fetch modes, the deployment checklist (manage.py check --deploy, DEBUG off, ALLOWED_HOSTS, HSTS and SECURE_* settings, secure cookies, Argon2, built-in CSP), Django REST Framework permissions and explicit serializer fields. Use when editing settings, views, models, serializers or manage.py.
applies_to: "pypi:django >=5.2 <6.2"
legacy_rule: legacy/django-legacy
globs: ["**/settings*.py", "**/views.py", "**/models.py", "**/serializers.py", "manage.py", "**/views/**/*.py", "**/urls.py"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://endoflife.date/django
  - https://www.djangoproject.com/weblog/2026/aug/05/django-61-released/
  - https://www.djangoproject.com/weblog/2025/dec/03/django-60-released/
  - https://django.readthedocs.io/en/stable/releases/6.1.html
  - https://django.readthedocs.io/en/stable/releases/security.html
  - https://django.readthedocs.io/en/stable/howto/deployment/checklist.html
  - https://django.readthedocs.io/en/stable/topics/security.html
  - https://django.readthedocs.io/en/stable/ref/csp.html
  - https://docs.djangoproject.com/en/stable/howto/deployment/checklist/
  - https://www.django-rest-framework.org/api-guide/permissions/
  - https://github.com/advisories/GHSA-frmv-pr5f-9mcr
  - https://osv.dev/vulnerability/GHSA-6426-9fv3-65x8
  - https://osv.dev/vulnerability/GHSA-gvg8-93h5-g6qq
  - https://osv.dev/vulnerability/GHSA-mwm9-4648-f68q
  - https://osv.dev/vulnerability/GHSA-wvqv-fj8w-qmhm
  - https://osv.dev/vulnerability/GHSA-3h9f-r86x-qvjx
  - https://osv.dev/vulnerability/GHSA-3547-9m27-7rxg
  - https://osv.dev/vulnerability/GHSA-2m8g-3cmr-wg3w
---

# Django

Also apply `languages/python`. Database schema rules are in `data/postgres`; generic web security in `core/security-baseline`.

## Version check

- Read `django`, `djangorestframework`, `django-cors-headers`, the database driver and Python from the lockfile, and state them:

  ```text
  Applying backend/django (django 5.2.18 LTS, DRF 3.18.3, Python 3.13, psycopg 3, from uv.lock).
  ```

- **Support (Oct 2026):**
  - **6.1** (latest, 5 Aug 2026; Python 3.12+): mainstream to Apr 2027, security to Dec 2027;
  - **6.0**: security fixes to Apr 2027;
  - **5.2 LTS**: security fixes to Apr 2028 — the default for long-lived projects;
  - **4.2 LTS ended 7 Apr 2026**; 5.0 and 5.1 are EOL → `legacy/django-legacy`, offer `upgrade-django`.
- **Minimum safe:** 6.1.1, 6.0.8, 5.2.17 for the advisories in OSV; latest patches are 6.1.2, 6.0.9, 5.2.18. DRF ≥ 3.18.2.
- Version-gated features: built-in CSP (`ContentSecurityPolicyMiddleware`, `SECURE_CSP`), template partials and the tasks framework need 6.0; model field fetch modes (`FETCH_PEERS`) and `DB_CASCADE`/`DB_SET_NULL` need 6.1.

## Conventions

- Apps by domain (`orders/`, `billing/`) with `models.py`, `services.py` (business logic), `selectors.py` or managers (queries), `views.py`, `serializers.py`, `urls.py`, `tests/`. Keep views thin.
- Custom user model from the start (`AUTH_USER_MODEL`) in new projects.
- Settings split by environment (or `django-environ`/`pydantic-settings`), secrets from the environment, `SECRET_KEY` never committed.
- Migrations: one per change, reviewed, committed; never edit applied migrations; data migrations separate from schema changes; long-running ones safe on large tables (see `data/postgres`).
- Forms or serializers validate all input; models carry constraints (`UniqueConstraint`, `CheckConstraint`).
- Avoid N+1 queries: `select_related` for foreign keys, `prefetch_related` for reverse and many-to-many, `only()`/`values()` for narrow reads; on 6.1 consider `FETCH_PEERS` fetch mode. Check with `django-debug-toolbar` or `assertNumQueries` in tests.
- Use `transaction.atomic()` around multi-write operations; `select_for_update()` for read-modify-write; `on_commit()` for side effects (emails, tasks).

## Security

### ORM and SQL

- Never pass user-controlled dicts as `**kwargs` to `filter()`, `exclude()`, `get()`, `annotate()`, `aggregate()`, `extra()` or `Q()`. Map allowed query parameters to explicit lookups. CVE-2025-64459 let a `_connector` key turn this into SQL injection; 2025–2026 also brought column-alias injections through crafted `annotate`/`alias` keys.

  ```python
  # ✓
  ALLOWED = {"status": "status", "created_after": "created_at__gte"}
  filters = {ALLOWED[k]: v for k, v in params.items() if k in ALLOWED}
  Order.objects.filter(owner=request.user, **filters)
  # ✗
  Order.objects.filter(**request.GET.dict())
  ```

- `raw()`, `cursor.execute()` and `RawSQL` only with parameters (`%s` plus a params list); never f-strings. `extra()` should not appear in new code.
- `order_by()` with user input only through an allowlist.

### Views and templates

- Authenticate and authorize per view (`LoginRequiredMixin`/`@login_required`, plus object checks: `get_object_or_404(Order, pk=pk, owner=request.user)`). On 5.1+, `LoginRequiredMiddleware` makes login the default; mark public views with `@login_not_required`.
- Keep CSRF protection on; never `@csrf_exempt` except for signature-verified webhooks.
- Templates autoescape; avoid `|safe`, `mark_safe` and `{% autoescape off %}` on user data. Use `json_script` to pass data to JavaScript.
- Redirects to user-supplied URLs only after `url_has_allowed_host_and_scheme()`.
- File uploads: validate type and size, store with generated names via the storage backend, serve user files from a separate domain or with `Content-Disposition: attachment`.
- Admin: on a non-default path, behind SSO or IP restrictions where possible, with 2FA; keep `list_editable` and inlines permission-checked (CVE-2026-4292, CVE-2026-4277).

### Deployment settings

- `python manage.py check --deploy` passes with no warnings in production settings.
- `DEBUG = False`; explicit `ALLOWED_HOSTS`; `SECURE_PROXY_SSL_HEADER` only behind a proxy that sets it.
- HTTPS: `SECURE_SSL_REDIRECT = True`, `SECURE_HSTS_SECONDS` (start small, then ≥ 31536000), `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `CSRF_TRUSTED_ORIGINS` for HTTPS origins.
- `SECURE_CONTENT_TYPE_NOSNIFF`, `SECURE_REFERRER_POLICY`, `X_FRAME_OPTIONS = "DENY"`, `SECURE_CROSS_ORIGIN_OPENER_POLICY`.
- CSP on 6.0+: add `ContentSecurityPolicyMiddleware` and set `SECURE_CSP` (start with `SECURE_CSP_REPORT_ONLY`), using nonces for inline scripts.
- `PASSWORD_HASHERS` with Argon2 first (`argon2-cffi` installed); `AUTH_PASSWORD_VALIDATORS` enabled.
- Cache middleware: don't cache authenticated pages with `UpdateCacheMiddleware` unless `Vary` is correct; several 2026 advisories leaked private cached responses.

### Django REST Framework

- Set safe defaults: `DEFAULT_PERMISSION_CLASSES = ["rest_framework.permissions.IsAuthenticated"]`, `DEFAULT_AUTHENTICATION_CLASSES` explicit, throttling (`DEFAULT_THROTTLE_CLASSES`, `DEFAULT_THROTTLE_RATES`), pagination with a max page size.
- Every view or viewset declares `permission_classes`; object-level checks in `has_object_permission` and a scoped `get_queryset()` (`return Order.objects.filter(owner=self.request.user)`).
- Serializers list explicit `fields`; never `fields = "__all__"` on writable serializers; mark server-set fields `read_only_fields` (`owner`, `is_staff`, `tenant`).
- Disable the browsable API renderer in production unless it's needed.

## Known vulnerabilities (as of 2026-10)

| Advisory | Fixed (6.1 / 6.0 / 5.2) |
|---|---|
| CVE-2025-64459: SQL injection via `_connector` in `filter()`/`Q()` (CVSS 9.1) | — / — / 5.2.8 |
| CVE-2025-57833, CVE-2025-59681, CVE-2025-13372: SQL injection through column aliases | — / — / 5.2.9 |
| CVE-2026-1207, CVE-2026-1287, CVE-2026-1312: SQL injection issues | — / 6.0.2 / 5.2.11 |
| CVE-2026-15307: GeoDjango spatial lookups allow file writes and outbound requests; CVE-2026-15830 GeoDjango DoS | 6.1.1 / 6.0.8 / 5.2.17 |
| CVE-2026-48588, CVE-2026-8404, CVE-2026-48587, CVE-2026-35193: cache middleware exposes private responses | — / 6.0.7 / 5.2.16 |
| CVE-2026-3902: ASGI header spoofing via underscore/hyphen conflation; CVE-2026-33033/33034 request DoS | — / 6.0.4 / 5.2.13 |
| CVE-2026-114136, CVE-2026-114137, CVE-2026-114138: JSONParser codec, token revocation no-op, Accept header DoS | DRF 3.18.2 |
| CVE-2026-73228, CVE-2026-73229: upload size bypass; AdminRenderer data disclosure | DRF 3.17.2 |

This list goes stale; verify with the `cve-check` skill, `pip-audit` or OSV before relying on it.

## Testing

- `TestCase`/pytest-django with factories (factory_boy). For each view or endpoint: anonymous access is refused, another user's object returns 404, invalid input returns 400, and server-set fields can't be written.
- `assertNumQueries` on list views to catch N+1 regressions.
- A test that runs `check --deploy` against production settings in CI.

## Before you finish

```sh
uv run python manage.py check
DJANGO_SETTINGS_MODULE=<project>.settings.production uv run python manage.py check --deploy --fail-level WARNING
uv run python manage.py makemigrations --check --dry-run
uv run pytest                          # or: python manage.py test
uv run pip-audit
uv run bandit -r . -q -x ./tests
```
