---
id: backend/graphql
title: GraphQL APIs
description: GraphQL servers (Apollo Server 5, GraphQL Yoga 6, graphql-js 17 and other runtimes) - schema design and error contracts, authorization in every resolver or field, depth, complexity, alias and batch limits, introspection and field suggestions off or restricted in production, persisted operations, DataLoader against N+1, input validation, CSRF prevention for GET and simple requests, upload and subscription safety, and Apollo Server advisories. Use when editing GraphQL schemas, resolvers or server setup.
applies_to: "any"
globs: ["**/*.graphql", "**/*.gql", "**/schema.*", "**/resolvers/**"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://graphql.org/learn/security/
  - https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
  - https://www.apollographql.com/docs/apollo-server/api/apollo-server
  - https://www.apollographql.com/docs/apollo-server/security/cors
  - https://www.apollographql.com/docs/apollo-server/performance/apq
  - https://the-guild.dev/graphql/yoga-server/docs/prepare-for-production
  - https://the-guild.dev/graphql/yoga-server/docs/features/persisted-operations
  - https://the-guild.dev/graphql/envelop/docs/guides/securing-your-graphql-api
  - https://github.com/Escape-Technologies/graphql-armor
  - https://www.npmjs.com/package/graphql
  - https://osv.dev/vulnerability/GHSA-mp6q-xf9x-fwf7
  - https://osv.dev/vulnerability/GHSA-9q82-xgwf-vj6h
---

# GraphQL APIs

Generic API security is in `core/security-baseline`. NestJS GraphQL also applies `backend/nestjs`; language rules apply to resolver code.

## Version check

- Read the server and libraries from the lockfile (`@apollo/server`, `graphql-yoga`, `graphql`, `@escape.tech/graphql-armor`, `dataloader`, `@graphql-codegen/*`), or the non-JS equivalent (Strawberry, graphql-java, Hot Chocolate, gqlgen), and state them:

  ```text
  Applying backend/graphql (@apollo/server 5.5.1, graphql 17.0.2, graphql-armor 3.2, code-first schema).
  ```

- Current (Oct 2026): Apollo Server 5.5.1 (Node ≥ 20), GraphQL Yoga 6.0.1 (Node ≥ 22.15), graphql-js 17.0.2. Apollo Server 3 is unsupported and 4.x below 4.13.0 is affected by CVE-2026-23897; follow `core/legacy-mode` and upgrade.

## Conventions

- Schema-first SDL or code-first, as the project does; generate TypeScript types (GraphQL Code Generator) instead of hand-writing them.
- Name mutations as verbs (`createOrder`) with a single `input` argument and a payload type; return domain errors as typed union results or `errors` in the payload for expected failures, and GraphQL errors (with `extensions.code`) for unexpected ones.
- Pagination with connections (`first`/`after`) and a capped `first` (for example ≤ 100).
- Resolvers are thin: call services that enforce rules; no database access in schema directives.
- Use DataLoader (per request) for relations to avoid N+1 queries; never share loaders across requests (cross-user cache leaks).
- Mask internal errors: in production, return generic messages (`maskedErrors` in Yoga, `formatError` / `includeStacktraceInErrorResponses: false` in Apollo).

## Security

- **Authorization in every resolver or field**, not only at the gateway: check the current user against the parent object (`order.ownerId === ctx.user.id`) and on every field that exposes sensitive data. A directive (`@auth`) or schema-level rule set (graphql-shield, Envelop auth plugins) is fine if it covers every field, deny by default.
- **Query cost limits:** enforce maximum depth, aliases, directives, tokens and cost/complexity per operation (graphql-armor, `graphql-depth-limit`, Yoga/Envelop plugins, Apollo's cost analysis); limit batched operations per request; set a request timeout.
- **Introspection and suggestions:** disable introspection and "did you mean" field suggestions in production for private APIs (Apollo `introspection: false`; Yoga `useDisableIntrospection`, graphql-armor `blockFieldSuggestions`). Public APIs may keep introspection on deliberately.
- **Persisted operations:** for first-party clients, accept only registered (trusted) documents in production; automatic persisted queries alone are a cache, not a security control.
- **CSRF:** keep Apollo Server's CSRF prevention on (it rejects simple requests without a preflight-triggering header); don't allow mutations over GET; with cookie auth, require a custom header or token.
- **Input validation:** validate scalars (custom scalars for emails, URLs, dates) and input sizes; reject oversized documents and variables.
- **Uploads:** avoid multipart GraphQL uploads unless needed; if used, enforce size and type limits and CSRF protection.
- **Subscriptions:** authenticate the WebSocket connection (`graphql-ws` `onConnect`) and authorize each subscription event, not just the initial subscribe.
- **Federation and gateways:** subgraphs must not trust headers from clients; only the router may set identity headers, and subgraphs should reject direct traffic.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2026-23897: DoS with `startStandaloneServer` | @apollo/server 4.2.0–4.12.x, 5.0–5.3.x (3.x unfixed) | 4.13.0 / 5.4.0 |
| GHSA-9q82-xgwf-vj6h: browser bug enables XS-Search bypass of CSRF prevention (read-only) | @apollo/server < 5.5.0 (3.x unfixed) | 5.5.0 |

No current OSV advisories for `graphql` (graphql-js) or `graphql-yoga`. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Execute operations against the schema in tests (`server.executeOperation` in Apollo, Yoga's `fetch`): unauthorized users get errors or nulls for protected fields; another user's objects are not readable through nested paths.
- Tests that deep, aliased and batched queries above the limits are rejected, and that introspection is off in the production configuration.
- Count database queries for list resolvers to catch N+1 regressions.

## Before you finish

```sh
npx graphql-codegen --check              # if codegen is used (generated types up to date)
npx tsc --noEmit
npm test
npm audit --audit-level=moderate
npm ls @apollo/server graphql-yoga graphql 2>/dev/null
```
