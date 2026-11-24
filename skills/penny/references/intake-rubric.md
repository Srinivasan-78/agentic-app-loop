# Intake rubric

Worked examples. Read this when a request sits on a boundary between two lanes,
or before writing interview questions.

---

## 1. Lane examples

### REFINE — no criteria are recoverable

- "I want to build a habit tracker."
- "Something that summarises my emails would be cool."
- "Can you make this project better?"
- "I need a dashboard for the team."
- "Build me an app for tracking expenses."

Each is a direction, not a request. Three checkable criteria cannot be written
without inventing requirements.

### BUILD — criteria are recoverable

- "Add rate limiting to the orders endpoint — 100 requests per minute per API
  key, return 429 with a Retry-After header."
- "Users with expired tokens get a 500 instead of a 401. Fix it."
- "Split `UserService` into `UserService` and `UserAuthService`; keep the public
  API identical."
- "Add CSV export to the reports page."

The last one is the interesting case: it is thin, but the criteria are
recoverable (a button, a file downloads, the columns match the table). Thin but
recoverable is BUILD. PLAN will fill the detail and the gates will catch a wrong
guess. **Do not interview a thin-but-recoverable request.**

### DECIDE — named options, real trade-offs

- "Should sessions live in Redis or Postgres?"
- "Is it worth moving to a monorepo?"
- "Build our own auth or use Auth0?"
- "Keep the REST API or move to GraphQL?"

Already sharp. Needs deciding, not refining.

### FIND — a fact about the code

- "Where is the retry logic?"
- "Does this repo have any rate limiting already?"
- "Every place we read the Stripe key."
- "Which tests cover the checkout flow?"

### TUNE — about the agent, not the product

- "Why is this session so expensive?"
- "Set up my agent properly."
- "My context fills up too fast."
- "Which model should I use for this?"

### DO — smaller than the ceremony

- "Fix the typo in the README."
- "Bump the eslint version."
- "Run the test suite and tell me what fails." *(a command, not a phase)*
- "Rename `getUsr` to `getUser` everywhere."

### EXPLAIN — a question about what exists

- "How does the auth middleware work?"
- "Why is this using a mutex here?"
- "What does this regex match?"

---

## 2. Boundary calls

| Request | Lane | Why |
|---------|------|-----|
| "Add CSV export to the reports page" | BUILD | Thin, but criteria are recoverable. Do not interview. |
| "Make the app faster" | REFINE | "Faster" is not checkable. Which path, and what is the target number? |
| "The checkout page takes 8s, get it under 2s" | BUILD | Now it is checkable. |
| "Should I add tests?" | DO | Not a real trade-off. Yes. Do not convene a council. |
| "Should this be one service or two?" | DECIDE | Genuine, consequential, two defensible answers. |
| "Clean up this file" | REFINE *or* DO | If the file is small and the mess is obvious, DO. If "clean up" could mean five different things, ask one question. |
| "Build a habit tracker like the one I described yesterday" | FIND first | Check `.penny/BRIEF.md` and the repo before asking them to repeat themselves. |
| "Fix the auth bug" | FIND then BUILD | Which bug? Scout for a failing test, an issue, a TODO. Ask only if the repo does not say. |
| "Rewrite this in Rust" | DECIDE then BUILD | The decision is load-bearing and probably unexamined. |
| "Add a login page" | BUILD | Criteria are recoverable from convention. The one thing worth confirming is the auth mechanism — and only if the repo does not already have one. Scout first. |

The recurring lesson in this table: **scout before you ask.** More than half of
apparent ambiguity is answered by the repository.

---

## 3. Questions that pay

Four or fewer, one round, each with concrete options and a recommended default.

### The high-value four

Most vague ideas are unblocked by two or three of these:

1. **Audience** — "Who uses this: just you locally / a small team / public
   users?" Changes auth, hosting, data handling, and how much rigour is worth
   it. The single highest-value question.
2. **Smallest useful version** — "What is the smallest version you would
   actually use?" Finds the first vertical slice and prevents building the
   cathedral.
3. **Lifespan** — "Throwaway experiment, or something you will maintain?" Decides
   whether tests and structure earn their cost. Maps directly onto the
   `spike` vs `greenfield` scenario in the build loop.
4. **The hard constraint** — "Anything this must work with or inside?" An
   existing stack, a deadline, a platform, a compliance rule. Catches the
   constraint that invalidates an otherwise good plan.

### Shape them like this

```
Q: Who will use this?
   - Just me, locally (Recommended) — no auth, no hosting, SQLite
   - A small team — needs login and somewhere to run
   - Public users — needs auth, hosting, and real data handling
```

The option text carries the consequence. That is what makes it answerable
without the user having to think like an engineer.

### Questions that waste the round

| Question | Why it is bad | Instead |
|----------|---------------|---------|
| "What should it do?" | Hands their whole job back | Propose a v1 and ask what to cut |
| "What tech stack?" | They usually do not care, and the repo or convention decides | Assume; state it as `assumed:` |
| "Should it have tests?" | Obvious default | Assume yes; `spike` is the exception |
| "What should I call it?" | Cosmetic, changeable later | Pick one; say you picked it |
| "Do you want this to be good?" | Not a real question | — |
| "Where is the config file?" | The repo knows | Scout it |
| "Should I follow your existing patterns?" | Always yes | — |

### After the answers

- An answer that opens a genuine new fork earns **one** more round. Two
  rounds maximum.
- An answer of "you decide" or "whatever you think" means **decide**. Write the
  assumption down and proceed.
- A contradiction between two answers is worth one short clarifying question —
  that is the one case where a second round is always justified.

---

## 4. Refinement that loses information

The failure mode nobody notices: the brief is tidier than the request and says
less.

Guard against all four:

- **Keep their exact words** for anything they were specific about. If they said
  "429 with Retry-After", the brief says "429 with Retry-After" — not "proper
  rate-limit response".
- **Keep the numbers.** "Under 2 seconds" must not become "fast".
- **Keep the negations.** "Without touching the existing API" is the most
  important sentence in the brief, and the easiest to smooth away.
- **Keep what they rejected.** "Not Firebase, we tried it" belongs in non-goals.
  Without it, PLAN will cheerfully propose Firebase.

A good brief is the original idea plus decisions, minus ambiguity. Nothing else
should have changed.

---

## 5. A worked refine

**Request:** "I want to build a habit tracker."

**Gap sort:**
- Facts about the repo → scout: is this an empty directory or an existing app?
  (Say it is empty.)
- Obvious defaults → assume: a language matching the user's other repos, local
  storage, a test runner.
- User decisions → ask: audience, smallest useful version, lifespan.

**One question round, three questions.** Answers: just me locally / "mark a
habit done each day and see a streak" / "I will keep using it".

**Brief:**

```markdown
## Goal
A local habit tracker: define habits, mark one done for a given day, see the
current streak per habit.

## Non-goals
Accounts, sync, mobile app, reminders, analytics beyond the streak.

## Acceptance criteria
1. A habit can be created with a name; names are unique.
2. Marking a habit done for a date is idempotent — twice on the same date counts once.
3. The streak counts consecutive days ending today, and is 0 if today and yesterday are both unmarked.
4. Data survives a restart.
5. `npm test` passes and covers criteria 1-4.

## Assumptions
- assumed: TypeScript + Node, matching the user's other repos.
- assumed: SQLite via a local file. No server.
- assumed: CLI first; no UI in v1.
- assumed: local dates, no timezone handling. Flagged — criterion 3 is
  timezone-sensitive and this is the most likely thing to be wrong.

## Open questions
- Should a missed day break the streak immediately, or is one day of grace
  allowed? Built as "breaks immediately"; cheap to change.
```

Five criteria, four labelled assumptions, one open question that did not block,
one honest flag about the riskiest assumption. That is a brief the build loop can
act on, and the user can veto any line of it at a glance.

Note what did not happen: no questions about the stack, no question about the
name, no second round, and the timezone risk was *named* rather than asked about.
