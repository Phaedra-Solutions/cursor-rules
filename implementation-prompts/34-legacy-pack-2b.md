# Prompt 34: Legacy pack 2b: Xamarin, Cordova, Rails, ingress-nginx, Bull, Moment.js

> Self-contained; safe in a fresh session. Roadmap: Phase 4, §8.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it (legacy rules need `## Migration path`).
2. Read `ROADMAP.md` §8.1 and §8.2. If `rules/core/legacy-mode.md` exists, read it and follow it.
3. Research:
   - the Xamarin EOL and .NET MAUI migration docs;
   - Cordova's current status and the Capacitor migration guide;
   - Rails support policy and versions; `next_rails`/dual-boot tooling (verify);
   - the ingress-nginx retirement and the `ingress2gateway` tool;
   - Bull's maintenance status vs BullMQ;
   - Moment.js status, and Temporal availability in Node and browsers.

## Task
1. **Legacy rules:**
   - `rules/legacy/xamarin.md`
   - `rules/legacy/cordova.md`
   - `rules/legacy/rails-legacy.md` (Rails ≤ 7.1)
   - `rules/legacy/ingress-nginx.md`
   - `rules/legacy/js-legacy-libraries.md` (Bull, Moment.js and similar maintenance-mode libraries: how to recognize them, safe use, and replacements)
2. **Skills:**
   - `skills/migrate-xamarin/SKILL.md`
   - `skills/migrate-cordova/SKILL.md`
   - `skills/upgrade-rails/SKILL.md` (one minor at a time; deprecation warnings; dual boot)
   - `skills/migrate-ingress-nginx/SKILL.md` (inventory annotations; convert with `ingress2gateway`; parallel run; cut over)

## Done when
All nine files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
