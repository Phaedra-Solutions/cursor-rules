---
id: testing/pytest
title: Python tests (pytest)
description: Python tests with pytest 9 - native TOML config and strict mode, fixtures and scopes, parametrize, pytest-asyncio 1.x without the event_loop fixture, mocking only at boundaries, no network in unit tests, coverage for changed code, and the tmpdir advisory fixed in 9.0.3. Use when editing tests/**, test_*.py, *_test.py, conftest.py or pytest config.
applies_to: "pytest >=8.4 <10"
globs: ["tests/**/*.py", "**/test_*.py", "**/*_test.py", "**/conftest.py", "pytest.toml", ".pytest.toml", "pytest.ini"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-11-01
sources:
  - https://docs.pytest.org/en/stable/changelog.html
  - https://docs.pytest.org/en/stable/reference/customize.html
  - https://docs.pytest.org/en/stable/how-to/fixtures.html
  - https://docs.pytest.org/en/stable/how-to/parametrize.html
  - https://docs.pytest.org/en/stable/how-to/monkeypatch.html
  - https://docs.pytest.org/en/stable/how-to/tmp_path.html
  - https://pytest-asyncio.readthedocs.io/en/stable/reference/changelog.html
  - https://pytest-asyncio.readthedocs.io/en/stable/reference/configuration.html
  - https://pytest-cov.readthedocs.io/en/latest/
  - https://hypothesis.readthedocs.io/en/latest/
  - https://pypi.org/project/pytest/
  - https://pypi.org/project/pytest-asyncio/
  - https://pypi.org/project/pytest-xdist/
  - https://pypi.org/project/pytest-randomly/
  - https://pypi.org/project/pytest-socket/
  - https://pypi.org/project/respx/
  - https://pypi.org/project/time-machine/
  - https://pypi.org/project/testcontainers/
  - https://osv.dev/vulnerability/GHSA-6w46-j5rx-g56g
---

# Python tests (pytest)

Language rules are in `languages/python`. Framework test setup (FastAPI `TestClient` and dependency overrides, Django's test database) is in `backend/fastapi` and `backend/django`; this rule covers pytest itself.

## Version check

- Read `pytest` and the pytest plugins (`pytest-asyncio`, `pytest-cov`, `pytest-xdist`, `pytest-django`, `pytest-mock`) from `uv.lock`, `poetry.lock` or `requirements*.txt`, and state them:

  ```text
  Applying testing/pytest (pytest 9.2.0, pytest-asyncio 1.4.1, pytest-cov 7.1.0, from uv.lock).
  ```

- **pytest 9.x** (9.2.0, Oct 2026; Python ≥ 3.10):
  - config can live in `[tool.pytest]` in `pyproject.toml`, or in `pytest.toml` / `.pytest.toml`, with native TOML types. `[tool.pytest.ini_options]` still works; keep whichever the project uses;
  - `strict = true` turns on `strict_config`, `strict_markers`, `strict_parametrization_ids` and `strict_xfail`;
  - `PytestRemovedIn9Warning` deprecations are errors; `yield_fixture` is deprecated (use `@pytest.fixture` with `yield`);
  - 9.2: `indirect`, `ids` and `scope` in `@pytest.mark.parametrize` are keyword-only; `-c` errors on a missing file.
- **pytest 8.4.x**: still common; write 8.x-compatible code there and use `[tool.pytest.ini_options]`. Below 8.4, or on Python ≤ 3.9: apply `core/legacy-mode` and `legacy/python-legacy`.
- **pytest-asyncio 1.x**: the `event_loop` fixture was removed in 1.0. Use `@pytest.mark.asyncio(loop_scope="module")` or the `asyncio_default_fixture_loop_scope` setting instead. 1.4 deprecates overriding `event_loop_policy`. Needs pytest ≥ 8.4.
- Run tests through the project's runner (`uv run pytest`, `poetry run pytest`, `python -m pytest`), never a global pytest.

## Conventions

- Layout: `tests/` mirroring `src/<package>/` (`src/app/orders/totals.py` → `tests/orders/test_totals.py`). Name tests for behavior: `test_rejects_negative_quantity`.
- Plain `assert` statements; let pytest's assertion rewriting show the diff. Use `pytest.raises(ValueError, match="quantity")` with a `match` pattern, and `pytest.approx` for floats, datetimes and timedeltas (9.1+).
- One behavior per test; arrange, act, assert. Build inputs with factories (`factory-boy` or `polyfactory`, or small typed helpers), not shared mutable module-level objects.
- New projects: turn on `strict = true` (pytest 9) or `--strict-markers --strict-config` (8.x), and register every custom marker in config.

### Fixtures

- Put shared fixtures in the nearest `conftest.py`; never import fixtures from other test modules.
- Use the narrowest scope that works: `function` by default; `session` only for expensive, read-only resources (a database container, a compiled app). Never mutate a session-scoped object inside a test.
- Clean up with `yield` fixtures (code after `yield` runs even when the test fails), not `addfinalizer` chains.
- Use the built-ins: `tmp_path` for files, `monkeypatch` for env vars and attributes (`monkeypatch.setenv`, `monkeypatch.setattr`), `caplog` for logs, `capsys` for output. Never write to the repo tree, `/tmp` by hand, or real `os.environ` without `monkeypatch`.
- Avoid `autouse=True` except for true global guards (blocking the network, freezing randomness seeds).

### Parametrize

- Use `@pytest.mark.parametrize` for input tables, with `pytest.param(..., id="negative-quantity")` for readable IDs; never copy-paste near-identical tests.
- Pass `ids=`, `indirect=` and `scope=` as keyword arguments (required in 9.2).
- Property-based tests with Hypothesis (`@given`) for parsers, serializers and validators; keep the default deadline and add `.hypothesis/` to `.gitignore`.

### Async

- `pytest-asyncio` with `asyncio_mode = "strict"` (the default) and explicit `@pytest.mark.asyncio`; use `"auto"` only if the project already does. AnyIO projects use the AnyIO plugin (`@pytest.mark.anyio`) instead; don't install both on the same tests.
- Never create or close event loops by hand, and never call `asyncio.run()` inside a test.
- Async HTTP clients: `httpx.AsyncClient(transport=ASGITransport(app=app))` for ASGI apps.

### Mocking

- Mock at boundaries only: HTTP, time, randomness, the file system, message brokers and third-party SDKs. Don't mock the unit under test or its pure helpers.
- HTTP: `respx` (httpx) or `responses` (requests), with unmatched requests failing. Time: `time-machine` or `freezegun`, whichever the project has.
- `unittest.mock.patch` / `mocker.patch` must target where the name is looked up (`app.orders.service.payments_client`), not where it's defined. Use `autospec=True` (or `create_autospec`) so mocks fail on wrong signatures.
- Databases: test against the same engine as production (Postgres via `testcontainers` or a CI service), not SQLite, when the app uses Postgres. Wrap each test in a transaction that rolls back, or truncate between tests.

### Speed and isolation

- Tests pass in any order and in parallel. Use `pytest-randomly` to shuffle order and `pytest-xdist` (`-n auto`) for parallel runs where the project has them; give each worker its own database or schema.
- Mark slow and integration tests (`@pytest.mark.integration`) and register the markers; the default run stays fast.
- Add `pytest-timeout` for suites that can hang (network, subprocess, async).

### Coverage

- Every changed or added branch has a test. Run `pytest --cov=<package> --cov-branch --cov-report=term-missing` and check the uncovered lines in the diff.
- Bug fixes come with a regression test that fails without the fix.
- Follow the project's `fail_under` threshold; never lower it, and never add `# pragma: no cover` to reach a number.

## Security

- Unit tests never reach the network. Block it with `pytest-socket` (`--disable-socket --allow-unix-socket`) or an autouse fixture, and allow it only for marked integration tests.
- Never use real credentials, production databases or real payment providers. Put fake values in test settings or `monkeypatch.setenv`; real secrets stay out of fixtures, cassettes and snapshots.
- Scrub tokens, cookies and personal data from recorded HTTP cassettes (`vcrpy` `filter_headers`) and snapshot files (`syrupy`, `inline-snapshot`) before committing.
- `conftest.py` and plugins run with full access on developer machines and CI. Run `dependency-vet` before adding any pytest plugin, and review `conftest.py` changes like application code.
- Don't use `pickle` or `yaml.load` to load fixtures; use JSON or `yaml.safe_load` (see `languages/python`).
- On shared machines, keep pytest ≥ 9.0.3 so temporary directories under `/tmp/pytest-of-<user>` can't be hijacked by another local user.

## Known vulnerabilities (as of 2026-11)

| Advisory | Package | Affected | Fixed |
|---|---|---|---|
| CVE-2025-71176 (GHSA-6w46-j5rx-g56g): predictable `/tmp/pytest-of-{user}` directories let local users cause DoS or possibly escalate privileges (UNIX) | pytest | < 9.0.3 | 9.0.3 |

No current OSV advisories for `pytest-asyncio`, `pytest-cov`, `pytest-xdist`, `pytest-django`, `hypothesis` or `coverage`. pytest 8.x has no backported fix; on 8.x, set `--basetemp` to a directory the user owns. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Check that each new test can fail: break the code under test once (or invert the assertion) and confirm it goes red.
- Run the changed tests several times in random order (pytest-randomly shuffles by default; `-p no:randomly` turns it off to compare) to catch shared state.
- No `@pytest.mark.skip`, `xfail` without `strict=True`, or `breakpoint()` left behind without a reason in the summary.

## Before you finish

```sh
uv run ruff check . && uv run ruff format --check .
uv run mypy src                                   # or pyright, whichever the project uses
uv run pytest -x -q                               # changed area first: uv run pytest tests/orders
uv run pytest --cov=<package> --cov-branch --cov-report=term-missing
uv run pytest -n auto                             # if pytest-xdist is installed (pytest-randomly shuffles automatically)
grep -rnE "(pytest\.mark\.skip|breakpoint\(\))" tests/ 2>/dev/null
uv run --with pip-audit pip-audit                 # audits the project environment
uv pip show pytest | grep -i '^version'           # ≥ 9.0.3
```
