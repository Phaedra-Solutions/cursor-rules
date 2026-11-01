---
id: languages/java
title: Java
description: Java 21 and 25 LTS language rules - LTS targeting, records, sealed types and pattern matching, null handling with Optional at API boundaries, no Java native deserialization of untrusted data, XML parsers with XXE disabled, PreparedStatement, safe process execution, crypto and randomness, and SpotBugs with FindSecBugs, Error Prone and dependency checks. Use when editing .java files, pom.xml or Gradle build files.
applies_to: "any"
legacy_rule: legacy/java-spring-boot-legacy
globs: ["**/*.java", "pom.xml", "build.gradle*"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://endoflife.date/oracle-jdk
  - https://endoflife.date/eclipse-temurin
  - https://adoptium.net/support/
  - https://openjdk.org/projects/jdk/25/
  - https://openjdk.org/projects/jdk/27/
  - https://docs.oracle.com/en/java/javase/25/core/serialization-filtering1.html
  - https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html
  - https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html
  - https://spotbugs.github.io/
  - https://find-sec-bugs.github.io/
---

# Java

Language-level rules only; frameworks get their own rules (`backend/spring-boot` when it exists). Generic secure-coding rules are in `core/security-baseline`.

## Version check

- Read the Java version from `maven.compiler.release`/`<release>` in `pom.xml`, `java.toolchain.languageVersion` or `sourceCompatibility` in Gradle, `.java-version`/`.sdkmanrc`, Dockerfiles and CI, and state it:

  ```text
  Applying languages/java (Java 21, Maven, maven.compiler.release=21, Temurin in CI).
  ```

- **LTS lines (Oct 2026):** **25** (Sep 2025) and **21** (Sep 2023) are the targets for new work; 17 and 11 still get vendor updates (Temurin until Oct 2027) but are aging. **27** is the current non-LTS feature release (supported until Mar 2027); 26 is EOL. Target an LTS unless the user wants the latest features and accepts six-month upgrades.
- **Java 8, 11 or 17**, or Spring Boot 2.x: use `legacy/java-spring-boot-legacy` where it exists; otherwise follow `core/legacy-mode`.
- Compile with `--release N` so the code can't use newer APIs than the target. Use only language features of the target (records 16+, sealed classes 17+, pattern matching for `switch` 21+, virtual threads 21+, unnamed variables `_` 22+, flexible constructor bodies 25).

## Conventions

- Model data with `record`s; use `sealed` interfaces plus `switch` pattern matching for closed hierarchies so the compiler checks exhaustiveness.
- Immutability by default: `final` fields, `List.of`/`Map.of`, defensive copies at boundaries.
- **Null handling:** return `Optional<T>` from methods that may have no result (not for fields or parameters); validate inputs with `Objects.requireNonNull`; annotate with JSpecify `@Nullable`/`@NullMarked` if the project uses it.
- Exceptions: throw specific exceptions, never swallow them; use try-with-resources for every `Closeable`.
- Concurrency: prefer `java.util.concurrent` and virtual threads (21+) for blocking I/O over hand-rolled thread pools; no `synchronized` around blocking I/O on virtual threads before Java 24 (pinning).
- Logging through SLF4J with parameters (`log.info("user {}", id)`), never string concatenation of user input into log format strings.
- Build: Maven Wrapper or Gradle Wrapper committed; dependency versions in one place (BOM, version catalog); reproducible builds.

## Security

- **Deserialization:** never use `ObjectInputStream` on untrusted data. If legacy code must, set a strict `ObjectInputFilter` (JEP 290/415) allowlist. Use JSON with explicit types (Jackson without default typing: no `enableDefaultTyping`/`activateDefaultTyping` with broad validators; no `@JsonTypeInfo(use = Id.CLASS)` on untrusted input).
- **XML:** disable DTDs and external entities on every parser: `factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)` for `DocumentBuilderFactory`, and the equivalent for `SAXParserFactory`, `XMLInputFactory` (`SUPPORT_DTD=false`), `TransformerFactory` and `SchemaFactory` (`ACCESS_EXTERNAL_DTD`/`ACCESS_EXTERNAL_SCHEMA` = `""`).
- **SQL:** `PreparedStatement` with `?` parameters, or the ORM's bound parameters; never concatenate input into SQL, JPQL or HQL. Identifiers from allowlists.
- **Processes:** `ProcessBuilder` with an argument list; never `Runtime.exec(String)` or `sh -c` with user input.
- **Paths:** `Path.normalize()` then `startsWith(base)` on the real path; reject archive entries that escape the target directory (zip slip).
- **Crypto:** `SecureRandom` for tokens; AES/GCM with a unique 12-byte IV; no `Cipher.getInstance("AES")` (defaults to ECB); passwords with bcrypt/argon2/PBKDF2 via a maintained library; keys from a keystore or secret manager.
- **Templates and expressions:** no SpEL, OGNL, MVEL or script engines (`ScriptEngineManager`) on user input.
- **Reflection:** no `Class.forName` with user-controlled names.
- **TLS:** never install trust-all `TrustManager`s or `HostnameVerifier`s.

## Known vulnerabilities

- Keep the JDK on the latest quarterly Critical Patch Update for its line (January, April, July, October releases).
- Library advisories (Jackson, XStream, Log4j, Spring, Commons) dominate Java risk: run the dependency scanner below; Log4Shell (CVE-2021-44228) is still found in old builds.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA (Maven ecosystem) before relying on it.

## Testing

- JUnit 5 with AssertJ; Testcontainers for database and broker integration tests.
- Tests for parsers that feed XXE payloads (`<!DOCTYPE … SYSTEM "file:///etc/passwd">`) and for path handling with `../`.

## Before you finish

```sh
./mvnw -q verify                         # or: ./gradlew check
./mvnw com.github.spotbugs:spotbugs-maven-plugin:check   # with the FindSecBugs plugin configured
./mvnw org.owasp:dependency-check-maven:check            # or the project's OSV/Snyk/Dependabot scan
osv-scanner scan source -r .             # if available
```
