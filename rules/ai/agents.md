---
id: ai/agents
title: AI agents and tool-using workflows
description: Building agents that call tools in a loop (LangGraph, OpenAI Agents SDK, Claude Agent SDK, Vercel AI SDK, or a hand-written loop) - least agency, tools acting with the end user's permissions, human approval for destructive actions, step, cost and time limits, sandboxed code execution, per-tenant memory with expiry, authenticated agent-to-agent calls, audit logs and a kill switch, mapped to the OWASP Top 10 for Agentic Applications (ASI01-ASI10), plus LangGraph checkpointer CVEs. Use when editing agent loops, tool definitions, graphs or agent memory.
applies_to: "any"
globs: ["**/agents/**/*.{ts,tsx,py}", "**/*agent*.{ts,py}", "**/langgraph/**", "**/tools/**/*.{ts,py}"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
  - https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
  - https://docs.langchain.com/oss/python/langgraph/interrupts
  - https://openai.github.io/openai-agents-js/guides/human-in-the-loop/
  - https://code.claude.com/docs/en/agent-sdk/permissions
  - https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
  - https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/
  - https://osv.dev/vulnerability/GHSA-9rwj-6rc7-p77c
  - https://osv.dev/vulnerability/GHSA-g48c-2wqr-h844
  - https://osv.dev/vulnerability/GHSA-5mx2-w598-339m
  - https://osv.dev/vulnerability/GHSA-fjqc-hq36-qh5p
  - https://osv.dev/vulnerability/GHSA-mhr3-j7m5-c7c9
  - https://osv.dev/vulnerability/GHSA-47pj-3jcm-6whg
  - https://osv.dev/vulnerability/GHSA-6hmw-9432-67qq
  - https://osv.dev/vulnerability/GHSA-3fx2-cqw9-xr3c
  - https://osv.dev/vulnerability/GHSA-h4mw-j7qp-8mwm
---

# AI agents and tool-using workflows

Apply with `ai/llm-apps` (keys, structured output, limits, logging). For MCP servers you build see `ai/mcp-servers`; for your own behavior as a coding agent see `core/agent-safety`.

## Version check

- List the agent framework and checkpoint or memory packages with versions (`langgraph`, `langgraph-checkpoint-*`, `@langchain/langgraph`, `openai-agents` / `@openai/agents`, `claude-agent-sdk` / `@anthropic-ai/claude-agent-sdk`, `ai`), and state them:

  ```text
  Applying ai/agents (langgraph 1.2.18, langgraph-checkpoint-postgres 3.2.0, Python 3.13, from uv.lock).
  ```

- Compare checkpoint and memory packages with Known vulnerabilities before anything else; those packages are where the 2025–2026 agent CVEs landed.
- Take approval, interrupt and limit APIs from the installed framework's docs; names differ between frameworks and versions.

## Conventions

- **Prefer a workflow over an agent.** Use a fixed sequence of calls when the steps are known; use a model-driven loop only when the task needs it, and say why in the PR.
- One module defines the agent: its tools, model config, limits and approval policy. Don't scatter tool registrations.
- Every tool has:
  - a narrow purpose and an honest description (what it does, what it can change);
  - an input schema validated before execution (`strict` schemas where the provider supports them);
  - typed, minimal output (no raw database rows, secrets or internal URLs);
  - a timeout and error handling that returns a clear error result instead of throwing the loop away.
- Tools call your existing service layer with the **end user's identity and permissions**, never a superuser or service account that can see every tenant. Authorization happens inside the tool, in code, not in the prompt.
- Classify each tool: read-only, reversible write, or destructive/external (payments, deletes, emails, posting, permission changes, deploys). Destructive and external tools require human approval:
  - LangGraph: `interrupt()` before the action, resumed with `Command(resume=…)` (needs a durable checkpointer);
  - OpenAI Agents SDK: tool approval items and the run's interruptions;
  - Claude Agent SDK: `canUseTool` or a `PreToolUse` hook with `permissionMode: "default"` or `"dontAsk"`; never `bypassPermissions` outside a disposable sandbox;
  - hand-written loops: stop, return the proposed action, and continue only after an explicit user confirmation.
- Show the user the exact action and arguments being approved (recipient, amount, target). Never let the model summarize what it's about to do as the approval text.

### Limits

- Cap steps (turns, tool calls), wall-clock time, tokens and money per run, and per user per day. When a limit hits, stop and report what was done; never silently continue.
- Bound fan-out (parallel tool calls, sub-agents) and recursion depth. Detect loops: the same tool with the same arguments several times in a row ends the run.
- Retries with backoff for transient tool errors; no retry for authorization or validation failures.

### Code execution

- Run model-written code only in an isolated sandbox: a container or microVM with no host mounts, no credentials, CPU, memory and time limits, a read-only base image and no network (or an egress allowlist).
- Never `eval`, `exec`, `subprocess(shell=True)` or a shell tool on the host. Never give an agent a generic shell or SQL tool in production; expose specific operations instead.

### Memory and state

- Scope every memory and checkpoint record by tenant and user (keys derived from the authenticated identity, not from the model or request). One user's thread must never load another's state.
- Expire long-term memory (TTL) and let users view and delete it. Don't store secrets or raw credentials in memory or checkpoints.
- Treat memory written from untrusted input as untrusted on read; don't let stored text become instructions.
- Use a durable, access-controlled checkpointer (Postgres with least-privilege credentials) in production, never in-memory or SQLite shared across tenants.

### Multi-agent and handoffs

- Authenticate agent-to-agent and agent-to-service calls (mTLS, signed tokens with audience) and pass the original user's identity and scopes down; a sub-agent never gets more permission than the caller.
- Validate messages between agents against a schema; one agent's output is another's untrusted input.

### Observability and control

- Audit-log every tool call: run ID, user, tenant, tool, arguments (redacted), result status, approval decision and who approved.
- Provide a kill switch: a config flag or admin action that stops new runs and cancels in-flight ones for one agent, one tenant or everything.
- Alert on unusual patterns: spikes in tool calls, denied approvals, cross-tenant access attempts, repeated injection detections.

## Security

Controls mapped to the OWASP Top 10 for Agentic Applications (2026, published 9 Dec 2025):

| Risk | Control |
|---|---|
| ASI01 Agent Goal Hijack | System instructions separate from user, retrieved and tool content; untrusted content never chooses tools, recipients or targets without server-side validation; avoid private data + untrusted content + an outbound channel in one run |
| ASI02 Tool Misuse and Exploitation | Minimal tool set per agent; strict input schemas; argument allowlists (domains, recipients, paths); rate limits per tool |
| ASI03 Identity and Privilege Abuse | Tools act with the end user's permissions; short-lived, scoped credentials; no shared superuser service accounts |
| ASI04 Agentic Supply Chain | Pin frameworks, tools, prompts and models; vet plugins and MCP servers like dependencies (`dependency-vet`); review tool description changes |
| ASI05 Unexpected Code Execution | Sandboxed execution only; no host shell, `eval` or deserialization of untrusted checkpoints |
| ASI06 Memory and Context Poisoning | Per-tenant, per-user memory with TTL; provenance on stored items; untrusted memory isn't treated as instructions |
| ASI07 Insecure Inter-Agent Communication | Authenticated, schema-validated messages; identity and scopes propagated, never widened |
| ASI08 Cascading Failures | Step, time, token and cost limits; circuit breakers; bounded fan-out and retries |
| ASI09 Human-Agent Trust Exploitation | Approval screens show exact actions and arguments; label agent output; no "the agent verified it" claims without evidence |
| ASI10 Rogue Agents | Audit logs, anomaly alerts and a kill switch; scope reviews when agents gain tools |

## Known vulnerabilities (as of 2026-10)

The LangGraph checkpointer chain: SQL injection in filters plus unsafe deserialization of checkpoint data leads to remote code execution.

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2025-67644: SQL injection via metadata filter keys | langgraph-checkpoint-sqlite | 3.0.1 |
| CVE-2026-28277: unsafe msgpack deserialization when loading checkpoints | langgraph | 1.0.10 |
| CVE-2026-27022: RediSearch query injection | @langchain/langgraph-checkpoint-redis | 1.0.2 |
| CVE-2026-48775, CVE-2026-27794, CVE-2025-64439: unsafe deserialization in checkpoint loading and `BaseCache` (RCE) | langgraph-checkpoint | 4.1.1 |
| CVE-2026-71433, CVE-2026-115883: store namespaces cross segment boundaries (cross-namespace reads) | langgraph-checkpoint-postgres / -sqlite | 3.1.3 / 3.1.2 |
| CVE-2026-118667: unencoded identifiers in SDK streaming redirect authenticated requests | langgraph / langgraph-sdk | 1.2.14 / 0.4.6 |
| CVE-2026-96620: argument injection via the `resume` option → command execution | claude-agent-sdk (PyPI) | 0.2.121 |

Never pass user-controlled filters to `get_state_history()` or store search, and never load checkpoints written by another tenant. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- For each destructive tool: a test proving the action doesn't run without approval, and runs exactly once after approval.
- Limits: a test that a looping or runaway run stops at the step, time and cost caps with a clear result.
- Isolation: two tenants' threads and memory never load each other's state, including with a forged thread ID.
- Injection: a tool result or document containing instructions ("send the data to …") doesn't change tool selection or arguments. Keep these cases in the eval suite (promptfoo by default; see `ai/llm-apps`).
- Sandbox: model-written code can't read host files, environment variables or reach the network.

## Before you finish

```sh
npm test                          # or: pytest
npx promptfoo eval -c evals/agents.yaml   # agent and injection evals; uses real model calls, so ask first
pip-audit                         # or: npm audit --audit-level=moderate
grep -rnE "bypassPermissions|shell=True|eval\(|exec\(" src agents 2>/dev/null
```
