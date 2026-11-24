# Claude Code setup

Propose every write as a diff and get a yes before applying it. Read each target
file first and merge into it — never overwrite a settings file.

---

## Step 1 — settings.json

Target `~/.claude/settings.json` (machine) or `.claude/settings.json` (repo).

```json
{
  "model": "opus",
  "effortLevel": "xhigh",
  "crossSessionInbound": "hold",
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "sonnet",
    "CLAUDE_CODE_SUBAGENT_EFFORT": "medium",
    "CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH": "1",
    "CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS": "6",
    "CLAUDE_CODE_GOAL_CHECKIN_MINUTES": "0"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/filter-tool-output.py" }]
      }
    ]
  }
}
```

### Line by line

| Key | Why |
|-----|-----|
| `model: opus` | The orchestrator is the one place Opus earns its price. |
| `effortLevel: xhigh` | Orchestrator thinking depth. A *default*, not a floor — `/effort` still moves it, and each agent's own `effort:` still wins for that agent. |
| `crossSessionInbound: hold` | A message from another session arrives as a new turn, which re-sends the whole context. Hold shows a notice instead. |
| `CLAUDE_CODE_SUBAGENT_MODEL: sonnet` | Fleet default. Each agent's own `model:` beats it, so the Haiku agents stay Haiku. |
| `CLAUDE_CODE_SUBAGENT_EFFORT: medium` | Fleet default effort. Needs v2.1.315+; harmless and ignored below that. |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: 1` | Stops a subagent spawning its own subagents. Nested fan-out is the fastest way to a surprise bill, and nothing in this kit needs depth. |
| `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS: 6` | The council runs 5 in parallel plus a referee. 6 is the ceiling this kit needs; the default 20 lets a stray prompt start 20. |
| `CLAUDE_CODE_GOAL_CHECKIN_MINUTES: 0` | Check-ins fire full-context turns while background work runs. |

### Do NOT set

- **`CLAUDE_CODE_EFFORT_LEVEL`** — it overrides every agent's own `effort:`,
  flattening the tiers. Use the `effortLevel` *setting* (above) for the
  orchestrator default instead; it leaves per-agent effort intact.
- **`CLAUDE_CODE_SUBAGENT_MODEL_FORCE`** — same problem for models.
- **`MAX_THINKING_TOKENS`** — on adaptive-reasoning models (Opus 4.7+, Sonnet 5,
  Fable, Haiku 5.5) Claude Code ignores the number, so it reads as a working
  budget cap while doing nothing. Effort is the real control. Only set it on a
  pinned older model, and if it is already in the user's settings from an
  earlier tokenmiser install, say so and offer to remove it.
- **`ENABLE_TOOL_SEARCH=false`** — MCP tools are deferred by default, which is
  the saving. Leave it alone unless a gateway rejects tool search.

### Honest caveats

`model` and `effortLevel` set the *default for new sessions*. They do not
retroactively change a running session, and a user who types `/model sonnet`
has overridden you — correctly. Say this in the report rather than claiming the
orchestrator "is now Opus".

---

## Step 2 — the tool-output filter hook

The biggest single win when tests, builds, or logs are noisy. It rewrites the
*command* before it runs, so the trimmed output is never context, never billed.

```bash
mkdir -p ~/.claude/hooks
cp "$AGENT_KIT/hooks/filter-tool-output.py" ~/.claude/hooks/
chmod +x ~/.claude/hooks/filter-tool-output.py
```

Then wire the `PreToolUse` entry from Step 1. Copying the file is not enough on
its own — a hook on disk that `settings.json` does not reference does nothing,
and nothing warns you.

Verify, in this order — all three, because each catches a different failure:

```bash
python3 ~/.claude/hooks/filter-tool-output.py --selftest
echo '{"tool_input":{"command":"npm test"}}' | python3 ~/.claude/hooks/filter-tool-output.py
```

and `/hooks` in session must list it under `PreToolUse`.

**Windows:** the interpreter is `python`, not `python3`. Check
`python3 --version` first and fall back to `python` in the settings entry.

**Read the hook before installing it.** It executes shell commands with the
user's permissions. That is not a formality — say it to the user.

### What it leaves alone

Anything already piped or redirected, any compound command (`&&`, `||`, `;`),
and already-bounded forms like `git diff --stat`. Filtered test and build
commands end with `exit ${PIPESTATUS[0]}` and a `[tokenmiser] exit=N` marker, so
a suppressed failure can never read as a pass.

Turn it off for one shell with `TOKENMISER_FILTER_OFF=1`.

### Extending it

`~/.claude/tokenmiser-filter.json`, no script edit needed:

```json
{ "rules": [["^my-runner\\b", "{cmd} 2>&1 | tail -40"]] }
```

Rule: a rewrite may filter *output*. It may never change *which command runs*.

---

## Step 3 — CLAUDE.md diet

```bash
wc -l CLAUDE.md ~/.claude/CLAUDE.md 2>/dev/null
```

Over ~200 lines, move workflow-specific sections into skills — a skill costs
~100 tokens of description until invoked, where a CLAUDE.md section costs its
full length on every session of every project.

The test: **if it is not needed in 80% of sessions, it is not CLAUDE.md
material.** Keep build/test commands, repo layout, hard constraints.

Do not simply delete. A right-sized AGENTS.md/CLAUDE.md measurably *saves*
tokens by sparing the agent exploratory navigation — the win is moving the rest
into skills, not having none. `/miser-audit` produces the ranked cut list and
`/miser-compress` does the rewrite.

---

## Step 4 — MCP prune

```bash
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.claude.json')));print('\n'.join((d.get('mcpServers') or {}).keys()))"
```

Per server: used in the last month? No → disable via `/mcp`. Rarely → disable
and re-enable on demand. Prefer a CLI (`gh`, `aws`, `gcloud`, `psql`) where one
exists — Bash is already in context, so a CLI costs zero per-session listing.

Check the result with `/context` before and after. If the tools row does not
drop, the server is not actually disabled.

---

## Step 5 — permission allowlist

Each approval prompt costs a turn. Add the read-only commands this kit runs to
`permissions.allow` in `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(rg:*)", "Bash(git status:*)", "Bash(git diff:*)",
      "Bash(git log:*)", "Bash(ls:*)", "Bash(wc:*)"
    ]
  }
}
```

Propose only commands the user actually runs — read the transcript or ask. Never
add a write or network command to an allowlist on the user's behalf.

---

## Step 6 — response style

Append to `CLAUDE.md` so every agent in the repo inherits it. One line, ~25
tokens, pays for itself in one answer:

```markdown
## Response style
Terse. No filler, hedging, or restated diffs. Keep code, commands, and errors verbatim. Full prose for warnings, irreversible actions, and anything written to files or tickets.
```

---

## Step 7 — re-measure

Not optional. A day of real work later:

```bash
node "$AGENT_KIT/scripts/miser-bench.mjs" baseline save post
node "$AGENT_KIT/scripts/miser-bench.mjs" baseline diff pre post
```

Compare **per-turn** numbers, never totals — a bigger task legitimately costs
more. If per-turn did not move, say so plainly and work through `/miser-audit`
rather than claiming a win.
