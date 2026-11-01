# AI কোডিং এজেন্টের জন্য Cursor নিয়ম ও Agent Skills

[English](../../README.md) | [简体中文](./README.zh-CN.md) | [हिन्दी](./README.hi.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | **বাংলা** | [Português](./README.pt-BR.md) | [Русский](./README.ru.md) | [اردو](./README.ur.md)

> এটি একটি অনুবাদ। মূল সংস্করণ ইংরেজিতে ([README.md](../../README.md)), এবং স্বয়ংক্রিয়ভাবে তৈরি পূর্ণ ক্যাটালগ সেখানেই আছে।

**Cursor, Claude Code, OpenAI Codex, GitHub Copilot ও Gemini CLI-এর জন্য ভার্সন বুঝে কাজ করা, নিরাপত্তাকে অগ্রাধিকার দেওয়া নিয়ম।** ওপেন সোর্স (MIT), রক্ষণাবেক্ষণ করে [Phaedra Solutions](https://phaedrasolutions.com)।

`cursor-rules` হলো কোডিং নিয়ম ও [Agent Skills](https://agentskills.io)-এর একটি লাইব্রেরি, যা AI কোডিং এজেন্টকে আপনার স্ট্যাকে একজন সিনিয়র ইঞ্জিনিয়ারের মতো কাজ করায়। এজেন্ট কোড লেখার আগে প্রতিটি নিয়ম যাচাই করে আপনার প্রজেক্ট আসলে ফ্রেমওয়ার্কের কোন ভার্সন ব্যবহার করছে। তারপর সেই ভার্সনের বর্তমান কনভেনশন, নিরাপত্তা নিয়ন্ত্রণ এবং পরিচিত দুর্বলতার যাচাই প্রয়োগ করে। পুরোনো বা সাপোর্ট শেষ হয়ে যাওয়া (EOL) ভার্সনের ক্ষেত্রে এটি লিগ্যাসি কোডের নির্দেশিকা ও মাইগ্রেশনের পথে চলে যায়। একটি উৎস থেকেই Cursor প্রজেক্ট নিয়ম (`.mdc`), `AGENTS.md`, `CLAUDE.md` এবং Agent Skills (`SKILL.md`) তৈরি হয়, যাতে আপনার দলের প্রতিটি টুল একই নির্দেশনা মেনে চলে।

প্রশ্ন বা প্রজেক্টের জন্য যোগাযোগ: [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com)।

## এক নজরে

| | |
|---|---|
| **এটি কী** | AI কোডিং এজেন্টের জন্য নিয়ম (কোডিং মান, নিরাপত্তা, টেস্টিং, ভার্সন যাচাই) এবং প্রয়োজনমতো চালানো skills (অডিট, আপগ্রেড, মাইগ্রেশন) |
| **যেসব টুলে কাজ করে** | Cursor, Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI এবং যেকোনো টুল যা `AGENTS.md` বা Agent Skills পড়ে |
| **স্ট্যাক** | TypeScript, React, Next.js, Angular, Vue, Nuxt, Svelte, Astro, React Native, Expo, Flutter, SwiftUI, Jetpack Compose, Node.js, Express, NestJS, Fastify, Hono, Python, FastAPI, Django, PHP, Laravel, Java, Spring Boot, C#, ASP.NET Core, Go, Supabase, Postgres, Prisma, Drizzle, MongoDB, Firebase, Docker, Kubernetes, Terraform, GitHub Actions, AWS, GCP, Azure, WordPress, LLM অ্যাপ, RAG, AI এজেন্ট, MCP সার্ভার এবং আরও অনেক কিছু |
| **লিগ্যাসি কভারেজ** | AngularJS, Create React App, ক্লাস কম্পোনেন্ট, jQuery, Vue 2, Express 4, Node.js ≤ 20, PHP ≤ 8.2, Django ≤ 4.2, Python 2.7, Rails ≤ 7.2, Struts, .NET Framework, Xamarin, Cordova এবং আরও অনেক কিছু |
| **নিরাপত্তা** | OWASP Top 10:2025, CWE Top 25, সাপ্লাই-চেইন সুরক্ষা, এজেন্টের জন্য প্রম্পট-ইনজেকশন প্রতিরোধ, ন্যূনতম নিরাপদ ভার্সনসহ তারিখযুক্ত CVE টেবিল |
| **ইনস্টল** | `node scripts/install.mjs --preset <name>`: Node.js 22+, কোনো ডিপেন্ডেন্সি নেই, কোনো npm প্যাকেজ নেই |
| **লাইসেন্স** | MIT |

## সূচিপত্র

- [কেন ভার্সন বুঝে কাজ করা নিয়ম](#কেন-ভার্সন-বুঝে-কাজ-করা-নিয়ম)
- [কীভাবে কাজ করে](#কীভাবে-কাজ-করে)
- [সমর্থিত টুল](#সমর্থিত-টুল)
- [দ্রুত শুরু](#দ্রুত-শুরু)
- [প্রিসেট](#প্রিসেট)
- [সমর্থিত স্ট্যাক](#সমর্থিত-স্ট্যাক)
- [ক্যাটালগ](#ক্যাটালগ)
- [নিরাপত্তা](#নিরাপত্তা)
- [আপনার টুল আপডেট রাখুন](#আপনার-টুল-আপডেট-রাখুন)
- [সাধারণ প্রশ্ন](#সাধারণ-প্রশ্ন)
- [অবদান রাখুন](#অবদান-রাখুন)
- [লাইসেন্স](#লাইসেন্স)

## কেন ভার্সন বুঝে কাজ করা নিয়ম

AI কোডিং এজেন্টদের বহু বছরের মিশ্র উদাহরণ দিয়ে প্রশিক্ষণ দেওয়া হয়, তাই তারা প্রায়ই ভুল ভার্সনের জন্য কোড লেখে। তারা Next.js 16 অ্যাপে `middleware.ts`, Angular 22-এ NgModules, অথবা যেখানে App Router ব্যবহৃত হচ্ছে সেখানে `getServerSideProps` ব্যবহার করে। তারা এমন প্যাকেজও যোগ করে যা আসলে নেই, অনুমোদন (authorization) যাচাই বাদ দেয় এবং পরিচিত CVE-যুক্ত প্যাটার্ন কপি করে।

সাধারণ নিয়ম-ফাইল সমস্যাটা আরও বাড়ায়: সেগুলো একটি মাত্র ভার্সন ধরে নেয়, কয়েক মাসেই পুরোনো হয়ে যায় এবং নিরাপত্তা নিয়ে কিছুই বলে না। এই নিয়মগুলো ভিন্নভাবে কাজ করে:

- **আগে ভার্সন যাচাই।** প্রতিটি স্ট্যাক নিয়ম প্রথমে lockfile বা ম্যানিফেস্ট থেকে ইনস্টল করা ভার্সন পড়ে, তারপর জানায় কোন নিয়ম ও কোন ভার্সন প্রয়োগ করছে।
- **সবসময় হালনাগাদ।** প্রতিটি নিয়মে লেখা থাকে কোন ভার্সন রেঞ্জের জন্য এটি লেখা (`applies_to`), এর উৎস এবং `last_reviewed` তারিখ। একটি সাপ্তাহিক জব সেই নিয়মগুলো চিহ্নিত করে যাদের রেঞ্জ নতুন মেজর রিলিজ বা সাপোর্ট শেষের তারিখ থেকে পিছিয়ে পড়েছে।
- **লিগ্যাসি কোড নিরাপদে সামলানো।** কোনো প্রজেক্ট নিয়মের রেঞ্জের নিচে থাকলে এজেন্ট একটি `legacy/` নিয়ম মেনে চলে। সে ছোট, আচরণ অপরিবর্তিত রাখা পরিবর্তন করে, ইনস্টল করা ভার্সনের চেয়ে নতুন API কখনো ব্যবহার করে না, EOL অবস্থা জানায়, প্যাচবিহীন CVE-এর জন্য বিকল্প সুরক্ষা ব্যবস্থা যোগ করে এবং একটি মাইগ্রেশন skill প্রস্তাব করে।
- **নিরাপত্তা শুরু থেকেই।** OWASP-ভিত্তিক নিরাপদ কোডিং নিয়ম সবসময় চালু থাকে। প্রতিটি স্ট্যাক নিয়মে নিজস্ব নিরাপত্তা অংশ এবং পরিচিত দুর্বলতার তারিখযুক্ত টেবিল থাকে।

## কীভাবে কাজ করে

নিয়ম ও skills একবার `rules/` ও `skills/`-এ লেখা হয়, তারপর প্রতিটি টুলের জন্য বিল্ড করা হয়।

1. **কোর নিয়ম সবসময় চালু।** `core/behavior`, `core/security-baseline`, `core/supply-chain` এবং `core/agent-safety` প্রতিটি সেশনে লোড হয়।
2. **স্ট্যাক নিয়ম ফাইলের ধরন অনুযায়ী যুক্ত হয়।** `app/page.tsx` এডিট করলে `frontend/nextjs` লোড হয়; `supabase/migrations/*.sql` এডিট করলে `data/supabase` লোড হয়। যেসব টুলে ফাইলভিত্তিক নিয়ম নেই (Codex, Gemini CLI), সেখানে প্রতিটি স্ট্যাক নিয়ম `<stack>-conventions` skill হিসেবে দেওয়া হয়, যা প্রয়োজনমতো লোড হয়।
3. **নিয়ম ভার্সন যাচাই করে।** এজেন্ট lockfile পড়ে এবং জানায় কী প্রয়োগ করছে, যেমন:

   ```text
   Applying frontend/nextjs (next 16.4.1, react 19.2.8, from pnpm-lock.yaml).
   ```

4. **রেঞ্জের নিচে লিগ্যাসি নিয়ম দায়িত্ব নেয়।** Next.js 15 বা `pages/` ডিরেক্টরি থাকলে এজেন্ট `legacy/nextjs-pages-router` এবং `core/legacy-mode` মেনে চলে।
5. **Skills প্রয়োজনমতো চলে।** `security-audit`, `cve-check`, `upgrade-nextjs` বা `migrate-cra-to-vite`-এর মতো প্রক্রিয়াগুলো আপনি বা এজেন্ট না ডাকা পর্যন্ত কনটেক্সটের বাইরে থাকে, তাই বড় skill লাইব্রেরির খরচ প্রায় শূন্য।

বেশি নির্দিষ্ট নিয়ম সাধারণ নিয়মের চেয়ে অগ্রাধিকার পায়, এবং নিরাপত্তা নিয়ম সুবিধার নিয়মের চেয়ে অগ্রাধিকার পায়, যদি না আপনি স্পষ্টভাবে সেগুলো বাতিল করেন। তখন এজেন্ট সেটা জানিয়ে দেয়।

প্রতিটি নিয়মের গঠন একই: **Version check**, **Conventions**, **Security**, **Known vulnerabilities**, **Testing** এবং **Before you finish**, যেখানে lint, টাইপ-চেক, টেস্ট ও অডিটের সঠিক কমান্ড দেওয়া থাকে। লিগ্যাসি নিয়মে **Migration path**-ও থাকে।

## সমর্থিত টুল

| টুল | কী ইনস্টল হয় | টুল কোথা থেকে পড়ে |
|---|---|---|
| **Cursor** (3.1.2 বা নতুন) | প্রজেক্ট নিয়ম ও skills | `.cursor/rules/**/*.mdc`, `.cursor/skills/` |
| **OpenAI Codex, GitHub Copilot, Gemini CLI** এবং `AGENTS.md` পড়া অন্যান্য টুল | `AGENTS.md` (কোর নিয়ম ও স্ট্যাক ইনডেক্স) এবং skills | `AGENTS.md`, `.agents/skills/` |
| **Claude Code** | `AGENTS.md` ইমপোর্ট করা `CLAUDE.md`, এবং skills | `CLAUDE.md`, `.claude/skills/` |

## দ্রুত শুরু

Node.js 22 বা নতুন ভার্সন প্রয়োজন। স্ক্রিপ্টগুলোর কোনো ডিপেন্ডেন্সি নেই।

1. একটি রিলিজ ট্যাগ ক্লোন করুন:

   ```bash
   git clone --branch v1.1.0 https://github.com/Phaedra-Solutions/cursor-rules.git
   cd cursor-rules
   ```

2. দেখুন একটি প্রিসেট আপনার প্রজেক্টে কী ইনস্টল করবে:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
   ```

3. ইনস্টল করুন:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
   ```

অপশন:

- `--preset`: যেকোনো একটি [প্রিসেট](#প্রিসেট)। বাদ দিলে সবকিছু ইনস্টল হয়।
- `--tool`: `cursor`, `agents` (`AGENTS.md` ও `.agents/skills/`) এবং `claude` (`CLAUDE.md` ও `.claude/skills/`)-এর যেকোনোটি। ডিফল্ট `cursor,agents`।
- `--dry-run`: কিছু না লিখে প্রতিটি পরিকল্পিত কপি দেখায়। আগে এটি চালান।
- `--force`: ভিন্ন বিষয়বস্তুর ফাইল ওভাররাইট করে। এটি ছাড়া কোনো দ্বন্দ্ব থাকলে স্ক্রিপ্ট কিছুই লেখে না। আপনার প্রজেক্টে আগে থেকেই `CLAUDE.md` থাকলে সেটি ওভাররাইট না করে তাতে `@AGENTS.md` লাইনটি যোগ করুন।

ইনস্টলার ভার্সন, প্রিসেট ও ম্যানিফেস্ট হ্যাশ `.cursor/rules/.cursor-rules-version`-এ (বা `.agents/` বা `.claude/`-এর ভেতরে) লিখে রাখে, তাই আপনি সবসময় জানতে পারেন প্রজেক্ট কোন রিলিজ ব্যবহার করছে।

**ক্লোন না করে:** একটি [GitHub Release](https://github.com/Phaedra-Solutions/cursor-rules/releases) থেকে আপনার টুলের আর্কাইভ ডাউনলোড করুন, `SHA256SUMS` দিয়ে যাচাই করুন (`sha256sum -c SHA256SUMS --ignore-missing`), তারপর বিষয়বস্তু আপনার প্রজেক্টের রুটে কপি করুন।

**আগে আউটপুট দেখতে:** `node scripts/build.mjs --preset <name>` চালান এবং `dist/` দেখুন।

একটি রিলিজ ট্যাগ নির্দিষ্ট রাখুন এবং ভেবেচিন্তে আপডেট করুন; [CHANGELOG](../../CHANGELOG.md)-এ সব পরিবর্তন লেখা আছে।

## প্রিসেট

একটি প্রিসেট নির্দিষ্ট ধরনের প্রজেক্টের জন্য কোর নিয়ম, স্ট্যাক নিয়ম ও skills একসাথে দেয়। আপনার স্ট্যাকের সবচেয়ে কাছেরটি বেছে নিন; `all-core` যেকোনো প্রজেক্টে কাজ করে। স্ট্যাক নিয়ম শুধু মিলে যাওয়া ফাইল এডিট করলেই লোড হয়, তাই বাড়তি নিয়ম এজেন্টের কনটেক্সট ভরিয়ে ফেলে না।

| প্রিসেট | স্ট্যাক |
|---|---|
| [`ai-app`](../../presets/ai-app.yml) | LLM ফিচার, RAG, এজেন্ট ও MCP সার্ভার (TypeScript বা Python) |
| [`all-core`](../../presets/all-core.yml) | শুধু কোর নিয়ম ও নিরাপত্তা skills; যেকোনো স্ট্যাকে কাজ করে |
| [`laravel`](../../presets/laravel.yml) | PHP 8.3+-এ Laravel 13 |
| [`nest-angular`](../../presets/nest-angular.yml) | Angular ফ্রন্ট এন্ডসহ NestJS API |
| [`next-supabase`](../../presets/next-supabase.yml) | Supabase, TypeScript ও Tailwind-সহ Next.js App Router |
| [`python-fastapi`](../../presets/python-fastapi.yml) | FastAPI, Pydantic v2 ও SQLAlchemy 2-সহ Python API |
| [`react-vite`](../../presets/react-vite.yml) | Vite দিয়ে তৈরি React সিঙ্গেল-পেজ অ্যাপ |
| [`rn-expo`](../../presets/rn-expo.yml) | Expo-সহ React Native (New Architecture) |

প্রতিটি প্রিসেটে কতগুলো নিয়ম ও skills আছে, তা [ইংরেজি প্রিসেট টেবিলে](../../README.md#presets) দেওয়া আছে।

## সমর্থিত স্ট্যাক

প্রতিটি স্ট্যাকের একটি আধুনিক নিয়ম আছে; বেশিরভাগের একটি লিগ্যাসি নিয়ম এবং একটি আপগ্রেড বা মাইগ্রেশন skill-ও আছে।

- **ভাষা:** TypeScript, Node.js-এ JavaScript, Python, PHP, Java, Kotlin, C#, Go, Dart, Swift, শেল স্ক্রিপ্ট।
- **ফ্রন্ট এন্ড:** React 19, Next.js 16 (App Router), Vite-সহ React, Angular, Vue 3, Nuxt 4, Svelte 5 ও SvelteKit, Astro, Tailwind CSS 4, shadcn/ui ও Radix, ফর্ম ও ভ্যালিডেশন (React Hook Form, Zod, Standard Schema), স্টেট ও সার্ভার ডেটা (TanStack Query, Zustand, Redux Toolkit)।
- **মোবাইল:** React Native ও Expo (New Architecture), Flutter, SwiftUI, Jetpack Compose, মোবাইল নিরাপত্তা (OWASP MASVS)।
- **ব্যাক এন্ড:** NestJS (কোর, মাইক্রোসার্ভিস, ডেটা অ্যাক্সেস), Express 5, Fastify, Hono, FastAPI, Django, Laravel, Spring Boot, ASP.NET Core, Go HTTP সার্ভিস, GraphQL।
- **ডেটা:** Supabase, PostgreSQL, Prisma, Drizzle, Sequelize, TypeORM, SQLAlchemy, MongoDB ও Mongoose, Firebase।
- **টেস্টিং:** Cypress, Playwright, Vitest ও Jest, pytest, অ্যাক্সেসিবিলিটি যাচাই (axe-core, WCAG 2.2)।
- **DevOps ও ক্লাউড:** GitHub Actions, Docker, Kubernetes, Terraform ও OpenTofu, AWS, Google Cloud, Azure, Vercel, Netlify, Cloudflare Workers।
- **AI:** LLM অ্যাপ, RAG, AI এজেন্ট, MCP সার্ভার (LLM ও এজেন্টিক অ্যাপ্লিকেশনের জন্য OWASP Top 10)।
- **CMS:** WordPress প্লাগইন ও থিম।
- **লিগ্যাসি:** AngularJS, Angular NgModules, Create React App ও ক্লাস কম্পোনেন্ট, Next.js Pages Router, React Native-এর পুরোনো আর্কিটেকচার, jQuery, Vue 2 ও Nuxt 2/3, Express 4, Node.js 20 ও তার আগের, NestJS 11 ও Bull, Laravel 11 ও CodeIgniter 3-সহ PHP 8.2 ও তার আগের, Python 2.7, Django 4.2, Rails 7.2 ও তার আগের, Spring Boot 2/3-সহ Java 8/11/17, Apache Struts, .NET 8/9, .NET Framework (Web Forms, WCF, ASMX), Xamarin, Apache Cordova, Flutter 2, Supabase-এর পুরোনো কী, অবসরপ্রাপ্ত ingress-nginx কন্ট্রোলার, Moment.js এবং রক্ষণাবেক্ষণ মোডে থাকা অন্যান্য লাইব্রেরি।

## ক্যাটালগ

সব নিয়ম ও skills-এর পূর্ণ তালিকা, প্রতিটি নিয়মের সঠিক ভার্সন রেঞ্জ (`applies_to`), অগ্রাধিকার (P0–P3) ও অবস্থাসহ, ফাইল থেকে স্বয়ংক্রিয়ভাবে তৈরি হয় এবং [ইংরেজি ক্যাটালগে](../../README.md#catalog) আছে। কোনো নিয়মের রেঞ্জের বাইরে এজেন্ট `core/legacy-mode` বা সংশ্লিষ্ট `legacy/` নিয়ম মেনে চলে।

এই রিপোজিটরিতে আরও আছে:

- [`evals/`](../../evals/README.md): promptfoo স্যুট, যা একই প্রম্পট নিয়মসহ ও নিয়ম ছাড়া চালিয়ে প্রতিটি P0 নিয়মের প্রভাব মাপে।
- [`templates/ci/`](../../templates/ci/README.md): আপনার প্রজেক্টে কপি করার জন্য নিরাপত্তা ওয়ার্কফ্লো (GitHub Actions, GitLab CI, Dependabot)।
- [`templates/package-managers/`](../../templates/package-managers/): npm, pnpm, Yarn, Bun ও uv-এর জন্য রিলিজ-এজ কুলডাউন সেটিং, যা গত কয়েক দিনে প্রকাশিত প্যাকেজ আটকে দেয়।

## নিরাপত্তা

নিরাপত্তা প্রতিটি নিয়মের অংশ, আলাদা কোনো অ্যাড-অন নয়।

- **সবসময় চালু কোর নিয়ম:**
  - `core/security-baseline`: OWASP Top 10:2025 অনুযায়ী সাজানো নিরাপদ কোডিং, CWE Top 25-এর রেফারেন্সসহ।
  - `core/supply-chain`: কখনো কাল্পনিক প্যাকেজ নয়, lockfile ও ফ্রোজেন ইনস্টল, রিলিজ-এজ কুলডাউন, ইনস্টল-স্ক্রিপ্ট নীতি এবং পিন করা CI actions।
  - `core/agent-safety`: বাইরে থেকে আনা বিষয়বস্তুকে নির্দেশ নয়, ডেটা হিসেবে ধরা; সিক্রেট সামলানো; ঝুঁকিপূর্ণ কমান্ডের আগে নিশ্চিতকরণ; MCP সার্ভারের অনুমোদিত তালিকা।
  - `core/behavior`: সীমিত পরিবর্তন এবং ছোট উত্তরেও এক লাইনে নিরাপত্তা সংক্রান্ত সতর্কতা।
- **প্রতিটি স্ট্যাকের নিরাপত্তা:** প্রতিটি নিয়মে একটি নিরাপত্তা অংশ এবং ন্যূনতম নিরাপদ ভার্সনসহ পরিচিত দুর্বলতার তারিখযুক্ত টেবিল আছে। যেসব ভার্সন আর ফিক্স পায় না, তাদের জন্য লিগ্যাসি নিয়ম বিকল্প সুরক্ষা ব্যবস্থা যোগ করে।
- **নিরাপত্তা skills:** `security-audit` (ডিপেন্ডেন্সি, কোড, সিক্রেট, কন্টেইনার ও CI), `dependency-vet` (ইনস্টলের আগে টাইপোস্কোয়াটিং ও কাল্পনিক প্যাকেজ যাচাই), `cve-check` (OSV ও GitHub Advisory-তে অনুসন্ধান), `secrets-scan` (gitleaks), `threat-model-lite` (১০ মিনিটের STRIDE বিশ্লেষণ) এবং `incident-supply-chain` (আপসকৃত ডিপেন্ডেন্সির ক্ষেত্রে করণীয়)।
- **আপনার প্রজেক্টের জন্য:** [`templates/ci/`](../../templates/ci/README.md)-এর CI টেমপ্লেট OSV-Scanner, Semgrep, gitleaks ও zizmor চালায়।
- **এই রিপোজিটরির জন্য:** পুল-রিকোয়েস্ট lint frontmatter, আকার, লুকানো Unicode, লিংক ও Markdown যাচাই করে। একটি দৈনিক জব [`security/watchlist.yml`](../../security/watchlist.yml)-কে OSV ও CISA KEV-এর সাথে মিলিয়ে দেখে, আর একটি সাপ্তাহিক জব প্রতিটি `applies_to` রেঞ্জকে নতুন রিলিজ ও সাপোর্ট শেষের তারিখের সাথে যাচাই করে।
- **রিপোর্ট করা:** [SECURITY.md](../../SECURITY.md) দেখুন। দুর্বলতার জন্য পাবলিক issue খুলবেন না।

## আপনার টুল আপডেট রাখুন

- **Cursor:** ২০২৬ সালের বেশ কয়েকটি ফিক্স স্যান্ডবক্স থেকে বেরিয়ে যাওয়া ও প্রম্পট ইনজেকশন সংক্রান্ত ছিল (যেমন CVE-2026-26268, CVE-2026-48124, CVE-2026-50548, CVE-2026-50549 ও CVE-2026-73217)। **Cursor 3.1.2 বা নতুন** ব্যবহার করুন এবং আপডেট এলেই ইনস্টল করুন। [Cursor-এর নিরাপত্তা অ্যাডভাইজরি](https://github.com/cursor/cursor/security/advisories) দেখুন।
- **Claude Code, Codex, Copilot ও অন্যান্য এজেন্ট:** এগুলো বর্তমান রিলিজে রাখুন; `core/agent-safety` এদের কনফিগারেশন ফাইল ও MCP সার্ভার কভার করে।
- **এই নিয়মগুলো:** ভার্সন ও অ্যাডভাইজরি টেবিল পুরোনো হয়ে যায়। অন্তত প্রতি মাসে সর্বশেষ রিলিজে আপডেট করুন, এবং কোনো টেবিলের উপর নির্ভর করার আগে `cve-check` skill ব্যবহার করুন।

## সাধারণ প্রশ্ন

### Cursor নিয়ম কী?

Cursor নিয়ম হলো এমন নির্দেশনা, যা Cursor-এর AI এজেন্ট আপনার প্রজেক্টে কাজ করার সময় পড়ে। প্রজেক্ট নিয়ম `.cursor/rules/`-এ `.mdc` ফাইল হিসেবে থাকে, যার frontmatter-এ লেখা থাকে প্রতিটি নিয়ম কখন প্রযোজ্য: সবসময়, নির্দিষ্ট ফাইল প্যাটার্নের (`globs`) জন্য, অথবা যখন এজেন্ট মনে করে বিবরণটি মিলে যায়। এই রিপোজিটরি একটি উৎস থেকে এই ফাইলগুলো তৈরি করে, সাথে অন্যান্য টুলের জন্য `AGENTS.md` ও Agent Skills।

### নিয়ম আর skill-এর মধ্যে পার্থক্য কী?

**নিয়ম** হলো ছোট, ঘোষণামূলক নির্দেশনা, যা মিলে যাওয়া ফাইল এডিট করার সময় সবসময় কনটেক্সটে থাকতে হয়, যেমন Next.js 16-এ "`middleware.ts` নয়, `proxy.ts` ব্যবহার করুন"। **Skill** হলো প্রয়োজনমতো চালানো ধাপে ধাপে প্রক্রিয়া, যেমন "ডিপেন্ডেন্সি অডিট করুন" বা "Angular একবারে একটি মেজর ভার্সন আপগ্রেড করুন"। ব্যবহার না হওয়া পর্যন্ত কনটেক্সটে শুধু skill-এর নাম ও বিবরণ থাকে।

### এটি কি Claude Code, Codex, GitHub Copilot বা Gemini CLI-তে কাজ করে?

হ্যাঁ। `AGENTS.md` ও `.agents/skills/` পড়া টুলের জন্য (Codex, Copilot, Gemini CLI ও অন্যান্য) `--tool agents` দিয়ে ইনস্টল করুন, অথবা Claude Code-এর জন্য `--tool claude` দিয়ে, যা `AGENTS.md` ইমপোর্ট করা একটি `CLAUDE.md` এবং `.claude/skills/`-এ skills পায়। একসাথে একাধিক টুলের জন্যও ইনস্টল করা যায়: `--tool cursor,agents,claude`।

### ইনস্টলার কি আমার বিদ্যমান ফাইল ওভাররাইট করবে?

না। `--force` না দিলে এটি ভিন্ন বিষয়বস্তুর কোনো ফাইল কখনো ওভাররাইট করে না, এবং কোনো দ্বন্দ্ব থাকলে কিছুই লেখে না। প্রতিটি পরিকল্পিত কপি দেখতে আগে `--dry-run` চালান।

### আমার প্রজেক্ট পুরোনো ভার্সনে আছে। নিয়মগুলো কি তবুও কাজে আসবে?

হ্যাঁ। ইনস্টল করা ভার্সন কোনো নিয়মের রেঞ্জের নিচে থাকলে এজেন্ট সংশ্লিষ্ট `legacy/` নিয়ম ও `core/legacy-mode` মেনে চলে। সে পরিবর্তন ন্যূনতম রাখে, সাপোর্ট শেষের অবস্থা জানায়, প্যাচবিহীন CVE-এর জন্য বিকল্প সুরক্ষা ব্যবস্থা প্রয়োগ করে এবং `migrate-angularjs`, `upgrade-express` বা `migrate-dotnet-framework`-এর মতো মাইগ্রেশন skill প্রস্তাব করে। আপনি না বললে সে মাইগ্রেট করে না, এবং যেকোনো ভার্সন বদলানোর আগে জিজ্ঞেস করে, এমনকি প্যাচ হলেও।

### নিয়মগুলো কীভাবে হালনাগাদ ও নির্ভুল থাকে?

ভার্সন, তারিখ বা CVE সংক্রান্ত প্রতিটি দাবির উৎস নিয়মের frontmatter-এ আছে। একটি দৈনিক জব ট্র্যাক করা প্যাকেজগুলোকে OSV ও CISA Known Exploited Vulnerabilities ক্যাটালগের সাথে মিলিয়ে দেখে, একটি সাপ্তাহিক জব নতুন রিলিজ বা সাপোর্ট শেষের তারিখ থেকে পিছিয়ে পড়া নিয়ম চিহ্নিত করে, এবং প্রতি মাসে একটি নিরাপত্তা পর্যালোচনা issue হিসেবে খোলা হয়। P0 নিয়মগুলোর জন্য eval স্যুট আছে, যা মাপে এজেন্ট কত ঘন ঘন সেগুলো মেনে চলে।

### আমি কি আমার দলের নিজস্ব কনভেনশন যোগ করতে পারি?

হ্যাঁ। দলের নিজস্ব পছন্দগুলো `conventions/`-এর একটি ওভারলেতে রাখা হয়, যা প্রিসেট অন্তর্ভুক্ত করতে পারে; [`conventions/phaedra.md`](../../conventions/phaedra.md) এর একটি উদাহরণ। সাধারণ নিয়মগুলো প্রজেক্টের বিদ্যমান পছন্দকে সম্মান করে, তাই ওভারলেতে শুধু আপনার দলের জন্য যা আলাদা সেটুকুই দরকার।

### কভার করা হয়নি এমন স্ট্যাক কীভাবে যোগ করব?

[CONTRIBUTING.md](../../CONTRIBUTING.md) অনুসরণ করুন, অথবা আপনার AI এজেন্টের সাথে পুনর্ব্যবহারযোগ্য প্রম্পট [`implementation-prompts/36-template-new-stack.md`](../../implementation-prompts/36-template-new-stack.md) ব্যবহার করুন। নতুন নিয়মকে `node scripts/lint-rules.mjs` পাস করতে হবে।

### এটি কি বিনামূল্যে?

হ্যাঁ। রিপোজিটরিটি MIT লাইসেন্সের অধীনে। [Project CodeGuard](https://github.com/cosai-oasis/project-codeguard) থেকে নেওয়া বিষয়বস্তু তার CC BY 4.0 স্বীকৃতি [NOTICE.md](../../NOTICE.md)-এ বজায় রাখে।

## অবদান রাখুন

নিয়ম ও skill টেমপ্লেট, উৎস সংক্রান্ত নিয়ম এবং পর্যালোচনা প্রক্রিয়ার জন্য [CONTRIBUTING.md](../../CONTRIBUTING.md) দেখুন। পুল রিকোয়েস্ট খোলার আগে:

```bash
node scripts/lint-rules.mjs
node --test scripts/*.test.mjs
node scripts/build.mjs
node scripts/build.mjs --catalog
```

পরিকল্পনা ও তার যুক্তি [ROADMAP.md](../../ROADMAP.md)-এ আছে; সিদ্ধান্তগুলো [docs/decisions.md](../decisions.md)-এ।

## লাইসেন্স

[MIT](../../LICENSE)। তৃতীয় পক্ষের স্বীকৃতি [NOTICE.md](../../NOTICE.md)-এ তালিকাভুক্ত।

[Phaedra Solutions](https://phaedrasolutions.com) তৈরি ও রক্ষণাবেক্ষণ করে, যা একটি কাস্টম সফটওয়্যার ও AI ডেভেলপমেন্ট কোম্পানি। আপনার কোডবেসে এই নিয়মগুলো প্রয়োগে সাহায্যের জন্য [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com)-এ যোগাযোগ করুন।
