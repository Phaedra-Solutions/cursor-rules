---
id: devops/terraform-opentofu
title: Terraform and OpenTofu
description: Terraform 1.16-1.17 (BSL) and OpenTofu 1.12-1.13 (MPL) - supported versions, remote state with locking and encryption (OpenTofu native state encryption), committed .terraform.lock.hcl with pinned providers and modules, module structure and variable validation, no secrets in code, tfvars or state outputs, least-privilege CI credentials through OIDC, plan review before apply, drift detection, and Checkov or Trivy misconfiguration scanning. Use when editing .tf, .tofu or .tfvars files or the lock file.
applies_to: "any"
globs: ["**/*.tf", "**/*.tofu", "**/*.tfvars", ".terraform.lock.hcl", "**/.terraform.lock.hcl"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://endoflife.date/terraform
  - https://endoflife.date/opentofu
  - https://github.com/hashicorp/terraform/releases
  - https://github.com/opentofu/opentofu/releases
  - https://opentofu.org/docs/language/state/encryption/
  - https://opentofu.org/faq/
  - https://www.hashicorp.com/en/license-faq
  - https://developer.hashicorp.com/terraform/language/backend/s3
  - https://developer.hashicorp.com/terraform/language/files/dependency-lock
  - https://www.checkov.io/
  - https://trivy.dev/docs/latest/guide/scanner/misconfiguration/
---

# Terraform and OpenTofu

Cloud-specific guidance is in `devops/cloud-aws`, `devops/cloud-gcp` and `devops/cloud-azure`; CI pipeline rules in `devops/github-actions`.

## Version check

- Read `required_version` and `required_providers` in the `terraform {}` block, `.terraform-version`/`.opentofu-version` or `mise`/`asdf` files, and which binary CI runs (`terraform` or `tofu`). State it:

  ```text
  Applying devops/terraform-opentofu (OpenTofu 1.13, aws provider ~> 6.0, S3 backend with state encryption).
  ```

- **Supported (Oct 2026):** Terraform 1.17 (latest 1.17.1) and 1.16; 1.15 and older are past HashiCorp's support window. OpenTofu 1.13 and 1.12; 1.11 and older are EOL. Older versions: follow `core/legacy-mode`.
- Licensing: Terraform 1.6+ is under the Business Source License; OpenTofu is the MPL-licensed Linux Foundation fork. Don't switch tools inside a task; follow the project. Configs are mostly compatible, but some features differ (OpenTofu state encryption, provider-defined functions timing, `.tofu` files).

## Conventions

- Layout: root modules per environment or stack (`envs/prod`, `envs/staging`), reusable modules in `modules/`, one backend per root module. Small state files beat one giant state.
- Pin versions: `required_version`, providers with `~>` constraints, modules by exact version or Git commit SHA (`?ref=<sha>`); commit `.terraform.lock.hcl` and update it deliberately (`terraform providers lock` for every CI platform).
- Variables typed, described, and validated (`validation` blocks); `sensitive = true` for secrets passed in; outputs marked `sensitive` when they carry secrets.
- `for_each` over `count` for collections of named resources; `moved` blocks for refactors instead of destroy/recreate; `lifecycle { prevent_destroy = true }` on stateful resources (databases, buckets with data).
- Tags/labels on every resource (owner, environment, cost center) via provider default tags.
- Format and validate: `terraform fmt` (or `tofu fmt`) and `validate` in CI; TFLint with the provider ruleset.

## Security

- **State:** remote backend with locking (S3 with native lockfile or DynamoDB, GCS, Azure Blob with lease, Terraform Cloud/HCP, or an OpenTofu-compatible backend); encrypted at rest; access limited to the CI role and a few admins. State contains secrets in plain text: never commit it, never print it in logs.
- **OpenTofu state encryption:** enable `terraform { encryption { … } }` with a KMS key provider (AWS KMS, GCP KMS, OpenBao) for state and plan files; plan key rotation.
- **Secrets:** none in `.tf`, committed `.tfvars` or variable defaults. Read them at plan time from the cloud secret manager (data sources) or pass them through CI secrets as `TF_VAR_*`; prefer resources that generate secrets in the provider (managed passwords) over passing them through Terraform at all.
- **Credentials:** CI authenticates with OIDC to short-lived cloud roles (separate plan and apply roles; apply only from the protected branch or environment); no long-lived access keys in CI or developer machines.
- **Least privilege in resources:** IAM policies with specific actions and resource ARNs, no `*:*`; security groups and firewall rules without `0.0.0.0/0` except on intended public load balancers; storage private by default; encryption with customer-managed keys where required.
- **Plan review:** every apply comes from a reviewed plan (saved plan file applied as-is); watch for unexpected destroys, IAM changes and public exposure in the diff.
- **Modules and providers:** from the official registries or reviewed internal sources; check new providers with `dependency-vet`; provider checksums come from the lock file.
- **Drift:** run scheduled `plan -detailed-exitcode` and alert on drift.

## Known vulnerabilities

- Terraform and OpenTofu core advisories are rare; provider releases fix most issues. Keep providers within supported majors and update the lock file regularly.
- `tfsec` has been merged into Trivy; use `trivy config` or Checkov for misconfiguration scanning.

This list goes stale; verify with the `cve-check` skill or the projects' security advisories before relying on it.

## Testing

- `terraform test` / `tofu test` for module contracts; Terratest or plan-based assertions for critical modules.
- Scan every change in CI with Checkov or Trivy and fail on high-severity findings; record accepted risks with inline skip comments that include a reason.

## Before you finish

```sh
terraform fmt -check -recursive          # or: tofu fmt -check -recursive
terraform init -backend=false && terraform validate
tflint --recursive
checkov -d . --framework terraform       # or: trivy config .
terraform plan -out=tfplan               # in CI with the plan role; review before apply
```
