---
id: backend/go-http
title: Go HTTP services
description: Go 1.26/1.27 HTTP services with net/http (Go 1.22+ method and wildcard routing) or chi, gin or echo - http.Server timeouts, request body limits, context deadlines, middleware order, JSON decoding with unknown-field checks (or encoding/json/v2 on 1.27), validation, error contracts, html/template, database/sql placeholders, auth and CSRF, graceful shutdown and govulncheck. Use when editing Go HTTP handlers, routers or server setup.
applies_to: "go >=1.26 <1.28"
globs: ["**/*.go"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://pkg.go.dev/net/http
  - https://go.dev/blog/routing-enhancements
  - https://go.dev/doc/go1.27
  - https://pkg.go.dev/net/http#CrossOriginProtection
  - https://go.dev/doc/go1.25
  - https://pkg.go.dev/html/template
  - https://pkg.go.dev/database/sql
  - https://go.dev/doc/security/vuln/
  - https://github.com/go-chi/chi
  - https://owasp.org/www-project-go-secure-coding-practices-guide/
---

# Go HTTP services

Also apply `languages/go` (errors, context, goroutines, `unsafe`). Generic web security is in `core/security-baseline`.

## Version check

- Read `go.mod` (`go` and `toolchain` lines) and the router (`net/http` only, `github.com/go-chi/chi/v5`, `github.com/gin-gonic/gin`, `github.com/labstack/echo/v4`), and state them:

  ```text
  Applying backend/go-http (go 1.27, net/http ServeMux with method patterns, pgx, slog).
  ```

- Supported Go: 1.27 and 1.26 (see `languages/go`). `net/http` method and wildcard patterns (`"GET /orders/{id}"`, `r.PathValue("id")`) need Go 1.22+; `http.CrossOriginProtection` needs Go 1.25+; `encoding/json/v2` needs 1.27.
- Follow the project's router; for new services, the standard `ServeMux` is enough unless you need route groups and middleware chains (chi).

## Conventions

- Layout: `cmd/<service>/main.go` (wiring), `internal/http` (handlers, middleware, routes), `internal/<domain>` (services), `internal/store` (database). Handlers parse and validate, call a service, write the response.
- Handlers as methods on a struct holding dependencies (`type OrderHandler struct{ svc OrderService; log *slog.Logger }`); no globals.
- **Server timeouts** (never the zero-value `http.ListenAndServe` in production):

  ```go
  srv := &http.Server{
      Addr:              ":8080",
      Handler:           mux,
      ReadHeaderTimeout: 5 * time.Second,
      ReadTimeout:       15 * time.Second,
      WriteTimeout:      30 * time.Second,
      IdleTimeout:       60 * time.Second,
      MaxHeaderBytes:    1 << 20,
  }
  ```

- **Bodies:** `r.Body = http.MaxBytesReader(w, r.Body, 1<<20)` before decoding; JSON with `dec := json.NewDecoder(r.Body); dec.DisallowUnknownFields()` (or `encoding/json/v2` with `jsontext` options on 1.27); reject trailing data; validate fields (`go-playground/validator` or explicit checks) and return 400 with field errors.
- **Context:** use `r.Context()` for every downstream call and add per-call deadlines (`context.WithTimeout`); stop work when the client disconnects.
- **Errors:** one error type mapping to status codes and a JSON error body (RFC 9457 problem details or a consistent `{ "error": { "code", "message" } }`); log internal details with `slog` and a request ID; never return `err.Error()` from database or internal calls to clients.
- **Middleware order:** recover → request ID → logging → security headers → CORS → rate limit → auth → handler.
- Graceful shutdown: on SIGTERM call `srv.Shutdown(ctx)` with a deadline, then close the database pool.
- Config from environment, validated at startup; `slog` structured logging.

## Security

- **AuthN/Z:** validate tokens in middleware (signature, `exp`, `iss`, `aud`, explicit algorithms with a maintained JWT library); authorize per resource in the service (`WHERE id = $1 AND owner_id = $2`).
- **CSRF:** for cookie-authenticated browser endpoints, use `http.NewCrossOriginProtection()` (Go 1.25+, Fetch Metadata/Origin based) or a token middleware; set cookies `HttpOnly`, `Secure`, `SameSite=Lax`.
- **HTML:** `html/template` only; never `text/template` for HTML; never wrap user input in `template.HTML`.
- **SQL:** `database/sql`/pgx with placeholders; never `fmt.Sprintf` queries; sort columns from allowlists.
- **Redirects and outbound calls:** validate redirect targets (relative or allowlisted hosts); outbound HTTP clients with `Timeout`, and SSRF checks (allowlist hosts, block private ranges, re-check on redirect via `CheckRedirect`).
- **Files:** `http.FileServerFS(os.DirFS(dir))` or `os.Root` for user-influenced paths; never `http.ServeFile` with joined user input.
- **Headers:** `X-Content-Type-Options: nosniff`, CSP for HTML responses, HSTS behind TLS; don't reflect the `Origin` header with credentials in CORS.
- **Rate limiting:** per IP and per user (`golang.org/x/time/rate` or a gateway); trust `X-Forwarded-For` only from known proxies.
- **pprof:** never mount `net/http/pprof` on the public listener; use a separate, internal-only server.

## Known vulnerabilities

- `net/http` and `crypto/tls` fixes ship in Go minor releases; stay on the latest 1.27.x or 1.26.x. Framework advisories (gin, echo, fiber) appear in the Go vulnerability database.
- `govulncheck` reports only reachable vulnerabilities; run it in CI.

This list goes stale; verify with the `cve-check` skill, `govulncheck` or OSV (Go ecosystem) before relying on it.

## Testing

- `httptest.NewRecorder`/`httptest.NewServer` handler tests: 401 without auth, 403/404 for another user's resource, 400 for unknown fields and oversized bodies, correct status and JSON for success.
- `go test -race`; fuzz JSON decoding and path parameters.

## Before you finish

```sh
go vet ./... && staticcheck ./...        # or: golangci-lint run
go test -race ./...
govulncheck ./...
grep -rnE "http\.ListenAndServe\(|text/template|net/http/pprof" --include='*.go' . | grep -v _test.go
```
