---
id: languages/swift
title: Swift
description: Swift 6 language rules (Swift 6.4) - the Swift 6 language mode with strict concurrency (Sendable, actors, @MainActor, structured tasks and cancellation), value types, optionals without force unwraps on external data, typed errors, Codable with validation, Keychain for secrets, CryptoKit, URLSession with ATS, process and path safety on macOS, and SwiftLint and swift-format. Use when editing .swift files or Package.swift.
applies_to: "any"
globs: ["**/*.swift", "Package.swift"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://github.com/swiftlang/swift/releases
  - https://www.swift.org/blog/
  - https://www.swift.org/documentation/concurrency/
  - https://www.swift.org/swift-evolution/
  - https://developer.apple.com/documentation/security/keychain-services
  - https://developer.apple.com/documentation/cryptokit
  - https://developer.apple.com/documentation/bundleresources/information-property-list/nsapptransportsecurity
  - https://github.com/realm/SwiftLint
---

# Swift

Language-level rules only. iOS apps also apply `mobile/mobile-security` (and `mobile/ios-swiftui` when it exists).

## Version check

- Read `swift-tools-version` in `Package.swift`, `SWIFT_VERSION` and the Xcode version in the project or CI, and the language mode (`swiftLanguageModes`, `SWIFT_STRICT_CONCURRENCY`). State it:

  ```text
  Applying languages/swift (Swift 6.4, Swift 6 language mode, Xcode 26, SPM).
  ```

- Current (Oct 2026): **Swift 6.4** (6.4.1, 15 Oct 2026). New code uses the **Swift 6 language mode** (complete data-race checking). Projects still in Swift 5 mode: keep it, enable `StrictConcurrency` warnings first, and migrate module by module; follow `core/legacy-mode` for Swift 4 or Objective-C-heavy code.
- Use only APIs available at the deployment target (`@available` checks for newer iOS/macOS APIs).

## Conventions

- Prefer `struct` and `enum` (value semantics); `final class` when reference identity is needed; `actor` for shared mutable state.
- **Concurrency (Swift 6 mode):**
  - mark UI code `@MainActor`; make types crossing concurrency domains `Sendable` (immutable structs, actors); avoid `@unchecked Sendable` and `nonisolated(unsafe)` unless reviewed and documented in the PR;
  - structured concurrency: `async let` and `withTaskGroup` over detached tasks; keep `Task` handles and cancel them when the owner goes away; check `Task.isCancelled`/`try Task.checkCancellation()` in long loops;
  - no blocking calls (`DispatchSemaphore.wait`, synchronous network) inside async code.
- **Optionals:** `guard let`/`if let`/`??`; never `!` or `try!` on data from the network, files, user input, deep links or `UserDefaults`. Reserve force unwraps for programmer invariants (for example `URL(string: "https://example.com")!` constants).
- Errors: `throws` (typed throws `throws(MyError)` where the error set is closed); no empty `catch {}`.
- `Codable` for parsing, followed by validation of ranges and formats; decode untrusted input with explicit `CodingKeys` and no `AnyCodable` catch-alls.
- Access control: `private`/`fileprivate` by default; `public` only for package API.
- Formatting and linting: swift-format or SwiftFormat plus SwiftLint (0.65+) in CI.

## Security

- **Secrets and tokens** in the Keychain (`kSecClassGenericPassword`) with an appropriate accessibility (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly` or `AfterFirstUnlockThisDeviceOnly` for background use), never `UserDefaults`, plist files or source code.
- **Crypto:** CryptoKit (`AES.GCM`, `ChaChaPoly`, `SHA256`, `P256`, Secure Enclave keys); `SecRandomCopyBytes` or `SystemRandomNumberGenerator` for tokens; never roll your own.
- **Network:** `URLSession` with App Transport Security on (no `NSAllowsArbitraryLoads`); never accept all certificates in `urlSession(_:didReceive:completionHandler:)`; pin only with a rotation plan (see `mobile/mobile-security`).
- **Input:** validate deep-link and universal-link parameters, pasteboard data and `URL` components before acting on them; open external URLs only after checking scheme and host.
- **WebViews:** `WKWebView` only for trusted content; restrict `WKScriptMessageHandler` bridges to your own pages.
- **macOS processes and files:** `Process` with `executableURL` and an `arguments` array (no `/bin/sh -c` with input); standardize and check paths stay inside the intended directory; honor the sandbox entitlements you declare.
- **Logging:** `Logger` with privacy annotations (`\(token, privacy: .private)`); no secrets or personal data at `.public`.

## Known vulnerabilities

- Swift toolchain and Foundation fixes ship with Xcode and OS updates; keep Xcode and the deployment toolchain current. Package advisories come through Swift Package Manager dependencies (OSV ecosystem "SwiftURL").

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Swift Testing (`@Test`, `#expect`) or XCTest; test async code with `async` tests, not sleeps; test cancellation and decoding of malformed input.
- Run tests with the Thread Sanitizer for code still in Swift 5 mode.
- Test Keychain wrappers against the simulator's Keychain, and test URL handlers with hostile schemes and parameters.

## Before you finish

```sh
swift --version
swift build -Xswiftc -warnings-as-errors      # or: xcodebuild build with SWIFT_TREAT_WARNINGS_AS_ERRORS=YES
swift test                                    # or: xcodebuild test -scheme <scheme>
swiftlint --strict
swift-format lint --recursive Sources Tests   # or the project's formatter
```
