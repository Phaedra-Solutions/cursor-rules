# 🖱️ Cursor Rules – Code Smarter, Not Harder!  

> **Project status:** being restructured, see [ROADMAP.md](./ROADMAP.md).

Ever feel like your cursor is on a mission of its own—randomly teleporting like it’s in a sci-fi movie? Yeah, we get it. That’s why our team at **Phaedra Solutions** created **Cursor Rules**—a smarter way to keep your coding on track without accidental rage-quits.  

### 🚀 Why You’ll Love It:  
✅ No more rogue clicks ruining your day  
✅ Code like a pro (or at least look like one)  
✅ Built by devs, for devs—because we’ve been there  

### 🤝 Need Help?  
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
| `conventions/phaedra` | convention (optional) | [conventions/phaedra.md](./conventions/phaedra.md) | any | draft |

## Works with

- **Cursor:** as project rules (`.mdc` files) or User Rules.
- **Tools that read `AGENTS.md`:** OpenAI Codex, GitHub Copilot, Claude Code (through `CLAUDE.md`), Gemini CLI and others.

## Install

### Cursor

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

### Other tools

Copy the content of the files you need into an `AGENTS.md` file at your project root. For Claude Code, add a `CLAUDE.md` that contains `@AGENTS.md`.

## Keep Cursor updated

Cursor had several security fixes in 2026 for sandbox escapes and prompt injection (for example CVE-2026-26268, CVE-2026-48124, CVE-2026-50548, CVE-2026-50549 and CVE-2026-73217). Use **Cursor 3.1.2 or later** and install updates when they ship. See [Cursor's security advisories](https://github.com/cursor/cursor/security/advisories) and [ROADMAP.md §5.3](./ROADMAP.md#53-agent-safety-while-coding-coreagent-safety).

## Roadmap

We're restructuring this repo into version-aware rules and skills for many stacks, with a security layer and support for more AI tools. See [ROADMAP.md](./ROADMAP.md).

## License

[MIT](./LICENSE). Third-party attributions are listed in [NOTICE.md](./NOTICE.md).
