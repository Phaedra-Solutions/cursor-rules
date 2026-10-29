# Notices and third-party attributions

This repository is licensed under the MIT License (see [`LICENSE`](./LICENSE)), except for third-party material listed below, which keeps its original license.

## Project CodeGuard (CoSAI), CC BY 4.0

- **Project:** Project CodeGuard, by the Coalition for Secure AI (CoSAI), an OASIS Open Project
- **Source:** https://github.com/cosai-oasis/project-codeguard
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
  - License text: https://github.com/cosai-oasis/project-codeguard/blob/main/LICENSE.md
  - Summary: https://creativecommons.org/licenses/by/4.0/

Parts of our generic security layer (for example `rules/core/security-baseline` and the security skills) adapt content from Project CodeGuard. Changes were made: content was reworded, reorganized into our rule and skill formats, and extended with stack-specific and house guidance.

Every file that adapts CodeGuard content lists the CodeGuard repository URL in its frontmatter `sources`. Those adapted portions remain under CC BY 4.0; our own additions in the same files are MIT.

Adapted files (upstream: CodeGuard v1.5.0, commit `41160d5`):

| Our file | CodeGuard sources adapted |
|---|---|
| `rules/core/security-baseline.md` | `sources/rules/core/`: `codeguard-1-hardcoded-credentials`, `codeguard-1-crypto-algorithms`, `codeguard-0-authorization-access-control`, `codeguard-0-input-validation-injection`, `codeguard-0-session-management-and-cookies`, `codeguard-0-xml-and-serialization`, `codeguard-0-logging`, `codeguard-0-api-web-services` |

Project CodeGuard does not endorse this repository.
