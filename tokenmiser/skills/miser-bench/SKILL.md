---
name: miser-bench
description: Measure token usage from session logs and A/B test whether a change actually saved tokens — per-session totals, cache-hit share, thinking share, and baseline diffs. Use for "how many tokens did that use", "did the setup help", "benchmark token savings".
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌​‌​​‌‌​​‌‌​‌​‌​‌‌​‌​​‌​‌​‌​‌‌‌​‌‌​​‌‌‌​‌​‌‌​​​​‌​‌​‌​‌​‌‌‌​‌‌​​​‌​‌‌​‌​‌​​​‌‌​​‌​‌‌​‌​​‌​​​​‌​​‌​​​​​‌​‌‌‌‌​​​​‌‌​‌​‌​​‌‌​‌​​‌​‌‌‌‌​​‌​‌‌​‌‌​‌​‌‌‌​​​‌​‌‌‌​​​‌​‌‌​​‌​‌​​‌‌​​‌​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.S5iWgXUv-FZBAxjiymqqe2
-->

# miser-bench

Nothing in this toolkit is real until it shows up here.

## Commands

```bash
B="$MISER/scripts/miser-bench.mjs"
node "$B" report --since 7d --top 10     # heaviest sessions, totals, ratios
node "$B" report --project . --since 24h # this repo only
node "$B" session latest                 # one session: tools, models, per-turn
node "$B" compare <sessA> <sessB>        # two runs of the same task
node "$B" baseline save pre              # snapshot everything
node "$B" baseline diff pre post         # aggregate before/after
node "$B" report --main-only             # exclude subagent (sidechain) turns
node "$B" baseline list                  # what snapshots exist
node "$B" report --json                  # machine-readable
```
No `MISER` set? `npx tokenmiser report --since 7d` runs the same script.

Usage records are deduplicated by request id — Claude Code writes several log lines per assistant response, and counting them all inflates a session by 2-3x. `session <id>` prints how many were skipped.
In session: `/usage` (attribution to skills, subagents, plugins, MCP; behavior flags), `/context` (live breakdown), `/insights` (habits report), `/cost` (prompt-cache hit ratio, misses, re-cached tokens, warm/cold, and the likely cause of the last miss — Claude Code 2.1.251+ / 2.1.260+).

For a live per-turn readout without leaving the session, a statusline script can read `current_usage` (cache read vs creation this turn) and `prompt_cache` (session hit ratio); `ccusage --statusline`, `ccstatusline`, and `claude-hud` package this.

## The four numbers

| Number | Meaning | Target |
|--------|---------|--------|
| eff input/turn | context size per request; input + cache read + cache write | drive down; dominates everything |
| cache read share | fraction of input served from cache | > 90%; low means misses (`/miser-session`) |
| output/turn | verbosity | lower after `/miser-speak` |
| thinking share of output | reasoning spend | < ~35% on routine work (`/miser-model`) |

Totals across sessions are not a scorecard — a big task legitimately costs more. Compare **per-turn** numbers, or the same task run twice.

## A/B protocol

1. Pick a task you can repeat honestly: a fixed prompt against a fixed commit (`git stash` or a scratch worktree between runs).
2. Run A in a fresh session (`/clear` first), config unchanged. Note the session id from `node "$B" session latest`.
3. Apply exactly one change (the hook, the CLAUDE.md diet, terse mode, a model switch).
4. Run B in a fresh session with the identical prompt.
5. `node "$B" compare <A> <B>`.
6. Record the result in `bench/results.md`: date, change, per-turn delta, and whether the task still succeeded.

Rules: one variable per run, fresh session each time (history skews everything), and record failures — a change that saves 30% of tokens and gets the answer wrong is a loss. Cache state differs between runs, so read `eff input` and `output` separately rather than only the total.

## Guard quality, not just tokens

Token metrics do not show a quality regression. Keep a small fixed set of prompts with known-good answers, replay them after each config change, and diff the output. A cheaper setup that quietly degrades answers is caught here, not in `compare`.

## Reporting

```
change: PreToolUse test-output filter
A 1f2c3d4a  total 1.55M  eff in 1.51M  out 42.0k  turns 28  (58.6k/turn)
B 9ab8c7d6  total 0.98M  eff in 0.95M  out 39.1k  turns 26  (37.7k/turn)
per-turn -35.7%; task result identical (both fixed the failing test)
```
