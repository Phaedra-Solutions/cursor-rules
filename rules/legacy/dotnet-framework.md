---
id: legacy/dotnet-framework
title: .NET Framework 4.x, Web Forms, WCF and ASMX
description: Maintaining .NET Framework 4.x applications (ASP.NET Web Forms, MVC 5, Web API 2, WCF, ASMX, Windows services) - the support policy (4.6.2 ends 12 Jan 2027; 4.7-4.8.1 follow the Windows lifecycle; 3.5 SP1 to 9 Jan 2029), monthly Windows security updates as the patch channel and the 2026 .NET Framework CVEs (deserialization and remote code execution fixes), hardening (no BinaryFormatter or NetDataContractSerializer on untrusted data, ViewState MAC and machine keys, request validation, TLS 1.2+, custom errors), packages.config hygiene, and the incremental migration path to .NET 10 with System.Web adapters, YARP, CoreWCF and GitHub Copilot upgrade. Use when a project targets net4x or uses System.Web, WCF or ASMX.
applies_to: "any"
globs: ["*.csproj", "**/*.csproj", "*.vbproj", "**/*.vbproj", "Web.config", "**/Web.config", "App.config", "**/App.config", "packages.config", "**/packages.config", "Global.asax*", "**/*.aspx", "**/*.ascx", "**/*.svc", "**/*.asmx"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://learn.microsoft.com/en-us/lifecycle/products/microsoft-net-framework
  - https://endoflife.date/dotnetfx
  - https://learn.microsoft.com/en-us/dotnet/core/porting/framework-overview
  - https://learn.microsoft.com/en-us/aspnet/core/migration/fx-to-core/
  - https://github.com/dotnet/systemweb-adapters
  - https://github.com/CoreWCF/CoreWCF
  - https://learn.microsoft.com/en-us/dotnet/core/porting/github-copilot-app-modernization/overview
  - https://learn.microsoft.com/en-us/dotnet/core/porting/github-copilot-app-modernization/faq
  - https://learn.microsoft.com/en-us/dotnet/standard/serialization/binaryformatter-security-guide
  - https://nvd.nist.gov/vuln/detail/CVE-2026-70035
  - https://nvd.nist.gov/vuln/detail/CVE-2026-70007
---

# .NET Framework 4.x, Web Forms, WCF and ASMX

Also apply `core/legacy-mode` and `languages/csharp` (language features limited to what the project's compiler and `LangVersion` allow). Modern .NET 8/9 projects are in `legacy/dotnet-8-9`. Don't migrate as part of an unrelated task.

## Version check

- Read `TargetFrameworkVersion` (old-style `.csproj`) or `TargetFramework` (`net48`, `net481`), `Web.config` `<httpRuntime targetFramework>` and `<compilation targetFramework>`, the Windows Server version, `packages.config` or `PackageReference`, and the Visual Studio/MSBuild version in CI. State them:

  ```text
  Applying legacy/dotnet-framework (net48 Web Forms + WCF services, packages.config, IIS on Windows Server 2019).
  ```

- **Support policy:**
  - **4.8.1, 4.8, 4.7.2, 4.7.1, 4.7:** supported as a component of the Windows version they're installed on (no separate end date while that Windows version is supported).
  - **4.6.2:** support ends **12 Jan 2027**; retarget to 4.8/4.8.1 now.
  - **4.5.2, 4.6, 4.6.1:** retired 26 Apr 2022; 4.0–4.5.1 retired Jan 2016.
  - **3.5 SP1:** standalone product on Windows 10 1809 / Server 2019+, supported to 9 Jan 2029.
- .NET Framework gets security fixes but no new features; the long-term target is .NET 10 LTS.

## Conventions

- Keep the project's architecture (Web Forms page lifecycle, MVC 5, WCF service contracts); write code the installed compiler accepts (often C# 7.3 by default on net4x).
- Prefer `PackageReference` over `packages.config` when touching package management, but convert in a separate change; keep binding redirects correct (`AutoGenerateBindingRedirects`).
- New, independent features go into a separate .NET 10 service where the team agrees; that's the start of the strangler path.
- Move business logic out of code-behind and `.svc` classes into plain class libraries; target `netstandard2.0` for libraries both stacks can share.

## Security

- **Patching:** .NET Framework fixes ship in the monthly Windows cumulative and .NET Framework updates; keep servers on current Patch Tuesday updates and supported Windows Server versions.
- **Deserialization:** never use `BinaryFormatter`, `NetDataContractSerializer`, `SoapFormatter`, `LosFormatter`, `ObjectStateFormatter` or `JavaScriptSerializer` with a type resolver on untrusted data; use `DataContractSerializer` with known types or System.Text.Json/Json.NET with `TypeNameHandling.None`.
- **ViewState and machine keys:** `EnableViewStateMac` must stay true (it can't be disabled since 4.5.2); unique, secret `machineKey` values per application (never copied from public samples), stored outside source control; leaked machine keys allow ViewState RCE.
- **Request handling:** keep request validation on (`requestValidationMode="4.5"`), encode output (`<%: %>`, `HttpUtility.HtmlEncode`, AntiXSS where used), anti-forgery tokens on MVC POSTs and `ViewStateUserKey` on Web Forms; `customErrors mode="RemoteOnly"` or `On`, `debug="false"`, `trace enabled="false"`, `httpCookies httpOnlyCookies="true" requireSSL="true"`.
- **TLS:** target 4.7+ and let the OS choose protocols (don't hard-code `SecurityProtocolType.Tls`); TLS 1.2+ only on the server.
- **WCF and ASMX:** transport security (HTTPS), message security where required, no `basicHttpBinding` without TLS, `includeExceptionDetailInFaults="false"`, metadata (`serviceMetadata httpGetEnabled`) off in production, quotas (`maxReceivedMessageSize`, reader quotas) set.
- **XML:** `XmlReaderSettings` with `DtdProcessing.Prohibit` and `XmlResolver = null` (defaults are safer on 4.5.2+, but explicit is better in shared code).
- **Secrets:** move connection strings and keys out of `Web.config` into protected configuration (`aspnet_regiis -pef`), environment-based config builders, or a secret store.

## Known vulnerabilities

- **Oct 2026 Patch Tuesday:** CVE-2026-70035 (deserialization of untrusted data, network RCE), CVE-2026-70007 (out-of-bounds write, network RCE), CVE-2026-85363 (integer overflow, elevation of privilege), CVE-2026-108398 (untrusted search path), CVE-2026-70194 (certificate validation bypass), CVE-2026-97801.
- **Aug 2026:** CVE-2026-62872 (incorrect authorization, network elevation of privilege), CVE-2026-62897, CVE-2026-65810. **Jul 2026:** CVE-2026-50650 (code injection), CVE-2026-50646, and DoS fixes CVE-2026-50524, CVE-2026-50527, CVE-2026-50648.
- All are fixed through the Windows / .NET Framework monthly updates for each supported version; unpatched servers stay exposed.

This list goes stale; verify with the `cve-check` skill, the MSRC Security Update Guide or NVD before relying on it.

## Migration path

1. **Assess:** list projects, TFMs, `System.Web` dependencies, WCF bindings, third-party packages and their .NET support; GitHub Copilot upgrade (needs a Copilot subscription and sends code to Copilot models, so ask first) or a manual inventory produces the plan.
2. **Libraries first:** move shared class libraries to `netstandard2.0` or multi-target `net48;net10.0`.
3. **Web apps incrementally:** a new ASP.NET Core (.NET 10) app in front with YARP proxies unmigrated routes to the old app; System.Web adapters share session and auth while routes move one at a time. Web Forms pages are rewritten (Razor Pages or Blazor; Copilot upgrade has a Web Forms to Blazor scenario).
4. **WCF services:** server side to CoreWCF (1.9) on .NET 10 for SOAP clients that must keep working; new APIs as gRPC or HTTP. Client side uses the `System.ServiceModel.*` packages. ASMX services move to CoreWCF or ASP.NET Core endpoints with the same contracts.
5. Use the `migrate-dotnet-framework` skill; retire the Framework app when the last route moves.

## Testing

- Characterization tests (HTTP-level for Web Forms and ASMX, contract tests for WCF) before migrating any route; run them against both old and new implementations.
- Security regression tests: ViewState tampering rejected, error pages without stack traces, WCF faults without exception details.

## Before you finish

```sh
msbuild /t:Restore,Build /p:Configuration=Release /warnaserror   # or: dotnet build for SDK-style projects
vstest.console.exe **\bin\Release\*Tests.dll                     # or: dotnet test
dotnet list package --vulnerable --include-transitive            # SDK-style projects with PackageReference
git grep -nE 'debug="true"|BinaryFormatter|NetDataContractSerializer|includeExceptionDetailInFaults="true"' -- '*.config' '*.cs'
```
