# Prompt 18: AI: LLM apps and RAG

> Self-contained; safe in a fresh session. Roadmap: §5.4, §7 (the `ai/*` entry).

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read `ROADMAP.md` §5.4 and the §7 entry for `ai/llm-apps`, `ai/rag`, `ai/agents` and `ai/mcp-servers`.
3. Research:
   - the OWASP Top 10 for LLM Applications (latest edition);
   - current structured-output and tool-calling docs for the OpenAI, Anthropic and Gemini SDKs and the Vercel AI SDK; prompt caching;
   - pgvector and vector-store tenant isolation;
   - LLM-framework CVEs (LangChain and others).

## Task
1. **`rules/ai/llm-apps.md`:**
   - tier P0; globs that match common SDK usage (for example `**/*{llm,ai,openai,anthropic,gemini,prompt}*.{ts,py}`, `app/api/**/route.ts`, `src/ai/**`);
   - provider keys server-side; model IDs in config; structured outputs with schema validation;
   - timeouts, retries and cost limits; streaming; prompt regression evals; logging with PII redaction;
   - the LLM01–LLM10 controls from §5.4.
   - Stay vendor-neutral, with short per-provider notes.
2. **`rules/ai/rag.md`:**
   - tier P1;
   - chunking and metadata; tenant/ACL filters enforced on the server;
   - indirect prompt injection from documents; citations;
   - embedding versioning; deletion and right-to-be-forgotten handling.

## Done when
Both rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
