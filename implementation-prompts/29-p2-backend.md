# Prompt 29: P2 backend: Spring Boot, ASP.NET Core, Go HTTP, GraphQL, Fastify/Hono

> Self-contained; safe in a fresh session. Roadmap: Phase 4, §6 (Backend), §7 (P2 essentials table), §5.8.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §7 "P2 and P3 essentials" rows for these stacks, and the §5.8 rows for Spring Boot and ASP.NET Core.
3. Research:
   - the latest Spring Boot and Spring Security, Spring Boot's OSS support dates, Spring CVEs from 2026 onward;
   - .NET's current LTS and STS, ASP.NET Core security docs, CVE-2025-55315 and newer;
   - Go `net/http` hardening;
   - GraphQL security (depth and complexity limits, introspection);
   - the current Fastify and Hono majors.

## Task
Create these as tier P2 rules, each under 250 lines:

1. **`rules/backend/spring-boot.md`**
   - globs: `src/main/java/**`, `src/main/kotlin/**`, `application*.{yml,yaml,properties}`, `pom.xml`, `build.gradle*`
   - `legacy_rule`: `legacy/java-spring-boot-legacy`
2. **`rules/backend/aspnet-core.md`**
   - globs: `**/*.cs`, `Program.cs`, `appsettings*.json`, `*.csproj`
   - `legacy_rule`: `legacy/dotnet-8-9`
3. **`rules/backend/go-http.md`**
   - globs: `**/*.go`
4. **`rules/backend/graphql.md`**
   - globs: `**/*.graphql`, `**/*.gql`, `**/schema.*`, `**/resolvers/**`
5. **`rules/backend/fastify-hono.md`**
   - globs: files importing fastify or hono (for example `src/**/*.ts`; state that the agent should confirm the framework from `package.json`)

Each rule covers the essentials row from §7, plus conventions (project layout, error contracts, validation, configuration), testing and "before you finish" commands.

## Done when
All five rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
