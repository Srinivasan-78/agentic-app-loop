---
name: miser-session
description: Session hygiene that controls per-turn cost — when to /clear vs /compact, handoff files, prompt-cache TTL and cache misses, plan mode, and scheduled-task and idle-turn discipline. Use for "context is full", "session getting expensive", "should I clear or compact".
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​​‌‌​‌​​​‌​‌​‌‌​​‌​​​‌​​​‌​‌​​​‌​‌‌​‌‌‌‌​‌‌‌​‌​‌​‌​‌‌​​​​‌‌​​‌​​​‌‌​​‌‌​​‌​​‌​‌​​‌​​​‌​‌​‌‌‌​‌‌​​‌‌​‌‌‌‌​‌​​‌‌​‌​​‌‌​‌‌‌​‌‌​‌​​‌​‌​‌‌​​‌​‌‌​‌‌‌‌​‌‌​​‌​‌​‌​​‌​‌‌​​‌‌​‌‌​​‌​‌‌‌‌‌⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.4VDQouXdfJEvoM7iYoeK6_
-->

# miser-session

Every request re-sends the whole conversation. Per-turn cost is set by history size, and history only grows.

## /clear vs /compact

| Situation | Action | Why |
|-----------|--------|-----|
| Switching to unrelated work | `/clear` | Costs nothing. Stale context is charged on every later message. |
| Same task, context nearly full | `/compact <focus>` | Keeps continuity. Note: compaction reads the whole conversation, so it is itself an expensive request. |
| Long task, natural checkpoint | handoff file, then `/clear` | Cheapest continuity. |
| Might need this session later | `/rename` then `/clear`, `/resume` to return | Findable without carrying it. |

Custom compaction focus: `/compact Focus on the failing test and the files changed`. Or set persistent instructions in CLAUDE.md under a `# Compact instructions` heading.

Re-seed after a compaction instead of letting it drop context you need: a `SessionStart` hook with `source: compact`, or a `PostCompact` hook, injects a short brief (open files, next step) once — cheaper than the model re-deriving it over the next few turns. See `/miser-hooks`.

## Handoff file

Before `/clear` on unfinished work, write `.claude/session-handoff.md`:

```markdown
Goal: <one line>
Done: <files changed, decisions made>
Next: <exact next step>
Constraints: <what not to touch>
Open questions: <blockers>
```
Next session reads one small file instead of inheriting 100k tokens of history.

## Prompt cache

Context is re-read at the cached rate — cheap, but only on a hit. Misses reprocess everything at full price.

- Cache lifetime is an hour on a subscription, five minutes on API keys, cloud providers, or once drawing on usage credits. A first message after a longer gap is a full-price re-read.
- Anything that mutates the prefix (editing CLAUDE.md, toggling MCP servers, changing the model mid-session) invalidates the cache. Batch those changes; do not toggle mid-task.
- Long idle sessions: prefer `/clear` over leaving a large context parked, then resume from a summary if offered.
- Do not schedule wakeups purely to keep a cache warm — the wakeup costs a full-context request.

Check with `node "$MISER/scripts/miser-bench.mjs" session latest` — cache read share under ~80% means misses. In session, `/cost` reports the hit ratio, miss count, re-cached tokens, and warm/cold state (Claude Code 2.1.251+), and names the likely cause of the last miss — e.g. "tool definitions changed" (2.1.260+). A statusline script can read the same from the `prompt_cache` and `current_usage` objects to watch it live.

## Plan mode

Shift+Tab to plan mode for anything non-trivial. Read-only exploration and an approved plan prevent the expensive failure: implementing the wrong thing, then re-reading and undoing it.

## Course-correct early

Escape the moment the direction is wrong. `/rewind` or double-Escape restores conversation and code to a checkpoint instead of paying to unwind it in-context.

## Idle turns that cost full context

- Scheduled tasks (`/loop`) fire on their interval and resend the whole context — long intervals, and stop loops you are not watching.
- Cross-session messages are delivered as new turns; `crossSessionInbound: hold` stops that.
- Goal check-ins run while background work waits; `CLAUDE_CODE_GOAL_CHECKIN_MINUTES=0` disables them.
