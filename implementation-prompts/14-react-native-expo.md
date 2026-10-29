# Prompt 14: React Native + Expo (+ old-architecture legacy, upgrade skill)

> Self-contained; safe in a fresh session. Roadmap: Phase 2, §7 (`mobile/react-native-expo`), §5.8.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it. D4 covers forms and the component folder layout.
2. Read the `ROADMAP.md` §7 entry `mobile/react-native-expo` and the React Native row of §5.8.
3. Use the root `react-native-rules.md` as source material if it still has content.
4. Research:
   - the latest React Native and Expo SDK versions;
   - Expo Router's rules about the `app/` directory (https://docs.expo.dev/router/basics/core-concepts/);
   - `expo-secure-store`, EAS Update code signing, config plugins;
   - RN/Expo CVEs (Metro4Shell CVE-2025-11953 and anything newer).

## Task
1. **`rules/mobile/react-native-expo.md`:**
   - tier P0; globs `app/**/*.tsx`, `src/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `app.json`, `app.config.*`, `eas.json`;
   - `legacy_rule: legacy/react-native-old-arch`;
   - cover the §7 entry;
   - the folder structure, with `app/` holding routes only;
   - the `services/apis` pattern with a consistent example;
   - keyboard-avoiding views, secure storage, deep-link validation;
   - MASVS pointers (link to `mobile/mobile-security`).
2. **`rules/legacy/react-native-old-arch.md`:**
   - RN versions before the New Architecture became mandatory, and bare RN CLI apps;
   - how to detect the architecture;
   - native-module compatibility checks; known CVEs;
   - migration path.
3. **`skills/upgrade-react-native/SKILL.md`:**
   - upgrade one Expo SDK at a time (`npx expo install --fix`, the upgrade helper for bare apps);
   - New Architecture readiness checks per library;
   - `expo prebuild --clean` caveats; verify on iOS and Android;
   - EAS build smoke test.

## Done when
All three files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
