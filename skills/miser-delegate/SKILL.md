---
name: miser-delegate
description: Decide when a subagent actually saves tokens and write the bounded contract that makes it pay off — verbose work stays isolated, only a compressed summary returns. Use for "should I use a subagent", "delegate this", "save context on exploration".
---

# miser-delegate

A subagent has its own context window: its file reads and tool output never enter the main conversation, only the final report does. That is the saving — and it is not automatic.

## Spawn when

- The work needs more than ~4 large file reads or a wide search across the repo.
- Output is voluminous and mostly discardable: test suites, log processing, dependency audits, doc fetching.
- The answer compresses well: a file:line list, a yes/no with evidence, a short findings table.

## Do NOT spawn when

- One or two known files — just read them.
- A single shell command, a git operation, a one-line edit. Agent startup (system prompt, tools, CLAUDE.md, skill listing) costs more than the task.
- The main thread needs the raw material anyway to make the next edit.
- You would spawn several agents to answer one question — each re-derives context you already hold, cold.

## The contract (this is where the savings live)

Every spawn prompt states four things:

1. **Scope** — exact paths or globs. "Only `src/auth/**`. Do not read tests."
2. **Question** — one question, answerable in a fixed shape.
3. **Return format** — bounded. "Max 15 lines, `path:line — what`. No code blocks. No suggestions."
4. **Stop condition** — "Stop as soon as the caller is found."

Example:

```
Scope: src/payments/**, no tests, no node_modules.
Question: every place the Stripe secret key is read.
Return: max 12 lines, `path:line — expression`. No fixes, no explanation.
Stop: after the last match.
```

Unbounded prompts ("investigate the payments module") return essays and can cost more than doing it inline.

## Model per agent

Mechanical search and locate: Haiku. Ordinary implementation and review: Sonnet. Reserve Opus for the reasoning the main thread does. Set it per subagent config or `CLAUDE_CODE_SUBAGENT_MODEL`.

## Agent teams

Each teammate is a full instance with its own window — roughly 7x tokens when teammates run in plan mode. Keep teams to 2-3, spawn prompts short (teammates load CLAUDE.md, skills, and MCP on their own), and shut teammates down when their piece is finished.

## After the run

If the returned report is longer than what you would have read yourself, the contract was too loose. Tighten the return format next time; note it in the repo's CLAUDE.md.
