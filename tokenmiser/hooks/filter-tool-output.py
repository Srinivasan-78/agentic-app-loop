#!/usr/bin/env python3
# @authormark v1 -- do not remove (authorship watermark)⁠​‌​​​‌‌​​‌​‌​​​​​‌​​‌​​‌​‌​‌‌​​​​‌‌​‌​‌‌​​‌‌​​‌‌​‌​​​‌​​​​‌‌​‌‌​​‌‌​​​​‌​‌‌‌‌​‌​​‌​​​​​‌​‌‌‌‌​‌​​‌​‌​‌​‌​‌‌‌‌​‌​​‌‌​‌‌‌‌​‌​​​‌​​​‌​​​‌​‌​‌​‌‌​​​​‌‌​‌‌‌​​‌​​​‌​‌​​‌‌‌​​​​‌‌​‌‌​​⁠
# Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
# Author: https://github.com/Srinivasan-78
# SPDX-License-Identifier: MIT
# Fingerprint: AMK1.FPIXk3D6azAzUzoDEXnE8l
"""PreToolUse(Bash) hook: rewrite noisy commands so only decisive lines enter context.

A hook runs outside the model, so anything it filters is never paid for. A 10,000-line
test log becomes ~100 lines of failures; the exit status is preserved and reported, so a
filtered command can never look like it passed when it did not.

Install:   see skills/miser-hooks/SKILL.md, or `npx tokenmiser install --hook`
Selftest:  python3 filter-tool-output.py --selftest
Disable:   export TOKENMISER_FILTER_OFF=1
Extend:    ~/.claude/tokenmiser-filter.json  ->  {"rules": [["^my-runner\\b", "{cmd} 2>&1 | tail -40"]]}

Design rules:
  * Never change WHICH command runs, only how much of its output survives.
  * Never touch a command that already limits its own output, or that uses shell
    operators (&&, ||, ;, pipes, redirects, substitution) — appending a pipe there
    would change semantics.
  * Always emit valid JSON on stdout, whatever happens.
"""

from __future__ import annotations

import json
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stdin, "reconfigure"):
    sys.stdin.reconfigure(encoding="utf-8")

CONFIG_PATH = os.path.join(
    os.environ.get("CLAUDE_CONFIG_DIR", os.path.expanduser("~/.claude")),
    "tokenmiser-filter.json",
)

# Any of these means the user (or the agent) already shaped the output, or the
# command is a compound one where appending a pipe would change what runs.
SHELL_OPS = ("|", "&&", "||", ";", ">", "<", "$(", "`", "\n")

# Commands that must never be rewritten even though they match a rule prefix.
SKIP_IF = {
    "git log": ("--oneline", "--format", "--pretty", "--stat", "-p", "--patch", "-S", "-G", "-n"),
    "git diff": ("--stat", "--name-only", "--name-status", "--quiet", "--exit-code", "--numstat"),
}

# Keep the first failing lines and the exit status. `PIPESTATUS[0]` recovers the
# real status of the wrapped command, which the pipe would otherwise mask.
STATUS = '; s=${{PIPESTATUS[0]}}; echo "[tokenmiser] exit=$s, output filtered"; exit $s'

RULES: list[tuple[str, str]] = [
    # test runners: failures plus 5 lines of context
    (r"^(npm (run )?test|npx jest|jest|yarn test|pnpm test|pytest|py\.test|go test|cargo test|mvn test|gradle test|rspec|vitest)\b",
     "{cmd} 2>&1 | grep -E -A5 '(FAIL|FAILED|ERROR|error:|panic:|AssertionError|Traceback|✗|✘| failed)' | head -120" + STATUS),
    # builds and type checks: errors only
    (r"^(npm run build|npx tsc|tsc|yarn build|pnpm build|cargo build|cargo check|go build|make|mvn -q? ?package|gradle build)\b",
     "{cmd} 2>&1 | grep -E -A3 '(error|Error|ERROR|warning TS|failed|undefined reference)' | head -80" + STATUS),
    # installers: only the tail matters
    (r"^(npm (install|ci|i)|pnpm (install|i)|yarn( install)?$|yarn install|pip install|pip3 install|uv (pip )?install|bundle install|go mod download)\b",
     "{cmd} 2>&1 | tail -15" + STATUS),
    # linters: findings only
    (r"^(npx eslint|eslint|ruff check|flake8|golangci-lint run|clippy|cargo clippy)\b",
     "{cmd} 2>&1 | grep -E -v '^\\s*$' | head -80" + STATUS),
    # log sources: error lines only
    (r"^(docker logs|kubectl logs|journalctl|heroku logs)\b",
     "{cmd} 2>&1 | grep -E -i '(error|fatal|panic|exception|traceback)' | tail -60"),
    (r"^git log\b", "{cmd} --oneline | head -30"),
    (r"^git diff\b", "{cmd} | head -400"),
    (r"^git show\b", "{cmd} | head -300"),
    (r"^(cat|less|more) \S+\.(log|jsonl|ndjson|csv)\b", "tail -100 {args}"),
    # unbounded directory walks
    (r"^find [^-]*(-name|-type)\b", "{cmd} | head -100"),
]


def load_user_rules() -> list[tuple[str, str]]:
    """Repo- or machine-specific rules, appended after the built-ins."""
    try:
        with open(CONFIG_PATH, encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        return []
    out = []
    for entry in data.get("rules") or []:
        if isinstance(entry, (list, tuple)) and len(entry) == 2:
            out.append((str(entry[0]), str(entry[1])))
    return out


def should_skip(cmd: str) -> bool:
    if os.environ.get("TOKENMISER_FILTER_OFF"):
        return True
    if not cmd or any(op in cmd for op in SHELL_OPS):
        return True
    for prefix, flags in SKIP_IF.items():
        if cmd.startswith(prefix) and any(f in cmd for f in flags):
            return True
    # `git log -1`, `git log -5` etc. are already bounded
    if re.match(r"^git log\s+-\d", cmd):
        return True
    return False


def rewrite(cmd: str) -> str | None:
    """Return the rewritten command, or None to leave it untouched."""
    cmd = cmd.strip()
    if should_skip(cmd):
        return None
    parts = cmd.split(maxsplit=1)
    args = parts[1] if len(parts) > 1 else ""
    for pattern, template in RULES + load_user_rules():
        if re.search(pattern, cmd):
            try:
                new = template.format(cmd=cmd, args=args)
            except (KeyError, IndexError, ValueError):
                continue
            return new if new != cmd else None
    return None


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except (ValueError, OSError):
        print("{}")
        return
    cmd = ((payload.get("tool_input") or {}).get("command")) or ""
    new = rewrite(cmd)
    if new is None:
        print("{}")
        return
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow",
            "updatedInput": {"command": new},
        }
    }))


# --------------------------------------------------------------------- selftest

CASES = [
    ("npm test", True),
    ("pytest -q", True),
    ("npm test | tail -5", False),            # already bounded
    ("npm test && npm run build", False),     # compound: leave alone
    ("npm test > out.txt", False),            # redirect: leave alone
    ("git log", True),
    ("git log --oneline", False),             # already bounded
    ("git log -1 --format=%H", False),        # bounded and formatted
    ("git diff", True),
    ("git diff --stat", False),
    ("cat server.log", True),
    ("cat README.md", False),
    ("ls -la", False),
    ("echo hi", False),
]


def selftest() -> int:
    failures = 0
    for cmd, expect_rewrite in CASES:
        got = rewrite(cmd)
        ok = (got is not None) == expect_rewrite
        if not ok:
            failures += 1
        print(f"{'ok  ' if ok else 'FAIL'} {cmd!r} -> {got!r}")
    print(f"\n{len(CASES) - failures}/{len(CASES)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    main()
