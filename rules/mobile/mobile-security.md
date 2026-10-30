---
id: mobile/mobile-security
title: Mobile app security (MASVS)
description: Mobile security controls for React Native, Flutter, iOS and Android grouped by OWASP MASVS 2.1 category, with MASWE 1.0 weakness IDs and MASTG v2 test IDs - storage (Keychain, Keystore, backups, logs), crypto, authentication and biometrics, network (ATS, network security config, pinning), platform (deep links, intents, WebViews, screenshots), code (dependencies, input validation, update enforcement), resilience (realistic root/jailbreak detection, attestation, obfuscation, debug artifacts) and privacy. Use when editing mobile app code, manifests, entitlements or native config.
applies_to: "any"
globs: ["android/**", "ios/**", "**/*.{kt,java,swift,m,mm}", "**/AndroidManifest.xml", "**/Info.plist", "**/*.entitlements", "**/network_security_config.xml", "lib/**/*.dart", "app.json", "app.config.*"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://mas.owasp.org/MASVS/
  - https://github.com/OWASP/masvs/blob/master/OWASP_MASVS.yaml
  - https://mas.owasp.org/MASWE/
  - https://github.com/OWASP/maswe/releases/tag/v1.0.0
  - https://mas.owasp.org/MASTG/
  - https://github.com/OWASP/mastg/releases/tag/v2.0.0
  - https://owasp.org/www-project-mobile-top-10/
  - https://developer.apple.com/documentation/security/keychain-services
  - https://developer.android.com/privacy-and-security/keystore
  - https://developer.android.com/privacy-and-security/security-config
  - https://developer.apple.com/documentation/bundleresources/information-property-list/nsapptransportsecurity
  - https://developer.android.com/training/app-links
  - https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
  - https://developer.android.com/google/play/integrity
  - https://developer.apple.com/documentation/devicecheck
  - https://docs.flutter.dev/deployment/obfuscate
---

# Mobile app security (MASVS)

Framework rules add specifics: `mobile/react-native-expo`, `legacy/react-native-old-arch`, `mobile/flutter`. Server-side controls are in `core/security-baseline`; the backend must enforce every check the app makes.

## Version check

- Note the platform targets and minimums (`minSdkVersion`/`targetSdkVersion` in Gradle, `IPHONEOS_DEPLOYMENT_TARGET`), the framework (React Native/Expo, Flutter, native), and the security libraries in use (secure storage, pinning, attestation). State them:

  ```text
  Applying mobile/mobile-security (Expo SDK 58, targetSdk 36, iOS 16+, expo-secure-store, no pinning).
  ```

- Standards (Oct 2026): **MASVS 2.1** (controls), **MASWE 1.0** (weaknesses, Aug 2026), **MASTG 2.0** (tests, Jun 2026), OWASP Mobile Top 10 (2024). Cite MASWE IDs when you report a weakness and the MASTG test that checks it.

## Conventions

- Treat the app as fully inspectable: anything in the bundle (JavaScript, Dart AOT, resources, `Info.plist`, `EXPO_PUBLIC_*`, `--dart-define`) can be extracted. Security decisions happen on the server.
- Keep platform minimums current and target the latest SDK required by the stores (MASVS-CODE-1; MASWE-0041, MASWE-0042).
- Release builds differ from debug builds: verify hardening on a release build, not in development.

## Security

### MASVS-STORAGE — "The app securely stores sensitive data" / "prevents leakage"

- Tokens, keys and personal data go in the Keychain (iOS) or Android Keystore-backed storage (`expo-secure-store`, `react-native-keychain`, `flutter_secure_storage`), never in AsyncStorage, `SharedPreferences`/`NSUserDefaults`, plain files or SQLite without encryption (MASWE-0001; MASTG-TEST-0207, -0287, -0299–0302).
- No secrets in the app package: API secrets, signing keys, private endpoints (MASWE-0004). Use short-lived tokens from your backend instead.
- Keep sensitive data out of external/shared storage (MASWE-0002; MASTG-TEST-0200–0202, -0303) and out of logs, crash reports and analytics (MASWE-0005; MASTG-TEST-0203, -0231, -0296, -0297). Strip `console.log`/`print` of sensitive values in release builds.
- Exclude sensitive files from backups: `android:allowBackup="false"` or `dataExtractionRules`/`fullBackupContent` excludes; iOS `isExcludedFromBackup` and Keychain items with `ThisDeviceOnly` accessibility (MASWE-0006; MASTG-TEST-0215, -0216, -0262, -0298).
- Keys live in the platform keystore, non-exportable where possible (MASWE-0003; MASTG-TEST-0212–0214).

### MASVS-CRYPTO

- Use platform or well-reviewed libraries: AES-GCM, ChaCha20-Poly1305, SHA-256+, ECDSA/Ed25519; never ECB, static IVs, MD5/SHA-1 for security or home-made crypto (MASWE-0007, MASWE-0008; MASTG-TEST-0221, -0232, -0307–0310).
- Randomness from the platform CSPRNG (`SecRandomCopyBytes`, `SecureRandom`, `crypto.getRandomValues`, `Random.secure()`) (MASWE-0012; MASTG-TEST-0311, -0349).
- Generate keys in the Keystore/Secure Enclave, restrict their use (auth required, purpose-bound) and plan rotation (MASWE-0013–0016).

### MASVS-AUTH

- Authentication and authorization are enforced by the server (MASVS-AUTH-1): OAuth 2.0/OIDC with PKCE via the system browser (`ASWebAuthenticationSession`, Custom Tabs), never embedded WebView logins; short-lived access tokens, rotating refresh tokens.
- Biometrics unlock a Keystore/Keychain key bound to biometric auth (CryptoObject, `kSecAccessControlBiometryCurrentSet`), not a boolean "success" flag (MASWE-0020; MASTG-TEST-0266, -0267, -0327, -0329, -0330). Don't allow device-passcode fallback for high-risk actions unless intended (MASWE-0021; MASTG-TEST-0268, -0269, -0326); invalidate keys on new biometric enrollment (MASWE-0022).
- Step-up authentication for sensitive operations (payments, changing email or password) (MASVS-AUTH-3; MASWE-0023). Clear tokens and cached data on logout (MASWE-0024).

### MASVS-NETWORK

- HTTPS only. iOS: no `NSAllowsArbitraryLoads` (ATS on); Android: `network_security_config.xml` with `cleartextTrafficPermitted="false"` and no user-added CAs in release (MASWE-0026; MASTG-TEST-0217, -0218, -0233–0239, -0321–0323).
- Never disable certificate validation (custom `TrustManager`, `onReceivedSslError` → `proceed()`, `badCertificateCallback` returning `true`, `NSURLSession` delegates that accept any cert) (MASWE-0027; MASTG-TEST-0234, -0282–0286, -0295, -0396, -0397).
- Pin identities for endpoints you control when the risk justifies it (MASVS-NETWORK-2): pin public keys (SPKI) with a backup pin and a rotation plan via Android network security config `<pin-set>` or a maintained library; pinning that can't be updated breaks apps (MASWE-0028; MASTG-TEST-0242–0244, -0385).

### MASVS-PLATFORM

- **Deep links:** prefer verified App Links (`autoVerify`) and Universal Links (`assetlinks.json`, `apple-app-site-association`) over custom schemes; validate every parameter, never trust a link to authenticate or to pick an arbitrary URL to open (MASWE-0029; MASTG-TEST-0370, -0371, -0393–0395).
- **Android components:** `android:exported="false"` unless needed; protect exported components with permissions; use explicit intents and `PendingIntent.FLAG_IMMUTABLE` (MASWE-0032, MASWE-0018; MASTG-TEST-0372, -0374, -0381).
- **WebViews:** load only your own HTTPS content; disable JavaScript, file access (`setAllowFileAccess(false)`) and universal file URL access unless required; expose no native bridges to untrusted pages; open third-party links in the system browser (MASWE-0033–0035; MASTG-TEST-0331, -0332, -0398, -0399).
- **UI:** hide sensitive values in the app switcher and screenshots (`FLAG_SECURE`, iOS snapshot overlay) where data warrants it (MASWE-0038; MASTG-TEST-0289–0294); use secure text entry for passwords and disable keyboard caching (MASWE-0036); keep secrets out of notifications (MASWE-0037) and the clipboard (MASWE-0030).

### MASVS-CODE

- Keep dependencies patched and audited (`npm audit`, `flutter pub outdated`, Gradle/CocoaPods/SPM checks); vet new SDKs, especially analytics and ads (MASWE-0044; MASTG-TEST-0272–0275; Mobile Top 10 M2).
- Validate all untrusted input: deep-link params, intents, push payloads, platform-channel and native-module arguments, files and server responses (MASVS-CODE-4; MASWE-0050; MASTG-TEST-0337, -0339, -0375, -0386).
- Enforce minimum app versions for security fixes (server-side version check, Play in-app updates) (MASVS-CODE-2; MASWE-0043).
- No dynamic code loading from untrusted sources; OTA updates (Expo Updates, Shorebird, CodePush) signed and served over HTTPS (MASWE-0049).
- Keep compiler protections on (PIE, stack canaries, ARC) (MASWE-0045; MASTG-TEST-0222, -0223, -0228–0230).

### MASVS-RESILIENCE (realistic expectations)

- Resilience controls raise attacker cost; they don't replace server-side checks. Root/jailbreak detection is bypassable on a compromised device; use it for risk signals, not as authorization.
- For high-value apps (banking, payments, DRM): Play Integrity API and App Attest / DeviceCheck, verified **on the server** (MASWE-0054, MASWE-0056).
- Release builds: R8/ProGuard minification on Android, Flutter `--obfuscate --split-debug-info`, Hermes bytecode for React Native; keep symbol maps private (MASWE-0059; MASTG-TEST-0368, -0369, -0391).
- Remove debug artifacts and disable debugging: `android:debuggable` false, no `get-task-allow` in release entitlements, no dev menus or test endpoints (MASWE-0061, MASWE-0063; MASTG-TEST-0219, -0226, -0227, -0261, -0263–0265).

### MASVS-PRIVACY

- Request only the permissions the feature needs, when it's needed, with a clear rationale (MASWE-0066).
- Declare data collection accurately (App Store privacy labels, Play Data safety, privacy manifests `PrivacyInfo.xcprivacy`) and keep tracking domains declared (MASWE-0073, MASWE-0074).
- Avoid persistent device identifiers for tracking; honor App Tracking Transparency (MASWE-0068). Let users view, export and delete their data (MASVS-PRIVACY-4; MASWE-0076).

## Known vulnerabilities

- Framework and SDK advisories are tracked in the framework rules (`mobile/react-native-expo` for Metro4Shell CVE-2025-11953 and Expo advisories, `mobile/flutter` for Flutter packages).
- The 2024 Mobile Top 10 risks to check first: M1 Improper Credential Usage, M2 Inadequate Supply Chain Security, M3 Insecure Authentication/Authorization, M9 Insecure Data Storage.

This list goes stale; verify with the `cve-check` skill, OSV/GHSA and the platform security bulletins before relying on it.

## Testing

- Use the MASTG tests cited above as the checklist for a release; run static checks (MobSF or similar) in CI and a manual MASTG pass before major releases.
- Inspect a release build: unpack the APK/AAB or IPA, search for secrets and endpoints, check `AndroidManifest.xml` (exported, debuggable, backup) and entitlements.
- Test with a proxy (mitmproxy, Burp) that cleartext and invalid certificates are refused and pinning works where configured.
- Test deep links with malformed and hostile parameters.

## Before you finish

```sh
# Android: inspect the merged manifest of the release build
(cd android && ./gradlew :app:processReleaseManifest)
find android/app/build/intermediates -path "*elease*" -name AndroidManifest.xml -exec grep -nE "debuggable|allowBackup|exported|usesCleartextTraffic" {} +
# iOS: check ATS and entitlements
/usr/libexec/PlistBuddy -c "Print :NSAppTransportSecurity" ios/*/Info.plist 2>/dev/null
# Secrets in the bundle (React Native / Expo, Flutter)
git grep -nE "(api[_-]?key|secret|private[_-]?key)\s*[:=]" -- src lib app 2>/dev/null
```
