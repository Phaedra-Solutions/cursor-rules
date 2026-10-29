---
name: threat-model-lite
description: Run a 10-minute STRIDE pass on a new feature or significant change and produce a table of assets, entry points, abuse cases, required controls mapped to OWASP Top 10:2025, and tests to add. Use before building a feature that touches authentication, payments, file uploads, personal data, external integrations, LLM or agent features, or a new public endpoint, or when asked for a threat model or security design review.
license: MIT
metadata:
  owner: "@Phaedra-Solutions/maintainers"
  last_reviewed: "2026-10-29"
  sources: "https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html https://owasp.org/www-community/Threat_Modeling_Process https://top10.owasp.org/2025/ https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/"
---

# Threat model lite

## When to use

- Before building a feature that touches auth, money, files, personal data, an external integration, an LLM or agent, or adds a public endpoint.
- When `core/security-baseline` (A06) asks for abuse cases.
- When the user asks for a threat model or security design review.

It's a short design check, not a full threat model. For regulated systems or high-value targets, recommend a full threat-modeling session with the team.

## Before you start

You need two inputs. Ask for whichever is missing; infer from the code only what you can confirm.

1. **Feature description:** what it does, who uses it (anonymous, signed-in, admin, other services), and what "done" looks like.
2. **Data flows:** where data enters, which components handle it, where it's stored, and which external services it reaches. A bullet list is enough:

   ```
   browser → POST /api/invoices/:id/pdf (Next.js Server Action) → invoices table (Postgres, RLS)
   Server Action → PDF service (internal HTTP) → S3 private bucket → signed URL back to browser
   ```

Also check the existing auth model, tenancy model and the stack rules that apply.

## Steps

Spend about 10 minutes. Prefer three concrete threats over ten generic ones.

1. **Assets.** List what an attacker would want: data (personal data, payment data, secrets, tokens), capabilities (sending email, spending money, running code, calling an LLM with tools) and availability.
2. **Entry points and trust boundaries.** List every place untrusted input crosses into the system: endpoints, Server Actions, webhooks, file uploads, queue consumers, LLM inputs (including retrieved documents and tool output), and admin screens. Mark where trust changes (browser → server, service → third party, tenant → tenant).
3. **STRIDE pass.** For each entry point, ask one question per letter and keep only the threats that apply:

   | STRIDE | Question | Typical controls |
   |---|---|---|
   | **S**poofing | Can someone act as another user, service or webhook sender? | Proven auth, verified webhook signatures, mTLS or signed service tokens |
   | **T**ampering | Can someone change data, prices, IDs, files or prompts they shouldn't? | Server-side validation, object-level authorization, integrity checks |
   | **R**epudiation | Could someone deny doing a sensitive action? | Structured audit log with actor, action, resource, result |
   | **I**nformation disclosure | Can data leak across users or tenants, or through errors, logs, URLs or LLM output? | Tenant-scoped queries, response DTOs, generic errors, redaction |
   | **D**enial of service | Can someone exhaust money, quota, CPU, storage or a third-party limit? | Rate limits, quotas, size and time bounds, spend caps |
   | **E**levation of privilege | Can a user reach admin functions, other tenants, or code execution (injection, SSRF, tool abuse)? | Deny by default, least privilege, parameterized queries, allowlists, human approval for risky tool calls |

4. **Abuse cases.** Write each threat as one concrete sentence: "An authenticated user changes `invoiceId` in the request to download another tenant's invoice."
5. **Controls.** For each abuse case, name the control, map it to an OWASP Top 10:2025 category (A01–A10), and say where it goes in the code. Point to `core/security-baseline` instead of repeating it. For LLM and agent features, also map to the OWASP Top 10 for LLM or Agentic Applications.
6. **Tests.** For each control, name one test that would fail without it: a negative authorization test, an oversized upload, a replayed webhook, a rate-limit test, a prompt-injection fixture.
7. **Output** the table below, then a short list of open questions for the user. Keep it in the chat unless the user asks for a file (for example `docs/threat-models/<feature>.md`).

## Output format

```markdown
## Threat model: invoice PDF download (2026-10-29)

Assets: invoice data (personal data, amounts); signed S3 URLs; PDF service capacity.
Entry points: POST /api/invoices/:id/pdf (signed-in users); PDF service (internal); S3 bucket.

| # | STRIDE | Entry point | Abuse case | Control | OWASP 2025 | Where | Test |
|---|---|---|---|---|---|---|---|
| 1 | E/I | POST /api/invoices/:id/pdf | User swaps `id` to fetch another tenant's invoice | Load the invoice scoped to session.orgId; 404 otherwise | A01 | invoices/actions.ts | Request another org's invoice → 404 |
| 2 | D | POST /api/invoices/:id/pdf | Script requests thousands of PDFs to exhaust the PDF service | Rate limit per user and org; queue with max concurrency | A06 | middleware + queue config | 61st request in a minute → 429 |
| 3 | I | S3 signed URL | Signed URL shared or logged and reused later | 5-minute expiry; no URLs in logs | A01, A09 | storage/sign.ts | Expired URL → 403 |

Open questions:
- Can support staff download any tenant's invoices? If so, they need audit logging (A09).
```

## Verify

- Every entry point from step 2 appears in at least one row, or is explicitly noted as low risk.
- Every row has a concrete abuse case, a control with a location, an OWASP category and a test.
- No control contradicts the stack rules or `core/security-baseline`.

## Safety

- This is analysis only. Don't change code while running it; implement controls as a separate task after the user agrees.
- Don't put real secrets, customer data or internal hostnames in the output; use placeholders.
- Don't claim the feature is "secure" after the pass. Say which threats were considered and which questions are still open.
