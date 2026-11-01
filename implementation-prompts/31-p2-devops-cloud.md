# Prompt 31: P2 DevOps and cloud: Kubernetes, Terraform/OpenTofu, AWS/GCP/Azure, Vercel/Netlify/Cloudflare

> Self-contained; safe in a fresh session. Roadmap: Phase 4, §6 (DevOps and cloud), §7 (P2 essentials table), §5.8.

## Before you start
1. Read `implementation-prompts/00-shared-context.md` and follow it.
2. Read the `ROADMAP.md` §7 P2 rows for Kubernetes and Terraform/OpenTofu, and the ingress-nginx row of §5.8.
3. Research:
   - Kubernetes Pod Security Standards and the Gateway API status; ingress-nginx retirement details;
   - OpenTofu state encryption; Terraform's current version and license notes;
   - Checkov and Trivy IaC scanning;
   - IAM least-privilege docs for AWS, GCP and Azure;
   - the Vercel, Netlify and Cloudflare Workers env-var exposure and preview-protection docs.

## Task
Create these as tier P2 rules, each under 220 lines:

1. **`rules/devops/kubernetes.md`**
   - globs: `k8s/**`, `charts/**`, `**/*.k8s.y*ml`, `kustomization.y*ml`, `helmfile*`
   - `legacy_rule`: `legacy/ingress-nginx`
2. **`rules/devops/terraform-opentofu.md`**
   - globs: `**/*.tf`, `**/*.tofu`, `**/*.tfvars`, `.terraform.lock.hcl`
3. **`rules/devops/cloud-aws.md`**, **`rules/devops/cloud-gcp.md`** and **`rules/devops/cloud-azure.md`**
   - globs: IaC and SDK config files for each provider
   - cover: IAM least privilege; the secret manager; encryption defaults; logging and audit; public-exposure checks; cost guardrails
4. **`rules/devops/vercel-netlify-cloudflare.md`**
   - globs: `vercel.json`, `netlify.toml`, `wrangler.toml`, `wrangler.json*`
   - cover: which env vars reach clients; preview-deployment protection; edge runtime limits; headers config; secrets in the platform store

## Done when
All six rules exist and are sourced, the lint script passes if it exists, and you've completed the shared-context workflow.
