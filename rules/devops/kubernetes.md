---
id: devops/kubernetes
title: Kubernetes manifests and Helm charts
description: Kubernetes 1.35-1.37 manifests, Kustomize and Helm - supported versions, the restricted Pod Security Standard enforced with namespace labels, securityContext (non-root, read-only root filesystem, dropped capabilities, seccomp RuntimeDefault), resource requests and limits, probes, default-deny NetworkPolicies, Gateway API instead of the retired ingress-nginx, secrets through an external secret store, least-privilege RBAC and service accounts, signed and digest-pinned images, and Checkov, Trivy or kube-linter in CI. Use when editing manifests, Helm charts, Kustomize overlays or Helmfiles.
applies_to: "any"
legacy_rule: legacy/ingress-nginx
globs: ["k8s/**", "charts/**", "**/*.k8s.y*ml", "kustomization.y*ml", "**/kustomization.y*ml", "helmfile*"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://kubernetes.io/releases/
  - https://endoflife.date/kubernetes
  - https://kubernetes.io/docs/concepts/security/pod-security-standards/
  - https://kubernetes.io/docs/concepts/security/pod-security-admission/
  - https://kubernetes.io/docs/concepts/services-networking/network-policies/
  - https://kubernetes.io/docs/concepts/security/rbac-good-practices/
  - https://kubernetes.io/docs/concepts/configuration/secret/
  - https://gateway-api.sigs.k8s.io/
  - https://github.com/kubernetes-sigs/ingress2gateway
  - https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/
  - https://external-secrets.io/
  - https://docs.sigstore.dev/policy-controller/overview/
  - https://www.checkov.io/
---

# Kubernetes manifests and Helm charts

Container image rules are in `devops/docker`; CI rules in `devops/github-actions`; cloud-specific IAM in the `devops/cloud-*` rules.

## Version check

- Read the cluster version (`kubectl version`, the managed service's version, or the target in CI), Helm and Kustomize versions, and the ingress or Gateway controller in use. State them:

  ```text
  Applying devops/kubernetes (EKS 1.36, Helm 3, Kustomize overlays, Envoy Gateway with Gateway API v1.7).
  ```

- **Supported upstream (Oct 2026):** 1.37, 1.36, 1.35; **1.34 reached EOL on 27 Oct 2026** (managed services may extend support at extra cost). Use API versions served by the cluster (`kubectl api-resources`); remove deprecated APIs before upgrades.
- **ingress-nginx** (the community controller) was **retired in March 2026** and receives no more fixes → `legacy/ingress-nginx` where it exists; migrate to Gateway API (`ingress2gateway` converts Ingress resources).

## Conventions

- One app per directory with base manifests plus overlays (Kustomize) or a chart with environment values; no environment-specific values hard-coded in templates.
- Labels: `app.kubernetes.io/name`, `instance`, `version`, `part-of`, `managed-by` on every resource.
- **Resources:** CPU and memory `requests` on every container, memory `limits`; set CPU limits only where the team's policy wants them. `LimitRange` and `ResourceQuota` per namespace.
- **Probes:** readiness and liveness (and startup for slow starters) with sensible timeouts; liveness must not depend on downstream services.
- `PodDisruptionBudget` and at least two replicas for production services; `topologySpreadConstraints` across zones.
- Images pinned by digest (`image: ghcr.io/acme/api@sha256:…`), `imagePullPolicy: IfNotPresent`; no `latest` tags.
- Config in ConfigMaps; secrets through an external store (below); rollouts via the deployment tool (Argo CD, Flux, Helm) from Git, not `kubectl apply` by hand.
- Routing with Gateway API (`Gateway`, `HTTPRoute`, `GRPCRoute`) and a maintained controller (Envoy Gateway, Istio, Cilium, NGINX Gateway Fabric, cloud controllers).

## Security

- **Pod Security:** label namespaces `pod-security.kubernetes.io/enforce: restricted` (and `warn`/`audit`); exceptions only in dedicated namespaces with a written reason. Pods comply with:

  ```yaml
  securityContext:
    runAsNonRoot: true
    seccompProfile: { type: RuntimeDefault }
  containers:
    - name: api
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities: { drop: ["ALL"] }
  ```

  No `privileged`, `hostNetwork`, `hostPID`, `hostIPC` or `hostPath` mounts for application workloads.
- **NetworkPolicies:** a default-deny ingress and egress policy per namespace, then explicit allows (including DNS); verify the CNI enforces them.
- **RBAC:** a dedicated ServiceAccount per workload, `automountServiceAccountToken: false` unless the pod calls the API; Roles scoped to a namespace with specific verbs and resources; no `cluster-admin` bindings for apps or CI; no wildcards (`*`) in rules.
- **Secrets:** Kubernetes Secrets are base64, not encryption. Use External Secrets Operator or the CSI Secrets Store with the cloud secret manager, enable encryption at rest for etcd, and never commit Secret manifests with real values (SOPS or Sealed Secrets if secrets must live in Git).
- **Workload identity:** IRSA/EKS Pod Identity, GKE Workload Identity or Azure Workload Identity instead of static cloud keys in Secrets.
- **Supply chain:** sign images (Cosign) and enforce signatures and allowed registries with an admission policy (Sigstore policy-controller, Kyverno or Gatekeeper).
- **Exposure:** Services `ClusterIP` by default; `LoadBalancer` and public `Gateway` listeners only for intended entry points, with TLS; no NodePorts on the internet.
- **Admission and audit:** keep audit logging on in managed clusters; restrict `exec` and `port-forward` via RBAC in production.

## Known vulnerabilities

- **ingress-nginx:** retired; its 2025–2026 CVEs (including the IngressNightmare chain, CVE-2025-1974) won't get further fixes on new findings. See `legacy/ingress-nginx`.
- Keep node runtimes patched (runc and containerd advisories in `devops/docker`) and the control plane on a supported minor.

This list goes stale; verify with the `cve-check` skill, the Kubernetes security announcements or the provider's bulletins before relying on it.

## Testing

- Render and validate before applying: `helm template` / `kustomize build` piped to `kubeconform` against the cluster's version.
- Policy tests (Kyverno CLI or Conftest) for the Pod Security and image rules; dry-run against a staging cluster (`kubectl apply --dry-run=server`).

## Before you finish

```sh
helm lint charts/<chart> && helm template charts/<chart> -f values-prod.yaml > /tmp/rendered.yaml   # or: kustomize build overlays/prod > /tmp/rendered.yaml
kubeconform -strict -summary -kubernetes-version 1.36.0 /tmp/rendered.yaml
checkov -f /tmp/rendered.yaml --framework kubernetes   # or: trivy config /tmp/rendered.yaml / kube-linter lint /tmp/rendered.yaml
kubectl apply --dry-run=server -f /tmp/rendered.yaml   # against staging
```
