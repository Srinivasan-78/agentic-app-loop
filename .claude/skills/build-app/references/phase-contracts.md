<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌‌​​‌‌​​​‌‌‌​​‌​‌‌‌‌​​‌​‌​​‌​​‌​‌​‌​​‌​​‌‌​‌‌‌​​‌‌​​​‌‌​‌‌​‌‌‌‌​‌‌​‌‌​‌​‌‌​​​​‌​​‌‌​‌‌‌​‌​​‌‌​‌​‌‌​​‌‌‌​‌‌​‌‌​​​​‌‌​‌‌​​‌​​‌​‌‌​‌‌‌‌​​‌​‌‌‌​‌‌‌​​‌‌​‌​​​‌​​‌​‌​​‌​‌​‌​‌​‌​‌‌​‌​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.f9yIRncoma7Mgl6Kyw4JUZ
-->
# Phase contracts

Each subagent does exactly one phase. Read `BUILD_STATE.md` for input, write your
own section, set `Status` to the next phase (or a loop-back target), then report
`PASS` or `BLOCKED` plus a 3-line summary. Keep everything verbose — full command
output, long diffs, dead ends — inside the state file, not in your report.

---

## 1. PLAN — `plan-agent`

**Read:** `## Request`. The working repo: its README, package manifest, existing
structure, test setup, and conventions. Do not read the whole codebase — sample
enough to plan accurately.

**Do:**
- Restate the goal in one paragraph and list explicit non-goals.
- For greenfield: choose the stack and justify it in 2–3 lines; define the
  project layout and the first vertical slice.
- For existing apps: identify every module/file the change touches and the
  conventions to follow.
- Break the work into file-level tasks, ordered, each small enough to test.
- Define **acceptance criteria** as checkable statements ("POST /orders with an
  empty cart returns 422", not "handle bad input").
- Define the **test strategy**: which levels (unit/integration/e2e), what to
  mock, how to run the suite, what "fail for the right reason" looks like.
- List risks and open questions. If an open question blocks planning, set
  `Status: BLOCKED` and report it.

**Produce:** `## Plan` section — goal, non-goals, stack/layout (if any), ordered
tasks, acceptance criteria (numbered), test strategy, risks.

**Hand off:** `Status: TEST` — unless your prompt says TEST is waived (spike),
in which case leave `Status` for the orchestrator to set.

---

## 2. TEST — `test-agent`

**Read:** `## Plan`, especially acceptance criteria and test strategy.

**Do:**
- Write tests that encode the acceptance criteria — one or more test per
  numbered criterion, referenced by number in the test name or a comment.
- Add regression/characterization tests as the scenario requires (bug repro;
  behavior-preservation for refactors).
- Wire up the runner if missing (greenfield).
- Run the tests. Confirm they **fail**, and that each fails for the intended
  reason (assertion not met / route missing), not from a typo, import error, or
  missing fixture. Fix the tests until the only reason they fail is absent
  implementation.
- Do **not** write implementation code. Stubs/interfaces only if the language
  needs them to compile — and keep them un-implemented.

**Produce:** `## Tests` section — list of test files and test names mapped to
acceptance criteria, the exact run command, and the captured failing output
showing the right failure reason.

**Hand off:** `Status: IMPLEMENT`.

---

## 3. IMPLEMENT — `implement-agent`

**Read:** `## Plan`, `## Tests`, and any `## Review` findings if this is a
loop-back iteration.

**Do:**
- Work task by task from the plan. Write the minimal code to satisfy the tests.
- Follow existing conventions; reuse existing helpers before adding new ones.
- Run the phase's tests after each task. Keep going until all are green.
- If a test appears wrong, do not edit it to pass — set `Status: TEST`, explain
  in `## Implement`, and stop.
- Address every blocking review finding when iterating; note how each was
  resolved.

**Produce:** `## Implement` section — files created/changed with a one-line
reason each, the green test output, and notes on any deviation from the plan.

**Hand off:** `Status: REVIEW`.

---

## 4. REVIEW — `review-agent`

**Read:** `## Plan`, `## Tests`, `## Implement`. Inspect the actual diff
(`git diff <Baseline>...` using the `Baseline` sha from the state header, or
`git diff` if it was an empty repo) — do not review from the summary.

**Do:** Read-only. Look for:
- Correctness bugs: edge cases, off-by-one, error paths, concurrency, resource
  leaks, incorrect assumptions about inputs.
- Security: injection, authz gaps, unsafe deserialization, secrets in code,
  path traversal — flag only what the diff actually introduces.
- Test quality: do the tests really exercise the criteria? Any tautological or
  skipped tests? Missing negative cases?
- Simplification & reuse: dead code, duplicated logic, needless abstraction.

Rank each finding `BLOCKING` / `SHOULD` / `NICE`. Give file:line and a concrete
failing scenario for every `BLOCKING` item. Do not fix anything.

**Produce:** `## Review` section — findings list with severity, location, and
scenario. State the count of unresolved `BLOCKING` findings.

**Hand off:** `BLOCKING` count > 0 → `Status: IMPLEMENT` (loop-back). Otherwise
`Status: VERIFY`.

---

## 5. VERIFY — `verify-agent`

**Read:** `## Plan` acceptance criteria, `## Tests`, `## Implement`,
`## Review`.

**Do:**
- Run the **full** test suite, not just the phase tests.
- Run lint, typecheck, and the production build.
- Smoke-test the running app for the affected path: start it, exercise the new
  behavior (HTTP call, CLI invocation, UI action as available), capture output.
- Walk the numbered acceptance criteria one by one and mark each Met / Not met
  with the evidence line that proves it.
- For refactors: compare observable behavior before/after, not just green CI.

Any red check, or any unmet criterion → fail.

**Produce:** `## Verify` section — each command run with its result, the smoke
evidence, and the acceptance-criteria checklist with proof per item. End with
`RESULT: PASS` or `RESULT: FAIL — <why>`.

**Hand off:** PASS → `Status: REMEMBER`. FAIL on a code bug → `Status:
IMPLEMENT`. FAIL because a requirement was wrong → `Status: PLAN`.

---

## 6. REMEMBER — `remember-agent`

**Read:** the whole state file, focusing on `## Plan` decisions, `## Review`
findings, `## Verify`, and `## Loop log`.

**Do:** Capture only what was **non-obvious** and will matter later:
- Decisions and their rationale (stack choice, a rejected approach and why).
- Gotchas hit during the build (a flaky dependency, an undocumented API quirk,
  an environment requirement).
- New conventions or patterns this work established.

Write them where the project keeps durable knowledge: `CLAUDE.md`, an
`docs/adr/` entry, a memory directory, or the README — match what the repo
already uses. Do not restate what the code or git history already shows.

**Produce:** `## Remember` section — a list of the notes written and where each
landed.

**Hand off:** `Status: IMPROVE`.

---

## 7. IMPROVE — `improve-agent`

**Read:** the whole state file, especially `## Loop log`, `## Review`,
`## Verify`.

**Do:**
- Retro on the loop: where did it thrash? Which phase caught (or missed) the
  most? Was the plan accurate?
- Retro on the code: remaining tech debt, follow-up features, test gaps VERIFY
  tolerated, performance concerns.
- Propose improvements to this skill/agents themselves if a contract gap caused
  a loop-back.
- Apply improvements that are low-risk and in scope now (rename, extract
  duplication, tighten a type, add a missing small test). Anything risky or
  large → backlog only.

**Produce:** `## Improve` section — retro notes, the backlog (ranked, each item
with rough size), and a list of quick wins applied with their diff summary.

**Hand off:** `Status: DONE`.
