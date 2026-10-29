---
id: languages/typescript
title: TypeScript
description: TypeScript 6 and 7 conventions, strictness, boundary validation and TS 7 native-compiler compatibility. Use when editing .ts, .tsx, .mts or .cts files.
applies_to: "typescript >=6.0 <8"
globs: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
  - https://www.typescriptlang.org/tsconfig/
  - https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - https://standardschema.dev/
  - https://zod.dev/
  - https://github.com/microsoft/TypeScript/issues/62200
  - https://github.com/microsoft/TypeScript/pull/62669
---

# TypeScript

## Version check

- Read the installed `typescript` version from the lockfile (also check for `@typescript/native` and `@typescript/typescript6` aliases in `package.json`).
- 7.x: the native (Go) compiler. 6.x: the last JavaScript-based compiler; same rules, but deprecated options still only warn.
- Below 6.0: follow `core/legacy-mode`; don't use TS 6/7 defaults or syntax, and propose the upgrade separately.

## Conventions

- Keep `strict: true` (the default since TS 6/7) and add `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in new projects. Never loosen a strictness flag to make code compile.
- No `any`. Use `unknown` and narrow (`typeof`, `in`, `instanceof`, discriminants, type predicates). An unavoidable `any` gets a one-line justification in review, not in a code comment.
- No non-null assertions (`!`) or `as` casts to silence errors. Narrow instead; cast only at a validated boundary.
- Model state with discriminated unions (`{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'ok'; data: T }`), not optional-field soup.
- Use `satisfies` to check config and lookup objects without widening them; use `as const` for literal tables.
- Use `import type` / `export type` for type-only imports (`verbatimModuleSyntax: true` in new projects).
- Prefer `type` aliases and interfaces consistently with the project; don't mix styles in one file.
- Exhaustive `switch` on unions ends with a `never` check.
- Name files and folders in kebab-case (see `core/behavior`).

## Modules and config

- ESM first: `"type": "module"`, `module: "esnext"` or `"preserve"` with a bundler, `"nodenext"` for Node packages. `moduleResolution` is `"bundler"` or `"nodenext"`.
- TS 7 makes these hard errors; replace them before upgrading: `target: "es5"`, `moduleResolution: "node"`/`"node10"`/`"classic"`, `module: "amd" | "umd" | "system" | "none"`, `baseUrl`, `esModuleInterop: false`, `downlevelIteration`.
- Set `paths` relative to the tsconfig file instead of `baseUrl`.
- TS 7 defaults to `types: []`; list needed globals explicitly (`"types": ["node", "vite/client"]`). It also defaults `rootDir` to `./`, so set `rootDir` when sources live in `src/`.

## TypeScript 7 native compiler

- `tsc` from `typescript@7` type-checks about 10x faster, but 7.0 has no programmatic API (planned for 7.1).
- Before upgrading, check every tool that imports the `typescript` package: typescript-eslint, ts-morph, ts-jest, custom transformers, some bundler plugins, framework CLIs.
- If any of them need the API, keep it working with the official side-by-side setup:

  ```json
  {
    "devDependencies": {
      "@typescript/native": "npm:typescript@^7.0.2",
      "typescript": "npm:@typescript/typescript6@^6.0.2"
    }
  }
  ```

- Run the TS 7 `tsc --noEmit` in CI as the type-check. Don't remove type-checking because the bundler strips types.

## Validation at boundaries

- Types don't exist at runtime. Validate every untrusted input with a Standard Schema library (Zod by default; Valibot or ArkType if the project uses them): HTTP bodies and params, responses from other services, `process.env`/`import.meta.env`, `localStorage`, URL params, message queues, file contents and LLM output.
- Infer types from the schema (`z.infer<typeof Schema>`) instead of writing them twice.
- Parse once at the edge and pass typed values inward; never re-cast unvalidated data with `as`.
- Validate environment variables at startup and fail fast.

```ts
// ✗ trusts the payload
const user = (await res.json()) as User

// ✓ validated at the boundary
const User = z.object({ id: z.string().uuid(), email: z.string().email() })
const user = User.parse(await res.json())
```

## Do / Don't

- ✓ `unknown` + narrowing; ✗ `any`, `@ts-ignore`. Use `@ts-expect-error` with a reason only in tests or for a known upstream type bug.
- ✓ `Record<string, T>` with `noUncheckedIndexedAccess`; ✗ assuming an index lookup is defined.
- ✓ `readonly` arrays and properties for data you don't mutate.
- ✗ `enum` in new code; use union types or `as const` objects (they erase cleanly and work with `isolatedModules`).
- ✗ Default exports in shared libraries unless the framework requires them (see `conventions/phaedra` for the house component layout).

## Security

- See `core/security-baseline`. TypeScript-specific points:
  - Treat `JSON.parse`, `res.json()` and `structuredClone` of external data as `unknown` until validated.
  - Guard against prototype pollution when merging untrusted objects: validate with a schema, use `Object.create(null)` or `Map` for dictionaries keyed by user input, and reject `__proto__`, `constructor` and `prototype` keys.
  - Never build code from strings (`eval`, `new Function`) or regexes from unescaped user input.
- Types for third-party packages (`@types/*`) are dependencies too; vet them with the `dependency-vet` skill.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed |
|---|---|---|
| None for the `typescript` compiler package in OSV | — | — |

The risk sits in tooling around the compiler (bundlers, dev servers, loaders); see the framework rule for those. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Type-check in CI (`tsc --noEmit`, or the framework's check command) on every pull request.
- Test runtime validation with invalid inputs, not only happy paths.
- Use `expectTypeOf` (Vitest) or `tsd` for public library types when the project already does.

## Before you finish

```sh
npx tsc --noEmit                 # or the project's typecheck script
npm run lint                     # ESLint or Biome, per the project
npm test
npm audit --audit-level=moderate # or pnpm audit / yarn npm audit / bun audit
```
