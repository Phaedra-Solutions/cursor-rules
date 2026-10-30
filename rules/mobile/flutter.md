---
id: mobile/flutter
title: Flutter
description: Flutter 3.47 and Dart 3.13 - Dart 3 patterns, records and sealed classes, state management that follows the project (Riverpod or Bloc for new projects), the standalone material_ui and cupertino_ui packages, Impeller, go_router, secrets out of code and --dart-define, flutter_secure_storage, platform-channel validation, release builds with --obfuscate --split-debug-info, and flutter analyze, dart fix, widget, golden and integration tests. Use when editing Dart code, pubspec.yaml or Flutter tests.
applies_to: "any"
legacy_rule: legacy/flutter-legacy
globs: ["lib/**/*.dart", "pubspec.yaml", "test/**/*.dart"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://docs.flutter.dev/release/release-notes
  - https://docs.flutter.dev/release/breaking-changes/material-ui-and-cupertino-ui
  - https://docs.flutter.dev/perf/impeller
  - https://docs.flutter.dev/deployment/obfuscate
  - https://docs.flutter.dev/security
  - https://docs.flutter.dev/platform-integration/platform-channels
  - https://docs.flutter.dev/testing/overview
  - https://dart.dev/tools/dart-fix
  - https://pub.dev/packages/flutter_secure_storage
  - https://pub.dev/packages/material_ui
  - https://riverpod.dev/
  - https://bloclibrary.dev/
  - https://osv.dev/vulnerability/GHSA-9324-jv53-9cc8
---

# Flutter

Mobile security controls (storage, network, deep links, WebViews, release hardening) are in `mobile/mobile-security`; this rule adds Flutter specifics. House conventions: `conventions/phaedra`.

## Version check

- Read the Flutter and Dart versions (`flutter --version`, `environment` in `pubspec.yaml`, `.fvmrc`/`.tool-versions`, CI) and the state-management and routing packages from `pubspec.lock`. State them:

  ```text
  Applying mobile/flutter (Flutter 3.47.9, Dart 3.13.7, Riverpod 3.4, go_router 18, from pubspec.lock).
  ```

- Current stable (Oct 2026): Flutter 3.47.9 with Dart 3.13.7. Use only language features the `sdk` constraint allows.
- **Pre-null-safety or Flutter 2** (`sdk: ">=2.x <3.0.0"`, no `?` types): use `legacy/flutter-legacy`.
- **Material and Cupertino:** from 3.47 they're available as standalone packages (`material_ui`, `cupertino_ui`, published by flutter.dev); the in-SDK libraries are slated for deprecation in the next stable release. New code in projects that migrated imports `package:material_ui/material_ui.dart`; pin the package versions. Migrate with `dart fix --apply --code=migrate_design_widgets` as its own change, when the user asks.
- **Impeller** is the renderer on iOS and Android (API 29+), and the default on macOS from 3.47; web still uses Skia. Don't disable Impeller without a reported rendering bug.

## Conventions

- **Language:** null safety, `final` by default, Dart 3 records, patterns and `switch` expressions, `sealed` classes for state and result types, `extension type` for typed IDs. No `dynamic` in new code.
- **Structure:** feature-first (`lib/features/<feature>/{data,domain,presentation}`), shared code in `lib/core/`. Keep widgets small; build methods free of side effects and I/O.
- **State management:** follow the project's choice. For new projects use **Riverpod** (`flutter_riverpod` 3, code generation optional), the house default in `conventions/phaedra`; Bloc (`flutter_bloc`) stays where a project already uses it. Don't mix two state-management approaches in one app. Keep `setState` to local, ephemeral UI state.
- **Routing:** `go_router` (or the project's router) with typed routes; guards redirect for UX, while the API enforces access.
- **Data:** `dio` or `http` with timeouts and interceptors for auth; `freezed`/`json_serializable` for models; repositories behind interfaces for testability.
- **Lints:** `flutter_lints` or `very_good_analysis` in `analysis_options.yaml`; fix warnings rather than ignoring them. Run `dart fix --apply` for deprecations.
- **Accessibility:** `Semantics` labels on custom controls, sufficient tap targets, text scaling respected; `Key('login-submit-button')`-style keys on interactive widgets on house projects for tests.

## Security

- **Secrets:** none in Dart code, assets or `--dart-define`/`--dart-define-from-file`; they're compiled into the binary and extractable. Fetch short-lived tokens from your backend.
- **Storage:** tokens and sensitive values in `flutter_secure_storage` (Keychain / Android Keystore-backed); never `shared_preferences`, Hive or plain files for secrets. Set iOS accessibility (`first_unlock_this_device` or stricter) for tokens that must not sync.
- **Network:** HTTPS only; never override `badCertificateCallback` to return `true` or set `HttpOverrides` that trust all certificates; set connect and receive timeouts on clients. Pin certificates through a maintained package only if the risk justifies it (see `mobile/mobile-security`).
- **Platform channels:** validate every argument on both sides (types, ranges, allowed values); never pass file paths, URLs or commands from Dart to native without allowlists. Native plugins run with the app's permissions; vet them like dependencies.
- **Deep links:** parse with `Uri.tryParse`, validate hosts and parameters, and never navigate to arbitrary URLs or trust link data for auth.
- **WebViews (`webview_flutter`):** JavaScript off unless needed, `NavigationDelegate` that allows only your domains, no `JavaScriptChannel` exposed to third-party pages.
- **Release builds:** `flutter build apk|appbundle|ipa --release --obfuscate --split-debug-info=build/symbols`; keep the symbol files private (upload them to your crash reporter only). Remove debug banners, logging of sensitive data and test endpoints.
- **Dependencies:** `flutter pub outdated` and review changelogs; prefer verified publishers on pub.dev; commit `pubspec.lock` for apps.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2021-31402: CRLF injection via the HTTP method string | dio < 5.0.0 | 5.0.0 |

No current OSV advisories for `flutter_secure_storage`, `webview_flutter` or `url_launcher`; platform (Android, iOS) security bulletins still apply to the embedded WebView and system libraries. This list goes stale; verify with the `cve-check` skill or OSV (ecosystem "Pub") before relying on it.

## Testing

- Unit tests for logic and repositories; widget tests with `flutter_test` (find by `Key`, semantics labels or text); golden tests for key screens (`matchesGoldenFile`) with fixed fonts and sizes.
- Integration tests with `integration_test` (or Patrol) on a real device or emulator for main flows, including login, deep links and permission prompts.
- Mock HTTP at the client boundary (a fake `Dio` adapter or `MockClient`), not inside widgets.

## Before you finish

```sh
flutter --version
dart format --output=none --set-exit-if-changed .
flutter analyze
dart fix --dry-run
flutter test
flutter build appbundle --release --obfuscate --split-debug-info=build/symbols   # or: flutter build ipa ...
flutter pub outdated
```
