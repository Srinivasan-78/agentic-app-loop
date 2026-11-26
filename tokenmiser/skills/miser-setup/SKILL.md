---
name: miser-setup
description: One-time token-reduction setup for this machine or repo — writes settings.json env/hooks, installs the tool-output filter, prunes CLAUDE.md, disables unused MCP servers, and records a baseline. Use for "set up tokenmiser", "reduce my token usage", "configure token savings".
---

# miser-setup

Install the always-on savings. Ask before each write. Idempotent — safe to re-run.

## Step 0 — measure first

```bash
bash "$MISER/scripts/context-report.sh"                 # always-on load
node "$MISER/scripts/miser-bench.mjs" report --since 7d  # last week per-turn cost
node "$MISER/scripts/miser-bench.mjs" baseline save pre  # snapshot for later A/B
```
`$MISER` = this package root. If it is unset, run `npx tokenmiser audit` and `npx tokenmiser report --since 7d` instead — same scripts, no env var. Report the two headline numbers back: **eff input/turn** and **always-on tokens**. Every later change is judged against them.

## Step 1 — settings.json

Target `~/.claude/settings.json` (machine) or `.claude/settings.json` (repo). Propose only the entries that are missing:

```json
{
  "env": {
    "MAX_THINKING_TOKENS": "8000",
    "CLAUDE_CODE_GOAL_CHECKIN_MINUTES": "0",
    "DISABLE_TELEMETRY": "1"
  },
  "crossSessionInbound": "hold",
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [ { "type": "command", "command": "python3 ~/.claude/hooks/filter-tool-output.py" } ] }
    ]
  }
}
```

Rules:
- `MAX_THINKING_TOKENS` only bites on fixed-budget models; adaptive-reasoning models ignore it — use `/effort` there. Thinking is billed as output.
- Never set env keys the user has not agreed to. Read the file first; merge, never overwrite.
- `crossSessionInbound: hold` and goal check-ins at 0 stop idle turns that resend the whole context.

## Step 2 — tool-output filter hook

```bash
npx tokenmiser install --hook          # copies the hook AND merges the settings.json entry (backs it up first)
# or by hand:
mkdir -p ~/.claude/hooks && cp "$MISER/hooks/filter-tool-output.py" ~/.claude/hooks/ && chmod +x ~/.claude/hooks/filter-tool-output.py
python3 ~/.claude/hooks/filter-tool-output.py --selftest    # 14 cases, all must pass
```
Verify with `/hooks` (must appear under PreToolUse). Biggest single win when the repo has noisy test/build output: a 10k-line log becomes ~100 lines.

## Step 3 — CLAUDE.md diet

```bash
wc -l CLAUDE.md ~/.claude/CLAUDE.md 2>/dev/null
```
Over 200 lines: move workflow-specific sections into skills (loaded on demand at ~100 tokens of description) and keep only build/test commands, repo layout, hard constraints. Rule: **if it is not needed in 80% of sessions, it is not CLAUDE.md material.** Run `/miser-audit` for the ranked cut list.

## Step 4 — MCP diet

```bash
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.claude.json')));print(list((d.get('mcpServers') or {}).keys()))"
```
Disable servers not used this month (`/mcp`). Prefer CLI equivalents (`gh`, `aws`, `gcloud`) — they cost zero per-session listing. Details in `/miser-tools`.

## Step 5 — permission allowlist

Repeated approval prompts cost a turn each. Add the safe read-only commands you actually run to `permissions.allow` in `.claude/settings.json` (`Bash(rg:*)`, `Bash(git status:*)`, `Bash(git diff:*)`, `Bash(ls:*)`).

## Step 6 — turn on the output style

`/miser-speak full` for the session, or add the one-line activation rule to the repo so every agent inherits it (see `/miser-speak`, section "Persist to repo").

## Step 7 — re-measure

After a day of work: `node "$MISER/scripts/miser-bench.mjs" baseline save post && node "$MISER/scripts/miser-bench.mjs" baseline diff pre post`.

## Report format

```
always-on: 3,144 -> 1,900 tokens
eff input/turn (7d): 142,354
applied: hook, MAX_THINKING_TOKENS=8000, crossSessionInbound=hold
skipped: MCP prune (user declined)
```
