# Security policy

This repository ships instructions that AI coding agents follow, plus scripts that install them. A bad rule can cause real damage in every project that uses it, so we treat rule content as security-sensitive.

## Reporting a vulnerability

1. **Preferred:** use GitHub private vulnerability reporting. Open the repository's **Security** tab and choose **Report a vulnerability**. See [GitHub's guide](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately).
2. **Fallback:** email [hello@phaedrasolutions.com](mailto:hello@phaedrasolutions.com) with the subject `SECURITY: cursor-rules`.

Don't open a public issue or pull request for a suspected vulnerability.

Please include:

- the affected file paths and commit or release;
- what an agent (or script) does as a result, and why it's harmful;
- steps or a prompt that reproduce it, if you have them.

## Scope

In scope:

- **Malicious or unsafe instructions in rules or skills**, for example text that tells an agent to exfiltrate secrets, disable security controls, run untrusted commands, or ignore the user.
- **Hidden-Unicode tampering:** zero-width, bidirectional control or other invisible characters that change what an agent reads versus what a reviewer sees.
- **Rules that would make an agent produce vulnerable code**, for example guidance that leads to injection, broken auth, unsafe deserialization, weak crypto, or pinning a known-vulnerable version.
- **Compromised scripts:** anything in `scripts/`, `skills/*/scripts/`, `.github/workflows/` or `templates/ci/` that could run unexpected code, leak credentials, or tamper with a consumer project.

Out of scope:

- Vulnerabilities in the third-party frameworks our rules describe. Report those to the upstream project.
- Outdated version or CVE tables with no security impact. Open a normal issue instead.

## Response targets

| Step | Target |
|---|---|
| Acknowledge your report | within 3 business days |
| Fix or mitigate a critical issue | within 7 days |
| Fix other confirmed issues | in the next scheduled release |

We credit reporters in the release notes unless you ask us not to.

## Supported versions

Only the latest release and the default branch receive fixes.
