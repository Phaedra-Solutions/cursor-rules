# Prompt 08: Advisory watcher, freshness bot, monthly security review

> Self-contained; safe in a fresh session. Roadmap: §5.8, §9.3, §10.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §5.8, §9.3 and §10.

## Task
1. **`security/watchlist.yml`:**
   - seed it from the §5.8 table: ecosystem, package, the version range we document, the advisory IDs we already cite, and the rule IDs that mention it;
   - re-verify each entry, and add any newer critical advisories you find for the same stacks.
2. **`scripts/check-advisories.mjs`** (Node ≥ 22, zero dependencies):
   - query the OSV API (`POST https://api.osv.dev/v1/querybatch`) for every watchlist package, using the minimum version we document as safe;
   - report advisories that aren't in the watchlist, with severity and the CISA KEV flag (KEV JSON feed);
   - with `--create-issues`, open one GitHub issue per new advisory via `gh issue create` and skip duplicates (search open issues for the advisory ID first);
   - add a `--dry-run` mode.
3. **`scripts/check-freshness.mjs`** (zero dependencies):
   - read each rule's `applies_to` (format `"<package> >=X <Y"`);
   - look up the latest version on npm (`registry.npmjs.org/<pkg>/latest`), PyPI (`pypi.org/pypi/<pkg>/json`) and Maven Central, plus the endoflife.date API for runtimes;
   - flag rules whose upper bound is below the latest major, and rules whose `last_reviewed` is older than 90 days;
   - `--create-issues` and `--dry-run` work as in the advisory script.
4. **Workflows** (pin every action to a real full SHA, looked up; minimal permissions):
   - `.github/workflows/advisories.yml`: daily at 06:00 UTC plus `workflow_dispatch`, with `issues: write`;
   - `.github/workflows/freshness.yml`: weekly on Monday plus `workflow_dispatch`;
   - `.github/workflows/monthly-review.yml`: on the 1st of each month, opens a "Monthly security review YYYY-MM" issue with the §10 checklist.
5. Write `node:test` tests for the parsing logic, with mocked fetch, and run them.
6. Run both scripts with `--dry-run` once and paste the summary into your report.

## Done when
The scripts and tests work, the workflows are valid with real SHAs, the dry-run output is sensible, and you've completed the shared-context workflow.
