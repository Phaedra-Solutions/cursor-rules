---
id: ai/mcp-servers
title: Building MCP servers
description: Building Model Context Protocol servers (spec 2026-07-28, TypeScript, Python and FastMCP SDKs) - OAuth 2.1 resource-server rules for remote servers (protected resource metadata, audience-bound tokens, no token passthrough, scope challenges), per-tool scopes, JSON Schema input validation, no shell passthrough, output sanitization, honest and stable tool descriptions, Origin checks and localhost binding, stdio risks, rate limits, audit logs and protocol versioning. Use when editing MCP server code.
applies_to: "any"
globs: ["**/mcp/**", "**/*mcp*server*.{ts,py}", "**/*-mcp/**", "**/mcp-*/**"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://blog.modelcontextprotocol.io/posts/2026-07-28/
  - https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
  - https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices
  - https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http
  - https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio
  - https://modelcontextprotocol.io/specification/2026-07-28/server/tools
  - https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning
  - https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks
  - https://www.npmjs.com/package/@modelcontextprotocol/server
  - https://pypi.org/project/mcp/
  - https://osv.dev/vulnerability/GHSA-rvq5-wwqv-78pq
  - https://osv.dev/vulnerability/GHSA-w4fh-qvv9-3v23
  - https://osv.dev/vulnerability/GHSA-w48q-cv73-mx4w
  - https://osv.dev/vulnerability/GHSA-9h52-p55h-vw2f
  - https://osv.dev/vulnerability/GHSA-345p-7cg4-v4c7
  - https://osv.dev/vulnerability/GHSA-46jr-4wx8-v453
  - https://osv.dev/vulnerability/GHSA-f897-62hf-6gxq
  - https://osv.dev/vulnerability/GHSA-jpw9-pfvf-9f58
  - https://osv.dev/vulnerability/GHSA-84m7-p3x7-pcfv
  - https://osv.dev/vulnerability/GHSA-m8x7-r2rg-vh5g
  - https://osv.dev/vulnerability/GHSA-rww4-4w9c-7733
  - https://osv.dev/vulnerability/GHSA-7xgj-8392-5q4r
  - https://osv.dev/vulnerability/GHSA-6xpm-ggf7-wc3p
---

# Building MCP servers

This rule is for MCP servers you build and ship. For MCP servers you connect to while coding, see `core/agent-safety`; for agent loops that consume tools, see `ai/agents`.

## Version check

- Read the SDK and its version: TypeScript `@modelcontextprotocol/server` / `@modelcontextprotocol/client` 2.x (current 2.4.0) or the older single package `@modelcontextprotocol/sdk` 1.x (1.32.2); Python `mcp` 2.x (2.3.0) or 1.x; `fastmcp` (4.1.4). State it and the protocol version the server negotiates:

  ```text
  Applying ai/mcp-servers (@modelcontextprotocol/server 2.4.0, protocol 2026-07-28, Streamable HTTP, OAuth).
  ```

- **Protocol 2026-07-28** (current): stateless core (no `initialize` handshake or `Mcp-Session-Id`; each request carries version and capabilities in `_meta`), `Mcp-Method`/`Mcp-Name` headers, Multi Round-Trip Requests instead of server-to-client requests, Client ID Metadata Documents instead of Dynamic Client Registration (deprecated), and Roots, Sampling, Logging and the old HTTP+SSE transport deprecated with at least 12 months' support. **2025-11-25** and earlier use sessions; keep the session rules of that version if the server still speaks it.
- Below the fixed SDK versions in Known vulnerabilities, upgrade before adding features.

## Conventions

- One tool per well-defined operation (`create_invoice`, `list_open_tickets`), not a generic `run_query`, `http_request` or `execute` tool. Fewer, narrower tools are safer and easier for models to use.
- Tool names follow the spec's token syntax; keep them stable. Descriptions say exactly what the tool does, what it can change, and what it returns. No instructions to the model beyond describing the tool ("always call this first", "don't tell the user" are tool-poisoning patterns).
- Every tool declares an `inputSchema` with `additionalProperties: false`, types, formats, `maxLength`, ranges and enums; validate inputs on the server against it before doing anything (the SDK's schema helpers, Zod or Pydantic). Add an `outputSchema` and return `structuredContent` where clients use it.
- Set tool annotations honestly (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`). Clients treat them as hints from untrusted servers; never rely on them for security.
- Keep business logic in your service layer; the MCP layer maps tool calls to service calls with the caller's identity.
- Pagination and size limits on every list or read result; never return whole tables or files.
- Version the server: changing a tool's behavior, schema or description is a release with a changelog entry, so clients can detect changes (a silently changed description is a "rug pull").

## Security

### Remote servers (Streamable HTTP)

- **Authorization:** act as an OAuth 2.1 resource server per the MCP authorization spec:
  - publish Protected Resource Metadata (RFC 9728) at `/.well-known/oauth-protected-resource`, and return `401` with `WWW-Authenticate: Bearer resource_metadata="…", scope="…"` when there's no valid token;
  - validate every token: signature, expiry, issuer and **audience = this server's canonical URI** (RFC 8707). Reject tokens issued for anything else;
  - **never pass a client's token through to downstream APIs.** Get a separate token for each downstream service (token exchange or your own OAuth client) and act on behalf of the user;
  - accept tokens only in the `Authorization` header, never in query strings.
- **Per-tool scopes:** a minimal base scope for read-only discovery; separate scopes for writes and dangerous operations; return `403` with `error="insufficient_scope"` and the full set of scopes the operation needs in one challenge. Check scopes and resource-level permissions in code on every call; a claimed scope alone isn't authorization.
- **Proxy servers** to third-party APIs: implement per-client consent before forwarding to the third party, exact `redirect_uri` matching, single-use `state` set only after consent, and `__Host-` cookies (the spec's confused-deputy mitigations).
- **State handles** (cart IDs, workflow IDs): random, unguessable, expiring, and bound server-side to the authenticated user (`<user_id>:<handle>`). Possession of a handle is never authentication.
- **Transport:** HTTPS only; validate the `Origin` header on every request and answer `403` when it's present and not allowed (DNS rebinding); set request body, array-length and object-key limits.
- **Rate limits:** per token, per user and per tool; meter on the `Mcp-Method`/`Mcp-Name` headers at the gateway.

### Local servers (stdio or localhost HTTP)

- stdio servers get credentials from the environment, not OAuth. Read only the variables they need, and document them.
- Write only valid MCP messages to stdout; send logs to stderr. Never log secrets or tool arguments that contain them.
- A local HTTP server binds to `127.0.0.1` (not `0.0.0.0`), requires a token, and validates `Origin`. Prefer stdio or a Unix socket.
- A local server runs with the user's privileges: restrict file access to configured directories (resolve and check paths, block `..` and symlinks out), and make destructive operations opt-in.

### Tools

- **No shell passthrough.** Never build shell commands from arguments; call programs with argument arrays (`execFile`, `subprocess.run([...], shell=False)`), allowlisted binaries and validated arguments, or better, call the library directly.
- Outbound requests from tools: allowlist hosts, block private, loopback and link-local addresses (including cloud metadata), and re-check redirects (SSRF).
- **Sanitize outputs:** return only what the tool's purpose needs; strip secrets, tokens and internal hostnames; mark third-party content (web pages, emails, documents) as untrusted data in the result, since clients feed it to a model.
- Never include instructions in tool results or error messages ("now call …"). Return facts and error codes.
- **Audit logs** for every call: time, client ID, user, tool, redacted arguments, result status, latency. Keep them out of the model's reach.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2026-111771 / CVE-2026-116684: server bearer auth accepted tokens issued for another service | @modelcontextprotocol/sdk, @modelcontextprotocol/server; Python `mcp` | 1.32.0 / 2.3.0; Python 1.30.0 / 2.2.0 |
| CVE-2025-66414 / CVE-2025-66416: DNS rebinding protection off by default | @modelcontextprotocol/sdk; Python `mcp` | 1.24.0; Python 1.23.0 |
| CVE-2026-25536: cross-client data leak via a shared server/transport instance | @modelcontextprotocol/sdk | 1.26.0 |
| CVE-2026-111768 and GHSA-f897-62hf-6gxq: unbounded request body and validation memory | @modelcontextprotocol/sdk, server, node | 1.32.0 / 2.3.0 |
| CVE-2026-52869, CVE-2026-59951: session requests not bound to the authenticated user; unbounded sessions | Python `mcp` | 1.30.0 / 2.2.0 |
| CVE-2025-64340, CVE-2026-27124, GHSA-7xgj-8392-5q4r: command injection, OAuth proxy confused deputy, authorization skipped on direct calls | fastmcp | 4.1.2 (or 3.4.10 on 3.x) |
| CVE-2025-6514: OS command injection from untrusted server URLs | mcp-remote | 0.1.16 |

Minimum safe: `@modelcontextprotocol/sdk` **1.32.0**, `@modelcontextprotocol/server` **2.3.0**, Python `mcp` **1.30.0** or **2.2.0**, `fastmcp` **4.1.2**. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Auth: requests without a token get `401` with `resource_metadata`; a token with the wrong audience, issuer or an expired one gets `401`; a token without the tool's scope gets `403 insufficient_scope`.
- Isolation: user A can't read or act on user B's resources or state handles.
- Validation: unknown properties, oversized strings and arrays, and path traversal (`../`) are rejected before the handler runs.
- Transport: a request with a foreign `Origin` gets `403`; the local server isn't reachable on non-loopback interfaces.
- Injection: no tool argument can reach a shell or an arbitrary URL.
- Run the server through the MCP Inspector (current version) locally to check tool listings, schemas and descriptions.

## Before you finish

```sh
npx tsc --noEmit                 # or: mypy / pyright
npm test                         # or: pytest
npm audit --audit-level=moderate # or: pip-audit
npm ls @modelcontextprotocol/sdk @modelcontextprotocol/server 2>/dev/null   # at or above the minimums
grep -rnE "shell: ?true|shell=True|child_process\.exec\(|0\.0\.0\.0" src 2>/dev/null
```
