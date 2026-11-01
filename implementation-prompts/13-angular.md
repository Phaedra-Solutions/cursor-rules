# Prompt 13: Angular (+ NgModule legacy, upgrade skill)

> Self-contained; safe in a fresh session. Roadmap: Phase 2, §7 (`frontend/angular`), §8.2.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §7 entry `frontend/angular`, the Angular rows of §5.8, and §8.2.
3. The root `angular-rules.md` (an Angular 15, NgModule-era architecture) is the source for the legacy rule.
4. Research:
   - the current Angular version and support table (https://angular.dev/reference/releases);
   - the v21/v22 features (signals, zoneless, Signal Forms, `httpResource`, `@angular/aria`, Vitest);
   - Angular CVEs from 2026 onward;
   - the `ng update` and migration schematics.

## Task
1. **`rules/frontend/angular.md`:**
   - tier P0; globs `**/*.component.ts`, `**/*.component.html`, `**/*.service.ts`, `angular.json`, `src/app/**/*.ts`;
   - `legacy_rule: legacy/angular-ngmodules`;
   - cover the §7 entry;
   - the folder layout: `core/`, `shared/` and `features/` with standalone components, keeping the good ideas from the old file (one service per feature, barrel files, pure utils).
2. **`rules/legacy/angular-ngmodules.md`:**
   - adapted from the root `angular-rules.md` for Angular ≤ 19 NgModule apps;
   - keep the layered architecture;
   - add safe-maintenance rules, the EOL status per version, known CVEs and compensating controls;
   - migration path: the standalone schematic, then signals and control flow;
   - generalize project-specific folders (for example `mapbox/` becomes "domain modules").
3. **`skills/upgrade-angular/SKILL.md`:**
   - `ng update` one major at a time, using the update guide;
   - the standalone, control-flow, signal-input and inject() migrations;
   - zoneless adoption checks; switching the test runner to Vitest;
   - verify with build, tests and e2e.

## Done when
All three files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
