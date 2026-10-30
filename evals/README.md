# Evals

These suites check whether a rule actually changes what a coding agent writes. Each test runs the same coding task twice against each model: **with** the rule as system context and **without** it. The difference is the rule's uplift.

## Layout

```text
evals/
├── promptfooconfig.yaml      # example config for one suite (frontend/nextjs)
├── prompts.cjs               # the with-rule and without-rule prompt functions
└── <category>/<name>.yaml    # tests for rules/<category>/<name>.md
```

`scripts/run-evals.mjs` finds every suite, loads the matching rule (without its frontmatter), writes a promptfoo config per suite to `dist/evals/`, runs promptfoo, and writes `dist/evals/summary.md` and `summary.json`.

## Running

Evals make paid model calls, so they never run in pull-request CI (decision D7). Run them locally or through the manual **Evals** workflow.

```sh
export ANTHROPIC_API_KEY=...                       # or OPENAI_API_KEY; never commit keys
node scripts/run-evals.mjs --dry-run               # write configs only; no model calls
node scripts/run-evals.mjs --validate              # promptfoo schema validation; no model calls
node scripts/run-evals.mjs --rule frontend/nextjs  # one suite
node scripts/run-evals.mjs                         # every suite
node scripts/run-evals.mjs --providers anthropic:messages:claude-opus-5,openai:<model-id>
```

- `EVAL_PROVIDERS` (comma-separated promptfoo provider IDs) sets the models when `--providers` isn't given. The default is `anthropic:messages:claude-opus-5`.
- The wrapper runs a pinned promptfoo (`PROMPTFOO_VERSION` in `scripts/run-evals.mjs`) through `npx`. Updating the pin is a dependency change: follow `core/supply-chain` (release-age cooldown, changelog review).
- `--validate` and real runs download promptfoo on first use; `--dry-run` needs nothing but Node.

The **Evals** workflow (`.github/workflows/evals.yml`) is `workflow_dispatch` only. It reads provider keys from secrets in an `evals` environment (create the environment and restrict who can run it), and uploads the summary as an artifact.

## Writing a suite

1. Create `evals/<category>/<name>.yaml` for an existing `rules/<category>/<name>.md`.
2. Add 3–8 tests. Each test is a promptfoo test case:

   ```yaml
   - description: nextjs - delete Server Action authenticates, authorizes and validates
     vars:
       task: |
         Next.js 16 App Router with Prisma and our `auth()` helper. Add a Server Action that deletes a post.
     assert:
       - type: javascript
         value: /auth\(\)/.test(output)
       - type: javascript
         value: /(authorId|ownerId|userId)/.test(output)
   ```

3. Write a task a real user would ask, with enough context that the right answer is unambiguous (versions, libraries, the relevant snippet). Don't name the rule or hint at the expected answer in the task.
4. Prefer deterministic assertions (`javascript`, `regex`, `contains`, `not-regex`) that check for the behavior the rule requires and against the mistake it prevents. Use `llm-rubric` only when no deterministic check is possible.
5. Start descriptions with the rule name so `--filter-pattern` can select them.
6. Check locally: `node scripts/run-evals.mjs --dry-run` (structure) and `--validate` (promptfoo schema), then one real run of the suite.

## Targets

- **≥ 90%** of tests pass with the rule, per model.
- **Measurable uplift**: the with-rule pass rate is clearly higher than without it. If a test passes equally without the rule, the model already does the right thing; keep the test only if it guards a regression, and look for a harder case.
- Track results per rule and per model in the summary; a rule that shows no uplift on any model needs rewriting or removing.

Suites currently cover every P0 rule. Add suites for P1 rules as they stabilize.
