# Prompt 30: P2 frontend and native mobile: Svelte, Astro, state, shadcn, SwiftUI, Compose

> Self-contained; safe in a fresh session. Roadmap: Phase 4, §6 (Frontend, Mobile), §7 (P2 essentials table), §12 (D4).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it. D4 sets the state-management defaults.
2. Read the `ROADMAP.md` §7 P2 essentials rows.
3. Research:
   - the latest Svelte and SvelteKit, Astro, TanStack Query, Zustand, Redux Toolkit and shadcn/ui CLI;
   - SwiftUI and Swift 6 concurrency;
   - Jetpack Compose with the current Kotlin, and the Android security guidance (verify which encrypted-storage APIs are current and which are deprecated).

## Task
Create these as tier P2 rules, each under 220 lines:

1. **`rules/frontend/svelte.md`** (globs `**/*.svelte`, `src/routes/**`, `svelte.config.*`, `vite.config.*`)
2. **`rules/frontend/astro.md`** (globs `**/*.astro`, `astro.config.*`, `src/pages/**`)
3. **`rules/frontend/state-and-data.md`**
   - framework-neutral React state guidance;
   - server state in TanStack Query vs client state in Zustand or Redux Toolkit, per D4;
   - cache keys, invalidation, optimistic updates;
   - no secrets or PII in persisted state.
4. **`rules/frontend/ui-shadcn-radix.md`**
   - copy-in component model (components are owned code);
   - accessibility primitives; theming through Tailwind tokens;
   - don't fork Radix behaviour.
5. **`rules/mobile/ios-swiftui.md`** (globs `**/*.swift`, `*.xcodeproj/**`, `Info.plist`)
6. **`rules/mobile/android-compose.md`** (globs `**/*.kt`, `AndroidManifest.xml`, `build.gradle*`, `res/xml/network_security_config.xml`)

Link the mobile rules to `mobile/mobile-security` instead of repeating MASVS content.

## Done when
All six rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
