# Model policy

The one rule this whole kit is built on:

> **One expensive brain, many cheap hands.**
> The orchestrator reasons. Subagents fetch, write, run, and report. Verbose work
> never enters the orchestrator's context.

Everything below is the concrete form of that rule, per agent runtime. The tiers
are deliberately coarse — three of them. A fourth tier is a decision you have to
make every time, and that costs more than it saves.

---

## 1. Claude Code

### Tiers

| Tier | Who | Model | Effort | Why |
|------|-----|-------|--------|-----|
| **Orchestrator** | the main session | `opus` | `xhigh` | Owns the plan, the gates, and the final call. Spends thinking tokens once, on the decisions that are expensive to get wrong. |
| **Judgment** | plan, review, council architect / skeptic / referee | `sonnet` | `high` | Needs to trace logic and find what is wrong. Does not need Opus — it is working inside a brief the orchestrator already framed. |
| **Craft** | test, implement, verify, improve, council pragmatist | `sonnet` | `medium` | Ordinary code and checks against a stated contract. |
| **Hands** | remember, scout, council operator / economist | `haiku` | *(unset)* | Runs commands, greps, reports. Mechanical. |

VERIFY sits in Craft rather than Hands on purpose. Its work is mechanical — run
the suite, run the build, check each criterion — but it emits the `RESULT:
PASS/FAIL` that gates the loop. A gate that misreads a failure as a pass is the
one cheap-tier mistake this kit cannot absorb, so it pays a tier for the
judgment.

Opus never runs as a subagent in this kit. If a subagent genuinely needs Opus,
the brief was too vague — tighten the brief instead of raising the tier. (The
single exception is a user override; see §1.4.)

### 1.1 Why `effort` is unset on the Hands tier

Effort levels are model-dependent. The `haiku` alias has pointed at models that
reject the `effort` parameter at the API. Omitting the field lets Claude Code
send whatever that model accepts, so the agent launches either way. Setting
`effort: low` on a Haiku agent buys nothing and can cost you the spawn.

### 1.2 Where each knob lives

| Knob | Set it in | Precedence |
|------|-----------|------------|
| Orchestrator model | `model` in `settings.json` | `/model` overrides for the session |
| Orchestrator effort | `effortLevel` in `settings.json` | `CLAUDE_CODE_EFFORT_LEVEL` > `/effort` > `modelSettings` > `effortLevel` |
| Per-agent model | `model:` in the agent's frontmatter | beats `CLAUDE_CODE_SUBAGENT_MODEL` |
| Per-agent effort | `effort:` in the agent's frontmatter | beaten by `CLAUDE_CODE_EFFORT_LEVEL` |
| Fleet default model | `CLAUDE_CODE_SUBAGENT_MODEL` | loses to an agent's own `model:` |
| Fleet default effort | `CLAUDE_CODE_SUBAGENT_EFFORT` | needs Claude Code v2.1.315+ |

`CLAUDE_CODE_EFFORT_LEVEL` is a sledgehammer: it overrides every agent's own
`effort:`, flattening the tiers into one. `/penny-setup` never writes it, and
`/penny-doctor` flags it if something else did — a flattened fleet is the most
common reason this kit stops saving money.

`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` has the same effect on models. Same
treatment.

### 1.3 Frontmatter fields that are pure savings

Every agent in this kit sets these. They are not decoration:

- **`omitClaudeMd: true`** — starts the agent without the user/project CLAUDE.md
  files. A bounded agent gets everything it needs from its brief; loading
  CLAUDE.md on 14 agents pays for the same tokens 14 times. Only the phase
  agents that must follow repo conventions (implement, test, review) keep
  CLAUDE.md. Requires v2.1.271+; harmless on older versions.
- **`maxTurns`** — a hard stop. An agent that has not finished in its budget is
  looping, and a looping agent bills every turn at full context.
- **`tools`** — the allowlist *is* the token budget. An agent without `Write`
  cannot write, so it also cannot be asked to.
- **`disallowedTools`** — removes inherited tools you forgot to think about.

### 1.4 Escalating

Start at the tier in the table. Escalate only on evidence:

1. A Craft-tier agent fails the same task twice with a clear brief → re-brief it
   once more, then raise it to Judgment.
2. The orchestrator disagrees with Judgment-tier output twice on the same
   question → the question is architectural; the orchestrator answers it itself
   rather than re-spawning.

Two failed Sonnet attempts still cost less than one Opus subagent carrying a
cold context. Escalate the *brief* before you escalate the *model*.

Exception, stated plainly: anything where a wrong answer is expensive to discover
later — schema migrations, auth, money movement, data deletion — goes to the
orchestrator directly. Do not delegate those to a cheap tier to save tokens.

---

## 2. Codex

Codex resolves a subagent's model and effort in this order, first match winning:

1. an explicit value in the spawn request
2. `model` / `model_reasoning_effort` in the agent's own `.toml`
3. `agents.default_subagent_model` / `agents.default_subagent_reasoning_effort`
4. the parent session's values

A custom agent file that sets only `model` keeps the effort resolved at step 3
or 4 — which is usually not what you meant. **Set both, or neither.** Every
agent file in `codex/agents/` sets both.

### Tiers

| Tier | Model | `model_reasoning_effort` |
|------|-------|--------------------------|
| Orchestrator (parent session) | `gpt-6.2-sol` | `xhigh` |
| Judgment | `gpt-6.2-sol` | `high` |
| Craft | `gpt-6.2-sol` | `medium` |
| Hands | `gpt-6-luna` | `high` |

`gpt-6-luna` on `high` is not a contradiction. Luna is the small fast model;
OpenAI's guidance is to start it at `high` because its cheap tier is weaker than
Sol's. Effort levels are not comparable across models — read the pair, never the
word alone.

Set the model names to whatever your plan actually serves; `/penny-doctor` reads
them back rather than assuming. The tier *shape* is the portable part.

### What a Codex agent file cannot override

`sandbox_mode`, `approval_policy`, `model_provider`, and `mcp_servers` always
come from the parent session. A read-only agent is read-only because its
`developer_instructions` say so, not because the file sandboxes it — so the
instruction has to be explicit, and the orchestrator has to assume it can be
ignored. Never rely on a Codex agent file for a security boundary.

---

## 3. The tier is a property of the task, not the phase

The table maps phases to tiers because that is the common case, not because
phases have inherent cost. Re-tier when the task shape changes:

| Task shape | Tier |
|------------|------|
| "Find every caller of X" | Hands |
| "Run the suite and tell me what failed" | Hands |
| "Write the code to make these tests pass" | Craft |
| "These tests pass but the design is wrong — why?" | Judgment |
| "Should this be one service or two?" | Orchestrator |

The signal: **does the answer require weighing things the brief does not already
state?** If no, it is Hands or Craft. If yes, it is Judgment or above.

---

## 4. Cost control that is not model choice

Model routing is second-order. Per-turn context size dominates. In order of
effect:

1. **Keep verbose output out of the orchestrator.** This is what the loop and
   the council are *for*. A subagent's 40k-token test run becomes a 3-line
   report.
2. **Cap the context each agent starts with** (`omitClaudeMd`, tight `tools`).
3. **Filter tool output before it is context** — the `PreToolUse` hook in
   `hooks/filter-tool-output.py`. A 10k-line log becomes ~100 lines, and the
   ones you never see are never billed.
4. **Then** route models.

A Haiku agent carrying 150k tokens of context costs more than a Sonnet agent
carrying 8k. Fix the context first; `/miser-audit` ranks the sinks.
