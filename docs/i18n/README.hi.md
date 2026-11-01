# AI कोडिंग एजेंट्स के लिए Cursor नियम और Agent Skills

[English](../../README.md) | [简体中文](./README.zh-CN.md) | **हिन्दी** | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [বাংলা](./README.bn.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru.md) | [اردو](./README.ur.md)

> यह एक अनुवाद है। मूल संस्करण अंग्रेज़ी में है ([README.md](../../README.md)), और उसी में अपने-आप बनने वाला पूरा कैटलॉग है।

**Cursor, Claude Code, OpenAI Codex, GitHub Copilot और Gemini CLI के लिए वर्ज़न को पहचानने वाले, सुरक्षा को प्राथमिकता देने वाले नियम।** ओपन सोर्स (MIT), [Phaedra Solutions](https://phaedrasolutions.com) द्वारा मेंटेन किया जाता है।

`cursor-rules` कोडिंग नियमों और [Agent Skills](https://agentskills.io) की एक लाइब्रेरी है, जो AI कोडिंग एजेंट्स को आपके स्टैक पर एक सीनियर इंजीनियर की तरह काम करवाती है। एजेंट के कोड लिखने से पहले हर नियम जाँचता है कि आपका प्रोजेक्ट असल में फ़्रेमवर्क का कौन-सा वर्ज़न इस्तेमाल करता है। फिर वह उस वर्ज़न के मौजूदा कन्वेंशन, सुरक्षा नियंत्रण और ज्ञात कमज़ोरियों की जाँच लागू करता है। पुराने या सपोर्ट ख़त्म (EOL) हो चुके वर्ज़न के लिए वह लेगेसी कोड के दिशानिर्देशों और माइग्रेशन के रास्ते पर चला जाता है। एक ही सोर्स से Cursor प्रोजेक्ट नियम (`.mdc`), `AGENTS.md`, `CLAUDE.md` और Agent Skills (`SKILL.md`) बनते हैं, ताकि आपकी टीम का हर टूल एक जैसे निर्देशों का पालन करे।

सवाल या प्रोजेक्ट के लिए संपर्क: [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com)।

## एक नज़र में

| | |
|---|---|
| **यह क्या है** | AI कोडिंग एजेंट्स के लिए नियम (कोडिंग मानक, सुरक्षा, टेस्टिंग, वर्ज़न जाँच) और ज़रूरत पड़ने पर चलने वाली skills (ऑडिट, अपग्रेड, माइग्रेशन) |
| **इनके साथ काम करता है** | Cursor, Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI और हर वह टूल जो `AGENTS.md` या Agent Skills पढ़ता है |
| **स्टैक** | TypeScript, React, Next.js, Angular, Vue, Nuxt, Svelte, Astro, React Native, Expo, Flutter, SwiftUI, Jetpack Compose, Node.js, Express, NestJS, Fastify, Hono, Python, FastAPI, Django, PHP, Laravel, Java, Spring Boot, C#, ASP.NET Core, Go, Supabase, Postgres, Prisma, Drizzle, MongoDB, Firebase, Docker, Kubernetes, Terraform, GitHub Actions, AWS, GCP, Azure, WordPress, LLM ऐप्स, RAG, AI एजेंट्स, MCP सर्वर और भी बहुत कुछ |
| **लेगेसी कवरेज** | AngularJS, Create React App, क्लास कंपोनेंट्स, jQuery, Vue 2, Express 4, Node.js ≤ 20, PHP ≤ 8.2, Django ≤ 4.2, Python 2.7, Rails ≤ 7.2, Struts, .NET Framework, Xamarin, Cordova और भी बहुत कुछ |
| **सुरक्षा** | OWASP Top 10:2025, CWE Top 25, सप्लाई-चेन सुरक्षा, एजेंट्स के लिए प्रॉम्प्ट-इंजेक्शन से बचाव, न्यूनतम सुरक्षित वर्ज़न के साथ तारीख़ वाली CVE तालिकाएँ |
| **इंस्टॉल** | `node scripts/install.mjs --preset <name>`: Node.js 22+, कोई डिपेंडेंसी नहीं, कोई npm पैकेज नहीं |
| **लाइसेंस** | MIT |

## विषय सूची

- [वर्ज़न पहचानने वाले नियम क्यों](#वर्ज़न-पहचानने-वाले-नियम-क्यों)
- [यह कैसे काम करता है](#यह-कैसे-काम-करता-है)
- [समर्थित टूल](#समर्थित-टूल)
- [जल्दी शुरुआत](#जल्दी-शुरुआत)
- [प्रीसेट](#प्रीसेट)
- [समर्थित स्टैक](#समर्थित-स्टैक)
- [कैटलॉग](#कैटलॉग)
- [सुरक्षा](#सुरक्षा)
- [अपने टूल अपडेट रखें](#अपने-टूल-अपडेट-रखें)
- [अक्सर पूछे जाने वाले सवाल](#अक्सर-पूछे-जाने-वाले-सवाल)
- [योगदान](#योगदान)
- [लाइसेंस](#लाइसेंस)

## वर्ज़न पहचानने वाले नियम क्यों

AI कोडिंग एजेंट्स को सालों के मिले-जुले उदाहरणों पर ट्रेन किया जाता है, इसलिए वे अक्सर ग़लत वर्ज़न के लिए कोड लिखते हैं। वे Next.js 16 ऐप में `middleware.ts`, Angular 22 में NgModules, या जहाँ App Router इस्तेमाल हो रहा है वहाँ `getServerSideProps` का उपयोग करते हैं। वे ऐसे पैकेज भी जोड़ देते हैं जो मौजूद ही नहीं हैं, ऑथराइज़ेशन जाँच छोड़ देते हैं और ज्ञात CVE वाले पैटर्न कॉपी कर लेते हैं।

सामान्य नियम-फ़ाइलें इस समस्या को और बढ़ाती हैं: वे एक ही वर्ज़न मानकर चलती हैं, कुछ महीनों में पुरानी पड़ जाती हैं और सुरक्षा के बारे में कुछ नहीं कहतीं। ये नियम अलग तरीक़े से काम करते हैं:

- **पहले वर्ज़न की जाँच।** हर स्टैक नियम सबसे पहले lockfile या मैनिफ़ेस्ट से इंस्टॉल किया गया वर्ज़न पढ़ता है, फिर बताता है कि वह कौन-सा नियम और वर्ज़न लागू कर रहा है।
- **हमेशा अपडेट।** हर नियम बताता है कि वह किस वर्ज़न रेंज के लिए लिखा गया है (`applies_to`), उसके सोर्स क्या हैं और उसकी `last_reviewed` तारीख़ क्या है। एक साप्ताहिक जॉब उन नियमों को चिह्नित करता है जिनकी रेंज किसी नए मेजर रिलीज़ या सपोर्ट ख़त्म होने की तारीख़ से पीछे रह गई है।
- **लेगेसी कोड को सुरक्षित तरीक़े से संभालना।** जब प्रोजेक्ट किसी नियम की रेंज से नीचे होता है, तो एजेंट `legacy/` नियम का पालन करता है। वह छोटे, व्यवहार न बदलने वाले बदलाव करता है, इंस्टॉल किए गए वर्ज़न से नई API कभी इस्तेमाल नहीं करता, EOL स्थिति बताता है, बिना पैच वाले CVE के लिए वैकल्पिक सुरक्षा नियंत्रण जोड़ता है और माइग्रेशन skill सुझाता है।
- **सुरक्षा पहले से शामिल।** OWASP पर आधारित सुरक्षित-कोडिंग नियम हमेशा चालू रहते हैं। हर स्टैक नियम में अपना सुरक्षा सेक्शन और ज्ञात कमज़ोरियों की तारीख़ वाली तालिका होती है।

## यह कैसे काम करता है

नियम और skills एक बार `rules/` और `skills/` में लिखे जाते हैं, फिर हर टूल के लिए बिल्ड किए जाते हैं।

1. **कोर नियम हमेशा चालू रहते हैं।** `core/behavior`, `core/security-baseline`, `core/supply-chain` और `core/agent-safety` हर सेशन में लोड होते हैं।
2. **स्टैक नियम फ़ाइल के प्रकार के हिसाब से जुड़ते हैं।** `app/page.tsx` एडिट करने पर `frontend/nextjs` लोड होता है; `supabase/migrations/*.sql` एडिट करने पर `data/supabase` लोड होता है। जिन टूल्स में फ़ाइल के हिसाब से नियम नहीं होते (Codex, Gemini CLI), उनके लिए हर स्टैक नियम `<stack>-conventions` skill के रूप में दिया जाता है, जो ज़रूरत पड़ने पर लोड होता है।
3. **नियम वर्ज़न जाँचता है।** एजेंट lockfile पढ़ता है और बताता है कि वह क्या लागू कर रहा है, जैसे:

   ```text
   Applying frontend/nextjs (next 16.4.1, react 19.2.8, from pnpm-lock.yaml).
   ```

4. **रेंज से नीचे लेगेसी नियम ज़िम्मेदारी लेते हैं।** Next.js 15 या `pages/` डायरेक्टरी होने पर एजेंट `legacy/nextjs-pages-router` और `core/legacy-mode` का पालन करता है।
5. **Skills ज़रूरत पड़ने पर चलती हैं।** `security-audit`, `cve-check`, `upgrade-nextjs` या `migrate-cra-to-vite` जैसी प्रक्रियाएँ तब तक कॉन्टेक्स्ट से बाहर रहती हैं जब तक आप या एजेंट उन्हें न बुलाएँ, इसलिए बड़ी skill लाइब्रेरी का खर्च लगभग शून्य होता है।

ज़्यादा विशिष्ट नियम सामान्य नियमों से ऊपर होते हैं, और सुरक्षा नियम सुविधा वाले नियमों से ऊपर होते हैं, जब तक आप उन्हें स्पष्ट रूप से न बदलें। ऐसा करने पर एजेंट यह बताता है।

हर नियम की संरचना एक जैसी है: **Version check**, **Conventions**, **Security**, **Known vulnerabilities**, **Testing** और **Before you finish**, जिसमें lint, टाइप-चेक, टेस्ट और ऑडिट के सटीक कमांड होते हैं। लेगेसी नियमों में **Migration path** भी होता है।

## समर्थित टूल

| टूल | क्या इंस्टॉल होता है | टूल इसे कहाँ पढ़ता है |
|---|---|---|
| **Cursor** (3.1.2 या नया) | प्रोजेक्ट नियम और skills | `.cursor/rules/**/*.mdc`, `.cursor/skills/` |
| **OpenAI Codex, GitHub Copilot, Gemini CLI** और `AGENTS.md` पढ़ने वाले अन्य टूल | `AGENTS.md` (कोर नियम और स्टैक इंडेक्स) और skills | `AGENTS.md`, `.agents/skills/` |
| **Claude Code** | `AGENTS.md` को इम्पोर्ट करने वाला `CLAUDE.md`, और skills | `CLAUDE.md`, `.claude/skills/` |

## जल्दी शुरुआत

Node.js 22 या नया वर्ज़न चाहिए। स्क्रिप्ट्स की कोई डिपेंडेंसी नहीं है।

1. किसी रिलीज़ टैग को क्लोन करें:

   ```bash
   git clone --branch v1.1.0 https://github.com/Phaedra-Solutions/cursor-rules.git
   cd cursor-rules
   ```

2. देखें कि कोई प्रीसेट आपके प्रोजेक्ट में क्या इंस्टॉल करेगा:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
   ```

3. इंस्टॉल करें:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
   ```

विकल्प:

- `--preset`: कोई एक [प्रीसेट](#प्रीसेट)। इसे छोड़ देने पर सब कुछ इंस्टॉल होता है।
- `--tool`: `cursor`, `agents` (`AGENTS.md` और `.agents/skills/`) और `claude` (`CLAUDE.md` और `.claude/skills/`) में से कोई भी। डिफ़ॉल्ट `cursor,agents` है।
- `--dry-run`: बिना कुछ लिखे हर नियोजित कॉपी दिखाता है। पहले इसे चलाएँ।
- `--force`: अलग सामग्री वाली फ़ाइलों को ओवरराइट करता है। इसके बिना, कोई भी टकराव होने पर स्क्रिप्ट कुछ नहीं लिखती। अगर आपके प्रोजेक्ट में पहले से `CLAUDE.md` है, तो उसे ओवरराइट करने के बजाय उसमें `@AGENTS.md` लाइन जोड़ें।

इंस्टॉलर वर्ज़न, प्रीसेट और मैनिफ़ेस्ट हैश को `.cursor/rules/.cursor-rules-version` (या `.agents/` या `.claude/` के अंदर) में दर्ज करता है, ताकि आप हमेशा जान सकें कि प्रोजेक्ट कौन-सा रिलीज़ इस्तेमाल कर रहा है।

**बिना क्लोन किए:** किसी [GitHub Release](https://github.com/Phaedra-Solutions/cursor-rules/releases) से अपने टूल का आर्काइव डाउनलोड करें, उसे `SHA256SUMS` से जाँचें (`sha256sum -c SHA256SUMS --ignore-missing`), और उसकी सामग्री अपने प्रोजेक्ट के रूट में कॉपी करें।

**पहले आउटपुट देखने के लिए:** `node scripts/build.mjs --preset <name>` चलाएँ और `dist/` में देखें।

कोई रिलीज़ टैग तय रखें और सोच-समझकर अपडेट करें; [CHANGELOG](../../CHANGELOG.md) में सभी बदलाव दर्ज हैं।

## प्रीसेट

प्रीसेट किसी एक तरह के प्रोजेक्ट के लिए कोर नियम, स्टैक नियम और skills एक साथ देता है। अपने स्टैक के सबसे क़रीब वाला प्रीसेट चुनें; `all-core` किसी भी प्रोजेक्ट के साथ काम करता है। स्टैक नियम तभी लोड होते हैं जब आप मेल खाती फ़ाइलें एडिट करते हैं, इसलिए अतिरिक्त नियम एजेंट का कॉन्टेक्स्ट नहीं भरते।

| प्रीसेट | स्टैक |
|---|---|
| [`ai-app`](../../presets/ai-app.yml) | LLM फ़ीचर, RAG, एजेंट्स और MCP सर्वर (TypeScript या Python) |
| [`all-core`](../../presets/all-core.yml) | सिर्फ़ कोर नियम और सुरक्षा skills; किसी भी स्टैक के साथ काम करता है |
| [`laravel`](../../presets/laravel.yml) | PHP 8.3+ पर Laravel 13 |
| [`nest-angular`](../../presets/nest-angular.yml) | Angular फ़्रंट एंड के साथ NestJS API |
| [`next-supabase`](../../presets/next-supabase.yml) | Supabase, TypeScript और Tailwind के साथ Next.js App Router |
| [`python-fastapi`](../../presets/python-fastapi.yml) | FastAPI, Pydantic v2 और SQLAlchemy 2 के साथ Python API |
| [`react-vite`](../../presets/react-vite.yml) | Vite से बना React सिंगल-पेज ऐप |
| [`rn-expo`](../../presets/rn-expo.yml) | Expo के साथ React Native (New Architecture) |

हर प्रीसेट में कितने नियम और skills हैं, यह [अंग्रेज़ी प्रीसेट तालिका](../../README.md#presets) में है।

## समर्थित स्टैक

हर स्टैक का एक आधुनिक नियम है; ज़्यादातर के लिए एक लेगेसी नियम और एक अपग्रेड या माइग्रेशन skill भी है।

- **भाषाएँ:** TypeScript, Node.js पर JavaScript, Python, PHP, Java, Kotlin, C#, Go, Dart, Swift, शेल स्क्रिप्ट।
- **फ़्रंट एंड:** React 19, Next.js 16 (App Router), Vite के साथ React, Angular, Vue 3, Nuxt 4, Svelte 5 और SvelteKit, Astro, Tailwind CSS 4, shadcn/ui और Radix, फ़ॉर्म और वैलिडेशन (React Hook Form, Zod, Standard Schema), स्टेट और सर्वर डेटा (TanStack Query, Zustand, Redux Toolkit)।
- **मोबाइल:** React Native और Expo (New Architecture), Flutter, SwiftUI, Jetpack Compose, मोबाइल सुरक्षा (OWASP MASVS)।
- **बैक एंड:** NestJS (कोर, माइक्रोसर्विसेज़, डेटा एक्सेस), Express 5, Fastify, Hono, FastAPI, Django, Laravel, Spring Boot, ASP.NET Core, Go HTTP सर्विसेज़, GraphQL।
- **डेटा:** Supabase, PostgreSQL, Prisma, Drizzle, Sequelize, TypeORM, SQLAlchemy, MongoDB और Mongoose, Firebase।
- **टेस्टिंग:** Cypress, Playwright, Vitest और Jest, pytest, एक्सेसिबिलिटी जाँच (axe-core, WCAG 2.2)।
- **DevOps और क्लाउड:** GitHub Actions, Docker, Kubernetes, Terraform और OpenTofu, AWS, Google Cloud, Azure, Vercel, Netlify, Cloudflare Workers।
- **AI:** LLM ऐप्स, RAG, AI एजेंट्स, MCP सर्वर (LLM और एजेंटिक ऐप्लिकेशन के लिए OWASP Top 10)।
- **CMS:** WordPress प्लगइन और थीम।
- **लेगेसी:** AngularJS, Angular NgModules, Create React App और क्लास कंपोनेंट्स, Next.js Pages Router, React Native की पुरानी आर्किटेक्चर, jQuery, Vue 2 और Nuxt 2/3, Express 4, Node.js 20 और पुराने, NestJS 11 और Bull, Laravel 11 और CodeIgniter 3 के साथ PHP 8.2 और पुराने, Python 2.7, Django 4.2, Rails 7.2 और पुराने, Spring Boot 2/3 के साथ Java 8/11/17, Apache Struts, .NET 8/9, .NET Framework (Web Forms, WCF, ASMX), Xamarin, Apache Cordova, Flutter 2, Supabase की पुरानी कुंजियाँ, रिटायर हो चुका ingress-nginx कंट्रोलर, Moment.js और मेंटेनेंस मोड वाली अन्य लाइब्रेरी।

## कैटलॉग

सभी नियमों और skills की पूरी सूची, हर नियम की सटीक वर्ज़न रेंज (`applies_to`), प्राथमिकता (P0–P3) और स्थिति के साथ, फ़ाइलों से अपने-आप बनती है और [अंग्रेज़ी कैटलॉग](../../README.md#catalog) में है। किसी नियम की रेंज से बाहर होने पर एजेंट `core/legacy-mode` या संबंधित `legacy/` नियम का पालन करता है।

इस रिपॉज़िटरी में यह भी है:

- [`evals/`](../../evals/README.md): promptfoo सूट जो एक ही प्रॉम्प्ट को नियम के साथ और बिना नियम के चलाकर हर P0 नियम का असर मापते हैं।
- [`templates/ci/`](../../templates/ci/README.md): आपके प्रोजेक्ट्स में कॉपी करने के लिए सुरक्षा वर्कफ़्लो (GitHub Actions, GitLab CI, Dependabot)।
- [`templates/package-managers/`](../../templates/package-managers/): npm, pnpm, Yarn, Bun और uv के लिए रिलीज़-एज कूलडाउन सेटिंग्स, जो पिछले कुछ दिनों में प्रकाशित पैकेजों को रोकती हैं।

## सुरक्षा

सुरक्षा हर नियम का हिस्सा है, कोई अलग ऐड-ऑन नहीं।

- **हमेशा चालू कोर नियम:**
  - `core/security-baseline`: OWASP Top 10:2025 के हिसाब से समूहित सुरक्षित कोडिंग, CWE Top 25 के संदर्भों के साथ।
  - `core/supply-chain`: कभी काल्पनिक पैकेज नहीं, lockfile और फ़्रोज़न इंस्टॉल, रिलीज़-एज कूलडाउन, इंस्टॉल-स्क्रिप्ट नीति और पिन किए गए CI actions।
  - `core/agent-safety`: बाहर से लाई गई सामग्री को निर्देश नहीं, डेटा मानना; सीक्रेट्स को संभालना; जोखिम वाले कमांड से पहले पुष्टि; MCP सर्वर की अनुमति-सूची।
  - `core/behavior`: सीमित बदलाव और छोटे जवाबों में भी एक लाइन में सुरक्षा से जुड़ी बात।
- **हर स्टैक की सुरक्षा:** हर नियम में सुरक्षा सेक्शन और न्यूनतम सुरक्षित वर्ज़न के साथ ज्ञात कमज़ोरियों की तारीख़ वाली तालिका है। लेगेसी नियम उन वर्ज़न के लिए वैकल्पिक सुरक्षा नियंत्रण जोड़ते हैं जिन्हें अब फ़िक्स नहीं मिलते।
- **सुरक्षा skills:** `security-audit` (डिपेंडेंसी, कोड, सीक्रेट्स, कंटेनर और CI), `dependency-vet` (इंस्टॉल से पहले टाइपोस्क्वॉटिंग और काल्पनिक पैकेज की जाँच), `cve-check` (OSV और GitHub Advisory में खोज), `secrets-scan` (gitleaks), `threat-model-lite` (10 मिनट का STRIDE विश्लेषण) और `incident-supply-chain` (किसी समझौता की गई डिपेंडेंसी पर कार्रवाई)।
- **आपके प्रोजेक्ट्स के लिए:** [`templates/ci/`](../../templates/ci/README.md) के CI टेम्पलेट OSV-Scanner, Semgrep, gitleaks और zizmor चलाते हैं।
- **इस रिपॉज़िटरी के लिए:** पुल-रिक्वेस्ट lint frontmatter, साइज़, छिपे Unicode, लिंक और Markdown की जाँच करता है। एक दैनिक जॉब [`security/watchlist.yml`](../../security/watchlist.yml) को OSV और CISA KEV से मिलाता है, और एक साप्ताहिक जॉब हर `applies_to` रेंज को नए रिलीज़ और सपोर्ट ख़त्म होने की तारीख़ों से जाँचता है।
- **रिपोर्ट करना:** [SECURITY.md](../../SECURITY.md) देखें। कमज़ोरियों के लिए सार्वजनिक issue न खोलें।

## अपने टूल अपडेट रखें

- **Cursor:** 2026 के कई फ़िक्स सैंडबॉक्स से बाहर निकलने और प्रॉम्प्ट इंजेक्शन से जुड़े थे (जैसे CVE-2026-26268, CVE-2026-48124, CVE-2026-50548, CVE-2026-50549 और CVE-2026-73217)। **Cursor 3.1.2 या नया** इस्तेमाल करें और अपडेट आते ही इंस्टॉल करें। [Cursor की सुरक्षा एडवाइज़री](https://github.com/cursor/cursor/security/advisories) देखें।
- **Claude Code, Codex, Copilot और अन्य एजेंट्स:** इन्हें मौजूदा रिलीज़ पर रखें; `core/agent-safety` इनकी कॉन्फ़िगरेशन फ़ाइलों और MCP सर्वर को कवर करता है।
- **ये नियम:** वर्ज़न और एडवाइज़री तालिकाएँ पुरानी पड़ जाती हैं। कम से कम हर महीने नवीनतम रिलीज़ पर अपडेट करें, और किसी तालिका पर भरोसा करने से पहले `cve-check` skill इस्तेमाल करें।

## अक्सर पूछे जाने वाले सवाल

### Cursor नियम क्या हैं?

Cursor नियम ऐसे निर्देश हैं जिन्हें Cursor का AI एजेंट आपके प्रोजेक्ट में काम करते समय पढ़ता है। प्रोजेक्ट नियम `.cursor/rules/` में `.mdc` फ़ाइलों के रूप में रहते हैं, जिनके frontmatter में लिखा होता है कि हर नियम कब लागू होगा: हमेशा, किसी फ़ाइल पैटर्न (`globs`) से मेल खाने पर, या जब एजेंट तय करे कि विवरण उपयुक्त है। यह रिपॉज़िटरी एक ही सोर्स से ये फ़ाइलें बनाती है, साथ ही अन्य टूल्स के लिए `AGENTS.md` और Agent Skills भी।

### नियम और skill में क्या अंतर है?

**नियम** छोटा, घोषणात्मक निर्देश है जो मेल खाती फ़ाइलें एडिट होने पर हमेशा कॉन्टेक्स्ट में होना चाहिए, जैसे Next.js 16 में "`middleware.ts` नहीं, `proxy.ts` इस्तेमाल करें"। **Skill** ज़रूरत पड़ने पर चलने वाली क़दम-दर-क़दम प्रक्रिया है, जैसे "डिपेंडेंसी का ऑडिट करें" या "Angular को एक बार में एक मेजर वर्ज़न अपग्रेड करें"। इस्तेमाल होने तक कॉन्टेक्स्ट में सिर्फ़ skill का नाम और विवरण रहता है।

### क्या यह Claude Code, Codex, GitHub Copilot या Gemini CLI के साथ काम करता है?

हाँ। `AGENTS.md` और `.agents/skills/` पढ़ने वाले टूल्स (Codex, Copilot, Gemini CLI और अन्य) के लिए `--tool agents` से इंस्टॉल करें, या Claude Code के लिए `--tool claude` से, जिसे `AGENTS.md` इम्पोर्ट करने वाला `CLAUDE.md` और `.claude/skills/` में skills मिलती हैं। आप एक साथ कई टूल्स के लिए इंस्टॉल कर सकते हैं: `--tool cursor,agents,claude`।

### क्या इंस्टॉलर मेरी मौजूदा फ़ाइलें ओवरराइट करेगा?

नहीं। `--force` दिए बिना यह अलग सामग्री वाली किसी फ़ाइल को कभी ओवरराइट नहीं करता, और कोई भी टकराव होने पर कुछ नहीं लिखता। हर नियोजित कॉपी देखने के लिए पहले `--dry-run` चलाएँ।

### मेरा प्रोजेक्ट पुराने वर्ज़न पर है। क्या नियम फिर भी मदद करेंगे?

हाँ। जब इंस्टॉल किया गया वर्ज़न नियम की रेंज से नीचे होता है, तो एजेंट संबंधित `legacy/` नियम और `core/legacy-mode` का पालन करता है। वह बदलाव कम से कम रखता है, सपोर्ट ख़त्म होने की स्थिति बताता है, बिना पैच वाले CVE के लिए वैकल्पिक सुरक्षा नियंत्रण लागू करता है और `migrate-angularjs`, `upgrade-express` या `migrate-dotnet-framework` जैसी माइग्रेशन skill सुझाता है। आपके कहे बिना वह माइग्रेट नहीं करता, और कोई भी वर्ज़न बदलने से पहले पूछता है, चाहे वह पैच ही क्यों न हो।

### नियम अपडेट और सटीक कैसे रहते हैं?

वर्ज़न, तारीख़ या CVE के हर दावे का सोर्स नियम के frontmatter में है। एक दैनिक जॉब ट्रैक किए गए पैकेजों को OSV और CISA Known Exploited Vulnerabilities कैटलॉग से मिलाता है, एक साप्ताहिक जॉब नए रिलीज़ या सपोर्ट ख़त्म होने की तारीख़ों से पीछे रहे नियमों को चिह्नित करता है, और हर महीने एक सुरक्षा समीक्षा issue के रूप में खोली जाती है। P0 नियमों के लिए eval सूट हैं जो मापते हैं कि एजेंट उनका कितनी बार पालन करता है।

### क्या मैं अपनी टीम के कन्वेंशन जोड़ सकता हूँ?

हाँ। टीम की अपनी पसंद `conventions/` में एक ओवरले में जाती है, जिसे प्रीसेट शामिल कर सकते हैं; [`conventions/phaedra.md`](../../conventions/phaedra.md) इसका एक उदाहरण है। सामान्य नियम प्रोजेक्ट की मौजूदा पसंद का सम्मान करते हैं, इसलिए ओवरले में सिर्फ़ वही चाहिए जो आपकी टीम के लिए अलग है।

### जो स्टैक कवर नहीं है, उसे कैसे जोड़ूँ?

[CONTRIBUTING.md](../../CONTRIBUTING.md) का पालन करें, या अपने AI एजेंट के साथ दोबारा इस्तेमाल होने वाला प्रॉम्प्ट [`implementation-prompts/36-template-new-stack.md`](../../implementation-prompts/36-template-new-stack.md) इस्तेमाल करें। नए नियमों को `node scripts/lint-rules.mjs` पास करना होगा।

### क्या यह मुफ़्त है?

हाँ। यह रिपॉज़िटरी MIT लाइसेंस के तहत है। [Project CodeGuard](https://github.com/cosai-oasis/project-codeguard) से लिया गया कंटेंट अपना CC BY 4.0 एट्रिब्यूशन [NOTICE.md](../../NOTICE.md) में बनाए रखता है।

## योगदान

नियम और skill टेम्पलेट, सोर्स से जुड़े नियम और समीक्षा प्रक्रिया के लिए [CONTRIBUTING.md](../../CONTRIBUTING.md) देखें। पुल रिक्वेस्ट खोलने से पहले:

```bash
node scripts/lint-rules.mjs
node --test scripts/*.test.mjs
node scripts/build.mjs
node scripts/build.mjs --catalog
```

योजना और उसका तर्क [ROADMAP.md](../../ROADMAP.md) में है; निर्णय [docs/decisions.md](../decisions.md) में हैं।

## लाइसेंस

[MIT](../../LICENSE)। तृतीय-पक्ष एट्रिब्यूशन [NOTICE.md](../../NOTICE.md) में हैं।

[Phaedra Solutions](https://phaedrasolutions.com) द्वारा बनाया और मेंटेन किया गया, जो कस्टम सॉफ़्टवेयर और AI डेवलपमेंट कंपनी है। अपने कोडबेस में इन नियमों को लागू करने में मदद के लिए [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com) पर संपर्क करें।
