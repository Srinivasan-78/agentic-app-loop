---
description: Answer one bounded question about the codebase in a cheap throwaway context
argument-hint: <the question — where is X, every caller of Y, does this repo do Z>
---

Spawn `scout-agent` with the Agent tool to answer this, and nothing else:

$ARGUMENTS

Write the brief with all four bounds — an unbounded scout returns an essay and
costs more than reading the file yourself:

```
Scope: <exact paths or globs. What not to read.>
Question: <one question, answerable in a fixed shape>
Return: <max N lines, `path:line — what`. No code blocks, no fixes.>
Stop: <the condition that ends the search>
```

Then report the scout's answer to the user as it came back. Do not re-read the
files it looked at to double-check — that spends the context the scout existed
to save. If its answer is genuinely insufficient, send it back with a tighter
scope rather than doing the work in the main thread.

If the question needs one or two known files, skip the scout and just read them.
Agent startup costs more than a small read.
