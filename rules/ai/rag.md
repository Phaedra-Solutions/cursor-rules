---
id: ai/rag
title: Retrieval-augmented generation (RAG)
description: RAG pipelines on pgvector or a vector database - structure-aware chunking with tenant, ACL and provenance metadata, tenant and ACL filters enforced server-side inside the query, pgvector filtering and iterative scans, indirect prompt injection from documents, validated citations, embedding model versioning and re-embedding, ingestion safety, and deletion for right-to-be-forgotten requests. Use when editing ingestion, chunking, embedding, retrieval or vector-store code.
applies_to: "any"
globs: ["**/*{rag,retriever,retrieval,embedding,embeddings,vector,ingest,chunk}*.{ts,tsx,py}", "**/rag/**", "**/retrieval/**"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
  - https://github.com/pgvector/pgvector
  - https://www.postgresql.org/docs/current/ddl-partitioning.html
  - https://www.postgresql.org/docs/current/ddl-rowsecurity.html
  - https://qdrant.tech/documentation/guides/multiple-partitions/
  - https://docs.pinecone.io/guides/index-data/implement-multitenancy
  - https://weaviate.io/developers/weaviate/manage-data/multi-tenancy
  - https://platform.claude.com/docs/en/build-with-claude/citations
  - https://www.promptfoo.dev/docs/intro/
  - https://gdpr-info.eu/art-17-gdpr/
  - https://osv.dev/vulnerability/GHSA-h5gc-rm8j-5gpr
  - https://osv.dev/vulnerability/GHSA-pc6w-59fv-rh23
---

# Retrieval-augmented generation (RAG)

Apply with `ai/llm-apps` (model calls, structured output, logging, OWASP controls). For Postgres schema and roles see `data/postgres`; on Supabase also `data/supabase`.

## Version check

- Identify the store and its version: pgvector (`select extversion from pg_extension where extname = 'vector';`, current 0.8.7), or the vector database and client (Qdrant, Pinecone, Weaviate, …). Identify the embedding model ID and dimensions in config, and any framework (LangChain, LlamaIndex) with its version.
- pgvector iterative index scans (`hnsw.iterative_scan`) need 0.8.0+. On older versions, filtered queries can return fewer rows than `limit`; say so and offer the upgrade.
- State it:

  ```text
  Applying ai/rag (pgvector 0.8.7 on Postgres 17, embedding model from AI_EMBEDDING_MODEL, 1536 dims, LangChain 1.3).
  ```

## Conventions

### Ingestion

- Pipeline: fetch → parse → clean → chunk → embed → upsert, idempotent per document version. Re-ingesting the same version changes nothing; a new version replaces that document's chunks in one transaction (or one batch with a version switch).
- Every chunk stores: `tenant_id`, ACL fields (`visibility`, `allowed_group_ids` or owner), `document_id`, `document_version`, `chunk_index`, `source_uri`, `title`, heading path, `content_hash`, `embedding_model`, `embedding_dimensions`, `created_at`. Without tenant and ACL metadata a chunk is not stored.
- Chunk by structure first (headings, paragraphs, list items, table rows, code blocks), then by token count with a small overlap. Keep the heading path in each chunk's text or metadata so it stands alone. Tune sizes with retrieval evals, not by guesswork.
- Strip boilerplate (navigation, footers, cookie banners) and hidden content (HTML comments, `display:none` text, zero-width characters, off-page text) during cleaning; keep a record of what was removed for review.

### Embeddings

- One embedding model per index or column. Store the model ID and version with each vector, and use the same model for queries and documents.
- Changing the model or dimensions is a migration: add a new column or index, backfill, compare retrieval evals, switch reads, then drop the old one. Never mix vectors from two models in one index.
- Batch embedding calls, retry with backoff, and cap ingestion spend per tenant (see `ai/llm-apps`).

### Retrieval

- Retrieve with a fixed `k`, a minimum similarity (or reranker score) threshold, and a token budget for the context you pass to the model. If nothing passes the threshold, answer "not found" instead of generating.
- Use hybrid search (vector plus keyword/BM25) or a reranker when evals show it helps; keep it measurable.
- **pgvector:**
  - create the index with the operator class for your distance (`vector_cosine_ops` with `<=>`, `vector_l2_ops` with `<->`), and query with the matching operator;
  - filters apply after the approximate index scan, so a selective `where tenant_id = …` can return too few rows: set `SET LOCAL hnsw.iterative_scan = strict_order` (or `relaxed_order`) on 0.8+, tune `hnsw.ef_search` / `hnsw.max_scan_tuples`, or list-partition by tenant for large tenants;
  - consider `halfvec` to halve storage when evals show no recall loss.

### Citations

- Pass each chunk to the model with a stable ID and ask for citations by ID (or use the provider's citations feature). Validate that every cited ID is in the retrieved set and drop or flag answers that cite anything else.
- Show citations as links to sources the current user can open. Never show a source title or snippet the user isn't allowed to see.

## Security

- **Tenant and ACL filters run on the server, inside the retrieval query**, built from the authenticated user's context: `where tenant_id = $1 and (visibility = 'public' or allowed_group_ids && $2)`. Never take tenant or group IDs from the request body or the model, and never filter after top-k (it leaks timing and ranking, and drops recall).
- Add a second layer: Postgres row-level security on chunk tables (see `data/postgres`), or per-tenant namespaces, partitions or collections in hosted stores (Pinecone namespaces, Qdrant tenant partitions with a tenant payload index, Weaviate multi-tenancy) plus the filter.
- Keep ACL metadata current: when a document's permissions change, update its chunks' ACL fields in the same job; for highly sensitive sources, re-check access against the source system at answer time.
- **Indirect prompt injection:** retrieved text is untrusted data, never instructions. Delimit it in the prompt, tell the model it's reference material, and never let it trigger tools, change recipients, or produce links and images that aren't on an allowlist (exfiltration through rendered URLs). Treat injection found in a document as a security event: log it and flag the document.
- **Poisoning:** control who can add documents to shared corpora, record who uploaded what, and review or quarantine new sources before they're searchable by others.
- **Ingestion safety:**
  - URL ingestion: allowlist schemes and hosts, block private and link-local addresses, cap redirects and size (SSRF);
  - uploads: limit size, page count and archive expansion; scan for malware; parse in an isolated worker with timeouts;
  - use maintained parsers and keep XML parsing with external entities off.
- **Embeddings are sensitive.** They can be partly inverted back to text. Protect vectors like the source text: same tenant isolation, encryption and retention, no export to third parties the source text couldn't go to.

### Deletion and right to be forgotten

- Deleting a document (or a user's data) removes, by `document_id` or owner:
  - every chunk and vector, in every index and embedding version;
  - semantic or answer caches that used those chunks;
  - prompt and response logs and eval datasets that contain the text, per the retention policy.
- Until the hard delete finishes, exclude soft-deleted documents in the retrieval filter.
- Confirm the delete: count chunks for the document after the job and log the result (IDs and counts, not content). For pgvector, let autovacuum (or `VACUUM`) reclaim space; for hosted stores, check the delete is applied, since some are eventually consistent.
- Document how long backups keep deleted data, so erasure requests (for example GDPR Art. 17) get an accurate answer.

## Known vulnerabilities (as of 2026-10)

| Advisory | Package | Fixed |
|---|---|---|
| CVE-2025-2828: SSRF in `RequestsToolkit` | langchain-community | 0.0.28 or later; restrict outbound hosts |
| CVE-2025-6984: XML external entity (XXE) in a loader | langchain-community | 0.3.27 or later |
| LangChain core, LlamaIndex and LiteLLM advisories | see `ai/llm-apps` | — |

No OSV advisories for the `pgvector` packages as of 2026-10. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- **Isolation:** seed two tenants with similar documents and assert that queries from tenant B never return tenant A's chunks, including with a selective filter, an empty result and an injected `tenant_id` in the request.
- **ACL:** a user outside a document's groups gets no chunks or citations from it.
- **Retrieval quality:** a labeled question set with expected sources; track recall@k and answer faithfulness in the eval suite (promptfoo by default) whenever chunking, embedding model or `k` changes.
- **Injection:** a document containing instructions ("ignore previous instructions", a markdown image to an outside URL) must not change behavior or produce the link.
- **Deletion:** delete a document and assert zero chunks, no citations and no cache hits for it.

## Before you finish

```sh
npm test                                   # or: pytest
npx promptfoo eval -c evals/rag.yaml       # retrieval and answer evals; uses real model calls, so ask first
psql "$LOCAL_DATABASE_URL" -c "select extversion from pg_extension where extname = 'vector';"
npm audit --audit-level=moderate           # or: pip-audit
```
