---
id: languages/dart
title: Dart
description: Dart 3 language rules - sound null safety, records, patterns, sealed classes and class modifiers, exhaustive switch, async and streams with cancellation, isolates for CPU work, immutable models, safe JSON decoding, dart:io process and path rules, and dart analyze with the recommended lints, dart format and dart fix. Use when editing .dart files (Flutter apps also apply mobile/flutter).
applies_to: "any"
legacy_rule: legacy/flutter-legacy
globs: ["**/*.dart", "analysis_options.yaml"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://dart.dev/null-safety
  - https://dart.dev/language/patterns
  - https://dart.dev/language/class-modifiers
  - https://dart.dev/language/isolates
  - https://dart.dev/tools/analysis
  - https://dart.dev/tools/dart-fix
  - https://pub.dev/packages/lints
  - https://docs.flutter.dev/release/release-notes
---

# Dart

Language-level rules only. Flutter apps also apply `mobile/flutter` and `mobile/mobile-security`.

## Version check

- Read `environment.sdk` in `pubspec.yaml` and the SDK in CI (`dart --version` or the Flutter version), and state it:

  ```text
  Applying languages/dart (Dart 3.13.7 via Flutter 3.47.9, sdk ^3.10.0, lints 6.1).
  ```

- Current stable (Oct 2026): Dart **3.13.7**. Code without sound null safety (sdk lower bound below 2.12) or on Dart 2 → `legacy/flutter-legacy`.
- Use only features the SDK lower bound allows (records, patterns, sealed and class modifiers need 3.0; newer language versions are enabled per package through the `sdk` constraint).

## Conventions

- Sound null safety: nullable types only where absence is meaningful; avoid `!` on data from JSON, platform channels, files or user input; use `late` only when initialization is guaranteed (prefer constructor initialization).
- Immutable models: `final` fields, `const` constructors, `copyWith`; `freezed` or hand-written `==`/`hashCode` when value equality matters.
- Dart 3: records for small multi-value returns, `sealed class` hierarchies with exhaustive `switch` expressions, destructuring patterns, `final class`/`interface class` modifiers to control extension.
- `extension type` for zero-cost typed wrappers (IDs, units).
- Async: `async`/`await`; never leave futures unawaited unless intentional (`unawaited()` from `dart:async`, and lint `unawaited_futures`); cancel `StreamSubscription`s; close `StreamController`s.
- Isolates: move CPU-heavy work (parsing large JSON, image processing, crypto) to `Isolate.run()` (or Flutter's `compute`), not the main isolate.
- Errors: throw `Exception` subclasses for recoverable errors and `Error` for programming bugs; catch specific types (`on FormatException catch (e)`), never empty `catch`.
- Lints: `package:lints/recommended.yaml` (or `flutter_lints` / `very_good_analysis`) in `analysis_options.yaml`, with `strict-casts`, `strict-inference` and `strict-raw-types` enabled for new packages.

## Security

- **JSON:** decode with `jsonDecode` into `Object?`, then validate types and required fields before building models (generated `fromJson` with `checked: true`, or explicit checks); never cast blindly (`as Map<String, dynamic>`) on untrusted input without handling `TypeError`.
- **Processes (`dart:io`):** `Process.run('git', ['log', '--', path])` with an argument list and `runInShell: false` (the default); never pass user input to a shell.
- **Paths:** `p.normalize(p.join(base, name))` with `package:path`, then `p.isWithin(base, target)`; reject absolute input.
- **Randomness:** `Random.secure()` for tokens and nonces, never `Random()`.
- **Crypto:** use maintained packages (`cryptography`, `pointycastle`) with AEAD modes; don't implement primitives.
- **HTTP:** `package:http`/`dio` with timeouts; never `HttpClient.badCertificateCallback = (_, _, _) => true`.
- **Secrets:** none in source or `--define`/`String.fromEnvironment` values compiled into client binaries.

## Known vulnerabilities

- Dart SDK security fixes ship in patch releases; stay on the latest patch of the current stable. Package advisories are in OSV's Pub ecosystem (for example `dio` CVE-2021-31402, fixed in 5.0.0).

This list goes stale; verify with the `cve-check` skill or OSV (ecosystem "Pub") before relying on it.

## Testing

- `package:test` (or `flutter_test`); group tests by behavior; test sealed-class handling for every case; test JSON parsing with missing, extra and wrongly typed fields.
- Use `fake_async` or injected clocks for time-dependent code instead of real delays.
- Measure coverage with `dart test --coverage` on changed libraries.

## Before you finish

```sh
dart --version
dart format --output=none --set-exit-if-changed .
dart analyze --fatal-infos
dart fix --dry-run
dart test                                # or: flutter test
dart pub outdated
```
