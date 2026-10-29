---
id: core/legacy-mode
title: Legacy mode
description: Apply when the installed version of a runtime or framework is below the active rule's applies_to range, when a legacy/* rule is active, or when the stack is past end of life. Keeps changes minimal and version-correct and reports EOL status.
applies_to: "any"
globs: []
alwaysApply: false
tier: P0
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-29
sources:
  - https://endoflife.date/
  - https://endoflife.date/nodejs
  - https://nodejs.org/en/about/previous-releases
  - https://osv.dev/
  - https://github.com/advisories
  - https://www.herodevs.com/support
---

# Legacy mode

Use this rule when the installed version is older than the active rule supports, when a `legacy/*` rule is active, or when the runtime or framework is end of life (EOL). It adds to the stack's legacy rule; it doesn't replace it.

## Principles

1. **Read exact versions and say which rule you're applying.** Take versions from the lockfile, not the ranges in the manifest. Take the runtime version from `.nvmrc`, `.node-version`, `engines`, `.python-version`, `requires-python`, `composer.json` `require.php`, the Dockerfile base image or the CI config.

   ```
   Applying legacy/vue2 (vue 2.7.16 from package-lock.json; Node 18.20.4 from .nvmrc).
   ```

2. **Never use anything newer than what's installed.** No APIs, syntax, config options or CLI flags from later versions. Never add a dependency, or a dependency version, that needs a newer runtime or framework; check its `engines`, `peerDependencies` or `requires-python` first.
3. **Keep diffs minimal and behavior-preserving.** Before refactoring, add characterization tests that pin the current behavior. Don't modernize style, syntax or structure in passing.
4. **Don't migrate unless asked.** If the task would be much safer or simpler on a newer version, say so in one line and name the migration skill (see below).
5. **Security first.**
   - Name the known CVEs for the installed version. Check them with the `cve-check` skill, OSV or GHSA rather than from memory.
   - Prefer the last patched release in the same major line. Ask before changing any version, even a patch.
   - Where no fix exists, add compensating controls: CSP, strict input validation and output encoding, WAF rules, isolating or disabling the vulnerable component, removing unused features.
   - You may mention commercial extended support (vendor ESU or third-party long-term support such as HeroDevs NES) as an option. Don't recommend a specific vendor.
6. **State the EOL status in the summary of every change.**

## Reporting EOL status

Add one line per EOL or soon-EOL component (runtime and main framework) to every change summary:

```
EOL: Node 20.20.2 — end of life since 2026-04-30, no security fixes. Known issues: check with cve-check. Migration: upgrade-node.
```

- Include the name and installed version, the status (supported, security fixes only, or EOL since a date), and the migration skill.
- Take dates from the vendor's release page or endoflife.date. If you can't verify the status, write "EOL status unverified" instead of guessing.
- Flag components that reach EOL within 6 months as "EOL on <date>".

## When to propose a migration skill

Propose a migration skill (don't start it) when:

- the runtime or framework is EOL and the task touches security-sensitive code (auth, payments, uploads, parsing untrusted input);
- the fix the user needs only exists in a newer major version;
- the workaround would be larger or riskier than the upgrade;
- a dependency the task requires needs a newer runtime or framework.

How to propose it:

- Name the skill: `upgrade-<stack>` for version upgrades (`upgrade-node`, `upgrade-angular`, `upgrade-nextjs`), `migrate-<from>` or `migrate-<from>-to-<to>` for platform changes (`migrate-angularjs`, `migrate-vue2`, `migrate-cra-to-vite`).
- If the skill isn't installed, link the official migration guide instead.
- Upgrade one major version at a time. Never combine an upgrade with feature work in the same change.

## Don't

- Don't "fix" deprecation warnings by upgrading packages unless asked.
- Don't remove polyfills, shims or compatibility code without confirming the supported browsers or runtimes.
- Don't run codemods, `ng update`, `npm audit fix --force` or similar automated upgraders without asking.
