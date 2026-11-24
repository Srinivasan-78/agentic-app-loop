# Doctor checks

Read-only. Run every applicable check, print one line each, then name the single
highest-value fix. Never apply a fix here — offer `/penny-setup`.

Line format, so the output is scannable:

```
ok    orchestrator      opus / xhigh
warn  subagent effort   CLAUDE_CODE_SUBAGENT_EFFORT unset (needs v2.1.315+)
fail  filter hook       on disk but settings.json does not reference it
```

Skip checks for a runtime that is not installed; say `skip  codex  not installed`
rather than omitting the row silently.

---

## A. The silent killers

These make the kit look installed while doing nothing. Check them first.

| # | Check | Fail condition | Why it matters |
|---|-------|----------------|----------------|
| A1 | `CLAUDE_CODE_EFFORT_LEVEL` | set to anything other than `auto`/`unset` | Overrides every agent's own `effort:`. Four tiers collapse into one and every Haiku agent bills at the forced level. |
| A2 | `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` | `=1` | Same, for models. Every agent's `model:` is ignored. |
| A3 | Filter hook wiring | file exists but no `PreToolUse` entry references it, **or** an entry references a path that does not exist | Either way the filter is inert and nothing tells you. |
| A4 | `$AGENT_KIT` / `$MISER` | both unset and `~/.claude/pennywright` absent | Every script path in every skill breaks. |
| A5 | Half-pinned agents | any agent file with `model:` and no `effort:` (Claude), or `model` without `model_reasoning_effort` (Codex) | The unset half resolves from a lower-priority source — usually the parent's expensive value. |
| A6 | Duplicate skills | the same skill `name` in two of `~/.claude/skills`, `.claude/skills`, `~/.agents/skills` | Both are advertised every session; you pay twice for one skill. |

```bash
env | grep -E '^(CLAUDE_CODE_EFFORT_LEVEL|CLAUDE_CODE_SUBAGENT_MODEL_FORCE|CLAUDE_CODE_SUBAGENT_MODEL|CLAUDE_CODE_SUBAGENT_EFFORT|AGENT_KIT|MISER)=' || echo "(none set)"
```

A1 and A2 may be set in a shell profile rather than settings.json — check both,
and name the file you found it in. A setting the doctor cannot locate is a
setting the user cannot fix.

---

## B. Claude Code configuration

| # | Check | Expected |
|---|-------|----------|
| B1 | `model` in settings.json | `opus` |
| B2 | `effortLevel` in settings.json | `xhigh` |
| B3 | `CLAUDE_CODE_SUBAGENT_MODEL` | `sonnet` |
| B4 | `CLAUDE_CODE_SUBAGENT_EFFORT` | `medium` (warn, not fail, below v2.1.315) |
| B5 | `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | `1` |
| B6 | `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` | `6` |
| B7 | `crossSessionInbound` | `hold` |
| B8 | `CLAUDE_CODE_GOAL_CHECKIN_MINUTES` | `0` |
| B9 | `MAX_THINKING_TOKENS` | **absent.** If present, warn: it is ignored on adaptive-reasoning models, so it reads as a cap while doing nothing. Offer removal. |
| B10 | Agents present | 14 in `agents/`, each with `model:` and a `tools:` allowlist |
| B11 | Skills present | 18 (`penny`, `penny-build`, `penny-council`, `penny-kit`, 14 `miser-*`) |
| B12 | Hook selftest | `python3 ~/.claude/hooks/filter-tool-output.py --selftest` exits 0 |

B1 and B2 are *defaults for new sessions*. Report them as configured defaults,
not as the current session's state — a user who typed `/model sonnet` has
overridden them on purpose.

---

## C. Codex configuration

| # | Check | Expected |
|---|-------|----------|
| C1 | `~/.codex/config.toml` exists | yes |
| C2 | `model` + `model_reasoning_effort` | both set, effort `xhigh` |
| C3 | `[agents] enabled` | not `false` |
| C4 | `[agents] max_concurrent_threads_per_session` | `6` (accept legacy `max_threads`) |
| C5 | `[agents] default_subagent_model` + `default_subagent_reasoning_effort` | both set |
| C6 | `~/.codex/agents/*.toml` | 14 files, each with `name`, `description`, `developer_instructions`, `model`, `model_reasoning_effort` |
| C7 | `AGENTS.md` | present, and under `project_doc_max_bytes` |
| C8 | `~/.agents/skills/miser-*` | 14 directories |

C7 is worth measuring, not eyeballing: `wc -c AGENTS.md` against the configured
`project_doc_max_bytes`. Over the limit it is silently truncated mid-file, and
whatever was at the bottom never loads.

---

## D. Measured health

Configuration is intent. These are outcomes.

```bash
node "$AGENT_KIT/scripts/miser-bench.mjs" report --since 7d
node "$AGENT_KIT/scripts/miser-bench.mjs" session latest
bash "$AGENT_KIT/scripts/context-report.sh"
```

| Number | Target | If it is off |
|--------|--------|--------------|
| cache read share | > 90%; under ~80% is a problem | Something mutates the prompt prefix mid-session — an edited CLAUDE.md, a toggled MCP server, a mid-session model switch. Model routing is irrelevant until this is fixed. `/miser-session`. |
| eff input / turn | trending down after setup | The dominant term. `/miser-audit` ranks the sinks. |
| thinking share of output | < ~35% on routine work | Effort too high for what you mostly do. `/miser-model`. |
| always-on tokens | < ~2k | Skill listing, MCP schemas, CLAUDE.md. `/miser-audit`. |

No session logs yet → report `skip` for section D and say there is nothing to
measure, rather than reporting zeros as if they were healthy.

Totals across sessions are not a scorecard. A big task legitimately costs more.
Compare per-turn figures, or the same task run twice.

In session, these see live state the scripts cannot: `/context` (breakdown),
`/usage` (attribution to skills, subagents, plugins, MCP), `/cost` (cache hit
ratio, miss count, and the likely cause of the last miss).

---

## E. Report

```
kit doctor
  runtime     claude 2.1.263, codex not installed

A silent killers
  ok    CLAUDE_CODE_EFFORT_LEVEL     unset
  ok    SUBAGENT_MODEL_FORCE         unset
  fail  filter hook                  ~/.claude/hooks/filter-tool-output.py missing, settings.json references it
  ok    $AGENT_KIT                   ~/.claude/pennywright
  ok    agent pinning                14/14 fully pinned
  warn  duplicate skills             miser-read in both ~/.claude/skills and ~/.agents/skills

B claude config
  ok    orchestrator                 opus / xhigh (default for new sessions)
  warn  MAX_THINKING_TOKENS          =8000 — ignored on adaptive models; offer removal
  ...

D measured (7d)
  warn  cache read share             71%  (target >90%)
  ok    eff input/turn               38,400
  ok    always-on                    1,870 tokens

highest-value fix: reinstall the filter hook — settings.json points at a file
that is not there, so every Bash result has been entering context unfiltered.
  /penny-setup   (step 2 only)
```

One fix at the end, not a list. If several are equally bad, pick the one in
section A — those are the ones that make everything else meaningless.
