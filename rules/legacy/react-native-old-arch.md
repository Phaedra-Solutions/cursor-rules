---
id: legacy/react-native-old-arch
title: React Native old architecture and bare React Native CLI apps
description: React Native below 0.82 and Expo SDK 54 or older (where the legacy Bridge architecture can still be on), plus bare React Native CLI apps with hand-maintained ios/ and android/ folders. Covers architecture detection, native-module compatibility checks, Metro4Shell on old CLI versions, support status and the path to the New Architecture. Use when the installed react-native is below 0.82, newArchEnabled is false, or the app has no expo dependency.
applies_to: "react-native <0.82"
globs: ["android/**/*.{gradle,kts,properties,xml,java,kt}", "ios/Podfile", "ios/**/*.{m,mm,h,swift}", "react-native.config.js", "metro.config.js", "index.js", "src/**/*.{js,jsx,ts,tsx}", "app.json"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://reactnative.dev/releases/overview
  - https://reactnative.dev/blog/2025/10/08/react-native-0.82
  - https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here
  - https://reactnative.dev/blog/2026/10/19/react-native-0.88
  - https://reactnative.dev/docs/upgrading
  - https://react-native-community.github.io/upgrade-helper/
  - https://docs.expo.dev/guides/new-architecture/
  - https://expo.dev/changelog/sdk-53-beta
  - https://docs.expo.dev/bare/installing-expo-modules/
  - https://docs.expo.dev/modules/overview/
  - https://reactnative.directory/
  - https://support.google.com/googleplay/android-developer/answer/11926878
  - https://osv.dev/vulnerability/GHSA-399j-vxmf-hjvr
  - https://www.vulncheck.com/blog/metro4shell_eitw
  - https://www.cisa.gov/known-exploited-vulnerabilities-catalog
  - https://registry.npmjs.org/react-native/0.74.0
  - https://osv.dev/vulnerability/GHSA-7f53-fmmv-mfjv
  - https://osv.dev/vulnerability/GHSA-36j3-xxf7-4pqg
  - https://osv.dev/vulnerability/GHSA-wr5g-q49g-548w
---

# React Native old architecture and bare RN CLI apps

Also apply `core/legacy-mode`. Don't migrate as part of an unrelated task; keep the project's patterns (Formik + Yup, class components, Redux) where they exist.

## Version check

- Read `react-native`, `expo` (if any), `react`, `@react-native-community/cli`, `@react-native-community/cli-server-api` and `react-native-reanimated` from the lockfile, then state the rule and architecture:

  ```text
  Applying legacy/react-native-old-arch (react-native 0.78.3 from yarn.lock; bare RN CLI; old architecture on Android, newArchEnabled=false).
  ```

- **Support status:** only the latest three RN minors get patches (0.88 and 0.87 Active, 0.86 End of Cycle). **Everything in this rule's range is unsupported** and gets no security fixes. Report it in the summary and propose the `upgrade-react-native` skill.
- **Milestones:** RN 0.76 and Expo SDK 52 (new projects) / SDK 53 (all projects) turned the New Architecture on by default. **RN 0.81 and Expo SDK 54 are the last versions that can run the old architecture.** RN 0.82 and SDK 55 ignore the opt-out.
- **Store deadlines:** Google Play requires new apps and updates to target API 36 from 31 Aug 2026 (extension to 1 Nov 2026). Old RN versions may not build against the required SDKs; say so if the app ships to the stores.
- **RN 0.82+ bare apps:** use `mobile/react-native-expo` for JS/TS, and the native-project sections of this rule for `ios/` and `android/`.
- Never use APIs newer than the installed React Native or React (React 18 below RN 0.78).

## Detect the architecture

Check in this order and report what you found:

| Signal | Old architecture | New Architecture |
|---|---|---|
| `react-native` version | < 0.76 defaults to old | ≥ 0.82 is always new |
| `android/gradle.properties` | `newArchEnabled=false` or missing (< 0.76) | `newArchEnabled=true` |
| iOS install | `pod install` without `RCT_NEW_ARCH_ENABLED=1` (< 0.76), or `RCT_NEW_ARCH_ENABLED=0` | `RCT_NEW_ARCH_ENABLED=1`, or default on ≥ 0.76 |
| Expo `app.json` / `ios/Podfile.properties.json` | `"newArchEnabled": false` | `true`, or SDK 53+ with no opt-out |
| Runtime | `global.nativeFabricUIManager` is undefined | defined (Fabric renderer) |

- Android and iOS can differ; check both.
- Bare RN CLI app: no `expo` in `package.json`, and `ios/` and `android/` are committed. Expo project with committed native folders and no `prebuild` in its scripts: treat the native folders like a bare app.

## Conventions

- Keep the architecture the project uses. Don't flip `newArchEnabled` as a side effect of another task.
- New native modules: use the Expo Modules API (works on both architectures and eases the migration). Don't add new `NativeModules`/`RCTBridgeModule` modules.
- Bare apps: edit `ios/` and `android/` by hand only in small, reviewed steps, and keep them committed. Run `cd ios && pod install` after changing native dependencies, and commit `Podfile.lock`.
- Don't install a library version that requires the New Architecture (for example `react-native-reanimated` 4.x) on an old-architecture app; pin the last compatible major and say why.
- Install versions that match the installed RN: check each library's compatibility table, and use `npx expo install` in Expo projects.
- Use the folder layout from `mobile/react-native-expo` for new files only if it fits the project; otherwise follow what's there.

## Native-module compatibility checks

Before any upgrade or New Architecture switch, build an inventory and show it to the user:

1. List native dependencies: `npx react-native config` (autolinked packages) in bare apps, `npx expo-doctor@latest` in Expo apps (it checks React Native Directory).
2. For each one, record: installed version, New Architecture support (React Native Directory, library README, changelog), the first version that supports it, and the last release date.
3. Classify each:
   - **native support** → upgrade to that version;
   - **works only through the interop layer** → acceptable for now; test it on device;
   - **unmaintained or incompatible** → find a maintained replacement and run the `dependency-vet` skill on it.
4. Search the app's own native code for Bridge-only APIs (`RCTBridgeModule`, `RCT_EXPORT_MODULE`, `ReactContextBaseJavaModule`, `requireNativeComponent`, `UIManager.dispatchViewManagerCommand`) and list them as migration work.

## Security

See `core/security-baseline` and `mobile/mobile-security`. The storage, deep-link, WebView and secrets rules in `mobile/react-native-expo` apply unchanged. Old-version specifics:

- **Metro4Shell (CVE-2025-11953):** RN ≤ 0.75 bundles `@react-native-community/cli` as a dependency (0.74 pins 13.6.4), and from 0.76 the app declares it in `devDependencies`. No line below 18 has a fix.
  - Upgrade the CLI and `cli-server-api` to 20.0.0, 19.1.2 or 18.0.1 if the project still builds; test `start`, `run-android` and `run-ios`.
  - If it can't be upgraded, never bind Metro to a non-loopback interface, firewall port 8081, and keep dev machines off untrusted networks. Tell the user the risk remains.
- **No upstream patches:** dependency advisories in RN itself or its transitive packages won't be fixed on these versions. Run `npm audit`, report what can't be fixed, and add it to the upgrade case.
- **Expo SDK < 48:** remove any `useProxy` / AuthSession redirect-proxy usage (CVE-2023-28131); use PKCE with a verified redirect.
- **Old Android defaults:** check `android:usesCleartextTraffic`, `android:allowBackup` and exported components in `AndroidManifest.xml`; check `NSAppTransportSecurity` exceptions in `Info.plist`.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed / action |
|---|---|---|
| CVE-2025-11953 / GHSA-399j-vxmf-hjvr "Metro4Shell" (CVSS 9.8, exploited, CISA KEV) | `@react-native-community/cli` and `cli-server-api` 4.8.0 – 20.0.0-alpha.2 | 20.0.0, 19.1.2, 18.0.1; nothing below 18 |
| CVE-2020-1920 / GHSA-7f53-fmmv-mfjv: ReDoS in `react-native` | 0.59.0 – 0.62.2, 0.63.0 – 0.64.0 | 0.62.3, 0.64.1 |
| CVE-2020-6506 / GHSA-36j3-xxf7-4pqg: Android WebView universal XSS | `react-native-webview` < 11.0.0 | 11.0.0 |
| CVE-2023-28131 / GHSA-wr5g-q49g-548w: AuthSession redirect-proxy account takeover | `expo` < 48 | 48; stop using the proxy |
| Unsupported release lines | RN ≤ 0.85, Expo SDKs before the supported window | Upgrade; no backported fixes |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

Use the `upgrade-react-native` skill; ship and verify each step on its own.

1. **Inventory** native dependencies and Bridge-only native code (see above). Replace unmaintained libraries first, on the current version.
2. **Patch** to the latest release of the current RN minor (or Expo SDK).
3. **Upgrade one version at a time** to RN 0.81 / Expo SDK 54: one RN minor per step for bare apps (Upgrade Helper diff), one Expo SDK per step for Expo apps (`npx expo install expo@^<next> --fix`).
4. **Turn on the New Architecture on 0.81 / SDK 54:**
   - bare Android: `newArchEnabled=true` in `android/gradle.properties`;
   - bare iOS: `RCT_NEW_ARCH_ENABLED=1 bundle exec pod install` (or `pod install`);
   - Expo: remove `"newArchEnabled": false` from app config, then `npx expo prebuild --clean` in CNG projects.
   Test every screen that uses a native library on real iOS and Android devices.
5. **Move past 0.82 / SDK 55**, then keep going one version at a time to the current RN 0.88 / Expo SDK 58.
6. **Bare apps (optional):** add Expo modules with `npx install-expo-modules@latest` to use the Expo SDK and Expo Modules API, and consider CNG later as its own project.
7. Then follow `mobile/react-native-expo`.

## Testing

- Before any refactor or upgrade step, add characterization tests for the screens and native-module calls you'll touch (Jest with `@testing-library/react-native`; the `react-native` Jest preset or `jest-expo`).
- Keep a manual device checklist for native features (camera, push, deep links, payments, biometrics) and run it on iOS and Android after every step.
- E2E (Detox or Maestro) selects by `testID`.

## Before you finish

```sh
npx tsc --noEmit                         # if TypeScript
npx eslint .
npx jest
npm audit --audit-level=moderate
npm ls react-native @react-native-community/cli @react-native-community/cli-server-api
(cd android && ./gradlew assembleRelease)
(cd ios && pod install) && npx react-native run-ios --mode Release   # CLI < 11: --configuration Release; Expo: npx expo run:ios --configuration Release
```
