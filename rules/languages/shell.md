---
id: languages/shell
title: Shell scripts (POSIX sh and Bash)
description: Shell scripting rules for POSIX sh and Bash - choosing sh or bash deliberately, set -euo pipefail (and its limits), quoting every expansion, arrays for argument lists, no eval on input, safe temp files with mktemp and traps, never piping curl into a shell, checksum-verified downloads, safe find/xargs, input validation, secrets out of argv and logs, and ShellCheck. Use when editing .sh or .bash files, shell blocks in CI, or scripts without an extension that start with a shell shebang.
applies_to: "any"
globs: ["**/*.sh", "**/*.bash"]
alwaysApply: false
tier: P2
owner: "@Phaedra-Solutions/maintainers"
last_reviewed: 2026-10-30
sources:
  - https://www.shellcheck.net/
  - https://github.com/koalaman/shellcheck
  - https://mywiki.wooledge.org/BashPitfalls
  - https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html
  - https://google.github.io/styleguide/shellguide.html
  - https://www.cisa.gov/resources-tools/resources/product-security-bad-practices
---

# Shell scripts (POSIX sh and Bash)

Generic rules are in `core/security-baseline`; CI shell steps also follow `devops/github-actions`; Dockerfile `RUN` lines follow `devops/docker`.

## Version check

- Read the shebang and how the script is invoked (`sh script.sh` runs it with `/bin/sh` regardless of the shebang). Note the target shells: `/bin/sh` is dash on Debian/Ubuntu, ash on Alpine and BusyBox, and Bash 3.2 on macOS's `/bin/bash`. State it:

  ```text
  Applying languages/shell (#!/usr/bin/env bash, Bash 5 in CI, also run on macOS Bash 3.2).
  ```

- ShellCheck current release: 0.11.0. For very old environments (Bash 3.2), avoid Bash 4+ features (associative arrays, `${var,,}`, `mapfile`) or require a newer Bash explicitly.

## Conventions

- **Pick the shell on purpose.** Use `#!/bin/sh` and POSIX features only for scripts that must run anywhere (containers, installers); use `#!/usr/bin/env bash` when you need arrays, `[[ ]]`, `pipefail` or `local`. Don't use Bash features under a `sh` shebang.
- Start Bash scripts with:

  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  IFS=$'\n\t'
  ```

  POSIX sh: `set -eu` (`pipefail` is in POSIX 2024 but not every `sh` supports it yet). Know the limits of `set -e`: it doesn't trigger inside `if`, `&&`/`||` lists or command substitutions in some contexts; check important commands explicitly.
- **Quote every expansion:** `"$var"`, `"$@"`, `"$(cmd)"`, `"${array[@]}"`. Unquoted variables split and glob.
- Build argument lists with arrays in Bash (`args=(--flag "$value"); cmd "${args[@]}"`), not strings.
- Use `$(...)`, not backticks; `[[ ]]` in Bash, `[ ]` with quoted operands in sh; `printf '%s\n' "$x"` instead of `echo` for arbitrary data.
- Functions with `local` variables (Bash), a `main "$@"` at the bottom, and `readonly` constants.
- Fail with clear messages to stderr (`echo "error: …" >&2; exit 1`) and meaningful exit codes; support `--help`.
- Prefer a real language (Node, Python, Go) once a script grows past ~150 lines, parses structured data, or needs error handling beyond exit codes.

## Security

- **No `eval`** and no `bash -c "$userInput"`; no `source` of files you don't control.
- **Never pipe a download into a shell** (`curl … | sh`, `wget -O- … | bash`). Download to a file, verify a pinned checksum or signature, then run it:

  ```bash
  curl -fsSLo tool.tar.gz "https://example.com/tool-1.2.3.tar.gz"
  echo "<sha256>  tool.tar.gz" | sha256sum -c -
  ```

  Use `curl -fsS` (fail on HTTP errors), `--proto '=https'`, and pinned versions.
- **Temp files:** `tmp=$(mktemp)` / `tmpdir=$(mktemp -d)`, cleaned up with `trap 'rm -rf -- "$tmpdir"' EXIT`; never fixed names in `/tmp`.
- **Destructive commands:** guard against empty variables (`rm -rf -- "${dir:?}/"*`), use `--` before user-provided paths, and never run `rm -rf` on computed paths without checking them.
- **Filenames:** handle spaces and newlines with `find … -print0 | xargs -0` or `find … -exec … {} +`; never parse `ls`.
- **Input validation:** check arguments against expected patterns (`[[ $name =~ ^[a-z0-9-]+$ ]]`) before using them in paths, URLs or commands.
- **Secrets:** pass them through environment variables or files with restrictive permissions (`umask 077`), never as command-line arguments (visible in `ps`) or `set -x` traces; disable tracing around secret handling.
- **Privileges:** don't require `sudo` inside scripts; document required privileges and fail early if missing.

## Known vulnerabilities

- Keep Bash and coreutils patched on build hosts and images (Shellshock, CVE-2014-6271, is the reminder that the shell itself can be the bug).
- Most shell risk is in what scripts do: injection through unquoted variables, unverified downloads and unsafe temp files.

This list goes stale; verify with the `cve-check` skill or your OS vendor's advisories before relying on it.

## Testing

- ShellCheck on every script in CI; bats-core or shellspec for scripts with logic; run them under the target shells (`dash`, `bash`, BusyBox `sh`) when portability matters.
- Test with filenames containing spaces, quotes and leading dashes.

## Before you finish

```sh
shellcheck -x scripts/*.sh               # ShellCheck 0.11.0
bash -n scripts/*.sh                     # syntax check (use `sh -n` for POSIX scripts)
shfmt -d scripts/                        # if the project uses shfmt
grep -rnE "curl[^|]*\|\s*(ba)?sh|eval |mktemp -u" scripts/ 2>/dev/null
```
