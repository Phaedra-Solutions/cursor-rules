# Decision record

Architecture decisions for this repository, in a lightweight ADR format. The options and their trade-offs come from [ROADMAP §12 "Decisions needed"](../ROADMAP.md#12-decisions-needed). Each decision below takes the recommended option.

To change a decision, add a new entry that supersedes the old one and update its status. Don't edit an accepted decision in place.

| # | Decision | Status | Date |
|---|---|---|---|
| [D1](#d1-scope-multi-tool-from-one-source) | Multi-tool from one source; keep the repo name | Accepted | 2026-10-29 |
| [D2](#d2-security-core-adopt-and-extend-project-codeguard) | Adopt and extend Project CodeGuard | Accepted | 2026-10-29 |
| [D3](#d3-license-mit) | MIT license; CodeGuard content keeps CC BY 4.0 | Accepted | 2026-10-29 |
| [D4](#d4-house-conventions-as-an-optional-overlay) | House conventions as an optional overlay | Accepted | 2026-10-29 |
| [D5](#d5-legacy-priority-pack-1-first) | Legacy pack 1 first | Accepted | 2026-10-29 |
| [D6](#d6-owners-placeholder-team) | Placeholder owner team | Accepted | 2026-10-29 |
| [D7](#d7-evals-promptfoo-run-locally-or-on-demand) | promptfoo evals, local or manual dispatch | Accepted | 2026-10-29 |
| [D8](#d8-distribution-clone-and-install-script) | Clone + install script, no npm package | Accepted | 2026-10-29 |

---

## D1. Scope: multi-tool from one source

- **Status:** Accepted, 2026-10-29
- **Context:** Cursor reads `.mdc` rules, but Codex, Copilot, Claude Code, Gemini CLI and others read `AGENTS.md` and Agent Skills. Maintaining separate copies per tool would drift. See ROADMAP §4.1.
- **Decision:** One canonical Markdown source per rule and skill generates Cursor `.mdc` rules, `AGENTS.md` and Agent Skills. Keep the repo name `cursor-rules` to preserve links; the README gets a "Works with" section.
- **Alternatives considered:**
  - Cursor-only. Simpler, but locks out every other agent the team uses.
  - Multi-tool with a rename. Clearer name, but breaks existing links and bookmarks (GitHub redirects, but forks and docs drift). Can still be done later.
- **Consequences:** Needs a build script (`scripts/build.mjs`) and a frontmatter format rich enough to render every target.
- **Reference:** [ROADMAP §12, item 1](../ROADMAP.md#12-decisions-needed)

## D2. Security core: adopt and extend Project CodeGuard

- **Status:** Accepted, 2026-10-29
- **Context:** A generic, language-agnostic security baseline is a large amount of work to write and keep current. Project CodeGuard (CoSAI, an OASIS Open Project) already maintains one under CC BY 4.0.
- **Decision:** Adapt Project CodeGuard (github.com/cosai-oasis/project-codeguard) where it fits as the generic security layer, with attribution in `NOTICE.md` and in each adapted file's `sources`. Our rules add the stack-specific and house layers on top.
- **Alternatives considered:**
  - Write our own baseline from scratch. Full control, but slower and duplicates maintained work.
  - Point users at CodeGuard and ship nothing generic. Less work, but no integration with our version checks, skills or build.
- **Consequences:** Every adapted file must cite CodeGuard. Upstream changes need a periodic review.
- **Evaluation (2026-10-29):** reviewed CodeGuard v1.5.0 (released 2026-09-29; `main` at `41160d5`, 2026-10-12). License: CC BY 4.0 (`LICENSE.md`). Content: 23 core rules in `sources/rules/core` (3 always-on: hardcoded credentials, crypto algorithms, digital certificates) and 85 OWASP cheat-sheet rules in `sources/rules/owasp`, plus skills, translators and an MCP server.
  - **Adapt** (reworded into `core/security-baseline`, grouped by OWASP Top 10:2025): hardcoded credentials, crypto algorithms, authorization and access control (IDOR, mass assignment), input validation and injection, session management and cookies, XML and serialization, logging, and the SSRF parts of API and web services.
  - **Reference, don't copy:** the `owasp/*` cheat-sheet rules (too long for an always-on rule; linked for depth); safe C functions (→ `languages/c-cpp`); MCP security (→ `core/agent-safety`, `ai/mcp-servers`); supply chain (→ `core/supply-chain`); IaC, Kubernetes, CI/CD and containers (→ `devops/*`); mobile (→ `mobile/mobile-security`); framework-specific rules (→ our stack rules, which add version checks).
  - **Don't use** CodeGuard's translators or release bundles directly; our build generates every target from one source (D1).
- **Gap analysis against OWASP Top 10:2025** (CodeGuard is organised by topic, not by the 2025 categories):

  | Category | CodeGuard core coverage | Gap we fill |
  |---|---|---|
  | A01 Broken Access Control (incl. SSRF) | Strong (authorization, IDOR, mass assignment; SSRF in API rule) | Path traversal and CSRF stated as always-on rules; 2025 mapping |
  | A02 Security Misconfiguration | Partial, spread across framework and client-side rules | Short always-on checklist (debug, CORS, headers, admin endpoints) |
  | A03 Software Supply Chain Failures | Basic (one short rule) | `core/supply-chain`: package existence and age checks, lockfiles, install scripts, pinned actions |
  | A04 Cryptographic Failures | Strong (always-on crypto and credentials rules) | Public env-var prefixes, TLS verification flags |
  | A05 Injection | Strong | Framework sinks (`v-html`, `bypassSecurityTrust*`, raw ORM APIs) |
  | A06 Insecure Design | Weak in core (threat modeling only in the long OWASP rules) | Abuse cases, limits and quotas always on; `threat-model-lite` skill |
  | A07 Authentication Failures | Strong (MFA, sessions, cookies) | JWT `iss`/`aud`/`exp` and algorithm allowlist stated as one checklist |
  | A08 Software or Data Integrity Failures | Partial (deserialization, SRI) | Webhook signature verification; LangChain deserialization (CVE-2025-68664) |
  | A09 Security Logging and Alerting Failures | Good (logging rule) | Alertability stated always on |
  | A10 Mishandling of Exceptional Conditions | Not in core (only the OWASP error-handling rule) | Fail closed, no leaked errors, global handlers, timeouts and cleanup |

  CodeGuard doesn't cover the OWASP Top 10 for LLM or Agentic Applications in depth; those go in `ai/*` and `core/agent-safety`.
- **Reference:** [ROADMAP §12, item 2](../ROADMAP.md#12-decisions-needed)

## D3. License: MIT

- **Status:** Accepted, 2026-10-29
- **Context:** The repo had no license, so nobody could legally reuse it. It will include CC BY 4.0 content from CodeGuard (D2).
- **Decision:** License the repo under MIT. Adapted CodeGuard content keeps its CC BY 4.0 attribution, recorded in `NOTICE.md`.
- **Alternatives considered:**
  - CC BY 4.0 for all content. Matches CodeGuard, but is awkward for the scripts and less familiar to developers.
  - Dual license (MIT for code, CC BY 4.0 for prose). Precise, but harder to explain and apply per file.
- **Consequences:** Contributions are MIT. Any third-party content needs its license checked before inclusion.
- **Reference:** [ROADMAP §12, item 3](../ROADMAP.md#12-decisions-needed)

## D4. House conventions as an optional overlay

- **Status:** Accepted, 2026-10-29
- **Context:** The original rules mixed generic best practice with Phaedra preferences, which outside users don't want and which contradict each other in places.
- **Decision:** House conventions live in `conventions/phaedra.md`. Generic rules say "follow the project's existing choice; for new projects default to …":
  - **Forms:** React Hook Form + Zod for new React/Next/RN code. Keep Formik + Yup where a project already uses them. Angular uses Signal Forms.
  - **Validation:** a Standard Schema library (Zod by default; Valibot or ArkType are fine).
  - **Exports:** use whatever the framework requires (Next.js route files, Expo Router screens). Otherwise follow the project. The house overlay keeps "component folder with `index.tsx` default export, `styles.ts`, `types.ts`".
  - **Formatting:** follow the project's Prettier/ESLint/Biome config. With no config, use Prettier defaults.
  - **Comments:** don't add explanatory comments. Don't remove existing comments outside the lines you change.
  - **State:** TanStack Query for server state. Zustand for client state in new projects; Redux Toolkit where it already exists.
  - **Postgres naming:** snake_case for new schemas. Respect existing camelCase schemas.
  - **Test IDs:** add `data-testid` to interactive elements. Unit tests query by role/label first; E2E uses test IDs.
- **Alternatives considered:**
  - Bake house style into every generic rule. Simpler for Phaedra, unusable for anyone else.
  - Formik + Yup as the default everywhere. Matches older projects, but RHF + a Standard Schema library is the current mainstream.
  - Standard.js (no semicolons) formatting. Rejected in favour of the project's own formatter, falling back to Prettier defaults.
  - Quoted camelCase Postgres columns. Rejected for new schemas; quoting is error-prone.
- **Consequences:** Generic rules stay neutral and defer to the project. Teams opt in to the overlay.
- **Reference:** [ROADMAP §12, item 4](../ROADMAP.md#12-decisions-needed)

## D5. Legacy priority: pack 1 first

- **Status:** Accepted, 2026-10-29
- **Context:** Client projects run older stacks that the modern rules don't fit. We can't cover every legacy stack at once.
- **Decision:** Build legacy pack 1 first: AngularJS, CRA/class components, Vue 2/Nuxt 2–3, Express 4, Node ≤ 20, PHP ≤ 8.2/Laravel ≤ 11, Django ≤ 4.2/Python 3.10, jQuery. Then pack 2.
- **Alternatives considered:**
  - Inventory every client stack first and order strictly by usage. More precise, but delays all legacy work.
  - Write legacy rules only on demand. Cheapest, but leaves agents applying modern rules to old code.
- **Consequences:** Re-check the order against the actual client inventory when it exists.
- **Reference:** [ROADMAP §12, item 5](../ROADMAP.md#12-decisions-needed)

## D6. Owners: placeholder team

- **Status:** Accepted, 2026-10-29
- **Context:** Every file needs an owner (ROADMAP §10), but per-stack owners aren't assigned yet.
- **Decision:** Use the placeholder `@Phaedra-Solutions/maintainers` everywhere (frontmatter `owner`, `CODEOWNERS`). The team replaces it later.
- **Alternatives considered:**
  - Name individual owners now. Blocks the work on staffing decisions.
  - No owners. Breaks the governance model and the freshness bot.
- **Consequences:** A later change must replace the placeholder in `CODEOWNERS` and in rule frontmatter.
- **Reference:** [ROADMAP §12, item 6](../ROADMAP.md#12-decisions-needed)

## D7. Evals: promptfoo, run locally or on demand

- **Status:** Accepted, 2026-10-29
- **Context:** Evals show whether a rule actually changes agent behaviour, but model calls cost money and need API keys.
- **Decision:** Use promptfoo. Run evals locally or by manual `workflow_dispatch`. No paid model calls in pull-request CI by default.
- **Alternatives considered:**
  - Run evals on every PR. Catches regressions sooner, but costs money and exposes secrets to PR workflows.
  - No evals. Free, but no evidence that rules work.
- **Consequences:** Contributors attach eval results to PRs that change behaviour. Pick models to match what the team uses in Cursor.
- **Reference:** [ROADMAP §12, item 7](../ROADMAP.md#12-decisions-needed)

## D8. Distribution: clone and install script

- **Status:** Accepted, 2026-10-29
- **Context:** Consumers need a way to copy the built rules into their projects.
- **Decision:** Clone the repo and run the install script. No npm package.
- **Alternatives considered:**
  - npm package. Easier updates, but adds a supply-chain surface; it would need trusted publishing with provenance.
  - Copy files by hand. No tooling, but error-prone and hard to update.
- **Consequences:** `scripts/install.mjs` must be zero-dependency and safe to read before running.
- **Reference:** [ROADMAP §12, item 8](../ROADMAP.md#12-decisions-needed)
