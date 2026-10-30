---
id: devops/cloud-gcp
title: Google Cloud infrastructure and SDK configuration
description: Google Cloud projects, IaC (Terraform google provider, Config Connector, Cloud Build, App Engine and Cloud Run config) and client library setup - least-privilege IAM with predefined or custom roles, dedicated service accounts without keys, Workload Identity Federation for CI and GKE, organization policy constraints, Secret Manager, default and CMEK encryption, Cloud Audit Logs and Security Command Center, public-exposure checks for buckets, firewall rules and Cloud Run, and cost guardrails with budgets and labels. Use when editing GCP IaC, Cloud Build or deployment config, or Google Cloud client setup.
applies_to: "any"
globs: ["cloudbuild.y*ml", "**/cloudbuild.y*ml", "app.yaml", "**/app.yaml", "service.yaml", "**/gcp/**", "**/gcp/**/*.tf", ".gcloudignore", "firebase.json"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://cloud.google.com/iam/docs/using-iam-securely
  - https://cloud.google.com/iam/docs/best-practices-service-accounts
  - https://cloud.google.com/iam/docs/workload-identity-federation
  - https://cloud.google.com/resource-manager/docs/organization-policy/overview
  - https://cloud.google.com/secret-manager/docs/overview
  - https://cloud.google.com/docs/security/encryption/default-encryption
  - https://cloud.google.com/logging/docs/audit
  - https://cloud.google.com/security-command-center/docs/security-command-center-overview
  - https://cloud.google.com/billing/docs/how-to/budgets
  - https://cloud.google.com/deployment-manager/docs/deprecations
---

# Google Cloud infrastructure and SDK configuration

Also apply `devops/terraform-opentofu` for Terraform code, `devops/kubernetes` for GKE workloads and `devops/github-actions` for CI.

## Version check

- Identify the IaC tool (Terraform/OpenTofu with `google`/`google-beta` provider versions, Config Connector, Deployment Manager), deployment targets (Cloud Run, GKE, App Engine, Cloud Functions) and client libraries (`@google-cloud/*`, `google-cloud-*` for Python). State them:

  ```text
  Applying devops/cloud-gcp (Terraform google provider 7.x, Cloud Run, @google-cloud/storage, org with folders per environment).
  ```

- Cloud Deployment Manager reached end of support on 31 March 2026; migrate its templates to Terraform or Infrastructure Manager.

## Conventions

- Resource hierarchy: organization → folders per environment or business unit → projects per workload and environment; policies set at the folder level.
- Labels on every resource (owner, environment, cost center); enforced through modules.
- Client libraries use Application Default Credentials (attached service account, Workload Identity); never load key files in code.
- Region and project IDs from configuration; no hard-coded project numbers.

## Security

- **IAM least privilege:**
  - grant roles to Google groups, not individual users; avoid basic roles (Owner, Editor, Viewer) in production; use predefined or custom roles at the narrowest resource level;
  - one dedicated service account per workload; don't use the default Compute Engine service account (it has Editor in older projects);
  - **no service account keys**: use attached service accounts, Workload Identity Federation for GKE and for CI (GitHub OIDC with attribute conditions on repository and ref), and short-lived impersonation for humans;
  - review with IAM Recommender and Policy Analyzer; use IAM Conditions for time-bound or resource-scoped grants;
  - grant `roles/iam.serviceAccountUser` and `serviceAccountTokenCreator` only on specific service accounts, never project-wide.
- **Organization policies:** enforce `iam.disableServiceAccountKeyCreation`, `storage.publicAccessPrevention`, `storage.uniformBucketLevelAccess`, `compute.vmExternalIpAccess` (deny or allowlist), `sql.restrictPublicIp`, `gcp.resourceLocations`, and domain-restricted sharing (`iam.allowedPolicyMemberDomains`).
- **Secrets:** Secret Manager with per-secret IAM (`roles/secretmanager.secretAccessor` on the secret, not the project), rotation schedules, and Cloud Run/GKE secret mounts; never in environment variable values in `app.yaml`, `cloudbuild.yaml` or the repo.
- **Encryption:** data is encrypted at rest by default with Google-managed keys; use CMEK (Cloud KMS) where policy requires, and enforce it with `gcp.restrictNonCmekServices`.
- **Public exposure checks:**
  - Cloud Storage buckets with public access prevention; no `allUsers`/`allAuthenticatedUsers` bindings except for intentional public assets behind a CDN;
  - VPC firewall rules without `0.0.0.0/0` ingress except for load balancers; IAP for admin access instead of SSH from the internet;
  - Cloud Run services require authentication (`--no-allow-unauthenticated`) unless public, with ingress set to `internal-and-cloud-load-balancing` behind Cloud Armor where appropriate;
  - Cloud SQL with private IP and the Cloud SQL Auth Proxy or connectors.
- **Logging and audit:** Admin Activity logs are always on; enable Data Access audit logs for sensitive services; aggregated sinks to a locked log project with retention locks; Security Command Center enabled at the organization.

## Cost guardrails

- Cloud Billing budgets with alert thresholds per billing account and project; Pub/Sub budget notifications for automated actions on non-production projects.
- Lifecycle rules on buckets and retention on log buckets; minimum and maximum instances set on Cloud Run and autoscalers.
- Billing export to BigQuery for cost reporting by label.

## Known vulnerabilities

- Client library advisories come through the package ecosystem; GKE and platform issues appear in Google Cloud security bulletins.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA and Google Cloud security bulletins before relying on it.

## Testing

- Scan Terraform with Checkov or Trivy (both include GCP checks); `gcloud` dry runs where supported.
- Policy tests for organization constraints in a sandbox folder; emulators (Firestore, Pub/Sub, Spanner, Bigtable) for local integration tests.

## Before you finish

```sh
checkov -d . --framework terraform        # or: trivy config .
gcloud projects get-iam-policy <project> --format=json | grep -E '"roles/(owner|editor)"|allUsers|allAuthenticatedUsers'
gcloud iam service-accounts keys list --iam-account=<sa-email> --managed-by=user   # expect none
gcloud run services describe <service> --region <region> --format='value(spec.template.spec.serviceAccountName)'
```
