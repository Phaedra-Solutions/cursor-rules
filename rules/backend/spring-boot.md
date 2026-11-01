---
id: backend/spring-boot
title: Spring Boot
description: Spring Boot 4.0 and 4.1 on Java 21/25 with Spring Framework 7 and Spring Security 7 - OSS support dates (3.x ended 30 Jun 2026; 4.0 ends Dec 2026), layered project layout, Bean Validation on every input, method security and a deny-by-default filter chain, minimal and secured Actuator (CVE-2026-40976), no DevTools in production, JPA and JDBC parameter binding, ProblemDetail error contracts, typed configuration, and OpenRewrite for upgrades. Use when editing Spring Boot application code or configuration.
applies_to: "maven:org.springframework.boot:spring-boot >=4.0 <5"
legacy_rule: legacy/java-spring-boot-legacy
globs: ["src/main/java/**", "src/main/kotlin/**", "application*.{yml,yaml,properties}", "pom.xml", "build.gradle*"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://endoflife.date/spring-boot
  - https://spring.io/projects/spring-boot#support
  - https://docs.spring.io/spring-boot/reference/actuator/endpoints.html
  - https://docs.spring.io/spring-boot/reference/using/devtools.html
  - https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html
  - https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html
  - https://docs.openrewrite.org/recipes/java/spring/boot4
  - https://spring.io/security
  - https://osv.dev/vulnerability/GHSA-8v8j-3hxp-93wr
  - https://osv.dev/vulnerability/GHSA-wwpq-f5c3-7hvx
  - https://osv.dev/vulnerability/GHSA-x2r2-rvhq-2mqv
  - https://osv.dev/vulnerability/GHSA-2jrg-rf5x-568g
  - https://osv.dev/vulnerability/GHSA-cjpg-rgq5-fr37
  - https://osv.dev/vulnerability/GHSA-7m2p-62gw-p8qq
  - https://osv.dev/vulnerability/GHSA-j9f9-w8pj-32f8
---

# Spring Boot

Also apply `languages/java` (or `languages/kotlin`). Generic web security is in `core/security-baseline`; database rules in `data/postgres`.

## Version check

- Read `spring-boot-starter-parent` or the Boot plugin version, Spring Security and Java from `pom.xml`/Gradle, and state them:

  ```text
  Applying backend/spring-boot (Spring Boot 4.1.2, Spring Framework 7.0, Spring Security 7, Java 21, Maven).
  ```

- **OSS support:** **4.1** (latest 4.1.2) to Jul 2027; **4.0** (4.0.9) to **31 Dec 2026**; **3.5 and every 3.x ended 30 Jun 2026**, 2.7 earlier → `legacy/java-spring-boot-legacy` where it exists, otherwise `core/legacy-mode`; plan the upgrade with OpenRewrite (`org.openrewrite.java.spring.boot4` recipes).
- **Minimum safe:** Boot 4.0.6+ (CVE-2026-40976, CVE-2026-40973), Spring Framework 7.0.9+, Spring Security 7.0.6+; take the latest patch of the line. Don't use 4.2 release candidates in production.

## Conventions

- Layout by feature: `com.acme.orders.{api,application,domain,infrastructure}` (controller, service, model, repository); keep controllers thin.
- Constructor injection with `final` fields; no field injection (`@Autowired` on fields).
- **Validation:** request DTOs as `record`s with Bean Validation (`@NotBlank`, `@Size`, `@Email`, `@Positive`) and `@Valid` on `@RequestBody`/`@ModelAttribute`; `@Validated` on controllers for `@PathVariable`/`@RequestParam` constraints. Never bind requests straight to JPA entities (mass assignment).
- **Errors:** RFC 9457 `ProblemDetail` responses (`spring.mvc.problemdetails.enabled=true` or a `@RestControllerAdvice` extending `ResponseEntityExceptionHandler`); no stack traces or exception messages in responses (`server.error.include-stacktrace=never`, `include-message=never`).
- **Configuration:** `@ConfigurationProperties` records with validation; profiles for environments; secrets from environment variables, Vault or a cloud secret manager, never committed `application-*.yml`.
- Transactions: `@Transactional` on service methods, read-only where possible; no remote calls inside transactions.
- Observability: Micrometer metrics and tracing; structured logging (Boot 3.4+ supports ECS/Logstash formats).

## Security

- **Filter chain:** a `SecurityFilterChain` bean with `authorizeHttpRequests` that ends in `.anyRequest().authenticated()` (or `denyAll()`); list public paths explicitly. Keep CSRF on for browser sessions; disable it only for stateless token APIs.
- **Method security:** `@EnableMethodSecurity` and `@PreAuthorize` for business rules; check ownership (`@PreAuthorize("@orders.isOwner(#id, authentication)")` or in the service) — URL rules alone aren't authorization.
- **Actuator:** expose only `health` (and `info` if needed) over HTTP: `management.endpoints.web.exposure.include=health`; put Actuator on a separate port or behind authentication; never expose `env`, `heapdump`, `threaddump`, `loggers` or `configprops` publicly. On Boot 4.0.0–4.0.5 the default filter chain had no authorization rule for Actuator endpoints (CVE-2026-40976).
- **DevTools:** `spring-boot-devtools` only as `developmentOnly`/`optional` and never in production artifacts; disable remote DevTools.
- **Data access:** Spring Data derived queries or `@Query` with bound parameters (`:name`, `?1`); `JdbcTemplate`/`JdbcClient` with `?` placeholders; never concatenate input into JPQL, SQL or `Sort.by` without an allowlist. Avoid native queries built from strings.
- **SSRF:** validate outbound URLs built with `UriComponentsBuilder` from user input against an allowlist (CVE-2026-41854).
- **Redirects:** don't redirect to unvalidated `continue`/`redirect` parameters after login (CVE-2026-41706).
- **Uploads:** set `spring.servlet.multipart.max-file-size`/`max-request-size`; patch Framework for multipart smuggling (CVE-2026-41853).
- **Serialization:** Jackson without default typing; `spring.jackson.deserialization.fail-on-unknown-properties=true` for strict APIs.
- **CORS:** explicit `allowedOrigins`; never `*` with credentials.

## Known vulnerabilities (as of 2026-10)

| Advisory | Component | Fixed |
|---|---|---|
| CVE-2026-40976: default filter chain has no authorization rule for Actuator | spring-boot 4.0.0–4.0.5 | 4.0.6 |
| CVE-2026-40973: predictable temp directory accepted without ownership check | spring-boot 4.0, 3.5 | 4.0.6 / 3.5.14 (3.4 and older unfixed) |
| CVE-2026-41706: open redirect after login; CVE-2026-22747: X.509 impersonation | spring-security | 7.0.6 / 6.5.11 |
| CVE-2026-41853 (multipart smuggling), CVE-2026-41854 (SSRF via `UriComponentsBuilder`), CVE-2026-41843 (static resource path traversal) and related June 2026 fixes | spring-webmvc / spring-web | 7.0.8 / 6.2.19 |
| CVE-2026-47890: SSE stream corruption rendering fragments | spring-webmvc | 7.0.9 (6.2.x unfixed) |

This list goes stale; verify with the `cve-check` skill, spring.io/security or OSV (Maven ecosystem) before relying on it.

## Testing

- `@WebMvcTest` with `MockMvc` (or `MockMvcTester`) and `@WithMockUser` for each endpoint: 401 anonymous, 403 wrong role, 404 for another user's resource, 400 for invalid input with a `ProblemDetail` body.
- `@SpringBootTest` with Testcontainers (`@ServiceConnection`) for repository and integration tests.
- A test that Actuator endpoints other than `health` aren't reachable without authentication.

## Before you finish

```sh
./mvnw -q verify                        # or: ./gradlew check
./mvnw dependency:tree -Dincludes=org.springframework.boot,org.springframework.security   # versions at or above the minimums
./mvnw org.owasp:dependency-check-maven:check   # or the project's OSV/Dependabot scan
curl -s localhost:8080/actuator | head  # with the app running: only health (and info) listed
```
