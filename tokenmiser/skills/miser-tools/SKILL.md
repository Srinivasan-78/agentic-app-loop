---
name: miser-tools
description: Cut the per-session tool tax — audit MCP servers, prefer CLI over MCP, compress or defer tool schemas, and design aggregation tools that return summaries instead of raw records. Use for "MCP eating context", "too many tools", "reduce tool definitions".
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌‌​‌‌‌‌​‌​​‌​‌‌​​‌‌‌​​‌​‌‌​‌‌​‌​‌​​​‌​​​‌‌‌​​‌‌​​‌‌​​​‌​‌‌‌​‌​‌​​‌​‌‌​‌​‌‌​‌‌‌​​​‌‌‌​​​​‌‌‌​‌​‌​‌​​‌‌‌​​‌‌‌​​‌‌​‌​‌​‌​‌​‌​​‌‌​‌​‌‌​‌​‌​​​‌‌​‌​‌​​‌‌​‌​​​‌‌‌‌​‌​​​‌‌‌​​​​‌​‌​‌​​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.oK9mDs1u-n8uNsUMj54z8T
-->

# miser-tools

Tool schemas are charged before the user types anything. A single large MCP server costs 10-17k tokens of definitions; pathological setups exceed 55k, and schemas can occupy 40-50% of the window.

## 1. Audit

```bash
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.claude.json')));print('\n'.join((d.get('mcpServers') or {}).keys()))"
```
In session: `/context` (what tools cost now), `/mcp` (enable/disable), `/usage` (which servers actually got used). Before installing a plugin, `/plugin browse` shows its projected context cost per-turn and per-invocation (Claude Code 2.1.x) — read it, a plugin that bundles MCP servers can cost 10k+ tokens.

Decide per server: used in the last month? If no, disable. If rarely, disable and re-enable on demand.

## 2. Tool Search Tool — native deferral

Claude Code ships a `ToolSearch` mechanism: when MCP tool definitions exceed ~10k tokens it sets `defer_loading: true` on most schemas and hands the model one search tool instead. The model queries for tools by keyword or `select:<name>`, and only the 3-5 it needs (~3k tokens) load per turn. Reported ~85% tool-token reduction; Opus 4.5 MCP-eval accuracy rose 79.5 -> 88.1% with it on.

- Enable with `ENABLE_TOOL_SEARCH`; force standard mode with `DISABLE_EXPERIMENTAL_BETAS`.
- Keep your 3-5 most-used tools non-deferred via `alwaysLoad` so they stay in the cached prefix.
- Deferred tools are not in the cached prefix — the expansion happens inline later, so caching breakpoints survive.
- Skip it when you have under ~10 tools, every tool fires every turn, or total definitions are under ~100 tokens. Standard calling is cheaper there.

## 3. Prefer CLI over MCP

`gh`, `aws`, `gcloud`, `stripe`, `psql`, `sentry-cli` cost **zero** per-session listing — the agent already has Bash. An MCP server for the same capability charges every session whether used or not. Keep MCP for: no CLI exists, auth is impossible from the shell, or the server returns pre-aggregated data a CLI cannot.

## 4. Shrink the schemas you keep

- **Minify**: strip descriptions to one line, drop enum documentation and examples, dedupe repeated shapes via `$ref` (~40% per tool).
- **Deferred loading**: keep tool definitions out of context until first use (Claude Code defers MCP tools by default — do not turn that off). See §2.
- **Progressive disclosure**: expose a `describe_tools` catalog tool; load a full schema only when the model commits to that tool. Costs one extra round trip, saves the whole catalog.
- **Compressing proxy**: wrap an existing server with an open-source MCP compressor (reported 70-97% description reduction, call signatures unchanged).

## 5. Code execution over tool calls

For large tool libraries, let the model write code that calls the tools in a sandbox instead of calling each tool directly. Search, filtering, and joins happen in the execution environment; only the final result re-enters context. Anthropic's reported case: 150k tokens of upfront tool definitions -> ~2k (98.7%), by discovering and loading tool wrappers on demand like a filesystem rather than front-loading every schema.

- Applies to code you build (Programmatic Tool Use beta) and, indirectly, to any MCP server fronted this way.
- Not worth the sandbox and the extra round trips under ~10 tools or when responses are already small.

## 6. Design tools that return less

For servers you own:
- Aggregate server-side: `get_sales_summary_by_region(period)` not `get_all_sales_records()`.
- Collapse a whole API into 2-3 tools — `search`, `introspect`, `execute` — with the schema as an on-demand catalog, rather than one tool per endpoint (the GraphQL-MCP pattern).
- Default to compact output; make verbosity opt-in (`fields=[...]`, `limit`, `since`).
- For uniform tabular results, a compact encoding (TOON, CSV) runs ~40% fewer tokens than JSON at matched accuracy — see `/miser-api`. Not for nested or non-uniform data.
- Return IDs plus a summary, with a second call to fetch a specific record.
- Paginate with a hard default cap; never return an unbounded list.
- Error responses: one line and a code, not a stack trace.

## 7. Check the result

Run `/context` before and after. Expect the tools row to drop; if it does not, the server is not actually disabled.
