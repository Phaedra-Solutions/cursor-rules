---
id: mobile/ios-swiftui
title: iOS with SwiftUI
description: iOS apps with SwiftUI on Swift 6 - strict concurrency with @MainActor views and actors, the Observation framework (@Observable, @State, @Bindable), NavigationStack with typed routes, async data loading with task cancellation, Keychain for tokens, App Transport Security, no secrets in Info.plist or the bundle, deep-link and universal-link validation, privacy manifests, accessibility, and testing with Swift Testing and XCUITest. Use when editing SwiftUI views, app code, Xcode project settings or Info.plist.
applies_to: "any"
globs: ["**/*.swift", "*.xcodeproj/**", "Info.plist", "**/Info.plist"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://developer.apple.com/documentation/swiftui
  - https://developer.apple.com/documentation/swiftui/state
  - https://developer.apple.com/documentation/observation
  - https://www.swift.org/documentation/concurrency/
  - https://developer.apple.com/documentation/security/keychain-services
  - https://developer.apple.com/documentation/bundleresources/information-property-list/nsapptransportsecurity
  - https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
  - https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
  - https://github.com/swiftlang/swift/releases
---

# iOS with SwiftUI

Also apply `languages/swift`. Security controls (storage, network, platform, resilience, privacy) are in `mobile/mobile-security`; this rule adds SwiftUI app specifics.

## Version check

- Read the deployment target (`IPHONEOS_DEPLOYMENT_TARGET`), Swift version and language mode, Xcode version in CI, and package dependencies (Swift Package Manager or CocoaPods). State them:

  ```text
  Applying mobile/ios-swiftui (iOS 17+, Swift 6.4 language mode 6, Xcode 26, SPM).
  ```

- The Observation framework (`@Observable`) needs iOS 17+; on iOS 16 and older use `ObservableObject` with `@Published`/`@StateObject`. Gate newer APIs with `@available`/`if #available`.
- UIKit-heavy or Objective-C apps: keep their architecture, add SwiftUI through `UIHostingController`, and follow `core/legacy-mode` for old Swift versions.

## Conventions

- **State:** `@State` for view-local values; `@Observable` model classes held with `@State` (owner) and passed down or through `@Environment`; `@Bindable` for bindings into observable models. Don't create models in `body`.
- **Concurrency:** views and view models are `@MainActor`; network and persistence in actors or `Sendable` services; load data with `.task { … }` (cancelled automatically when the view disappears) or `.task(id:)` to restart on input changes; no `DispatchQueue.main.async` sprinkled in views.
- **Navigation:** `NavigationStack` with a typed path (`[Route]` enum) and `navigationDestination(for:)`; deep links map to `Route` values after validation.
- Small views with clear inputs; extract subviews instead of long `body`s; previews with `#Preview` and sample data.
- Errors surfaced to the user with retry, not silently swallowed; loading and empty states for every async screen.
- **Accessibility:** labels for icon buttons (`.accessibilityLabel`), Dynamic Type support (no fixed font sizes), sufficient contrast, `accessibilityIdentifier` on interactive elements for UI tests (house test ID naming).
- Project hygiene: configuration per build setting (`.xcconfig`), no secrets in schemes or `Info.plist`; SwiftLint in CI.

## Security

- **Secrets:** none in source, `Info.plist`, `.xcconfig` committed files or the asset catalog; they ship in the app bundle. Fetch short-lived tokens from the backend.
- **Tokens:** Keychain (`kSecClassGenericPassword`, `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` or `AfterFirstUnlockThisDeviceOnly`); never `UserDefaults`, `@AppStorage` or files for tokens.
- **Network:** keep App Transport Security on (no `NSAllowsArbitraryLoads`); scoped `NSExceptionDomains` only with a reason in the PR; `URLSession` default certificate validation.
- **Deep links and universal links:** handle in `.onOpenURL` / `onContinueUserActivity`, parse with `URLComponents`, allowlist hosts, paths and parameters, and never perform state-changing actions or authenticate from a link without user confirmation.
- **Web content:** `ASWebAuthenticationSession` for OAuth logins; `SFSafariViewController` for external pages; `WKWebView` only for trusted content.
- **Screens with sensitive data:** hide content when the app moves to the background (`scenePhase` overlay) where the data warrants it; mark sensitive text fields with `.privacySensitive()`.
- **Privacy:** declare required-reason APIs and data collection in `PrivacyInfo.xcprivacy`; request permissions in context with clear purpose strings.
- **Release builds:** no debug menus or test endpoints; strip logging of personal data; `Logger` privacy annotations.

## Known vulnerabilities

- iOS and WebKit fixes ship with OS updates; raise the deployment target periodically and test on current iOS. Third-party SDK advisories come through SPM/CocoaPods dependencies; review them with `dependency-vet`.

This list goes stale; verify with the `cve-check` skill, Apple security releases or OSV/GHSA before relying on it.

## Testing

- Swift Testing (`@Test`) or XCTest for view models and services, with protocol-based fakes for networking; test cancellation and error paths.
- XCUITest for main flows using `accessibilityIdentifier`s; snapshot tests where the project uses them.
- Test deep links with malformed, hostile and unexpected URLs.

## Before you finish

```sh
xcodebuild -scheme <App> -destination 'platform=iOS Simulator,name=iPhone 17' build test
swiftlint --strict
/usr/libexec/PlistBuddy -c "Print :NSAppTransportSecurity" <App>/Info.plist 2>/dev/null   # no arbitrary loads
git grep -nE "(api[_-]?key|secret|token)\s*[:=]\s*\"" -- '*.swift' '*.plist' '*.xcconfig'
```
