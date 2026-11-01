---
name: upgrade-python
description: Upgrade a project's Python version one minor release at a time (for example 3.10 → 3.11 → 3.12 → 3.13) with pyupgrade, deprecation warnings treated as errors, dependency re-locking, C-extension checks and every pin (requires-python, .python-version, Docker, CI, deploy runtimes) updated together, then verify with tests and a production-image smoke test. Also covers starting a Python 2.7 port. Use when asked to upgrade Python, when legacy/python-legacy applies (3.10 reached EOL on 1 Oct 2026), or when a dependency needs a newer Python.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-29"
  sources: "https://devguide.python.org/versions/ https://endoflife.date/python https://github.com/asottile/pyupgrade https://docs.python.org/3/whatsnew/3.11.html https://docs.python.org/3/whatsnew/3.12.html https://docs.python.org/3/whatsnew/3.13.html https://docs.python.org/3/whatsnew/3.14.html https://docs.astral.sh/uv/concepts/python-versions/ https://docs.python.org/3/library/warnings.html"
---

# Upgrade Python

## When to use

- The user asks to upgrade Python, or the project runs an EOL version (3.10 or older; see `legacy/python-legacy`).
- A dependency upgrade (Django 6.x, SQLAlchemy 2.1, Starlette 1.x) needs a newer Python.
- Planning ahead: 3.11 reaches EOL in Oct 2027.

## Before you start

- List every place that pins Python: `requires-python`, `.python-version`, `runtime.txt`, `tox.ini`/`noxfile.py`, `setup.cfg` classifiers, Dockerfiles (`FROM python:…`), CI matrices, serverless/PaaS runtimes, and type-checker settings (`pythonVersion`, `python_version`).
- List C-extension and binary dependencies (`numpy`, `pandas`, `psycopg`, `cryptography`, `lxml`, `grpcio`, `pydantic-core`, anything without wheels for the target).
- Working tree clean; new branch (`chore/python-3.13`).
- Ask the user:
  - the target: **3.13** (security support to Oct 2029; most compatible) or **3.14** (bugfix, to Oct 2030). 3.15 (Oct 2026) is fine for new work once dependencies publish wheels;
  - whether to stop for review after each minor hop;
  - whether network installs are approved (`core/supply-chain` cooldown applies).

## Steps

1. **Baseline** on the current version: locked install, lint, type check, tests, and the production image starting. Record failures first.
2. **Surface the next version's breakage now:** run the tests with warnings as errors on the current version:

   ```sh
   uv run python -W error::DeprecationWarning -W error::PendingDeprecationWarning -m pytest
   ```

   Fix each warning (or record it with the owning dependency) before changing versions.
3. **Hop one minor version** (for example 3.10 → 3.11):
   - install it (`uv python install 3.11`) and update all pins in one change (`requires-python = ">=3.11"`, `.python-version`, Docker base image by digest, CI, runtimes, type-checker version);
   - re-lock (`uv lock --upgrade-package <only what's needed>` or a full `uv lock` if the user agrees) and sync;
   - update packages without wheels for the new version, or replace unmaintained ones;
   - run `pyupgrade --py311-plus $(git ls-files '*.py')` (match the flag to the new minimum: `--py312-plus`, `--py313-plus`, `--py314-plus`) and review the diff; Ruff's `UP` rules with `target-version` do the same.
4. **Fix version-specific changes** listed in that version's "What's New" (Porting section). Common ones:
   - 3.11: `asyncio.coroutine` removed; stricter `enum` and `typing` behavior;
   - 3.12: `distutils` removed (use `setuptools`/`packaging`); `imp` removed; `datetime.utcnow()` deprecated (use `datetime.now(UTC)`);
   - 3.13: dead batteries removed (`cgi`, `crypt`, `telnetlib`, `nntplib`, `imghdr`, `pipes`, …); `locale.getdefaultlocale` deprecated;
   - 3.14: deferred evaluation of annotations by default; `asyncio` child-watcher APIs removed.
5. **Verify** (next section). Show the diff and results; wait for approval before the next hop. Commit only when asked (`git-commit` skill).
6. Repeat until the target, then switch to `languages/python` and update the frameworks' version rules if needed.

### Python 2.7

Port before upgrading: get a test suite running, run `python -m pyupgrade --py3-plus` after a 2→3 conversion pass (`python-future`'s `futurize` or manual), fix bytes/str boundaries and integer division, then follow the steps above from 3.x. Plan this as its own project with the user.

## Verify

```sh
uv run python --version                 # the hop's target, on every runner
uv sync --locked
uv run ruff check . && uv run ruff format --check .
uv run pyright                          # or: mypy
uv run python -W error::DeprecationWarning -m pytest
uv run pip-audit
grep -rnE "python_requires|requires-python|FROM python:|python-version|pythonVersion" pyproject.toml setup.cfg Dockerfile* .github/ .python-version 2>/dev/null   # no old pins left
```

Then build and start the production image: imports of C extensions succeed, the app serves key routes, workers and scheduled jobs start.

## Safety

- Never jump several minor versions at once when C extensions or old frameworks are involved; never upgrade Python and a framework major in one change.
- Never silence deprecation warnings globally to make tests pass; fix or document them.
- Never leave pins out of sync between local, CI and production.
- Never auto-commit, push or deploy; don't hand-edit `uv.lock`; ask before a full re-lock.
