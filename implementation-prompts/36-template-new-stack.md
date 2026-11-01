# Prompt 36: Template: add a new stack (reusable, P3 backlog)

> Reusable and self-contained. Copy this prompt, replace the `<placeholders>`, and run it in a fresh session. Use it for the P3 backlog in ROADMAP §11 (Rust/Axum, modern Rails, Symfony, Flask, Kotlin Multiplatform, .NET MAUI, Capacitor, Shopify, headless CMS, Redis, GitLab CI, OpenTelemetry, C/C++, ML/Python, React Router 7) or for any stack a client needs.

## Fill in
- **Stack:** `<e.g. Rust + Axum>`
- **Rule path(s):** `<e.g. rules/languages/rust.md, rules/backend/rust-axum.md>`
- **Tier:** `<P3>`
- **Legacy coverage needed?** `<yes: versions … / no>`
- **Skills needed?** `<e.g. upgrade-<stack> / none>`

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §6 row and §7 entry for this stack (if they exist), §5.1 and §5.6.
3. Look at one existing rule in the same category and match its depth and style.
4. Research the current stable version, support policy and EOL dates; official security guidance; known CVEs from the last 24 months; and the ecosystem's audit, SAST and lint tools.

## Task
1. Write each rule per shared context §4, with all required headings, 80–250 lines, sourced.
2. If legacy coverage is needed, write `rules/legacy/<stack>-legacy.md` with `## Migration path`, and set `legacy_rule` in the modern rule.
3. Write each skill per shared context §5.
4. If the stack belongs in a preset, add it to the matching file in `presets/`.
5. If the stack has notable advisories, add them to `security/watchlist.yml` (when that file exists).

## Done when
The files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
