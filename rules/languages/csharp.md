---
id: languages/csharp
title: C#
description: C# on .NET 10 LTS (C# 14) - support dates (.NET 8 and 9 end 10 Nov 2026), nullable reference types on, async/await all the way (no .Result or .Wait()), CancellationToken, no BinaryFormatter or other unsafe serializers, parameterized EF Core and ADO.NET queries, System.Text.Json safety, process and path rules, crypto, Roslyn analyzers with warnings as errors, and NuGet audit. Use when editing .cs files or .csproj.
applies_to: "any"
legacy_rule: legacy/dotnet-8-9
globs: ["**/*.cs", "*.csproj", "**/*.csproj", "Directory.Build.props", "Directory.Packages.props"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core
  - https://endoflife.date/dotnet
  - https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14
  - https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references
  - https://learn.microsoft.com/en-us/dotnet/standard/serialization/binaryformatter-security-guide
  - https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages
  - https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview
  - https://www.nuget.org/packages/Microsoft.CodeAnalysis.NetAnalyzers
---

# C#

Language-level rules only; ASP.NET Core gets its own rule (`backend/aspnet-core` when it exists). Generic secure-coding rules are in `core/security-baseline`.

## Version check

- Read `TargetFramework(s)` and `LangVersion` from the `.csproj` files and `Directory.Build.props`, the SDK from `global.json`, and package versions from `Directory.Packages.props` or the projects. State it:

  ```text
  Applying languages/csharp (net10.0, C# 14, Nullable enabled, central package management).
  ```

- **Support (Oct 2026):** **.NET 10 LTS** (C# 14; supported to Nov 2028) is the target. **.NET 8 LTS and .NET 9 STS both end support on 10 Nov 2026** → `legacy/dotnet-8-9` where it exists, otherwise `core/legacy-mode`; plan the move to .NET 10. .NET Framework 4.x → `legacy/dotnet-framework` where it exists.
- Use only language features of the project's `LangVersion` (C# 14 extension members and `field`-backed properties need .NET 10; collection expressions and primary constructors need C# 12).

## Conventions

- `<Nullable>enable</Nullable>` and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` (at least for nullable warnings) in new projects; don't silence nullability with `!` on external data, validate instead.
- `<ImplicitUsings>`, file-scoped namespaces, `record`/`record struct` for values, `required` and `init` members, pattern matching with exhaustive `switch` expressions.
- **Async all the way:** `async Task`/`ValueTask` through the call chain; never `.Result`, `.Wait()` or `GetAwaiter().GetResult()` on async code (deadlocks and thread-pool starvation); no `async void` except event handlers. Pass and honor `CancellationToken` in every async API; use `ConfigureAwait(false)` in libraries.
- `IDisposable`/`IAsyncDisposable` with `using`/`await using`; `IHttpClientFactory` (or a singleton `HttpClient`) with timeouts instead of `new HttpClient()` per call.
- Logging with `ILogger` message templates (`logger.LogInformation("User {UserId}", id)`), not interpolated strings.
- Central package management (`Directory.Packages.props`) and a `global.json` SDK pin for reproducible builds.

## Security

- **Serialization:** never `BinaryFormatter` (removed in .NET 9), `NetDataContractSerializer`, `SoapFormatter`, `LosFormatter` or `ObjectStateFormatter` on untrusted data. Use `System.Text.Json` without polymorphic type info from input; with Newtonsoft.Json keep `TypeNameHandling.None`.
- **SQL:** EF Core LINQ or `FromSql($"… {param}")`/`SqlQuery` (interpolation is parameterized); never `FromSqlRaw`/`ExecuteSqlRaw` with concatenated input. ADO.NET with `SqlParameter`/`DbParameter`.
- **XML:** `XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null }`; don't load untrusted XML with `XmlDocument` defaults on old frameworks.
- **Processes:** `ProcessStartInfo` with `ArgumentList` and `UseShellExecute = false`; never build `cmd.exe /c` or `bash -c` strings from input.
- **Paths:** `Path.GetFullPath(Path.Combine(base, name))` and check it starts with the base (with a trailing separator); reject rooted input.
- **Crypto:** `RandomNumberGenerator` for tokens; `AesGcm` or `ChaCha20Poly1305`; `Rfc2898DeriveBytes.Pbkdf2` with SHA-256 and a high iteration count or the framework's password hasher; `CryptographicOperations.FixedTimeEquals` for comparisons; no `MD5`/`SHA1` for security, no `RNGCryptoServiceProvider` in new code.
- **Regex on input:** pass a timeout (`new Regex(pattern, options, TimeSpan.FromMilliseconds(100))`) or use `RegexOptions.NonBacktracking`.
- **Secrets:** user secrets or a secret manager (Key Vault, environment), never `appsettings.json` in the repo.
- **Input size:** cap `JsonSerializerOptions.MaxDepth` and request body sizes for untrusted payloads; stream large inputs instead of buffering them.

## Known vulnerabilities

- Patch the runtime monthly (Patch Tuesday). Kestrel request smuggling CVE-2025-55315 (CVSS 9.9) required 8.0.21 / 9.0.10 or later; .NET 8 and 9 stop receiving patches after 10 Nov 2026.
- `dotnet list package --vulnerable --include-transitive` and NuGet audit (on by default since the .NET 8 SDK; transitive packages included from the .NET 9 SDK) report package advisories.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA (NuGet ecosystem) before relying on it.

## Testing

- xUnit or NUnit with FluentAssertions or Shouldly; `WebApplicationFactory` for integration tests; Testcontainers for databases.
- Tests for cancellation, null inputs and parsing of malformed data.
- Run the analyzers in CI with `AnalysisLevel` set to `latest-recommended` (or stricter) so security rules (CA2100, CA3075, CA5350 and related) fail the build.

## Before you finish

```sh
dotnet --version                                   # matches global.json
dotnet build -warnaserror
dotnet test
dotnet format --verify-no-changes
dotnet list package --vulnerable --include-transitive
```
