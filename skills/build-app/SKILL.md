---
name: build-app
description: >-
  Build or extend a real application through a disciplined 7-phase loop —
  PLAN → TEST → IMPLEMENT → REVIEW → VERIFY → REMEMBER → IMPROVE — where each
  phase runs as its own bounded subagent. Use whenever the user asks to build
  an app, add a feature, fix a bug, or refactor and wants it done rigorously
  rather than ad hoc. Triggers: "build an app", "add this feature properly",
  "do this the right way", "use the loop", "TDD this".
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌‌​​‌‌​​‌‌‌​‌​​​‌​‌​​‌​​‌​​​‌‌‌​‌​​‌‌‌​​‌​​‌‌​‌​‌​​​​‌​​‌‌​‌‌​​​‌​​‌‌‌​​‌‌‌​​​​​‌‌​​​‌‌​​‌‌‌​​‌​‌‌​‌​​​​‌‌​​‌​​​‌‌​‌‌‌‌​‌​‌​‌​​​‌​‌​‌‌‌​‌​‌​‌​​​‌‌‌​‌​​​​‌‌​‌‌‌​‌‌‌​​​‌​‌​‌​‌​​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.ftRGNMBlNpc9hdoTWTt7qT
-->

# Build App — the 7-phase agentic loop

You are the **orchestrator**. You do not write feature code, tests, or reviews
yourself. You run the loop, enforce the gates between phases, and keep your own
context small by delegating every verbose activity to a subagent.

Phases, in order:

| # | Phase | Subagent | Gate to pass |
|---|-------|----------|--------------|
| 1 | PLAN | `plan-agent` | Plan has file-level tasks + acceptance criteria + test strategy |
| 2 | TEST | `test-agent` | Tests exist, run, and fail for the stated reason |
| 3 | IMPLEMENT | `implement-agent` | All phase tests pass locally |
| 4 | REVIEW | `review-agent` | Zero unresolved blocking findings |
| 5 | VERIFY | `verify-agent` | Full suite + lint + typecheck + build + smoke all green; acceptance criteria met |
| 6 | REMEMBER | `remember-agent` | Durable notes written to project memory |
| 7 | IMPROVE | `improve-agent` | Retro + backlog written; safe quick wins applied |

## How to run it

### Step 0 — set up the run

1. Confirm the working repo (the app being built), not this skill's repo.
2. Copy `templates/BUILD_STATE.md` from this skill into the working repo at
   `./BUILD_STATE.md` if it does not already exist. This file is the **only**
   channel between phases — each subagent reads it for input and writes its
   section for output. It keeps orchestrator context lean.
3. Fill the `## Request` section with the user's ask, verbatim, plus the
   scenario you detect (see Scenarios below).
4. Set `Status: PLAN` and `Iteration: 1`.

### Step 1..7 — run each phase

For each phase, spawn its subagent with the Agent tool. The prompt you give the
subagent is always the same shape:

```
Working repo: <abs path>
State file: <abs path>/BUILD_STATE.md
Phase: <PHASE NAME>
Your contract is in references/phase-contracts.md of the build-app skill.
Read BUILD_STATE.md, do your phase, write your section, set the next Status,
and report back only: PASS or BLOCKED + a 3-line summary.
```

Wait for the subagent to finish. Then:

- Read **only** the relevant section of `BUILD_STATE.md` (not the whole file if
  it has grown large).
- Apply the gate for that phase.
- If the gate passes, advance `Status` to the next phase and continue.
- If the gate fails, follow the loop-back rules.

Do not skip a phase. If a phase is genuinely not applicable (e.g. REMEMBER for a
throwaway spike), record why in its section and move on — do not silently omit.

## Loop-back rules

| Situation | Action |
|-----------|--------|
| REVIEW returns blocking findings | Back to IMPLEMENT with the findings. `Iteration += 1`. |
| VERIFY fails on a test/impl bug | Back to IMPLEMENT. `Iteration += 1`. |
| VERIFY fails because a requirement was wrong/missing | Back to PLAN. Reset iteration, note the cause. |
| IMPLEMENT cannot make a test pass because the test is wrong | Back to TEST with the reason, then IMPLEMENT. |
| Iteration reaches 4 without reaching VERIFY green | Stop. Summarize the blocker for the user and ask how to proceed. |

Every loop-back is appended to `## Loop log` in the state file with a one-line
reason, so IMPROVE can see where the loop thrashed.

## Scenarios — the loop adapts, it does not change shape

- **Greenfield app**: PLAN also picks the stack, scaffolds the project layout,
  and defines the first vertical slice. TEST bootstraps the test runner.
- **New feature in an existing app**: PLAN maps the change onto existing
  modules and conventions first (read before proposing). TEST extends existing
  suites.
- **Bug fix**: TEST writes a regression test that reproduces the bug and fails.
  IMPLEMENT makes it pass without breaking neighbors. REVIEW checks the fix is
  root-cause, not a patch over the symptom.
- **Refactor / tech debt**: TEST asserts current behavior is preserved
  (characterization tests) before IMPLEMENT changes structure. VERIFY diffs
  behavior, not just green checks.
- **Spike / throwaway**: run PLAN → IMPLEMENT → REMEMBER only, and say so in the
  state file. The other phases are explicitly waived.

## Output to the user

After IMPROVE, give the user a short report: what shipped, test/verify evidence,
what was remembered, and the top 3 backlog items. Link `BUILD_STATE.md` for the
full trail. Do not paste the whole state file into the chat.

## Files in this skill

- `references/phase-contracts.md` — the exact contract for each phase (what to
  read, do, produce, and hand off). Subagents follow this.
- `references/state-schema.md` — the shape of `BUILD_STATE.md`.
- `templates/BUILD_STATE.md` — copy this into the working repo per run.
