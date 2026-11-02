# AI کوڈنگ ایجنٹس کے لیے Cursor رولز اور Agent Skills

[English](../../README.md) | [简体中文](./README.zh-CN.md) | [हिन्दी](./README.hi.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [বাংলা](./README.bn.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru.md) | **اردو**

> یہ ترجمہ ہے۔ اصل ورژن انگریزی میں ہے ([README.md](../../README.md))، اور خودکار طور پر بننے والا مکمل کیٹلاگ اسی میں ہے۔

**Cursor، Claude Code، OpenAI Codex، GitHub Copilot اور Gemini CLI کے لیے ورژن کو پہچاننے والے، سیکیورٹی کو ترجیح دینے والے رولز۔** اوپن سورس (MIT)، جس کی دیکھ بھال [Phaedra Solutions](https://phaedrasolutions.com) کرتی ہے۔

`cursor-rules` کوڈنگ رولز اور [Agent Skills](https://agentskills.io) کی ایک لائبریری ہے جو AI کوڈنگ ایجنٹس کو آپ کے اسٹیک پر ایک سینئر انجینئر کی طرح کام کرواتی ہے۔ ایجنٹ کے کوڈ لکھنے سے پہلے ہر رول جانچتا ہے کہ آپ کا پروجیکٹ اصل میں فریم ورک کا کون سا ورژن استعمال کر رہا ہے۔ پھر وہ اس ورژن کے موجودہ طریقے، سیکیورٹی کنٹرولز اور معلوم کمزوریوں کی جانچ لاگو کرتا ہے۔ پرانے یا سپورٹ ختم (EOL) ہو جانے والے ورژنز کے لیے وہ پرانے کوڈ کی ہدایات اور مائیگریشن کے راستے پر چلا جاتا ہے۔ ایک ہی سورس سے Cursor پروجیکٹ رولز (`.mdc`)، `AGENTS.md`، `CLAUDE.md` اور Agent Skills (`SKILL.md`) بنتے ہیں، تاکہ آپ کی ٹیم کا ہر ٹول ایک جیسی ہدایات پر عمل کرے۔

سوالات یا پروجیکٹ کے لیے رابطہ: [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com)۔

## ایک نظر میں

| | |
|---|---|
| **یہ کیا ہے** | AI کوڈنگ ایجنٹس کے لیے رولز (کوڈنگ معیار، سیکیورٹی، ٹیسٹنگ، ورژن کی جانچ) اور ضرورت پر چلنے والی skills (آڈٹ، اپ گریڈ، مائیگریشن) |
| **کن ٹولز کے ساتھ** | Cursor، Claude Code، OpenAI Codex، GitHub Copilot، Gemini CLI اور ہر وہ ٹول جو `AGENTS.md` یا Agent Skills پڑھتا ہے |
| **اسٹیکس** | TypeScript، React، Next.js، Angular، Vue، Nuxt، Svelte، Astro، React Native، Expo، Flutter، SwiftUI، Jetpack Compose، Node.js، Express، NestJS، Fastify، Hono، Python، FastAPI، Django، PHP، Laravel، Java، Spring Boot، C#، ASP.NET Core، Go، Supabase، Postgres، Prisma، Drizzle، MongoDB، Firebase، Docker، Kubernetes، Terraform، GitHub Actions، AWS، GCP، Azure، WordPress، LLM ایپس، RAG، AI ایجنٹس، MCP سرورز اور بہت کچھ |
| **پرانے ورژنز** | AngularJS، Create React App، کلاس کمپوننٹس، jQuery، Vue 2، Express 4، Node.js ≤ 20، PHP ≤ 8.2، Django ≤ 4.2، Python 2.7، Rails ≤ 7.2، Struts، .NET Framework، Xamarin، Cordova اور بہت کچھ |
| **سیکیورٹی** | OWASP Top 10:2025، CWE Top 25، سپلائی چین کا تحفظ، ایجنٹس کے لیے پرامپٹ انجیکشن سے بچاؤ، کم از کم محفوظ ورژنز کے ساتھ تاریخ وار CVE ٹیبلز |
| **انسٹالیشن** | `node scripts/install.mjs --preset <name>`: Node.js 22 یا نیا، کوئی ڈیپینڈنسی نہیں، کوئی npm پیکیج نہیں |
| **لائسنس** | MIT |

## فہرست

- [ورژن پہچاننے والے رولز کیوں](#ورژن-پہچاننے-والے-رولز-کیوں)
- [یہ کیسے کام کرتا ہے](#یہ-کیسے-کام-کرتا-ہے)
- [معاون ٹولز](#معاون-ٹولز)
- [فوری آغاز](#فوری-آغاز)
- [پری سیٹس](#پری-سیٹس)
- [معاون اسٹیکس](#معاون-اسٹیکس)
- [کیٹلاگ](#کیٹلاگ)
- [سیکیورٹی](#سیکیورٹی)
- [اپنے ٹولز اپ ڈیٹ رکھیں](#اپنے-ٹولز-اپ-ڈیٹ-رکھیں)
- [عام سوالات](#عام-سوالات)
- [تعاون](#تعاون)
- [لائسنس](#لائسنس)

## ورژن پہچاننے والے رولز کیوں

AI کوڈنگ ایجنٹس کو برسوں کی ملی جلی مثالوں پر تربیت دی جاتی ہے، اس لیے وہ اکثر غلط ورژن کے لیے کوڈ لکھتے ہیں۔ وہ Next.js 16 ایپ میں `middleware.ts`، Angular 22 میں NgModules، یا جہاں App Router استعمال ہو رہا ہو وہاں `getServerSideProps` استعمال کرتے ہیں۔ وہ ایسے پیکیجز بھی شامل کر دیتے ہیں جو موجود ہی نہیں، اجازت (authorization) کی جانچ چھوڑ دیتے ہیں اور معلوم CVE والے پیٹرنز نقل کر لیتے ہیں۔

عام رول فائلیں یہ مسئلہ اور بڑھا دیتی ہیں: وہ ایک ہی ورژن فرض کرتی ہیں، چند مہینوں میں پرانی ہو جاتی ہیں اور سیکیورٹی کے بارے میں کچھ نہیں کہتیں۔ یہ رولز مختلف طریقے سے کام کرتے ہیں:

- **پہلے ورژن کی جانچ۔** ہر اسٹیک رول سب سے پہلے lockfile یا مینی فیسٹ سے انسٹال شدہ ورژن پڑھتا ہے، پھر بتاتا ہے کہ وہ کون سا رول اور کون سا ورژن لاگو کر رہا ہے۔
- **ہمیشہ تازہ۔** ہر رول بتاتا ہے کہ وہ کس ورژن رینج کے لیے لکھا گیا ہے (`applies_to`)، اس کے سورسز کیا ہیں اور اس کی `last_reviewed` تاریخ کیا ہے۔ ایک ہفتہ وار جاب ان رولز کی نشاندہی کرتا ہے جن کی رینج کسی نئی بڑی ریلیز یا سپورٹ ختم ہونے کی تاریخ سے پیچھے رہ گئی ہو۔
- **پرانے کوڈ کو محفوظ طریقے سے سنبھالنا۔** جب پروجیکٹ کسی رول کی رینج سے نیچے ہو تو ایجنٹ `legacy/` رول پر عمل کرتا ہے۔ وہ چھوٹی، رویہ برقرار رکھنے والی تبدیلیاں کرتا ہے، انسٹال شدہ ورژن سے نئی API کبھی استعمال نہیں کرتا، EOL کی صورتحال بتاتا ہے، بغیر پیچ والے CVE کے لیے متبادل حفاظتی کنٹرولز شامل کرتا ہے اور مائیگریشن skill تجویز کرتا ہے۔
- **سیکیورٹی شروع سے شامل۔** OWASP پر مبنی محفوظ کوڈنگ رولز ہمیشہ فعال رہتے ہیں۔ ہر اسٹیک رول میں اپنا سیکیورٹی سیکشن اور معلوم کمزوریوں کا تاریخ وار ٹیبل ہوتا ہے۔

## یہ کیسے کام کرتا ہے

رولز اور skills ایک بار `rules/` اور `skills/` میں لکھے جاتے ہیں، پھر ہر ٹول کے لیے بلڈ کیے جاتے ہیں۔

1. **کور رولز ہمیشہ فعال رہتے ہیں۔** `core/behavior`، `core/security-baseline`، `core/supply-chain` اور `core/agent-safety` ہر سیشن میں لوڈ ہوتے ہیں۔
2. **اسٹیک رولز فائل کی قسم کے مطابق جڑتے ہیں۔** `app/page.tsx` ایڈٹ کرنے پر `frontend/nextjs` لوڈ ہوتا ہے؛ `supabase/migrations/*.sql` ایڈٹ کرنے پر `data/supabase` لوڈ ہوتا ہے۔ جن ٹولز میں فائل کے لحاظ سے رولز نہیں ہوتے (Codex، Gemini CLI)، ان کے لیے ہر اسٹیک رول `<stack>-conventions` skill کے طور پر دیا جاتا ہے جو ضرورت پر لوڈ ہوتی ہے۔
3. **رول ورژن جانچتا ہے۔** ایجنٹ lockfile پڑھتا ہے اور بتاتا ہے کہ وہ کیا لاگو کر رہا ہے، مثلاً:

   ```text
   Applying frontend/nextjs (next 16.4.1, react 19.2.8, from pnpm-lock.yaml).
   ```

4. **رینج سے نیچے پرانے ورژن کے رولز سنبھالتے ہیں۔** Next.js 15 یا `pages/` ڈائریکٹری ہونے پر ایجنٹ `legacy/nextjs-pages-router` اور `core/legacy-mode` پر عمل کرتا ہے۔
5. **Skills ضرورت پر چلتی ہیں۔** `security-audit`، `cve-check`، `upgrade-nextjs` یا `migrate-cra-to-vite` جیسے طریقۂ کار اس وقت تک کانٹیکسٹ سے باہر رہتے ہیں جب تک آپ یا ایجنٹ انہیں نہ بلائیں، اس لیے skills کی بڑی لائبریری کا خرچ تقریباً صفر ہے۔

زیادہ مخصوص رولز عام رولز پر فوقیت رکھتے ہیں، اور سیکیورٹی رولز سہولت والے رولز پر فوقیت رکھتے ہیں، جب تک آپ انہیں واضح طور پر نہ بدلیں۔ ایسا ہونے پر ایجنٹ بتا دیتا ہے۔

ہر رول کا ڈھانچہ ایک جیسا ہے: **Version check**، **Conventions**، **Security**، **Known vulnerabilities**، **Testing** اور **Before you finish**، جس میں lint، ٹائپ چیک، ٹیسٹ اور آڈٹ کی درست کمانڈز ہوتی ہیں۔ پرانے ورژن کے رولز میں **Migration path** بھی ہوتا ہے۔

## معاون ٹولز

| ٹول | کیا انسٹال ہوتا ہے | ٹول اسے کہاں سے پڑھتا ہے |
|---|---|---|
| **Cursor** (3.1.2 یا نیا) | پروجیکٹ رولز اور skills | `.cursor/rules/**/*.mdc`، `.cursor/skills/` |
| **OpenAI Codex، GitHub Copilot، Gemini CLI** اور `AGENTS.md` پڑھنے والے دیگر ٹولز | `AGENTS.md` (کور رولز اور اسٹیک انڈیکس) اور skills | `AGENTS.md`، `.agents/skills/` |
| **Claude Code** | `AGENTS.md` کو امپورٹ کرنے والی `CLAUDE.md`، اور skills | `CLAUDE.md`، `.claude/skills/` |

## فوری آغاز

Node.js 22 یا نیا ورژن درکار ہے۔ اسکرپٹس کی کوئی ڈیپینڈنسی نہیں۔

1. کسی ریلیز ٹیگ کو کلون کریں:

   ```bash
   git clone --branch v1.1.0 https://github.com/Phaedra-Solutions/cursor-rules.git
   cd cursor-rules
   ```

2. دیکھیں کہ کوئی پری سیٹ آپ کے پروجیکٹ میں کیا انسٹال کرے گا:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
   ```

3. انسٹال کریں:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
   ```

آپشنز:

- `--preset`: کوئی ایک [پری سیٹ](#پری-سیٹس)۔ اسے چھوڑ دیں تو سب کچھ انسٹال ہوتا ہے۔
- `--tool`: `cursor`، `agents` (`AGENTS.md` اور `.agents/skills/`) اور `claude` (`CLAUDE.md` اور `.claude/skills/`) میں سے کوئی بھی۔ ڈیفالٹ `cursor,agents` ہے۔
- `--dry-run`: کچھ لکھے بغیر ہر منصوبہ بند کاپی دکھاتا ہے۔ پہلے یہی چلائیں۔
- `--force`: مختلف مواد والی فائلوں کو اوور رائٹ کرتا ہے۔ اس کے بغیر کوئی بھی ٹکراؤ ہو تو اسکرپٹ کچھ نہیں لکھتا۔ اگر آپ کے پروجیکٹ میں پہلے سے `CLAUDE.md` موجود ہے تو اسے اوور رائٹ کرنے کے بجائے اس میں `@AGENTS.md` والی لائن شامل کریں۔

انسٹالر ورژن، پری سیٹ اور مینی فیسٹ ہیش کو `.cursor/rules/.cursor-rules-version` (یا `.agents/` یا `.claude/` کے اندر) میں محفوظ کرتا ہے، تاکہ آپ ہمیشہ جان سکیں کہ پروجیکٹ کون سی ریلیز استعمال کر رہا ہے۔

**کلون کیے بغیر:** کسی [GitHub Release](https://github.com/Phaedra-Solutions/cursor-rules/releases) سے اپنے ٹول کا آرکائیو ڈاؤن لوڈ کریں، اسے `SHA256SUMS` سے جانچیں (`sha256sum -c SHA256SUMS --ignore-missing`)، اور اس کا مواد اپنے پروجیکٹ کے روٹ میں کاپی کریں۔

**پہلے آؤٹ پٹ دیکھنے کے لیے:** `node scripts/build.mjs --preset <name>` چلائیں اور `dist/` میں دیکھیں۔

کوئی ریلیز ٹیگ مقرر رکھیں اور سوچ سمجھ کر اپ ڈیٹ کریں؛ [CHANGELOG](../../CHANGELOG.md) میں تمام تبدیلیاں درج ہیں۔

## پری سیٹس

پری سیٹ کسی ایک قسم کے پروجیکٹ کے لیے کور رولز، اسٹیک رولز اور skills کو یکجا کرتا ہے۔ اپنے اسٹیک کے سب سے قریب والا پری سیٹ منتخب کریں؛ `all-core` کسی بھی پروجیکٹ کے ساتھ کام کرتا ہے۔ اسٹیک رولز صرف مطابقت رکھنے والی فائلیں ایڈٹ کرنے پر لوڈ ہوتے ہیں، اس لیے اضافی رولز ایجنٹ کا کانٹیکسٹ نہیں بھرتے۔

| پری سیٹ | اسٹیک |
|---|---|
| [`ai-app`](../../presets/ai-app.yml) | LLM فیچرز، RAG، ایجنٹس اور MCP سرورز (TypeScript یا Python) |
| [`all-core`](../../presets/all-core.yml) | صرف کور رولز اور سیکیورٹی skills؛ کسی بھی اسٹیک کے ساتھ کام کرتا ہے |
| [`laravel`](../../presets/laravel.yml) | PHP 8.3 یا نئے پر Laravel 13 |
| [`nest-angular`](../../presets/nest-angular.yml) | Angular فرنٹ اینڈ کے ساتھ NestJS API |
| [`next-supabase`](../../presets/next-supabase.yml) | Supabase، TypeScript اور Tailwind کے ساتھ Next.js App Router |
| [`python-fastapi`](../../presets/python-fastapi.yml) | FastAPI، Pydantic v2 اور SQLAlchemy 2 کے ساتھ Python API |
| [`react-vite`](../../presets/react-vite.yml) | Vite سے بنی React سنگل پیج ایپ |
| [`rn-expo`](../../presets/rn-expo.yml) | Expo کے ساتھ React Native (New Architecture) |

ہر پری سیٹ میں کتنے رولز اور skills ہیں، یہ [انگریزی پری سیٹ ٹیبل](../../README.md#presets) میں درج ہے۔

## معاون اسٹیکس

ہر اسٹیک کا ایک جدید رول ہے؛ زیادہ تر کے لیے پرانے ورژن کا رول اور اپ گریڈ یا مائیگریشن skill بھی موجود ہے۔

- **زبانیں:** TypeScript، Node.js پر JavaScript، Python، PHP، Java، Kotlin، C#، Go، Dart، Swift، شیل اسکرپٹس۔
- **فرنٹ اینڈ:** React 19، Next.js 16 (App Router)، Vite کے ساتھ React، Angular، Vue 3، Nuxt 4، Svelte 5 اور SvelteKit، Astro، Tailwind CSS 4، shadcn/ui اور Radix، فارمز اور ویلیڈیشن (React Hook Form، Zod، Standard Schema)، اسٹیٹ اور سرور ڈیٹا (TanStack Query، Zustand، Redux Toolkit)۔
- **موبائل:** React Native اور Expo (New Architecture)، Flutter، SwiftUI، Jetpack Compose، موبائل سیکیورٹی (OWASP MASVS)۔
- **بیک اینڈ:** NestJS (کور، مائیکرو سروسز، ڈیٹا تک رسائی)، Express 5، Fastify، Hono، FastAPI، Django، Laravel، Spring Boot، ASP.NET Core، Go HTTP سروسز، GraphQL۔
- **ڈیٹا:** Supabase، PostgreSQL، Prisma، Drizzle، Sequelize، TypeORM، SQLAlchemy، MongoDB اور Mongoose، Firebase۔
- **ٹیسٹنگ:** Cypress، Playwright، Vitest اور Jest، pytest، رسائی پذیری کی جانچ (axe-core، WCAG 2.2)۔
- **DevOps اور کلاؤڈ:** GitHub Actions، Docker، Kubernetes، Terraform اور OpenTofu، AWS، Google Cloud، Azure، Vercel، Netlify، Cloudflare Workers۔
- **AI:** LLM ایپس، RAG، AI ایجنٹس، MCP سرورز (LLM اور ایجنٹک ایپلیکیشنز کے لیے OWASP Top 10)۔
- **CMS:** WordPress پلگ انز اور تھیمز۔
- **پرانے ورژنز:** AngularJS، Angular NgModules، Create React App اور کلاس کمپوننٹس، Next.js Pages Router، React Native کا پرانا آرکیٹیکچر، jQuery، Vue 2 اور Nuxt 2/3، Express 4، Node.js 20 اور پرانے، NestJS 11 اور Bull، Laravel 11 اور CodeIgniter 3 کے ساتھ PHP 8.2 اور پرانے، Python 2.7، Django 4.2، Rails 7.2 اور پرانے، Spring Boot 2/3 کے ساتھ Java 8/11/17، Apache Struts، .NET 8/9، .NET Framework (Web Forms، WCF، ASMX)، Xamarin، Apache Cordova، Flutter 2، Supabase کی پرانی کیز، ریٹائر ہو چکا ingress-nginx کنٹرولر، Moment.js اور مینٹیننس موڈ والی دیگر لائبریریاں۔

## کیٹلاگ

تمام رولز اور skills کی مکمل فہرست، ہر رول کی درست ورژن رینج (`applies_to`)، ترجیح (P0–P3) اور حیثیت کے ساتھ، فائلوں سے خودکار طور پر بنتی ہے اور [انگریزی کیٹلاگ](../../README.md#catalog) میں موجود ہے۔ کسی رول کی رینج سے باہر ایجنٹ `core/legacy-mode` یا متعلقہ `legacy/` رول پر عمل کرتا ہے۔

اس ریپوزٹری میں یہ بھی ہے:

- [`evals/`](../../evals/README.md): promptfoo سوئٹس جو ایک ہی پرامپٹس کو رول کے ساتھ اور رول کے بغیر چلا کر ہر P0 رول کا اثر ناپتے ہیں۔
- [`templates/ci/`](../../templates/ci/README.md): آپ کے پروجیکٹس میں کاپی کرنے کے لیے سیکیورٹی ورک فلوز (GitHub Actions، GitLab CI، Dependabot)۔
- [`templates/package-managers/`](../../templates/package-managers/): npm، pnpm، Yarn، Bun اور uv کے لیے ریلیز ایج کول ڈاؤن سیٹنگز، جو پچھلے چند دنوں میں شائع ہونے والے پیکیجز کو روکتی ہیں۔

## سیکیورٹی

سیکیورٹی ہر رول کا حصہ ہے، کوئی الگ اضافہ نہیں۔

- **ہمیشہ فعال کور رولز:**
  - `core/security-baseline`: OWASP Top 10:2025 کے مطابق گروپ کی گئی محفوظ کوڈنگ، CWE Top 25 کے حوالوں کے ساتھ۔
  - `core/supply-chain`: کبھی فرضی پیکیج نہیں، lockfiles اور فروزن انسٹالز، ریلیز ایج کول ڈاؤن، انسٹال اسکرپٹ کی پالیسی اور پن کیے گئے CI actions۔
  - `core/agent-safety`: باہر سے حاصل شدہ مواد کو ہدایات نہیں بلکہ ڈیٹا سمجھنا؛ سیکرٹس کو سنبھالنا؛ خطرناک کمانڈز سے پہلے تصدیق؛ MCP سرورز کی اجازت شدہ فہرست۔
  - `core/behavior`: محدود تبدیلیاں، اور مختصر جوابات میں بھی ایک لائن میں سیکیورٹی سے متعلق نشاندہی۔
- **ہر اسٹیک کی سیکیورٹی:** ہر رول میں سیکیورٹی سیکشن اور کم از کم محفوظ ورژنز کے ساتھ معلوم کمزوریوں کا تاریخ وار ٹیبل ہے۔ پرانے ورژن کے رولز ان ورژنز کے لیے متبادل حفاظتی کنٹرولز شامل کرتے ہیں جنہیں اب فکسز نہیں ملتے۔
- **سیکیورٹی skills:** `security-audit` (ڈیپینڈنسیز، کوڈ، سیکرٹس، کنٹینرز اور CI)، `dependency-vet` (انسٹال سے پہلے ٹائپو اسکواٹنگ اور فرضی پیکیجز کی جانچ)، `cve-check` (OSV اور GitHub Advisory میں تلاش)، `secrets-scan` (gitleaks)، `threat-model-lite` (10 منٹ کا STRIDE تجزیہ) اور `incident-supply-chain` (متاثرہ ڈیپینڈنسی پر کارروائی)۔
- **آپ کے پروجیکٹس کے لیے:** [`templates/ci/`](../../templates/ci/README.md) کے CI ٹیمپلیٹس OSV-Scanner، Semgrep، gitleaks اور zizmor چلاتے ہیں۔
- **اس ریپوزٹری کے لیے:** پل ریکویسٹ lint فرنٹ میٹر (frontmatter)، سائز، چھپے ہوئے Unicode، لنکس اور Markdown کی جانچ کرتا ہے۔ ایک روزانہ جاب [`security/watchlist.yml`](../../security/watchlist.yml) کو OSV اور CISA KEV سے ملاتا ہے، اور ایک ہفتہ وار جاب ہر `applies_to` رینج کو نئی ریلیزز اور سپورٹ ختم ہونے کی تاریخوں سے جانچتا ہے۔
- **رپورٹ کرنا:** [SECURITY.md](../../SECURITY.md) دیکھیں۔ کمزوریوں کے لیے پبلک issue نہ کھولیں۔

## اپنے ٹولز اپ ڈیٹ رکھیں

- **Cursor:** 2026 کے کئی فکسز سینڈ باکس سے فرار اور پرامپٹ انجیکشن سے متعلق تھے (مثلاً CVE-2026-26268، CVE-2026-48124، CVE-2026-50548، CVE-2026-50549 اور CVE-2026-73217)۔ **Cursor 3.1.2 یا نیا** استعمال کریں اور اپ ڈیٹس آتے ہی انسٹال کریں۔ [Cursor کی سیکیورٹی ایڈوائزریز](https://github.com/cursor/cursor/security/advisories) دیکھیں۔
- **Claude Code، Codex، Copilot اور دیگر ایجنٹس:** انہیں موجودہ ریلیزز پر رکھیں؛ `core/agent-safety` ان کی کنفیگریشن فائلوں اور MCP سرورز کا احاطہ کرتا ہے۔
- **یہ رولز:** ورژن اور ایڈوائزری ٹیبلز پرانے ہو جاتے ہیں۔ کم از کم ہر مہینے تازہ ترین ریلیز پر اپ ڈیٹ کریں، اور کسی ٹیبل پر بھروسہ کرنے سے پہلے `cve-check` skill استعمال کریں۔

## عام سوالات

### Cursor رولز کیا ہیں؟

Cursor رولز وہ ہدایات ہیں جو Cursor کا AI ایجنٹ آپ کے پروجیکٹ میں کام کرتے ہوئے پڑھتا ہے۔ پروجیکٹ رولز `.cursor/rules/` میں `.mdc` فائلوں کی شکل میں ہوتے ہیں، جن کے frontmatter میں لکھا ہوتا ہے کہ ہر رول کب لاگو ہو گا: ہمیشہ، کسی فائل پیٹرن (`globs`) سے مطابقت پر، یا جب ایجنٹ فیصلہ کرے کہ تفصیل موزوں ہے۔ یہ ریپوزٹری ایک ہی سورس سے یہ فائلیں بناتی ہے، ساتھ ہی دیگر ٹولز کے لیے `AGENTS.md` اور Agent Skills بھی۔

### کیا مجھے اب بھی `.cursorrules` فائل کی ضرورت ہے؟

نہیں۔ `.cursorrules` Cursor کا پرانا، ایک فائل والا فارمیٹ ہے۔ Cursor کے موجودہ ورژن پروجیکٹ رولز `.cursor/rules/*.mdc` سے پڑھتے ہیں، جہاں ہر رول بتاتا ہے کہ وہ کب لاگو ہوگا، اور یہ `AGENTS.md` بھی پڑھتے ہیں۔ انسٹالر دونوں لکھتا ہے۔ اگر آپ کے پروجیکٹ میں اب بھی `.cursorrules` فائل موجود ہے تو جو کچھ ابھی بھی ضروری ہے اسے کسی پروجیکٹ رول میں منتقل کریں، پھر فائل حذف کر دیں تاکہ ہدایات کے دو سیٹ آپس میں نہ ٹکرائیں۔

### AGENTS.md کیا ہے؟

[`AGENTS.md`](https://agents.md) کوڈنگ ایجنٹس کے لیے ہدایات کا ایک کھلا فارمیٹ ہے: ریپوزٹری کی روٹ میں رکھی ایک سادہ Markdown فائل، جسے OpenAI Codex، GitHub Copilot، Gemini CLI اور Cursor جیسے ٹولز کام شروع کرنے سے پہلے پڑھتے ہیں۔ اس کی نگرانی Linux Foundation کی Agentic AI Foundation کرتی ہے۔ یہ ریپوزٹری ہمیشہ فعال رہنے والے کور رولز اور اسٹیک رولز کی فہرست کے ساتھ ایک `AGENTS.md` بناتی ہے، اور ہر اسٹیک کی رہنمائی Agent Skills (`SKILL.md`) کی شکل میں دیتی ہے، تاکہ وہ صرف ضرورت پڑنے پر لوڈ ہو۔

### کیا انٹرنیٹ سے رول فائلیں انسٹال کرنا محفوظ ہے؟

رول فائلوں کو کوڈ کی طرح ہی سمجھیں، کیونکہ آپ کا ایجنٹ ان پر عمل کرتا ہے۔ 2025 میں محققین نے دکھایا کہ نظر نہ آنے والے Unicode حروف Cursor اور Copilot کی رول فائلوں میں نقصان دہ ہدایات چھپا سکتے ہیں ("Rules File Backdoor")۔ git میں موجود کسی بھی ٹیکسٹ فائل میں zero-width، bidirectional-control یا tag حروف ملنے پر اس ریپوزٹری کی CI فیل ہو جاتی ہے، ہر ریلیز کے ساتھ `SHA256SUMS` ملتا ہے، اور `--dry-run` کچھ بھی لکھنے سے پہلے ہر وہ فائل دکھاتا ہے جو انسٹالر لکھے گا۔ ایک ریلیز ٹیگ پن کریں اور اپ ڈیٹ سے پہلے diff پڑھیں۔

### رول اور skill میں کیا فرق ہے؟

**رول** ایک مختصر، واضح ہدایت ہے جو مطابقت رکھنے والی فائلیں ایڈٹ ہوتے وقت ہمیشہ کانٹیکسٹ میں ہونی چاہیے، جیسے Next.js 16 میں "`middleware.ts` نہیں، `proxy.ts` استعمال کریں"۔ **Skill** ضرورت پر چلنے والا مرحلہ وار طریقۂ کار ہے، جیسے "ڈیپینڈنسیز کا آڈٹ کریں" یا "Angular کو ایک وقت میں ایک بڑا ورژن اپ گریڈ کریں"۔ استعمال ہونے تک کانٹیکسٹ میں صرف skill کا نام اور تفصیل رہتی ہے۔

### کیا یہ Claude Code، Codex، GitHub Copilot یا Gemini CLI کے ساتھ کام کرتا ہے؟

جی ہاں۔ `AGENTS.md` اور `.agents/skills/` پڑھنے والے ٹولز (Codex، Copilot، Gemini CLI اور دیگر) کے لیے `--tool agents` سے انسٹال کریں، یا Claude Code کے لیے `--tool claude` سے، جسے `AGENTS.md` امپورٹ کرنے والی `CLAUDE.md` اور `.claude/skills/` میں skills ملتی ہیں۔ آپ ایک ساتھ کئی ٹولز کے لیے انسٹال کر سکتے ہیں: `--tool cursor,agents,claude`۔

### کیا انسٹالر میری موجودہ فائلیں اوور رائٹ کر دے گا؟

نہیں۔ `--force` دیے بغیر یہ مختلف مواد والی کسی فائل کو کبھی اوور رائٹ نہیں کرتا، اور کوئی بھی ٹکراؤ ہو تو کچھ نہیں لکھتا۔ ہر منصوبہ بند کاپی دیکھنے کے لیے پہلے `--dry-run` چلائیں۔

### میرا پروجیکٹ پرانے ورژن پر ہے۔ کیا رولز پھر بھی مدد کریں گے؟

جی ہاں۔ جب انسٹال شدہ ورژن رول کی رینج سے نیچے ہو تو ایجنٹ متعلقہ `legacy/` رول اور `core/legacy-mode` پر عمل کرتا ہے۔ وہ تبدیلیاں کم سے کم رکھتا ہے، سپورٹ ختم ہونے کی صورتحال بتاتا ہے، بغیر پیچ والے CVE کے لیے متبادل حفاظتی کنٹرولز لاگو کرتا ہے اور `migrate-angularjs`، `upgrade-express` یا `migrate-dotnet-framework` جیسی مائیگریشن skill تجویز کرتا ہے۔ آپ کے کہے بغیر وہ مائیگریٹ نہیں کرتا، اور کوئی بھی ورژن بدلنے سے پہلے پوچھتا ہے، چاہے وہ صرف پیچ ہی کیوں نہ ہو۔

### رولز تازہ اور درست کیسے رہتے ہیں؟

ورژن، تاریخ یا CVE کے ہر دعوے کا سورس رول کے frontmatter میں موجود ہے۔ ایک روزانہ جاب ٹریک کیے گئے پیکیجز کو OSV اور CISA Known Exploited Vulnerabilities کیٹلاگ سے ملاتا ہے، ایک ہفتہ وار جاب نئی ریلیزز یا سپورٹ ختم ہونے کی تاریخوں سے پیچھے رہ جانے والے رولز کی نشاندہی کرتا ہے، اور ہر مہینے ایک سیکیورٹی جائزہ issue کی صورت میں کھولا جاتا ہے۔ P0 رولز کے لیے eval سوئٹس ہیں جو ناپتے ہیں کہ ایجنٹ ان پر کتنی بار عمل کرتا ہے۔

### کیا میں اپنی ٹیم کے طریقے شامل کر سکتا ہوں؟

جی ہاں۔ ٹیم کی اپنی ترجیحات `conventions/` میں ایک اوورلے میں رکھی جاتی ہیں، جسے پری سیٹس شامل کر سکتے ہیں؛ [`conventions/phaedra.md`](../../conventions/phaedra.md) اس کی ایک مثال ہے۔ عام رولز پروجیکٹ کی موجودہ ترجیحات کا احترام کرتے ہیں، اس لیے اوورلے میں صرف وہی چاہیے جو آپ کی ٹیم کے لیے مختلف ہے۔

### جو اسٹیک شامل نہیں، اسے کیسے شامل کروں؟

[CONTRIBUTING.md](../../CONTRIBUTING.md) پر عمل کریں، یا اپنے AI ایجنٹ کے ساتھ دوبارہ قابلِ استعمال پرامپٹ [`implementation-prompts/36-template-new-stack.md`](../../implementation-prompts/36-template-new-stack.md) استعمال کریں۔ نئے رولز کو `node scripts/lint-rules.mjs` پاس کرنا ہو گا۔

### کیا یہ مفت ہے؟

جی ہاں۔ یہ ریپوزٹری MIT لائسنس کے تحت ہے۔ [Project CodeGuard](https://github.com/cosai-oasis/project-codeguard) سے لیا گیا مواد اپنا CC BY 4.0 انتساب [NOTICE.md](../../NOTICE.md) میں برقرار رکھتا ہے۔

## تعاون

رول اور skill ٹیمپلیٹس، سورسز سے متعلق اصول اور جائزے کے عمل کے لیے [CONTRIBUTING.md](../../CONTRIBUTING.md) دیکھیں۔ پل ریکویسٹ کھولنے سے پہلے:

```bash
node scripts/lint-rules.mjs
node --test scripts/*.test.mjs
node scripts/build.mjs
node scripts/build.mjs --catalog
```

منصوبہ اور اس کی وجوہات [ROADMAP.md](../../ROADMAP.md) میں ہیں؛ فیصلے [docs/decisions.md](../decisions.md) میں۔

## لائسنس

[MIT](../../LICENSE)۔ تیسرے فریق کے انتسابات [NOTICE.md](../../NOTICE.md) میں درج ہیں۔

[Phaedra Solutions](https://phaedrasolutions.com) نے بنایا اور اسی کی دیکھ بھال میں ہے، جو کسٹم سافٹ ویئر اور AI ڈیولپمنٹ کمپنی ہے۔ اپنے کوڈ بیس میں ان رولز کو لاگو کرنے میں مدد کے لیے [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com) پر رابطہ کریں۔
