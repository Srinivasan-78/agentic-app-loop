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
| `skills/miser-*/` | 15 token skills, vendored from tokenmiser |
| `agents/` | 14 Claude subagent definitions |
| `codex/agents/` | the same 14, mirrored as Codex `.toml` |
| `commands/` | 7 slash commands |
| `scripts/`, `hooks/`, `reference/` | the executable substrate the skills call |

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

**This repo ships no build, no tests, and no dependencies — keep it that way.**
It is prose, frontmatter and three bundled scripts. If you find yourself adding
a `package.json`, a CI workflow, or a Node CLI, check first whether a skill
already instructs the agent to do the same thing: it almost certainly does, and
duplicated capability drifts out of sync.

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
  19 skills cost ~1.9k tokens every session. `hide_agent_reasoning` saves no
  tokens. If a lever does not pay on a small repo, say so. Overselling this kit
  is the one failure the tests cannot catch.
- **Verify platform facts before writing them down.** Model names, config keys,
  frontmatter fields and effort levels all move. Check the live docs rather than
  recalling them — a confidently wrong config key is worse than an omission,
  because it looks installed and does nothing.

## Before you commit

There is no test runner. Check these by hand — they are the things that break
the plugin at load time or silently undo the model policy:

```bash
# 1. every skill's frontmatter `name` matches its directory name
for d in skills/*/; do n=$(sed -n 's/^name: //p' "$d/SKILL.md" | head -1);   [ "$n" = "$(basename "$d")" ] || echo "MISMATCH $d -> $n"; done

# 2. every Claude agent pins a model, and none is opus
grep -L '^model: \(sonnet\|haiku\)$' agents/*.md

# 3. every Codex agent pins model AND effort (half-pins inherit the parent)
for f in codex/agents/*.toml; do m=$(grep -c '^model =' "$f");   e=$(grep -c '^model_reasoning_effort =' "$f");   [ "$m" = "$e" ] || echo "HALF-PINNED $f"; done

# 4. no reference points at a file that does not exist
grep -rho '`\(references\|templates\)/[^`]*`' skills | tr -d '`' | sort -u

# 5. counts still match the help index and doctor-checks
ls skills | wc -l; ls agents | wc -l; ls commands | wc -l; ls codex/agents | wc -l
```

A contract path that does not resolve is the worst failure in the design: the
subagent spawns anyway and runs with no contract at all.

## Vendored code

`skills/miser-*`, `scripts/`, `hooks/` and `reference/` come from
[tokenmiser](https://github.com/Srinivasan-78/tokenmiser). Fix bugs upstream and
re-vendor where practical, so the standalone product and this bundle do not
diverge. Where this repo intentionally differs from upstream — for example
dropping the stale `MAX_THINKING_TOKENS` advice, which adaptive-reasoning models
ignore — keep the reason in the text so it is not "corrected" back.
