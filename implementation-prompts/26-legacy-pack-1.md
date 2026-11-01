# Prompt 26: Legacy pack 1: AngularJS, CRA/class components, jQuery

> Self-contained; safe in a fresh session. Roadmap: Phase 3, §8, §12 (D5).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it (§4 covers legacy rules, which need `## Migration path`).
2. Read `ROADMAP.md` §8.1 and §8.2. If `rules/core/legacy-mode.md` exists, read it and follow it.
3. Research:
   - AngularJS EOL and its unpatched CVEs (CVE-2026-11998 and others); commercial extended-support options;
   - the official CRA deprecation and the recommended migration targets;
   - class-component → hooks migration guidance;
   - jQuery 4.0 changes and jQuery Migrate; known CVEs in jQuery < 3.5.

## Task
1. **`rules/legacy/angularjs.md`:**
   - working safely in AngularJS 1.x (`$sce`, no `ng-bind-html` with untrusted input, CSP mode, no template injection from user input);
   - known CVEs with no official fix; compensating controls;
   - migration options: incremental hybrid, per-route rewrite, or a full rewrite.
2. **`rules/legacy/react-class-cra.md`:** class components, legacy Redux (`connect`), CRA/webpack setups; safe maintenance; migration path.
3. **`rules/legacy/jquery.md`:**
   - jQuery 1–3: XSS-safe DOM APIs (`.text()` over `.html()`); `$.ajax` CSRF handling;
   - CVEs by version; upgrading to 3.7.x or 4.x.
4. Skills:
   - **`skills/migrate-angularjs/SKILL.md`**
   - **`skills/migrate-cra-to-vite/SKILL.md`** (env-variable prefix changes, `index.html` moves, tests)
   - **`skills/migrate-class-to-hooks/SKILL.md`**
   - **`skills/upgrade-jquery/SKILL.md`** (with jQuery Migrate)

## Done when
All seven files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
