---
id: frontend/tailwind
title: Tailwind CSS 4
description: Tailwind CSS 4.x - CSS-first configuration (@import "tailwindcss", @theme tokens, @utility, @custom-variant), automatic content detection with no PurgeCSS step, the @tailwindcss/vite or @tailwindcss/postcss plugins, design tokens instead of arbitrary values, class composition and conditional classes, accessibility, and v3 to v4 upgrade notes (renamed utilities, browser and Node requirements, the official upgrade tool). Use when editing CSS, tailwind.config.* or markup with Tailwind classes.
applies_to: "tailwindcss >=4.0 <5"
globs: ["**/*.css", "tailwind.config.*", "**/*.{tsx,jsx,vue,svelte,astro,html}"]
alwaysApply: false
tier: P1
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://tailwindcss.com/docs/installation/using-vite
  - https://tailwindcss.com/docs/theme
  - https://tailwindcss.com/docs/detecting-classes-in-source-files
  - https://tailwindcss.com/docs/upgrade-guide
  - https://tailwindcss.com/blog
  - https://www.npmjs.com/package/tailwindcss
---

# Tailwind CSS 4

House projects also follow the Tailwind notes in `conventions/phaedra` (theme colors, responsive prefixes).

## Version check

- Read `tailwindcss` and its plugin (`@tailwindcss/vite`, `@tailwindcss/postcss`, `@tailwindcss/cli`) from the lockfile, and look for `tailwind.config.*` and `@tailwind` directives. State it:

  ```text
  Applying frontend/tailwind (tailwindcss 4.3.3 with @tailwindcss/vite, CSS-first config in src/styles.css).
  ```

- Current: 4.3.3. v4 needs Safari 16.4+, Chrome 111+ and Firefox 128+; the upgrade tool needs Node 20+.
- **Tailwind 3** (`tailwind.config.js` with `content`, `@tailwind base/components/utilities`, `tailwindcss` as a PostCSS plugin): write v3 syntax there (v3.4.x is maintained on the `v3-lts` tag) and offer the v4 upgrade separately; it raises browser requirements, so ask about supported browsers first.

## Conventions

- **CSS-first config** in the main stylesheet:

  ```css
  @import "tailwindcss";

  @theme {
    --color-primary: oklch(0.55 0.2 260);
    --color-secondary: oklch(0.7 0.15 160);
    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
    --breakpoint-3xl: 120rem;
  }

  @custom-variant dark (&:where(.dark, .dark *));

  @utility content-auto {
    content-visibility: auto;
  }
  ```

  Don't add a `tailwind.config.js` to a v4 project; use `@config` only to load a legacy config during migration.
- **No PurgeCSS step.** v4 detects classes in source files automatically (respecting `.gitignore`); add sources outside the project with `@source "../ui/src"` and exclude with `@source not`.
- **Build plugin:** `@tailwindcss/vite` for Vite-based apps (Vite, Nuxt, SvelteKit, Astro, React Router); `@tailwindcss/postcss` elsewhere (Next.js, Angular). Don't add `autoprefixer` or `postcss-import`; v4 handles both.
- **Tokens over arbitrary values:** use theme colors, spacing and type scales (`bg-primary`, `text-lg`, `p-4`); add a token to `@theme` instead of repeating `bg-[#1e40af]`. Arbitrary values only for true one-offs.
- **Class names must be complete strings** so detection finds them: map props to full class names (`{ primary: 'bg-primary text-white', ghost: 'bg-transparent' }[variant]`), never build `bg-${color}-500`.
- Compose conditional classes with the project's helper (`clsx`/`cn` with `tailwind-merge`, Vue's `:class` arrays); keep long class lists readable with Prettier's Tailwind plugin if the project uses it.
- Extract repeated patterns into components, not `@apply` blocks; use `@apply` sparingly in component styles (with `@reference` in Vue/Svelte style blocks).
- Responsive and state variants (`sm:`, `md:`, `hover:`, `focus-visible:`, `dark:`) in the markup; mobile-first.

## Security

- Tailwind has no runtime; the risks are in markup. Never put user input into `class` or `style` bindings that come from untrusted sources without an allowlist (CSS injection, UI redressing).
- Don't load Tailwind from a CDN script (`@tailwindcss/browser`) in production; build it.
- Keep focus visible: don't remove outlines without a `focus-visible:` replacement; maintain WCAG contrast with theme colors.

## Known vulnerabilities

No OSV advisories for `tailwindcss` or its plugins as of 2026-10. This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Upgrading from v3

1. Run the official tool on a clean branch: `npx @tailwindcss/upgrade` (Node 20+). It migrates the config to CSS, updates templates and dependencies; review the diff.
2. Check renamed utilities: the v3 `shadow-sm` → `shadow-xs` and `shadow` → `shadow-sm` (same for `blur`, `rounded`, `drop-shadow`), `outline-none` → `outline-hidden`, `ring` → `ring-3`; `bg-opacity-*` → opacity modifiers (`bg-black/50`).
3. Default border and ring colors changed to `currentColor`; add explicit colors where the design relied on gray defaults.
4. Replace `@tailwind` directives with `@import "tailwindcss"` and the PostCSS plugin with `@tailwindcss/vite` or `@tailwindcss/postcss`.
5. Compare key pages visually before and after (screenshots or Playwright visual tests).

## Testing

- Visual regression for shared components when tokens change; check dark mode and focus states.
- Keep `data-testid` and role-based selectors independent of Tailwind classes; never select elements by utility classes in tests.

## Before you finish

```sh
npm run build                            # Tailwind compiles with the app
npx prettier --check .                   # if the project uses prettier-plugin-tailwindcss
grep -rnE "bg-\\$\\{|text-\\$\\{|class=.*\\$\\{" src 2>/dev/null   # dynamically built class names
```
