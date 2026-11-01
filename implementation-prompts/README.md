# Implementation prompts

These prompts implement `ROADMAP.md` in small chunks. Each one is **self-contained**: start a fresh session (or `/clear`), paste the prompt, and let it run. A prompt rereads everything it needs from the repo (`00-shared-context.md`, `ROADMAP.md` and the existing files), so no prompt relies on context left over from an earlier session.

## How to run one

Paste this into a fresh session, replacing the file name:

```
Read implementation-prompts/00-shared-context.md, then carry out implementation-prompts/01-repo-foundations.md exactly.
```

Each prompt:
- works on the `roadmap/v1` branch;
- commits its own changes locally (it never pushes);
- logs itself in `PROGRESS.md`.

Review each commit before running the next prompt. When you're done, open one PR from `roadmap/v1`, or one PR per phase.

## Order

Every prompt works on its own, but the order below gives the best results: foundations and tooling first, so later prompts get lint and build checks for free.

| # | Prompt | Roadmap phase |
|---|---|---|
| 01 | Repo foundations (license, docs, folders, decisions) | 0 |
| 02 | Fix the existing root rule files and README | 0 |
| 03 | Core: behavior + security baseline (CodeGuard adoption) | 1 |
| 04 | Core: supply chain, agent safety, legacy mode | 1 |
| 05 | Security skills 1: security-audit, dependency-vet, cve-check | 1 |
| 06 | Security skills 2: secrets-scan, threat-model-lite, incident-supply-chain, git-commit | 1 |
| 07 | Repo lint script + CI checks | 1 |
| 08 | Advisory watcher, freshness bot, monthly review | 1 / 4 |
| 09 | Security CI templates for consumer projects | 1 |
| 10 | Build + install scripts and presets | 2 |
| 11 | TypeScript, React, React + Vite | 2 |
| 12 | Next.js (+ Pages Router legacy, upgrade skill) | 2 |
| 13 | Angular (+ NgModule legacy, upgrade skill) | 2 |
| 14 | React Native + Expo (+ old-arch legacy, upgrade skill) | 2 |
| 15 | NestJS ×3 (+ upgrade skill) | 2 |
| 16 | Supabase + Postgres (+ upgrade skill) | 2 |
| 17 | Cypress, Playwright, unit tests | 2 / 3 |
| 18 | AI: LLM apps + RAG | 2 / 3 |
| 19 | AI: agents + MCP servers | 3 |
| 20 | GitHub Actions + Docker | 2 / 3 |
| 21 | Node + Express (+ legacy, upgrade skills) | 3 |
| 22 | Python, FastAPI, Django (+ legacy, upgrade skills) | 3 |
| 23 | PHP + Laravel (+ legacy, upgrade skills) | 3 |
| 24 | Vue, Nuxt, Tailwind, forms/validation (+ Vue 2 legacy) | 3 |
| 25 | Flutter, mobile security, Prisma | 3 |
| 26 | Legacy pack 1: AngularJS, CRA/class components, jQuery | 3 |
| 27 | Evals harness + suites for P0 rules | 3 / 4 |
| 28 | P2 languages: Java, Kotlin, C#, Go, Dart, Swift, shell | 4 |
| 29 | P2 backend: Spring Boot, ASP.NET Core, Go HTTP, GraphQL, Fastify/Hono | 4 |
| 30 | P2 frontend + native mobile: Svelte, Astro, state, shadcn, SwiftUI, Compose | 4 |
| 31 | P2 DevOps/cloud: Kubernetes, Terraform/OpenTofu, AWS/GCP/Azure, Vercel/Netlify/Cloudflare | 4 |
| 32 | P2 data + CMS: Firebase, MongoDB, Drizzle, Sequelize/TypeORM, SQLAlchemy, WordPress | 4 |
| 33 | Legacy pack 2a: Java/Spring Boot, Struts, .NET 8/9, .NET Framework | 4 |
| 34 | Legacy pack 2b: Xamarin, Cordova, Rails, ingress-nginx, Bull, Moment.js | 4 |
| 35 | Release: stubs for old files, final README, release workflow, v1.0.0 | 4 |
| 36 | Template: add any new stack (P3 backlog, reusable) | backlog |

If a prompt runs out of room, ask the same session to "finish the remaining files from the prompt". Or rerun the prompt in a fresh session: it detects existing files and completes them.
