---
id: devops/vercel-netlify-cloudflare
title: Vercel, Netlify and Cloudflare Workers deployments
description: Frontend and edge platform configuration on Vercel, Netlify and Cloudflare Workers/Pages - which environment variables reach the client bundle (NEXT_PUBLIC_, VITE_, PUBLIC_ and similar prefixes) and which stay server-side, secrets in the platform store (Vercel Sensitive Environment Variables, Netlify secret values and secret scanning, wrangler secret put and .dev.vars), preview-deployment protection (Vercel Deployment Protection, Netlify access controls, Cloudflare Access), edge runtime limits, security headers in vercel.json, netlify.toml or _headers, and per-environment scoping. Use when editing vercel.json, netlify.toml, wrangler.toml or wrangler.json(c).
applies_to: "any"
globs: ["vercel.json", "**/vercel.json", "netlify.toml", "**/netlify.toml", "wrangler.toml", "**/wrangler.toml", "wrangler.json*", "**/wrangler.json*", "_headers", "**/_headers"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://vercel.com/docs/environment-variables
  - https://vercel.com/docs/environment-variables/sensitive-environment-variables
  - https://vercel.com/docs/deployment-protection
  - https://vercel.com/docs/functions/runtimes/edge
  - https://vercel.com/docs/project-configuration
  - https://docs.netlify.com/environment-variables/overview/
  - https://docs.netlify.com/security/secret-scanning/
  - https://docs.netlify.com/site-deploys/deploy-previews/
  - https://docs.netlify.com/routing/headers/
  - https://developers.cloudflare.com/workers/configuration/secrets/
  - https://developers.cloudflare.com/workers/configuration/environment-variables/
  - https://developers.cloudflare.com/workers/platform/limits/
  - https://developers.cloudflare.com/workers/wrangler/configuration/
  - https://developers.cloudflare.com/cloudflare-one/applications/
---

# Vercel, Netlify and Cloudflare Workers deployments

Framework rules (`frontend/nextjs`, `frontend/nuxt`, `frontend/astro`, `frontend/svelte`) cover app code; this rule covers platform configuration. CI rules are in `devops/github-actions`.

## Version check

- Identify the platform, the config file (`vercel.json`, `netlify.toml`, `wrangler.toml` / `wrangler.jsonc`), the CLI version (`vercel`, `netlify-cli`, `wrangler`), the framework adapter, and which environments exist (production, preview, development, custom). State them:

  ```text
  Applying devops/vercel-netlify-cloudflare (Vercel, Next.js 16, Node.js runtime, Deployment Protection on previews).
  ```

- Keep `wrangler` current within its major and set `compatibility_date` deliberately (update it with testing, not silently). Wrangler supports `wrangler.jsonc`; follow the file the project uses.

## Conventions

- Configuration in the repo file; dashboard-only settings (protection, env vars) documented in the README or IaC (Terraform providers exist for all three).
- Environment variables scoped per environment: production values never available to preview builds unless intended; previews use staging backends.
- Redirects, rewrites and headers in the config file, reviewed like code; no catch-all rewrites to external origins without review.

## Security

- **Which env vars reach the client:** anything with a framework public prefix (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, `NUXT_PUBLIC_`, `EXPO_PUBLIC_`, …) or read in client code is inlined into the bundle at build time and is public. Only put public identifiers there (publishable keys, public URLs); API secrets, service-role keys and tokens stay unprefixed and are used only in server functions.
- **Secrets in the platform store:**
  - **Vercel:** mark secrets as Sensitive Environment Variables (values can't be read back after creation); scope them to the environments that need them; pull with `vercel env pull` only into gitignored files. The combined env var limit is 64 KB per deployment.
  - **Netlify:** mark variables as containing secret values and scope them to build or functions; keep secret scanning on (it fails builds that leak secret values into output). Don't set `SECRETS_SCAN_ENABLED=false`; add reviewed false positives to `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` instead.
  - **Cloudflare:** `vars` in Wrangler config are plaintext and visible in the dashboard: never put secrets there. Use `wrangler secret put <NAME>` (or Secrets Store bindings) and keep local secrets in `.dev.vars` or `.env`, both gitignored.
- **Preview-deployment protection:**
  - Vercel: Deployment Protection with at least Standard Protection (Vercel Authentication) on preview and generated URLs; use Protection Bypass for Automation secrets for E2E tests, stored as CI secrets;
  - Netlify: restrict Deploy Previews and branch deploys to the team where the plan supports it, and don't connect previews to production data;
  - Cloudflare: put preview and `*.workers.dev` URLs behind Cloudflare Access, or disable `workers_dev` and preview URLs for internal services.
  Previews of pull requests from forks must not receive production secrets.
- **Security headers:** set CSP, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` and frame protection (`frame-ancestors` or `X-Frame-Options`) in `vercel.json` `headers`, `netlify.toml` `[[headers]]` / `_headers`, or Workers responses (`_headers` for static assets). Long-lived `Cache-Control` only on hashed assets; never cache authenticated responses publicly.
- **Functions:** authenticate server functions and API routes; validate webhooks with signatures; CORS allowlists instead of `*` for credentialed requests.

## Edge runtime limits

- **Vercel:** Vercel recommends the Node.js runtime over the Edge runtime for new functions. Edge functions must start responding within 25 seconds (streaming up to 300 seconds); code size limits after gzip are 1 MB (Hobby), 2 MB (Pro) and 4 MB (Enterprise); many Node.js APIs and dynamic code evaluation aren't available.
- **Cloudflare Workers:** 128 MB memory per isolate; CPU time per request 10 ms on Free and up to 5 minutes on Paid (default 30 seconds, set `limits.cpu_ms`); 1-second startup limit. Use `nodejs_compat` deliberately and check package compatibility.
- **Netlify:** Edge Functions run on Deno with their own limits; regular Functions run on Node.js. Check the current limits in Netlify's docs before moving heavy work to the edge.
- Don't move database-heavy or long-running work to edge runtimes; keep it in regional functions or background jobs.

## Known vulnerabilities

- Platform CLIs (`vercel`, `netlify-cli`, `wrangler`) are npm packages; check them with `npm audit` and `dependency-vet` like other dev dependencies. Framework advisories (Next.js middleware bypass, Nuxt, Astro, SvelteKit) are in the framework rules.

This list goes stale; verify with the `cve-check` skill or OSV/GHSA before relying on it.

## Testing

- Build locally with the platform CLI (`vercel build`, `netlify build`, `wrangler deploy --dry-run`) to catch config errors.
- Inspect the client bundle for secrets (`grep` the build output for known secret names and key prefixes).
- Check headers on a preview deployment (`curl -sI`) and confirm previews require authentication from a logged-out browser.

## Before you finish

```sh
vercel build                                  # or: netlify build / npx wrangler deploy --dry-run
grep -rEn "(sk_live|service_role|SECRET|PRIVATE_KEY)" .vercel/output .next/static dist .netlify 2>/dev/null   # expect no secrets
curl -sI https://<preview-url> | grep -iE "strict-transport|content-security|x-content-type|referrer-policy"
git check-ignore .env .dev.vars .vercel       # local secret files must be ignored
```
