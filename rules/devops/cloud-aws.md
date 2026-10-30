---
id: devops/cloud-aws
title: AWS infrastructure and SDK configuration
description: AWS accounts, IaC (Terraform, CDK, CloudFormation, SAM, Serverless) and SDK configuration - least-privilege IAM with roles and temporary credentials instead of access keys, OIDC for CI, IAM Access Analyzer, SCPs, Secrets Manager or Parameter Store, encryption with KMS, S3 Block Public Access, CloudTrail and Security Hub, public-exposure checks for security groups, buckets and endpoints, and cost guardrails with AWS Budgets and tags. Use when editing AWS IaC, CDK apps, SAM or Serverless templates, or AWS SDK client setup.
applies_to: "any"
globs: ["cdk.json", "**/cdk.json", "samconfig.toml", "template.y*ml", "serverless.y*ml", "**/cloudformation/**", "**/*.cfn.y*ml", "**/*.cfn.json", "**/aws/**/*.tf"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html
  - https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html
  - https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html
  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html
  - https://docs.aws.amazon.com/AmazonS3/latest/userguide/default-encryption-faq.html
  - https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html
  - https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html
  - https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
---

# AWS infrastructure and SDK configuration

Also apply `devops/terraform-opentofu` for Terraform code, `devops/kubernetes` for EKS workloads and `devops/github-actions` for CI.

## Version check

- Identify the IaC tool (Terraform/OpenTofu with the `aws` provider version, CDK v2 with `aws-cdk-lib`, CloudFormation/SAM, Serverless Framework) and the SDK (AWS SDK for JavaScript v3, boto3, AWS SDK for Java 2.x, …). State them:

  ```text
  Applying devops/cloud-aws (Terraform aws provider 6.x, AWS SDK for JavaScript v3, accounts via AWS Organizations).
  ```

- AWS SDK for JavaScript v2 and the AWS CDK v1 are end of support; new code uses SDK v3 modular clients and CDK v2. Keep providers and SDKs on current majors.

## Conventions

- Multi-account layout through AWS Organizations (separate production, staging and shared accounts); workloads never in the management account.
- Tags on every resource (owner, environment, cost center, data classification), enforced with tag policies or provider default tags.
- Region and account IDs come from configuration, not hard-coded strings; ARNs built from variables.
- SDK clients created once per process with explicit region, retries and timeouts; credentials from the default provider chain (role, IRSA/Pod Identity, SSO), never passed in code.

## Security

- **IAM least privilege:**
  - humans sign in through IAM Identity Center with MFA; no IAM users with long-lived access keys;
  - workloads use roles (instance profiles, task roles, Lambda execution roles, EKS Pod Identity/IRSA) with temporary credentials;
  - CI uses OIDC federation to a role scoped to the repository and branch or environment;
  - policies list specific actions and resource ARNs with conditions; no `"Action": "*"` or `"Resource": "*"` for write actions; no `iam:PassRole` on `*`;
  - review with IAM Access Analyzer (unused access, external access, policy validation) and apply permissions boundaries for roles created by automation;
  - Service Control Policies deny disabling CloudTrail, leaving approved regions and deleting log buckets.
- **Secrets:** AWS Secrets Manager (rotation enabled) or SSM Parameter Store `SecureString`; read at runtime with caching; never in Lambda environment variables in plain text, CloudFormation parameters with defaults, or the repo.
- **Encryption:** S3 encrypts new objects by default (SSE-S3); use SSE-KMS with customer-managed keys where policy requires; encrypt RDS, EBS (account-level default encryption), DynamoDB and SQS/SNS; enforce TLS with `aws:SecureTransport` bucket policies.
- **Public exposure checks:**
  - S3 Block Public Access on at account and bucket level; serve public content through CloudFront with Origin Access Control;
  - no security group ingress from `0.0.0.0/0` or `::/0` except on public load balancers (80/443); SSH and RDP through Session Manager instead;
  - RDS, ElastiCache and OpenSearch in private subnets with `publicly_accessible = false`;
  - Lambda function URLs and API Gateway routes have an authorizer unless intentionally public;
  - no public AMI, EBS or RDS snapshots.
- **Logging and audit:** an organization CloudTrail trail to a locked-down log archive account (log file validation on), AWS Config, GuardDuty and Security Hub enabled in every account and region in use; VPC Flow Logs for production VPCs; application logs without secrets or tokens.

## Cost guardrails

- AWS Budgets with alerts per account (and per environment tag); Cost Anomaly Detection on.
- Lifecycle policies for S3 and log retention periods for CloudWatch Logs (never "never expire" by default).
- Right-size and stop non-production resources on a schedule; NAT gateway and data transfer costs reviewed in design.

## Known vulnerabilities

- Track SDK and CDK advisories through the package ecosystem (`npm audit`, `pip-audit`, Maven); AWS service-side issues appear in AWS security bulletins.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA and AWS security bulletins before relying on it.

## Testing

- CDK: `cdk synth` plus assertion tests (`aws-cdk-lib/assertions`); `cdk-nag` for security rules.
- Scan templates and plans with Checkov or Trivy; validate IAM policies with `aws accessanalyzer validate-policy`.
- Use LocalStack or a sandbox account for integration tests; never test against production.

## Before you finish

```sh
checkov -d . --framework terraform,cloudformation   # or: trivy config .
npx cdk synth                                       # CDK apps; cdk-nag runs as an Aspect during synth
aws accessanalyzer validate-policy --policy-document file://policy.json --policy-type IDENTITY_POLICY
cfn-lint template.yaml                               # CloudFormation / SAM
```
