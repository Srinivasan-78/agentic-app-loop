# Council protocol

The exact brief for each round. The chair sends these; members follow them.

Two rules that apply to every round and every member:

- **Everything verbose stays in your own file.** Your report back to the chair is
  a verdict line plus three lines. Full reasoning, quotes, file excerpts, and
  command output go in your file, never in the report.
- **The cap is the contract.** A member that returns 900 words when the cap was
  250 has failed, even if the content is good — the whole point is that the
  chair can read five of these.

---

## 1. Round 1 — independent position

The chair spawns all five members in one message with this brief. Nothing
crosses between members in round 1: the value of parallel positions is that they
are *not* anchored on each other.

```
Working repo:   <abs path>
Your file:      <abs path>/.council/<NN>-<role>.md
Protocol:       <abs path of this file>   (your contract is section 1)
Round:          1

Question:
<the decision, as a choice between named options>

Settled — do not re-litigate:
<constraints that cannot change>

Decision criteria, ranked:
1. <...>
2. <...>

Verdict shape: <single choice | ranking | recommend-with-conditions>

Argue your mandate. Write only your file. Cap: 250 words in the file.
Report back: one verdict line + 3 lines. Nothing else.
```

### What each member writes into its own file

```markdown
# <Role> — round 1

## Position
<the option you back, and the single reason that decides it for you. 2-4 sentences.>

## Case
<your 3 strongest arguments, one line each, each tied to a ranked criterion.>

## Strongest counter-argument
<the best argument against your own position. Required. A mandate that cannot
state the case against itself has not thought about the question.>

## What would change my mind
<a specific, checkable fact or measurement. Not "more information".>

## Evidence
<file:line references, command output, docs you actually read. Keep it here —
this is the part the chair does not read, and the referee does.>
```

### Rules for every member

- **Argue your mandate, honestly.** You are not playing a character and you are
  not here to be agreeable. If the honest answer from your mandate is "the other
  option is better", say that — a mandate that always backs the same side is
  noise.
- **Read before asserting.** Check the actual repo before claiming what it does.
  An unverified claim about the codebase is worse than no claim; mark anything
  you could not verify as an assumption.
- **Stay in your lane.** The Economist does not design the schema. The Architect
  does not estimate the bill. Five overlapping generalists is the failure mode
  this structure exists to avoid.
- **Bounded reading.** Grep before you read, read ranges not whole files, and
  cap every command's output. You have your own context window — that is not a
  licence to fill it. Four large file reads is a lot for one position.
- **No implementation.** You produce a position, not code. Do not edit anything
  outside your own file.
- **If a fact you need is missing,** state it in `## What would change my mind`
  and argue from your best assumption, labelled as one. Report `BLOCKED` only
  when you cannot form any position at all.

### Report back

```
VERDICT: <option> — <8 words why>
<3 lines: your decisive argument, your biggest concession, your open question>
```

---

## 2. Round 2 — rebuttal

One round. The chair sends a digest of all five positions; each member revises.

```
Round: 2
Your file:  <same path — append to it>
Protocol:   section 2

Digest of round 1:
<one sentence per member + its strongest claim. ~40 lines.>

Append `## Revision` to your file. Cap: 200 words.
You must do one of these three things, explicitly:
  - concede a specific point to a named member, or
  - rebut a specific claim with evidence, or
  - state the measurement that would settle it and that nobody has taken.
Restating round 1 is a failed brief.
Report back: one verdict line + 2 lines.
```

### What a revision looks like

```markdown
## Revision

**Conceded:** <to whom, which point, and what it costs your position.>

**Held, with evidence:** <which claim you are not dropping, and the specific
evidence — file:line, benchmark, doc — that holds it up.>

**Unresolved:** <the measurement nobody has, that would settle this.>

**Verdict now:** <unchanged | changed to X> — <why in one line>
```

Changing your verdict is a *success*, not a loss. A council where nobody ever
moves is a council that was not reading each other.

Do not address all four other members. Pick the one claim that most threatens
your position and deal with that. Breadth here is how round 2 doubles its cost
for nothing.

---

## 3. Referee

```
Working repo:  <abs path>
Member files:  <abs path>/.council/01-architect.md ... 05-economist.md
State file:    <abs path>/.council/COUNCIL.md
Protocol:      section 3

Read all five member files in full. Write only `## Adjudication` in COUNCIL.md.
You do not decide — the chair does.
Cap: 400 words. Report back: 4 lines.
```

The referee is the only agent that reads everything. That is why it is a
separate agent and not the chair: all five files in the chair's context defeats
the purpose of the structure.

### What the referee writes

```markdown
## Adjudication

### Agreed by all five
<the real finding. If five mandates with different incentives all agree on
something, that is the most reliable output of the whole exercise. If they agree
on nothing, say that plainly — it is also a finding.>

### Live disagreements

| # | Claim | For | Against | What would settle it |
|---|-------|-----|---------|----------------------|
| 1 | <...> | architect, pragmatist | skeptic | <a specific measurement> |

### Positions that did not survive round 2
<who conceded what, and whether the concession was load-bearing.>

### Unverified claims
<anything a member asserted about the codebase or the world without evidence.
Name the member. This is the referee's most useful job — confident prose reads
the same whether or not anyone checked.>

### Advisory recommendation
<your call, marked advisory, in 3 sentences: the option, the condition it
depends on, and the risk it accepts.>
```

### Referee rules

- **Judge arguments, not members.** Do not count votes. Four members agreeing
  for the same weak reason is weaker than one member with a measurement.
- **Separate fact from assertion.** This is the core of the job. If two members
  disagree about what the code does, go read the code and settle it — you are
  the only one positioned to.
- **Name the load-bearing assumption** under each position. Most technical
  disagreements are an unstated assumption wearing an argument's clothes.
- **Do not synthesise a compromise nobody argued for.** If the answer is "do
  neither, do a third thing", say so explicitly as a new option with its own
  case — do not smuggle it in as a merge.
- **Say when the council failed.** If all five were vague, or all five missed
  something obvious, that is your finding to report. Write it.

### Report back

```
AGREED: <the one thing all five agree on, 1 line>
SPLIT: <the single live disagreement that matters most, 1 line>
BLOCKER: <the missing evidence, or "none">
ADVISORY: <option> — <8 words>
```

---

## 4. Cost discipline

The chair owns these; members cannot enforce them.

| Control | Value | Why |
|---------|-------|-----|
| Round 1 cap | 250 words/member | Five of these must fit in the chair's head, not just its context. |
| Round 2 cap | 200 words/member | A rebuttal is narrower than a position. |
| Referee cap | 400 words | It reads five files; it does not reproduce them. |
| Digest cap | ~40 lines | The only thing crossing between members. Uncapped, it becomes five full positions re-sent five times — 25 position-reads. |
| Rebuttal rounds | exactly 1 | Round 3 has never changed a verdict and always costs another five runs. |
| Parallel spawn | all 5 in one message | Sequential spawns serialise 5 contexts for no benefit. |
| Agent runs per question | ~11 (5 + 5 + 1) | Past 12, stop and decide. |

Member agents run on the Craft and Hands tiers with `omitClaudeMd` — a mandate
takes everything it needs from its brief, and loading project memory into five
agents pays for the same tokens five times. The Architect, Skeptic, and Referee
run a tier up because their job is to find what is wrong, which is the one thing
a cheap tier does badly. See `penny-kit/references/model-policy.md`.
