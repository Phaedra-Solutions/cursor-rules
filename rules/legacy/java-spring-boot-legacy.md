---
id: legacy/java-spring-boot-legacy
title: Java 8/11/17 and Spring Boot 2.x/3.x
description: Safe maintenance of Java 8, 11 and 17 and Spring Boot 2.x and 3.x after open-source support ended (Boot 2.7 OSS EOL 30 Jun 2023, every 3.x OSS EOL by 30 Jun 2026; Spring Framework 5.3 and 6.2 OSS ended) - vendor JDK support dates, the last OSS releases and the advisories they don't fix (Spring Framework CVE-2026-47884 and CVE-2026-47890, 2026 Spring MVC and Security fixes missing on 5.3/5.8), compensating controls, commercial support options, javax versus jakarta, and the OpenRewrite migration path to Java 21/25 and Spring Boot 4. Use when the project runs Java below 21 or Spring Boot below 4.0.
applies_to: "maven:org.springframework.boot:spring-boot >=2.0 <4"
globs: ["pom.xml", "**/pom.xml", "build.gradle*", "**/build.gradle*", "src/main/java/**", "application*.{yml,yaml,properties}", ".java-version", ".sdkmanrc"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://endoflife.date/spring-boot
  - https://endoflife.date/spring-framework
  - https://endoflife.date/eclipse-temurin
  - https://endoflife.date/amazon-corretto
  - https://endoflife.date/oracle-jdk
  - https://spring.io/support-policy
  - https://spring.io/security
  - https://docs.openrewrite.org/recipes/java/spring/boot4/upgradespringboot_4_1
  - https://docs.openrewrite.org/recipes/java/migrate/jakarta/javaxmigrationtojakarta
  - https://docs.openrewrite.org/recipes/java/migrate/upgradetojava21
  - https://osv.dev/vulnerability/GHSA-pc63-qcmh-9cmg
  - https://osv.dev/vulnerability/GHSA-j9f9-w8pj-32f8
  - https://osv.dev/vulnerability/GHSA-mf92-479x-3373
  - https://www.herodevs.com/support/spring-nes
---

# Java 8/11/17 and Spring Boot 2.x/3.x

Also apply `core/legacy-mode`, `languages/java`, and the Security section of `backend/spring-boot` (filter chain, method security, Actuator exposure apply to old versions too). Don't upgrade as part of an unrelated task.

## Version check

- Read the Java release (`maven.compiler.release`, Gradle toolchain, Dockerfile base image, CI), the Boot version (parent or plugin), and the Spring Framework and Spring Security versions it manages. State them:

  ```text
  Applying legacy/java-spring-boot-legacy (Spring Boot 2.7.18, Spring Framework 5.3.39, Spring Security 5.8.16, Java 11 Temurin).
  ```

- **Spring Boot OSS support** (the last OSS release of a line is the latest you can get without a subscription):

  | Line | OSS end | Last OSS release | Commercial support ends |
  | --- | --- | --- | --- |
  | 2.7 | 30 Jun 2023 | 2.7.18 | 30 Jun 2029 |
  | 3.0–3.3 | Dec 2023 – Jun 2025 | 3.0.13 … 3.3.13 | ended or 30 Jun 2026 |
  | 3.4 | 31 Dec 2025 | 3.4.13 | 31 Dec 2026 |
  | 3.5 | 30 Jun 2026 | 3.5.16 | 30 Jun 2032 |

  Supported OSS lines are 4.0 (to 31 Dec 2026) and 4.1 (to Jul 2027). Report the line as EOL in every change summary.
- **Spring Framework:** 5.3 (Boot 2.x) OSS ended Aug 2024 at 5.3.39; 6.2 (Boot 3.4/3.5) OSS ended 30 Jun 2026 at 6.2.19. **Spring Security:** last OSS releases 5.8.16 and 6.5.11.
- Boot 2.7.18 **manages older versions** than the last OSS ones (Spring Framework 5.3.31, Spring Security 5.7.11, Tomcat 9.0.83, SnakeYAML 1.30); Boot 3.5.16 manages Framework 6.2.19 and Security 6.5.11.
- **JDK support (vendor builds):**
  - Java 8: Temurin and Corretto to Dec 2030;
  - Java 11: Temurin to Oct 2027, Corretto to Jan 2032;
  - Java 17: Temurin to Oct 2027, Corretto to Oct 2029; Oracle JDK 17 premier support ended Sep 2026.
  The JDK is supported longer than the framework; the framework is usually the bigger risk.
- **javax vs jakarta:** Boot 2.x uses `javax.*` (Java EE 8); Boot 3+ uses `jakarta.*` (Jakarta EE 9+). Don't mix them; libraries must match the namespace.

## Conventions

- Write code for the installed versions: no Java language features above the `--release` level, no Boot 3/4 APIs on Boot 2.
- Add only dependencies whose supported range includes the current Boot, Spring and Java versions; managed versions come from the Boot BOM, so overrides (`<spring-framework.version>`, `ext['...']`) need a written reason.
- Keep `WebSecurityConfigurerAdapter` code as-is on Boot 2.x unless you're migrating; on 5.8 prefer the `SecurityFilterChain` bean style for new configuration (it carries over to 6 and 7).
- Fix deprecation warnings in the code you touch (`-Xlint:deprecation`); they're the next major's removals.

## Security

- Stay on the **last release of the line** (2.7.18, 3.5.16) and patch the JDK quarterly.
- On Boot 2.7, override managed versions to the last compatible patched releases (`spring-framework.version` 5.3.39, `spring-security.version` 5.8.16, the latest Tomcat 9.0.x, Jackson 2.x and SnakeYAML) and test; record each override's reason.
- **Unfixed in OSS releases** (fixed only in Spring Framework 7.0.x or commercial builds):
  - **6.2.19 and 5.3.39:** CVE-2026-47884 (critical, improper path limitation in `XsltView`), fixed in 7.0.9;
  - **6.2.19:** CVE-2026-47890 (critical, SSE stream corruption when rendering fragments), fixed in 7.0.9;
  - **5.3.39 only:** the 2024–2026 Spring MVC and WebFlux fixes (CVE-2024-38816 and CVE-2024-38819 path traversal in functional endpoints, CVE-2025-41242 MVC path traversal, CVE-2026-41843 versioned static resources, CVE-2026-41845 XSS in `JavaScriptUtils`, CVE-2026-41853 multipart smuggling, CVE-2025-41249 annotation detection affecting method security) and CVE-2016-1000027 (`HttpInvoker` deserialization);
  - **Spring Security 5.8.16:** CVE-2026-22732 (critical, security headers not written in some conditions), CVE-2026-41706 (open redirect after login), CVE-2026-47838 (X.509 impersonation);
  - **Spring Boot 2.7.18:** CVE-2025-22235 (`EndpointRequest.to()` wrong matcher) and CVE-2026-40973 (predictable temp directory).
- **Compensating controls:**
  - don't use `XsltView`, `RouterFunctions.resources()` or file-system static resource locations with user-controlled paths; serve static files from the classpath or a CDN;
  - set security headers (HSTS, CSP, `X-Content-Type-Options`, frame options) at the proxy or gateway, not only in Spring Security;
  - expose only `health` and `info` Actuator endpoints, on a separate management port behind the network boundary; match Actuator paths explicitly instead of `EndpointRequest.to()` for unexposed endpoints;
  - validate post-login redirect targets against an allowlist; remove `HttpInvokerServiceExporter` and Java-serialization remoting;
  - set `java.io.tmpdir` to an application-owned directory with restrictive permissions;
  - add WAF rules for path traversal and request smuggling patterns in front of EOL services.
- **Commercial options:** Tanzu Spring (Broadcom) enterprise support covers 2.7 to 2029 and 3.5 to 2032; HeroDevs NES offers drop-in patched builds. Mention them when an upgrade isn't possible soon; don't decide for the user.

## Known vulnerabilities

- See the lists above. Advisories published after a line's OSS end are generally fixed only in supported or commercial releases; check each new Spring advisory against the installed line.

This list goes stale; verify with the `cve-check` skill, spring.io/security or OSV (Maven ecosystem) before relying on it.

## Migration path

1. Patch to the last release of the current line (2.7.18 or 3.5.16) and the latest JDK update; fix deprecation warnings.
2. Move the JDK first if needed (8 → 11 → 17 → 21) with OpenRewrite `org.openrewrite.java.migrate.UpgradeToJava17` / `UpgradeToJava21`; Boot 3 and 4 need Java 17+.
3. **Boot 2.7 → 3.5:** `org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_5` (includes `javax` → `jakarta` via `JavaxMigrationToJakarta`, Spring Security 6 and Hibernate 6 changes); fix what the recipe can't, run the tests.
4. **Boot 3.5 → 4.0:** `org.openrewrite.java.spring.boot4.UpgradeSpringBoot_4_0` from `rewrite-spring`; then 4.0 → 4.1 with the property migration recipe and the release notes (the full 4.1 recipe is a proprietary Moderne recipe).
5. One hop per pull request, with the `upgrade-spring-boot` skill. Recipes from `rewrite-spring` and `rewrite-migrate-java` are under the Moderne Source Available License (free to run, not OSI open source); confirm that's acceptable to the user.

## Testing

- Before upgrading, add characterization tests for security rules (which endpoints need which roles), serialization formats (Jackson), and persistence queries; these break most often across majors.
- Run the full suite and an Actuator smoke test after each hop; compare `/actuator/mappings` or startup logs for missing beans.

## Before you finish

```sh
./mvnw -q dependency:tree -Dincludes=org.springframework   # or: ./gradlew dependencies --configuration runtimeClasspath
./mvnw verify                                              # or: ./gradlew build
./mvnw org.owasp:dependency-check-maven:check              # or the project's scanner (osv-scanner, Snyk, Dependabot)
java -version
```
