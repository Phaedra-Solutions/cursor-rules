---
id: mobile/react-native-expo
title: React Native + Expo
description: React Native 0.82+ (New Architecture only) with Expo SDK 55+ and Expo Router. Folder layout with app/ for routes only, the services/apis pattern, config plugins, secure storage, deep links, EAS Update code signing and Metro4Shell. Use when editing app/, src/, components/, app.json, app.config.* or eas.json in a React Native or Expo project.
applies_to: "react-native >=0.82 <0.89, expo >=55.0 <59"
legacy_rule: legacy/react-native-old-arch
globs: ["app/**/*.tsx", "src/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "app.json", "app.config.*", "eas.json"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://reactnative.dev/blog/2026/10/19/react-native-0.88
  - https://reactnative.dev/releases/overview
  - https://reactnative.dev/blog/2025/10/08/react-native-0.82
  - https://reactnative.dev/docs/security
  - https://expo.dev/changelog/sdk-58
  - https://expo.dev/changelog/sdk-57
  - https://docs.expo.dev/versions/latest/
  - https://docs.expo.dev/router/basics/core-concepts/
  - https://docs.expo.dev/router/advanced/native-intent/
  - https://docs.expo.dev/versions/latest/sdk/securestore/
  - https://docs.expo.dev/guides/environment-variables/
  - https://docs.expo.dev/eas-update/code-signing/
  - https://docs.expo.dev/config-plugins/introduction/
  - https://docs.expo.dev/guides/new-architecture/
  - https://mas.owasp.org/MASVS/
  - https://osv.dev/vulnerability/GHSA-399j-vxmf-hjvr
  - https://advisories.gitlab.com/npm/@react-native-community/cli-server-api/CVE-2025-11953/
  - https://www.vulncheck.com/blog/metro4shell_eitw
  - https://www.cisa.gov/known-exploited-vulnerabilities-catalog
  - https://osv.dev/vulnerability/GHSA-vcc3-ghjq-m6fr
  - https://osv.dev/vulnerability/GHSA-86w9-cpqp-85rv
  - https://osv.dev/vulnerability/GHSA-mrhx-c7xc-m3w5
  - https://github.com/expo/expo/issues/52470
  - https://osv.dev/vulnerability/GHSA-wr5g-q49g-548w
  - https://osv.dev/vulnerability/GHSA-36j3-xxf7-4pqg
---

# React Native 0.88 + Expo SDK 58

## Version check

- Read `react-native`, `expo`, `expo-router`, `react` and `@react-native-community/cli` from the lockfile. This rule covers React Native 0.82+ and Expo SDK 55+, which run only on the New Architecture. Current: **RN 0.88** (19 Oct 2026, React 19.3.0, Metro 0.87) and **Expo SDK 58** (15 Oct 2026, RN 0.88).
- Support: RN 0.88 and 0.87 are Active, 0.86 is End of Cycle, and **0.85 and older get no patches**. On an unsupported version, say so in one line and suggest the `upgrade-react-native` skill.
- RN < 0.82, Expo SDK ≤ 54, or `newArchEnabled=false`: follow `legacy/react-native-old-arch`. A bare React Native CLI app (no `expo` dependency, hand-maintained `ios/` and `android/`) also follows that rule for native-project upkeep.
- Expo SDK 58 needs Node ≥ 22.13 (or ≥ 24.3), iOS 16.4+, Android 7+, Xcode ≥ 26.4, compileSdk 37 and targetSdk 36. Apps built with the iOS 27 SDK need the UIScene lifecycle, which RN 0.88 and SDK 58 provide.
- Find the routes directory: `src/app/` (current Expo default) or `app/`. Everything below says `app/` for either.
- Check whether the project uses Continuous Native Generation (CNG): `ios/` and `android/` are missing or git-ignored. With CNG, `expo prebuild` deletes and regenerates them (default since SDK 57).
- Also apply `frontend/react` and `languages/typescript`. Mobile platform security (MASVS) is in `mobile/mobile-security`.

## Conventions

### Folder structure

Follow the project's existing layout. For new projects:

```text
src/
├── app/                      # routes and _layout files only
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── (tabs)/_layout.tsx
│   ├── (tabs)/index.tsx
│   └── search/index.tsx      # export { default } from '@/features/search'
├── features/
│   └── search/               # index.tsx (screen), styles.ts, types.ts, feature components and hooks
├── components/
│   └── button/               # index.tsx, styles.ts, types.ts
├── hooks/
└── services/
    ├── apis/                 # http-client.ts, index.ts
    ├── constants/
    └── types/                # api-types.ts, form-types.ts
plugins/                      # local config plugins
```

Projects without `src/` keep the same folders at the root.

- **`app/` holds only route files and `_layout` files.** Expo Router treats every file in `app/` as a route, so never put `styles.ts`, `types.ts`, components, hooks or utilities there. The only other allowed files are Expo Router's special files (`+not-found`, `+html`, `+native-intent`, `+api` routes) and group folders like `(tabs)`.
- Route files need a default export. Keep them thin: re-export the screen from `src/features/<screen>/` and put the screen's logic, styles and types there.
- Name the screen component after the screen (`Search`), declare it as a typed arrow function and default-export it from the folder's `index.tsx` (see `conventions/phaedra`).
- Check `components/` for an existing button, input, card or modal before creating one.
- Platform-specific code goes in `.ios.tsx` / `.android.tsx` files or `Platform.select`, not scattered `Platform.OS` checks.

### Platform and native code

- New Architecture only; Hermes v1 is the default engine. Don't add Bridge-era APIs (`NativeModules` lookups for new modules). Write new native code with the Expo Modules API or as a Turbo Module.
- The Strict TypeScript API is the default since RN 0.87: import from `react-native`, never from `react-native/Libraries/*`.
- CNG projects: change native config through `app.config.ts` and config plugins (`plugins/` using `expo/config-plugins`), never by hand-editing `ios/` or `android/`; the next prebuild deletes those edits.
- Add native libraries with `npx expo install <pkg>` so the version matches the SDK. Before adding one, check React Native Directory for New Architecture support and run the `dependency-vet` skill.
- Develop with a development build (`expo-dev-client`), not Expo Go, for production apps.
- Use `react-native-safe-area-context` for insets and `expo-image` for remote images. Render long lists with `FlatList` or FlashList, not `ScrollView` + `map`.

### Styling, forms and state

- Follow the project's styling system (StyleSheet, NativeWind, Unistyles). With StyleSheet, put `StyleSheet.create` in the sibling `styles.ts`; no inline style objects except values computed at runtime.
- Every screen with inputs uses `KeyboardAvoidingView` (`behavior="padding"` on iOS) around a `ScrollView` with `keyboardShouldPersistTaps="handled"`, or the project's `react-native-keyboard-controller` equivalent. RN 0.88 deprecates `InputAccessoryView`; use `KeyboardStickyView` from `react-native-keyboard-controller` instead.
- Forms: keep Formik + Yup where the project has it. New forms use React Hook Form + Zod (see `conventions/phaedra`).
- Server state with TanStack Query; client state with Zustand in new projects, Redux Toolkit where it exists.
- Add `testID` to every interactive element and to elements shown or hidden by logic.

## API services

Every request goes through one `apis` object in `services/apis/index.ts`. Add the endpoint there first, then call it by the same name everywhere. Use the project's HTTP client (fetch wrapper or axios).

```ts
// services/apis/http-client.ts
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

export const httpClient = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL, timeout: 15_000 })

httpClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

```ts
// services/apis/index.ts
import type { ApiTypes } from '@/services/types/api-types'
import { httpClient } from './http-client'

export const apis = {
  authenticateWithFirebaseToken: ({ idToken }: ApiTypes.AuthenticateRequest) =>
    httpClient.post<ApiTypes.AuthResponse>('auth/authenticate', { idToken }),
  getProfile: () => httpClient.get<ApiTypes.Profile>('me'),
}
```

```ts
// any screen or hook
const { data } = await apis.authenticateWithFirebaseToken({ idToken })
const profile = useQuery({ queryKey: ['profile'], queryFn: async () => (await apis.getProfile()).data })
```

- ✗ calling `httpClient` or `fetch` directly from a screen; ✗ an endpoint name that differs between definition and call.
- Wrap calls in `try`/`catch` (or TanStack Query's error state), show a user-facing error, and disable the triggering control while loading.
- Parse responses the app depends on with a schema at this boundary.

## Security

See `core/security-baseline` and `mobile/mobile-security` (OWASP MASVS 2.1: STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, RESILIENCE, PRIVACY). React Native and Expo specifics:

- **Secrets:** treat the JS bundle, `app.json`/`app.config.*` `extra` and native resources as public. `EXPO_PUBLIC_*` values are inlined in plain text. Never ship API secret keys or service-role keys; call your backend instead. Keep build-only secrets in EAS environment variables with secret visibility, never in the repo.
- **Storage (MASVS-STORAGE):**
  - Tokens and credentials go in `expo-secure-store` (Keychain/Keystore), never AsyncStorage, MMKV without encryption, or files.
  - Use `keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY` for tokens and `requireAuthentication: true` for high-value secrets.
  - Keep values small (some iOS versions reject values over about 2 KB). SecureStore isn't available on web; use httpOnly cookies there.
  - Android drops SecureStore data on uninstall and it isn't a source of truth: be ready to re-authenticate. Keep it out of Auto Backup (the plugin's `configureAndroidBackup: true`) and set `android.allowBackup: false` unless backup is needed.
  - Never log tokens, PII or full API responses; device logs are readable.
- **Network (MASVS-NETWORK):** HTTPS only. Never add `NSAllowsArbitraryLoads` or Android cleartext exceptions. Consider certificate pinning (with a rotation plan) for finance, health and auth-heavy apps.
- **Deep links and universal links (MASVS-PLATFORM):**
  - Treat every incoming URL (custom scheme, universal/App Links, notification payloads) as untrusted. Validate route params with a schema in the screen before use.
  - Normalize or reject links in `+native-intent` `redirectSystemPath`; `path` may not be a valid URL, so wrap parsing in `try`/`catch` and fall back to a safe route. Cap the length of incoming URLs.
  - Never perform a state-changing action (payment, delete, follow, accept invite) straight from a link: require an authenticated session and an explicit user tap.
  - Prefer verified universal links / Android App Links (`autoVerify`) for auth callbacks; custom schemes can be claimed by other apps. Use OAuth with PKCE, never a redirect proxy, and never put tokens in URLs.
- **WebView:** `react-native-webview` ≥ 11. Restrict `originWhitelist`, allowlist navigation in `onShouldStartLoadWithRequest`, validate the origin and schema of every `onMessage` payload, and keep `allowFileAccess` and `allowUniversalAccessFromFileURLs` off.
- **OTA updates (EAS Update):**
  - Sign updates: `npx expo-updates codesigning:generate`, then `codesigning:configure`, then `eas update --private-key-path <path>`. Commit `certs/certificate.pem`; never commit the private key. Code signing needs an EAS Production or Enterprise plan; if it's unavailable, say so.
  - Set a `runtimeVersion` policy (for example `fingerprint`) so a JS update only reaches binaries with matching native code.
- **Dev server (Metro4Shell):** never expose Metro (port 8081) on shared or public networks; don't start it with `--host lan` on untrusted Wi-Fi. Keep `@react-native-community/cli` and `@react-native-community/cli-server-api` ≥ 20.0.0 (or 19.1.2 / 18.0.1) wherever they appear in the tree.
- **Release builds:** Hermes bytecode isn't obfuscation; don't hide anything in JS. Keep R8 on (default for Android release in SDK 58) and add keep rules only for libraries that need them. Request only the permissions you use, give each iOS usage string a real reason, and remove unwanted Android permissions with `android.blockedPermissions`. Use `expo-screen-capture` on screens that show secrets.

## Known vulnerabilities (as of 2026-10)

| Advisory | Affected | Fixed / action |
|---|---|---|
| CVE-2025-11953 / GHSA-399j-vxmf-hjvr "Metro4Shell": unauthenticated OS command injection via the dev server's `/open-url` (CVSS 9.8, exploited since Dec 2025, CISA KEV 5 Feb 2026) | `@react-native-community/cli` and `cli-server-api` 4.8.0 – 20.0.0-alpha.2 | 20.0.0, 19.1.2 or 18.0.1; no fixed line below 18 |
| GHSA-vcc3-ghjq-m6fr / CVE-2026-45822: `decode-uri-component` DoS on malformed percent-encoding (reached through `query-string` ← `expo-router`) | `decode-uri-component` < 0.5.0 | 0.5.0 once Expo ships it; cap incoming URL length meanwhile |
| GHSA-86w9-cpqp-85rv / CVE-2026-33894: `node-forge` RSA signature verification flaw (via `@expo/cli` → `@expo/code-signing-certificates`, CLI-side update signing) | `node-forge` ≤ 1.4.0 | No fix yet; dev tooling only, track upstream |
| GHSA-mrhx-c7xc-m3w5: `zod` memory exhaustion (low; via `@expo/cli`) | `zod` < 4.6.6 | Dev tooling only; wait for Expo, don't force overrides |
| CVE-2023-28131 / GHSA-wr5g-q49g-548w: account takeover through the Expo AuthSession redirect proxy | `expo` < 48 | Lesson: never use a redirect proxy; PKCE + verified links |
| CVE-2020-6506 / GHSA-36j3-xxf7-4pqg: Android WebView universal XSS | `react-native-webview` < 11.0.0 | 11.0.0 |

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Jest with the `jest-expo` preset and `@testing-library/react-native`. Query by role and label first (`getByRole`, `getByLabelText`); fall back to `getByTestId`.
- Test navigation with `renderRouter` from `expo-router/testing-library`.
- Unit-test the `apis` layer with a mocked HTTP client, and the deep-link parser with hostile input (unknown hosts, oversized params, malformed percent-encoding).
- E2E (Maestro or Detox) selects by `testID`; see `testing/mobile-e2e`.
- Before finishing native-affecting changes, run a release build on both iOS and Android (`npx expo run:ios --configuration Release`, `npx expo run:android --variant release`) or an EAS build.

## Before you finish

```sh
npx expo install --check
npx expo-doctor
npx tsc --noEmit
npx expo lint                 # or the project's ESLint/Biome command
npx jest                      # or npm test
npx expo export --platform ios
npx expo export --platform android   # add web if the app ships it
npm audit --audit-level=moderate
npm ls @react-native-community/cli @react-native-community/cli-server-api react-native expo
```
