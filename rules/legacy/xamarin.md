---
id: legacy/xamarin
title: Xamarin and Xamarin.Forms
description: Maintaining Xamarin.iOS, Xamarin.Android and Xamarin.Forms apps after support ended on 1 May 2024 - why they can no longer ship store updates (Xamarin's last SDKs target Android API 34 and Xcode 15, while the App Store requires Xcode 26 since 28 Apr 2026 and Google Play requires API 36 for updates from 31 Aug 2026), what still works, security hygiene for the remaining binaries and their NuGet dependencies, and the migration path to .NET MAUI 10 (or native) with the migrate-xamarin skill. Use when a project references Xamarin.Forms, Xamarin.iOS, Xamarin.Android or MonoAndroid/Xamarin.iOS10 target frameworks.
applies_to: "nuget:Xamarin.Forms >=1.0 <6"
globs: ["*.csproj", "**/*.csproj", "packages.config", "**/packages.config", "**/*.xaml", "**/Info.plist", "**/AndroidManifest.xml", "**/MainActivity.cs", "**/AppDelegate.cs"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://dotnet.microsoft.com/en-us/platform/support/policy/xamarin
  - https://dotnet.microsoft.com/en-us/platform/support/policy/maui
  - https://learn.microsoft.com/en-us/dotnet/maui/migration/
  - https://learn.microsoft.com/en-us/dotnet/maui/supported-platforms
  - https://developer.apple.com/news/upcoming-requirements/
  - https://developer.android.com/google/play/requirements/target-sdk
  - https://learn.microsoft.com/en-us/dotnet/core/porting/github-copilot-app-modernization/faq
---

# Xamarin and Xamarin.Forms

Also apply `core/legacy-mode`, `languages/csharp` and `mobile/mobile-security` (storage, network and platform controls apply to any mobile app). Don't migrate as part of an unrelated task.

## Version check

- Read the project style (old-style `.csproj` with `MonoAndroid`/`Xamarin.iOS10` TFMs, or SDK-style), `Xamarin.Forms` or `Xamarin.Essentials` versions, the Visual Studio/Xcode used to build, and the Android `targetSdkVersion`. State them:

  ```text
  Applying legacy/xamarin (Xamarin.Forms 5.0.0.2662, Xamarin.Android targetSdk 34, Xamarin.iOS on Xcode 15, packages.config).
  ```

- **Status:** Xamarin support ended **1 May 2024** for all Xamarin SDKs, including Xamarin.Forms. Android API 34 and Xcode 15 (iOS 17) are the last SDKs Xamarin targets.
- **Store consequences (Oct 2026):**
  - **App Store:** since 28 Apr 2026 uploads must be built with **Xcode 26** and the iOS 26 SDK; Xamarin.iOS can't produce them, so **no new iOS builds can ship**.
  - **Google Play:** from 31 Aug 2026 new apps and updates must target **API 36**; Xamarin.Android stops at 34, so **no Play updates can ship**. Existing apps targeting 34 are hidden from new users on newer Android versions (the threshold is API 35).
- Report this in every change summary: any change that needs a store release can't be delivered on Xamarin.

## Conventions

- Write code for the installed Xamarin.Forms and C# version (usually C# 7.3–9 depending on the toolchain); no .NET MAUI APIs.
- Keep shared code in .NET Standard 2.0/2.1 libraries; that's the part that moves to MAUI with the least change.
- Don't add new NuGet packages unless they still support `netstandard2.0` and the Xamarin TFMs; many current packages have dropped them.

## Security

- **Dependencies:** run `dotnet list package --vulnerable` where SDK-style, or check `packages.config` packages against GHSA/OSV; pinned old versions of Newtonsoft.Json, SQLite-net, HTTP and image libraries are common sources of advisories. Update within versions that still support the Xamarin TFMs.
- **Storage and network:** tokens in `SecureStorage` (Keychain/Keystore), never `Preferences` or files; HTTPS only with ATS on and Android `cleartextTrafficPermitted="false"`; certificate validation never bypassed (`ServerCertificateCustomValidationCallback` returning true).
- **WebViews and deep links:** validate URLs and parameters; no JavaScript bridges for untrusted content.
- **Server side:** because the client can't be updated, put protective changes on the backend: tighten API validation, rate limits and auth; plan a forced-upgrade path (minimum app version check) so the MAUI release can retire old clients.
- Remove secrets from the app bundle and `App.config`/resources; rotate any that shipped.

## Known vulnerabilities

- Xamarin runtimes and SDKs get no fixes after 1 May 2024; platform WebView and OS fixes still arrive through device updates. Library advisories come through NuGet dependencies.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA (NuGet) before relying on it.

## Migration path

1. Inventory projects, NuGet packages (and their MAUI equivalents), custom renderers, effects, platform-specific code and third-party UI controls.
2. Move shared libraries to SDK-style `netstandard2.0` or `net10.0`, then create a **.NET MAUI 10** single project (MAUI 10 is supported to 11 May 2027; MAUI 11 ships with .NET 11).
3. Port: `Xamarin.Forms` namespaces → `Microsoft.Maui.*`, Xamarin.Essentials → built-in MAUI APIs, custom renderers → handlers (renderers can be shimmed temporarily), `DependencyService` → DI.
4. Use the `migrate-xamarin` skill. GitHub Copilot upgrade can assist with .NET Framework-style project upgrades but needs a Copilot subscription and sends code to Copilot models; ask first.
5. Ship the MAUI app as an update with the same bundle ID and package name, keep signing keys, and migrate stored data (SecureStorage keys, SQLite files) in place.

## Testing

- Before migrating, record UI flows (screenshots or UI tests) and API calls for the main screens; compare them on the MAUI build.
- Test upgrades in place: install the Xamarin build, sign in, then install the MAUI build over it and confirm data and sessions survive.

## Before you finish

```sh
msbuild /t:Restore,Build /p:Configuration=Release   # or: dotnet build for SDK-style projects
dotnet list package --vulnerable --include-transitive  # SDK-style projects
git grep -nE "ServerCertificateCustomValidationCallback|NSAllowsArbitraryLoads|cleartextTrafficPermitted=\"true\"" -- '*.cs' '*.plist' '*.xml'
```
