# Prompt 32: P2 data and CMS: Firebase, MongoDB, Drizzle, Sequelize/TypeORM, SQLAlchemy, WordPress

> Self-contained; safe in a fresh session. Roadmap: Phase 4, §6 (Data, CMS), §7 (P2 essentials table).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it. D4 covers Postgres naming.
2. Read the `ROADMAP.md` §7 P2 rows for Firebase, MongoDB and WordPress.
3. Research:
   - Firebase Security Rules and App Check docs;
   - the MongoDB/Mongoose current majors and NoSQL injection guidance;
   - the Drizzle stable and 1.0 status; Sequelize and TypeORM current majors;
   - SQLAlchemy 2.x;
   - the latest WordPress release, the WordPress security handbook, and Patchstack's latest report.

## Task
Create these as tier P2 rules, each under 220 lines:

1. **`rules/data/firebase.md`** (globs `firestore.rules`, `storage.rules`, `firebase.json`, `functions/**`)
2. **`rules/data/mongodb.md`** (globs `**/*.model.{ts,js}`, `**/models/**`, `**/*mongo*`)
3. **`rules/data/orm-drizzle.md`** (globs `drizzle/**`, `**/schema.ts`, `drizzle.config.*`)
4. **`rules/data/orm-sequelize-typeorm.md`**
   - globs: `**/*.entity.ts`, `**/models/**/*.{ts,js}`, `ormconfig.*`, `**/migrations/**`
   - cover: raw-query safety, migrations, transactions, N+1 avoidance
5. **`rules/data/sqlalchemy.md`** (globs `**/models.py`, `**/db/**/*.py`, `alembic/**`)
6. **`rules/cms-commerce/wordpress.md`**
   - globs: `wp-content/**/*.php`, `functions.php`, `**/*.php` inside plugin or theme folders
   - cover: capability checks, nonces, sanitize-in/escape-out, `$wpdb->prepare`, REST `permission_callback`, plugin vetting, update policy

## Done when
All six rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
