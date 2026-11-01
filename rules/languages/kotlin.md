---
id: languages/kotlin
title: Kotlin
description: Kotlin 2.x (K2 compiler) language rules - null safety without !! on external data, data and sealed classes, coroutines with structured concurrency (no GlobalScope, cancellation, dispatchers, timeouts), kotlinx.serialization safety (no polymorphic deserialization of untrusted class names, strict JSON), Java interop platform types, and detekt plus ktlint. Use when editing .kt or .kts files.
applies_to: "any"
globs: ["**/*.kt", "**/*.kts"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://endoflife.date/kotlin
  - https://kotlinlang.org/docs/whatsnew24.html
  - https://kotlinlang.org/docs/null-safety.html
  - https://kotlinlang.org/docs/coroutines-basics.html
  - https://kotlinlang.org/docs/serialization.html
  - https://github.com/JetBrains/kotlin/releases
  - https://detekt.dev/
  - https://github.com/detekt/detekt/releases
---

# Kotlin

Language-level rules only. Android apps also apply `mobile/mobile-security` (and `mobile/android-compose` when it exists); JVM backends the framework rule. Java interop rules follow `languages/java`.

## Version check

- Read the Kotlin version from the Gradle plugin (`org.jetbrains.kotlin.*` in `libs.versions.toml` or `build.gradle.kts`), `jvmTarget`/`jvmToolchain`, and `kotlinx-coroutines`/`kotlinx-serialization` versions. State it:

  ```text
  Applying languages/kotlin (Kotlin 2.4.21, JVM toolchain 21, coroutines 1.10, kotlinx.serialization 1.8).
  ```

- Current (Oct 2026): Kotlin **2.4** (2.4.21); 2.3 and older are no longer updated. Kotlin 2.0+ uses the K2 compiler. On Kotlin 1.x, follow `core/legacy-mode` and offer an upgrade.
- Use only language and library features available in the installed version (check `@OptIn` requirements for experimental APIs and don't add opt-ins without the user's agreement).

## Conventions

- `val` over `var`; immutable collections (`List`, `Map`) at API boundaries; `data class` for values; `sealed interface` + exhaustive `when` for closed hierarchies; `value class` for typed IDs.
- **Null safety:** model absence with nullable types; handle with `?.`, `?:`, `let`. Never use `!!` on data from users, files, network, intents or Java APIs; validate and fail with a clear error instead. Treat Java platform types (`String!`) as nullable unless annotated.
- Prefer expressions (`when`, `if`) and small extension functions; avoid deep scope-function chains (`also { let { run {…} } }`) that hide control flow.
- Errors: exceptions for unexpected failures; `Result` or sealed result types for expected ones. Don't catch `CancellationException` without rethrowing.
- **Coroutines:**
  - structured concurrency: launch in a scope tied to a lifecycle (`viewModelScope`, `lifecycleScope`, a request scope, `coroutineScope {}`); never `GlobalScope`;
  - blocking calls on `Dispatchers.IO` (`withContext(Dispatchers.IO)`); CPU work on `Dispatchers.Default`; never block the main thread or use `runBlocking` in production code paths;
  - timeouts with `withTimeout`/`withTimeoutOrNull` for network and I/O;
  - cooperative cancellation: check `isActive`/`ensureActive()` in loops; clean up in `finally` with `withContext(NonCancellable)` only when needed;
  - `SupervisorJob` where child failures must not cancel siblings; handle errors with `CoroutineExceptionHandler` at the top.
- Flows: `StateFlow`/`SharedFlow` for state and events; collect with lifecycle awareness (`repeatOnLifecycle`) on Android.

## Security

- **kotlinx.serialization:** `Json { ignoreUnknownKeys = false }` (the default) for inputs you control the schema of; enable `ignoreUnknownKeys` deliberately for third-party APIs. Don't use polymorphic serialization with class discriminators chosen by untrusted input beyond a registered `SerializersModule`; never deserialize arbitrary class names.
- Never use Java native serialization (`ObjectInputStream`) on untrusted data (see `languages/java`).
- **SQL:** parameterized queries (Exposed DSL, jOOQ, Room `@Query` with bind parameters, JDBC `PreparedStatement`); never string templates (`"… WHERE id = $id"`) in SQL.
- **Processes and files:** `ProcessBuilder(listOf(...))` without a shell; normalize paths and check they stay under the base directory.
- **Randomness and crypto:** `SecureRandom` (not `kotlin.random.Random`) for tokens; platform keystores for keys.
- **Logging:** no tokens or personal data in logs or `toString()` of data classes holding secrets (override `toString` or wrap secrets in a class that masks them).

## Known vulnerabilities

- Kotlin compiler and stdlib advisories are rare; dependency advisories (Ktor, OkHttp, Jackson) are the main risk. Keep the Kotlin Gradle plugin and kotlinx libraries current.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA (Maven ecosystem) before relying on it.

## Testing

- JUnit 5 or Kotest; `kotlinx-coroutines-test` with `runTest` and a `TestDispatcher` (no real delays); Turbine for Flow assertions.
- Tests for deserialization of malformed and unexpected JSON, and for cancellation behavior.
- Property-based tests (Kotest property testing) for parsers and validators.
- Run Android lint (`./gradlew lint`) for Android modules; it catches exported components and insecure WebView settings.

## Before you finish

```sh
./gradlew check                         # compiles, tests, lint tasks
./gradlew detekt                        # detekt 1.23.x (2.0 is in alpha)
./gradlew ktlintCheck                   # if the project uses ktlint
./gradlew dependencies --configuration runtimeClasspath > /dev/null   # resolves; then the project's dependency scan
```
