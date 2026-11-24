---
description: One-stop setup — orchestrator and subagent tiers, output filter hook, context diet, for Claude Code and Codex
argument-hint: "[claude|codex|both] [--project]"
---

Invoke the `penny-kit` skill and run its **Setup** section (§1).

$ARGUMENTS

Rules for this run:

- Detect which runtimes are present rather than asking, and configure each one
  that is. If an argument named `claude`, `codex`, or `both`, honour it.
- `--project` means repo scope (`.claude/`, `.codex/`); otherwise machine scope.
- Read `references/model-policy.md` before writing any model or effort value.
  Do not reproduce those values from memory.
- Measure first (§1.0) and save a `pre` baseline, so the change can be judged
  later.
- Show every file write as a diff and get a yes before applying it. Read each
  target file first and merge — never overwrite a settings file. Back up before
  writing.
- If `MAX_THINKING_TOKENS` is already set from an earlier tokenmiser install,
  flag it: it is ignored on adaptive-reasoning models, so it reads as a working
  cap while doing nothing. Offer to remove it.
- Tell the user plainly that the filter hook executes shell commands with their
  permissions, and point at the file, before installing it.

End with the report shape in §1.3 — what changed, what was skipped and why, and
`restart the agent, then /penny-doctor`.
