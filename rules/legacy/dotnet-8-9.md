---
id: legacy/dotnet-8-9
title: .NET 8 and .NET 9 near end of support
description: Projects targeting net8.0 (LTS) or net9.0 (STS), which both end support on 10 Nov 2026, and older .NET (Core) 3.1-7 - the last servicing releases (8.0.32 and 9.0.21 as of Oct 2026, with a final Patch Tuesday update expected on 10 Nov), what end of support means (no security fixes for runtime, ASP.NET Core or EF Core), patching the runtime and container images until then, package and TFM compatibility, keeping code on the installed language version, and the migration path to .NET 10 LTS with the upgrade-dotnet skill. Use when a project targets net8.0, net9.0 or an older .NET (Core) TFM.
applies_to: "nuget:Microsoft.NETCore.App.Ref >=3.0 <10"
globs: ["*.csproj", "**/*.csproj", "*.fsproj", "**/*.fsproj", "*.vbproj", "**/*.vbproj", "global.json", "Directory.Build.props", "Directory.Packages.props", "**/Dockerfile*"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://endoflife.date/dotnet
  - https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core
  - https://learn.microsoft.com/en-us/dotnet/core/compatibility/9.0
  - https://learn.microsoft.com/en-us/dotnet/core/compatibility/10.0
  - https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview
  - https://learn.microsoft.com/en-us/dotnet/core/porting/upgrade-assistant-overview
  - https://learn.microsoft.com/en-us/dotnet/core/porting/github-copilot-app-modernization/overview
  - https://learn.microsoft.com/en-us/dotnet/core/porting/github-copilot-app-modernization/faq
---

# .NET 8 and .NET 9 near end of support

Also apply `core/legacy-mode`, `languages/csharp` and, for web apps, `backend/aspnet-core` (its Security section applies to 8 and 9). .NET Framework 4.x is in `legacy/dotnet-framework`. Don't retarget as part of an unrelated task.

## Version check

- Read `TargetFramework(s)` in every project and `Directory.Build.props`, the SDK in `global.json` (and `rollForward`), the runtime in Dockerfiles (`mcr.microsoft.com/dotnet/aspnet:8.0`) or the hosting plan, and package versions. State them:

  ```text
  Applying legacy/dotnet-8-9 (net8.0, SDK 8.0.4xx via global.json, runtime image aspnet:8.0, EF Core 8, ends 10 Nov 2026).
  ```

- **Status (Oct 2026):**
  - **.NET 8 (LTS)** and **.NET 9 (STS)** both **end support on 10 Nov 2026**. Latest servicing: **8.0.32** and **9.0.21** (13 Oct 2026); the 10 Nov 2026 Patch Tuesday release is expected to be the last.
  - **.NET 7** (May 2024), **.NET 6** (Nov 2024), **.NET 5** and **.NET Core 3.1** are already out of support.
  - **.NET 10 LTS** (supported to Nov 2028) is the target; **.NET 11 (STS)** ships on 10 Nov 2026.
- After end of support, Microsoft ships no fixes for the runtime, ASP.NET Core, EF Core or the official container image tags of that version. Say so in every change summary.

## Conventions

- Write code for the installed TFM and `LangVersion` (C# 12 on net8.0, C# 13 on net9.0): no C# 14 features (`field` keyword, extension members), no .NET 10 APIs.
- Packages: stay within the major that matches the TFM for platform packages (`Microsoft.AspNetCore.*`, `Microsoft.EntityFrameworkCore.*`, `Microsoft.Extensions.*` 8.x on net8.0); third-party packages must support the TFM.
- Multi-targeting (`net8.0;net10.0`) is a valid bridge for libraries; apps target one TFM.
- Keep `global.json` pinned to a patched SDK band with `rollForward: latestPatch` or `latestFeature`.

## Security

- Patch monthly: update the runtime and SDK to the latest servicing release (8.0.32 / 9.0.21 now), rebuild container images from the patched tag, and redeploy. Self-contained and framework-dependent apps both need it.
- Enable NuGet audit (on by default since the .NET 8 SDK) with `NuGetAuditMode` `all` so transitive packages are checked; fix high and critical findings.
- **After end of support:** new runtime CVEs stay unfixed. Compensating controls while the migration finishes:
  - put the app behind a reverse proxy or gateway that enforces request size limits, header limits and HTTP/2 settings;
  - keep Kestrel off the public internet where possible; restrict admin and diagnostic endpoints (`/metrics`, Swagger, health details) to the internal network;
  - remove unused features (SignalR hubs, gRPC endpoints, BinaryFormatter compat shims) to shrink the attack surface;
  - track each monthly .NET 10 security advisory and assess whether it also affects the unsupported version.
- Hosting platforms (App Service, Functions, container base images) drop EOL runtimes on their own schedules; check them before Nov 2026.

## Known vulnerabilities

- Each Patch Tuesday fixes runtime and ASP.NET Core issues in all supported versions; Oct 2026 (8.0.32, 9.0.21, 10.0.13) included security-feature bypasses CVE-2026-88092 and CVE-2026-70183 plus DoS fixes. Kestrel request smuggling CVE-2025-55315 (CVSS 9.9) needed 8.0.21 / 9.0.10 or later.
- After 10 Nov 2026, assume new runtime CVEs affect 8 and 9 with no fix.

This list goes stale; verify with the `cve-check` skill, the .NET release notes and GitHub security advisories (dotnet/announcements) before relying on it.

## Migration path

1. Patch to the latest 8.0.x / 9.0.x runtime and SDK; fix warnings and obsolete-API warnings (`SYSLIB` diagnostics).
2. Retarget to **net10.0** with the `upgrade-dotnet` skill: update `global.json`, `TargetFramework`, platform packages to 10.x, and third-party packages to versions that support net10.0; read the 9.0 and 10.0 breaking-change lists (the 9.0 list applies when coming from 8).
3. Update container base images (`mcr.microsoft.com/dotnet/aspnet:10.0`), CI SDKs and hosting configuration.
4. Tooling: retargeting is usually manual and small. The .NET Upgrade Assistant is deprecated; its replacement, **GitHub Copilot upgrade** (Visual Studio 2022 17.14.16+ / 2026, VS Code, Copilot CLI), needs a GitHub Copilot subscription and sends code to Copilot models. Ask the user before using it.
5. From .NET 6/7 or Core 3.1, go straight to net10.0 but read every breaking-change list in between.

## Testing

- Run unit, integration and API tests on the new TFM; for web apps, smoke-test auth, serialization (System.Text.Json defaults change between majors) and EF Core queries and migrations.
- Compare startup logs and OpenAPI output before and after retargeting.

## Before you finish

```sh
dotnet --info                                   # SDKs and runtimes in use
dotnet list package --vulnerable --include-transitive
dotnet list package --outdated
dotnet build -warnaserror && dotnet test
```
