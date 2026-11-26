---
name: miser-prompt
description: Shape requests so the agent does less work for the same result — specific targets, explicit output caps, verification criteria, and batched asks. Use for "how do I prompt to save tokens", "my requests trigger huge scans".
---

# miser-prompt

The prompt sets how much the agent reads and writes. Cheapest change in the whole toolkit — it costs nothing to apply.

## Name the target

Vague requests trigger repo-wide scanning.

- No: "improve this codebase" / "check if the auth is okay"
- Yes: "add input validation to `login()` in `src/auth.ts`; reject empty email"

If you know the file, say the file. If you know the function, say the function. If you know the fix, say the fix and ask for review of it.

## Cap the output in the request

- "Answer in max 5 bullets."
- "Show the diff only, no explanation."
- "Reply with `path:line` list, nothing else."
- "No summary at the end."

Explicit length constraints cut output tokens 50-80% on structured tasks.

## Give a verification target

Ship the acceptance test with the request: expected output, a failing test name, an error string, a screenshot. The agent checks its own work instead of a review round trip. Every avoided round trip saves the whole context once.

## Batch related asks, split unrelated ones

Batch: "Fix the three type errors in `api.ts`" — one context load. Split: unrelated tasks belong in separate sessions (`/clear` between), otherwise task A's history is charged on every turn of task B.

## Say what not to do

- "Do not run the test suite." / "Do not read `dist/`."
- "Do not refactor anything else."
- "Do not write docs or a changelog."

Scope creep is paid for twice: generating it, then carrying it in context.

## Stop early

Escape as soon as the direction is wrong. A wrong path that runs for ten turns costs more than every other lever on this page combined.

## Reusable prompt stubs

If you type the same instructions repeatedly, they belong in a skill or `CLAUDE.md`, not in every message — see `/miser-audit` for which of the two is cheaper for how often it fires.
