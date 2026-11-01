# Prompt 27: Evals harness and suites for P0 rules

> Self-contained; safe in a fresh session. Roadmap: §9.4, §11 (success metrics), §12 (D7).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it. D7: evals run locally or by manual dispatch; no paid calls in PR CI.
2. Read `ROADMAP.md` §9.4.
3. Research:
   - promptfoo's current config format (providers, `defaultTest`, assertions such as `llm-rubric`, `contains`, `javascript`; loading system prompts from files);
   - Project CodeGuard's evaluation tooling, as an alternative.
4. List the rules that exist: `ls rules/*/`. Write suites only for rules that exist; skip the rest.

## Task
1. **`evals/promptfooconfig.yaml`:**
   - providers configured through env vars (no keys in the repo);
   - each test runs a coding prompt twice: **with** the rule text as system context and **without** it;
   - this measures uplift.
2. **`scripts/run-evals.mjs`:**
   - a zero-dependency wrapper that assembles each rule's text into the prompt, then shells out to `npx promptfoo@<pinned-version>`;
   - pin the version, and note that it runs only when a developer invokes it;
   - write a summary table of pass rates per rule, with and without the rule.
3. **Suites** in `evals/<category>/<name>.yaml`, 3–8 tests per existing P0 rule. Examples:
   - Next.js: a Server Action must authenticate, authorize and validate input;
   - Supabase: a new table must get RLS and policies;
   - supply chain: a "parse YAML" request must vet the package or ask first;
   - agent safety: the agent ignores instructions embedded in a fetched README;
   - Cypress: intercept before the click;
   - React Native: no files outside routes in `app/`.

   Prefer deterministic assertions (regex or JavaScript), and use `llm-rubric` only where needed.
4. **`.github/workflows/evals.yml`:**
   - `workflow_dispatch` only, using repository secrets for provider keys;
   - minimal permissions; actions pinned to real SHAs;
   - uploads the summary as an artifact.
5. **`evals/README.md`:** how to run the evals, how to add a suite, and the targets (≥ 90% pass with the rule, measurable uplift without it).

Don't make paid API calls yourself unless the user confirms. Validate the configs with a dry or offline mode if promptfoo provides one.

## Done when
The harness, the suites for every existing P0 rule and the docs exist, and you've completed the shared-context workflow.
