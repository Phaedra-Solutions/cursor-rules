# Prompt 21: Node.js and Express (+ legacy, upgrade skills)

> Self-contained; safe in a fresh session. Roadmap: Phase 3, §6, §7 (`backend/express`), §8.2.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §7 entry `backend/express` and the Express 4 and Node ≤ 20 rows of §8.2.
3. Research:
   - the Node.js release schedule and EOL dates; Node security releases; the permission model;
   - the Express 5 migration guide (path syntax, query parser, async errors); Express's LTS status and CVEs;
   - the helmet and express-rate-limit current majors.

## Task
1. **`rules/languages/javascript-node.md`:**
   - tier P1; globs `**/*.{js,mjs,cjs}`, `package.json`;
   - `legacy_rule: legacy/node-legacy`;
   - ESM; supported LTS lines; `node:` imports;
   - no `child_process` with user input (use `execFile` with argument arrays);
   - path traversal guards; `crypto` usage; timeouts on fetch; process-level error handling.
2. **`rules/backend/express.md`:**
   - tier P1; globs `src/**/*.{ts,js}`, `server.*`, `app.*`;
   - `legacy_rule: legacy/express-4`;
   - cover the §7 entry; middleware order; error handler; validation with Standard Schema.
3. **`rules/legacy/express-4.md`** and **`rules/legacy/node-legacy.md`:**
   - EOL status; safe maintenance; known CVEs (body-parser, path-to-regexp, etc.; verify);
   - migration path.
4. **`skills/upgrade-express/SKILL.md`:** the 4 → 5 codemods (verify whether `@expressjs/codemod` exists), the route-syntax changes, tests.
5. **`skills/upgrade-node/SKILL.md`:**
   - pick the target LTS;
   - update `.nvmrc`, `engines`, CI and Docker images;
   - native-module rebuilds; tests.

## Done when
All six files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
