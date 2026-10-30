---
id: legacy/ingress-nginx
title: ingress-nginx (retired)
description: Clusters still running the community ingress-nginx controller after its retirement in March 2026 (repository archived, last controller release v1.15.1, no further fixes) - how to recognize it, the IngressNightmare and 2026 CVE history, hardening while it runs (admission webhook not exposed, snippet annotations disabled, least-privilege RBAC, network policies), and the migration path to Gateway API with ingress2gateway (v1.2.0) and a parallel run. Use when manifests, Helm values or charts reference ingress-nginx, ingressClassName nginx or nginx.ingress.kubernetes.io annotations.
applies_to: "any"
globs: ["k8s/**", "charts/**", "**/*.k8s.y*ml", "**/values*.y*ml", "kustomization.y*ml", "helmfile*", "**/ingress*.y*ml"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/
  - https://opensource.googleblog.com/2026/02/the-end-of-an-era-transitioning-away-from-ingress-nginx.html
  - https://github.com/kubernetes/ingress-nginx/releases
  - https://github.com/kubernetes-sigs/ingress2gateway
  - https://github.com/kubernetes-sigs/ingress2gateway/blob/main/pkg/i2gw/providers/ingressnginx/README.md
  - https://gateway-api.sigs.k8s.io/
  - https://osv.dev/list?ecosystem=Go&q=k8s.io/ingress-nginx
---

# ingress-nginx (retired)

Also apply `core/legacy-mode` and `devops/kubernetes`. This is the community controller (`kubernetes/ingress-nginx`, `registry.k8s.io/ingress-nginx/controller`), not F5's NGINX Ingress Controller or NGINX Gateway Fabric. Don't migrate as part of an unrelated task.

## Version check

- Find it: Helm releases of the `ingress-nginx` chart, `ingressClassName: nginx` (or a custom class) with controller `k8s.io/ingress-nginx`, `nginx.ingress.kubernetes.io/*` annotations, and the controller image tag. State it:

  ```text
  Applying legacy/ingress-nginx (controller v1.14.3 via Helm chart 4.14.x, 42 Ingresses, snippet annotations disabled).
  ```

- **Status:** retired in **March 2026**; the repository is archived. The last releases (19 Mar 2026) were controller **v1.15.1** and charts 4.15.1 / 4.14.5 / 4.13.9. There will be no security fixes after that.
- Report the retirement in every change summary and offer `migrate-ingress-nginx`.

## Conventions

- Don't create new Ingress resources for ingress-nginx; new routes go to the Gateway API controller once it exists. If that's not ready, add the Ingress and note it in the migration inventory.
- Keep annotations to the set ingress2gateway can translate (rewrites, redirects, timeouts, body size, canary, backend protocol, CORS where supported); avoid snippets and Lua-dependent annotations that block migration.

## Security

- **Upgrade to the last release** (controller v1.15.1) if you're older; it includes the 2025–2026 fixes.
- **Admission webhook:** never reachable from outside the cluster or from untrusted pods; IngressNightmare (CVE-2025-1974, CVSS 9.8) gave unauthenticated RCE through it. Restrict it with a NetworkPolicy to the API server.
- **Snippets:** keep `allow-snippet-annotations: "false"` and `annotations-risk-level` at its default (`High`) so Critical-risk annotations are rejected; remove `configuration-snippet`, `server-snippet` and `auth-snippet` annotations. Snippets let anyone who can create an Ingress inject NGINX config.
- **Who can create Ingresses:** limit `create`/`update` on Ingress to platform and deploy roles; tenants with Ingress rights can attack the shared controller.
- **Controller RBAC and secrets:** the controller can read Secrets cluster-wide by default; scope it with `--watch-namespace` or the chart's scope settings where possible.
- **Network:** a NetworkPolicy for the controller namespace; expose only 80/443 through the load balancer; metrics and health ports internal.
- **Monitor** the Kubernetes security announcements; any new ingress-nginx CVE stays unfixed, so plan the migration rather than waiting.

## Known vulnerabilities

- CVE-2025-1974 (IngressNightmare, unauthenticated RCE via the admission webhook) with CVE-2025-1097, CVE-2025-1098, CVE-2025-24513, CVE-2025-24514 (annotation and config injection); CVE-2026-1580, CVE-2026-24512, CVE-2026-24513, CVE-2026-24514 (2026). Fixed in the 1.14.3 / 1.15.x releases; anything found after March 2026 won't be fixed.
- CVE-2023-5044 (code injection via the `permanent-redirect` annotation) on old versions.

This list goes stale; verify with the `cve-check` skill, the Kubernetes security announcements or OSV (Go, `k8s.io/ingress-nginx`) before relying on it.

## Migration path

1. Choose a maintained Gateway API implementation (Envoy Gateway, Istio, Cilium, NGINX Gateway Fabric, Traefik, Kong or the cloud provider's controller) and install it next to ingress-nginx with its own load balancer.
2. Inventory Ingresses and annotations; convert them with `ingress2gateway print --providers=ingress-nginx` (v1.2.0) and review the warnings for untranslated annotations (snippets, cookie canaries, capture-group rewrites, custom headers).
3. Run both in parallel: test the new Gateway's address, then move DNS or the load balancer per host, keeping ingress-nginx as the fallback.
4. Remove ingress-nginx once traffic has fully moved. Use the `migrate-ingress-nginx` skill.

## Testing

- For each host and path: compare status codes, redirects, headers (HSTS, CORS), TLS certificates and body-size limits between the old and new entry points (`curl --resolve`).
- Confirm the admission webhook isn't reachable from a test pod in an application namespace.

## Before you finish

```sh
kubectl get ingress -A -o wide
kubectl get pods -A -l app.kubernetes.io/name=ingress-nginx -o jsonpath='{..image}'
kubectl get ingress -A -o yaml | grep -E "nginx.ingress.kubernetes.io/(configuration|server|auth)-snippet"   # expect none
helm list -A | grep ingress-nginx
```
