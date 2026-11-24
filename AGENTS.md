# Repo rules

This repo **is** Pennywright — a plugin for coding agents. Almost every file here
is an instruction another agent will read and follow, not code that runs. That
changes what "correct" means, so read this before editing.

## What this repo ships

| Path | What it is |
|------|------------|
| `skills/penny/` | the front door: classify a request, sharpen it, route it |
| `skills/penny-build/` | the 7-phase build loop + phase contracts |
| `skills/penny-council/` | the five mandates + the council protocol |
| `skills/penny-kit/` | setup, doctor, and the model policy |
| `skills/miser-*/` | 14 token skills, vendored from tokenmiser |
| `agents/` | 14 Claude subagent definitions |
| `codex/agents/` | the same 14, mirrored as Codex `.toml` |
| `commands/` | 7 slash commands |
| `scripts/`, `hooks/`, `reference/` | the executable substrate the skills call |
| `tools/audit.mjs` | maintainer consistency check — run it before committing |

## Hard rules

**`skills/penny-kit/references/model-policy.md` is the single source of truth for
models and effort.** Do not write a model or effort value anywhere else without
reading it first, and do not invent a tier. If you change a tier, change it there
and in every affected `agents/*.md` and `codex/agents/*.toml` in the same commit.

**No subagent runs on Opus.** If one seems to need it, the brief was too vague —
tighten the brief, not the tier.

**A Codex agent file sets `model` and `model_reasoning_effort` together, or
neither.** Codex resolves them independently, so setting only `model` leaves the
effort resolving from the `[agents]` default or the parent session — and a
cheap-model agent silently inherits the orchestrator's `xhigh`.

**Never add a header or watermark to `skills/*/templates/`.** Those files are
copied verbatim into the user's own repo, so anything in them lands in their
project.

**This repo ships no build and no dependencies — keep it that way.** It is
prose, frontmatter, three bundled scripts the skills invoke, and one maintainer
audit (`tools/audit.mjs`). If you find yourself adding a `package.json`, a CI
workflow, or a Node CLI, check first whether a skill already instructs the agent
to do the same thing: it almost certainly does, and duplicated capability drifts
out of sync. That is exactly why the old installer was removed.

**Changing a count means changing it in two places.** The skill, agent and
command counts appear in `skills/penny-kit/SKILL.md` (the help index) and
`skills/penny-kit/references/doctor-checks.md` (checks B10/B11). Grep for the
old number before you commit.

## Writing instructions for agents

The product is prose that another model has to act on, so:

- **Say why, not just what.** An agent that knows the reason for a rule applies
  it correctly in a case the rule did not anticipate. An agent given a bare rule
  games it.
- **Name the failure mode.** "Do not read the whole state file" is weak; "it
  grows every iteration, so by iteration 3 reading it whole costs more than the
  phase did" is followed.
- **Keep the caps numeric.** Word caps, turn caps, line caps. "Be concise" is not
  a cap.
- **Be honest about cost in the user-facing text.** A council is ~11 agent runs.
  18 skills cost ~1.8k tokens every session. `hide_agent_reasoning` saves no
  tokens. If a lever does not pay on a small repo, say so. Overselling this kit
  is the one failure the tests cannot catch.
- **Verify platform facts before writing them down.** Model names, config keys,
  frontmatter fields and effort levels all move. Check the live docs rather than
  recalling them — a confidently wrong config key is worse than an omission,
  because it looks installed and does nothing.

## Before you commit

```bash
node tools/audit.mjs
```

Exits 0 when clean, 1 with a grouped report otherwise. It is the only piece of
tooling in the repo and it checks the things that are invisible at a glance and
make the kit quietly worse rather than loudly broken:

- **Skills** — frontmatter valid, `name` matches the directory (a mismatch stops
  the skill loading), description present and the right length to route on.
- **Agents** — every field is in the real subagent schema, a model is pinned and
  is never Opus, Sonnet carries an effort and Haiku does not, `maxTurns` and a
  `tools` allowlist are set, `scout-agent` has no write tool.
- **Codex agents** — the three required fields, `model` and
  `model_reasoning_effort` pinned together, balanced `"""` blocks, and no
  agent-defining key after a `[table]` header (TOML would reparent it).
- **Tier coherence** — the tier tables in `model-policy.md` and the README agree
  with each other and with every agent's actual pins.
- **References** — every `references/…`, repo-relative path and markdown link
  resolves; every agent and `/command` named in prose exists; README
  table-of-contents anchors match real headings.
- **Completeness** — every agent is reachable from some skill or command, every
  skill appears in the indexes that claim to list it, every documented count
  matches reality.
- **Stale identifiers, manifests, hygiene** — pre-rename names, deleted paths,
  invalid JSON, CRLF, trailing whitespace, unresolved markers, and any header
  that crept into `skills/*/templates/`.

A reference path that does not resolve is the worst failure in this design: the
subagent spawns anyway and runs with no contract at all.

Adding an agent means adding it to `TIER_OF` in the audit. It reports an unknown
agent rather than passing silently, so you will be told.

## Vendored code

`skills/miser-*`, `scripts/`, `hooks/` and `reference/` come from
[tokenmiser](https://github.com/Srinivasan-78/tokenmiser). Fix bugs upstream and
re-vendor where practical, so the standalone product and this bundle do not
diverge. Where this repo intentionally differs from upstream, keep the reason in
the text so it is not "corrected" back. The two deliberate divergences:

- **The stale `MAX_THINKING_TOKENS` advice is dropped.** Adaptive-reasoning
  models ignore the number, so setting it reads as a working budget cap while
  capping nothing. Effort is the control.
- **`miser-setup` is not vendored.** It duplicated `penny-kit`'s setup step for
  step, knew nothing about the subagent tier env vars, and still recommended
  `MAX_THINKING_TOKENS: 8000` — a setting `/penny-doctor` flags as a warning, so
  the kit would have installed something its own doctor complains about. Do not
  re-add it; extend `skills/penny-kit/references/claude-setup.md` instead.
