---
id: frontend/example
title: Example framework
description: Example stack rule used by the lint tests. Use when editing src/**/*.ts.
applies_to: "example >=2.0 <3"          # "any" for core rules
globs: ["src/**/*.{ts,tsx}", "example.config.*"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-01
sources:
  - https://example.com/releases
  - https://example.com/security
---

# Example framework

## Version check

Read the installed version from the lockfile.

## Conventions

- Follow the{{U+200B}} project.

## Security

- See `core/example-core`.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed |
|---|---|---|
| EXAMPLE-1 | < 2.1 | 2.1 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Add tests.

## Before you finish

- Run `npm test`.
