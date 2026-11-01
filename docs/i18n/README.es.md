# Reglas de Cursor y Agent Skills para agentes de programación con IA

[English](../../README.md) | [简体中文](./README.zh-CN.md) | [हिन्दी](./README.hi.md) | **Español** | [العربية](./README.ar.md) | [Français](./README.fr.md) | [বাংলা](./README.bn.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru.md) | [اردو](./README.ur.md)

> Esta es una traducción. La versión en inglés ([README.md](../../README.md)) es la referencia y contiene el catálogo completo generado automáticamente.

**Reglas conscientes de la versión y centradas en la seguridad para Cursor, Claude Code, OpenAI Codex, GitHub Copilot y Gemini CLI.** Código abierto (MIT), mantenido por [Phaedra Solutions](https://phaedrasolutions.com).

`cursor-rules` es una biblioteca de reglas de programación y [Agent Skills](https://agentskills.io) que hace que los agentes de programación con IA trabajen como un ingeniero sénior en tu stack. Antes de que un agente escriba código, cada regla comprueba qué versión del framework usa realmente tu proyecto. Después aplica las convenciones actuales, los controles de seguridad y las comprobaciones de vulnerabilidades conocidas para esa versión. Para versiones antiguas o sin soporte (EOL), cambia a una guía para código heredado con una ruta de migración. Una sola fuente genera las reglas de proyecto de Cursor (`.mdc`), `AGENTS.md`, `CLAUDE.md` y Agent Skills (`SKILL.md`), de modo que todas las herramientas de tu equipo siguen las mismas instrucciones.

Preguntas o proyectos: [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com).

## Resumen

| | |
|---|---|
| **Qué es** | Reglas para agentes de programación con IA (estándares de código, seguridad, pruebas, comprobación de versiones) y skills bajo demanda (auditorías, actualizaciones, migraciones) |
| **Funciona con** | Cursor, Claude Code, OpenAI Codex, GitHub Copilot, Gemini CLI y cualquier herramienta que lea `AGENTS.md` o Agent Skills |
| **Stacks** | TypeScript, React, Next.js, Angular, Vue, Nuxt, Svelte, Astro, React Native, Expo, Flutter, SwiftUI, Jetpack Compose, Node.js, Express, NestJS, Fastify, Hono, Python, FastAPI, Django, PHP, Laravel, Java, Spring Boot, C#, ASP.NET Core, Go, Supabase, Postgres, Prisma, Drizzle, MongoDB, Firebase, Docker, Kubernetes, Terraform, GitHub Actions, AWS, GCP, Azure, WordPress, apps con LLM, RAG, agentes de IA, servidores MCP y más |
| **Código heredado** | AngularJS, Create React App, componentes de clase, jQuery, Vue 2, Express 4, Node.js ≤ 20, PHP ≤ 8.2, Django ≤ 4.2, Python 2.7, Rails ≤ 7.2, Struts, .NET Framework, Xamarin, Cordova y más |
| **Seguridad** | OWASP Top 10:2025, CWE Top 25, protección de la cadena de suministro, defensas contra inyección de prompts para agentes y tablas de CVE fechadas con versiones mínimas seguras |
| **Instalación** | `node scripts/install.mjs --preset <name>`: Node.js 22+, sin dependencias, sin paquete npm |
| **Licencia** | MIT |

## Contenido

- [Por qué reglas conscientes de la versión](#por-qué-reglas-conscientes-de-la-versión)
- [Cómo funciona](#cómo-funciona)
- [Compatibilidad](#compatibilidad)
- [Inicio rápido](#inicio-rápido)
- [Presets](#presets)
- [Stacks compatibles](#stacks-compatibles)
- [Catálogo](#catálogo)
- [Seguridad](#seguridad)
- [Mantén tus herramientas actualizadas](#mantén-tus-herramientas-actualizadas)
- [Preguntas frecuentes](#preguntas-frecuentes)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Por qué reglas conscientes de la versión

Los agentes de programación con IA se entrenan con años de ejemplos mezclados, así que a menudo escriben código para la versión equivocada. Usan `middleware.ts` en una app de Next.js 16, NgModules en Angular 22 o `getServerSideProps` donde se usa el App Router. También añaden paquetes que no existen, omiten comprobaciones de autorización y copian patrones con CVE conocidos.

Los archivos de reglas genéricos empeoran el problema: suponen una sola versión, quedan obsoletos en pocos meses y no dicen nada de seguridad. Estas reglas funcionan de otra forma:

- **Primero comprueban la versión.** Cada regla de stack empieza leyendo la versión instalada del lockfile o del manifiesto. Después indica qué regla y qué versión está aplicando.
- **Se mantienen al día.** Cada regla declara el rango de versiones para el que se escribió (`applies_to`), sus fuentes y una fecha `last_reviewed`. Una tarea semanal marca las reglas cuyo rango se queda atrás frente a una nueva versión mayor o una fecha de fin de soporte.
- **Tratan el código heredado con seguridad.** Cuando un proyecto está por debajo del rango de una regla, el agente sigue una regla `legacy/`. Hace cambios mínimos que preservan el comportamiento, nunca usa API más nuevas que las instaladas, informa del estado EOL, añade controles compensatorios para CVE sin parche y propone un skill de migración.
- **Incluyen la seguridad desde el principio.** Las reglas de programación segura alineadas con OWASP están siempre activas. Cada regla de stack añade su propia sección de seguridad y una tabla fechada de vulnerabilidades conocidas.

## Cómo funciona

Las reglas y los skills se escriben una vez en `rules/` y `skills/`, y luego se generan para cada herramienta.

1. **Las reglas core siempre están activas.** `core/behavior`, `core/security-baseline`, `core/supply-chain` y `core/agent-safety` se cargan en cada sesión.
2. **Las reglas de stack se activan según el tipo de archivo.** Editar `app/page.tsx` carga `frontend/nextjs`; editar `supabase/migrations/*.sql` carga `data/supabase`. En herramientas sin reglas por archivo (Codex, Gemini CLI), cada regla de stack se distribuye como un skill `<stack>-conventions` que se carga bajo demanda.
3. **La regla comprueba la versión.** El agente lee el lockfile e indica qué está aplicando, por ejemplo:

   ```text
   Applying frontend/nextjs (next 16.4.1, react 19.2.8, from pnpm-lock.yaml).
   ```

4. **Las reglas heredadas toman el control por debajo del rango.** Con Next.js 15 o un directorio `pages/`, el agente sigue `legacy/nextjs-pages-router` y `core/legacy-mode`.
5. **Los skills se ejecutan bajo demanda.** Procedimientos como `security-audit`, `cve-check`, `upgrade-nextjs` o `migrate-cra-to-vite` quedan fuera del contexto hasta que tú o el agente los invocáis, así que una biblioteca grande de skills casi no cuesta nada.

Las reglas más específicas prevalecen sobre las más generales, y las reglas de seguridad prevalecen sobre las de conveniencia salvo que las anules de forma explícita. Si lo haces, el agente lo indica.

Todas las reglas siguen la misma estructura: **Version check**, **Conventions**, **Security**, **Known vulnerabilities**, **Testing** y **Before you finish**, que enumera los comandos exactos de lint, comprobación de tipos, pruebas y auditoría. Las reglas heredadas añaden **Migration path**.

## Compatibilidad

| Herramienta | Qué se instala | Dónde lo lee la herramienta |
|---|---|---|
| **Cursor** (3.1.2 o posterior) | Reglas de proyecto y skills | `.cursor/rules/**/*.mdc`, `.cursor/skills/` |
| **OpenAI Codex, GitHub Copilot, Gemini CLI** y otras herramientas con `AGENTS.md` | `AGENTS.md` (reglas core y un índice de stacks) y skills | `AGENTS.md`, `.agents/skills/` |
| **Claude Code** | `CLAUDE.md` que importa `AGENTS.md`, y skills | `CLAUDE.md`, `.claude/skills/` |

## Inicio rápido

Requiere Node.js 22 o posterior. Los scripts no tienen dependencias.

1. Clona una etiqueta de versión:

   ```bash
   git clone --branch v1.0.0 https://github.com/Phaedra-Solutions/cursor-rules.git
   cd cursor-rules
   ```

2. Revisa qué instalará un preset en tu proyecto:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
   ```

3. Instálalo:

   ```bash
   node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
   ```

Opciones:

- `--preset`: uno de los [presets](#presets). Omítelo para instalarlo todo.
- `--tool`: cualquiera de `cursor`, `agents` (`AGENTS.md` y `.agents/skills/`) y `claude` (`CLAUDE.md` y `.claude/skills/`). El valor predeterminado es `cursor,agents`.
- `--dry-run`: muestra cada copia prevista sin escribir nada. Ejecútalo primero.
- `--force`: sobrescribe los archivos que difieren. Sin esta opción, el script no escribe nada si hay algún conflicto. Si tu proyecto ya tiene un `CLAUDE.md`, añade la línea `@AGENTS.md` en lugar de sobrescribirlo.

El instalador guarda la versión, el preset y el hash del manifiesto en `.cursor/rules/.cursor-rules-version` (o en `.agents/` o `.claude/`), así siempre sabes qué versión usa un proyecto.

**Sin clonar:** descarga el archivo de tu herramienta desde una [GitHub Release](https://github.com/Phaedra-Solutions/cursor-rules/releases), compruébalo con `SHA256SUMS` (`sha256sum -c SHA256SUMS --ignore-missing`) y copia su contenido en la raíz de tu proyecto.

**Para ver el resultado antes:** ejecuta `node scripts/build.mjs --preset <name>` y revisa `dist/`.

Fija una etiqueta de versión y actualiza de forma deliberada; el [CHANGELOG](../../CHANGELOG.md) enumera los cambios.

## Presets

Un preset agrupa las reglas core, las reglas de stack y los skills para un tipo de proyecto. Elige el más parecido a tu stack; `all-core` funciona con cualquier proyecto. Las reglas de stack solo se cargan al editar archivos que coinciden, así que las reglas adicionales no llenan el contexto del agente.

| Preset | Stack |
|---|---|
| [`ai-app`](../../presets/ai-app.yml) | Funciones con LLM, RAG, agentes y servidores MCP (TypeScript o Python) |
| [`all-core`](../../presets/all-core.yml) | Solo reglas core y skills de seguridad; funciona con cualquier stack |
| [`laravel`](../../presets/laravel.yml) | Laravel 13 sobre PHP 8.3+ |
| [`nest-angular`](../../presets/nest-angular.yml) | API con NestJS y frontend con Angular |
| [`next-supabase`](../../presets/next-supabase.yml) | Next.js App Router con Supabase, TypeScript y Tailwind |
| [`python-fastapi`](../../presets/python-fastapi.yml) | API en Python con FastAPI, Pydantic v2 y SQLAlchemy 2 |
| [`react-vite`](../../presets/react-vite.yml) | Aplicación de una sola página con React y Vite |
| [`rn-expo`](../../presets/rn-expo.yml) | React Native con Expo (New Architecture) |

El número de reglas y skills de cada preset está en la [tabla de presets en inglés](../../README.md#presets).

## Stacks compatibles

Cada stack tiene una regla moderna; la mayoría también tiene una regla heredada y un skill de actualización o migración.

- **Lenguajes:** TypeScript, JavaScript en Node.js, Python, PHP, Java, Kotlin, C#, Go, Dart, Swift, scripts de shell.
- **Frontend:** React 19, Next.js 16 (App Router), React con Vite, Angular, Vue 3, Nuxt 4, Svelte 5 y SvelteKit, Astro, Tailwind CSS 4, shadcn/ui y Radix, formularios y validación (React Hook Form, Zod, Standard Schema), estado y datos del servidor (TanStack Query, Zustand, Redux Toolkit).
- **Móvil:** React Native y Expo (New Architecture), Flutter, SwiftUI, Jetpack Compose, seguridad móvil (OWASP MASVS).
- **Backend:** NestJS (core, microservicios, acceso a datos), Express 5, Fastify, Hono, FastAPI, Django, Laravel, Spring Boot, ASP.NET Core, servicios HTTP en Go, GraphQL.
- **Datos:** Supabase, PostgreSQL, Prisma, Drizzle, Sequelize, TypeORM, SQLAlchemy, MongoDB y Mongoose, Firebase.
- **Pruebas:** Cypress, Playwright, Vitest y Jest, pytest, accesibilidad (axe-core, WCAG 2.2).
- **DevOps y nube:** GitHub Actions, Docker, Kubernetes, Terraform y OpenTofu, AWS, Google Cloud, Azure, Vercel, Netlify, Cloudflare Workers.
- **IA:** apps con LLM, RAG, agentes de IA, servidores MCP (OWASP Top 10 para aplicaciones LLM y agénticas).
- **CMS:** plugins y temas de WordPress.
- **Heredado:** AngularJS, NgModules de Angular, Create React App y componentes de clase, Pages Router de Next.js, arquitectura antigua de React Native, jQuery, Vue 2 y Nuxt 2/3, Express 4, Node.js 20 y anteriores, NestJS 11 y Bull, PHP 8.2 y anteriores con Laravel 11 y CodeIgniter 3, Python 2.7, Django 4.2, Rails 7.2 y anteriores, Java 8/11/17 con Spring Boot 2/3, Apache Struts, .NET 8/9, .NET Framework (Web Forms, WCF, ASMX), Xamarin, Apache Cordova, Flutter 2, claves heredadas de Supabase, el controlador retirado ingress-nginx, Moment.js y otras bibliotecas en modo mantenimiento.

## Catálogo

La lista completa de reglas y skills, con el rango de versiones exacto de cada regla (`applies_to`), su prioridad (P0–P3) y su estado, se genera a partir de los archivos y está en el [catálogo en inglés](../../README.md#catalog). Fuera del rango de una regla, el agente sigue `core/legacy-mode` o la regla `legacy/` correspondiente.

También en este repositorio:

- [`evals/`](../../evals/README.md): suites de promptfoo que miden el efecto de cada regla P0 ejecutando los mismos prompts con y sin la regla.
- [`templates/ci/`](../../templates/ci/README.md): flujos de seguridad para copiar en tus proyectos (GitHub Actions, GitLab CI, Dependabot).
- [`templates/package-managers/`](../../templates/package-managers/): ajustes de espera mínima de publicación para npm, pnpm, Yarn, Bun y uv, que bloquean paquetes publicados en los últimos días.

## Seguridad

La seguridad forma parte de cada regla; no es un complemento aparte.

- **Reglas core siempre activas:**
  - `core/security-baseline`: programación segura agrupada según OWASP Top 10:2025, con referencias a CWE Top 25.
  - `core/supply-chain`: no inventar paquetes, lockfiles e instalaciones congeladas, espera mínima de publicación, política de scripts de instalación y acciones de CI fijadas.
  - `core/agent-safety`: tratar el contenido obtenido como datos y no como instrucciones, gestión de secretos, confirmación antes de comandos de riesgo y listas de servidores MCP permitidos.
  - `core/behavior`: cambios acotados y hallazgos de seguridad en una línea, incluso en respuestas breves.
- **Seguridad por stack:** cada regla tiene una sección de seguridad y una tabla fechada de vulnerabilidades conocidas con versiones mínimas seguras. Las reglas heredadas añaden controles compensatorios para versiones que ya no reciben parches.
- **Skills de seguridad:** `security-audit` (dependencias, código, secretos, contenedores y CI), `dependency-vet` (detección de typosquatting y paquetes inventados antes de instalar), `cve-check` (consultas a OSV y GitHub Advisory), `secrets-scan` (gitleaks), `threat-model-lite` (un análisis STRIDE de 10 minutos) e `incident-supply-chain` (respuesta ante una dependencia comprometida).
- **Para tus proyectos:** las plantillas de CI en [`templates/ci/`](../../templates/ci/README.md) ejecutan OSV-Scanner, Semgrep, gitleaks y zizmor.
- **Para este repositorio:** el lint de pull requests comprueba el frontmatter, el tamaño, el Unicode oculto, los enlaces y el Markdown. Una tarea diaria compara [`security/watchlist.yml`](../../security/watchlist.yml) con OSV y CISA KEV, y una tarea semanal comprueba cada rango `applies_to` frente a nuevas versiones y fechas de fin de soporte.
- **Reportes:** consulta [SECURITY.md](../../SECURITY.md). No abras issues públicos para vulnerabilidades.

## Mantén tus herramientas actualizadas

- **Cursor:** varias correcciones de 2026 cubrieron escapes del sandbox e inyección de prompts (por ejemplo CVE-2026-26268, CVE-2026-48124, CVE-2026-50548, CVE-2026-50549 y CVE-2026-73217). Usa **Cursor 3.1.2 o posterior** e instala las actualizaciones cuando salgan. Consulta los [avisos de seguridad de Cursor](https://github.com/cursor/cursor/security/advisories).
- **Claude Code, Codex, Copilot y otros agentes:** mantenlos en versiones actuales; `core/agent-safety` cubre sus archivos de configuración y servidores MCP.
- **Estas reglas:** las tablas de versiones y avisos quedan obsoletas. Actualiza a la última versión al menos una vez al mes y usa el skill `cve-check` antes de confiar en una tabla.

## Preguntas frecuentes

### ¿Qué son las reglas de Cursor?

Las reglas de Cursor son instrucciones que el agente de IA de Cursor lee mientras trabaja en tu proyecto. Las reglas de proyecto viven en `.cursor/rules/` como archivos `.mdc` con un frontmatter que indica cuándo se aplica cada regla: siempre, para ciertos patrones de archivo (`globs`) o cuando el agente decide que la descripción encaja. Este repositorio genera esos archivos a partir de una sola fuente, junto con `AGENTS.md` y Agent Skills para otras herramientas.

### ¿Cuál es la diferencia entre una regla y un skill?

Una **regla** es una guía breve y declarativa que debe estar en el contexto cada vez que se editan archivos que coinciden, como "usa `proxy.ts`, no `middleware.ts`" en Next.js 16. Un **skill** es un procedimiento paso a paso que se ejecuta bajo demanda, como "auditar las dependencias" o "actualizar Angular una versión mayor cada vez". Solo el nombre y la descripción de un skill permanecen en el contexto hasta que se usa.

### ¿Funciona con Claude Code, Codex, GitHub Copilot o Gemini CLI?

Sí. Instala con `--tool agents` para las herramientas que leen `AGENTS.md` y `.agents/skills/` (Codex, Copilot, Gemini CLI y otras), o con `--tool claude` para Claude Code, que recibe un `CLAUDE.md` que importa `AGENTS.md` y skills en `.claude/skills/`. Puedes instalar para varias herramientas a la vez: `--tool cursor,agents,claude`.

### ¿El instalador sobrescribe mis archivos?

No. Nunca sobrescribe un archivo distinto salvo que pases `--force`, y si hay algún conflicto no escribe nada. Ejecuta primero `--dry-run` para ver cada copia prevista.

### Mi proyecto usa una versión antigua. ¿Me sirven las reglas?

Sí. Cuando la versión instalada está por debajo del rango de una regla, el agente sigue la regla `legacy/` correspondiente y `core/legacy-mode`. Mantiene los cambios al mínimo, informa del estado de fin de soporte, aplica controles compensatorios para CVE sin parche y sugiere un skill de migración, como `migrate-angularjs`, `upgrade-express` o `migrate-dotnet-framework`. No migra salvo que se lo pidas, y pregunta antes de cambiar cualquier versión, incluso un parche.

### ¿Cómo se mantienen las reglas actualizadas y precisas?

Cada afirmación sobre versiones, fechas y CVE tiene una fuente en el frontmatter de la regla. Una tarea diaria compara los paquetes vigilados con OSV y el catálogo CISA Known Exploited Vulnerabilities, una tarea semanal marca las reglas que se quedan atrás frente a nuevas versiones o fechas de fin de soporte, y cada mes se abre un issue de revisión de seguridad. Las reglas P0 tienen suites de evaluación que miden con qué frecuencia el agente las sigue.

### ¿Puedo añadir las convenciones de mi equipo?

Sí. Las decisiones propias del equipo van en una capa en `conventions/` que los presets pueden incluir; [`conventions/phaedra.md`](../../conventions/phaedra.md) es un ejemplo. Las reglas genéricas respetan las decisiones existentes del proyecto, así que tu capa solo necesita lo que es distinto para tu equipo.

### ¿Cómo añado un stack que no está cubierto?

Sigue [CONTRIBUTING.md](../../CONTRIBUTING.md) o usa el prompt reutilizable de [`implementation-prompts/36-template-new-stack.md`](../../implementation-prompts/36-template-new-stack.md) con tu agente de IA. Las nuevas reglas deben pasar `node scripts/lint-rules.mjs`.

### ¿Es gratis?

Sí. El repositorio tiene licencia MIT. El contenido adaptado de [Project CodeGuard](https://github.com/cosai-oasis/project-codeguard) conserva su atribución CC BY 4.0 en [NOTICE.md](../../NOTICE.md).

## Contribuir

Consulta [CONTRIBUTING.md](../../CONTRIBUTING.md) para ver las plantillas de reglas y skills, las normas sobre fuentes y el proceso de revisión. Antes de abrir un pull request:

```bash
node scripts/lint-rules.mjs
node --test scripts/*.test.mjs
node scripts/build.mjs
node scripts/build.mjs --catalog
```

El plan y su razonamiento están en [ROADMAP.md](../../ROADMAP.md); las decisiones, en [docs/decisions.md](../decisions.md).

## Licencia

[MIT](../../LICENSE). Las atribuciones de terceros están en [NOTICE.md](../../NOTICE.md).

Creado y mantenido por [Phaedra Solutions](https://phaedrasolutions.com), una empresa de desarrollo de software a medida e IA. Para ayuda con la aplicación de estas reglas en tu código, escribe a [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com).
