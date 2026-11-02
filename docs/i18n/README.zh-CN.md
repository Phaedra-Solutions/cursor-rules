# 面向 AI 编程智能体的 Cursor 规则与 Agent Skills

[English](../../README.md) | **简体中文** | [हिन्दी](./README.hi.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [বাংলা](./README.bn.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru.md) | [اردو](./README.ur.md)

> 本文为译文。以英文版（[README.md](../../README.md)）为准，英文版包含自动生成的完整目录。

**适用于 Cursor、Claude Code、OpenAI Codex、GitHub Copilot 和 Gemini CLI 的版本感知、安全优先的编程规则。** 开源（MIT），由 [Phaedra Solutions](https://phaedrasolutions.com) 维护。

`cursor-rules` 是一套编程规则和 [Agent Skills](https://agentskills.io) 库，让 AI 编程智能体在你的技术栈上像资深工程师一样工作。智能体写代码之前，每条规则都会先检查项目实际使用的框架版本，然后应用该版本当前的约定、安全控制和已知漏洞检查。对于旧版本或已停止支持（EOL）的版本，规则会切换到遗留代码指南，并给出迁移路径。同一份源文件可以生成 Cursor 项目规则（`.mdc`）、`AGENTS.md`、`CLAUDE.md` 和 Agent Skills（`SKILL.md`），让团队里的每个工具都遵循同一套指令。

问题咨询或项目合作：[hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com)。

## 概览

| | |
|---|---|
| **是什么** | 面向 AI 编程智能体的规则（编码规范、安全、测试、版本检查），以及按需调用的技能（审计、升级、迁移） |
| **支持的工具** | Cursor、Claude Code、OpenAI Codex、GitHub Copilot、Gemini CLI，以及任何读取 `AGENTS.md` 或 Agent Skills 的工具 |
| **技术栈** | TypeScript、React、Next.js、Angular、Vue、Nuxt、Svelte、Astro、React Native、Expo、Flutter、SwiftUI、Jetpack Compose、Node.js、Express、NestJS、Fastify、Hono、Python、FastAPI、Django、PHP、Laravel、Java、Spring Boot、C#、ASP.NET Core、Go、Supabase、Postgres、Prisma、Drizzle、MongoDB、Firebase、Docker、Kubernetes、Terraform、GitHub Actions、AWS、GCP、Azure、WordPress、LLM 应用、RAG、AI 智能体、MCP 服务器等 |
| **遗留技术** | AngularJS、Create React App、类组件、jQuery、Vue 2、Express 4、Node.js ≤ 20、PHP ≤ 8.2、Django ≤ 4.2、Python 2.7、Rails ≤ 7.2、Struts、.NET Framework、Xamarin、Cordova 等 |
| **安全** | OWASP Top 10:2025、CWE Top 25、供应链加固、智能体提示词注入防护、带日期的 CVE 表格和最低安全版本 |
| **安装** | `node scripts/install.mjs --preset <name>`：Node.js 22+，零依赖，不发布 npm 包 |
| **许可证** | MIT |

## 目录

- [为什么需要版本感知的规则](#为什么需要版本感知的规则)
- [工作原理](#工作原理)
- [支持的工具](#支持的工具)
- [快速开始](#快速开始)
- [预设](#预设)
- [支持的技术栈](#支持的技术栈)
- [规则目录](#规则目录)
- [安全](#安全)
- [保持工具更新](#保持工具更新)
- [常见问题](#常见问题)
- [参与贡献](#参与贡献)
- [许可证](#许可证)

## 为什么需要版本感知的规则

AI 编程智能体是用多年混杂的示例训练出来的，所以经常为错误的版本写代码。它们会在 Next.js 16 应用里使用 `middleware.ts`，在 Angular 22 里使用 NgModules，或在使用 App Router 的地方写 `getServerSideProps`。它们还会引入不存在的包、漏掉授权检查、照搬带有已知 CVE 的写法。

通用的规则文件会让问题更严重：它们只假设一个版本，几个月就过时，而且对安全只字不提。这些规则的做法不同：

- **先检查版本。** 每条技术栈规则都会先从 lockfile 或清单文件读取已安装的版本，然后说明正在应用哪条规则和哪个版本。
- **保持最新。** 每条规则都声明了编写时针对的版本范围（`applies_to`）、来源和 `last_reviewed` 日期。每周任务会标记那些落后于新主版本或停止支持日期的规则。
- **安全地处理遗留代码。** 当项目版本低于规则的范围时，智能体会改用 `legacy/` 规则。它只做最小的、保持行为不变的修改，绝不使用比已安装版本更新的 API，报告 EOL 状态，为未修复的 CVE 添加补偿性控制，并建议使用迁移技能。
- **内置安全。** 基于 OWASP 的安全编码规则始终启用。每条技术栈规则都有自己的安全章节和带日期的已知漏洞表。

## 工作原理

规则和技能只需在 `rules/` 和 `skills/` 中编写一次，再为每个工具分别构建。

1. **核心规则始终启用。** `core/behavior`、`core/security-baseline`、`core/supply-chain` 和 `core/agent-safety` 会在每次会话中加载。
2. **技术栈规则按文件类型加载。** 编辑 `app/page.tsx` 会加载 `frontend/nextjs`；编辑 `supabase/migrations/*.sql` 会加载 `data/supabase`。对于不支持按文件加载规则的工具（Codex、Gemini CLI），每条技术栈规则都会以 `<stack>-conventions` 技能的形式提供，按需加载。
3. **规则检查版本。** 智能体读取 lockfile 并说明正在应用的内容，例如：

   ```text
   Applying frontend/nextjs (next 16.4.1, react 19.2.8, from pnpm-lock.yaml).
   ```

4. **低于范围时由遗留规则接管。** 在 Next.js 15 或存在 `pages/` 目录时，智能体会遵循 `legacy/nextjs-pages-router` 和 `core/legacy-mode`。
5. **技能按需运行。** `security-audit`、`cve-check`、`upgrade-nextjs` 或 `migrate-cra-to-vite` 这类流程在你或智能体调用之前不会进入上下文，所以即使技能库很大，开销也几乎为零。

更具体的规则优先于更通用的规则；安全规则优先于便利性规则，除非你明确覆盖它们。这时智能体会说明这一点。

每条规则的结构都相同：**Version check**、**Conventions**、**Security**、**Known vulnerabilities**、**Testing** 和 **Before you finish**，最后一节列出需要运行的 lint、类型检查、测试和审计命令。遗留规则还会增加 **Migration path**。

## 支持的工具

| 工具 | 安装的内容 | 工具读取的位置 |
|---|---|---|
| **Cursor**（3.1.2 或更高版本） | 项目规则和技能 | `.cursor/rules/**/*.mdc`、`.cursor/skills/` |
| **OpenAI Codex、GitHub Copilot、Gemini CLI** 及其他读取 `AGENTS.md` 的工具 | `AGENTS.md`（核心规则和技术栈索引）以及技能 | `AGENTS.md`、`.agents/skills/` |
| **Claude Code** | 导入 `AGENTS.md` 的 `CLAUDE.md`，以及技能 | `CLAUDE.md`、`.claude/skills/` |

## 快速开始

需要 Node.js 22 或更高版本。脚本没有任何依赖。

1. 克隆一个发布标签：

   ```bash
   git clone --branch v1.1.0 https://github.com/Phaedra-Solutions/cursor-rules.git
   cd cursor-rules
   ```

2. 预览某个预设会安装到项目中的内容：

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
   ```

3. 安装：

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
   ```

选项：

- `--preset`：选择一个[预设](#预设)。省略时安装全部内容。
- `--tool`：`cursor`、`agents`（`AGENTS.md` 和 `.agents/skills/`）和 `claude`（`CLAUDE.md` 和 `.claude/skills/`）的任意组合。默认值为 `cursor,agents`。
- `--dry-run`：列出所有计划复制的文件，但不写入任何内容。建议先运行它。
- `--force`：覆盖内容不同的文件。不加此选项时，只要有冲突，脚本就不会写入任何文件。如果项目里已有 `CLAUDE.md`，请在其中添加 `@AGENTS.md` 这一行，而不是覆盖它。

安装程序会把版本、预设和清单哈希记录在 `.cursor/rules/.cursor-rules-version`（或 `.agents/`、`.claude/` 下），这样你随时都能知道项目使用的是哪个发布版本。

**不克隆仓库：** 从 [GitHub Release](https://github.com/Phaedra-Solutions/cursor-rules/releases) 下载对应工具的压缩包，用 `SHA256SUMS` 校验（`sha256sum -c SHA256SUMS --ignore-missing`），然后把内容复制到项目根目录。

**先查看输出：** 运行 `node scripts/build.mjs --preset <name>`，然后查看 `dist/`。

请固定一个发布标签，并有计划地升级；[CHANGELOG](../../CHANGELOG.md) 列出了每次的变更。

## 预设

预设把某一类项目所需的核心规则、技术栈规则和技能打包在一起。选择最接近你技术栈的预设；`all-core` 适用于任何项目。技术栈规则只会在编辑匹配的文件时加载，所以额外的规则不会挤占智能体的上下文。

| 预设 | 技术栈 |
|---|---|
| [`ai-app`](../../presets/ai-app.yml) | LLM 功能、RAG、智能体和 MCP 服务器（TypeScript 或 Python） |
| [`all-core`](../../presets/all-core.yml) | 仅核心规则和安全技能；适用于任何技术栈 |
| [`laravel`](../../presets/laravel.yml) | 基于 PHP 8.3+ 的 Laravel 13 |
| [`nest-angular`](../../presets/nest-angular.yml) | NestJS API 搭配 Angular 前端 |
| [`next-supabase`](../../presets/next-supabase.yml) | Next.js App Router 搭配 Supabase、TypeScript 和 Tailwind |
| [`python-fastapi`](../../presets/python-fastapi.yml) | 使用 FastAPI、Pydantic v2 和 SQLAlchemy 2 的 Python API |
| [`react-vite`](../../presets/react-vite.yml) | 使用 Vite 构建的 React 单页应用 |
| [`rn-expo`](../../presets/rn-expo.yml) | React Native 搭配 Expo（New Architecture） |

每个预设包含的规则和技能数量见[英文版预设表](../../README.md#presets)。

## 支持的技术栈

每个技术栈都有一条现代版本的规则；大多数还有对应的遗留规则，以及升级或迁移技能。

- **编程语言：** TypeScript、Node.js 上的 JavaScript、Python、PHP、Java、Kotlin、C#、Go、Dart、Swift、Shell 脚本。
- **前端：** React 19、Next.js 16（App Router）、React + Vite、Angular、Vue 3、Nuxt 4、Svelte 5 和 SvelteKit、Astro、Tailwind CSS 4、shadcn/ui 和 Radix、表单与校验（React Hook Form、Zod、Standard Schema）、状态与服务端数据（TanStack Query、Zustand、Redux Toolkit）。
- **移动端：** React Native 和 Expo（New Architecture）、Flutter、SwiftUI、Jetpack Compose、移动安全（OWASP MASVS）。
- **后端：** NestJS（核心、微服务、数据访问）、Express 5、Fastify、Hono、FastAPI、Django、Laravel、Spring Boot、ASP.NET Core、Go HTTP 服务、GraphQL。
- **数据：** Supabase、PostgreSQL、Prisma、Drizzle、Sequelize、TypeORM、SQLAlchemy、MongoDB 和 Mongoose、Firebase。
- **测试：** Cypress、Playwright、Vitest 和 Jest、pytest、无障碍检查（axe-core、WCAG 2.2）。
- **DevOps 与云：** GitHub Actions、Docker、Kubernetes、Terraform 和 OpenTofu、AWS、Google Cloud、Azure、Vercel、Netlify、Cloudflare Workers。
- **AI：** LLM 应用、RAG、AI 智能体、MCP 服务器（OWASP LLM 应用与智能体应用 Top 10）。
- **CMS：** WordPress 插件和主题。
- **遗留技术：** AngularJS、Angular NgModules、Create React App 和类组件、Next.js Pages Router、React Native 旧架构、jQuery、Vue 2 和 Nuxt 2/3、Express 4、Node.js 20 及更早版本、NestJS 11 和 Bull、PHP 8.2 及更早版本（含 Laravel 11 和 CodeIgniter 3）、Python 2.7、Django 4.2、Rails 7.2 及更早版本、Java 8/11/17 与 Spring Boot 2/3、Apache Struts、.NET 8/9、.NET Framework（Web Forms、WCF、ASMX）、Xamarin、Apache Cordova、Flutter 2、Supabase 旧版密钥、已退役的 ingress-nginx 控制器、Moment.js 及其他处于维护模式的库。

## 规则目录

完整的规则和技能列表（包括每条规则的确切版本范围 `applies_to`、优先级 P0–P3 和状态）由源文件自动生成，见[英文版目录](../../README.md#catalog)。超出规则版本范围时，智能体会遵循 `core/legacy-mode` 或对应的 `legacy/` 规则。

仓库中还有：

- [`evals/`](../../evals/README.md)：promptfoo 测试套件，用同一批提示词分别在有规则和无规则的情况下运行，衡量每条 P0 规则的效果。
- [`templates/ci/`](../../templates/ci/README.md)：可复制到你项目中的安全工作流（GitHub Actions、GitLab CI、Dependabot）。
- [`templates/package-managers/`](../../templates/package-managers/)：npm、pnpm、Yarn、Bun 和 uv 的发布冷却期设置，可阻止安装最近几天才发布的包。

## 安全

安全是每条规则的一部分，而不是额外的插件。

- **始终启用的核心规则：**
  - `core/security-baseline`：按 OWASP Top 10:2025 分组的安全编码规则，并引用 CWE Top 25。
  - `core/supply-chain`：绝不虚构包名，使用 lockfile 和冻结安装，设置发布冷却期，管控安装脚本，并固定 CI actions 的版本。
  - `core/agent-safety`：把获取到的内容当作数据而不是指令；妥善处理密钥；执行高风险命令前先确认；维护 MCP 服务器白名单。
  - `core/behavior`：只做必要范围内的修改；即使回答很简短，也会用一行说明安全问题。
- **各技术栈的安全：** 每条规则都有安全章节和带日期的已知漏洞表，并给出最低安全版本。遗留规则还会为不再获得修复的版本添加补偿性控制。
- **安全技能：** `security-audit`（依赖、代码、密钥、容器和 CI）、`dependency-vet`（安装前检查仿冒包和虚构包）、`cve-check`（查询 OSV 和 GitHub Advisory）、`secrets-scan`（gitleaks）、`threat-model-lite`（10 分钟 STRIDE 分析）和 `incident-supply-chain`（应对被入侵的依赖）。
- **用于你的项目：** [`templates/ci/`](../../templates/ci/README.md) 中的 CI 模板会运行 OSV-Scanner、Semgrep、gitleaks 和 zizmor。
- **用于本仓库：** pull request 的 lint 会检查 frontmatter、文件大小、隐藏的 Unicode 字符、链接和 Markdown。每日任务将 [`security/watchlist.yml`](../../security/watchlist.yml) 与 OSV 和 CISA KEV 比对，每周任务检查每个 `applies_to` 范围是否有新版本发布或到达停止支持日期。
- **漏洞报告：** 见 [SECURITY.md](../../SECURITY.md)。请不要为漏洞创建公开 issue。

## 保持工具更新

- **Cursor：** 2026 年的多项修复涉及沙箱逃逸和提示词注入（例如 CVE-2026-26268、CVE-2026-48124、CVE-2026-50548、CVE-2026-50549 和 CVE-2026-73217）。请使用 **Cursor 3.1.2 或更高版本**，并在更新发布后及时安装。参见 [Cursor 安全公告](https://github.com/cursor/cursor/security/advisories)。
- **Claude Code、Codex、Copilot 及其他智能体：** 保持使用最新版本；`core/agent-safety` 涵盖它们的配置文件和 MCP 服务器。
- **这些规则：** 版本表和漏洞表会过时。至少每月升级一次到最新发布版本，并在依赖某张表格之前先使用 `cve-check` 技能核实。

## 常见问题

### 什么是 Cursor 规则？

Cursor 规则是 Cursor 的 AI 智能体在你的项目中工作时会读取的指令。项目规则以 `.mdc` 文件的形式存放在 `.cursor/rules/` 中，其 frontmatter 说明每条规则何时生效：始终生效、对匹配的文件模式（`globs`）生效，或在智能体判断描述相符时生效。本仓库从同一份源文件生成这些文件，同时为其他工具生成 `AGENTS.md` 和 Agent Skills。

### 还需要 `.cursorrules` 文件吗？

不需要。`.cursorrules` 是 Cursor 旧版的单文件格式。当前版本的 Cursor 从 `.cursor/rules/*.mdc` 读取项目规则，每条规则都写明何时生效，同时也会读取 `AGENTS.md`。安装脚本会同时写入这两者。如果你的项目里还有 `.cursorrules` 文件，请把仍然需要的内容移到项目规则中，然后删除该文件，避免两套指令互相冲突。

### 什么是 AGENTS.md？

[`AGENTS.md`](https://agents.md) 是一种面向 AI 编程智能体的开放指令格式：放在仓库根目录的一个普通 Markdown 文件，OpenAI Codex、GitHub Copilot、Gemini CLI 和 Cursor 等工具在开始工作前都会读取它。它由 Linux 基金会旗下的 Agentic AI Foundation 管理。本仓库生成的 `AGENTS.md` 包含始终启用的核心规则和技术栈规则索引，并把各技术栈的指引以 Agent Skills（`SKILL.md`）的形式提供，只在需要时加载。

### 从网上安装规则文件安全吗？

请像对待代码一样对待规则文件，因为智能体会照着执行。2025 年，研究人员证明不可见的 Unicode 字符可以在 Cursor 和 Copilot 的规则文件中隐藏恶意指令（即“Rules File Backdoor”）。只要任何受 git 跟踪的文本文件中出现零宽字符、双向控制字符或标签字符，本仓库的 CI 就会失败；每个版本都附带 `SHA256SUMS`；`--dry-run` 会在写入之前列出安装脚本将要写入的每个文件。请固定一个版本标签，并在更新前查看 diff。

### 规则和技能有什么区别？

**规则**是简短的声明式指导，凡是编辑匹配的文件时都必须在上下文中，例如在 Next.js 16 中“使用 `proxy.ts`，而不是 `middleware.ts`”。**技能**是按需运行的分步流程，例如“审计依赖”或“每次升级一个 Angular 主版本”。在被使用之前，上下文中只保留技能的名称和描述。

### 能用于 Claude Code、Codex、GitHub Copilot 或 Gemini CLI 吗？

可以。对于读取 `AGENTS.md` 和 `.agents/skills/` 的工具（Codex、Copilot、Gemini CLI 等），使用 `--tool agents` 安装；对于 Claude Code，使用 `--tool claude`，它会获得一个导入 `AGENTS.md` 的 `CLAUDE.md`，以及 `.claude/skills/` 中的技能。也可以一次为多个工具安装：`--tool cursor,agents,claude`。

### 安装程序会覆盖我现有的文件吗？

不会。除非传入 `--force`，否则它绝不会覆盖内容不同的文件；只要有任何冲突，它就不写入任何内容。建议先运行 `--dry-run` 查看所有计划复制的文件。

### 我的项目还在用旧版本，这些规则有用吗？

有用。当已安装版本低于规则的范围时，智能体会遵循对应的 `legacy/` 规则和 `core/legacy-mode`。它会把修改控制在最小范围，报告停止支持的状态，为未修复的 CVE 应用补偿性控制，并建议使用迁移技能，例如 `migrate-angularjs`、`upgrade-express` 或 `migrate-dotnet-framework`。除非你要求，它不会进行迁移；在修改任何版本（哪怕只是补丁版本）之前都会先询问你。

### 如何保证规则及时且准确？

每一条关于版本、日期或 CVE 的说法，都在规则的 frontmatter 中注明了来源。每日任务会将跟踪的包与 OSV 和 CISA 已知被利用漏洞目录（KEV）比对，每周任务会标记落后于新版本或停止支持日期的规则，每月还会以 issue 的形式发起一次安全审查。P0 规则配有评测套件，用于衡量智能体遵循规则的频率。

### 可以添加我们团队自己的约定吗？

可以。团队特有的选择可以放在 `conventions/` 中的叠加层里，供预设引用；[`conventions/phaedra.md`](../../conventions/phaedra.md) 就是一个例子。通用规则会尊重项目已有的选择，所以叠加层只需写明你们团队不同的地方。

### 如何添加尚未覆盖的技术栈？

按照 [CONTRIBUTING.md](../../CONTRIBUTING.md) 操作，或者让你的 AI 智能体使用可复用的提示词 [`implementation-prompts/36-template-new-stack.md`](../../implementation-prompts/36-template-new-stack.md)。新规则必须通过 `node scripts/lint-rules.mjs`。

### 免费吗？

免费。本仓库采用 MIT 许可证。改编自 [Project CodeGuard](https://github.com/cosai-oasis/project-codeguard) 的内容保留其 CC BY 4.0 署名，见 [NOTICE.md](../../NOTICE.md)。

## 参与贡献

规则和技能模板、来源要求和审查流程见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。提交 pull request 之前请运行：

```bash
node scripts/lint-rules.mjs
node --test scripts/*.test.mjs
node scripts/build.mjs
node scripts/build.mjs --catalog
```

规划及其理由见 [ROADMAP.md](../../ROADMAP.md)；决策记录见 [docs/decisions.md](../decisions.md)。

## 许可证

[MIT](../../LICENSE)。第三方署名见 [NOTICE.md](../../NOTICE.md)。

由 [Phaedra Solutions](https://phaedrasolutions.com) 构建和维护，这是一家定制软件与 AI 开发公司。如需帮助把这些规则应用到你的代码库，请联系 [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com)。
