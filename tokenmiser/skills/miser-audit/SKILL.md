---
name: miser-audit
description: Find what silently eats context every session — oversized CLAUDE.md, skill/plugin listings, MCP schemas, memory, settings, stale sessions — and produce a ranked prune list with token estimates. Use for "what's eating my context", "audit token usage", "why is my context so big".
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌‌​‌​​​​‌‌​​​‌​​‌​​‌​​​​‌‌‌​​‌​​‌​‌‌‌‌‌​‌​​‌​​‌​‌​‌​‌‌​​‌‌‌​​‌​​‌​‌​‌​​​‌​​‌​​​​‌​​‌‌​‌​‌​​​‌‌‌​‌​‌​‌‌​​‌​​‌‌​​​‌‌‌​‌‌​​‌​‌​‌‌‌​​‌​‌‌​‌​‌​​‌‌‌​​‌​‌​​​‌​‌‌​​​‌​​‌‌​​​‌‌​‌​‌​​‌‌⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.hbHr_IVrTHMGVLvW-NQbcS
-->

# miser-audit

Diagnose before changing anything. Read-only; propose, do not apply.

## 1. Always-on load

```bash
bash "$MISER/scripts/context-report.sh"
```
Plus, in session, `/context` (live breakdown: system prompt, tools, MCP, memory, messages) and `/usage` (attribution to skills, subagents, plugins, MCP servers, plus behavior flags such as long context or cache misses). `/cost` adds prompt-cache hit ratio, miss count, and the likely cause of the last miss (Claude Code 2.1.251+ / 2.1.260+). `/plugin browse` shows each plugin's projected context cost before you install it.

## 2. Per-turn cost

```bash
node "$MISER/scripts/miser-bench.mjs" report --since 7d
node "$MISER/scripts/miser-bench.mjs" session latest
```
Read three numbers:
- **eff input/turn** — context size per request. The dominant term; everything below is about shrinking it.
- **cache read share** — under ~80% means cache misses (gaps > TTL, or an edited prefix). See `/miser-session`.
- **thinking share of output** — over ~35% on routine work means the effort level is too high. See `/miser-model`.

## 3. Rank the sinks

Score each candidate `tokens x sessions_hit` and sort:

| Sink | Check | Typical fix |
|------|-------|-------------|
| CLAUDE.md / AGENTS.md | `wc -l` > 200 | `/miser-compress`, move workflows to skills — right-size, do not delete: a study found a present AGENTS.md cut median runtime ~29% and output tokens ~17% by sparing the agent exploratory navigation |
| memory index | MEMORY.md line count | prune stale, one line each |
| skill listing | N skills x ~100 tokens | uninstall unused plugins/skills |
| MCP servers | `/context` MCP row | disable, or use CLI (`/miser-tools`) |
| tool results | biggest Bash outputs in the log | filter hook (`/miser-hooks`) |
| file reads | Read calls in `session latest` | grep + line ranges (`/miser-read`) |
| history | long single session | `/clear` + handoff (`/miser-session`) |
| subagents | `/usage` attribution | bounded contracts (`/miser-delegate`) |

Find the fattest tool results directly:

```bash
python3 - <<'PY'
import json,glob,os
f=max(glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl')),key=os.path.getmtime)
rows=[]
for line in open(f):
    try: o=json.loads(line)
    except: continue
    c=(o.get('message') or {}).get('content')
    if isinstance(c,list):
        for b in c:
            if b.get('type')=='tool_result':
                t=b.get('content')
                s=t if isinstance(t,str) else json.dumps(t)
                rows.append((len(s)//4,(b.get('tool_use_id') or '')[:8]))
rows.sort(reverse=True)
print(f"{sum(r[0] for r in rows):,} est tokens in tool results; top 10:")
for t,i in rows[:10]: print(f"  ~{t:>7,} tok  {i}")
PY
```

## 4. Output

One table, most expensive first, each row: sink, estimated tokens/session, fix, which skill applies it, and effort. No changes without approval. End with the single highest-value action.
