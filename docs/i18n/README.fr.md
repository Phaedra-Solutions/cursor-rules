# Règles Cursor et Agent Skills pour les agents de code IA

[English](../../README.md) | [简体中文](./README.zh-CN.md) | [हिन्दी](./README.hi.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | **Français** | [বাংলা](./README.bn.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru.md) | [اردو](./README.ur.md)

> Ceci est une traduction. La version anglaise ([README.md](../../README.md)) fait foi et contient le catalogue complet généré automatiquement.

**Des règles qui tiennent compte des versions et donnent la priorité à la sécurité, pour Cursor, Claude Code, OpenAI Codex, GitHub Copilot et Gemini CLI.** Open source (MIT), maintenu par [Phaedra Solutions](https://phaedrasolutions.com).

`cursor-rules` est une bibliothèque de règles de code et d'[Agent Skills](https://agentskills.io) qui fait travailler les agents de code IA comme un ingénieur senior sur votre stack. Avant qu'un agent écrive du code, chaque règle vérifie la version du framework réellement utilisée par votre projet. Elle applique ensuite les conventions actuelles, les contrôles de sécurité et les vérifications de vulnérabilités connues pour cette version. Pour les versions anciennes ou en fin de vie (EOL), elle bascule vers des consignes pour code legacy et un chemin de migration. Une seule source génère les règles de projet Cursor (`.mdc`), `AGENTS.md`, `CLAUDE.md` et les Agent Skills (`SKILL.md`), pour que tous les outils de votre équipe suivent les mêmes instructions.

Questions ou projets : [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com).

## En bref

| | |
|---|---|
| **De quoi s'agit-il** | Des règles pour agents de code IA (standards de code, sécurité, tests, vérification des versions) et des skills à la demande (audits, mises à jour, migrations) |
| **Compatible avec** | Cursor, Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI et tout outil qui lit `AGENTS.md` ou les Agent Skills |
| **Stacks** | TypeScript, React, Next.js, Angular, Vue, Nuxt, Svelte, Astro, React Native, Expo, Flutter, SwiftUI, Jetpack Compose, Node.js, Express, NestJS, Fastify, Hono, Python, FastAPI, Django, PHP, Laravel, Java, Spring Boot, C#, ASP.NET Core, Go, Supabase, Postgres, Prisma, Drizzle, MongoDB, Firebase, Docker, Kubernetes, Terraform, GitHub Actions, AWS, GCP, Azure, WordPress, applications LLM, RAG, agents IA, serveurs MCP, et plus |
| **Legacy** | AngularJS, Create React App, composants de classe, jQuery, Vue 2, Express 4, Node.js ≤ 20, PHP ≤ 8.2, Django ≤ 4.2, Python 2.7, Rails ≤ 7.2, Struts, .NET Framework, Xamarin, Cordova, et plus |
| **Sécurité** | OWASP Top 10:2025, CWE Top 25, sécurisation de la chaîne d'approvisionnement, défenses contre l'injection de prompts pour les agents, tableaux de CVE datés avec versions minimales sûres |
| **Installation** | `node scripts/install.mjs --preset <name>` : Node.js 22+, aucune dépendance, pas de paquet npm |
| **Licence** | MIT |

## Sommaire

- [Pourquoi des règles qui tiennent compte des versions](#pourquoi-des-règles-qui-tiennent-compte-des-versions)
- [Fonctionnement](#fonctionnement)
- [Outils compatibles](#outils-compatibles)
- [Démarrage rapide](#démarrage-rapide)
- [Presets](#presets)
- [Stacks prises en charge](#stacks-prises-en-charge)
- [Catalogue](#catalogue)
- [Sécurité](#sécurité)
- [Gardez vos outils à jour](#gardez-vos-outils-à-jour)
- [FAQ](#faq)
- [Contribuer](#contribuer)
- [Licence](#licence)

## Pourquoi des règles qui tiennent compte des versions

Les agents de code IA sont entraînés sur des années d'exemples mélangés, si bien qu'ils écrivent souvent du code pour la mauvaise version. Ils utilisent `middleware.ts` dans une app Next.js 16, des NgModules dans Angular 22, ou `getServerSideProps` là où l'App Router est utilisé. Ils ajoutent aussi des paquets qui n'existent pas, oublient les contrôles d'autorisation et recopient des modèles affectés par des CVE connues.

Les fichiers de règles génériques aggravent le problème : ils supposent une seule version, deviennent obsolètes en quelques mois et ne disent rien de la sécurité. Ces règles procèdent autrement :

- **Vérifier la version d'abord.** Chaque règle de stack commence par lire la version installée dans le lockfile ou le manifeste, puis indique quelle règle et quelle version elle applique.
- **Rester à jour.** Chaque règle déclare la plage de versions pour laquelle elle a été écrite (`applies_to`), ses sources et une date `last_reviewed`. Une tâche hebdomadaire signale les règles dont la plage est dépassée par une nouvelle version majeure ou une date de fin de vie.
- **Traiter le code legacy en toute sécurité.** Quand un projet est sous la plage d'une règle, l'agent suit une règle `legacy/`. Il fait des changements minimaux qui préservent le comportement, n'utilise jamais d'API plus récentes que celles installées, signale le statut EOL, ajoute des contrôles compensatoires pour les CVE non corrigées et propose un skill de migration.
- **Intégrer la sécurité.** Des règles de code sécurisé alignées sur OWASP sont toujours actives. Chaque règle de stack ajoute sa propre section sécurité et un tableau daté des vulnérabilités connues.

## Fonctionnement

Les règles et les skills sont écrits une seule fois dans `rules/` et `skills/`, puis générés pour chaque outil.

1. **Les règles core sont toujours actives.** `core/behavior`, `core/security-baseline`, `core/supply-chain` et `core/agent-safety` se chargent à chaque session.
2. **Les règles de stack s'activent selon le type de fichier.** Modifier `app/page.tsx` charge `frontend/nextjs` ; modifier `supabase/migrations/*.sql` charge `data/supabase`. Dans les outils sans règles par fichier (Codex, Gemini CLI), chaque règle de stack est fournie sous forme de skill `<stack>-conventions` chargé à la demande.
3. **La règle vérifie la version.** L'agent lit le lockfile et indique ce qu'il applique, par exemple :

   ```text
   Applying frontend/nextjs (next 16.4.1, react 19.2.8, from pnpm-lock.yaml).
   ```

4. **Les règles legacy prennent le relais sous la plage.** Avec Next.js 15 ou un répertoire `pages/`, l'agent suit `legacy/nextjs-pages-router` et `core/legacy-mode`.
5. **Les skills s'exécutent à la demande.** Des procédures comme `security-audit`, `cve-check`, `upgrade-nextjs` ou `migrate-cra-to-vite` restent hors du contexte jusqu'à ce que vous ou l'agent les invoquiez ; une grande bibliothèque de skills ne coûte donc presque rien.

Les règles les plus spécifiques l'emportent sur les plus générales, et les règles de sécurité l'emportent sur les règles de confort, sauf si vous les contournez explicitement. Dans ce cas, l'agent le signale.

Chaque règle suit la même structure : **Version check**, **Conventions**, **Security**, **Known vulnerabilities**, **Testing** et **Before you finish**, qui liste les commandes exactes de lint, de vérification des types, de test et d'audit. Les règles legacy ajoutent **Migration path**.

## Outils compatibles

| Outil | Ce qui est installé | Où l'outil le lit |
|---|---|---|
| **Cursor** (3.1.2 ou ultérieur) | Règles de projet et skills | `.cursor/rules/**/*.mdc`, `.cursor/skills/` |
| **OpenAI Codex, GitHub Copilot, Gemini CLI** et autres outils `AGENTS.md` | `AGENTS.md` (règles core et index des stacks) et skills | `AGENTS.md`, `.agents/skills/` |
| **Claude Code** | `CLAUDE.md` qui importe `AGENTS.md`, et skills | `CLAUDE.md`, `.claude/skills/` |

## Démarrage rapide

Nécessite Node.js 22 ou ultérieur. Les scripts n'ont aucune dépendance.

1. Clonez un tag de version :

   ```bash
   git clone --branch v1.1.0 https://github.com/Phaedra-Solutions/cursor-rules.git
   cd cursor-rules
   ```

2. Prévisualisez ce qu'un preset installera dans votre projet :

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
   ```

3. Installez-le :

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
   ```

Options :

- `--preset` : l'un des [presets](#presets). Omettez-le pour tout installer.
- `--tool` : au choix `cursor`, `agents` (`AGENTS.md` et `.agents/skills/`) et `claude` (`CLAUDE.md` et `.claude/skills/`). La valeur par défaut est `cursor,agents`.
- `--dry-run` : affiche chaque copie prévue sans rien écrire. Lancez-le d'abord.
- `--force` : écrase les fichiers différents. Sans cette option, le script n'écrit rien en cas de conflit. Si votre projet a déjà un `CLAUDE.md`, ajoutez-y la ligne `@AGENTS.md` au lieu de l'écraser.

L'installateur enregistre la version, le preset et le hash du manifeste dans `.cursor/rules/.cursor-rules-version` (ou sous `.agents/` ou `.claude/`) : vous savez toujours quelle version un projet utilise.

**Sans cloner :** téléchargez l'archive de votre outil depuis une [GitHub Release](https://github.com/Phaedra-Solutions/cursor-rules/releases), vérifiez-la avec `SHA256SUMS` (`sha256sum -c SHA256SUMS --ignore-missing`) et copiez son contenu à la racine de votre projet.

**Pour voir le résultat avant :** lancez `node scripts/build.mjs --preset <name>` et regardez dans `dist/`.

Épinglez un tag de version et mettez à jour délibérément ; le [CHANGELOG](../../CHANGELOG.md) liste les changements.

## Presets

Un preset regroupe les règles core, les règles de stack et les skills pour un type de projet. Choisissez le plus proche de votre stack ; `all-core` fonctionne avec n'importe quel projet. Les règles de stack ne se chargent que lorsque vous modifiez des fichiers correspondants, donc les règles supplémentaires n'encombrent pas le contexte de l'agent.

| Preset | Stack |
|---|---|
| [`ai-app`](../../presets/ai-app.yml) | Fonctions LLM, RAG, agents et serveurs MCP (TypeScript ou Python) |
| [`all-core`](../../presets/all-core.yml) | Règles core et skills de sécurité uniquement ; compatible avec toute stack |
| [`laravel`](../../presets/laravel.yml) | Laravel 13 sur PHP 8.3+ |
| [`nest-angular`](../../presets/nest-angular.yml) | API NestJS avec un frontend Angular |
| [`next-supabase`](../../presets/next-supabase.yml) | Next.js App Router avec Supabase, TypeScript et Tailwind |
| [`python-fastapi`](../../presets/python-fastapi.yml) | API Python avec FastAPI, Pydantic v2 et SQLAlchemy 2 |
| [`react-vite`](../../presets/react-vite.yml) | Application monopage React construite avec Vite |
| [`rn-expo`](../../presets/rn-expo.yml) | React Native avec Expo (New Architecture) |

Le nombre de règles et de skills par preset figure dans le [tableau des presets en anglais](../../README.md#presets).

## Stacks prises en charge

Chaque stack a une règle moderne ; la plupart ont aussi une règle legacy et un skill de mise à jour ou de migration.

- **Langages :** TypeScript, JavaScript sur Node.js, Python, PHP, Java, Kotlin, C#, Go, Dart, Swift, scripts shell.
- **Frontend :** React 19, Next.js 16 (App Router), React avec Vite, Angular, Vue 3, Nuxt 4, Svelte 5 et SvelteKit, Astro, Tailwind CSS 4, shadcn/ui et Radix, formulaires et validation (React Hook Form, Zod, Standard Schema), état et données serveur (TanStack Query, Zustand, Redux Toolkit).
- **Mobile :** React Native et Expo (New Architecture), Flutter, SwiftUI, Jetpack Compose, sécurité mobile (OWASP MASVS).
- **Backend :** NestJS (core, microservices, accès aux données), Express 5, Fastify, Hono, FastAPI, Django, Laravel, Spring Boot, ASP.NET Core, services HTTP en Go, GraphQL.
- **Données :** Supabase, PostgreSQL, Prisma, Drizzle, Sequelize, TypeORM, SQLAlchemy, MongoDB et Mongoose, Firebase.
- **Tests :** Cypress, Playwright, Vitest et Jest, pytest, accessibilité (axe-core, WCAG 2.2).
- **DevOps et cloud :** GitHub Actions, Docker, Kubernetes, Terraform et OpenTofu, AWS, Google Cloud, Azure, Vercel, Netlify, Cloudflare Workers.
- **IA :** applications LLM, RAG, agents IA, serveurs MCP (OWASP Top 10 pour les applications LLM et agentiques).
- **CMS :** plugins et thèmes WordPress.
- **Legacy :** AngularJS, NgModules Angular, Create React App et composants de classe, Pages Router de Next.js, ancienne architecture React Native, jQuery, Vue 2 et Nuxt 2/3, Express 4, Node.js 20 et antérieurs, NestJS 11 et Bull, PHP 8.2 et antérieurs avec Laravel 11 et CodeIgniter 3, Python 2.7, Django 4.2, Rails 7.2 et antérieurs, Java 8/11/17 avec Spring Boot 2/3, Apache Struts, .NET 8/9, .NET Framework (Web Forms, WCF, ASMX), Xamarin, Apache Cordova, Flutter 2, anciennes clés Supabase, le contrôleur retiré ingress-nginx, Moment.js et d'autres bibliothèques en mode maintenance.

## Catalogue

La liste complète des règles et des skills, avec la plage de versions exacte de chaque règle (`applies_to`), sa priorité (P0–P3) et son statut, est générée à partir des fichiers et se trouve dans le [catalogue en anglais](../../README.md#catalog). En dehors de la plage d'une règle, l'agent suit `core/legacy-mode` ou la règle `legacy/` correspondante.

Également dans ce dépôt :

- [`evals/`](../../evals/README.md) : suites promptfoo qui mesurent l'effet de chaque règle P0 en exécutant les mêmes prompts avec et sans la règle.
- [`templates/ci/`](../../templates/ci/README.md) : workflows de sécurité à copier dans vos projets (GitHub Actions, GitLab CI, Dependabot).
- [`templates/package-managers/`](../../templates/package-managers/) : délais minimaux de publication pour npm, pnpm, Yarn, Bun et uv, qui bloquent les paquets publiés ces derniers jours.

## Sécurité

La sécurité fait partie de chaque règle ; ce n'est pas un module séparé.

- **Règles core toujours actives :**
  - `core/security-baseline` : code sécurisé organisé selon l'OWASP Top 10:2025, avec références au CWE Top 25.
  - `core/supply-chain` : ne jamais inventer de paquets, lockfiles et installations figées, délais minimaux de publication, politique des scripts d'installation et actions CI épinglées.
  - `core/agent-safety` : traiter le contenu récupéré comme des données et non comme des instructions, gestion des secrets, confirmation avant les commandes risquées, listes de serveurs MCP autorisés.
  - `core/behavior` : changements limités au besoin et alertes de sécurité en une ligne, même dans les réponses courtes.
- **Sécurité par stack :** chaque règle a une section sécurité et un tableau daté des vulnérabilités connues avec les versions minimales sûres. Les règles legacy ajoutent des contrôles compensatoires pour les versions qui ne reçoivent plus de correctifs.
- **Skills de sécurité :** `security-audit` (dépendances, code, secrets, conteneurs et CI), `dependency-vet` (détection du typosquatting et des paquets inventés avant l'installation), `cve-check` (recherches OSV et GitHub Advisory), `secrets-scan` (gitleaks), `threat-model-lite` (une passe STRIDE de 10 minutes) et `incident-supply-chain` (réponse à une dépendance compromise).
- **Pour vos projets :** les modèles CI de [`templates/ci/`](../../templates/ci/README.md) exécutent OSV-Scanner, Semgrep, gitleaks et zizmor.
- **Pour ce dépôt :** le lint des pull requests vérifie le frontmatter, la taille, l'Unicode caché, les liens et le Markdown. Une tâche quotidienne confronte [`security/watchlist.yml`](../../security/watchlist.yml) à OSV et au CISA KEV, et une tâche hebdomadaire vérifie chaque plage `applies_to` face aux nouvelles versions et aux dates de fin de vie.
- **Signalement :** voir [SECURITY.md](../../SECURITY.md). N'ouvrez pas d'issue publique pour une vulnérabilité.

## Gardez vos outils à jour

- **Cursor :** plusieurs correctifs de 2026 concernaient des évasions du bac à sable et l'injection de prompts (par exemple CVE-2026-26268, CVE-2026-48124, CVE-2026-50548, CVE-2026-50549 et CVE-2026-73217). Utilisez **Cursor 3.1.2 ou ultérieur** et installez les mises à jour dès leur sortie. Voir les [avis de sécurité de Cursor](https://github.com/cursor/cursor/security/advisories).
- **Claude Code, Codex, Copilot et autres agents :** gardez-les sur des versions récentes ; `core/agent-safety` couvre leurs fichiers de configuration et leurs serveurs MCP.
- **Ces règles :** les tableaux de versions et d'avis vieillissent. Passez à la dernière version au moins une fois par mois et utilisez le skill `cve-check` avant de vous fier à un tableau.

## FAQ

### Que sont les règles Cursor ?

Les règles Cursor sont des instructions que l'agent IA de Cursor lit pendant qu'il travaille sur votre projet. Les règles de projet se trouvent dans `.cursor/rules/` sous forme de fichiers `.mdc` dont le frontmatter indique quand chaque règle s'applique : toujours, pour certains motifs de fichiers (`globs`), ou quand l'agent juge que la description correspond. Ce dépôt génère ces fichiers à partir d'une seule source, ainsi que `AGENTS.md` et des Agent Skills pour les autres outils.

### Quelle est la différence entre une règle et un skill ?

Une **règle** est une consigne courte et déclarative qui doit être dans le contexte chaque fois que des fichiers correspondants sont modifiés, par exemple « utilisez `proxy.ts`, pas `middleware.ts` » avec Next.js 16. Un **skill** est une procédure pas à pas exécutée à la demande, par exemple « auditer les dépendances » ou « mettre à jour Angular une version majeure à la fois ». Seuls le nom et la description d'un skill restent dans le contexte jusqu'à son utilisation.

### Est-ce compatible avec Claude Code, Codex, GitHub Copilot ou Gemini CLI ?

Oui. Installez avec `--tool agents` pour les outils qui lisent `AGENTS.md` et `.agents/skills/` (Codex, Copilot, Gemini CLI et d'autres), ou avec `--tool claude` pour Claude Code, qui reçoit un `CLAUDE.md` important `AGENTS.md` et des skills dans `.claude/skills/`. Vous pouvez installer pour plusieurs outils à la fois : `--tool cursor,agents,claude`.

### L'installateur va-t-il écraser mes fichiers ?

Non. Il n'écrase jamais un fichier différent sans `--force`, et en cas de conflit il n'écrit rien. Lancez d'abord `--dry-run` pour voir chaque copie prévue.

### Mon projet utilise une ancienne version. Les règles m'aideront-elles ?

Oui. Quand la version installée est sous la plage d'une règle, l'agent suit la règle `legacy/` correspondante et `core/legacy-mode`. Il limite les changements, signale le statut de fin de vie, applique des contrôles compensatoires pour les CVE non corrigées et propose un skill de migration comme `migrate-angularjs`, `upgrade-express` ou `migrate-dotnet-framework`. Il ne migre pas sans votre demande et demande avant de changer une version, même un correctif.

### Comment les règles restent-elles à jour et exactes ?

Chaque affirmation sur une version, une date ou une CVE a une source dans le frontmatter de la règle. Une tâche quotidienne confronte les paquets suivis à OSV et au catalogue CISA Known Exploited Vulnerabilities, une tâche hebdomadaire signale les règles dépassées par de nouvelles versions ou des fins de vie, et une revue de sécurité mensuelle est ouverte sous forme d'issue. Les règles P0 ont des suites d'évaluation qui mesurent à quelle fréquence l'agent les suit.

### Puis-je ajouter les conventions de mon équipe ?

Oui. Les choix propres à l'équipe vont dans une surcouche dans `conventions/` que les presets peuvent inclure ; [`conventions/phaedra.md`](../../conventions/phaedra.md) en est un exemple. Les règles génériques respectent les choix existants du projet ; votre surcouche n'a donc besoin que de ce qui diffère pour votre équipe.

### Comment ajouter une stack non couverte ?

Suivez [CONTRIBUTING.md](../../CONTRIBUTING.md) ou utilisez le prompt réutilisable [`implementation-prompts/36-template-new-stack.md`](../../implementation-prompts/36-template-new-stack.md) avec votre agent IA. Les nouvelles règles doivent passer `node scripts/lint-rules.mjs`.

### Est-ce gratuit ?

Oui. Le dépôt est sous licence MIT. Le contenu adapté de [Project CodeGuard](https://github.com/cosai-oasis/project-codeguard) conserve son attribution CC BY 4.0 dans [NOTICE.md](../../NOTICE.md).

## Contribuer

Consultez [CONTRIBUTING.md](../../CONTRIBUTING.md) pour les modèles de règles et de skills, les règles de sourçage et le processus de revue. Avant d'ouvrir une pull request :

```bash
node scripts/lint-rules.mjs
node --test scripts/*.test.mjs
node scripts/build.mjs
node scripts/build.mjs --catalog
```

Le plan et sa justification sont dans [ROADMAP.md](../../ROADMAP.md) ; les décisions dans [docs/decisions.md](../decisions.md).

## Licence

[MIT](../../LICENSE). Les attributions tierces sont listées dans [NOTICE.md](../../NOTICE.md).

Conçu et maintenu par [Phaedra Solutions](https://phaedrasolutions.com), une entreprise de développement de logiciels sur mesure et d'IA. Pour de l'aide afin d'appliquer ces règles à votre code, écrivez à [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com).
