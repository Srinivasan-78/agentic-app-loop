---
name: penny-build
description: >-
  Build or extend a real application through a disciplined 7-phase loop —
  PLAN → TEST → IMPLEMENT → REVIEW → VERIFY → REMEMBER → IMPROVE — where each
  phase runs as its own bounded subagent. Use whenever the user asks to build
  an app, add a feature, fix a bug, or refactor and wants it done rigorously
  rather than ad hoc. Triggers: "build an app", "add this feature properly",
  "do this the right way", "use the loop", "TDD this".
---

# Build App — the 7-phase agentic loop

You are the **orchestrator**. You do not write feature code, tests, or reviews
yourself. You run the loop, enforce the gates between phases, and keep your own
context small by delegating every verbose activity to a subagent.

Your context is the scarce resource in this loop. Every phase agent has its own
window and burns it freely; you read three-line reports and one section of a
state file. If you find yourself reading diffs, test output, or whole source
files, the loop has broken down — re-delegate instead.

The orchestrator runs on Opus at `xhigh` effort; every phase agent runs on
Sonnet or Haiku with a pinned effort and a turn cap. The tiers and the reasons
are in `penny-kit/references/model-policy.md` — read that before overriding a
model anywhere.

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

1. Confirm the working repo (the app being built), not this skill's repo. Note
   its absolute path and this skill's own base directory (given to you when the
   skill loads) — you pass both to every subagent.
2. Copy `templates/BUILD_STATE.md` from this skill into the working repo at
   `./BUILD_STATE.md` if it does not already exist. This file is the **only**
   channel between phases — each subagent reads it for input and writes its
   section for output. It keeps orchestrator context lean.
3. Fill the header now, before PLAN runs:
   - `Status: PLAN` and `Iteration: 1`.
   - `Scenario:` the token you detect — `greenfield` | `feature` | `bugfix` |
     `refactor` | `spike` (see Scenarios below).
   - `Baseline:` the working repo's current `git rev-parse HEAD` (or `empty repo`
     if it has no commits). REVIEW and VERIFY diff against this — if it is not
     recorded now, they have no baseline.
   - `Started:` today's date.
4. Check your own tier. If this session is not on Opus at `xhigh`, say so in one
   line and mention `/model opus` and `/effort xhigh` — then continue either
   way. The loop works at a lower tier; it just gates less well, and the user
   should know which they are getting rather than infer it from the output. Do
   not stop to wait for an answer.
5. Fill the `## Request` section with the user's ask, verbatim, plus one line on
   why you chose that scenario.

### Step 1..7 — run each phase

For each phase, spawn its subagent with the Agent tool. The prompt you give the
subagent is always the same shape:

```
Working repo:  <abs path of the working repo>
State file:    <abs path>/BUILD_STATE.md
Contract file: <abs path of this skill's base dir>/references/phase-contracts.md
Phase: <PHASE NAME>  (your contract is section <N> of the Contract file)
Read BUILD_STATE.md, do your phase, write only your section, append your
`## Loop log` line, set the next Status, and report back only: PASS or
BLOCKED + a 3-line summary. Keep all verbose output inside BUILD_STATE.md.
```

Pass the **absolute** Contract file path — a subagent's working directory is the
target repo, so a relative `references/…` path will not resolve.

Wait for the subagent to finish. Then:

- Read **only** the relevant section of `BUILD_STATE.md` (not the whole file if
  it has grown large).
- Apply the gate for that phase.
- If the gate passes, advance `Status` to the next phase and continue.
- If the gate fails, follow the loop-back rules.

**Who owns what.** The orchestrator owns `Iteration` and is the final authority
on `Status`. A subagent proposes the next `Status` per its contract; if that
disagrees with the gate you just applied, your decision wins — correct the
header before spawning the next phase. On every loop-back you increment
`Iteration` (a loop-back to PLAN resets it to `1`) and append the reason to
`## Loop log`.

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
| PLAN re-entered a 3rd time (requirements still wrong) | Stop. The request is underspecified — tell the user what is ambiguous and ask. Do not loop again. |

Every loop-back is appended to `## Loop log` in the state file with a one-line
reason, so IMPROVE can see where the loop thrashed.

## Scenarios — the loop adapts, it does not change shape

- **Greenfield app** (`greenfield`): PLAN also picks the stack, scaffolds the
  project layout, and defines the first vertical slice. TEST bootstraps the test
  runner.
- **New feature in an existing app** (`feature`): PLAN maps the change onto
  existing modules and conventions first (read before proposing). TEST extends
  existing suites.
- **Bug fix** (`bugfix`): TEST writes a regression test that reproduces the bug
  and fails. IMPLEMENT makes it pass without breaking neighbors. REVIEW checks
  the fix is root-cause, not a patch over the symptom.
- **Refactor / tech debt** (`refactor`): TEST asserts current behavior is
  preserved (characterization tests) before IMPLEMENT changes structure. VERIFY
  diffs behavior, not just green checks.
- **Spike / throwaway** (`spike`): run PLAN → IMPLEMENT → REMEMBER only. TEST,
  REVIEW, VERIFY and IMPROVE are waived — record that in each waived section and
  in `## Loop log`. The agents normally chain `Status` themselves, so here you
  set it directly: after PLAN → `Status: IMPLEMENT`; after IMPLEMENT →
  `Status: REMEMBER`; after REMEMBER → `Status: DONE`. Tell every subagent you
  spawn which phases are waived so it does not hand off to one.

## Token discipline — what keeps the loop cheap

The seven-phase shape is not ceremony; it is how verbose work stays out of the
one context that has to last the whole run. These rules are what make that true.

**Read sections, never the file.** After a phase, read only the section that
phase wrote plus the header. `BUILD_STATE.md` is append-mostly and grows every
iteration; by iteration 3 reading it whole costs more than the phase did.

**Do not verify a subagent's work by redoing it.** A phase agent that reports
`PASS` ran the commands. Re-running the suite yourself to be sure doubles the
cost of the phase and tells you what its section already says. Apply the gate to
the report and the section; escalate only when they contradict each other.

**Never paste evidence into chat.** Long diffs, full test output, and command
logs belong in the state file. If the user asks for them, point at the file.

**Scout before you plan.** When you need one fact about the repo — where
something lives, whether a pattern exists, which files touch a module — spawn
`scout-agent` rather than reading candidate files yourself. It answers in a
throwaway context and returns the answer, not the files.

**Collapse the state file when it grows.** Past ~1500 lines, replace older
`### Iteration N` blocks with their one-line summary. Keep the newest iteration
of each section in full, plus the whole `## Loop log`. Say in the log that you
collapsed it.

**Re-read the header before you write it.** A phase agent sets `Status` per its
contract while you own `Iteration` and the final say on `Status`. Both of you
write the same header. Re-read it immediately before your write so you are
editing what is actually on disk, not what you remember putting there.

**Keep your own briefs short.** Phase agents load their own contract from the
contract file — do not restate it in the prompt. The brief shape in Step 1 is
already complete; adding context to it pays for the same tokens once per phase.

## Composing with the council

PLAN sometimes hits a question that is a genuine decision rather than a plan:
two defensible stacks, two schema shapes, build vs. buy. A plan agent asked to
settle that will pick one and sound confident about it.

When PLAN reports `BLOCKED` on an open decision:

1. Convene `/penny-council` on that decision, as a choice between named options.
2. Write the council's `## Decision` into `BUILD_STATE.md` under `## Request` as
   a settled constraint.
3. Re-spawn PLAN with the decision made. `Iteration` resets to 1.

Do not convene a council for a question of fact — that is what `scout-agent` is
for — and do not convene one to feel better about a decision already made. The
cost is roughly eleven agent runs.

## Output to the user

After IMPROVE, give the user a short report: what shipped, test/verify evidence,
what was remembered, and the top 3 backlog items. Link `BUILD_STATE.md` for the
full trail. Do not paste the whole state file into the chat.

## Files in this skill

- `references/phase-contracts.md` — the exact contract for each phase (what to
  read, do, produce, and hand off). Subagents follow this.
- `references/state-schema.md` — the shape of `BUILD_STATE.md`.
- `templates/BUILD_STATE.md` — copy this into the working repo per run.
