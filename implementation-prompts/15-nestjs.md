# Prompt 15: NestJS (three rules + upgrade skill)

> Self-contained; safe in a fresh session. Roadmap: Phase 2, §7 (`backend/nestjs`), §5.8.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it. Note §6: no client identifiers.
2. Read the `ROADMAP.md` §7 entry `backend/nestjs` and the NestJS row of §5.8.
3. Use the root `nestjs-rules.md` as source material if it still has content. It's 651 lines; split it.
4. Research:
   - the latest NestJS version and v12 changes (ESM, Standard Schema validation, `nest upgrade`, Vitest/oxlint, `@nestjs/observe`, the Node requirements);
   - BullMQ with NestJS; microservice transport security options (TLS support per transport);
   - NestJS CVEs.

## Task
1. **`rules/backend/nestjs.md`** (core NestJS):
   - tier P0; globs `src/**/*.module.ts`, `src/**/*.controller.ts`, `src/**/*.service.ts`, `src/**/*.guard.ts`, `src/**/*.dto.ts`, `nest-cli.json`;
   - `legacy_rule: legacy/nestjs-legacy`;
   - module layout, controller and service patterns (with consistent method names);
   - validation, global guards, serialization, HTTP hardening, error handling, path aliases.
2. **`rules/backend/nestjs-microservices.md`:**
   - transports, and their security (TCP is plaintext);
   - ClientProxy patterns; message validation;
   - real-time updates through a pub/sub service (generic, not vendor-specific);
   - BullMQ queues whose processors rethrow so retries work.
3. **`rules/backend/nestjs-data.md`:** Sequelize, TypeORM and Prisma variants:
   - the transaction pattern; query helpers; no raw SQL with user input;
   - pagination; N+1 avoidance.
4. **`rules/legacy/nestjs-legacy.md`:**
   - NestJS ≤ 11 and Bull;
   - safe-maintenance rules, known CVEs (devtools-integration), migration path.
5. **`skills/upgrade-nestjs/SKILL.md`:** `nest upgrade` or a manual upgrade one major at a time; the ESM considerations; Bull → BullMQ; verification.

Keep each rule under 300 lines. Generalize every client-specific scope and service name.

## Done when
All five files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
