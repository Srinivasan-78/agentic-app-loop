---
name: penny-council
description: >-
  Decide a contested technical question by running five bounded subagents with
  different mandates in parallel, letting them rebut each other once, then having
  a referee adjudicate before you make the call. Use when a choice has real
  trade-offs and one opinion is not enough — architecture, stack and library
  choices, migration strategy, build-vs-buy, "which of these two approaches".
  Triggers: "convene the council", "get several opinions", "debate this",
  "argue both sides", "which approach should we take", "review this decision".
---

# Council — five mandates, one decision

You are the **chair**, not a sixth member. You frame the question, run the
rounds, and make the final call. You do not argue a position yourself, and you
do not research the question — every member does its own work in its own context
window, and only a bounded report comes back to you.

That isolation is the point. Five agents reading the codebase in parallel costs
five contexts; five agents reporting into *your* context costs you one small
file. Without the bounds in `references/council-protocol.md`, a council costs
more than just deciding yourself — read them before you spawn anything.

## The five mandates

Each member is a *mandate*, not a personality. It argues its brief honestly and
is explicitly told not to be agreeable.

| # | Member | Agent | Argues for |
|---|--------|-------|-----------|
| 1 | Architect | `council-architect` | Structure, boundaries, and what the choice forecloses later |
| 2 | Skeptic | `council-skeptic` | How it fails — attacks the premise, not the spelling |
| 3 | Pragmatist | `council-pragmatist` | The shortest honest path to shipping |
| 4 | Operator | `council-operator` | Running it: deploy, observe, debug at 3am, migrate off |
| 5 | Economist | `council-economist` | Total cost — money, tokens, time, and maintenance |

Then `council-referee` adjudicates. It is not a sixth opinion either: it reports
where the five actually agree, where they genuinely conflict, and what evidence
would settle each conflict.

## How to run it

### Step 0 — frame the question

Do this yourself, before spawning. A council on a vague question returns five
essays.

1. Write the question as a **decision between named options**. "Redis or
   Postgres for session storage" — not "how should we do sessions". If the user
   gave you one option, name the status quo as the alternative; there is always
   an alternative.
2. State the **constraints that are already settled** — budget, deadline, team
   size, existing stack, things that cannot change. A member that re-litigates a
   settled constraint has wasted its turn, and they will unless you tell them.
3. State the **decision criteria**, ranked. What makes one option win?
4. Pick the **verdict shape**: a single choice, a ranking, or a
   recommend-with-conditions.

If the question is not actually contested — one option is clearly right, or it
is a matter of fact rather than judgment — say so and stop. Answer it directly
or use `/penny-scout`. A council on a settled question is pure cost.

### Step 1 — set up the state

Create `.council/` in the working repo. Copy `templates/COUNCIL.md` to
`.council/COUNCIL.md` and fill the header and `## Question` from Step 0.

**Each member writes its own file** — `.council/01-architect.md`,
`.council/02-skeptic.md`, and so on. They never write `COUNCIL.md`.

This is not a style choice. Five agents running in parallel against one file
will interleave their writes and corrupt it. One file per member, assembled
afterwards, is the only shape that survives a parallel round.

### Step 2 — round 1, in parallel

Spawn all five in **one message** so they run concurrently. Each gets the brief
shape in `references/council-protocol.md` §1 — question, settled constraints,
criteria, its own output path, and a hard word cap.

Wait for all five. Then read **only** each member's `## Position` and
`## Strongest counter-argument` — not their full working notes.

### Step 3 — round 2, rebuttal

This round is what makes it a council rather than a poll, and it is also where
cost runs away. One round only. Never two.

1. Build a **digest**: each member's position in one sentence plus its single
   strongest claim. Cap it at ~40 lines total. You write this; it is the only
   thing that crosses between members.
2. Re-spawn the same five with the digest and protocol §2. Each one must either
   concede a point explicitly or say what evidence would change its mind. A
   member that only restates round 1 has failed its brief — note it and move on.
3. Each appends `## Revision` to its own file.

Skip round 2 only when round 1 came back unanimous on the same reasoning, and say
in `## Decision` that you skipped it and why.

### Step 4 — referee

Spawn `council-referee` with protocol §3. It reads all five files, writes
`## Adjudication` into `COUNCIL.md`, and reports back a short summary.

It does **not** decide. It produces:
- what all five agree on (the real finding — this is usually the valuable part)
- each live disagreement, with the evidence that would settle it
- any position that did not survive round 2, and why
- a recommendation marked clearly as advisory

### Step 5 — decide

Yours alone. Read the referee's `## Adjudication` and the disagreement table —
not the five member files.

Write `## Decision` into `COUNCIL.md`: the call, the two or three reasons that
actually drove it, what you are explicitly accepting as a risk, and what would
make you revisit it.

Three rules on deciding:

- **You may overrule the referee.** Say so and say why. The council informs the
  decision; it does not own it.
- **If the deciding evidence does not exist yet, do not decide.** Say what to go
  measure, and stop. A council cannot vote a fact into existence, and five
  confident agents agreeing is not evidence.
- **If the council split on a question of values** — speed vs. correctness,
  flexibility vs. simplicity — that is the user's call, not yours. Present the
  split and ask.

### Housekeeping

The chair owns `COUNCIL.md`'s header and `## Log`. Keep both current as you go —
it is two short writes, and it is the only thing that makes an interrupted
council resumable rather than a restart:

- `Status:` → `FRAMING` → `ROUND1` → `ROUND2` → `REFEREE` → `DECIDED`
- `Round:` → `0` → `1` → `2`
- `## Log` → one line per transition, and one line for anything you *skipped*
  (a unanimous round 1, an abstaining mandate, a member that blew its cap).

The skipped lines are the valuable ones. A decision record that does not say
round 2 was skipped reads as though five mandates argued it out when they did
not.

### Step 6 — report

Short. The decision, the two or three reasons, the accepted risk, and a pointer
to `.council/COUNCIL.md`. Do not paste the adjudication into chat, and never
paste the member files.

## Gates

| Situation | Action |
|-----------|--------|
| A member returns over its word cap | Note it, use it, tighten the cap next time. Do not re-spawn — you already paid for it. |
| A member reports `BLOCKED` on a missing fact | Answer it if you can from the brief; otherwise mark that mandate `abstained` and proceed with four. |
| Two members return near-identical positions | Collapse them in the digest. Do not re-spawn for variety — identical positions on a real trade-off is itself a finding. |
| All five agree in round 1 | Skip round 2. Go straight to referee, then decide. |
| Round 2 produces no movement at all | Stop. The disagreement is about values or missing evidence — hand it to the user with the split stated. |
| You have spawned 12+ agents on one question | Stop and decide with what you have. The council has stopped paying for itself. |

## When not to convene a council

Be strict about this. Most questions do not need one:

- **A question of fact** → `/penny-scout`, or just read the file.
- **A decision already made** → do not re-open it for a better feeling.
- **A choice with an obvious answer** → take it. "Should we add tests" is not a
  debate.
- **Something to be built, not decided** → `/penny-build`.
- **An urgent fix** → fix it. Convene later if the cause is architectural.

The honest cost: five parallel subagents plus a rebuttal round plus a referee is
roughly 11 agent runs. That is worth it for a decision you will live with for a
year, and absurd for one you will revisit next week.

## Composing with the build loop

- A council decision becomes the `## Request` of a `/penny-build` run.
- A `/penny-build` PLAN phase that hits a genuinely open stack choice should
  report `BLOCKED` with the question, so the chair can convene a council and
  then resume PLAN with the decision.

## Files in this skill

- `references/council-protocol.md` — the exact brief for each round and the
  referee's contract. Members follow this.
- `templates/COUNCIL.md` — the shape of the state file.
