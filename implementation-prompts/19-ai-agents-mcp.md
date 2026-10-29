# Prompt 19: AI: agents and MCP servers

> Self-contained; safe in a fresh session. Roadmap: §5.4, §7 (the `ai/*` entry).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §5.4 and the §7 entry for the `ai/*` rules.
3. Research:
   - the OWASP Top 10 for Agentic Applications;
   - the current MCP specification, especially authorization (OAuth 2.1) and transport security;
   - MCP tool-poisoning research;
   - agent framework docs (LangGraph, OpenAI Agents SDK, Claude Agent SDK);
   - LangGraph and agent-framework CVEs.

## Task
1. **`rules/ai/agents.md`:**
   - tier P1;
   - least agency; tools run with the end user's permissions;
   - human approval for destructive actions; step, cost and time limits;
   - sandboxed code execution; memory scoped and expired per tenant;
   - inter-agent authentication; audit logs; a kill switch;
   - framework-specific CVE notes (the LangGraph checkpointer chain);
   - map each control to ASI01–ASI10.
2. **`rules/ai/mcp-servers.md`** (building MCP servers):
   - tier P1; globs for MCP server code (for example `**/mcp/**`, `**/*mcp*server*.{ts,py}`);
   - OAuth for remote servers per the spec; per-tool scopes;
   - JSON-schema input validation; no shell passthrough;
   - output sanitization; honest tool descriptions;
   - rate limits; audit logs;
   - stdio-transport risks and versioning.

## Done when
Both rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
