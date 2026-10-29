---
id: legacy/python-legacy
title: Python 2.7 and end-of-life Python 3
description: Safe maintenance of Python 2.7 and end-of-life Python 3 (3.10 and older; 3.10 reached EOL on 1 Oct 2026) - support status and last releases, syntax and stdlib limits to respect, dependency pinning when packages drop old Pythons, compensating controls, and the migration path to Python 3.13+. Use when requires-python, .python-version, Docker images or CI pin Python below 3.11.
applies_to: "python >=2.7 <3.11"
globs: ["**/*.py", "pyproject.toml", "setup.py", "setup.cfg", "requirements*.txt", ".python-version", "**/Dockerfile*"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://devguide.python.org/versions/
  - https://endoflife.date/python
  - https://peps.python.org/pep-0619/
  - https://www.herodevs.com/blog-posts/python-3-10-end-of-life-october-2026-security-and-migration-guide
  - https://docs.python.org/3/whatsnew/3.11.html
  - https://docs.python.org/3/whatsnew/3.12.html
  - https://docs.python.org/3/whatsnew/3.13.html
  - https://github.com/asottile/pyupgrade
  - https://python-future.org/compatible_idioms.html
---

# Python 2.7 and end-of-life Python 3

Also apply `core/legacy-mode` and the Security section of `languages/python` (deserialization, subprocess, secrets, paths, SQL); those rules don't depend on the version.

## Version check

- Read the version from `requires-python`, `setup.py` `python_requires`, `.python-version`, `runtime.txt`, Dockerfiles and CI, and `python --version`. State it:

  ```text
  Applying legacy/python-legacy (Python 3.10.14 in Docker, 3.9 in CI, requirements.txt without hashes).
  ```

- **Status:**

  | Version | EOL | Last release |
  |---|---|---|
  | 3.10 | 1 Oct 2026 | 3.10.22 |
  | 3.9 | 31 Oct 2025 | 3.9.25 |
  | 3.8 | 7 Oct 2024 | — |
  | 3.7 and older 3.x | 2023 and earlier | — |
  | 2.7 | 1 Jan 2020 | 2.7.18 |

- No CPython security fixes reach these versions. Report the version as EOL in the summary and offer `upgrade-python`. Commercial extended support exists (HeroDevs) for teams that can't upgrade yet. **3.11 reaches EOL in Oct 2027**: plan past it too.

## Conventions

- Write code for the oldest version the project runs. Not available on 3.10: `except*` and `ExceptionGroup`, `tomllib`, `Self` (3.11); `type` statements and PEP 695 generics, f-string nesting changes (3.12); free-threaded and JIT builds (3.13).
- 3.9 and older: no `match` statements, no `X | Y` union syntax at runtime, no parenthesized context managers (3.10).
- **Python 2.7:** keep code 2/3-compatible only if the project still runs both; otherwise write 2.7 idioms consistently (`from __future__ import absolute_import, division, print_function, unicode_literals`, explicit `unicode`/`bytes` handling, `io.open` with encodings).
- Pin dependencies to the last versions that support the interpreter, with hashes (`pip-compile --generate-hashes` or `uv pip compile --python-version 3.10 --generate-hashes`), and record why each pin exists. Many current libraries (FastAPI's Starlette 1.x, SQLAlchemy 2.1, pydantic-settings, Django 6.x) need 3.11 or 3.12+.
- Don't add new dependencies that require a newer Python.

## Safe maintenance

- Use the last patch release of the line (3.10.22, 3.9.25, 2.7.18) and a base image that still receives OS patches; rebuild often.
- Compensating controls:
  - run behind a patched reverse proxy that terminates TLS and limits request size;
  - avoid parsing untrusted XML, archives and email in-process with old stdlib modules (`xml`, `tarfile`, `zipfile`, `email`); use `defusedxml` and strict size limits;
  - isolate the service (network policy, least-privileged user, read-only filesystem).
- Keep `pip-audit` running; library advisories still apply even if CPython fixes don't.

## Security

- Every rule in the Security section of `languages/python` applies.
- Python 2.7 specifics: `input()` evaluates expressions (use `raw_input()`); `pickle`, `cPickle` and `yaml.load` are as dangerous as on 3.x; `urllib2`/`httplib` don't verify TLS certificates in very old 2.7 builds (before 2.7.9); `random` is not for secrets (use `os.urandom` or `SystemRandom`).
- Don't disable TLS verification to work around old certificate bundles; update `certifi` or the OS bundle.

## Known vulnerabilities (as of 2026-10)

- CPython advisories published after each line's EOL stay unfixed there (for example the 2025–2026 `tarfile` extraction-filter bypasses and email header parsing fixes that landed only in supported lines).
- Libraries pinned for old Pythons (old `requests`, `urllib3`, `Jinja2`, `PyYAML`, `Django` ≤ 4.2) usually carry known CVEs; check each with `pip-audit`.

This list goes stale; verify with the `cve-check` skill, `pip-audit` or OSV before relying on it.

## Migration path

1. Pick the target: **3.13** (security support to Oct 2029) or **3.14** (bugfix, to Oct 2030); avoid jumping to a release under six months old if C extensions lag.
2. Use the `upgrade-python` skill: upgrade one minor version at a time when the gap is large or C extensions are involved, with `pyupgrade --py3XX-plus` and deprecation warnings as errors.
3. Python 2.7: port to 3.x first (with `python-future`/`six` or a direct port and a test suite), then follow the 3.x path.
4. Update `requires-python`, `.python-version`, Docker images, CI and deploy runtimes together.

## Testing

- Run the test suite on the current and the target Python in CI during the migration (`tox`/`nox` or a CI matrix).
- Turn on `-W error::DeprecationWarning` in tests to surface code that breaks on the next version.

## Before you finish

```sh
python --version
python -m pytest -W error::DeprecationWarning     # where the suite allows it
pip-audit -r requirements.txt                     # or: uvx pip-audit
grep -rnE "python_requires|requires-python|FROM python:|python-version" setup.py pyproject.toml Dockerfile* .github/ .python-version 2>/dev/null
```
