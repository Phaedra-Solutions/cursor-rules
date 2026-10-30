---
id: legacy/cordova
title: Apache Cordova apps
description: Maintaining Apache Cordova (and PhoneGap-era) hybrid apps - current platform releases (cordova 13, cordova-android 15.1 targeting API 36, cordova-ios 8.1), keeping platforms current to meet Google Play and App Store build requirements, the plugin ecosystem risk (abandoned plugins, cordova-plugin-inappbrowser CVE-2026-47430), Content Security Policy, the allow-list and allow-navigation, WebView and bridge hardening, and the migration path to Capacitor 8 with the migrate-cordova skill. Use when a project has config.xml with a widget root, cordova platforms or cordova-plugin-* dependencies.
applies_to: "cordova-android >=9.0 <16"
globs: ["config.xml", "**/config.xml", "www/**", "platforms/**", "plugins/**", "package.json"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://cordova.apache.org/blog/
  - https://cordova.apache.org/announcements/2026/07/22/cordova-android-15.1.0.html
  - https://cordova.apache.org/docs/en/latest/guide/platforms/android/
  - https://cordova.apache.org/docs/en/latest/guide/appdev/allowlist/index.html
  - https://www.npmjs.com/package/cordova-ios
  - https://osv.dev/vulnerability/GHSA-q42j-x8rq-pjg6
  - https://capacitorjs.com/docs/cordova/migrating-from-cordova-to-capacitor
  - https://capacitorjs.com/docs/plugins/cordova
  - https://developer.android.com/google/play/requirements/target-sdk
  - https://developer.apple.com/news/upcoming-requirements/
---

# Apache Cordova apps

Also apply `core/legacy-mode`, `mobile/mobile-security`, and the frontend rule for the web layer (`frontend/angular`, `frontend/react`, `frontend/vue`). Ionic apps on Capacitor are not legacy; this rule is for Cordova builds. Don't migrate as part of an unrelated task.

## Version check

- Read `cordova` (CLI), `cordova-android`, `cordova-ios` and every `cordova-plugin-*` from `package.json` and `config.xml`, plus `android-targetSdkVersion` and Xcode in CI. State them:

  ```text
  Applying legacy/cordova (cordova 13.0, cordova-android 15.1 targetSdk 36, cordova-ios 8.1, 14 plugins, Ionic 6 web layer).
  ```

- **Status (Oct 2026):** Cordova is maintained but slow-moving: CLI **13.0.0**, **cordova-android 15.1.0** (Jul 2026, targets API 36), **cordova-ios 8.1.1** (Jul 2026). Many third-party plugins are unmaintained.
- **Store requirements:** Google Play updates must target **API 36** from 31 Aug 2026 (cordova-android 15+); the App Store requires builds with **Xcode 26** since 28 Apr 2026 (use cordova-ios 8 and check each plugin builds). Older platform versions can't ship updates.

## Conventions

- Keep platforms and plugins in `package.json` with exact versions; don't commit `platforms/` or `plugins/` (regenerate with `cordova prepare`).
- Platform upgrades: `cordova platform rm android && cordova platform add android@15.1.0`, then rebuild and retest every plugin.
- New native features: prefer maintained plugins (Apache `cordova-plugin-*` or well-maintained community ones); check last release and open issues before adding (`dependency-vet`).

## Security

- **Content Security Policy** in `index.html` via `<meta http-equiv="Content-Security-Policy">`: `default-src 'self'`, explicit `connect-src` for APIs, no `'unsafe-eval'`, `'unsafe-inline'` only where the framework truly needs it.
- **Allow-list:** in `config.xml`, `<access origin>` only for API hosts, `<allow-navigation>` only for your own origins (never `*`), `<allow-intent>` limited to `tel:`, `mailto:`, `https:` as needed.
- **Bridge exposure:** any page loaded in the main WebView can call every installed plugin; never load remote or user-controlled content in the main WebView. Remove unused plugins.
- **InAppBrowser:** update `cordova-plugin-inappbrowser` to **6.0.1+** (CVE-2026-47430, critical: web content in the InAppBrowser can trigger pending Cordova callbacks on iOS); open untrusted pages in the system browser (`_system`) instead.
- **Storage:** tokens in the Keychain/Keystore through a maintained secure-storage plugin, not `localStorage` or files.
- **Network:** HTTPS only; Android `cleartextTrafficPermitted` false; iOS ATS on; no certificate-validation bypass plugins in release builds.
- **Release builds:** `android:debuggable` false, WebView debugging off, source maps not shipped, release signing keys outside the repo.

## Known vulnerabilities

- `cordova-plugin-inappbrowser`: CVE-2026-47430 (critical), fixed in 6.0.1.
- `cordova-android`: one older advisory in OSV; keep the platform current for WebView and target-SDK fixes. Unmaintained plugins often embed outdated native libraries; check them individually.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Migration path

1. Inventory plugins and find the Capacitor equivalent for each (official `@capacitor/*` plugins, community plugins, or keep the Cordova plugin: Capacitor runs many Cordova plugins unchanged).
2. Add Capacitor 8 to the same project (`npx cap init`, `npx cap add android`, `npx cap add ios`); the native `android/` and `ios/` folders become source-controlled projects.
3. Replace plugins one at a time, keeping the web layer unchanged; move `config.xml` preferences to `capacitor.config.ts` and native project settings.
4. Use the `migrate-cordova` skill; ship the Capacitor build as an update with the same bundle ID, package name and signing key.

## Testing

- Device tests for each plugin-backed feature (camera, files, push, deep links) before and after any platform or plugin update.
- CSP and allow-list checks: navigation to a non-allowed host is blocked; external links open in the system browser.

## Before you finish

```sh
npx cordova requirements
npx cordova build android --release && npx cordova build ios --release
npm ls --depth=0 | grep cordova-plugin
npm audit --audit-level=moderate
grep -nE '<allow-navigation href="\*"|<access origin="\*"' config.xml
```
