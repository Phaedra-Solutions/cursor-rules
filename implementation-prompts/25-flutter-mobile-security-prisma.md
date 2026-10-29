# Prompt 25: Flutter, mobile security, Prisma

> Self-contained; safe in a fresh session. Roadmap: Phase 3, §7 (`mobile/flutter`, `mobile/mobile-security`, `data/postgres and data/orm-prisma`).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the matching `ROADMAP.md` §7 entries.
3. Research:
   - the latest Flutter and Dart versions, the Impeller status, and the Material/Cupertino package split;
   - `flutter_secure_storage`; obfuscation flags;
   - OWASP MASVS (latest), Mobile Top 10, MASWE and MASTG;
   - Prisma's latest major and its upgrade guide; `$queryRaw` safety.

## Task
1. **`rules/mobile/flutter.md`:**
   - tier P1; globs `lib/**/*.dart`, `pubspec.yaml`, `test/**/*.dart`;
   - `legacy_rule: legacy/flutter-legacy`;
   - state management: follow the project; for new projects pick Riverpod or Bloc and document the choice in `conventions/phaedra.md`.
2. **`rules/legacy/flutter-legacy.md`:** Flutter 2 / pre-null-safety; migration path (`dart migrate` status: verify).
3. **`rules/mobile/mobile-security.md`:**
   - tier P1; globs covering RN, Flutter, iOS and Android sources;
   - the controls grouped by MASVS category, with MASWE IDs and the matching MASTG tests;
   - platform specifics: Keychain, Keystore, ATS, network security config, deep links, WebViews, root/jailbreak detection (realistic expectations), release-build hardening.
4. **`rules/data/orm-prisma.md`:**
   - tier P1; globs `prisma/**`, `**/*prisma*.ts`;
   - Prisma 7 config; migrations; select only needed fields; raw-query safety; transactions; connection pooling.

## Done when
All four files exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
