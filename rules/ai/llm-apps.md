---
id: ai/llm-apps
title: LLM features in applications
description: Building LLM features with provider SDKs (OpenAI, Anthropic, Gemini) or the Vercel AI SDK - server-side keys, model IDs in config, structured outputs validated against a schema, refusal and truncation handling, timeouts, retries, token and cost limits, streaming, prompt caching, prompt regression evals, PII-redacted logging, and the OWASP Top 10 for LLM Applications (2026) controls. Use when editing code that calls an LLM API, prompt files or AI route handlers.
applies_to: "any"
globs: ["**/*{llm,openai,anthropic,gemini,prompt}*.{ts,tsx,py}", "**/ai/**/*.{ts,tsx,py}", "src/ai/**", "app/api/**/route.ts", "**/prompts/**"]
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
  - https://genai.owasp.org/llm-top-10/
  - https://cloudsecurityalliance.org/blog/2026/10/21/the-owasp-top-10-for-llm-applications-2026-what-changed-and-why-it-matters
  - https://developers.openai.com/api/docs/guides/structured-outputs
  - https://developers.openai.com/api/docs/guides/function-calling
  - https://developers.openai.com/api/docs/guides/prompt-caching
  - https://platform.claude.com/docs/en/build-with-claude/structured-outputs
  - https://platform.claude.com/docs/en/build-with-claude/prompt-caching
  - https://platform.claude.com/docs/en/about-claude/models/overview
  - https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use
  - https://ai.google.dev/gemini-api/docs/structured-output
  - https://ai.google.dev/gemini-api/docs/function-calling
  - https://ai.google.dev/gemini-api/docs/caching
  - https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
  - https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
  - https://ai-sdk.dev/docs/ai-sdk-core/settings
  - https://www.promptfoo.dev/docs/intro/
  - https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/
  - https://osv.dev/vulnerability/GHSA-c67j-w6g6-q2cm
  - https://osv.dev/vulnerability/GHSA-pjwx-r37v-7724
  - https://osv.dev/vulnerability/GHSA-926x-3r5x-gfhw
  - https://osv.dev/vulnerability/GHSA-2g6r-c272-w58r
  - https://osv.dev/vulnerability/GHSA-cr7q-2w66-hjcm
  - https://osv.dev/vulnerability/GHSA-5mg7-485q-xm76
  - https://osv.dev/vulnerability/GHSA-3cv6-jpf6-8222
  - https://osv.dev/vulnerability/GHSA-7hp6-4w63-5g45
---

# LLM features in applications

For retrieval see `ai/rag`; for tool-using loops see `ai/agents`; for MCP servers you build see `ai/mcp-servers`. Generic input, output and secret handling is in `core/security-baseline`. This rule is about LLM features in the product, not about how you behave as a coding agent (`core/agent-safety`).

## Version check

- List the LLM SDKs and frameworks from the lockfile with versions, and state them:

  ```text
  Applying ai/llm-apps (openai 7.45 Responses API, ai 7.0 with @ai-sdk/anthropic 4.0, zod 4, from pnpm-lock.yaml).
  ```

- Current majors as of 2026-10: npm `openai` 7, `@anthropic-ai/sdk` 1, `@google/genai` 2, `ai` (Vercel AI SDK) 7; PyPI `openai` 3, `anthropic` 2, `google-genai` 2; `langchain`/`langchain-core` 1.x.
- Write against the installed SDK version. SDK and API shapes change often; take method and parameter names from the SDK's docs or types for that version, never from memory. Don't switch APIs (for example Chat Completions to Responses, or `generateObject` to `generateText` with `output`) unless asked.
- If a framework is below the fixed versions in Known vulnerabilities, say so in the summary.

## Conventions

### Structure

- All provider calls run on the server: API routes, Server Actions, workers. Keys come from server-only environment variables or a secret manager; never `NEXT_PUBLIC_*`, `VITE_*`, `EXPO_PUBLIC_*` or mobile bundles.
- One module owns each provider client (`src/ai/clients.ts`), with timeouts, retries and logging set once. Features call a typed function (`summarizeTicket(input)`), not the SDK directly.
- Model IDs live in config (`AI_MODEL_SUMMARY=…`), one per use case, never scattered string literals. Use exact IDs from the provider's model list; where the provider offers dated snapshots, pin them in production and change them deliberately with an eval run.
- Prompts live in versioned files or template modules (`src/ai/prompts/summarize-ticket.ts`) with a version tag logged on every call. Build prompts from structured parts (system instructions, then delimited user and retrieved content), never by concatenating user input into instructions.

### Structured outputs

- When code consumes the output, request structured output with a schema and validate the result again with the same schema (Zod, Valibot, Pydantic) before use:
  - OpenAI: Responses API `text.format` with `type: "json_schema"`, `strict: true` (SDK helpers `responses.parse` with `zodTextFormat` or a Pydantic `text_format`); strict schemas need every field `required` and `additionalProperties: false`.
  - Anthropic: `output_config.format` (or the SDK's `messages.parse()`); `strict: true` on tool definitions for schema-valid tool input.
  - Gemini: JSON MIME type plus a response schema in the generation config; some keywords (`minLength`, `maxLength`, `uniqueItems`, …) are dropped, so enforce them in your validator.
  - Vercel AI SDK: `generateText`/`streamText` with `output: Output.object({ schema })` on current versions (`generateObject` on older ones); catch `NoObjectGeneratedError`.
- Before parsing, check why generation stopped: a refusal, a content filter, or the output-token limit means there is no valid object. Handle each explicitly (retry once, fall back, or return a clear error), never `JSON.parse` blindly.

### Limits, retries and cost

- Set an explicit request timeout and a bounded retry count with backoff on every client (SDK defaults are long; for example the Anthropic SDKs default to a 10-minute timeout and 2 retries). Retry only 408, 409, 429, 5xx and connection errors; honor `retry-after`.
- Cap output tokens per call (`max_tokens` / `max_output_tokens`) and input size per request. Reject or truncate oversized user input before the call, and tell the user.
- Enforce per-user and per-tenant quotas (requests, tokens, money per day) and a global budget alarm. Record `usage` from every response with model, prompt version, tenant and feature, so cost is attributable.
- Add a circuit breaker or fallback model for provider outages, and degrade the feature instead of failing the page.

### Streaming

- Stream long responses to the client (SSE or the framework's stream helpers). Pass the request's `AbortSignal` to the SDK so a closed tab stops generation and billing.
- Render streamed text as text or through a sanitizing Markdown renderer; never inject model output as raw HTML.
- Validate structured output only when the stream completes; partial objects are for display only.

### Prompt caching

- Put stable content first (system instructions, tool definitions, long reference text) and volatile content (timestamps, user input, IDs) last, so provider prefix caches hit. Don't put the current time or random IDs in the system prompt.
- Anthropic needs explicit `cache_control` (5-minute default TTL, optional 1 hour, model-dependent minimum length); OpenAI and Gemini cache long prefixes automatically or through explicit cache objects. Check the cached-token fields in `usage` to confirm hits.
- Caching never crosses tenants by itself, but don't put another tenant's data into a shared prefix.

### Evals

- Every prompt or model change runs the prompt regression suite (promptfoo by default): a golden set of real, anonymized inputs with assertions on schema validity, required facts, refusals and forbidden content, plus a few prompt-injection cases.
- Run evals locally or through a manually dispatched workflow; pull-request CI uses recorded or mocked responses and makes no paid model calls by default.
- Record the eval result (pass rate, cost, latency) in the PR when prompts or model IDs change.

### Logging

- Log request ID, feature, model, prompt version, token counts, latency, cost, stop reason and validation result.
- Redact PII and secrets before logging prompts or responses, and before sending to the provider where the feature allows (names, emails, phone numbers, account numbers, tokens). Keep raw prompt logs off by default, behind a short retention period and restricted access.
- Respect the provider's data-retention settings the contract requires (zero-retention options, regional processing) and document them.

## Security

Controls for the OWASP Top 10 for LLM Applications (2026 edition, 4 Aug 2026):

- **LLM01 Prompt injection.** User input and retrieved or tool content can carry instructions. Keep system instructions in the system/developer role, wrap untrusted content in clear delimiters, and never let it choose tools, recipients, URLs or privileges without server-side validation against an allowlist. Avoid combining private data, untrusted content and an exfiltration channel (links, images, outbound tools) in one call.
- **LLM02 Sensitive information disclosure.** Send the model only the data the current user may see. No secrets, credentials or other tenants' data in prompts. Redact PII where the task allows; check outputs for secrets before returning them.
- **LLM03 Excessive agency.** Give the model only the tools the feature needs, each acting with the end user's permissions. Authorization runs in your code, not in the prompt. Destructive or external actions need user confirmation (see `ai/agents`).
- **LLM04 Supply chain.** Pin SDK, framework and model versions; run `dependency-vet` before adding AI packages. Load local models only from trusted sources in `safetensors`, never untrusted pickles. Treat proxies and gateways (LiteLLM and similar) as critical infrastructure.
- **LLM05 Data and model poisoning.** Track the source of fine-tuning, eval and RAG data; review data before it's used for training; don't let users write into shared prompts or examples.
- **LLM06 Unbounded consumption.** Token caps, timeouts, quotas, step limits and budgets as above; rate-limit LLM endpoints per user and IP.
- **LLM07 Misinformation.** Show sources and uncertainty for factual answers; label generated content; require human review where errors are costly (medical, legal, financial, security decisions).
- **LLM08 Hidden context exposure.** Assume the system prompt, tool schemas and any policy text in context will leak. Put no secrets, internal URLs or authorization logic there; enforce rules in code.
- **LLM09 Vector and embedding weaknesses.** Filter retrieval by tenant and ACL on the server (see `ai/rag`).
- **LLM10 Improper output handling.** Treat output as untrusted input: validate it against a schema; encode it for HTML, SQL, shell and URLs; never `eval` it or pass it to a shell; sandbox any code it writes; check URLs and file paths it returns against allowlists.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2025-68664: serialization injection extracts secrets via `dumps`/`loads` (CVSS 9.3) | langchain-core (PyPI) | 1.2.5 / 0.3.81 |
| CVE-2026-44843: unsafe deserialization of attacker-controlled objects | langchain-core | 1.3.3 / 0.3.85 |
| CVE-2026-40087 and CVE-2025-65106: prompt-template injection (f-strings, attribute access) | langchain-core | 1.2.28 / 0.3.84 |
| CVE-2026-26013: SSRF via `image_url` token counting | langchain-core | 1.2.11 |
| CVE-2025-7647, CVE-2025-6209 and others: temp files, path traversal, DoS | llama-index-core | 0.13.0 or later |
| GHSA-5mg7-485q-xm76: malicious releases harvesting credentials (Mar 2026) | litellm 1.82.7–1.82.8 | Remove; rotate every key the host could read |
| CVE-2026-84377, CVE-2026-114612 and the rest of about 30 proxy advisories published in 2026 (SSRF, auth bypass, SQL injection, privilege escalation) | litellm | 1.104.0 or later |

Minimum safe `langchain-core` is **1.3.3** (the 0.3 line has unfixed advisories). Never call `loads()` on untrusted data or load prompt templates from user input. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Unit-test feature functions with a mocked provider (MSW handlers or the SDK's test transport) returning valid output, schema-invalid output, a refusal, a truncated response, a 429 and a timeout. Assert each path.
- Test that keys never reach client bundles (`git grep` for key names in client code; a build-output check where the project has one).
- Keep a prompt-injection eval set (instructions hidden in user input and documents) and assert the model doesn't follow them or leak the system prompt.

## Before you finish

```sh
npx tsc --noEmit                         # or: mypy / pyright
npm test                                 # or: pytest
npx promptfoo eval -c evals/<feature>.yaml   # when prompts or model IDs changed; uses real model calls, so ask first
npm audit --audit-level=moderate         # or: pip-audit
git grep -nE "(OPENAI|ANTHROPIC|GEMINI|GOOGLE)_API_KEY" -- 'src/**/*.tsx' 'app/**/*.tsx' 'components/**'   # no keys in client code
```
