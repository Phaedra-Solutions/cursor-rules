#!/bin/sh
# Detects ecosystems in a project and prints the audit commands that apply.
# POSIX sh, no dependencies. Read-only: it never runs or installs anything.
# Usage: detect-stack.sh [project-dir]

set -eu

root=${1:-.}
if [ ! -d "$root" ]; then
  echo "error: '$root' is not a directory" >&2
  exit 2
fi
cd "$root"

found=0

files() {
  find . -maxdepth 4 \
    \( -name node_modules -o -name .git -o -name vendor -o -name .venv -o -name venv \
       -o -name dist -o -name build -o -name target -o -name .next -o -name Pods \) -prune \
    -o -type f -name "$1" -print 2>/dev/null
}

has() {
  [ -n "$(files "$1" | head -n 1)" ]
}

where() {
  files "$1" | head -n 3 | tr '\n' ' '
}

tool() {
  if command -v "$1" >/dev/null 2>&1; then
    printf 'installed'
  else
    printf 'NOT INSTALLED (ask before installing)'
  fi
}

report() {
  found=1
  printf '\n== %s\n' "$1"
  printf '   found: %s\n' "$2"
  shift 2
  for line in "$@"; do
    printf '   %s\n' "$line"
  done
}

if has package-lock.json; then
  report "JavaScript (npm)" "$(where package-lock.json)" \
    "npm audit --audit-level=moderate        # npm: $(tool npm)" \
    "npm audit signatures                    # registry signatures and provenance"
fi
if has pnpm-lock.yaml; then
  report "JavaScript (pnpm)" "$(where pnpm-lock.yaml)" \
    "pnpm audit --audit-level moderate       # pnpm: $(tool pnpm)"
fi
if has yarn.lock; then
  if has .yarnrc.yml; then
    report "JavaScript (Yarn 2+)" "$(where yarn.lock)" \
      "yarn npm audit --all --recursive        # yarn: $(tool yarn)"
  else
    report "JavaScript (Yarn 1)" "$(where yarn.lock)" \
      "yarn audit --level moderate             # yarn: $(tool yarn)"
  fi
fi
if has bun.lock || has bun.lockb; then
  report "JavaScript (Bun)" "$(where 'bun.lock*')" \
    "bun audit                               # bun: $(tool bun)"
fi

if has uv.lock; then
  report "Python (uv)" "$(where uv.lock)" \
    "uv audit                                # uv >= 0.10.12: $(tool uv)"
fi
if has 'requirements*.txt' || has pylock.toml || has poetry.lock || has Pipfile.lock; then
  report "Python (pip / Poetry / Pipenv)" "$(where 'requirements*.txt') $(where poetry.lock) $(where Pipfile.lock)" \
    "pip-audit -r requirements.txt           # pip-audit: $(tool pip-audit)" \
    "osv-scanner scan source -r .            # covers poetry.lock and Pipfile.lock"
fi

if has go.mod; then
  report "Go" "$(where go.mod)" \
    "govulncheck ./...                       # govulncheck: $(tool govulncheck)"
fi
if has Cargo.lock; then
  report "Rust" "$(where Cargo.lock)" \
    "cargo audit                             # cargo-audit: $(tool cargo-audit)" \
    "cargo deny check advisories             # cargo-deny: $(tool cargo-deny)"
fi
if has composer.lock; then
  report "PHP (Composer)" "$(where composer.lock)" \
    "composer audit                          # composer: $(tool composer)"
fi
if has Gemfile.lock; then
  report "Ruby (Bundler)" "$(where Gemfile.lock)" \
    "bundle-audit check --update             # bundler-audit: $(tool bundle-audit)"
fi
if has '*.csproj' || has '*.fsproj' || has '*.sln' || has '*.slnx'; then
  report ".NET (NuGet)" "$(where '*.csproj') $(where '*.sln*')" \
    "dotnet package list --vulnerable --include-transitive   # .NET SDK 10+" \
    "dotnet list package --vulnerable --include-transitive   # .NET SDK 9 and earlier; dotnet: $(tool dotnet)"
fi
if has pom.xml || has 'build.gradle*' || has gradle.lockfile; then
  report "Java / Kotlin (Maven / Gradle)" "$(where pom.xml) $(where 'build.gradle*')" \
    "osv-scanner scan source -r .            # osv-scanner: $(tool osv-scanner)"
fi
if has pubspec.lock; then
  report "Dart / Flutter" "$(where pubspec.lock)" \
    "osv-scanner scan source -r .            # osv-scanner: $(tool osv-scanner)"
fi

if has Dockerfile || has 'Containerfile' || has '*.dockerfile'; then
  report "Containers" "$(where Dockerfile) $(where Containerfile)" \
    "trivy fs --scanners vuln,secret,misconfig .   # trivy: $(tool trivy)" \
    "trivy image <built-image>               # after building the image"
fi
if has '*.tf' || has 'Chart.yaml' || has 'kustomization.yaml'; then
  report "Infrastructure as code" "$(where '*.tf') $(where Chart.yaml)" \
    "trivy config .                          # trivy: $(tool trivy)"
fi
if [ -d .github/workflows ]; then
  report "GitHub Actions" ".github/workflows/" \
    "zizmor .github/workflows                # zizmor: $(tool zizmor)"
fi

printf '\n== Any project\n'
printf '   osv-scanner scan source -r .            # osv-scanner: %s\n' "$(tool osv-scanner)"
printf '   gitleaks dir . --redact --no-banner     # gitleaks: %s\n' "$(tool gitleaks)"
printf '   semgrep scan --config p/default --metrics off   # semgrep: %s (downloads rules)\n' "$(tool semgrep)"

if [ "$found" -eq 0 ]; then
  printf '\nNo known manifests or lockfiles found under %s (depth 4).\n' "$root"
fi
