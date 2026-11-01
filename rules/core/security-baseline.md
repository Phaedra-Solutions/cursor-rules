---
id: core/security-baseline
title: Security baseline
description: Always-on secure coding rules for any stack, grouped by OWASP Top 10:2025 with related 2025 CWE Top 25 IDs.
applies_to: "any"
globs: []
alwaysApply: true
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://top10.owasp.org/2025/
  - https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/
  - https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/
  - https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html
  - https://asvs.owasp.org/
  - https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions.html
  - https://github.com/cosai-oasis/project-codeguard
  - https://nvd.nist.gov/vuln/detail/CVE-2025-68664
  - https://docs.stripe.com/webhooks/signature
  - https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
  - https://github.com/cure53/DOMPurify
---

# Security baseline

Apply to all code you write or review. Stack rules add stack-specific checks; this rule doesn't repeat them. Report every violation you find in one line (see `core/behavior`). Parts are adapted from Project CodeGuard (CC BY 4.0); see `NOTICE.md`.

Treat everything from outside the process as untrusted: request params, headers, cookies, bodies, files, webhooks, queue messages, third-party API responses and LLM output.

## A01 Broken Access Control

CWE-862, 863, 284, 639, 22, 352, 918, 200. SSRF is part of A01 in the 2025 list.

- Deny by default. Check authentication **and** authorization on the server in every route, Server Action, resolver, RPC handler, job and webhook.
- Check object-level access: load resources through queries scoped to the caller's user or tenant.
- Never trust client-sent IDs, roles, prices or ownership flags. Derive identity from the verified session or token.
- Bind only allowlisted fields from request bodies (DTOs or schemas); never mass-assign into models. Return only the fields the caller may see.
- Protect cookie-authenticated, state-changing requests against CSRF (framework token, or `SameSite` plus an `Origin` check). Never change state on `GET`.
- Resolve user-supplied paths against a fixed base directory and reject any path that escapes it. Prefer server-generated names.
- For user-supplied URLs (SSRF): allowlist scheme and host, resolve DNS and block private, loopback, link-local and cloud metadata addresses (e.g. `169.254.169.254`), and re-check every redirect or disable redirects.

```ts
// ✗ any signed-in user can read any invoice
const invoice = await db.invoice.findUnique({ where: { id } })

// ✓ scoped to the caller's org; not found otherwise
const invoice = await db.invoice.findFirst({ where: { id, orgId: session.orgId } })
if (!invoice) throw new NotFoundError()
```

## A02 Security Misconfiguration

- No debug mode, verbose error pages or dev servers in production. Never expose a dev server on a public interface.
- CORS: an explicit origin allowlist. Never reflect an arbitrary `Origin`, and never combine `*` with credentials.
- Send security headers: a nonce- or hash-based CSP, HSTS, `X-Content-Type-Options: nosniff`, `frame-ancestors` and a `Referrer-Policy`.
- No default credentials or sample accounts. Disable or protect admin panels, actuators, metrics and debug endpoints.
- Give service accounts, database users, cloud roles and API tokens least privilege.

## A03 Software Supply Chain Failures

- Follow `core/supply-chain`. Never add a dependency without confirming it exists, is maintained and is needed.

## A04 Cryptographic Failures

- Use TLS for all network traffic. Never disable certificate verification (`rejectUnauthorized: false`, `verify=False`, `InsecureSkipVerify: true`).
- Use vetted libraries and platform APIs. Never implement your own crypto primitives or protocols.
- Hash passwords with Argon2id, scrypt or bcrypt. Never use plain or fast hashes for passwords.
- Generate tokens, IDs, nonces and reset codes with a CSPRNG (`crypto.randomBytes`, `crypto.randomUUID`, Python `secrets`). Never use `Math.random` or `random`.
- Never use MD5, SHA-1, DES, 3DES, RC4 or ECB mode for security. Prefer AES-GCM or ChaCha20-Poly1305.
- Never put secrets in source, committed config, client bundles, logs or error messages, or in public-prefixed env vars (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`). Load them from the environment or a secret manager.
- If you see a hardcoded secret (`AKIA…`, `sk_live_…`, `ghp_…`, `-----BEGIN … PRIVATE KEY-----`, a URL with `user:pass@`), report it and tell the user to rotate it. Don't repeat the value.

## A05 Injection

CWE-79, 89, 78, 77, 94, 20.

- Use parameterized queries or ORM bindings only. Never build SQL or NoSQL queries from strings. Allowlist dynamic identifiers such as sort columns. Never pass input to raw "unsafe" APIs (e.g. Prisma `$queryRawUnsafe`).
- Don't invoke a shell. Run executables with an argument array (`execFile`, `spawn` without `shell: true`, `subprocess.run([...])`) and allowlist arguments.
- Never pass input to `eval`, `new Function`, dynamic `import()`, template compilation or `vm`.
- Rely on framework auto-escaping. Avoid `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`, `bypassSecurityTrust*` and `|safe`. If raw HTML is required, sanitize it with a maintained sanitizer such as DOMPurify.
- Encode output for its context (HTML, attribute, URL, JavaScript, CSV). Strip CR/LF from values that go into headers or logs.
- Validate input with a schema at every trust boundary (type, format, length, range; allowlist, not denylist). Validation adds to parameterization and encoding; it doesn't replace them.

```ts
// ✗ input concatenated into SQL and a shell
await db.query(`SELECT * FROM users WHERE email = '${email}'`)
exec(`convert ${file} out.png`)

// ✓ bound parameter; argument array, no shell
await db.query('SELECT * FROM users WHERE email = $1', [email])
execFile('convert', [file, 'out.png'])
```

## A06 Insecure Design

CWE-434; also CWE-770.

- Before building a feature that touches auth, money, files or personal data, list its abuse cases in one line each.
- Rate-limit and set quotas on login, OTP, password reset, signup, search, and expensive or LLM-backed endpoints.
- Bound everything: body size, upload size, page size, array length, nesting depth, regex input length and timeouts.
- Uploads: check type by content (magic bytes) and extension against an allowlist, cap the size, generate the stored name, and keep files outside the web root or in private storage.
- Enforce business rules (prices, quantities, state transitions) on the server, never only in the client.

## A07 Authentication Failures

CWE-306.

- Use proven auth providers and libraries. Never hand-roll password storage, sessions or JWT verification.
- Verify JWTs with an explicit algorithm allowlist (never `none`) and check `iss`, `aud` and `exp`. Never put secrets in a JWT payload.
- Set session cookies `HttpOnly`, `Secure` and `SameSite=Lax` or `Strict`, with a narrow `Path` and `Domain`.
- Rotate the session on login and privilege change. Invalidate it on logout and password change. Set idle and absolute timeouts.
- Support MFA. Throttle login attempts. Use the same error message for unknown users and wrong passwords.
- Require authentication for every critical function, including internal, admin and webhook endpoints.

## A08 Software or Data Integrity Failures

CWE-502.

- Never deserialize untrusted data with native serializers: Python `pickle` or `yaml.load` (use `yaml.safe_load`), Java `ObjectInputStream`, PHP `unserialize`, .NET `BinaryFormatter`, LangChain `load`/`loads` on untrusted input (CVE-2025-68664). Prefer JSON plus schema validation.
- Verify webhook signatures on the raw body before processing (e.g. Stripe `constructEvent`). Use constant-time comparison and a timestamp tolerance.
- Load third-party scripts with Subresource Integrity (`integrity` + `crossorigin`), or self-host them.
- Verify checksums or signatures on downloaded artifacts and updates.

## A09 Security Logging and Alerting Failures

- Log security events as structured records: logins (success and failure), MFA, password resets, authorization denials, admin actions and permission changes.
- Include timestamp, request ID, actor ID, action, resource and result.
- Never log secrets, tokens, passwords, session IDs, card numbers or unneeded personal data. Redact them.
- Make failures alertable: emit events or metrics monitoring can alert on. Never swallow errors silently.

## A10 Mishandling of Exceptional Conditions

CWE-476.

- Fail closed. If an auth, permission, validation or payment check throws, deny.
- Never send stack traces, SQL errors, internal paths or versions to clients. Return a generic message with a request ID and log the detail on the server.
- Handle every exception and promise rejection. Add global handlers (framework exception filters, error boundaries, `unhandledRejection`) that log and fail safely.
- Check for null and undefined before use; enable strict null checks where the language supports them.
- Give every external call (HTTP, database, queue, LLM) a timeout, bounded retries with backoff, and cleanup (release locks, close connections, roll back transactions). Keep state consistent after partial failure with transactions or compensating actions.

## More detail

- Verification requirements: OWASP ASVS 5.0.
- Writing secure instructions for AI assistants: the OpenSSF *Security-Focused Guide for AI Code Assistant Instructions*.
- Topic depth: Project CodeGuard's `sources/rules/core` and `sources/rules/owasp`.
- Memory-safety CWEs (787, 416, 125, 120, 121, 122): `languages/c-cpp` and the `unsafe`/cgo sections of language rules.
- Agent behavior while coding: `core/agent-safety`. LLM and agent features: `ai/*`.
