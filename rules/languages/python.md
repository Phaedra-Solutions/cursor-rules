---
id: languages/python
title: Python
description: Python 3.11-3.15 - supported versions, type hints checked with pyright or mypy, Ruff, the uv workflow with a committed lockfile, release-age cooldown and malware check, pip-audit and Bandit, no pickle or yaml.load on untrusted data, subprocess without shell=True, the secrets module, path safety and timeouts. Use when editing .py files, pyproject.toml, uv.lock or requirements files.
applies_to: "python >=3.11 <3.16"
legacy_rule: legacy/python-legacy
globs: ["**/*.py", "pyproject.toml", "uv.lock", "requirements*.txt"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://devguide.python.org/versions/
  - https://endoflife.date/python
  - https://docs.astral.sh/uv/concepts/projects/sync/
  - https://docs.astral.sh/uv/reference/settings/
  - https://github.com/astral-sh/uv/releases/tag/0.9.17
  - https://github.com/astral-sh/uv/releases/tag/0.11.31
  - https://pypi.org/project/pip-audit/
  - https://bandit.readthedocs.io/en/latest/
  - https://docs.astral.sh/ruff/
  - https://microsoft.github.io/pyright/
  - https://mypy.readthedocs.io/en/stable/
  - https://docs.python.org/3/library/subprocess.html#security-considerations
  - https://docs.python.org/3/library/pickle.html
  - https://docs.python.org/3/library/secrets.html
  - https://docs.python.org/3/library/tarfile.html#extraction-filters
  - https://pyyaml.org/wiki/PyYAMLDocumentation
  - https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html
---

# Python

Generic secure-coding rules are in `core/security-baseline`; dependency rules in `core/supply-chain`. Frameworks: `backend/fastapi`, `backend/django`.

## Version check

- Read the version from `requires-python` in `pyproject.toml`, `.python-version`, the Dockerfile and CI, and the tooling (uv, Ruff, pyright or mypy) from `uv.lock` or the dev dependencies. State it:

  ```text
  Applying languages/python (Python 3.13, uv 0.13 with uv.lock, Ruff, pyright strict).
  ```

- **Supported (Oct 2026):** 3.15 and 3.14 (bugfix); 3.13 (security, EOL Oct 2029); 3.12 (security, EOL Oct 2028); 3.11 (security, **EOL Oct 2027**). **3.10 reached EOL on 1 Oct 2026** (final release 3.10.22) → `legacy/python-legacy`, offer `upgrade-python`.
- Default for new projects: Python 3.13 or 3.14, unless a dependency needs otherwise. Use only syntax and stdlib features available in the lowest version in `requires-python` (for example `type` statements need 3.12; `except*` needs 3.11).

## Conventions

### Tooling

- **uv** for new projects: `uv init`, `uv add`, `uv sync`, a committed `uv.lock`, and `uv run` for commands. Keep the project's tool (Poetry, pip-tools, pip with hashes) where it already exists; don't mix managers.
- CI installs with `uv sync --locked` (or `pip install --require-hashes -r requirements.txt`). Set the release-age cooldown and malware check (`exclude-newer = "7 days"`, uv ≥ 0.9.17; `[tool.uv.audit] malware-check = true`, uv ≥ 0.11.31; see `core/supply-chain`).
- **Ruff** for linting and formatting (or the project's Black/isort/flake8 setup). Enable at least the `S` (bandit), `B`, `UP` and `I` rule sets.
- **Types:** annotate public functions and module boundaries; check with pyright (or mypy) in CI, `strict` for new packages. Avoid `Any`; use `TypedDict`, `Protocol`, `dataclass(slots=True, frozen=True)` or Pydantic models for structured data.
- Layout: `src/<package>/` with `pyproject.toml`; tests in `tests/` run with pytest.

### Code

- Validate external input (HTTP, files, env, queues, LLM output) at the boundary with Pydantic v2 (or the project's validator), and pass typed objects inward.
- Config from environment variables, validated at startup (`pydantic-settings`); no secrets in code or committed `.env` files.
- Use `pathlib`, `logging` (not `print`) with structured context, `with` for files, locks and connections, and `contextlib` helpers.
- Async code: no blocking calls (`requests`, `time.sleep`, sync DB drivers) inside `async def`; use `httpx.AsyncClient`, `asyncio.sleep`, async drivers, or `asyncio.to_thread` for unavoidable blocking work.

## Security

- **Deserialization:** never `pickle`, `marshal`, `shelve`, `dill` or `joblib.load` on data you didn't produce and protect; never `yaml.load` without `Loader=yaml.SafeLoader` (use `yaml.safe_load`); never `eval`/`exec` on input. Prefer JSON with schema validation. For ML models, use `safetensors`.
- **Processes:** `subprocess.run([...], shell=False, check=True, timeout=…)` with an argument list; never `shell=True`, `os.system` or `os.popen` with user input. Put `--` before user-supplied file names.
- **Randomness and secrets:** `secrets.token_urlsafe()`, `secrets.choice()`, `secrets.compare_digest()`; never `random` for tokens, passwords or IDs.
- **Paths:** resolve against a fixed base and check containment: `target = (base / name).resolve(); target.is_relative_to(base.resolve())`. Reject absolute paths and NUL bytes. Extract archives with `tarfile` filters (`filter="data"`) and check `zipfile` member names.
- **SQL:** parameters only (`cursor.execute("… WHERE id = %s", (id,))`, SQLAlchemy bound parameters); never f-strings or `%` formatting into SQL. Identifiers come from allowlists.
- **HTTP clients:** always set timeouts (`httpx.Client(timeout=10)`, `requests.get(…, timeout=10)`); keep TLS verification on; validate outbound URLs built from user input (SSRF).
- **XML:** use `defusedxml` for untrusted XML.
- **Templates:** Jinja2 with `autoescape=True` (or `select_autoescape`); never build templates from user input.
- **Hashing:** passwords with argon2 (`argon2-cffi`) or the framework's hasher; `hashlib.sha256` or better elsewhere; `hmac.compare_digest` for MACs.

## Known vulnerabilities (as of 2026-10)

- CPython security fixes ship only in supported lines; 3.10 and older get none after 1 Oct 2026. Track CPython advisories on python.org and keep the patch version current (for example 3.13.18, 3.14.10, 3.15.2 as of 25 Oct 2026).
- Library advisories for FastAPI and Django stacks are listed in `backend/fastapi` and `backend/django`; for LLM frameworks in `ai/llm-apps`.
- The March 2026 LiteLLM compromise (malicious 1.82.7 and 1.82.8 on PyPI) is why the cooldown and malware check matter.

This list goes stale; verify with the `cve-check` skill, `pip-audit` or OSV before relying on it.

## Testing

- pytest with fixtures and `pytest.mark.parametrize`; property-based tests (Hypothesis) for parsers and validators.
- Test path guards with `..`, absolute paths and symlinks, and that subprocess wrappers reject option injection.
- Run tests on the lowest and highest Python in `requires-python` in CI.

## Before you finish

```sh
uv sync --locked                       # or the project's install
uv run ruff check . && uv run ruff format --check .
uv run pyright                         # or: uv run mypy .
uv run pytest
uv run pip-audit                       # or: uvx pip-audit
uv run bandit -r src -q                # if not covered by Ruff's S rules
```
