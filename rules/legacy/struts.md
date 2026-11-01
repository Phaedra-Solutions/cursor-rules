---
id: legacy/struts
title: Apache Struts 1 and 2
description: Maintaining and containing Apache Struts applications - Struts 1 (EOL 5 Apr 2013, last release 1.3.10 in 2008, no jakarta path) and Struts 2 (2.3 and 2.5 EOL; 6.x maintenance with 6.12.0; 7.x current with 7.4.0 on Java 17 and Jakarta Servlet 6) - the OGNL, file-upload and DoS advisory history (S2-066/067 upload path traversal, S2-068 to S2-078 in 2025-2026), safe configuration (devMode off, strict method invocation, excluded parameters, Action File Upload), containment for EOL versions (WAF rules, input filtering, isolating the component), and the replacement strategy. Use when the project depends on struts-core, struts:struts or struts2-core.
applies_to: "maven:org.apache.struts:struts2-core >=2.0 <8"
globs: ["struts*.xml", "**/struts*.xml", "struts-config*.xml", "**/WEB-INF/struts-config*.xml", "**/WEB-INF/web.xml", "**/*Action.java", "**/*Form.java", "pom.xml", "build.gradle*"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://struts.apache.org/releases.html
  - https://struts.apache.org/eol-versions.html
  - https://struts.apache.org/struts1eol-announcement.html
  - https://cwiki.apache.org/confluence/display/WW/Security+Bulletins
  - https://cwiki.apache.org/confluence/display/WW/S2-067
  - https://cwiki.apache.org/confluence/display/WW/S2-075
  - https://cwiki.apache.org/confluence/display/WW/Struts+6.x.x+to+7.x.x+migration
  - https://struts.apache.org/core-developers/action-file-upload
  - https://struts.apache.org/security/
  - https://repo1.maven.org/maven2/org/apache/struts/struts2-core/maven-metadata.xml
  - https://osv.dev/list?ecosystem=Maven&q=struts
---

# Apache Struts 1 and 2

Also apply `core/legacy-mode` and `languages/java`; Java and Spring legacy guidance is in `legacy/java-spring-boot-legacy`. Don't migrate or upgrade as part of an unrelated task.

## Version check

- Read `struts:struts` or `org.apache.struts:struts-core` (Struts 1), or `org.apache.struts:struts2-core` and its plugins (`struts2-json-plugin`, `struts2-rest-plugin`, `struts2-convention-plugin`, `struts2-spring-plugin`), plus Java and the servlet container. State them:

  ```text
  Applying legacy/struts (struts2-core 6.11.0, json and rest plugins, Java 11, Tomcat 9).
  ```

- **Status (Oct 2026):**
  - **Struts 7.x:** current; **7.4.0** (Oct 2026). Needs Java 17+ and Jakarta Servlet 6 (Tomcat 10.1+), and renames `com.opensymphony.xwork2` packages.
  - **Struts 6.x:** maintenance line; **6.12.0**. Runs on `javax.servlet` containers.
  - **Struts 2.5.x:** EOL 30 Oct 2023; **2.3.x:** EOL 12 Sep 2019.
  - **Struts 1.x:** EOL 5 Apr 2013; last release 1.3.10 (Dec 2008). No fixes, no Jakarta version, no upgrade path except replacement.
- Report EOL lines in every change summary and offer the `migrate-struts` skill.

## Conventions

- Keep the existing structure (Actions, ActionForms or action properties, `struts.xml` / `struts-config.xml`, JSP/Tiles); don't introduce a second web framework inside the same request path without a migration plan.
- New features on EOL Struts: build them outside Struts (a separate service or a new module on Spring Boot) behind the same gateway when the team agrees; that's the strangler path.
- No new dependencies that need a newer Java or servlet API than the container runs.

## Security

### Safe maintenance (Struts 2)

- Upgrade to **7.4.0** or, on the 6.x line, **6.12.0**: both fix S2-075 to S2-078. On 2.5, move to 6.x (`javax`) first; it's the smaller step.
- Configuration that limits OGNL and binding:
  - `struts.devMode=false` in every deployed environment;
  - `struts.enable.DynamicMethodInvocation=false` and Strict Method Invocation (`strict-method-invocation="true"` with explicit `allowed-methods`);
  - keep the default `excludedClasses`, `excludedPackageNames` and parameter exclusions; don't widen `struts.allowlist` or OGNL member access;
  - accept only declared parameters (`ParametersInterceptor` with `acceptParamNames`/`@StrutsParameter` on 6.4+/7.x);
  - never evaluate user input as OGNL (`%{...}` with request data in tags, `ValueStack.findValue` on input).
- **File uploads:** use the **Action File Upload** interceptor (`actionFileUpload`) and `UploadedFilesAware` on 6.4+; the old `FileUploadInterceptor` path is what S2-066/S2-067 exploited. Limit size and count (`struts.multipart.maxSize`, `maxFiles`), allowlist types and extensions, and store files outside the web root with generated names.
- **Legacy RESTful action mapper:** don't use `RestfulActionMapper`/`Restful2ActionMapper` (S2-075, OGNL injection); use the REST plugin's mapper or remove it.
- **Request bodies:** cap JSON and REST plugin body sizes and CSP report sizes (S2-072, S2-073, S2-077) at the proxy as well.

### Containment (Struts 1, Struts 2.3/2.5, or any version you can't upgrade yet)

- **Isolate the component:** run it on its own host or container with no direct internet exposure, behind a reverse proxy or gateway; separate database credentials with least privilege; no outbound network access except what it needs.
- **WAF and gateway rules:** block OGNL and expression patterns (`%{`, `${`, `#_memberAccess`, `@java.lang`, `class.classLoader`, `(#`), parameter names with `class`, `Class`, `classLoader` or dots outside the expected form fields, path traversal in multipart filenames, and oversized bodies. Use the vendor's managed Struts rule set where available.
- **Input filtering:** a servlet filter that rejects parameter names not in an allowlist per action (Struts 1 `ActionForm` binding uses Commons BeanUtils; the `class.classLoader` manipulation class of attacks, CVE-2014-0114, targets it); validate every field type and length.
- **Struts 1 specifics:** keep the Validator plugin on for every form (CVE-2016-1181/1182, CVE-2015-0899 are validator and `ActionForm` reuse issues), never share `ActionForm` instances across requests, and remove the Tiles and Extras components if unused (CVE-2023-49735, CVE-2025-54656).
- **Monitoring:** alert on 4xx/5xx spikes, OGNL patterns in logs and unexpected child processes from the JVM.
- Commercial extended support exists for EOL Struts (vendor patched builds); mention it, don't decide for the user.

## Known vulnerabilities

| Bulletin | CVE | Issue | Fixed in |
| --- | --- | --- | --- |
| S2-075 | CVE-2026-104711 | OGNL injection in the legacy RESTful action mapper (RCE) | 7.4.0, 6.12.0 |
| S2-076 | CVE-2026-104712 | Response amplification rendering `BigDecimal` properties in tags | 7.4.0, 6.12.0 |
| S2-077 | CVE-2026-104713 | Unbounded REST request body read (DoS) | 7.4.0, 6.12.0 |
| S2-078 | CVE-2026-104714 | Shared message formatter leaks another user's date/time value | 7.4.0, 6.12.0 |
| S2-070–S2-074 | CVE-2026-73631 … CVE-2026-73635 | JSON plugin shared state, unbounded JSON and CSP report reads, locale cache growth | 7.3.0, 6.11.0 |
| S2-069 | CVE-2025-68493 | XXE in XWork | 6.1.1 |
| S2-068 | CVE-2025-64775 | Multipart file leak, disk exhaustion | 7.1.1, 6.8.0 |
| S2-067 | CVE-2024-53677 | File upload path traversal (critical) | 6.4.0 with Action File Upload |
| S2-066 | CVE-2023-50164 | File upload path traversal (critical) | 6.3.0.2, 2.5.33 |

Struts 1 has unfixed advisories (CVE-2016-1181, CVE-2016-1182, CVE-2015-0899, CVE-2023-34396, CVE-2023-49735 in Tiles, CVE-2025-54656 in Extras, CVE-2014-0114 via BeanUtils); EOL 2.3/2.5 lines don't get the 2025–2026 fixes.

This list goes stale; verify with the `cve-check` skill, the Struts security bulletins or OSV (Maven) before relying on it.

## Migration path

1. **Struts 2.5 → 6.x → 7.x:** follow the official migration guides one major at a time; 7.x needs Java 17, Jakarta Servlet 6 and the package renames. Re-check `struts.xml` against the new defaults.
2. **Struts 1 (and Struts 2 you want to leave):** replace the web tier, usually with Spring MVC on Spring Boot 4 (closest model: controllers, form binding, validation, JSP or Thymeleaf views). Do it incrementally with the `migrate-struts` skill: a gateway routes migrated URLs to the new app while the old one serves the rest (strangler), sharing the session or auth through the gateway or a token.
3. Move business logic out of Actions into plain services first, with tests, so the new controllers can call the same code.
4. Retire the Struts app when the last route moves; until then keep it contained.

## Testing

- Characterization tests per action (inputs, validation messages, forwards and redirects) before changing configuration or migrating.
- Security regression tests: OGNL payloads in parameter names and values, `class.classLoader` parameters, traversal in upload filenames, oversized bodies; expect rejection.

## Before you finish

```sh
./mvnw -q dependency:tree -Dincludes=org.apache.struts,struts   # which Struts artifacts and versions ship
./mvnw verify
grep -rnE "devMode\" value=\"true|DynamicMethodInvocation\" value=\"true|Restful2?ActionMapper|fileUpload\"" src/main/resources src/main/webapp 2>/dev/null
osv-scanner scan source -r .          # or the project's scanner
```
