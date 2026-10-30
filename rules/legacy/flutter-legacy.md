---
id: legacy/flutter-legacy
title: Flutter 2 and pre-null-safety Dart
description: Safe maintenance of Flutter 2.x and Dart 2.x apps without sound null safety - Dart 3 requires null safety, dart migrate exists only up to Dart 2.19.6, store target-SDK requirements, unmaintained plugins, compensating controls and the migration path (null safety on 2.19.6, then Flutter 3.x and Dart 3). Use when pubspec.yaml has an sdk constraint below 2.12 or 3.0, or the app uses Flutter 2.
applies_to: "any"
globs: ["lib/**/*.dart", "pubspec.yaml", "test/**/*.dart", "android/app/build.gradle*", "ios/Podfile"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://dart.dev/null-safety
  - https://dart.dev/null-safety/migration-guide
  - https://docs.flutter.dev/release/release-notes
  - https://docs.flutter.dev/release/breaking-changes
  - https://developer.android.com/google/play/requirements/target-sdk
  - https://dart.dev/tools/dart-fix
---

# Flutter 2 and pre-null-safety Dart

Also apply `core/legacy-mode` and `mobile/mobile-security`; secure storage, network, deep-link and release-build rules don't depend on the Flutter version.

## Version check

- Read `environment.sdk` and `environment.flutter` in `pubspec.yaml`, the Flutter version pinned in CI or FVM, and whether code uses null safety (`?` types, `late`, `required`). State it:

  ```text
  Applying legacy/flutter-legacy (Flutter 2.10.5, Dart 2.16, sdk ">=2.7.0 <3.0.0", not null-safe).
  ```

- **Dart 3 requires sound null safety.** Apps and packages that aren't fully migrated can't run on Dart 3 / Flutter 3.10+.
- **`dart migrate`** (the automated null-safety migration tool) is available only up to **Dart 2.19.6**; later SDKs removed it.
- Store requirements force updates: Google Play's target API level rules and Apple's minimum Xcode/SDK rules mean old Flutter versions eventually can't ship updates. Check the current requirements before promising a release on the old toolchain.

## Conventions

- Write code in the style of the installed Dart version; don't use records, patterns, sealed classes or class modifiers (Dart 3) or `required`/`late` in non-null-safe libraries.
- Pin the Flutter SDK (FVM or CI) and keep `pubspec.lock` committed; old plugin versions often have no newer release for the old SDK.
- Mixed-mode (some libraries null-safe, others not) runs with unsound null safety; avoid adding new non-null-safe code.

## Safe maintenance

- Patch within what the old SDK supports; replace discontinued plugins (pub.dev marks them) when a security issue appears.
- Compensating controls: keep all security decisions server-side, enforce minimum app versions from the backend, and keep the WebView and network stack on the platform's current versions (they update with the OS on newer devices).
- Keep tokens in a maintained secure-storage plugin version that still supports the SDK; if none exists, plan the upgrade rather than falling back to plain preferences.

## Security

- Every rule in `mobile/mobile-security` and the Security section of `mobile/flutter` applies; old code often has `badCertificateCallback` overrides, secrets in source and verbose logging. Fix them when touching the code.
- Old `dio` (< 5.0.0) is affected by CVE-2021-31402 (CRLF injection via the HTTP method).

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed |
|---|---|---|
| CVE-2021-31402: CRLF injection via the HTTP method string | dio < 5.0.0 | 5.0.0 (needs null-safe Dart) |

Old Flutter engines also miss years of Skia, WebView and platform fixes that don't appear as package advisories. This list goes stale; verify with the `cve-check` skill or OSV before relying on it.

## Migration path

1. Move to **Flutter 3.7.x / Dart 2.19.6** (the last SDK with `dart migrate`), upgrading plugins to null-safe versions first; replace plugins that never migrated.
2. Run `dart migrate` (or migrate by hand, leaf libraries first), review the suggested `?`, `!` and `late` edits, and get the tests passing with sound null safety (all libraries migrated).
3. Upgrade to Flutter 3.10+ / Dart 3, then step through Flutter stable releases to current (3.47), applying `dart fix --apply` and the breaking-change guides at each step.
4. Then follow `mobile/flutter` (standalone Material/Cupertino packages, Impeller).

## Testing

- Before migrating, add widget and integration tests for main flows; null-safety migrations change behavior at the edges.
- Run the suite after each SDK step on both Android and iOS.

## Before you finish

```sh
flutter --version
flutter analyze
flutter test
flutter pub outdated
grep -rn "badCertificateCallback" lib 2>/dev/null
```
