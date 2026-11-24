# Codex setup

The Codex lane mirrors the Claude lane: one expensive parent session, a fleet of
cheap bounded subagents, verbose work kept off the parent thread.

Codex has native subagents, so the shape transfers almost exactly. What differs
is where things live and what a subagent file is allowed to override.

Propose every write as a diff first. Merge into existing files; never overwrite
a `config.toml`.

---

## Where things go

| What | Machine-wide | Repo-scoped |
|------|--------------|-------------|
| Config | `~/.codex/config.toml` | `.codex/config.toml` |
| Agent definitions | `~/.codex/agents/*.toml` | `.codex/agents/*.toml` |
| Instructions | `~/.codex/AGENTS.md` | `./AGENTS.md` |
| Skills | `~/.agents/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` |

Two things to know before writing a repo-scoped config:

- Codex loads `.codex/config.toml` **only for a trusted project**.
- A repo-scoped config **cannot** set `model_provider`, `model_providers`,
  `profile`, `profiles`, `notify`, or telemetry keys — Codex ignores them there.
  Those belong in user-level config.

Skills are the one piece that is genuinely shared: `~/.agents/skills/` is read
by Codex natively, and the `miser-*` skills are plain `SKILL.md` files with no
Claude-specific syntax. Install them once, both runtimes see them.

---

## Step 1 — config.toml

Start from `codex/config.toml.sample` in this package. The essentials:

```toml
model = "gpt-6.2-sol"
model_reasoning_effort = "xhigh"

# Keep reasoning out of the transcript the parent carries.
hide_agent_reasoning = true

# Cap how much of AGENTS.md is pulled into turn one.
project_doc_max_bytes = 8192

[agents]
enabled = true
max_concurrent_threads_per_session = 6
default_subagent_model = "gpt-6.2-sol"
default_subagent_reasoning_effort = "medium"
```

| Key | Why |
|-----|-----|
| `model` + `model_reasoning_effort` | The parent session: the orchestrator tier. `xhigh` is for the thinking that frames every brief. |
| `hide_agent_reasoning` | Suppresses reasoning events in the TUI and `codex exec`. Display only — reasoning still happens and is still billed. It buys a readable transcript, not tokens. Say that honestly; do not sell it as a saving. |
| `project_doc_max_bytes` | A hard ceiling on AGENTS.md bytes read into the first turn. The real fix is a short AGENTS.md; this is the backstop. |
| `max_concurrent_threads_per_session` | 6 — the council's 5 members plus a referee. Existing configs may use the legacy alias `max_threads`. |
| `default_subagent_*` | The fleet default. An agent file's own values beat these. |

Verify the model names against your plan before writing them. `/penny-doctor`
reads back what is configured rather than assuming these strings are available
to you.

### Compaction, if long sessions are the problem

```toml
model_auto_compact_token_limit_scope = "body_after_prefix"
model_post_turn_compact_threshold_percent = 80
```

`body_after_prefix` counts only growth past the carried compaction prefix rather
than the full active context, so compaction fires on what actually grew. The
turn-end threshold compacts after a final response once context reaches 80% of
the usable window. Both are optional — offer them when the user reports long
sessions, not by default.

---

## Step 2 — agent files

Copy the definitions:

```bash
mkdir -p ~/.codex/agents
cp "$AGENT_KIT"/codex/agents/*.toml ~/.codex/agents/
```

Each file is one agent. Required: `name`, `description`,
`developer_instructions`. This kit also sets `model` and
`model_reasoning_effort` on every one — see below for why both.

### The half-pin trap

Codex resolves each setting independently, first match winning: explicit spawn
value → the agent file → the `[agents]` default → the parent's value.

So an agent file that sets **only** `model` keeps whatever effort was resolved
one step down. A Luna agent silently inherits the parent's `xhigh`, and the cheap
tier is not cheap. **Set both, or neither.** Every file in `codex/agents/` sets
both; `/penny-doctor` flags any that does not.

### What an agent file cannot do

`sandbox_mode`, `approval_policy`, `model_provider`, and `mcp_servers` are
always the parent session's. Consequences worth stating plainly:

- A "read-only" agent is read-only because its `developer_instructions` say so.
  There is no separate read-only sandbox. Treat the instruction as advisory and
  never rely on it as a security boundary.
- MCP servers must be configured on the parent session for an agent to use them.
- Set the permission mode on the parent turn *before* asking for delegation —
  subagents inherit it, including `--yolo`.

Capabilities an agent file *can* drop, and this kit uses: `features.shell_tool`,
`features.apps`, `features.plugins`, `features.memories`,
`features.request_permissions_tool`, plus `skills.config` to disable individual
skills and `skills.include_instructions = false` to omit the skills block.

For a read-heavy agent, dropping `features.apps` and `features.plugins` and
setting `skills.include_instructions = false` removes standing context it will
never use.

---

## Step 3 — AGENTS.md

Codex will not run the loop or the council unless the instructions tell it to.
Copy `codex/AGENTS.md.sample` to the repo root (or `~/.codex/AGENTS.md` for
machine-wide) and merge it into any existing file.

Keep it short. It is read on turn one of every session, so it is the Codex
equivalent of CLAUDE.md and the same 80% rule applies: if it is not needed in
most sessions, it belongs in a skill. `project_doc_max_bytes` truncates the rest
anyway — a long AGENTS.md does not fail loudly, it gets silently cut.

---

## Step 4 — shared skills

```bash
mkdir -p ~/.agents/skills
cp -r "$AGENT_KIT"/skills/miser-* ~/.agents/skills/
```

Codex follows symlinked skill directories, so a symlink works as well as a copy
and keeps one source of truth when the user has this repo as a checkout:

```bash
ln -s "$AGENT_KIT"/skills/miser-read ~/.agents/skills/miser-read
```

Prefer a symlink from a checkout the user controls, and a copy from anywhere
volatile — a link into a temp directory dangles once that directory is cleaned
up, and a dangling skill directory fails quietly.

Verify with Codex's own skill listing. Two skills sharing a `name` are not
merged — both appear in selectors, which is confusing rather than broken. If
`~/.agents/skills` already has a `miser-*` directory from a standalone
tokenmiser install, replace it rather than adding a second copy.

---

## Step 5 — triggering the workflows

Codex delegates when you ask directly or when `AGENTS.md`/skill instructions
request it. There is no `/penny-build` slash command — the `AGENTS.md.sample`
carries the trigger phrases, and a prompt that names the workflow works:

```text
Run the build loop on this: add rate limiting to the orders endpoint.
```

```text
Convene the council on this: should sessions live in Redis or Postgres?
Spawn one agent per role, wait for all five, then have the referee adjudicate.
```

A good delegation prompt states three things: **how to divide the work**,
**whether to wait for all agents**, and **what summary to return**. Leaving any
of them out is how a council turns into five essays.

Be straight with the user about the tradeoff: subagent workflows spend *more*
tokens than a single-agent run of the same task, because each subagent does its
own model and tool work. What they buy is a parent thread that stays clean and
work that runs in parallel. The saving is on the orchestrator's context and on
not having to redo work the parent got confused into — not on the raw total.
