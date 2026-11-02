# قواعد Cursor وAgent Skills لوكلاء البرمجة بالذكاء الاصطناعي

[English](../../README.md) | [简体中文](./README.zh-CN.md) | [हिन्दी](./README.hi.md) | [Español](./README.es.md) | **العربية** | [Français](./README.fr.md) | [বাংলা](./README.bn.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru.md) | [اردو](./README.ur.md)

> هذه ترجمة. النسخة الإنجليزية ([README.md](../../README.md)) هي المرجع، وتحتوي على الفهرس الكامل المُولَّد تلقائيًا.

**قواعد تراعي الإصدار وتضع الأمان أولًا، لـ Cursor وClaude Code وOpenAI Codex وGitHub Copilot وGemini CLI.** مفتوحة المصدر (MIT)، وتتولى صيانتها [Phaedra Solutions](https://phaedrasolutions.com).

`cursor-rules` مكتبة من قواعد البرمجة و[Agent Skills](https://agentskills.io) تجعل وكلاء البرمجة بالذكاء الاصطناعي يعملون على تقنياتك كمهندس خبير. قبل أن يكتب الوكيل أي شيفرة، تتحقق كل قاعدة من إصدار إطار العمل الذي يستخدمه مشروعك فعلًا. ثم تطبّق الأعراف الحالية وضوابط الأمان وفحوص الثغرات المعروفة لذلك الإصدار. وللإصدارات القديمة أو المنتهي دعمها (EOL)، تنتقل إلى إرشادات الشيفرة القديمة ومسار ترحيل. ومن مصدر واحد تُبنى قواعد مشروع Cursor (`.mdc`) و`AGENTS.md` و`CLAUDE.md` وAgent Skills (`SKILL.md`)، فتتبع كل أدوات فريقك التعليمات نفسها.

للأسئلة أو المشاريع: [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com).

## نظرة سريعة

| | |
|---|---|
| **ما هي** | قواعد لوكلاء البرمجة بالذكاء الاصطناعي (معايير الشيفرة، الأمان، الاختبار، التحقق من الإصدار) ومهارات تعمل عند الطلب (تدقيق، ترقية، ترحيل) |
| **تعمل مع** | Cursor وClaude Code وOpenAI Codex وGitHub Copilot وGemini CLI وأي أداة تقرأ `AGENTS.md` أو Agent Skills |
| **التقنيات** | TypeScript، React، Next.js، Angular، Vue، Nuxt، Svelte، Astro، React Native، Expo، Flutter، SwiftUI، Jetpack Compose، Node.js، Express، NestJS، Fastify، Hono، Python، FastAPI، Django، PHP، Laravel، Java، Spring Boot، C#، ASP.NET Core، Go، Supabase، Postgres، Prisma، Drizzle، MongoDB، Firebase، Docker، Kubernetes، Terraform، GitHub Actions، AWS، GCP، Azure، WordPress، تطبيقات LLM، RAG، وكلاء الذكاء الاصطناعي، خوادم MCP، وغيرها |
| **التقنيات القديمة** | AngularJS، Create React App، مكوّنات الأصناف (class components)، jQuery، Vue 2، Express 4، Node.js ≤ 20، PHP ≤ 8.2، Django ≤ 4.2، Python 2.7، Rails ≤ 7.2، Struts، .NET Framework، Xamarin، Cordova، وغيرها |
| **الأمان** | OWASP Top 10:2025، CWE Top 25، تحصين سلسلة الإمداد، دفاعات الوكلاء ضد حقن الأوامر (prompt injection)، وجداول CVE مؤرخة مع أدنى الإصدارات الآمنة |
| **التثبيت** | `node scripts/install.mjs --preset <name>`: Node.js 22 أو أحدث، دون أي اعتماديات، ودون حزمة npm |
| **الترخيص** | MIT |

## المحتويات

- [لماذا قواعد تراعي الإصدار](#لماذا-قواعد-تراعي-الإصدار)
- [كيف تعمل](#كيف-تعمل)
- [الأدوات المدعومة](#الأدوات-المدعومة)
- [البدء السريع](#البدء-السريع)
- [الإعدادات المسبقة](#الإعدادات-المسبقة)
- [التقنيات المدعومة](#التقنيات-المدعومة)
- [الفهرس](#الفهرس)
- [الأمان](#الأمان)
- [حدّث أدواتك باستمرار](#حدّث-أدواتك-باستمرار)
- [الأسئلة الشائعة](#الأسئلة-الشائعة)
- [المساهمة](#المساهمة)
- [الترخيص](#الترخيص)

## لماذا قواعد تراعي الإصدار

تُدرَّب وكلاء البرمجة بالذكاء الاصطناعي على أمثلة مختلطة جُمعت على مدى سنوات، لذلك كثيرًا ما تكتب شيفرة لإصدار خاطئ. فهي تستخدم `middleware.ts` في تطبيق Next.js 16، وNgModules في Angular 22، أو `getServerSideProps` حيث يُستخدم App Router. كما تضيف حزمًا غير موجودة، وتتجاهل فحوص الصلاحيات، وتنسخ أنماطًا معروفة بثغرات CVE.

ملفات القواعد العامة تزيد المشكلة سوءًا: فهي تفترض إصدارًا واحدًا، وتتقادم خلال أشهر، ولا تقول شيئًا عن الأمان. أما هذه القواعد فتعمل بطريقة مختلفة:

- **التحقق من الإصدار أولًا.** تبدأ كل قاعدة تقنية بقراءة الإصدار المثبت من ملف القفل (lockfile) أو ملف البيان، ثم تذكر القاعدة والإصدار اللذين تطبّقهما.
- **البقاء محدّثة.** تحدد كل قاعدة نطاق الإصدارات الذي كُتبت له (`applies_to`) ومصادرها وتاريخ `last_reviewed`. وتنبّه مهمة أسبوعية إلى القواعد التي تخلّف نطاقها عن إصدار رئيسي جديد أو عن تاريخ انتهاء الدعم.
- **التعامل الآمن مع الشيفرة القديمة.** عندما يكون المشروع دون نطاق القاعدة، يتبع الوكيل قاعدة من `legacy/`. فيُجري تغييرات صغيرة تحافظ على السلوك، ولا يستخدم أبدًا واجهات أحدث من المثبتة، ويذكر حالة انتهاء الدعم، ويضيف ضوابط تعويضية للثغرات غير المرقّعة، ويقترح مهارة ترحيل.
- **الأمان مدمج من البداية.** قواعد البرمجة الآمنة المبنية على OWASP مفعّلة دائمًا. وتضيف كل قاعدة تقنية قسم أمان خاصًا بها وجدولًا مؤرخًا للثغرات المعروفة.

## كيف تعمل

تُكتب القواعد والمهارات مرة واحدة في `rules/` و`skills/`، ثم تُبنى لكل أداة.

1. **القواعد الأساسية مفعّلة دائمًا.** تُحمَّل `core/behavior` و`core/security-baseline` و`core/supply-chain` و`core/agent-safety` في كل جلسة.
2. **قواعد التقنيات تُفعَّل حسب نوع الملف.** تعديل `app/page.tsx` يحمّل `frontend/nextjs`، وتعديل `supabase/migrations/*.sql` يحمّل `data/supabase`. وفي الأدوات التي لا تدعم القواعد الخاصة بالملفات (Codex وGemini CLI)، تُوزَّع كل قاعدة تقنية كمهارة `<stack>-conventions` تُحمَّل عند الطلب.
3. **القاعدة تتحقق من الإصدار.** يقرأ الوكيل ملف القفل ويذكر ما يطبّقه، مثلًا:

   ```text
   Applying frontend/nextjs (next 16.4.1, react 19.2.8, from pnpm-lock.yaml).
   ```

4. **القواعد القديمة تتولى الأمر دون النطاق.** مع Next.js 15 أو وجود مجلد `pages/`، يتبع الوكيل `legacy/nextjs-pages-router` و`core/legacy-mode`.
5. **المهارات تعمل عند الطلب.** إجراءات مثل `security-audit` و`cve-check` و`upgrade-nextjs` و`migrate-cra-to-vite` تبقى خارج السياق حتى تستدعيها أنت أو الوكيل، لذا فإن مكتبة مهارات كبيرة لا تكلّف شيئًا تقريبًا.

القواعد الأكثر تحديدًا تتقدم على الأعم، وقواعد الأمان تتقدم على قواعد الملاءمة ما لم تتجاوزها صراحةً. وعندها يُعلمك الوكيل بذلك.

تتبع كل القواعد البنية نفسها: **Version check** و**Conventions** و**Security** و**Known vulnerabilities** و**Testing** و**Before you finish**، وفيه الأوامر الدقيقة للفحص (lint) والتحقق من الأنواع والاختبار والتدقيق. وتضيف القواعد القديمة **Migration path**.

## الأدوات المدعومة

| الأداة | ما يُثبَّت | أين تقرؤه الأداة |
|---|---|---|
| **Cursor** (الإصدار 3.1.2 أو أحدث) | قواعد المشروع والمهارات | `.cursor/rules/**/*.mdc`، `.cursor/skills/` |
| **OpenAI Codex وGitHub Copilot وGemini CLI** وغيرها من أدوات `AGENTS.md` | `AGENTS.md` (القواعد الأساسية وفهرس التقنيات) والمهارات | `AGENTS.md`، `.agents/skills/` |
| **Claude Code** | ملف `CLAUDE.md` يستورد `AGENTS.md`، والمهارات | `CLAUDE.md`، `.claude/skills/` |

## البدء السريع

يتطلب Node.js 22 أو أحدث. لا تعتمد السكربتات على أي حزم.

1. استنسخ وسم إصدار:

   ```bash
   git clone --branch v1.1.0 https://github.com/Phaedra-Solutions/cursor-rules.git
   cd cursor-rules
   ```

2. اطّلع على ما سيثبّته إعداد مسبق في مشروعك:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
   ```

3. ثبّته:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
   ```

الخيارات:

- `--preset`: أحد [الإعدادات المسبقة](#الإعدادات-المسبقة). احذفه لتثبيت كل شيء.
- `--tool`: أي من `cursor` و`agents` (`AGENTS.md` و`.agents/skills/`) و`claude` (`CLAUDE.md` و`.claude/skills/`). القيمة الافتراضية `cursor,agents`.
- `--dry-run`: يعرض كل عملية نسخ مخطط لها دون كتابة أي شيء. شغّله أولًا.
- `--force`: يستبدل الملفات المختلفة. من دونه لا يكتب السكربت شيئًا عند وجود أي تعارض. إذا كان في مشروعك ملف `CLAUDE.md` بالفعل، فأضف إليه السطر `@AGENTS.md` بدلًا من استبداله.

يسجّل المثبّت الإصدار والإعداد المسبق وبصمة ملف البيان في `.cursor/rules/.cursor-rules-version` (أو داخل `.agents/` أو `.claude/`)، فتعرف دائمًا أي إصدار يستخدمه المشروع.

**من دون استنساخ:** نزّل الأرشيف الخاص بأداتك من [GitHub Release](https://github.com/Phaedra-Solutions/cursor-rules/releases)، وتحقق منه باستخدام `SHA256SUMS` (`sha256sum -c SHA256SUMS --ignore-missing`)، ثم انسخ محتواه إلى جذر مشروعك.

**لمعاينة النتيجة أولًا:** شغّل `node scripts/build.mjs --preset <name>` وانظر في `dist/`.

ثبّت وسم إصدار وحدّث عن قصد؛ يسرد [CHANGELOG](../../CHANGELOG.md) ما تغيّر.

## الإعدادات المسبقة

يجمع الإعداد المسبق (preset) القواعد الأساسية وقواعد التقنيات والمهارات لنوع واحد من المشاريع. اختر الأقرب إلى تقنياتك؛ ويعمل `all-core` مع أي مشروع. لا تُحمَّل قواعد التقنيات إلا عند تعديل ملفات مطابقة، لذا لا تملأ القواعد الإضافية سياق الوكيل.

| الإعداد المسبق | التقنيات |
|---|---|
| [`ai-app`](../../presets/ai-app.yml) | ميزات LLM وRAG والوكلاء وخوادم MCP (TypeScript أو Python) |
| [`all-core`](../../presets/all-core.yml) | القواعد الأساسية ومهارات الأمان فقط؛ يعمل مع أي تقنيات |
| [`laravel`](../../presets/laravel.yml) | Laravel 13 على PHP 8.3 أو أحدث |
| [`nest-angular`](../../presets/nest-angular.yml) | واجهة برمجية بـ NestJS مع واجهة أمامية بـ Angular |
| [`next-supabase`](../../presets/next-supabase.yml) | Next.js App Router مع Supabase وTypeScript وTailwind |
| [`python-fastapi`](../../presets/python-fastapi.yml) | واجهة برمجية بـ Python مع FastAPI وPydantic v2 وSQLAlchemy 2 |
| [`react-vite`](../../presets/react-vite.yml) | تطبيق React أحادي الصفحة مبني بـ Vite |
| [`rn-expo`](../../presets/rn-expo.yml) | React Native مع Expo (New Architecture) |

عدد القواعد والمهارات في كل إعداد مسبق موجود في [جدول الإعدادات المسبقة بالإنجليزية](../../README.md#presets).

## التقنيات المدعومة

لكل تقنية قاعدة حديثة، ولمعظمها أيضًا قاعدة للإصدارات القديمة ومهارة ترقية أو ترحيل.

- **اللغات:** TypeScript، JavaScript على Node.js، Python، PHP، Java، Kotlin، C#، Go، Dart، Swift، سكربتات shell.
- **الواجهة الأمامية:** React 19، Next.js 16 (App Router)، React مع Vite، Angular، Vue 3، Nuxt 4، Svelte 5 وSvelteKit، Astro، Tailwind CSS 4، shadcn/ui وRadix، النماذج والتحقق (React Hook Form، Zod، Standard Schema)، الحالة وبيانات الخادم (TanStack Query، Zustand، Redux Toolkit).
- **الجوال:** React Native وExpo (New Architecture)، Flutter، SwiftUI، Jetpack Compose، أمان تطبيقات الجوال (OWASP MASVS).
- **الواجهة الخلفية:** NestJS (النواة، الخدمات المصغّرة، الوصول إلى البيانات)، Express 5، Fastify، Hono، FastAPI، Django، Laravel، Spring Boot، ASP.NET Core، خدمات HTTP بلغة Go، GraphQL.
- **البيانات:** Supabase، PostgreSQL، Prisma، Drizzle، Sequelize، TypeORM، SQLAlchemy، MongoDB وMongoose، Firebase.
- **الاختبار:** Cypress، Playwright، Vitest وJest، pytest، فحوص إمكانية الوصول (axe-core، WCAG 2.2).
- **DevOps والسحابة:** GitHub Actions، Docker، Kubernetes، Terraform وOpenTofu، AWS، Google Cloud، Azure، Vercel، Netlify، Cloudflare Workers.
- **الذكاء الاصطناعي:** تطبيقات LLM، RAG، وكلاء الذكاء الاصطناعي، خوادم MCP (OWASP Top 10 لتطبيقات LLM والتطبيقات الوكيلية).
- **أنظمة إدارة المحتوى:** إضافات وقوالب WordPress.
- **التقنيات القديمة:** AngularJS، NgModules في Angular، Create React App ومكوّنات الأصناف، Pages Router في Next.js، المعمارية القديمة لـ React Native، jQuery، Vue 2 وNuxt 2/3، Express 4، Node.js 20 وما قبله، NestJS 11 وBull، PHP 8.2 وما قبله مع Laravel 11 وCodeIgniter 3، Python 2.7، Django 4.2، Rails 7.2 وما قبله، Java 8/11/17 مع Spring Boot 2/3، Apache Struts، .NET 8/9، .NET Framework (Web Forms وWCF وASMX)، Xamarin، Apache Cordova، Flutter 2، مفاتيح Supabase القديمة، متحكم ingress-nginx المتقاعد، Moment.js ومكتبات أخرى في وضع الصيانة.

## الفهرس

القائمة الكاملة للقواعد والمهارات، مع نطاق الإصدارات الدقيق لكل قاعدة (`applies_to`) وأولويتها (P0–P3) وحالتها، تُولَّد من الملفات وموجودة في [الفهرس الإنجليزي](../../README.md#catalog). خارج نطاق القاعدة، يتبع الوكيل `core/legacy-mode` أو قاعدة `legacy/` المطابقة.

وفي هذا المستودع أيضًا:

- [`evals/`](../../evals/README.md): مجموعات اختبار promptfoo تقيس أثر كل قاعدة من فئة P0 بتشغيل المطالبات نفسها مع القاعدة ومن دونها.
- [`templates/ci/`](../../templates/ci/README.md): سير عمل أمني لنسخه إلى مشاريعك (GitHub Actions وGitLab CI وDependabot).
- [`templates/package-managers/`](../../templates/package-managers/): إعدادات مهلة النشر الدنيا لـ npm وpnpm وYarn وBun وuv، التي تمنع الحزم المنشورة في الأيام الأخيرة.

## الأمان

الأمان جزء من كل قاعدة، وليس إضافة منفصلة.

- **قواعد أساسية مفعّلة دائمًا:**
  - `core/security-baseline`: برمجة آمنة مقسّمة حسب OWASP Top 10:2025، مع مراجع إلى CWE Top 25.
  - `core/supply-chain`: عدم اختلاق الحزم أبدًا، ملفات القفل والتثبيت المجمّد، مهلة النشر الدنيا، سياسة سكربتات التثبيت، وتثبيت إصدارات إجراءات CI.
  - `core/agent-safety`: معاملة المحتوى المجلوب كبيانات لا كتعليمات، والتعامل مع الأسرار، وطلب التأكيد قبل الأوامر الخطرة، وقوائم السماح لخوادم MCP.
  - `core/behavior`: تغييرات محصورة في المطلوب، وتنبيهات أمنية في سطر واحد حتى في الإجابات القصيرة.
- **أمان كل تقنية:** في كل قاعدة قسم أمان وجدول مؤرخ للثغرات المعروفة مع أدنى الإصدارات الآمنة. وتضيف القواعد القديمة ضوابط تعويضية للإصدارات التي لم تعد تتلقى إصلاحات.
- **مهارات الأمان:** `security-audit` (الاعتماديات والشيفرة والأسرار والحاويات وCI)، و`dependency-vet` (كشف الحزم المنتحلة والمختلقة قبل التثبيت)، و`cve-check` (البحث في OSV وGitHub Advisory)، و`secrets-scan` (gitleaks)، و`threat-model-lite` (تحليل STRIDE في 10 دقائق)، و`incident-supply-chain` (الاستجابة لاعتمادية مخترقة).
- **لمشاريعك:** تشغّل قوالب CI في [`templates/ci/`](../../templates/ci/README.md) أدوات OSV-Scanner وSemgrep وgitleaks وzizmor.
- **لهذا المستودع:** يفحص lint طلبات الدمج الواجهة الأمامية للملفات (frontmatter) والحجم ومحارف Unicode المخفية والروابط وMarkdown. وتقارن مهمة يومية [`security/watchlist.yml`](../../security/watchlist.yml) مع OSV وCISA KEV، وتفحص مهمة أسبوعية كل نطاق `applies_to` مقابل الإصدارات الجديدة وتواريخ انتهاء الدعم.
- **الإبلاغ:** راجع [SECURITY.md](../../SECURITY.md). لا تفتح بلاغات (issues) عامة عن الثغرات.

## حدّث أدواتك باستمرار

- **Cursor:** عالجت عدة إصلاحات في 2026 حالات هروب من بيئة العزل وحقن الأوامر (مثل CVE-2026-26268 وCVE-2026-48124 وCVE-2026-50548 وCVE-2026-50549 وCVE-2026-73217). استخدم **Cursor 3.1.2 أو أحدث** وثبّت التحديثات فور صدورها. راجع [نشرات Cursor الأمنية](https://github.com/cursor/cursor/security/advisories).
- **Claude Code وCodex وCopilot وغيرها من الوكلاء:** أبقها على أحدث الإصدارات؛ تغطي `core/agent-safety` ملفات إعدادها وخوادم MCP الخاصة بها.
- **هذه القواعد:** جداول الإصدارات والنشرات الأمنية تتقادم. حدّث إلى أحدث إصدار مرة في الشهر على الأقل، واستخدم مهارة `cve-check` قبل الاعتماد على أي جدول.

## الأسئلة الشائعة

### ما هي قواعد Cursor؟

قواعد Cursor تعليمات يقرؤها وكيل الذكاء الاصطناعي في Cursor أثناء عمله في مشروعك. تُحفظ قواعد المشروع في `.cursor/rules/` كملفات `.mdc` تحدد مقدمتها (frontmatter) متى تنطبق كل قاعدة: دائمًا، أو لأنماط ملفات معيّنة (`globs`)، أو حين يقرر الوكيل أن الوصف مناسب. يولّد هذا المستودع تلك الملفات من مصدر واحد، إلى جانب `AGENTS.md` وAgent Skills للأدوات الأخرى.

### هل ما زلت بحاجة إلى ملف `.cursorrules`؟

لا. الملف `.cursorrules` هو الصيغة القديمة لـ Cursor المكوّنة من ملف واحد. تقرأ الإصدارات الحالية من Cursor قواعد المشروع من `.cursor/rules/*.mdc`، حيث تحدد كل قاعدة متى تنطبق، كما تقرأ `AGENTS.md`. يكتب المثبّت كليهما. إذا كان مشروعك لا يزال يحتوي على ملف `.cursorrules`، فانقل ما لا تزال تحتاج إليه إلى قاعدة مشروع، ثم احذف الملف حتى لا تتعارض مجموعتا التعليمات.

### ما هو AGENTS.md؟

[`AGENTS.md`](https://agents.md) صيغة مفتوحة لتعليمات وكلاء البرمجة: ملف Markdown بسيط في جذر المستودع تقرؤه أدوات مثل OpenAI Codex وGitHub Copilot وGemini CLI وCursor قبل أن تبدأ العمل. وترعاه مؤسسة Agentic AI Foundation التابعة لـ Linux Foundation. يُنشئ هذا المستودع ملف `AGENTS.md` يضم القواعد الأساسية المفعّلة دائمًا وفهرسًا لقواعد التقنيات، ويقدّم إرشادات كل تقنية على شكل Agent Skills (`SKILL.md`) فلا تُحمَّل إلا عند الحاجة.

### هل تثبيت ملفات القواعد من الإنترنت آمن؟

تعامل مع ملفات القواعد كما تتعامل مع الشيفرة، لأن الوكيل ينفّذ ما فيها. في عام 2025 أثبت باحثون أن محارف Unicode غير المرئية يمكنها إخفاء تعليمات خبيثة في ملفات قواعد Cursor وCopilot (هجوم "Rules File Backdoor"). يفشل CI في هذا المستودع إذا وجد محارف صفرية العرض أو محارف تحكم ثنائية الاتجاه أو محارف وسوم في أي ملف نصي يتتبعه git، ويُنشر كل إصدار مع `SHA256SUMS`، ويعرض `--dry-run` كل ملف سيكتبه المثبّت قبل أن يكتب أي شيء. ثبّت وسم إصدار محددًا واقرأ الفروق (diff) قبل التحديث.

### ما الفرق بين القاعدة والمهارة؟

**القاعدة** إرشاد قصير وتقريري يجب أن يكون في السياق كلما عُدّلت ملفات مطابقة، مثل "استخدم `proxy.ts` لا `middleware.ts`" في Next.js 16. أما **المهارة** فإجراء خطوة بخطوة يُشغَّل عند الطلب، مثل "دقّق الاعتماديات" أو "رقِّ Angular إصدارًا رئيسيًا واحدًا في كل مرة". ولا يبقى في السياق سوى اسم المهارة ووصفها حتى تُستخدم.

### هل تعمل مع Claude Code أو Codex أو GitHub Copilot أو Gemini CLI؟

نعم. ثبّت باستخدام `--tool agents` للأدوات التي تقرأ `AGENTS.md` و`.agents/skills/` (Codex وCopilot وGemini CLI وغيرها)، أو باستخدام `--tool claude` لـ Claude Code، الذي يحصل على `CLAUDE.md` يستورد `AGENTS.md`، ومهارات في `.claude/skills/`. ويمكنك التثبيت لعدة أدوات معًا: `--tool cursor,agents,claude`.

### هل سيستبدل المثبّت ملفاتي الحالية؟

لا. لا يستبدل أبدًا ملفًا مختلفًا ما لم تمرّر `--force`، وإذا وُجد أي تعارض فلا يكتب شيئًا. شغّل `--dry-run` أولًا لترى كل عملية نسخ مخطط لها.

### مشروعي على إصدار قديم. هل ستفيدني القواعد؟

نعم. عندما يكون الإصدار المثبت دون نطاق القاعدة، يتبع الوكيل قاعدة `legacy/` المطابقة و`core/legacy-mode`. فيُبقي التغييرات في حدها الأدنى، ويذكر حالة انتهاء الدعم، ويطبّق ضوابط تعويضية للثغرات غير المرقّعة، ويقترح مهارة ترحيل مثل `migrate-angularjs` أو `upgrade-express` أو `migrate-dotnet-framework`. ولا يرحّل المشروع ما لم تطلب ذلك، ويسأل قبل تغيير أي إصدار، حتى لو كان تصحيحًا صغيرًا.

### كيف تبقى القواعد محدّثة ودقيقة؟

لكل ادعاء عن إصدار أو تاريخ أو ثغرة CVE مصدرٌ في مقدمة القاعدة. تقارن مهمة يومية الحزم المتابَعة مع OSV وفهرس CISA للثغرات المستغلّة المعروفة، وتنبّه مهمة أسبوعية إلى القواعد المتخلفة عن الإصدارات الجديدة أو تواريخ انتهاء الدعم، وتُفتح كل شهر مراجعة أمنية على شكل بلاغ (issue). ولقواعد P0 مجموعات تقييم تقيس مدى التزام الوكيل بها.

### هل يمكنني إضافة أعراف فريقي؟

نعم. توضع اختيارات الفريق الخاصة في طبقة إضافية داخل `conventions/` يمكن للإعدادات المسبقة تضمينها؛ و[`conventions/phaedra.md`](../../conventions/phaedra.md) مثال على ذلك. تحترم القواعد العامة اختيارات المشروع القائمة، لذا لا تحتاج طبقتك إلا إلى ما يختلف عند فريقك.

### كيف أضيف تقنية غير مغطاة؟

اتبع [CONTRIBUTING.md](../../CONTRIBUTING.md)، أو استخدم المطالبة القابلة لإعادة الاستخدام [`implementation-prompts/36-template-new-stack.md`](../../implementation-prompts/36-template-new-stack.md) مع وكيل الذكاء الاصطناعي لديك. يجب أن تجتاز القواعد الجديدة `node scripts/lint-rules.mjs`.

### هل هي مجانية؟

نعم. المستودع مرخّص بموجب MIT. ويحتفظ المحتوى المقتبس من [Project CodeGuard](https://github.com/cosai-oasis/project-codeguard) بإسناده وفق CC BY 4.0 في [NOTICE.md](../../NOTICE.md).

## المساهمة

راجع [CONTRIBUTING.md](../../CONTRIBUTING.md) لقوالب القواعد والمهارات وقواعد التوثيق بالمصادر وعملية المراجعة. قبل فتح طلب دمج:

```bash
node scripts/lint-rules.mjs
node --test scripts/*.test.mjs
node scripts/build.mjs
node scripts/build.mjs --catalog
```

الخطة ومبرراتها في [ROADMAP.md](../../ROADMAP.md)، والقرارات في [docs/decisions.md](../decisions.md).

## الترخيص

[MIT](../../LICENSE). إسنادات الأطراف الثالثة مدرجة في [NOTICE.md](../../NOTICE.md).

أنشأتها وتتولى صيانتها [Phaedra Solutions](https://phaedrasolutions.com)، وهي شركة لتطوير البرمجيات المخصصة وحلول الذكاء الاصطناعي. للمساعدة في تطبيق هذه القواعد على شيفرتك، راسل [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com).
