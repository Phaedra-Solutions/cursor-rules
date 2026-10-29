# Prompt 05: Security skills 1: security-audit, dependency-vet, cve-check

> Self-contained; safe in a fresh session. Roadmap: Phase 1, §5.6, §5.7.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` (§5 is the skill format) and follow it.
2. Read `ROADMAP.md` §5.6 and §5.7.

## Task
Verify every command and flag against official docs before writing it: `osv-scanner scan source`, `npm audit`, `pnpm audit`, `pip-audit`, `govulncheck`, `cargo audit`, `composer audit`, `bundle audit`, `dotnet list package --vulnerable`, `gitleaks`, `semgrep`, `trivy`, the OSV query API and the GitHub advisories API.

1. **`skills/security-audit/SKILL.md`:**
   - detect the stack from manifests and lockfiles;
   - run the toolbox commands that apply (tell the agent to check that each tool is installed and to ask before installing any);
   - triage by severity, reachability and exploitation status (CISA KEV);
   - propose the smallest patch-level fix; never upgrade a major version without asking;
   - write findings to `security-report.md` with a fixed table format.
   - Add `skills/security-audit/scripts/detect-stack.sh` (POSIX shell, no dependencies). It prints the ecosystems it detects and the suggested commands.
2. **`skills/dependency-vet/SKILL.md`:** run before adding any package. It checks:
   - that the package exists on the official registry and the name matches exactly (typosquat and hallucination check);
   - age, maintainers, downloads, repository link and recent ownership changes;
   - install scripts, license and open advisories;
   - whether an existing dependency or the standard library already covers the need.

   It outputs a short verdict (approve / ask the user / reject) with reasons. Include the registry URLs or API calls for npm, PyPI, crates.io, Packagist, RubyGems, NuGet, Maven Central and pub.dev.
3. **`skills/cve-check/SKILL.md`:**
   - look up `package@version` through the OSV API (`api.osv.dev/v1/query`), `gh api /advisories` and the vendor security page;
   - report each advisory's ID, severity, affected and fixed versions, and exploitation status;
   - include ready-to-run `curl` and `gh` examples.

## Done when
All three skills follow the Agent Skills format, every command was verified, the script is executable (`chmod +x`), and you've completed the shared-context workflow.
