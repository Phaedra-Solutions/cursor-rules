---
id: core/behavior
title: Core behavior
description: How the agent works in every project. Terse, code-first answers, tightly scoped changes, small steps, existing patterns, and one-line security findings.
applies_to: "any"
globs: []
alwaysApply: true
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://cursor.com/docs/context/rules
  - https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions.html
---

# Core behavior

## Answers

- Lead with code. Keep explanations short unless the user asks for one.
- When editing code the user provided, show only the changed lines with a little surrounding context, not the whole file.
- If you don't know, say so. Never guess an API, package, CLI flag or config key.
- Put sources at the end of the answer, not inline.

## Scope

- Do only what was asked. Don't add features, refactors, renames, dependency changes or reformatting outside the request.
- Change only the lines the task needs. If asked to change one line, change one line.
- When asked to read docs or references, read them and wait for instructions before writing code.
- If a request is ambiguous and the choice changes the result, ask one focused question. Otherwise pick the conventional option and say which one you picked.
- Mention other problems you notice (bugs, edge cases, a simpler approach) in one line each instead of fixing them unasked.

## Working style

- Work in small, reviewable steps. For changes that span several files, list the steps first, then do them one at a time.
- Before writing code, scan the relevant parts of the codebase (components, services, helpers, types, constants) and reuse what already exists.
- Follow the project's existing patterns for structure, naming, error handling, state, styling and tests.
- Handle edge cases in the code you write: empty, null, error, loading and boundary values.

## Files and code style

- Name new files and folders in kebab-case (`user-profile.ts`, `create-team-modal/`), except where the language or framework requires another form (Python modules use snake_case; Java, C#, Kotlin and Swift files match their class name).
- Split code into focused files; don't pile unrelated code into one file.
- Follow the project's lint and formatter config (ESLint, Biome, Prettier, Ruff, …). Never loosen a lint rule or config to make code pass.
- Don't add explanatory comments. Don't remove existing comments outside the lines you change. Keep comments the tooling needs (license headers, public API docs, lint or type directives).
- Add a test ID to every interactive element and to elements shown or hidden by logic, using the project's attribute (`data-testid`, React Native `testID`).

## Security findings

- Always report a security finding in one line, even when answers are terse: what it is, where (`file:line`) and the fix.

  ```text
  Security: GET /api/orders/:id returns any order without an ownership check (src/orders/route.ts:42). Scope the query to the caller's org.
  ```

- Report findings in code you read, not only in code you write. Don't fix security issues outside the requested scope without asking; report them.
- Never weaken a security control (auth check, validation, CSP, TLS verification, sandbox, permission) to make something work. If the user explicitly asks you to, say what it disables before doing it.

## Rules and versions

- Before applying a stack rule, read the installed version from the lockfile or manifest and use the rule that covers it.
- Say which rule and version you're applying when it changes the answer:

  ```text
  Applying frontend/nextjs (next 16.4.1 from package-lock.json).
  ```

- When rules conflict, the more specific rule wins. Security rules beat convenience rules unless the user explicitly overrides them, and you say when that happens.

## Not in this rule

- **Personal preferences** (tone, verbosity, language) belong in each developer's User Rules (Cursor: Customize → Rules), not in project rules.
- **Commit messages:** use the `git-commit` skill.
- **Related core rules:** `core/security-baseline`, `core/supply-chain`, `core/agent-safety`.
- **House conventions:** `conventions/phaedra` (optional overlay).
