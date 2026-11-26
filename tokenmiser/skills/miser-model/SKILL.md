---
name: miser-model
description: Route each task to the cheapest model and reasoning effort that still gets it right, and control thinking-token spend. Use for "which model should I use", "reduce thinking tokens", "cut cost without losing quality".
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌‌‌‌​​‌​‌​​​‌​​​‌​​‌​‌​​‌​‌​​​‌​‌‌‌​​​​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​‌‌‌​​‌​​‌‌​​​‌‌​‌‌​‌​‌​​​‌‌​‌​‌​‌​​‌‌​‌​‌​​‌‌‌‌​​‌‌​​‌​​‌​‌​‌‌‌​‌‌‌​​​​​‌​​‌​​‌​‌‌‌​‌​‌​‌​​‌​​‌​‌‌​​​‌‌​‌‌‌‌​​​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.yDJQpcomrcj5MO2WpIuIcx
-->

# miser-model

Running the largest model at the highest effort on everything is the single most expensive habit. Thinking tokens are billed as output.

## Routing table

| Work | Model | Effort |
|------|-------|--------|
| Mechanical: rename, format, boilerplate, file locating, log triage | Haiku | low |
| Ordinary implementation, tests, review, refactor | Sonnet | medium |
| Architecture, subtle debugging, multi-constraint reasoning, security analysis | Opus | high |

Apply it: `/model` to switch mid-session, `/config` for the default, `model: haiku` in a subagent definition, `CLAUDE_CODE_SUBAGENT_MODEL` for the fleet.

Switching models mid-session changes the prefix and can cost a cache miss — switch at task boundaries, not per message.

Tokenizers differ across model families: the same text can tokenize ~35% larger on a newer model (reported for the Opus 4.7 tokenizer). Per-token price unchanged, effective per-request cost is not — benchmark a real task before migrating, do not assume a like-for-like swap.

## Thinking budget

- `/effort low|medium|high` is the primary control. Drop to low for mechanical work. Current models show the active effort level in the statusline (Claude Code 2.1.119+).
- `MAX_THINKING_TOKENS=8000` caps fixed-budget models. Adaptive-reasoning models ignore a nonzero budget — use effort there.
- Turn thinking off in `/config` for repetitive edit loops (not available on models that always think).
- Reported: dynamic thinking budgets cut thinking spend 50-75% with little quality loss on routine tasks.

Measure the share, do not guess:

```bash
node "$MISER/scripts/miser-bench.mjs" report --since 7d   # "thinking share of output"
```
Over ~35% on routine work means the effort level is wrong for what you do most.

## Escalate, do not start high

Begin at the cheap tier. Escalate when the cheap model actually fails — two failed cheap attempts still usually cost less than one expensive session. Exception: anything where a wrong answer is expensive to discover later (schema migrations, auth, money).

## Do not micro-optimize

Model choice is second-order to context size. A Haiku call carrying 150k tokens of context beats no budget. Fix per-turn input first (`/miser-audit`), then route.
