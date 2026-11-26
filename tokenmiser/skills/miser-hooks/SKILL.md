---
name: miser-hooks
description: Preprocess tool output with hooks so raw logs, test runs, and builds never reach the context — plus deterministic checks that answer without any model call. Use for "filter test output", "logs blowing up context", "hook to save tokens".
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌​‌​‌‌‌​‌‌‌‌​​​​​‌‌​‌​‌​‌​​​‌‌​​‌‌​‌​‌‌​‌​‌​‌‌‌​‌​‌​​‌​​​‌‌​​​‌​‌‌‌​​​​​‌​​‌‌​​​‌‌​‌‌‌​​​‌‌​‌‌​​‌​‌​​​‌​‌​​‌‌​‌​‌​​‌‌‌‌​‌‌‌‌​​​​‌​​‌‌‌​​‌‌​​‌‌​​‌‌‌​‌​​​‌​​‌‌‌‌​‌‌​​​‌‌​‌​​‌‌​​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.Wx5FkWR1pLn6QMOxNftOcL
-->

# miser-hooks

A hook runs outside the model. Anything it filters is never paid for. Reported: a 10,000-line log reduced from tens of thousands of tokens to hundreds.

## Install the filter

```bash
npx tokenmiser install --hook     # copy + settings.json entry, with a backup
```
By hand:

```bash
mkdir -p ~/.claude/hooks
cp "$MISER/hooks/filter-tool-output.py" ~/.claude/hooks/
chmod +x ~/.claude/hooks/filter-tool-output.py
```

`~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [ { "type": "command", "command": "python3 ~/.claude/hooks/filter-tool-output.py" } ] }
    ]
  }
}
```

Verify: `/hooks` lists it under PreToolUse; `claude --debug` shows `modified tool input keys: [command]` on a rewritten command. Test offline:

```bash
python3 ~/.claude/hooks/filter-tool-output.py --selftest                      # 14 cases
echo '{"tool_input":{"command":"npm test"}}' | python3 ~/.claude/hooks/filter-tool-output.py
```

## What it rewrites

Test runners keep failures with 5 lines of context; builds and type checks keep errors; installs keep the tail; linters keep findings; container and journal logs keep error lines; `git log` gets `--oneline | head -30`; `git diff` and `git show` are capped; unbounded `find` is capped.

Left untouched: anything already piped or redirected, any compound command (`&&`, `||`, `;`), and already-bounded forms such as `git log -1 --format=%H` or `git diff --stat` — appending a pipe there would change what runs.

Filtered test and build commands end with `exit ${PIPESTATUS[0]}` and a one-line `[tokenmiser] exit=N` marker, so a suppressed failure can never read as a pass.

Turn it off for one shell: `TOKENMISER_FILTER_OFF=1`.

## Extend it

Add rules without editing the script — `~/.claude/tokenmiser-filter.json`:

```json
{ "rules": [["^my-runner\\b", "{cmd} 2>&1 | tail -40"], ["^chatty-lint\\b", "{cmd} | grep -v '^info'"]] }
```
`{cmd}` is the original command, `{args}` everything after the first word. User rules run after the built-ins. Or add a `(regex, template)` pair to `RULES` in the script itself. Rules for your repo:
- Custom test runner: keep the failure summary block only.
- Chatty linter: `| grep -v '^info'`.
- Data files: `head -5` plus `wc -l` instead of the file.

Keep every rewrite semantically identical to what the agent asked for — filtering output is fine, changing which command runs is not.

## Deterministic checks before inference

The cheapest token is the one no model spends. Run linters, type checks, formatters, and schema validators in a PostToolUse hook or a pre-commit hook. They answer mechanical questions for free and stop the agent from reading files to find what a compiler already knows.

## Other hook levers

- **PostToolUse** on `Edit`: run the formatter and the type checker, feed back only errors.
- **SessionStart**: inject a 10-line project brief instead of a 200-line CLAUDE.md. Fires again on resume and after a compaction with `source` set to `resume` / `compact` — use the `compact` case to restore context the compaction dropped.
- **PreCompact**: back up the transcript before the compaction runs.
- **PostCompact**: re-inject the few facts the next turns will need (open files, next step) so the model does not re-derive them.
- **Stop**: append a handoff file so the next session starts small (`/miser-session`).
- **UserPromptSubmit**: conditionally inject only the context this prompt needs. Its output is added on **every** prompt, so keep it minimal and targeted — an unconditional block here is a per-turn tax.

A hook that emits context runs on every matching event, useful turn or not — weigh its standing cost like any always-on block.

Hooks execute shell commands with your permissions. Read any hook before installing it.
