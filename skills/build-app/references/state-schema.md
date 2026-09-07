# BUILD_STATE.md schema

One file per build run, living at the root of the working repo. It is the only
data channel between phases. Keep sections append-mostly; never delete another
phase's section.

## Header

```
# Build State

Status: PLAN | TEST | IMPLEMENT | REVIEW | VERIFY | REMEMBER | IMPROVE | DONE | BLOCKED
Iteration: <int>
Scenario: greenfield | feature | bugfix | refactor | spike
Baseline: <git sha or "empty repo" — recorded at Step 0 so REVIEW/VERIFY can diff>
Started: <ISO date>
```

## Sections (in order)

- `## Request` — user's ask verbatim + orchestrator's scenario call.
- `## Plan` — see contract 1.
- `## Tests` — see contract 2.
- `## Implement` — see contract 3. Appended per iteration with an `### Iteration N` subheading.
- `## Review` — see contract 4. Appended per iteration.
- `## Verify` — see contract 5. Appended per iteration.
- `## Remember` — see contract 6.
- `## Improve` — see contract 7.
- `## Loop log` — one line per phase transition and loop-back:
  `2026-09-07 IMPLEMENT→REVIEW iter2` / `REVIEW→IMPLEMENT iter2: 2 blocking (null deref, missing authz)`.

## Rules

- A subagent edits only its own section (plus `## Loop log` and the header
  `Status` / `Iteration`).
- Verbose evidence (full logs, long diffs) goes here, not into chat or the
  subagent's report.
- If the file passes ~1500 lines, older `### Iteration` blocks may be collapsed
  to their summary line by the orchestrator.
