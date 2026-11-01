# Regras do Cursor e Agent Skills para agentes de programação com IA

[English](../../README.md) | [简体中文](./README.zh-CN.md) | [हिन्दी](./README.hi.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [বাংলা](./README.bn.md) | **Português** | [Русский](./README.ru.md) | [اردو](./README.ur.md)

> Esta é uma tradução. A versão em inglês ([README.md](../../README.md)) é a referência e contém o catálogo completo gerado automaticamente.

**Regras que levam em conta a versão e priorizam a segurança, para Cursor, Claude Code, OpenAI Codex, GitHub Copilot e Gemini CLI.** Código aberto (MIT), mantido pela [Phaedra Solutions](https://phaedrasolutions.com).

`cursor-rules` é uma biblioteca de regras de programação e [Agent Skills](https://agentskills.io) que faz os agentes de programação com IA trabalharem como um engenheiro sênior no seu stack. Antes de um agente escrever código, cada regra verifica qual versão do framework o seu projeto realmente usa. Depois aplica as convenções atuais, os controles de segurança e as verificações de vulnerabilidades conhecidas para essa versão. Para versões antigas ou sem suporte (EOL), muda para orientações de código legado e um caminho de migração. Uma única fonte gera as regras de projeto do Cursor (`.mdc`), `AGENTS.md`, `CLAUDE.md` e Agent Skills (`SKILL.md`), para que todas as ferramentas da sua equipe sigam as mesmas instruções.

Dúvidas ou projetos: [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com).

## Visão geral

| | |
|---|---|
| **O que é** | Regras para agentes de programação com IA (padrões de código, segurança, testes, verificação de versão) e skills sob demanda (auditorias, atualizações, migrações) |
| **Funciona com** | Cursor, Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI e qualquer ferramenta que leia `AGENTS.md` ou Agent Skills |
| **Stacks** | TypeScript, React, Next.js, Angular, Vue, Nuxt, Svelte, Astro, React Native, Expo, Flutter, SwiftUI, Jetpack Compose, Node.js, Express, NestJS, Fastify, Hono, Python, FastAPI, Django, PHP, Laravel, Java, Spring Boot, C#, ASP.NET Core, Go, Supabase, Postgres, Prisma, Drizzle, MongoDB, Firebase, Docker, Kubernetes, Terraform, GitHub Actions, AWS, GCP, Azure, WordPress, apps com LLM, RAG, agentes de IA, servidores MCP e mais |
| **Código legado** | AngularJS, Create React App, componentes de classe, jQuery, Vue 2, Express 4, Node.js ≤ 20, PHP ≤ 8.2, Django ≤ 4.2, Python 2.7, Rails ≤ 7.2, Struts, .NET Framework, Xamarin, Cordova e mais |
| **Segurança** | OWASP Top 10:2025, CWE Top 25, proteção da cadeia de suprimentos, defesas contra injeção de prompt para agentes e tabelas de CVE datadas com versões mínimas seguras |
| **Instalação** | `node scripts/install.mjs --preset <name>`: Node.js 22+, sem dependências, sem pacote npm |
| **Licença** | MIT |

## Conteúdo

- [Por que regras que levam em conta a versão](#por-que-regras-que-levam-em-conta-a-versão)
- [Como funciona](#como-funciona)
- [Compatibilidade](#compatibilidade)
- [Início rápido](#início-rápido)
- [Presets](#presets)
- [Stacks suportados](#stacks-suportados)
- [Catálogo](#catálogo)
- [Segurança](#segurança)
- [Mantenha suas ferramentas atualizadas](#mantenha-suas-ferramentas-atualizadas)
- [Perguntas frequentes](#perguntas-frequentes)
- [Como contribuir](#como-contribuir)
- [Licença](#licença)

## Por que regras que levam em conta a versão

Agentes de programação com IA são treinados com anos de exemplos misturados, por isso muitas vezes escrevem código para a versão errada. Usam `middleware.ts` em um app Next.js 16, NgModules no Angular 22 ou `getServerSideProps` onde o App Router está em uso. Também adicionam pacotes que não existem, pulam verificações de autorização e copiam padrões com CVEs conhecidas.

Arquivos de regras genéricos pioram a situação: assumem uma única versão, ficam desatualizados em poucos meses e não falam de segurança. Estas regras funcionam de outro jeito:

- **Verificam a versão primeiro.** Cada regra de stack começa lendo a versão instalada no lockfile ou no manifesto. Depois informa qual regra e qual versão está aplicando.
- **Ficam atualizadas.** Cada regra declara o intervalo de versões para o qual foi escrita (`applies_to`), suas fontes e uma data `last_reviewed`. Uma tarefa semanal sinaliza regras cujo intervalo ficou para trás de uma nova versão principal ou de uma data de fim de suporte.
- **Lidam com código legado com segurança.** Quando um projeto está abaixo do intervalo de uma regra, o agente segue uma regra `legacy/`. Faz mudanças mínimas que preservam o comportamento, nunca usa APIs mais novas do que as instaladas, informa o status de EOL, adiciona controles compensatórios para CVEs sem correção e propõe um skill de migração.
- **Trazem a segurança embutida.** Regras de programação segura alinhadas à OWASP ficam sempre ativas. Cada regra de stack acrescenta sua própria seção de segurança e uma tabela datada de vulnerabilidades conhecidas.

## Como funciona

As regras e os skills são escritos uma vez em `rules/` e `skills/` e depois gerados para cada ferramenta.

1. **As regras core ficam sempre ativas.** `core/behavior`, `core/security-baseline`, `core/supply-chain` e `core/agent-safety` são carregadas em toda sessão.
2. **As regras de stack são ativadas pelo tipo de arquivo.** Editar `app/page.tsx` carrega `frontend/nextjs`; editar `supabase/migrations/*.sql` carrega `data/supabase`. Em ferramentas sem regras por arquivo (Codex, Gemini CLI), cada regra de stack é distribuída como um skill `<stack>-conventions` carregado sob demanda.
3. **A regra verifica a versão.** O agente lê o lockfile e informa o que está aplicando, por exemplo:

   ```text
   Applying frontend/nextjs (next 16.4.1, react 19.2.8, from pnpm-lock.yaml).
   ```

4. **As regras legadas assumem abaixo do intervalo.** Com Next.js 15 ou um diretório `pages/`, o agente segue `legacy/nextjs-pages-router` e `core/legacy-mode`.
5. **Os skills rodam sob demanda.** Procedimentos como `security-audit`, `cve-check`, `upgrade-nextjs` ou `migrate-cra-to-vite` ficam fora do contexto até que você ou o agente os invoque, então uma grande biblioteca de skills quase não custa nada.

Regras mais específicas prevalecem sobre as mais gerais, e regras de segurança prevalecem sobre regras de conveniência, a menos que você as substitua explicitamente. Quando isso acontece, o agente avisa.

Todas as regras seguem a mesma estrutura: **Version check**, **Conventions**, **Security**, **Known vulnerabilities**, **Testing** e **Before you finish**, que lista os comandos exatos de lint, checagem de tipos, testes e auditoria. As regras legadas acrescentam **Migration path**.

## Compatibilidade

| Ferramenta | O que é instalado | Onde a ferramenta lê |
|---|---|---|
| **Cursor** (3.1.2 ou posterior) | Regras de projeto e skills | `.cursor/rules/**/*.mdc`, `.cursor/skills/` |
| **OpenAI Codex, GitHub Copilot, Gemini CLI** e outras ferramentas com `AGENTS.md` | `AGENTS.md` (regras core e um índice de stacks) e skills | `AGENTS.md`, `.agents/skills/` |
| **Claude Code** | `CLAUDE.md` que importa `AGENTS.md`, e skills | `CLAUDE.md`, `.claude/skills/` |

## Início rápido

Requer Node.js 22 ou posterior. Os scripts não têm dependências.

1. Clone uma tag de versão:

   ```bash
   git clone --branch v1.0.0 https://github.com/Phaedra-Solutions/cursor-rules.git
   cd cursor-rules
   ```

2. Veja o que um preset vai instalar no seu projeto:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
   ```

3. Instale:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
   ```

Opções:

- `--preset`: um dos [presets](#presets). Omita para instalar tudo.
- `--tool`: qualquer combinação de `cursor`, `agents` (`AGENTS.md` e `.agents/skills/`) e `claude` (`CLAUDE.md` e `.claude/skills/`). O padrão é `cursor,agents`.
- `--dry-run`: mostra cada cópia planejada sem gravar nada. Rode primeiro.
- `--force`: sobrescreve arquivos diferentes. Sem essa opção, o script não grava nada se houver conflito. Se o seu projeto já tem um `CLAUDE.md`, adicione a linha `@AGENTS.md` em vez de sobrescrevê-lo.

O instalador registra a versão, o preset e o hash do manifesto em `.cursor/rules/.cursor-rules-version` (ou em `.agents/` ou `.claude/`), então você sempre sabe qual versão um projeto usa.

**Sem clonar:** baixe o arquivo da sua ferramenta em uma [GitHub Release](https://github.com/Phaedra-Solutions/cursor-rules/releases), confira com `SHA256SUMS` (`sha256sum -c SHA256SUMS --ignore-missing`) e copie o conteúdo para a raiz do projeto.

**Para ver o resultado antes:** rode `node scripts/build.mjs --preset <name>` e veja `dist/`.

Fixe uma tag de versão e atualize de forma deliberada; o [CHANGELOG](../../CHANGELOG.md) lista as mudanças.

## Presets

Um preset reúne as regras core, as regras de stack e os skills para um tipo de projeto. Escolha o mais próximo do seu stack; `all-core` funciona com qualquer projeto. As regras de stack só são carregadas quando você edita arquivos correspondentes, então regras extras não lotam o contexto do agente.

| Preset | Stack |
|---|---|
| [`ai-app`](../../presets/ai-app.yml) | Recursos com LLM, RAG, agentes e servidores MCP (TypeScript ou Python) |
| [`all-core`](../../presets/all-core.yml) | Apenas regras core e skills de segurança; funciona com qualquer stack |
| [`laravel`](../../presets/laravel.yml) | Laravel 13 com PHP 8.3+ |
| [`nest-angular`](../../presets/nest-angular.yml) | API em NestJS com frontend em Angular |
| [`next-supabase`](../../presets/next-supabase.yml) | Next.js App Router com Supabase, TypeScript e Tailwind |
| [`python-fastapi`](../../presets/python-fastapi.yml) | API em Python com FastAPI, Pydantic v2 e SQLAlchemy 2 |
| [`react-vite`](../../presets/react-vite.yml) | Aplicação de página única em React com Vite |
| [`rn-expo`](../../presets/rn-expo.yml) | React Native com Expo (New Architecture) |

A quantidade de regras e skills de cada preset está na [tabela de presets em inglês](../../README.md#presets).

## Stacks suportados

Cada stack tem uma regra moderna; a maioria também tem uma regra legada e um skill de atualização ou migração.

- **Linguagens:** TypeScript, JavaScript em Node.js, Python, PHP, Java, Kotlin, C#, Go, Dart, Swift, scripts de shell.
- **Frontend:** React 19, Next.js 16 (App Router), React com Vite, Angular, Vue 3, Nuxt 4, Svelte 5 e SvelteKit, Astro, Tailwind CSS 4, shadcn/ui e Radix, formulários e validação (React Hook Form, Zod, Standard Schema), estado e dados do servidor (TanStack Query, Zustand, Redux Toolkit).
- **Mobile:** React Native e Expo (New Architecture), Flutter, SwiftUI, Jetpack Compose, segurança mobile (OWASP MASVS).
- **Backend:** NestJS (core, microsserviços, acesso a dados), Express 5, Fastify, Hono, FastAPI, Django, Laravel, Spring Boot, ASP.NET Core, serviços HTTP em Go, GraphQL.
- **Dados:** Supabase, PostgreSQL, Prisma, Drizzle, Sequelize, TypeORM, SQLAlchemy, MongoDB e Mongoose, Firebase.
- **Testes:** Cypress, Playwright, Vitest e Jest, pytest, acessibilidade (axe-core, WCAG 2.2).
- **DevOps e nuvem:** GitHub Actions, Docker, Kubernetes, Terraform e OpenTofu, AWS, Google Cloud, Azure, Vercel, Netlify, Cloudflare Workers.
- **IA:** apps com LLM, RAG, agentes de IA, servidores MCP (OWASP Top 10 para aplicações LLM e agênticas).
- **CMS:** plugins e temas do WordPress.
- **Legado:** AngularJS, NgModules do Angular, Create React App e componentes de classe, Pages Router do Next.js, arquitetura antiga do React Native, jQuery, Vue 2 e Nuxt 2/3, Express 4, Node.js 20 e anteriores, NestJS 11 e Bull, PHP 8.2 e anteriores com Laravel 11 e CodeIgniter 3, Python 2.7, Django 4.2, Rails 7.2 e anteriores, Java 8/11/17 com Spring Boot 2/3, Apache Struts, .NET 8/9, .NET Framework (Web Forms, WCF, ASMX), Xamarin, Apache Cordova, Flutter 2, chaves legadas do Supabase, o controlador aposentado ingress-nginx, Moment.js e outras bibliotecas em modo de manutenção.

## Catálogo

A lista completa de regras e skills, com o intervalo exato de versões de cada regra (`applies_to`), sua prioridade (P0–P3) e status, é gerada a partir dos arquivos e está no [catálogo em inglês](../../README.md#catalog). Fora do intervalo de uma regra, o agente segue `core/legacy-mode` ou a regra `legacy/` correspondente.

Também neste repositório:

- [`evals/`](../../evals/README.md): suítes do promptfoo que medem o efeito de cada regra P0 rodando os mesmos prompts com e sem a regra.
- [`templates/ci/`](../../templates/ci/README.md): workflows de segurança para copiar nos seus projetos (GitHub Actions, GitLab CI, Dependabot).
- [`templates/package-managers/`](../../templates/package-managers/): configurações de tempo mínimo de publicação para npm, pnpm, Yarn, Bun e uv, que bloqueiam pacotes publicados nos últimos dias.

## Segurança

A segurança faz parte de cada regra; não é um complemento à parte.

- **Regras core sempre ativas:**
  - `core/security-baseline`: programação segura organizada pelo OWASP Top 10:2025, com referências ao CWE Top 25.
  - `core/supply-chain`: nunca inventar pacotes, lockfiles e instalações congeladas, tempo mínimo de publicação, política de scripts de instalação e actions de CI fixadas.
  - `core/agent-safety`: tratar conteúdo obtido como dados e não como instruções, manejo de segredos, confirmação antes de comandos arriscados e listas de servidores MCP permitidos.
  - `core/behavior`: mudanças restritas ao pedido e alertas de segurança em uma linha, mesmo em respostas curtas.
- **Segurança por stack:** cada regra tem uma seção de segurança e uma tabela datada de vulnerabilidades conhecidas com versões mínimas seguras. As regras legadas acrescentam controles compensatórios para versões que não recebem mais correções.
- **Skills de segurança:** `security-audit` (dependências, código, segredos, contêineres e CI), `dependency-vet` (detecção de typosquatting e pacotes inventados antes de instalar), `cve-check` (consultas ao OSV e ao GitHub Advisory), `secrets-scan` (gitleaks), `threat-model-lite` (uma análise STRIDE de 10 minutos) e `incident-supply-chain` (resposta a uma dependência comprometida).
- **Para seus projetos:** os templates de CI em [`templates/ci/`](../../templates/ci/README.md) executam OSV-Scanner, Semgrep, gitleaks e zizmor.
- **Para este repositório:** o lint de pull requests verifica frontmatter, tamanho, Unicode oculto, links e Markdown. Uma tarefa diária compara [`security/watchlist.yml`](../../security/watchlist.yml) com o OSV e o CISA KEV, e uma tarefa semanal confere cada intervalo `applies_to` com novas versões e datas de fim de suporte.
- **Como reportar:** veja [SECURITY.md](../../SECURITY.md). Não abra issues públicas para vulnerabilidades.

## Mantenha suas ferramentas atualizadas

- **Cursor:** várias correções de 2026 trataram de fugas do sandbox e injeção de prompt (por exemplo CVE-2026-26268, CVE-2026-48124, CVE-2026-50548, CVE-2026-50549 e CVE-2026-73217). Use o **Cursor 3.1.2 ou posterior** e instale as atualizações assim que saírem. Veja os [avisos de segurança do Cursor](https://github.com/cursor/cursor/security/advisories).
- **Claude Code, Codex, Copilot e outros agentes:** mantenha-os em versões atuais; `core/agent-safety` cobre seus arquivos de configuração e servidores MCP.
- **Estas regras:** as tabelas de versões e avisos ficam desatualizadas. Atualize para a versão mais recente pelo menos uma vez por mês e use o skill `cve-check` antes de confiar em uma tabela.

## Perguntas frequentes

### O que são regras do Cursor?

Regras do Cursor são instruções que o agente de IA do Cursor lê enquanto trabalha no seu projeto. As regras de projeto ficam em `.cursor/rules/` como arquivos `.mdc` com um frontmatter que indica quando cada regra se aplica: sempre, para certos padrões de arquivo (`globs`) ou quando o agente decide que a descrição se encaixa. Este repositório gera esses arquivos a partir de uma única fonte, junto com `AGENTS.md` e Agent Skills para outras ferramentas.

### Qual é a diferença entre uma regra e um skill?

Uma **regra** é uma orientação curta e declarativa que precisa estar no contexto sempre que arquivos correspondentes são editados, como "use `proxy.ts`, não `middleware.ts`" no Next.js 16. Um **skill** é um procedimento passo a passo executado sob demanda, como "auditar as dependências" ou "atualizar o Angular uma versão principal por vez". Só o nome e a descrição de um skill ficam no contexto até ele ser usado.

### Funciona com Claude Code, Codex, GitHub Copilot ou Gemini CLI?

Sim. Instale com `--tool agents` para ferramentas que leem `AGENTS.md` e `.agents/skills/` (Codex, Copilot, Gemini CLI e outras), ou com `--tool claude` para o Claude Code, que recebe um `CLAUDE.md` que importa `AGENTS.md` e skills em `.claude/skills/`. Você pode instalar para várias ferramentas de uma vez: `--tool cursor,agents,claude`.

### O instalador vai sobrescrever meus arquivos?

Não. Ele nunca sobrescreve um arquivo diferente sem `--force` e, se houver qualquer conflito, não grava nada. Rode `--dry-run` primeiro para ver cada cópia planejada.

### Meu projeto usa uma versão antiga. As regras ajudam?

Sim. Quando a versão instalada está abaixo do intervalo de uma regra, o agente segue a regra `legacy/` correspondente e `core/legacy-mode`. Mantém as mudanças mínimas, informa o status de fim de suporte, aplica controles compensatórios para CVEs sem correção e sugere um skill de migração, como `migrate-angularjs`, `upgrade-express` ou `migrate-dotnet-framework`. Não migra se você não pedir e pergunta antes de mudar qualquer versão, mesmo um patch.

### Como as regras se mantêm atuais e precisas?

Toda afirmação sobre versão, data ou CVE tem uma fonte no frontmatter da regra. Uma tarefa diária compara os pacotes monitorados com o OSV e o catálogo CISA Known Exploited Vulnerabilities, uma tarefa semanal sinaliza regras que ficaram para trás de novas versões ou datas de fim de suporte, e uma revisão mensal de segurança é aberta como issue. As regras P0 têm suítes de avaliação que medem com que frequência o agente as segue.

### Posso adicionar as convenções da minha equipe?

Sim. As escolhas da equipe ficam em uma camada em `conventions/` que os presets podem incluir; [`conventions/phaedra.md`](../../conventions/phaedra.md) é um exemplo. As regras genéricas respeitam as escolhas existentes do projeto, então a sua camada só precisa do que é diferente para a sua equipe.

### Como adiciono um stack que não está coberto?

Siga o [CONTRIBUTING.md](../../CONTRIBUTING.md) ou use o prompt reutilizável [`implementation-prompts/36-template-new-stack.md`](../../implementation-prompts/36-template-new-stack.md) com o seu agente de IA. Novas regras precisam passar em `node scripts/lint-rules.mjs`.

### É gratuito?

Sim. O repositório tem licença MIT. O conteúdo adaptado do [Project CodeGuard](https://github.com/cosai-oasis/project-codeguard) mantém sua atribuição CC BY 4.0 no [NOTICE.md](../../NOTICE.md).

## Como contribuir

Veja o [CONTRIBUTING.md](../../CONTRIBUTING.md) para os modelos de regras e skills, as normas de fontes e o processo de revisão. Antes de abrir um pull request:

```bash
node scripts/lint-rules.mjs
node --test scripts/*.test.mjs
node scripts/build.mjs
node scripts/build.mjs --catalog
```

O plano e sua justificativa estão em [ROADMAP.md](../../ROADMAP.md); as decisões, em [docs/decisions.md](../decisions.md).

## Licença

[MIT](../../LICENSE). As atribuições de terceiros estão no [NOTICE.md](../../NOTICE.md).

Criado e mantido pela [Phaedra Solutions](https://phaedrasolutions.com), uma empresa de desenvolvimento de software sob medida e IA. Para ajuda na aplicação destas regras no seu código, escreva para [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com).
