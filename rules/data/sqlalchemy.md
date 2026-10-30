---
id: data/sqlalchemy
title: SQLAlchemy 2 and Alembic
description: SQLAlchemy 2.1 (2.0 maintenance) with Alembic - version status (2.1 needs Python 3.11+, 1.4 is past maintenance), typed declarative models with Mapped and mapped_column, 2.0-style select() and Session.execute, session and transaction scope (sessionmaker, begin blocks, one session per request), async sessions with expire_on_commit=False, eager loading with selectinload or joinedload and raiseload to stop N+1, parameterized text() and no f-strings in SQL, allowlisted dynamic columns, reviewed Alembic autogenerate migrations, naming conventions, and snake_case Postgres schemas. Use when editing SQLAlchemy models, queries, sessions or Alembic migrations.
applies_to: "pypi:sqlalchemy >=2.0 <2.2"
globs: ["**/models.py", "**/models/**/*.py", "**/db/**/*.py", "alembic/**", "alembic.ini", "**/migrations/versions/*.py"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://docs.sqlalchemy.org/en/21/
  - https://docs.sqlalchemy.org/en/21/changelog/migration_21.html
  - https://docs.sqlalchemy.org/en/20/changelog/migration_20.html
  - https://docs.sqlalchemy.org/en/20/orm/quickstart.html
  - https://docs.sqlalchemy.org/en/20/orm/session_basics.html
  - https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
  - https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html
  - https://docs.sqlalchemy.org/en/20/core/sqlelement.html#sqlalchemy.sql.expression.text
  - https://alembic.sqlalchemy.org/en/latest/
  - https://alembic.sqlalchemy.org/en/latest/autogenerate.html
  - https://www.sqlalchemy.org/download.html
  - https://pypi.org/project/SQLAlchemy/
---

# SQLAlchemy 2 and Alembic

Also apply `languages/python`; FastAPI apps follow `backend/fastapi`; Postgres specifics are in `data/postgres`. Django projects use the Django ORM (`backend/django`).

## Version check

- Read `sqlalchemy`, `alembic` and the driver (`psycopg`, `asyncpg`, `pymysql`, `aiosqlite`) from `uv.lock`, `poetry.lock` or requirements, plus the Python version. State them:

  ```text
  Applying data/sqlalchemy (SQLAlchemy 2.1.6, Alembic 1.20, psycopg 3, async sessions, Python 3.13).
  ```

- **Status (Oct 2026):** 2.1 is the current series (2.1.0 on 24 Sep 2026; 2.1.6 latest) and **requires Python 3.11+**; 2.0 is the maintenance series (2.0.55). 1.4 and older are past maintenance: follow `core/legacy-mode` and the 2.0 migration guide (`SQLALCHEMY_WARN_20=1` on 1.4 to surface 2.0 deprecations).
- Read the 2.1 migration notes before upgrading from 2.0; keep 2.0 on Python 3.10 projects.

## Conventions

- **Models:** typed declarative mapping with `DeclarativeBase`, `Mapped[...]` and `mapped_column()`; `Mapped[str | None]` for nullable columns; relationships typed (`Mapped[list["Item"]] = relationship(back_populates="order")`).
- A `MetaData(naming_convention=...)` on the base so constraints and indexes have stable names for Alembic.
- New Postgres schemas use snake_case table and column names; timezone-aware timestamps (`DateTime(timezone=True)`, `server_default=func.now()`).
- **2.0-style queries:** `session.execute(select(Order).where(Order.user_id == user_id)).scalars().all()` or `session.scalars(...)`; no legacy `session.query()` in new code.
- **Sessions:** one `sessionmaker` per engine; one session per request or unit of work, closed at the end (FastAPI dependency with `yield`, `with Session() as session, session.begin():`); never a global session shared across threads or tasks.
- **Async:** `create_async_engine` + `async_sessionmaker(expire_on_commit=False)`; no lazy loading in async code (it raises `MissingGreenlet`); load relationships eagerly or use `AsyncAttrs.awaitable_attrs`.
- Engine settings: `pool_pre_ping=True`, pool size matching the deployment, statement timeouts on the server; one engine per process.

## Queries and N+1

- Choose loading per query: `selectinload()` for collections, `joinedload()` for many-to-one; add `raiseload("*")` in services where unexpected lazy loads should fail.
- Select only needed columns (`select(Order.id, Order.total)`) for lists and reports; paginate with keyset filters on indexed columns for large tables.
- Bulk operations with `insert(...).values([...])` or `session.execute(insert(Model), rows)`; `update()`/`delete()` statements with `where` clauses for set-based changes.
- Check plans for new queries with `EXPLAIN`; log slow queries via engine events in staging.

## Migrations (Alembic)

- `alembic revision --autogenerate -m "..."` then review every file: autogenerate misses renames, some type changes and server defaults, and can't write data migrations.
- `target_metadata` points at the models' metadata; `compare_type=True` in `env.py`.
- Apply with `alembic upgrade head` in a deploy step; write `downgrade()`; destructive changes in two releases; one head (`alembic heads`) before merging.
- `alembic.ini` and `env.py` read the URL from the environment; no credentials in the repo.

## Security

- **Parameterize:** `text("select * from orders where id = :id")` with `{"id": order_id}`; never f-strings, `%` or `.format()` in SQL, `text()`, `literal_column()` or `order_by()` strings.
- **Dynamic columns and sort:** map request values through an allowlist to model attributes (`SORTABLE = {"created": Order.created_at, "total": Order.total}`), and direction to `asc()`/`desc()`.
- **Mass assignment:** build models from validated schemas (Pydantic, attrs) with explicit fields; never `Model(**request.json)` or `setattr` loops over request keys.
- **Authorization:** tenant and owner filters on every query; a repository layer or `with_loader_criteria` can enforce tenant filters, but keep explicit checks for sensitive actions.
- **Least privilege:** the app's database role can't alter the schema; Alembic runs with a migration role.
- **Errors and logging:** `echo=False` in production; don't log statements with bound parameters containing personal data; don't return `DBAPIError` text to clients.

## Known vulnerabilities

- No OSV advisories for SQLAlchemy 2.x or Alembic as of 2026-10; older SQLAlchemy advisories (CVE-2019-7164 and CVE-2019-7548, SQL injection through `order_by`/`group_by` strings in 1.2.17 and earlier) show why string arguments must never carry user input. Driver advisories (psycopg, asyncpg, PyMySQL) come through `pip-audit`.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Tests against the real database engine (Testcontainers or a disposable database), each test in a transaction rolled back at the end or a fresh schema per run.
- Run `alembic upgrade head` from empty and `alembic check` (no pending model changes) in CI.
- Assert query counts for list endpoints to catch N+1.

## Before you finish

```sh
alembic heads && alembic check      # one head, models match migrations
pytest
pip-audit                           # or the project's scanner
grep -rnE 'text\(f"|execute\(f"|order_by\(f"|\.query\(' --include=*.py .   # no f-strings in SQL; no legacy Query in new code
```
