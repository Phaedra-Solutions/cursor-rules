---
id: mobile/android-compose
title: Android with Jetpack Compose
description: Android apps with Kotlin 2.4 and Jetpack Compose (BOM 2026.09.00) - unidirectional state with ViewModel and StateFlow, collectAsStateWithLifecycle, Navigation with type-safe routes, Keystore-backed storage (DataStore plus Tink or Keystore AES-GCM; androidx.security-crypto and EncryptedSharedPreferences are deprecated), a network security config without cleartext, minimal exported components, immutable PendingIntents, safe WebViews, R8 in release, and Compose UI testing. Use when editing Android Kotlin code, AndroidManifest.xml, Gradle build files or res/xml/network_security_config.xml.
applies_to: "any"
globs: ["**/*.kt", "AndroidManifest.xml", "**/AndroidManifest.xml", "build.gradle*", "**/build.gradle*", "res/xml/network_security_config.xml", "**/res/xml/network_security_config.xml"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://developer.android.com/develop/ui/compose/documentation
  - https://developer.android.com/topic/libraries/architecture/datastore
  - https://developers.google.com/tink
  - https://developer.android.com/reference/androidx/security/crypto/EncryptedSharedPreferences
  - https://blog.includesecurity.com/2026/08/encryptedsharedpreferences-is-dead-heres-what-you-should-use-instead/
  - https://developer.android.com/privacy-and-security/keystore
  - https://developer.android.com/privacy-and-security/security-config
  - https://developer.android.com/privacy-and-security/security-tips
  - https://developer.android.com/privacy-and-security/risks/android-exported
  - https://developer.android.com/build/shrink-code
  - https://developer.android.com/google/play/requirements/target-sdk
---

# Android with Jetpack Compose

Also apply `languages/kotlin`. Security controls (storage, network, platform, resilience, privacy) are in `mobile/mobile-security`; this rule adds Android and Compose specifics.

## Version check

- Read Kotlin, the Compose BOM, Android Gradle Plugin, `compileSdk`/`targetSdk`/`minSdk` from the version catalog and module `build.gradle.kts`, and state them:

  ```text
  Applying mobile/android-compose (Kotlin 2.4.21, Compose BOM 2026.09.00, AGP 9.5.0, targetSdk 36, minSdk 26).
  ```

- Current (Oct 2026): Kotlin 2.4, Compose BOM 2026.09.00, AGP 9.5.0. Keep `targetSdk` at the level Google Play requires for updates.
- XML views and Java apps: keep their architecture and add Compose with `ComposeView` where needed; follow `core/legacy-mode` for old Kotlin, AGP or Java-only modules.
- `androidx.security:security-crypto` (EncryptedSharedPreferences, EncryptedFile) is **deprecated** (1.1.0 is the last release); don't add it to new code.

## Conventions

- **Architecture:** UI (composables) → `ViewModel` exposing `StateFlow<UiState>` → repositories; one immutable `UiState` per screen; events from the UI as function calls (`onSave()`), not mutable shared state.
- Collect flows with `collectAsStateWithLifecycle()`; side effects in `LaunchedEffect`/`DisposableEffect` with correct keys; no work in composition.
- Stateless, previewable composables (`@Preview`) that receive state and callbacks; `remember`/`rememberSaveable` for UI-only state; stable parameters to avoid recomposition storms.
- **Navigation:** Navigation Compose with type-safe `@Serializable` routes; validate arguments from deep links.
- Dependency injection with Hilt (or the project's choice); coroutines on `viewModelScope` with `Dispatchers.IO` for I/O.
- Material 3 theming via `MaterialTheme` tokens; accessibility: `contentDescription` for icons, touch targets ≥ 48 dp, semantics for custom controls, `Modifier.testTag` on interactive elements (house test ID naming).
- Build: version catalog (`libs.versions.toml`), Gradle wrapper committed, release signing config from environment or CI secrets, never in the repo.

## Security

- **Storage:** Jetpack DataStore for preferences; encrypt sensitive values with a Keystore-backed key (AES-GCM via `KeyGenParameterSpec`, or Tink with an Android Keystore master key). Migrate existing EncryptedSharedPreferences data deliberately; don't leave it as the long-term store. Never store tokens in plain `SharedPreferences` or files.
- **Network security config:** `cleartextTrafficPermitted="false"` in the base config, user-installed CAs trusted only in `debug-overrides`, pins via `<pin-set>` only with backup pins and an expiry plan; referenced from the manifest (`android:networkSecurityConfig`).
- **Exported components:** `android:exported="false"` by default; exported activities, services, receivers and providers protected with permissions and input validation; explicit intents for internal communication; `PendingIntent.FLAG_IMMUTABLE` unless mutability is required.
- **Deep links:** App Links with `android:autoVerify="true"` and `assetlinks.json`; validate every parameter; never trigger sensitive actions or authenticate from a link alone.
- **WebView:** `javaScriptEnabled` only for trusted content; `setAllowFileAccess(false)`, no `addJavascriptInterface` for untrusted pages; use Custom Tabs for OAuth and external sites.
- **Backups:** `android:allowBackup="false"` or `dataExtractionRules` excluding tokens and sensitive files.
- **Release builds:** R8 minification and resource shrinking on (`isMinifyEnabled = true`), `debuggable` false, logs of personal data stripped, Play Integrity verified on the server for high-risk apps.
- **Screens with sensitive data:** `FLAG_SECURE` where screenshots or recents previews would leak data.

## Known vulnerabilities

- Android platform and WebView fixes ship through system and Play updates; library advisories (OkHttp, Retrofit, Gson, Coil, Play Services) come through Gradle dependencies; check them with the project's scanner and `dependency-vet`.

This list goes stale; verify with the `cve-check` skill, the Android Security Bulletins or OSV (Maven ecosystem) before relying on it.

## Testing

- ViewModel tests with `kotlinx-coroutines-test` and Turbine; Compose UI tests with `createComposeRule()` finding nodes by `testTag`, text or content description; screenshot tests where the project uses them.
- Instrumented tests for deep links and exported components (other apps can't start internal activities).
- Run Android Lint in CI; it flags exported components, cleartext traffic and insecure WebView settings.

## Before you finish

```sh
./gradlew lint
./gradlew testDebugUnitTest
./gradlew connectedDebugAndroidTest       # with an emulator or device
./gradlew assembleRelease                 # R8 runs; check the release manifest (see mobile/mobile-security)
./gradlew dependencies --configuration releaseRuntimeClasspath > /dev/null
```
