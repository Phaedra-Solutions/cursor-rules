# 🖱️ Cursor Rules – Code Smarter, Not Harder!  

> **Project status:** being restructured, see [ROADMAP.md](./ROADMAP.md).

Ever feel like your cursor is on a mission of its own—randomly teleporting like it’s in a sci-fi movie? Yeah, we get it. That’s why our team at **Phaedra Solutions** created **Cursor Rules**—a smarter way to keep your coding on track without accidental rage-quits.  

## 🚀 Why You’ll Love It:  

✅ No more rogue clicks ruining your day  
✅ Code like a pro (or at least look like one)  
✅ Built by devs, for devs—because we’ve been there  

## 🤝 Need Help?  

Whether it’s **cursor magic** or **serious development** work, we’ve got your back. Hit us up at:  
**[hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com)**

We promise real humans will reply—no bots (unless they’re cool AI we built ourselves). Let’s build something epic together! 🚀💻  

Feel free to use our rules to power your own cursor 🔥

## Rule files

| File | Use it for |
|---|---|
| [global-rules.md](./global-rules.md) | Any project: working style and team conventions |
| [react-typescript-rules.md](./react-typescript-rules.md) | React + TypeScript single-page apps built with Vite |
| [next-rules.md](./next-rules.md) | Next.js (App Router) |
| [react-native-rules.md](./react-native-rules.md) | React Native 0.78 with Expo Router |
| [angular-rules.md](./angular-rules.md) | Angular 15 (end of life; an Angular 22 rule is coming) |
| [nestjs-rules.md](./nestjs-rules.md) | NestJS backends and microservices |
| [supabase-rules.md](./supabase-rules.md) | Supabase (Postgres, RLS, Edge Functions) |
| [cypress-testing-rules.md](./cypress-testing-rules.md) | Cypress end-to-end tests |

## Catalog

New-format rules and skills, built from one source for Cursor and `AGENTS.md` tools. See [ROADMAP.md](./ROADMAP.md) for what's coming.

| Item | Type | Path | Applies to | Status |
|---|---|---|---|---|
| `core/behavior` | rule (always on) | [rules/core/behavior.md](./rules/core/behavior.md) | any | draft |
| `core/security-baseline` | rule (always on) | [rules/core/security-baseline.md](./rules/core/security-baseline.md) | any | draft |
| `core/supply-chain` | rule (always on) | [rules/core/supply-chain.md](./rules/core/supply-chain.md) | any | draft |
| `core/agent-safety` | rule (always on) | [rules/core/agent-safety.md](./rules/core/agent-safety.md) | any | draft |
| `core/legacy-mode` | rule (on demand) | [rules/core/legacy-mode.md](./rules/core/legacy-mode.md) | any | draft |
| `languages/typescript` | rule | [rules/languages/typescript.md](./rules/languages/typescript.md) | typescript 6–7 | draft |
| `frontend/react` | rule | [rules/frontend/react.md](./rules/frontend/react.md) | react 19 | draft |
| `frontend/react-vite-spa` | rule | [rules/frontend/react-vite-spa.md](./rules/frontend/react-vite-spa.md) | vite 7–8 | draft |
| `frontend/nextjs` | rule | [rules/frontend/nextjs.md](./rules/frontend/nextjs.md) | next 16 | draft |
| `legacy/nextjs-pages-router` | rule (legacy) | [rules/legacy/nextjs-pages-router.md](./rules/legacy/nextjs-pages-router.md) | next 12–15; Pages Router on any version | legacy |
| `frontend/angular` | rule | [rules/frontend/angular.md](./rules/frontend/angular.md) | @angular/core 20–22 | draft |
| `legacy/angular-ngmodules` | rule (legacy) | [rules/legacy/angular-ngmodules.md](./rules/legacy/angular-ngmodules.md) | @angular/core 2–19; NgModule apps on any version | legacy |
| `mobile/react-native-expo` | rule | [rules/mobile/react-native-expo.md](./rules/mobile/react-native-expo.md) | react-native 0.82–0.88, expo SDK 55–58 | draft |
| `legacy/react-native-old-arch` | rule (legacy) | [rules/legacy/react-native-old-arch.md](./rules/legacy/react-native-old-arch.md) | react-native < 0.82; bare RN CLI apps | legacy |
| `security-audit` | skill | [skills/security-audit/SKILL.md](./skills/security-audit/SKILL.md) | any | draft |
| `dependency-vet` | skill | [skills/dependency-vet/SKILL.md](./skills/dependency-vet/SKILL.md) | any | draft |
| `cve-check` | skill | [skills/cve-check/SKILL.md](./skills/cve-check/SKILL.md) | any | draft |
| `secrets-scan` | skill | [skills/secrets-scan/SKILL.md](./skills/secrets-scan/SKILL.md) | any | draft |
| `threat-model-lite` | skill | [skills/threat-model-lite/SKILL.md](./skills/threat-model-lite/SKILL.md) | any | draft |
| `incident-supply-chain` | skill | [skills/incident-supply-chain/SKILL.md](./skills/incident-supply-chain/SKILL.md) | any | draft |
| `git-commit` | skill | [skills/git-commit/SKILL.md](./skills/git-commit/SKILL.md) | any | draft |
| `upgrade-nextjs` | skill | [skills/upgrade-nextjs/SKILL.md](./skills/upgrade-nextjs/SKILL.md) | next 13–15 → 16 | draft |
| `upgrade-angular` | skill | [skills/upgrade-angular/SKILL.md](./skills/upgrade-angular/SKILL.md) | @angular/core ≤ 21 → 22 | draft |
| `upgrade-react-native` | skill | [skills/upgrade-react-native/SKILL.md](./skills/upgrade-react-native/SKILL.md) | react-native / expo → RN 0.88, SDK 58 | draft |
| Presets (8) | preset | [presets/](./presets/) | per preset | draft |
| Security CI (GitHub, GitLab, Dependabot) | template | [templates/ci/](./templates/ci/README.md) | any | draft |
| Package-manager cooldown settings | template | [templates/package-managers/](./templates/package-managers/) | npm, pnpm, Yarn, Bun, uv | draft |
| `conventions/phaedra` | convention (optional) | [conventions/phaedra.md](./conventions/phaedra.md) | any | draft |

## Works with

- **Cursor:** as project rules (`.mdc` files) or User Rules.
- **Tools that read `AGENTS.md`:** OpenAI Codex, GitHub Copilot, Claude Code (through `CLAUDE.md`), Gemini CLI and others.

## Install

### With the install script (new-format rules and skills)

Requires Node.js 22 or later; the scripts have no dependencies.

```bash
git clone https://github.com/Phaedra-Solutions/cursor-rules.git
cd cursor-rules
node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app --dry-run
node scripts/install.mjs --preset next-supabase --tool cursor,agents --dest ../my-app
```

- `--preset`: one of the files in [`presets/`](./presets/) (`next-supabase`, `nest-angular`, `rn-expo`, `react-vite`, `python-fastapi`, `laravel`, `ai-app`, `all-core`). Leave it out to install everything.
- `--tool`: any of `cursor` (`.cursor/rules/*.mdc` and skills), `agents` (`AGENTS.md` and `.agents/skills/` for Codex, Copilot, Gemini CLI and others) and `claude` (`CLAUDE.md` importing `AGENTS.md`, plus `.claude/skills/`). The default is `cursor,agents`.
- `--dry-run` prints every planned copy without writing anything. Run it first.
- The script never overwrites a file that differs unless you pass `--force`; if anything conflicts, it writes nothing. If your project already has a `CLAUDE.md`, add a line `@AGENTS.md` to it instead of overwriting it.
- It records the installed version, preset and manifest hash in `.cursor/rules/.cursor-rules-version` (or `.agents/` or `.claude/` when Cursor isn't selected).

Presets list rules that are still being written; the script warns about those and installs the rest. To see what a preset produces without installing it, run `node scripts/build.mjs --preset <name>` and look in `dist/`.

### By hand (the original rule files)

Cursor only loads project rules that are `.mdc` files in `.cursor/rules/`. Plain `.md` files there are ignored.

1. Clone this repo next to your project:

   ```bash
   git clone https://github.com/Phaedra-Solutions/cursor-rules.git
   ```

2. Copy the files you need into your project and rename them to `.mdc`:

   ```bash
   mkdir -p .cursor/rules
   cp ../cursor-rules/next-rules.md .cursor/rules/next-rules.mdc
   ```

3. If a file has no frontmatter block, add one at the top so Cursor knows when to apply it:

   ```markdown
   ---
   description: Next.js App Router conventions
   globs: app/**/*.tsx, app/**/*.ts
   alwaysApply: false
   ---
   ```

4. For rules that should apply everywhere, you can instead paste `global-rules.md` into your User Rules (**Customize → Rules** in Cursor).

For other tools, copy the content you need into an `AGENTS.md` file at your project root. For Claude Code, add a `CLAUDE.md` that contains `@AGENTS.md`.

## Keep Cursor updated

Cursor had several security fixes in 2026 for sandbox escapes and prompt injection (for example CVE-2026-26268, CVE-2026-48124, CVE-2026-50548, CVE-2026-50549 and CVE-2026-73217). Use **Cursor 3.1.2 or later** and install updates when they ship. See [Cursor's security advisories](https://github.com/cursor/cursor/security/advisories) and [ROADMAP.md §5.3](./ROADMAP.md#53-agent-safety-while-coding-coreagent-safety).

## Roadmap

We're restructuring this repo into version-aware rules and skills for many stacks, with a security layer and support for more AI tools. See [ROADMAP.md](./ROADMAP.md).

## License

[MIT](./LICENSE). Third-party attributions are listed in [NOTICE.md](./NOTICE.md).
