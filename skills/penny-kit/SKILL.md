---
name: penny-kit
description: >-
  Set up, verify, and explain this machine's coding-agent kit — orchestrator and
  subagent model/effort tiers, the tool-output filter hook, context diet, MCP
  prune, and the Codex mirror of the same setup. Use for "set up the kit",
  "configure my agent", "one-stop setup", "reduce my token usage", "is my setup
  right", "what skills do I have", "kit doctor", "kit help".
---

# penny-kit

The install-and-verify half of this plugin. Three jobs: **setup**, **doctor**,
**help**. Pick the one the request asks for and run only that.

Everything it writes is reversible and nothing is written without showing the
user the exact diff first. Re-running is safe — every step is idempotent.

| Request | Section |
|---------|---------|
| "set up", "configure", "install the kit" | §1 Setup |
| "check my setup", "doctor", "is this right" | §2 Doctor |
| "help", "what do I have", "where do I start" | §3 Help |

The model and effort tiers all three sections enforce live in
`references/model-policy.md`. Read it before writing any model or effort value —
do not reproduce the numbers from memory, and do not invent a tier that is not
in it.

---

## 1. Setup

Detect which runtimes are present and set up each one. Do not ask the user which
agent they use when you can see it:

```bash
command -v claude >/dev/null && echo "claude: yes"
command -v codex  >/dev/null && echo "codex: yes"
ls -d ~/.claude ~/.codex ~/.agents 2>/dev/null
```

Then run **§1.1** for Claude Code and **§1.2** for Codex, skipping a runtime
that is absent. If both are absent, say so and stop — there is nothing to
configure.

Scope question, asked once: **machine-wide** (`~/.claude`, `~/.codex`) or **this
repo only** (`.claude/`, `.codex/`)? Default to machine-wide for a personal
machine and repo-scoped when the repo has a committed `.claude/settings.json`
already. State which you chose.

### 1.0 Measure first — always

A setup that cannot show a before/after is a setup you cannot defend.

```bash
bash "$AGENT_KIT/scripts/context-report.sh"
node "$AGENT_KIT/scripts/miser-bench.mjs" report --since 7d
node "$AGENT_KIT/scripts/miser-bench.mjs" baseline save pre
```

`$AGENT_KIT` is this package's root. If it is unset, resolve it in this order and
export it for the rest of the session:

1. `$AGENT_KIT`
2. `$MISER` (the name the standalone tokenmiser release used — still honoured)
3. `~/.claude/pennywright` (where the installer copies the scripts)
4. this skill's own base directory, two levels up from `references/`

Report two numbers back and keep them: **always-on tokens** and **eff
input/turn**. Every later step is judged against these.

If no session logs exist yet (a fresh machine), say so — skip the bench lines,
run the context report only, and note that there is no baseline to compare
against later.

### 1.1 Claude Code

Follow `references/claude-setup.md`. In short, in this order:

1. **settings.json** — orchestrator `model` + `effortLevel`, subagent model and
   effort defaults, idle-turn suppression. Read the file first, merge, never
   overwrite; back it up before writing.
2. **The tool-output filter hook** — the single biggest win on a repo with noisy
   tests or builds.
3. **CLAUDE.md diet** — over ~200 lines, move workflow sections into skills.
4. **MCP prune** — disable servers unused this month.
5. **Permission allowlist** — the read-only commands this kit actually runs.

### 1.2 Codex

Follow `references/codex-setup.md`. In short:

1. **`config.toml`** — model, reasoning effort, the `[agents]` block that sets
   subagent defaults and the concurrency cap.
2. **`agents/*.toml`** — the 14 agent definitions, copied from `codex/agents/`.
3. **`AGENTS.md`** — the orchestration contract and the response-style rule.
4. **Shared skills** — the `miser-*` skills into `~/.agents/skills/`, which
   Codex reads natively.

### 1.3 Report

End with exactly this shape. No prose around it.

```
scope:      machine (~/.claude, ~/.codex)
always-on:  3,144 -> 1,900 tokens
eff in/turn (7d): 142,354   [baseline saved as "pre"]

claude:  settings.json (model=opus, effortLevel=xhigh, subagent=sonnet/medium)
         hook wired (PreToolUse/Bash)
         14 agents + 18 skills available after restart
codex:   config.toml ([agents] sol/xhigh parent, luna/high hands)
         14 agent files -> ~/.codex/agents/
         15 skills -> ~/.agents/skills/

skipped: MCP prune (user declined)
next:    restart the agent, then /penny-doctor
```

---

## 2. Doctor

Read-only. Never fix anything here — report, and offer `/penny-setup` for what is
wrong.

Run the checks in `references/doctor-checks.md` and print one line per check:
`ok` / `warn` / `fail`, then the single highest-value fix at the end.

The checks that matter most, because they silently undo the whole kit:

- **`CLAUDE_CODE_EFFORT_LEVEL` is set** → it overrides every agent's `effort:`,
  collapsing four tiers into one. This is the number-one cause of "the kit
  stopped saving money".
- **`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`** → same, for models.
- **Hook present but not wired** (or wired but the file is gone) → the filter is
  doing nothing and you will not notice.
- **`$AGENT_KIT` unset** → the skills' script paths break and the measurement
  commands fail silently.
- **Agent files with `model:` but no `effort:`** (Codex: the reverse trap) →
  half-pinned tiers.
- **Cache read share under ~80%** → something mutates the prompt prefix mid
  session; the model routing is irrelevant until that is fixed.

```bash
node "$AGENT_KIT/scripts/miser-bench.mjs" session latest
bash "$AGENT_KIT/scripts/context-report.sh"
```

In-session, pair the script output with `/context`, `/usage`, and `/cost` —
they see live state the scripts cannot.

---

## 3. Help

Print the index and stop. Do not start doing work.

### Start here

| Command | What it does |
|---------|--------------|
| `/penny <anything>` | **The front door.** Works out what the request needs, sharpens it if it is too vague to act on, routes it to the right workflow below. Use it when you are not sure which of the others you want. |

### The two workflows

| Command | What it does | When |
|---------|--------------|------|
| `/penny-build <ask>` | 7-phase loop — PLAN → TEST → IMPLEMENT → REVIEW → VERIFY → REMEMBER → IMPROVE, one subagent per phase | you want something *built* properly |
| `/penny-council <question>` | 5 agents argue a decision in parallel, a referee adjudicates, the orchestrator decides | you want a *decision* you can defend |

They compose, and `/penny` is what sequences them: an idea becomes a brief, a
brief with an open fork becomes a council, a council decision becomes the
`## Request` of a build run. A build run's PLAN phase can also call a council
back when it hits a genuinely open choice.

### The kit

| Command | What |
|---------|------|
| `/penny-setup` | install and configure everything (§1) |
| `/penny-doctor` | verify it, read-only (§2) |
| `/penny-scout <question>` | one bounded cheap exploration; the answer, not the file dump |

### The token skills

Model-invoked — you rarely type these, the agent reaches for them. Listed so you
know what exists:

| Skill | Lever |
|-------|-------|
| `miser-audit` | diagnose: what eats context every session |
| `miser-bench` | measure: per-turn tokens, cache share, A/B a change |
| `miser-speak` | output tokens: terse mode |
| `miser-compress` | shrink an always-on file (CLAUDE.md, AGENTS.md) |
| `miser-session` | `/clear` vs `/compact`, handoffs, cache TTL |
| `miser-read` | retrieval discipline: search before read, ranges not files |
| `miser-tools` | MCP and tool-schema tax |
| `miser-delegate` | when a subagent actually pays, and the contract |
| `miser-model` | model + effort routing, thinking spend |
| `miser-prompt` | request shape: targets, caps, verification |
| `miser-hooks` | pre-context filtering, deterministic checks |
| `miser-git` | terse commits and review comments |
| `miser-api` | token levers in code you write against an LLM API |

### Order that pays

1. `/penny-setup` — hook, tiers, context diet. Once per machine.
2. `/penny-doctor` — confirm it took.
3. Send work through `/penny` rather than prompting ad hoc. The routing is what
   keeps verbose work out of your main context, and that isolation is where the
   savings actually are.
4. `/miser-audit` when a session still feels expensive.
5. `miser-bench baseline diff pre post` after a week — prove it or revert it.

### What this kit costs

Each installed skill advertises its name and description every session (~100
tokens). 19 skills ≈ 1.9k tokens standing cost. The 14 agents cost nothing until
spawned. If you never fire a skill, delete its directory — the technique catalog
in `reference/techniques.md` stays readable either way.

Be honest about this in the report: the kit is not free, it is *cheap relative
to what it saves*, and on a small codebase with quiet tests it may not pay for
itself. `miser-bench` is how you find out rather than assume.
