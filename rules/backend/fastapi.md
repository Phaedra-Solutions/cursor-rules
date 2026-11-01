---
id: backend/fastapi
title: FastAPI
description: FastAPI with Pydantic v2 and Starlette 1.x - separate Create, Update and Read models with response_model everywhere, strict validation, authentication and scopes through dependencies with per-object authorization in services, no blocking I/O in async routes, async SQLAlchemy 2 sessions, outbound timeouts, pydantic-settings, CORS allowlists, trusted hosts, rate and size limits, and Starlette, python-multipart and PyJWT advisories. Use when editing FastAPI routers, dependencies, schemas or app setup.
applies_to: "pypi:fastapi >=0.115 <1"
globs: ["**/main.py", "**/routers/**/*.py", "**/api/**/*.py", "**/schemas/**/*.py", "**/dependencies*.py", "**/deps.py"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://fastapi.tiangolo.com/tutorial/security/
  - https://fastapi.tiangolo.com/advanced/security/oauth2-scopes/
  - https://fastapi.tiangolo.com/tutorial/response-model/
  - https://fastapi.tiangolo.com/tutorial/cors/
  - https://fastapi.tiangolo.com/async/
  - https://fastapi.tiangolo.com/advanced/settings/
  - https://fastapi.tiangolo.com/tutorial/bigger-applications/
  - https://docs.pydantic.dev/latest/concepts/strict_mode/
  - https://docs.pydantic.dev/latest/concepts/pydantic_settings/
  - https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
  - https://github.com/Kludex/starlette
  - https://pypi.org/project/fastapi/
  - https://osv.dev/vulnerability/GHSA-86qp-5c8j-p5mr
  - https://osv.dev/vulnerability/GHSA-82w8-qh3p-5jfq
  - https://osv.dev/vulnerability/GHSA-jp82-jpqv-5vv3
  - https://osv.dev/vulnerability/GHSA-x746-7m8f-x49c
  - https://osv.dev/vulnerability/GHSA-v9pg-7xvm-68hf
  - https://osv.dev/vulnerability/GHSA-wp53-j4wj-2cfg
  - https://osv.dev/vulnerability/GHSA-xgmm-8j9v-c9wx
  - https://osv.dev/vulnerability/GHSA-jq35-7prp-9v3f
---

# FastAPI

Also apply `languages/python`. Generic web security is in `core/security-baseline`; database rules in `data/postgres`.

## Version check

- Read `fastapi`, `starlette`, `pydantic`, `pydantic-settings`, `uvicorn`, `python-multipart`, `sqlalchemy` and the JWT library from `uv.lock` or the requirements, and state them:

  ```text
  Applying backend/fastapi (fastapi 0.162.0, starlette 1.10, pydantic 2.14, SQLAlchemy 2.1 async, from uv.lock).
  ```

- Current (Oct 2026): FastAPI 0.162.0 (Python ≥ 3.10), Starlette 1.10.0, Pydantic 2.14.2. FastAPI is still 0.x: read its release notes before minor upgrades.
- **Pydantic v1** (`from pydantic import BaseModel` with `class Config`, `orm_mode`, `validator`): write v1 code only where the project hasn't migrated; offer the migration (`bump-pydantic`) separately.
- Check Starlette ≥ 1.3.1, `python-multipart` ≥ 0.0.31 and PyJWT ≥ 2.15.0 (see Known vulnerabilities).

## Conventions

### Structure

```text
app/
├── main.py              # create_app(): middleware, routers, exception handlers
├── core/config.py       # Settings(BaseSettings)
├── core/security.py     # token decoding, password hashing
├── db/session.py        # async engine and session dependency
├── api/deps.py          # get_db, get_current_user, require_scopes
└── modules/orders/      # router.py, schemas.py, service.py, models.py
```

- Routers per feature (`APIRouter(prefix="/orders", tags=["orders"])`); handlers call services; services don't import FastAPI.

### Models

- Separate Pydantic models per direction: `OrderCreate`, `OrderUpdate` (all optional), `OrderRead`. Never accept or return ORM models directly.
- Set `response_model` (or a return annotation) on every route so only declared fields leave the API. `model_config = ConfigDict(from_attributes=True)` on Read models.
- Forbid unknown fields on write models (`model_config = ConfigDict(extra="forbid")`) and use strict types where coercion is risky (`StrictInt`, `Field(strict=True)`, or `strict=True` on the model) — IDs, amounts, booleans.
- Constrain inputs: `Field(min_length=…, max_length=…)`, `conint`/`Annotated[int, Field(ge=1, le=100)]` for pagination, `EmailStr`, `HttpUrl`, enums.

### Dependencies and auth

- Authenticate through dependencies: `current_user: Annotated[User, Depends(get_current_user)]`; for scopes, `Security(get_current_user, scopes=["orders:write"])` with `SecurityScopes`.
- Apply auth at the router level (`APIRouter(dependencies=[Depends(get_current_user)])`) so new routes are protected by default; mark public routes explicitly.
- Authorization of the specific object happens in the service: load by `(id, owner_id or tenant_id)`, return 404 when not found or not allowed.
- JWTs: verify signature, `exp`, `iss`, `aud`, and pass an explicit `algorithms=[...]` list; never `verify=False` or `algorithms` taken from the token header.

### Async and database

- `async def` routes must not block: no `requests`, sync DB drivers, `time.sleep` or heavy CPU work. Use `httpx.AsyncClient`, async SQLAlchemy 2 (`AsyncSession`, `async_sessionmaker`, `asyncpg`/`psycopg`), or plain `def` routes (FastAPI runs them in a thread pool) for sync code.
- One session per request through a `yield` dependency; commit in the service, roll back on error. `expire_on_commit=False` for async sessions.
- Outbound HTTP: one shared `httpx.AsyncClient` created in the lifespan with `timeout=httpx.Timeout(10.0)` and limits; close it on shutdown.

### Config and app setup

- `Settings(BaseSettings)` from `pydantic-settings`, loaded once (`@lru_cache` getter), with `SecretStr` for secrets and no defaults for required secrets.
- Lifespan handler (`lifespan=`) for startup and shutdown, not deprecated `on_event`.
- Disable or protect the docs in production: `FastAPI(docs_url=None, redoc_url=None, openapi_url=None)` or behind auth, unless the API is public by design.

## Security

- **CORS:** `CORSMiddleware(allow_origins=[...settings.cors_origins], allow_credentials=True, allow_methods=[...], allow_headers=[...])`. Never `allow_origins=["*"]` with credentials, never `allow_origin_regex=".*"`.
- **Hosts:** `TrustedHostMiddleware(allowed_hosts=[...])`; run Uvicorn with `--proxy-headers --forwarded-allow-ips=<proxy IPs>` only behind a known proxy.
- **Limits:** limit request body size at the proxy and for uploads (`UploadFile` with a size check while streaming); rate-limit login and expensive routes (gateway or a library such as `slowapi`).
- **Errors:** custom exception handlers return generic messages; never return stack traces or SQL errors. Set `debug=False`.
- **Uploads:** check content type and size, store outside static directories with generated names, scan if users download each other's files.
- **Passwords:** `argon2-cffi` or `pwdlib` with Argon2; never plain hashes.
- **Background tasks:** `BackgroundTasks` run in-process after the response; use a queue (Celery, RQ, arq, Dramatiq) for work that must survive restarts or retry.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2026-48710: missing Host validation poisons `request.url.path` and bypasses path-based checks | starlette | 1.0.1 |
| CVE-2026-54282, CVE-2026-54283: path concatenated into authority; form limits ignored for URL-encoded bodies | starlette | 1.3.0 / 1.3.1 |
| CVE-2026-48817, CVE-2026-48818: arbitrary method dispatch on `HTTPEndpoint`; SSRF/NTLM theft via UNC paths in `StaticFiles` on Windows | starlette | 1.1.0 |
| CVE-2026-53537 – CVE-2026-53540, CVE-2026-40347, CVE-2026-42561: multipart and querystring DoS and parameter smuggling | python-multipart | 0.0.31 |
| CVE-2026-24486: arbitrary file write (non-default config) | python-multipart | 0.0.22 |
| CVE-2026-48526, CVE-2026-48523 and ~20 more 2026 advisories: public keys accepted as HMAC secrets (forged tokens), algorithm allow-list bypass, JWKS SSRF and DoS | PyJWT | 2.15.0 |

FastAPI itself has no current OSV advisories; its risk comes from Starlette and parsers. This list goes stale; verify with the `cve-check` skill, `pip-audit` or OSV before relying on it.

## Testing

- `TestClient` (or `httpx.AsyncClient` with `ASGITransport`) against `create_app()`, with dependency overrides for auth and the database.
- For each route: 401 without a token, 403 with missing scopes, 404 for another user's object, 422 for invalid or extra fields, and that responses contain only `response_model` fields.
- Run the test database in a container (Postgres), not SQLite, when the app uses Postgres.

## Before you finish

```sh
uv run ruff check . && uv run pyright
uv run pytest
uv run pip-audit
uv run bandit -r app -q
uv pip list | grep -iE "^(fastapi|starlette|python-multipart|pyjwt|pydantic) "   # at or above the fixed versions
```
