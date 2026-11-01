# Prompt 28: P2 languages: Java, Kotlin, C#, Go, Dart, Swift, shell

> Self-contained; safe in a fresh session. Roadmap: Phase 4, §6 (Languages).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §6 Languages table and §5.1 (the memory-safety note).
3. For each language, research the current stable version and LTS policy, its security tooling (from §5.6), and language-specific pitfalls.

## Task
Create these as tier P2 rules, each 80–180 lines. **Language-level guidance only**; frameworks get their own rules.

| File | Globs | Must cover |
|---|---|---|
| `rules/languages/java.md` | `**/*.java`, `pom.xml`, `build.gradle*` | LTS targeting (21/25); records; null handling (Optional at boundaries); no Java native deserialization of untrusted data; XML parsers with XXE disabled; `PreparedStatement`; SpotBugs/FindSecBugs |
| `rules/languages/kotlin.md` | `**/*.kt`, `**/*.kts` | Null safety; coroutines with structured concurrency; `kotlinx.serialization` safety; detekt |
| `rules/languages/csharp.md` | `**/*.cs`, `*.csproj` | Nullable reference types on; async/await (no `.Result`); no `BinaryFormatter`; parameterized EF/ADO; Roslyn analyzers; NuGet audit |
| `rules/languages/go.md` | `**/*.go`, `go.mod` | Error wrapping; context propagation; `govulncheck`; `html/template`; `exec.Command` without a shell; `unsafe` and cgo cautions; current Go version features (verify) |
| `rules/languages/dart.md` | `**/*.dart` | Sound null safety; Dart 3 patterns; isolates; `dart analyze` lints |
| `rules/languages/swift.md` | `**/*.swift`, `Package.swift` | Swift 6 strict concurrency; Keychain; no force unwraps on external data; SwiftLint |
| `rules/languages/shell.md` | `**/*.sh`, `**/*.bash` | `set -euo pipefail`; quoting; shellcheck; no `eval`; `mktemp`; never pipe curl into a shell; portable POSIX vs bash |

Each rule's `## Version check` points to the matching legacy rule if one exists. Otherwise it says to follow `core/legacy-mode`.

## Done when
All seven rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
