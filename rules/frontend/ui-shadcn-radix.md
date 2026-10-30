---
id: frontend/ui-shadcn-radix
title: shadcn/ui and Radix UI
description: shadcn/ui and Radix UI - the copy-in model (components are owned code added with the shadcn CLI and components.json), reviewing CLI diffs and third-party registry items before adding them, composing instead of forking Radix primitives, keeping Radix accessibility behavior (focus management, keyboard, ARIA, portals), theming through Tailwind 4 tokens and CSS variables, cn() with tailwind-merge, and safe rendering of user content inside components. Use when adding or editing components in components/ui or using Radix primitives.
applies_to: "any"
globs: ["components/ui/**", "src/components/ui/**", "components.json", "**/*.{tsx,jsx}"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://ui.shadcn.com/docs
  - https://ui.shadcn.com/docs/cli
  - https://ui.shadcn.com/docs/theming
  - https://www.radix-ui.com/primitives/docs/overview/accessibility
  - https://www.npmjs.com/package/shadcn
  - https://www.npmjs.com/package/radix-ui
  - https://www.npmjs.com/package/tailwind-merge
---

# shadcn/ui and Radix UI

Also apply `frontend/react` and `frontend/tailwind`. Forms built with shadcn's form components follow `frontend/forms-validation`.

## Version check

- Read `components.json` (style, Tailwind config path, aliases, registries), and `shadcn`, `radix-ui` (unified package) or `@radix-ui/react-*`, `tailwind-merge`, `class-variance-authority` and Tailwind from the lockfile. State them:

  ```text
  Applying frontend/ui-shadcn-radix (components.json new-york style, radix-ui 1.8, Tailwind 4, aliases @/components/ui).
  ```

- Current: shadcn CLI 4 (4.23), `radix-ui` 1.8. Projects on per-primitive `@radix-ui/react-*` packages keep them; don't mix both styles for the same primitive.
- Tailwind 4 projects use CSS-variable theming in the stylesheet; Tailwind 3 projects keep `tailwind.config` theme extensions.

## Conventions

- **Copy-in model:** shadcn components live in the repo (`components/ui/*`) and are the project's own code. Add them with the CLI so imports and dependencies are wired: `npx shadcn@latest add dialog` (preview with `--dry-run`, compare with `--diff`). Don't overwrite customized components (`--overwrite`) without reviewing the diff with the user.
- Keep `components/ui` primitives generic; build product components (`OrderStatusBadge`) in feature folders on top of them.
- Variants with `class-variance-authority`; merge classes with the project's `cn()` helper (`clsx` + `tailwind-merge`) so consumers can override.
- **Compose, don't fork Radix:** wrap primitives and pass props through (`asChild`, `...props`, `ref`); don't reimplement focus trapping, dismissal, roving focus or positioning, and don't copy Radix internals into the repo.
- Keep Radix's accessibility behavior intact:
  - every `Dialog`/`AlertDialog`/`Sheet` has a `Title` (visually hidden if needed) and a `Description` or `aria-describedby={undefined}` deliberately;
  - icon-only buttons have `aria-label`;
  - don't remove focus outlines without a `focus-visible:` style;
  - don't stop propagation of keyboard events Radix relies on;
  - keep portals for overlays so stacking and focus work.
- **Theming:** semantic tokens (`--background`, `--foreground`, `--primary`, `--muted`, …) defined once in CSS and mapped to Tailwind (`@theme inline` on Tailwind 4); components use `bg-primary text-primary-foreground`, never raw hex. Dark mode via the class strategy the project uses.
- Add `data-testid` to interactive product components (house projects); tests query Radix components by role.

## Security

- **Registries are supply chain:** `shadcn add` from third-party registries copies code and installs npm dependencies into your project. Read the registry item (`--view`) and the dependencies it adds, run `dependency-vet` on new packages, and add only from registries the team trusts.
- Treat registry items, blocks and AI-generated components like any other code: review them for `dangerouslySetInnerHTML`, remote scripts, tracking calls and unsafe `href`s.
- Render user content as text inside components; `Command`, `Combobox` and `Toast` content with user data must not use HTML injection.
- Don't put secrets or environment values in components shipped to the client.

## Known vulnerabilities

- No current OSV advisories for `shadcn`, `radix-ui` or `@radix-ui/react-*` as of 2026-10. The main risk is code added from registries and the dependencies they pull in.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Testing Library: open and close dialogs and menus with the keyboard (`Escape`, `Tab`, arrow keys), assert focus moves into and back out of overlays, and query by role and accessible name.
- Automated accessibility checks (`@axe-core/playwright` or `jest-axe`/`vitest-axe`) on pages built from these components.

## Before you finish

```sh
npx shadcn@latest add <component> --dry-run   # before adding: review files and dependencies
npx tsc --noEmit
npm test
npm audit --audit-level=moderate
```
