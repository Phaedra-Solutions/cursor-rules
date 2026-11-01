---
id: languages/go
title: Go
description: Go 1.26 and 1.27 language rules - the two supported releases, generic methods and encoding/json/v2 in 1.27, error wrapping with %w and errors.Is/As, context propagation and cancellation, goroutine and channel hygiene, html/template, database/sql placeholders, exec.Command without a shell, path safety with os.Root, crypto, unsafe and cgo cautions, and govulncheck, go vet and staticcheck. Use when editing .go files or go.mod.
applies_to: "go >=1.26 <1.28"
globs: ["**/*.go", "go.mod"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://go.dev/doc/devel/release
  - https://go.dev/doc/go1.27
  - https://endoflife.date/go
  - https://go.dev/doc/security/vuln/
  - https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck
  - https://pkg.go.dev/html/template
  - https://pkg.go.dev/os/exec
  - https://pkg.go.dev/os#Root
  - https://go.dev/blog/error-handling-and-go
  - https://pkg.go.dev/context
---

# Go

Language-level rules only; HTTP services also apply `backend/go-http` when it exists. Memory-safety rules for `unsafe` and cgo are below; generic rules are in `core/security-baseline`.

## Version check

- Read the `go` and `toolchain` lines in `go.mod`, CI and Dockerfiles, and state it:

  ```text
  Applying languages/go (go 1.27 in go.mod, toolchain go1.27.3, golangci-lint in CI).
  ```

- **Supported (Oct 2026):** **1.27** (latest 1.27.3) and **1.26** (1.26.10); each Go release is supported until the release two versions later. **1.25 and older are EOL** → follow `core/legacy-mode` and upgrade (raising the `go` line can change semantics through GODEBUG defaults; read the release notes).
- Version-gated features: generic methods (methods with their own type parameters) and `encoding/json/v2` / `encoding/json/jsontext` arrive in **1.27**; `crypto/mldsa` (ML-DSA) is new in 1.27; `os.Root` for directory-scoped file access since 1.24; range-over-func iterators since 1.23. Don't use them below those versions.

## Conventions

- `gofmt`/`goimports` formatting; small packages with clear names; no `utils` grab-bags; unexported by default.
- **Errors:** return errors, don't panic, in library code. Wrap with context using `fmt.Errorf("load user %s: %w", id, err)`; check with `errors.Is`/`errors.As`; define sentinel errors or typed errors for callers that branch on them. Handle every error (no `_ =` on fallible calls without a comment in the PR).
- **Context:** `ctx context.Context` is the first parameter of any function that does I/O or may block; pass it down; never store it in structs; respect `ctx.Done()`; set deadlines at the edge (`context.WithTimeout`).
- **Goroutines:** every goroutine has an owner and a way to stop (context or close of a channel); use `errgroup` for fan-out with error propagation; avoid unbounded goroutine creation per request; close channels from the sender side only.
- Shared state: `sync.Mutex` or channels, not both for the same data; run tests with `-race`.
- Generics where they remove duplication; interfaces small and defined by the consumer.
- JSON: on 1.27, `encoding/json/v2` for new code if the team agrees (stricter defaults, faster); otherwise `encoding/json` with `DisallowUnknownFields` for strict inputs.

## Security

- **HTML:** `html/template` (contextual escaping), never `text/template` for HTML; don't convert user input to `template.HTML`, `template.JS` or `template.URL`.
- **SQL:** `database/sql` with placeholders (`$1`, `?`) or the query builder's bindings; never `fmt.Sprintf` into SQL. Close `rows` and check `rows.Err()`.
- **Processes:** `exec.CommandContext(ctx, "git", "log", "--", path)` with separate arguments; never `exec.Command("sh", "-c", userString)`.
- **Files:** for user-influenced paths, use `os.OpenRoot(base)` and `root.Open(name)` (1.24+), which blocks traversal and symlink escapes; otherwise `filepath.Clean` plus a containment check. Check archive entry names (zip slip).
- **Crypto and randomness:** `crypto/rand` for tokens (never `math/rand`); `crypto/cipher` AES-GCM via `cipher.NewGCM`; `golang.org/x/crypto/argon2` or `bcrypt` for passwords; `subtle.ConstantTimeCompare` for secrets; TLS 1.2+ and never `InsecureSkipVerify: true`.
- **HTTP clients and servers:** set timeouts (`http.Client{Timeout: …}`; server `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`); limit request bodies with `http.MaxBytesReader`.
- **`unsafe` and cgo:** avoid `unsafe` outside reviewed, tested hot paths; follow the `unsafe.Pointer` conversion rules exactly. cgo code is C: bounds-check every buffer (CWE-787/125), free memory once (CWE-416), never pass Go pointers that C retains, and fuzz the boundary.
- **Supply chain:** commit `go.sum`; `GOFLAGS=-mod=readonly` in CI; keep `GOPROXY`/`GONOSUMDB` defaults unless you run a private proxy; review new modules with `dependency-vet`.

## Known vulnerabilities

- Standard-library fixes ship in minor releases of the two supported lines (for example 1.27.3 and 1.26.10); stay on the latest patch.
- `govulncheck` reports only vulnerabilities in code paths your module actually calls.

This list goes stale; verify with the `cve-check` skill, `govulncheck` or the Go vulnerability database before relying on it.

## Testing

- Table-driven tests with `t.Run`; `t.Parallel()` where safe; fuzz tests (`go test -fuzz`) for parsers and decoders; `httptest` for handlers.
- `go test -race` in CI.

## Before you finish

```sh
go version
gofmt -l . && go vet ./...
staticcheck ./...                        # or: golangci-lint run
go test -race ./...
govulncheck ./...                        # golang.org/x/vuln/cmd/govulncheck (v1.9.0)
go mod tidy -diff                        # go.mod and go.sum are tidy
```
