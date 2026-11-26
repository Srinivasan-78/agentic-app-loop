---
name: miser-help
description: Index of the tokenmiser skills — what each one does, which token lever it pulls, and the order to apply them. Use for "tokenmiser help", "what token skills do I have", "where do I start saving tokens".
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌​​‌‌​​​‌‌​​‌​‌​‌‌​​‌​‌​‌​​​‌‌‌​‌‌‌‌​​‌​‌‌‌​‌​​​‌‌​​‌‌‌​‌​​‌‌​‌​‌​‌​​‌​​‌‌‌​​​​​‌‌​‌‌‌​​‌​​‌‌‌‌​‌​‌‌‌‌‌​‌‌‌‌​​​​‌​​‌​​‌​‌‌​​‌​‌​‌‌​​​​‌​‌​​​​​‌​‌‌​‌‌​‌​‌‌‌‌​​‌​​‌‌‌​​​​​‌‌​‌‌​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.LeeGytgMRpnO_xIeaAmy86
-->

# tokenmiser

`why use many token when few do trick` — applied to the whole context, not just the output.

## Install / manage

```bash
npx tokenmiser@latest install          # all skills into ~/.claude/skills
npx tokenmiser install --project       # or into ./.claude/skills for this repo
npx tokenmiser install --hook          # plus the tool-output filter hook
npx tokenmiser status                  # what is installed, and its token cost
```
Set `MISER` to the package root so the skills can call the scripts (`npx tokenmiser install` prints the line).

## Skills

| Skill | Lever | Run it when |
|-------|-------|-------------|
| `/miser-setup` | install everything | first time, or on a new machine/repo |
| `/miser-audit` | diagnose | "why is my context so big" |
| `/miser-bench` | measure | before and after any change |
| `/miser-speak` | output tokens | always on; terse responses |
| `/miser-compress` | always-on input | CLAUDE.md or memory file is fat |
| `/miser-session` | history per turn | context filling, cache misses, long sessions |
| `/miser-read` | file reads | exploring a codebase |
| `/miser-tools` | tool schemas | MCP servers eating context; tool-search, code-execution |
| `/miser-delegate` | isolation | wide exploration, verbose output |
| `/miser-model` | model + thinking | cost per turn too high for the task |
| `/miser-prompt` | scope | requests trigger big scans |
| `/miser-hooks` | pre-context filtering | logs, tests, builds are noisy |
| `/miser-git` | commit + review | writing commits, reviewing diffs |
| `/miser-api` | your own code | building an agent or pipeline |

## Order that pays

1. `/miser-bench baseline` — know the number.
2. `/miser-audit` — find the fattest sink.
3. `/miser-setup` — hook, env, CLAUDE.md diet, MCP prune.
4. `/miser-speak full` — output side.
5. Habits: `/miser-session`, `/miser-read`, `/miser-prompt`.
6. `/miser-bench compare` — prove it.

## Where the tokens actually go

Per-turn cost = always-on context (CLAUDE.md + skills + tools + MCP) + conversation history + tool results + output. History and tool results usually dominate; the always-on block is what you pay on *every* session, so it is the cheapest to fix once.

## Cost of this toolkit

Each installed skill advertises ~100 tokens of name and description every session. 15 skills ~= 1.5k tokens. Uninstall the ones you never fire (delete the directory or disable the plugin); the catalog in `reference/techniques.md` stays readable either way.
