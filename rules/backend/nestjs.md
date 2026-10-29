---
id: backend/nestjs
title: NestJS
description: NestJS 12 conventions and security (module layout, controller and service patterns, Standard Schema or class-validator validation, global guards, response serialization, built-in CSRF, security headers and cookies, throttling, config validation, error handling, ESM and path aliases). Use when editing modules, controllers, services, guards, DTOs or nest-cli.json in a NestJS 12 project.
applies_to: "@nestjs/core >=12.0 <13"
legacy_rule: legacy/nestjs-legacy
globs: ["src/**/*.module.ts", "src/**/*.controller.ts", "src/**/*.service.ts", "src/**/*.guard.ts", "src/**/*.dto.ts", "nest-cli.json"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://trilon.io/blog/nestjs-12-is-now-available
  - https://www.infoq.com/news/2026/10/nestjs-12-observability/
  - https://docs.nestjs.com/migration-guide
  - https://github.com/nestjs/nest/releases/tag/v12.1.0
  - https://github.com/nestjs/nest/issues/18247
  - https://www.npmjs.com/package/@nestjs/core
  - https://docs.nestjs.com/techniques/validation
  - https://docs.nestjs.com/techniques/serialization
  - https://docs.nestjs.com/security/csrf
  - https://docs.nestjs.com/security/helmet
  - https://docs.nestjs.com/techniques/cookies
  - https://docs.nestjs.com/security/rate-limiting
  - https://docs.nestjs.com/security/authentication
  - https://docs.nestjs.com/techniques/configuration
  - https://nodejs.org/api/packages.html#subpath-imports
  - https://osv.dev/vulnerability/GHSA-9c5c-9qcx-q35q
  - https://osv.dev/vulnerability/GHSA-6v32-fjc9-9qf6
  - https://osv.dev/vulnerability/GHSA-wf42-42fg-fg84
  - https://osv.dev/vulnerability/GHSA-r4wm-x892-vjmx
  - https://osv.dev/vulnerability/GHSA-36xv-jgw5-4q75
  - https://osv.dev/vulnerability/GHSA-85cg-cmq5-qjm7
---

# NestJS 12

Also apply `languages/typescript`. For security basics see `core/security-baseline`; this rule adds only NestJS specifics. Microservices and queues: `backend/nestjs-microservices`. Database access: `backend/nestjs-data`.

## Version check

- Read `@nestjs/core`, `@nestjs/common`, the platform package (`@nestjs/platform-express` or `@nestjs/platform-fastify`), `@nestjs/cli`, `typescript` and the Node version (`.nvmrc`, `engines`, Dockerfile, CI) from the lockfile, and state the rule you're applying:

  ```text
  Applying backend/nestjs (@nestjs/core 12.3.2, platform-fastify, CommonJS, from pnpm-lock.yaml).
  ```

- **Below 12:** use `legacy/nestjs-legacy` and offer the `upgrade-nestjs` skill. v11 still gets patches, likely until the end of 2027; v10 and older get none.
- Keep every `@nestjs/*` framework package on the same version. Minimum safe: **12.0.3** (see Known vulnerabilities). Latest: 12.3.2.
- Requirements: Node 20.19+ or 22.12+ to run (v12 packages are ESM and load in CommonJS apps through `require(esm)`); the CLI needs Node 22.22.3+, 24.15+ or 26+; TypeScript 6. Node 20 is EOL, so use 22 or 24 LTS.
- Module format: check `"type"` in `package.json` and `module` in `tsconfig.json`. Keep the project's format. Don't convert a CommonJS app to ESM as part of another task.
- Version-gated features: built-in cookies, `app.enableCsrfProtection()` and `app.useSecurityHeaders()` need 12.1+. On 12.0, use `cookie-parser`/`@fastify/cookie`, `helmet`/`@fastify/helmet` and `csrf-csrf`/`@fastify/csrf-protection`.

## Conventions

### Layout

Keep the project's layout. For new apps or new features, use:

```text
src/
├── main.ts
├── app.module.ts
├── config/                  # schema-validated configuration
├── common/                  # guards, interceptors, filters, decorators, pipes used app-wide
└── modules/
    └── orders/
        ├── dto/             # create-order.dto.ts, update-order.dto.ts, order-query.dto.ts, index.ts
        ├── helpers/         # orders-query.helper.ts, orders-format.helper.ts, index.ts (pure functions)
        ├── orders.controller.ts
        ├── orders.service.ts
        └── orders.module.ts
```

- In a Nest monorepo (`apps/*`, `libs/*`), shared code lives in a library imported as `@app/common` (the CLI default prefix). Apps never import from each other.
- One feature per module. Export only the providers other modules need. Import a feature's module; never list another feature's service in your `providers` (that creates a second instance).
- Avoid `forwardRef()`. A circular import means a shared piece belongs in its own module or an event; use `forwardRef` only when the user agrees the cycle is intended.
- File suffixes: `.module.ts`, `.controller.ts`, `.service.ts`, `.guard.ts`, `.interceptor.ts`, `.filter.ts`, `.pipe.ts`, `.dto.ts`, `.helper.ts`. Kebab-case file names, PascalCase classes.
- Keep services under ~400 lines; move query building and formatting into `helpers/`.

### Controllers and services

- Controllers handle HTTP only: parse, validate, call one service method, return its result. No business logic, no ORM calls.
- Controller and service methods share names: `create`, `findAll`, `findOne`, `update`, `remove`. Add domain verbs (`approve`, `archive`) for anything else. Pass the authenticated user as an explicit argument when the service needs it for authorization.

```ts
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser): Promise<OrderResponse> {
    return this.ordersService.create(dto, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<OrderResponse> {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderDto, @CurrentUser() user: AuthUser) {
    return this.ordersService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.ordersService.remove(id, user);
  }
}
```

- Parse route params with a pipe (`ParseIntPipe`, `ParseUUIDPipe`) or a schema. Use `PATCH` for partial updates and `PUT` only for full replacement.
- Inject with `private readonly` constructor parameters. Read config through `ConfigService`, never `process.env` inside services.
- Add OpenAPI decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) where the project uses `@nestjs/swagger`.

### Validation

- Follow the project's approach. For new code, use a Standard Schema library (Zod by default; see `conventions/phaedra`):

  ```ts
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // controller
  create(@Body({ schema: createOrderSchema }) dto: CreateOrder) {}
  ```

- `StandardSchemaValidationPipe` validates only parameters that declare a schema. Every `@Body`, `@Query` and `@Param` value a handler uses must have a schema or a class DTO; a bare `@Body() body: any` is unvalidated.
- Unknown keys: Zod `z.object()` strips them; use `z.strictObject()` to reject them on write endpoints.
- With class-validator, register `new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` globally. It validates only class-typed parameters, never interfaces or `Record<string, unknown>`. Nest nested DTOs with `@ValidateNested()` and `@Type()`.
- Both pipes can run together while a project migrates.

### Errors

- Throw Nest HTTP exceptions (`NotFoundException`, `ConflictException`, `ForbiddenException`, `UnprocessableEntityException`) from services. Pass `errorCode` in the exception options for machine-readable codes.
- Add one global exception filter that maps ORM and unknown errors to generic 4xx/5xx responses and logs the details with a request ID. Never return stack traces, SQL or driver messages.
- Return 404, not 403, when the user may not know the resource exists.

### Path aliases and ESM

- CommonJS: `tsconfig` `paths` (`@modules/*`, `@common/*`) work when the build rewrites them (the Nest CLI's builders do). ESM: Node doesn't read `tsconfig` paths, so use `package.json` `"imports"` (`#modules/*`) or relative imports, and run the built output once to prove it resolves.
- Use an alias instead of three or more `../` levels. Keep relative imports inside a feature folder.
- ESM: use `import.meta.dirname` instead of `__dirname`, and include file extensions in relative imports when `moduleResolution` is `nodenext`.

## Security

### Authentication and authorization

- Register the auth guard globally (`{ provide: APP_GUARD, useClass: JwtAuthGuard }`) and opt routes out with a `@Public()` metadata decorator. Never rely on remembering `@UseGuards()` per route.
- Read metadata with `reflector.getAllAndOverride(KEY, [context.getHandler(), context.getClass()])` so handler and class decorators both work.
- Role guards check coarse access. Check ownership or tenancy in the service, against the resource loaded from the database (`where: { id, tenantId: user.tenantId }`), not against IDs from the request.
- **Never use middleware for authentication or authorization.** Path-scoped middleware has been bypassed on Fastify five times since 2025 (trailing slashes, URL encoding, `HEAD`, absolute-form targets). Use guards.
- Verify JWTs with an explicit algorithm list, issuer and audience; keep access tokens short-lived.

### Response shaping

- Never return ORM entities directly. Return a response DTO or bind a serializer:
  - `StandardSchemaSerializerInterceptor` with `@SerializeOptions({ schema: orderResponseSchema })`, or
  - `ClassSerializerInterceptor` with `@Exclude()` on secrets (`passwordHash`, tokens, internal flags).
- Paginate list endpoints and cap `limit` (see `backend/nestjs-data`).

### HTTP hardening (`main.ts`)

- Security headers: `app.useSecurityHeaders()` on 12.1+, otherwise `helmet` (Express) or `@fastify/helmet` (Fastify).
- CORS: `app.enableCors({ origin: [allowlist], credentials: true })` from config. Never `origin: true` or `'*'` with credentials.
- Cookie-authenticated apps: `app.enableCsrfProtection({ trustedOrigins })` on 12.1+ (Fetch Metadata, runs before guards). Exclude only signature-verified webhooks. On 12.0, use `csrf-csrf` or `@fastify/csrf-protection`.
- Cookies: use the built-in `cookies: { secret }` option with `@SignedCookies()` for signed values; set `httpOnly`, `secure` and `sameSite` on session cookies.
- Rate limiting: `ThrottlerModule` with `ThrottlerGuard` as an `APP_GUARD`, stricter `@Throttle()` on login, reset and OTP routes. Behind a proxy, set `trust proxy` (Express) or `trustProxy` (Fastify) to the real hop count so limits key on the client IP.
- Body size: set limits explicitly (`app.useBodyParser('json', { limit: '1mb' })` on Express, `bodyLimit` on the Fastify adapter) and per-route for uploads. Validate upload type and size.
- Config: `ConfigModule.forRoot({ validationSchema })` with a Standard Schema (or Joi 18+) so the app fails at boot on missing or malformed secrets. No default secrets in code.
- Swagger UI: disable in production or put it behind auth.
- `@nestjs/devtools-integration`: dev only, ≥ 0.2.1, never in the production module graph.
- Server-Sent Events: on 11.x below 11.1.18, never put user input into SSE `data`, `id` or `event` fields (CVE-2026-35515).

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Affected | Fixed |
|---|---|---|---|
| GHSA-96h4-vgxj-gvm2: unbounded memory growth in the TCP transport | microservices | < 11.2.5; 12.0.0–12.0.2 | 11.2.5 / 12.0.3 |
| CVE-2026-102281 (GHSA-m8vh-jmq9-5rjg): process crash from a deeply nested message pattern | microservices | < 11.2.4; 12.0.0–12.0.1 | 11.2.4 / 12.0.2 |
| GHSA-9c5c-9qcx-q35q: path-scoped middleware bypass via absolute-form request targets | platform-fastify | < 11.2.4; 12.0.0–12.0.1 | 11.2.4 / 12.0.2 |
| CVE-2026-54281: middleware bypass via trailing slash | platform-fastify | < 11.1.24 | 11.1.24 |
| CVE-2026-33011: middleware bypass via `HEAD` requests | platform-fastify | < 11.1.16 | 11.1.16 |
| CVE-2026-2293 and CVE-2025-69211: middleware bypass via URL encoding | platform-fastify | < 11.1.14 | 11.1.14 |
| CVE-2026-35515: SSE event injection | core | < 11.1.18 | 11.1.18 |
| CVE-2025-54782: devtools CSRF to sandbox escape, RCE on the developer machine (CVSS 9.4) | devtools-integration | ≤ 0.2.0 | 0.2.1 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- New ESM projects use Vitest; CommonJS projects keep Jest. Jest loads v12 packages only on Node 24.9+ (otherwise `ERR_REQUIRE_ASYNC_MODULE`).
- Unit-test services with `Test.createTestingModule()` and mocked repositories or clients. Don't mock the service under test.
- E2E-test controllers with `supertest` (or `app.inject()` on Fastify) against the app built with the same global pipes, guards, filters and interceptors as `main.ts`; put that setup in one shared function.
- For each protected route, test: 401 without a token, 403 or 404 for another user's or tenant's resource, 400 for unknown or invalid fields, and that responses omit secret fields.
- On Fastify, add tests for `HEAD`, trailing-slash and percent-encoded variants of protected paths.

## Before you finish

```sh
npx tsc --noEmit -p tsconfig.json
npm run lint                    # oxlint or ESLint, per the project
npm test                        # vitest run / jest
npm run test:e2e                # if present
npm run build
npm run start:prod              # start the built app once, hit a health route, stop it (catches ESM and alias resolution errors)
npm audit --audit-level=moderate
npm ls @nestjs/core @nestjs/common @nestjs/microservices   # one version each, ≥ 12.0.3
```
