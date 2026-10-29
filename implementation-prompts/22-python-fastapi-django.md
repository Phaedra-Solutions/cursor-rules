# Prompt 22: Python, FastAPI, Django (+ legacy, upgrade skills)

> Self-contained; safe in a fresh session. Roadmap: Phase 3, §7 (`backend/fastapi`, `backend/django`), §8.2.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §7 entries `backend/fastapi` and `backend/django`, the Django row of §5.8, and the Python/Django row of §8.2.
3. Research:
   - Python versions and EOL dates;
   - uv (lockfile, `exclude-newer`, malware check); pip-audit; Bandit;
   - the FastAPI security docs; Pydantic v2;
   - Django's latest release and LTS; the deployment checklist; Django security releases (CVE-2025-64459 and newer);
   - Django REST Framework permissions.

## Task
1. **`rules/languages/python.md`:**
   - tier P1; globs `**/*.py`, `pyproject.toml`, `uv.lock`, `requirements*.txt`;
   - `legacy_rule: legacy/python-legacy`;
   - typing and pyright/mypy; uv workflow; no `pickle` or `yaml.load` on untrusted data;
   - `subprocess` without `shell=True`; `secrets` module; path safety.
2. **`rules/backend/fastapi.md`:** tier P1; cover the §7 entry.
3. **`rules/backend/django.md`:**
   - tier P1; globs `**/settings*.py`, `**/views.py`, `**/models.py`, `**/serializers.py`, `manage.py`;
   - `legacy_rule: legacy/django-legacy`;
   - cover the §7 entry.
4. **`rules/legacy/python-legacy.md`** (Python 2.7 and EOL 3.x) and **`rules/legacy/django-legacy.md`** (Django ≤ 4.2): EOL status, known CVEs, safe maintenance, migration path.
5. **`skills/upgrade-python/SKILL.md`** and **`skills/upgrade-django/SKILL.md`:** step-by-step, one version at a time, with `pyupgrade`/`django-upgrade` (verify that both exist), deprecation warnings treated as errors, tests.

## Done when
All seven files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
