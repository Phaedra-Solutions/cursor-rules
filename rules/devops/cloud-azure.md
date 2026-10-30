---
id: devops/cloud-azure
title: Azure infrastructure and SDK configuration
description: Azure subscriptions, IaC (Bicep, ARM templates, Terraform azurerm, azd) and SDK configuration - least-privilege Azure RBAC with built-in roles at the narrowest scope, managed identities and workload identity federation instead of client secrets, Privileged Identity Management, Azure Policy, Key Vault with RBAC, encryption defaults and customer-managed keys, Activity Log and Defender for Cloud, public-exposure checks for storage, NSGs and PaaS endpoints, and cost guardrails with budgets and tags. Use when editing Bicep or ARM templates, azd config, Azure Terraform code or Azure SDK setup.
applies_to: "any"
globs: ["**/*.bicep", "**/*.bicepparam", "azuredeploy*.json", "**/azuredeploy*.json", "azure.yaml", "**/azure/**/*.tf", "host.json", "azure-pipelines.y*ml"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices
  - https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview
  - https://learn.microsoft.com/en-us/azure/key-vault/general/overview
  - https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption
  - https://learn.microsoft.com/en-us/azure/storage/blobs/anonymous-read-access-prevent
  - https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log
  - https://learn.microsoft.com/en-us/azure/governance/policy/overview
  - https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction
  - https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets
---

# Azure infrastructure and SDK configuration

Also apply `devops/terraform-opentofu` for Terraform code, `devops/kubernetes` for AKS workloads, `devops/github-actions` for CI and `backend/aspnet-core` for .NET apps.

## Version check

- Identify the IaC tool (Bicep CLI version, ARM templates, Terraform/OpenTofu with `azurerm`/`azapi` provider versions, Azure Developer CLI `azure.yaml`), deployment targets (App Service, Container Apps, Functions, AKS) and SDKs (`@azure/*`, `azure-*` for Python, `Azure.*` for .NET). State them:

  ```text
  Applying devops/cloud-azure (Bicep, azd, Container Apps, @azure/identity with DefaultAzureCredential).
  ```

- Prefer Bicep over hand-written ARM JSON for new templates; use Azure Verified Modules where they fit.

## Conventions

- Management groups → subscriptions per environment or workload → resource groups per application and lifecycle; landing zone policies at the management group.
- Tags on every resource (owner, environment, cost center) enforced with Azure Policy (`require tag` / `inherit tag from resource group`).
- SDK clients authenticate with `DefaultAzureCredential` or a specific `ManagedIdentityCredential`; no connection strings with account keys in code.
- Names follow the Cloud Adoption Framework abbreviations; locations and SKUs come from parameters.

## Security

- **RBAC least privilege:**
  - assign built-in roles at the narrowest scope (resource or resource group, not subscription); avoid Owner and Contributor for workloads; data-plane roles (e.g. Storage Blob Data Reader, Key Vault Secrets User) instead of management roles;
  - assign roles to Entra ID groups; limit Owner and User Access Administrator, use Privileged Identity Management for just-in-time elevation;
  - custom roles only when no built-in role fits, with explicit actions and no `*`.
- **Identities:** managed identities (user-assigned for shared lifecycles) for apps; workload identity federation for GitHub Actions and AKS; no service principal client secrets in CI or app settings. Disable local auth (shared keys, SAS where avoidable) on Storage, Service Bus, Event Hubs and Cosmos DB when Entra ID auth is used.
- **Secrets:** Azure Key Vault with the RBAC permission model, soft delete and purge protection, private endpoint for production; App Service and Container Apps use Key Vault references; never in app settings as plain values, Bicep parameter defaults or the repo (`@secure()` parameters for anything sensitive).
- **Encryption:** Azure Storage, managed disks and SQL encrypt at rest by default with Microsoft-managed keys; use customer-managed keys in Key Vault where policy requires; enforce TLS 1.2+ (`minimumTlsVersion`) and HTTPS-only.
- **Public exposure checks:**
  - Storage accounts with `allowBlobPublicAccess: false` and public network access disabled or restricted;
  - PaaS services (SQL, Cosmos DB, Key Vault, Storage) behind private endpoints with `publicNetworkAccess: 'Disabled'` in production;
  - NSGs without inbound `*`/`Internet` rules on management ports; Azure Bastion or JIT VM access instead;
  - App Service and Functions with authentication or network restrictions unless public; FTP disabled.
- **Policy:** assign Azure Policy initiatives (Microsoft cloud security benchmark) and deny effects for public storage, missing private endpoints, unapproved locations and SKUs.
- **Logging and audit:** export the Activity Log and resource diagnostic settings to a Log Analytics workspace; Microsoft Defender for Cloud enabled with the relevant plans; Entra ID sign-in and audit logs retained.

## Cost guardrails

- Cost Management budgets with alerts per subscription and resource group; action groups for automation on non-production.
- Auto-shutdown for dev VMs, scale rules with maximums on Container Apps and App Service plans, and log retention set on workspaces.
- Azure Advisor cost recommendations reviewed regularly.

## Known vulnerabilities

- SDK advisories come through the package ecosystem (npm, PyPI, NuGet); service issues appear in Microsoft Security Response Center advisories and Azure Service Health.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA and MSRC before relying on it.

## Testing

- `az bicep build` and `az deployment group what-if` before every deployment; PSRule for Azure or Checkov/Trivy for misconfigurations.
- Azurite and the Cosmos DB emulator for local integration tests; a sandbox subscription for deployment tests.

## Before you finish

```sh
az bicep build --file main.bicep
az bicep lint --file main.bicep
az deployment group what-if --resource-group <rg> --template-file main.bicep --parameters main.bicepparam
checkov -d . --framework bicep,arm,terraform   # or: trivy config .
```
