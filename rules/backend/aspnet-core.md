---
id: backend/aspnet-core
title: ASP.NET Core
description: ASP.NET Core on .NET 10 LTS - support dates (.NET 8 and 9 end 10 Nov 2026; .NET 11 STS ships 10 Nov 2026), Minimal APIs or controllers with validation, a fallback authorization policy so endpoints are authenticated by default, resource-based authorization, antiforgery, EF Core parameterized queries (FromSql, never concatenated FromSqlRaw), Data Protection, ProblemDetails, options validation, rate limiting, CORS, HTTPS and HSTS, NuGet audit, and Kestrel patched (CVE-2025-55315 and the Oct 2026 fixes). Use when editing ASP.NET Core code or configuration.
applies_to: "nuget:Microsoft.AspNetCore.App.Ref >=10.0 <11"
legacy_rule: legacy/dotnet-8-9
globs: ["**/*.cs", "Program.cs", "appsettings*.json", "*.csproj", "**/*.csproj"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core
  - https://endoflife.date/dotnet
  - https://learn.microsoft.com/en-us/aspnet/core/security/authorization/secure-data
  - https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased
  - https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery
  - https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/introduction
  - https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit
  - https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api
  - https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0
  - https://learn.microsoft.com/en-us/aspnet/core/validation/overview
  - https://learn.microsoft.com/en-us/ef/core/querying/sql-queries
  - https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages
  - https://github.com/dotnet/announcements/issues
  - https://osv.dev/vulnerability/GHSA-5rrx-jjjq-q2r5
  - https://osv.dev/vulnerability/GHSA-rv87-ccxw-8ggf
  - https://osv.dev/vulnerability/GHSA-494h-xx7x-5frh
---

# ASP.NET Core

Also apply `languages/csharp`. Generic web security is in `core/security-baseline`.

## Version check

- Read `TargetFramework`, the SDK in `global.json` and the ASP.NET Core runtime version in the container image or hosting plan, and state them:

  ```text
  Applying backend/aspnet-core (net10.0, runtime 10.0.13, Minimal APIs, EF Core 10).
  ```

- **Support:** **.NET 10 LTS** to Nov 2028 is the target. **.NET 8 and .NET 9 end support on 10 Nov 2026** → `legacy/dotnet-8-9` where it exists, otherwise `core/legacy-mode`; plan the move to 10. **.NET 11 (STS)** ships on 10 Nov 2026; don't adopt previews or RCs in production.
- **Minimum safe runtime:** **10.0.13, 9.0.21, 8.0.32** (13 Oct 2026 Patch Tuesday: security-feature bypasses CVE-2026-88092, CVE-2026-70183 and several DoS fixes). Kestrel request smuggling CVE-2025-55315 (CVSS 9.9) needed 8.0.21 / 9.0.10+. Patch the runtime monthly.

## Conventions

- Minimal APIs grouped with `MapGroup` (or controllers where the project uses them); one file per feature; handlers call services; typed results (`Results<Ok<OrderDto>, NotFound>`).
- **Validation:** validate every request DTO. On .NET 10, Minimal API built-in validation (`builder.Services.AddValidation()` with DataAnnotations; call it in the assembly that defines the endpoints, since it uses a source generator) or FluentValidation; `[ApiController]` model validation for controllers. Never bind requests to EF entities (overposting); map DTOs explicitly.
- **Errors:** `AddProblemDetails()`, `UseExceptionHandler()` and `UseStatusCodePages()`; no `UseDeveloperExceptionPage` outside Development; no exception details in responses.
- **Options:** `services.AddOptions<T>().BindConfiguration("Section").ValidateDataAnnotations().ValidateOnStart()`; secrets from user secrets (dev), environment variables or Key Vault, never `appsettings.json` in the repo.
- `IHttpClientFactory` with timeouts and resilience handlers (`AddStandardResilienceHandler`); `CancellationToken` on every handler.
- Logging via `ILogger` templates; OpenTelemetry for traces and metrics.

## Security

- **Authenticated by default:** set a fallback policy so endpoints without attributes still require auth:

  ```csharp
  builder.Services.AddAuthorizationBuilder()
      .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
  ```

  Mark public endpoints with `.AllowAnonymous()` explicitly.
- **Resource-based authorization:** `IAuthorizationService.AuthorizeAsync(user, order, "OrderOwner")` or scoped queries (`db.Orders.Where(o => o.OwnerId == userId)`); roles alone don't check ownership.
- **Antiforgery:** on for cookie-authenticated forms (`AddAntiforgery`, `app.UseAntiforgery()`; Razor and Blazor forms include tokens); Minimal API form endpoints validate tokens by default on .NET 8+. Token-authenticated APIs don't need it.
- **Cookies and auth:** `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`); short-lived JWTs validated for issuer, audience, lifetime and signing key (`TokenValidationParameters`); no `ValidateIssuer = false` shortcuts.
- **Data Protection:** persist keys to a shared, protected store (Azure Blob + Key Vault, Redis, database) in multi-instance deployments, and protect them at rest.
- **EF Core:** LINQ or `FromSql($"… {param}")`/`SqlQuery` (interpolation becomes parameters); never `FromSqlRaw`/`ExecuteSqlRaw` with concatenated input; identifiers from allowlists.
- **Rate limiting:** `AddRateLimiter` with policies on login, signup, password reset and expensive endpoints; partition by user and IP (behind `UseForwardedHeaders` configured with known proxies only).
- **Transport:** `UseHttpsRedirection()` and `UseHsts()` in production; Kestrel request limits (`MaxRequestBodySize`, header limits) set deliberately; don't expose Kestrel directly to the internet without the current patch.
- **CORS:** named policies with explicit origins; never `AllowAnyOrigin()` with `AllowCredentials()`.
- **Headers:** CSP, `X-Content-Type-Options`, `Referrer-Policy` via middleware for apps that serve HTML.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed |
|---|---|---|
| CVE-2026-88092, CVE-2026-70183, CVE-2026-70188: security-feature bypasses; CVE-2026-70175 elevation of privilege (9.0); CVE-2026-70196, CVE-2026-70186, CVE-2026-96236, CVE-2026-70181 DoS | ASP.NET Core 8.0, 9.0, 10.0 | 8.0.32 / 9.0.21 / 10.0.13 |
| CVE-2026-56170: .NET DoS | 10.0 | 10.0.6 |
| CVE-2026-45591, CVE-2026-26130: DoS | 8.0, 9.0, 10.0 | 8.0.28 / 9.0.17 / 10.0.9 |
| CVE-2025-55315: Kestrel request smuggling (CVSS 9.9) | 8.0 < 8.0.21, 9.0 < 9.0.10 | 8.0.21 / 9.0.10 |

This list goes stale; verify with the `cve-check` skill, the dotnet/announcements repository or OSV (NuGet ecosystem) before relying on it.

## Testing

- `WebApplicationFactory<Program>` integration tests with a test auth handler: each endpoint returns 401 anonymous, 403 for the wrong policy, 404 for another user's resource, 400 with ProblemDetails for invalid input.
- Testcontainers for the database; no EF in-memory provider for behavior that depends on SQL.

## Before you finish

```sh
dotnet --list-runtimes | grep AspNetCore     # at or above the minimum safe runtime
dotnet build -warnaserror
dotnet test
dotnet list package --vulnerable --include-transitive
dotnet format --verify-no-changes
```
