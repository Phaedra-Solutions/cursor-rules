# Prompt 33: Legacy pack 2a: Java/Spring Boot, Struts, .NET 8/9, .NET Framework

> Self-contained; safe in a fresh session. Roadmap: Phase 4, §8.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it (legacy rules need `## Migration path`).
2. Read `ROADMAP.md` §8.1 and §8.2. If `rules/core/legacy-mode.md` exists, read it and follow it.
3. Research:
   - Spring Boot OSS and commercial support dates; OpenRewrite recipes for Boot 2 → 3 → 4 and javax → jakarta;
   - Java vendor support dates;
   - Struts 1/2 status and CVEs;
   - .NET support dates (8 and 9 end of support), the upgrade tooling (GitHub Copilot modernization, its current status and cost), CoreWCF;
   - .NET Framework support policy and known CVEs.

## Task
1. **`rules/legacy/java-spring-boot-legacy.md`:** Java 8/11/17 and Spring Boot 2.x/3.x.
2. **`rules/legacy/struts.md`:** Struts 1 and 2; containment (WAF, input filtering, isolating the component) and replacement strategy.
3. **`rules/legacy/dotnet-8-9.md`:** projects on .NET 8 or 9 approaching or past end of support.
4. **`rules/legacy/dotnet-framework.md`:** .NET Framework 4.x, Web Forms, WCF, ASMX.
5. Skills:
   - **`skills/upgrade-spring-boot/SKILL.md`** (with OpenRewrite)
   - **`skills/migrate-struts/SKILL.md`**
   - **`skills/upgrade-dotnet/SKILL.md`** (retarget TFM, check package compatibility, verify)
   - **`skills/migrate-dotnet-framework/SKILL.md`** (assessment, incremental/strangler approach, CoreWCF, verify)

## Done when
All eight files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
