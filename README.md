# Pennywright

**The utility belt for coding agents.** One tool, one front door. It reads what you asked for, works out what kind of work it actually is, and hands it to the right tool. No dependencies, no build step, no tests to run.

Works on **Claude Code** and **Codex**, from the same repo.

---

## ⚡ Quick Start (30 seconds)

### Download & Install

```bash
# Claude Code (recommended)
/plugin marketplace add Srinivasan-78/pennywright
/plugin install pennywright
/penny-setup              # One-command setup
/penny-doctor             # Verify it worked
```

**That's it.** 18 skills + 7 agents + Playwright examples ready to use.

### Your First Command

```
/penny  add rate limiting to the orders endpoint
```

Returns:
```
Lane: BUILD — criteria recoverable. Running the loop.
```

---

## 📋 All Commands — Quick Reference

### Main Workflows

| Command | Use When | Returns |
|---------|----------|---------|
| **`/penny <anything>`** | Unsure what to do | Smart router → BUILD, DECIDE, FIND, TUNE, REFINE, etc. |
| **`/penny-build <ask>`** | You have clear requirements | 7-phase loop (PLAN → TEST → IMPLEMENT → REVIEW → VERIFY → REMEMBER → IMPROVE) |
| **`/penny-council <question>`** | Need to decide (trade-off) | 5 agents debate, referee adjudicates |
| **`/penny-scout <question>`** | Quick lookup (read-only) | Cheap, throwaway answer |

### Setup & Verification

| Command | Purpose |
|---------|---------|
| **`/penny-setup`** | First-time setup or reconfigure |
| **`/penny-doctor`** | Verify installation, diagnose issues |
| **`/penny-help`** | Show full index of skills |
| **`/penny-playwright help`** | Playwright setup + 7 examples |

### Token Optimization Skills

Reach for these when Claude Code suggests them, or invoke manually:

| Command | What it Does |
|---------|--------------|
| **`/miser-audit`** | Why is my context so big? (ranked prune list) |
| **`/miser-bench`** | Did that actually save tokens? (measure before/after) |
| **`/miser-speak lite`** | Terse mode (lite, full, or ultra) |
| **`/miser-compress`** | Shrink CLAUDE.md / AGENTS.md |
| **`/miser-session`** | /clear vs /compact, cache TTL, handoffs |
| **`/miser-read`** | Retrieval discipline (search before read) |
| **`/miser-tools`** | MCP schema tax (reduce context) |
| **`/miser-delegate`** | Should I use a subagent? (cost/benefit) |
| **`/miser-model`** | Model routing & effort levels |
| **`/miser-prompt`** | Request shape & target optimization |
| **`/miser-hooks`** | Filter config & hook management |
| **`/miser-git`** | Terse commits & review comments |
| **`/miser-api`** | LLM code patterns (caching, batching, RAG) |

---

## 🎯 Choose Your Path

### I want to **BUILD** something

**Clear requirements?**
```
/penny-build add email verification to signup flow
```

**Vague idea?**
```
/penny let users export their data
```
→ It sharpens it first, then builds.

### I need to **DECIDE** something
(architecture, stack, migration, build-vs-buy)

```
/penny-council should we migrate to Postgres or stay on SQLite?
```

Returns: 5 agents debate, referee adjudicates, you decide.

### I need a **QUICK LOOKUP**
(code search, fact check, no ceremony)

```
/penny-scout where is the payment handler?
```

Returns: Just the answer, 15 lines max.

### I want to **TEST** with Playwright

**Copy examples:**
```bash
cp skills/penny-playwright/examples/*.ts tests/
npx playwright test
```

**Or ask Claude inline:**
```
Write a Playwright test for checkout flow:
- Navigate to /checkout
- Fill customer info
- Submit payment
- Verify confirmation
```

Agent generates test code from examples.

See: [`PLAYWRIGHT_QUICKSTART.md`](PLAYWRIGHT_QUICKSTART.md)

### I want to **OPTIMIZE** tokens

1. Check what eats context:
   ```
   /miser-audit
   ```

2. Apply fixes (hook, model tier, context diet):
   ```
   /penny-setup
   ```

3. Measure improvement:
   ```
   /miser-bench
   ```

---

## 📥 Installation Options

### Option 1: Plugin (Recommended)

```bash
/plugin marketplace add Srinivasan-78/pennywright
/plugin install pennywright
```

### Option 2: Manual

```bash
# Claude Code skills
cp -r skills/* ~/.claude/skills/

# Agents
cp agents/*.md ~/.claude/agents/

# Commands
cp commands/*.md ~/.claude/commands/

# Export the kit location
export AGENT_KIT="/path/to/pennywright"
```

Add `AGENT_KIT` to your `~/.bashrc` or `~/.zshrc`.

### Option 3: Codex

```bash
# Agents
mkdir -p ~/.codex/agents && cp codex/agents/*.toml ~/.codex/agents/

# Skills
cp -r skills/miser-* ~/.agents/skills/

# Config & instructions
cp codex/config.toml.sample ~/.codex/config.toml
cp codex/AGENTS.md.sample ~/.codex/AGENTS.md
```

Then run `/penny-setup` to configure.

---

## 🔧 Configuration (One Command)

```
/penny-setup
```

Configures:
- Orchestrator model/effort (Opus/xhigh)
- Subagent tiers (Sonnet/medium for work, Haiku for simple tasks)
- Tool-output filter hook (10,000-line logs → 100 lines)
- Context diet (move heavy sections into skills)
- MCP optimization (disable unused servers)
- Permission allowlist (safe tools pre-approved)

Backs up before writing. Safe to re-run.

---

## ✅ Verify It Works

```
/penny-doctor
```

Checks:
- All agents installed and not half-pinned
- Hook wired and present
- `$AGENT_KIT` set
- Model policy enforced (no Opus on subagents)
- Standing cost (skills advertised every session)
- Session health (cache share, standing tokens)

---

## 📚 What's Inside

### Skills (18 total)

- **penny** — Front door (classifier & router)
- **penny-build** — 7-phase BUILD loop
- **penny-council** — 5-agent council + referee
- **penny-kit** — Setup, verify, help
- **penny-playwright** — Browser testing (NEW)
- **14 miser-\*** — Token optimization toolkit

### Agents (14 total)

Each runs at its tier (Opus/Sonnet/Haiku) with bounded tools and context.

| Phase | Agent | Tier |
|-------|-------|------|
| PLAN | plan-agent | Sonnet/high |
| TEST | test-agent | Sonnet/medium |
| IMPLEMENT | implement-agent | Sonnet/medium |
| REVIEW | review-agent | Sonnet/high |
| VERIFY | verify-agent | Sonnet/medium |
| REMEMBER | remember-agent | Haiku |
| IMPROVE | improve-agent | Sonnet/medium |
| COUNCIL | 5 role agents + referee | Sonnet/high |

### Examples (7 Playwright)

1. **01-basic-navigation.ts** — Click, type, navigate, assert
2. **02-form-submission.ts** — Login, validation, multi-step
3. **03-web-scraping.ts** — Extract data, pagination, tables
4. **04-api-intercept.ts** — Mock APIs, intercept requests
5. **05-mobile-testing.ts** — Responsive, touch, gestures
6. **06-visual-regression.ts** — Screenshots, comparisons
7. **07-performance.ts** — Load times, Core Web Vitals

Copy any to your project and customize.

---

## 🏗️ The Architecture (Simplified)

**Problem:** Agentic work is expensive because everything lands in one context at the same model tier.

**Solution:**
1. **Isolation** — Subagents run in throwaway contexts, return 3-line reports
2. **Routing** — Smart classifier sends BUILD work to BUILD agents, DECIDE to COUNCIL, etc.
3. **Tiering** — Opus for orchestration, Sonnet for judgment, Haiku for simple tasks
4. **Filtering** — Tool-output hook turns 10k-line logs into 100 lines before they enter context

**Result:** A session that stays fast and cheap because the verbose work never enters the main thread.

---

## 🧮 Cost Model

| What | Standing Cost | Per-Use Cost |
|-----|---|---|
| 18 skill descriptions | ~1.8k tokens/session | — |
| Routing (classify + sharpen) | ~300 tokens | — |
| BUILD loop phase | — | ~5k tokens (agent context, then discarded) |
| COUNCIL | — | ~11 agent runs (~50k tokens) |
| Miser skills | — | On-demand |

**Is it worth it?** Run `/miser-bench` to find out. On a small repo with quiet tests, it may not break even. On a larger project, it pays for itself after the first complex task.

---

## 🔒 Security

- **Tool allowlist** — Each agent has explicit `tools`, cannot call others
- **No destructive defaults** — `/penny-setup` proposes every write as a diff first
- **Hook safety** — `hooks/filter-tool-output.py` filters *output* only, never changes which command runs
- **Spawn depth capped** — No subagent can spawn its own (prevents bill surprises)

Read `hooks/filter-tool-output.py` before installing it. It's 177 lines and worth the 5 minutes.

---

## 📖 Detailed Guides (Technical)

### Understanding the System

1. [The problem this solves](#1-the-problem-this-solves)
2. [The one distinction that explains everything](#2-the-one-distinction-that-explains-everything)
3. [What the repo physically contains](#3-what-the-repo-physically-contains)

### Workflows

4. [The front door: seven lanes](#4-the-front-door-seven-lanes)
5. [The build loop](#5-the-build-loop)
6. [The council](#6-the-council)
7. [The scout](#7-the-scout)

### Optimization

8. [Model and effort policy](#8-model-and-effort-policy)
9. [Where the token savings come from](#9-where-the-token-savings-come-from)

### Reference

10. [The 15 skills](#10-the-15-skills)
11. [Install](#11-install)
12. [Configuration reference](#12-configuration-reference)
13. [Codex differences](#13-codex-differences)
14. [Diagnosing it](#14-diagnosing-it)
15. [Honest limitations](#15-honest-limitations)
16. [Security](#16-security)
17. [Extending it](#17-extending-it)

---

## 1. The problem this solves

Two things make agentic coding expensive, and they are really the same thing twice.

**Everything lands in one context.** Test output, speculative file reads, dead
ends, a 10,000-line build log. You pay for all of it on *every subsequent turn*,
because each request re-sends the whole conversation. A session that reads a
lockfile once carries that lockfile until you clear it. And the model gets worse
as the window fills with noise — the thing it needs is buried under the thing it
tried.

**Everything runs at one setting.** The model that should be weighing an
architecture decision is also the one grepping for a function name, at the same
reasoning effort, at the same per-token price.

The usual advice is to be careful: read less, clear more often, pick your model.
That is real advice and it does not survive contact with a long session, because
being careful is a thing you have to keep doing.

Pennywright fixes both **structurally**. Work is handed to a bounded subagent
whose context is thrown away when it finishes, and each subagent runs at the
cheapest tier that can actually do its job. What comes back to your session is a
three-line report. You are not being careful; the shape is doing it for you.

---

## 2. The one distinction that explains everything

There are two mechanisms at work here, and knowing which is which tells you what
the thing can and cannot guarantee.

| | Enforced by | What if the model "disagrees"? |
|---|---|---|
| **Hard** | the harness | Impossible. `model: haiku` *is* Haiku. `tools: Read, Grep` means no write tool exists to call. `maxTurns: 20` kills it at 20. The hook rewrites your command before it runs. |
| **Soft** | prose the model reads | It can drift. "Cap at 250 words", "write only your own section", "review the diff, not the summary" — followed because the reasoning is given, not because anything checks. |

The design deliberately puts the **expensive** guarantees in the hard layer. A
subagent physically cannot blow your budget on Opus, cannot write to a file it
has no tool for, and cannot loop forever. The soft layer carries judgment, where
a mechanical rule could not have anticipated the case anyway.

This is also why the prose in `skills/` always explains *why*. An agent that
knows the reason for a rule applies it correctly in a situation the rule did not
foresee. An agent handed a bare rule games it.

---

## 3. What the repo physically contains

Nothing here runs on its own. These are static files that a coding agent loads.

```
.claude-plugin/
  plugin.json          makes this installable via /plugin install
  marketplace.json     makes this installable via /plugin marketplace add

commands/              7 slash commands — prompt templates
agents/                14 Claude subagent definitions
codex/
  agents/              the same 14, as Codex .toml
  config.toml.sample   Codex config to merge by hand
  AGENTS.md.sample     Codex instructions to merge by hand

skills/
  penny/               the front door: classify, sharpen, route
  penny-build/         the 7-phase loop + phase contracts + state schema
  penny-council/       the five mandates + the council protocol
  penny-kit/           setup, doctor, help, and the model policy
  penny-playwright/    Playwright setup, verification, 7 examples
  miser-*/             14 token skills

scripts/               context-report.sh, miser-bench.mjs, rates.json
hooks/                 filter-tool-output.py
reference/             techniques.md — the catalog behind the miser skills
tools/                 audit.mjs — the maintainer consistency check
```

### How each kind of file is used

**`skills/*/SKILL.md`** — the frontmatter `name` and `description` are loaded
into context **every session** (~100 tokens each; 18 skills ≈ 1.8k standing
cost). The *body* loads only when the skill actually fires. That asymmetry is
the whole economics of skills: cheap to have, you pay on use. It is also why
every description in this repo lists trigger phrases — a description that does
not say when to fire is a skill the model never reaches for, and you paid for it
anyway.

**`skills/*/references/*.md`** — loaded on demand *by the skill body*, or passed
to a subagent as an absolute path. This is how a 200-line phase contract costs
nothing until the phase runs.

**`skills/*/templates/*.md`** — copied verbatim into *your* repo. Deliberately
contain no headers or comments of ours, because whatever is in them lands in
your project.

**`commands/*.md`** — prompt templates. `/penny foo` substitutes `foo` into
`$ARGUMENTS` and injects the resulting text as your turn. A command is not code;
it is a well-worded request with the boilerplate pre-written.

**`agents/*.md`** — subagent definitions. The frontmatter is **configuration the
harness obeys** (hard layer); the body is that agent's system prompt (soft
layer).

**`scripts/`, `hooks/`** — the only executable code in the repo, and the only
parts invoked *by* skills rather than being instructions themselves.

---

## 4. The front door: seven lanes

`/penny <anything>` is the only command you need day to day. It classifies the
request from the prompt alone — no file reads, no tool calls, so routing is
effectively free — and says the lane in one line so you can redirect it in one
word.

```
REFINE   an idea, not a request       → sharpen it, then re-route
BUILD    a clear change to make       → the build loop
DECIDE   a real trade-off             → the council
FIND     a question of fact           → a scout
TUNE     about the agent, not the app → the kit
DO       smaller than the ceremony    → just do it, no ceremony
EXPLAIN  a question about what exists → answer it
```

### The test that does the work

Only one boundary is genuinely hard — REFINE versus BUILD — and it has a sharp
test:

> **Can you write three checkable acceptance criteria from this request alone,
> without inventing requirements?**

Yes → BUILD. No → REFINE. "Checkable" means a machine could decide it: *"POST
/orders with an empty cart returns 422"*, not *"handles bad input well"*.

**A thin request is not a vague one.** "Add CSV export to the reports page" is
BUILD — a button, a file downloads, the columns match the table. The criteria are
recoverable from convention, so the loop's own gates will catch a wrong guess.
Interviewing someone who was already clear is the fastest way to make a tool
tiring, so the router is deliberately biased against asking.

### How refinement works

When the lane really is REFINE, the skill sorts the gaps into three piles
**before asking you anything**:

| Gap | What happens |
|---|---|
| A fact about your code or environment | **Scouted.** You are never asked something the repo answers — that is the most annoying question available. |
| Something with an obvious sensible default | **Assumed**, and labelled `assumed:` so you can veto it at a glance. |
| A decision only you can make | **Asked.** This pile only. |

Most gaps land in the first two piles. The third is usually two or three things:
who it is for, what "done" means, and the one constraint that changes the shape
of the work.

Then: **one question round, at most four questions**, each decision-shaped with
concrete options and a recommended default — because the option text is what
makes a question cheap to answer:

```
Who will use this?
  - Just me, locally (Recommended) — no auth, no hosting, SQLite
  - A small team — needs login and somewhere to run
  - Public users — needs auth, hosting, and real data handling
```

A second round only if an answer opened a genuinely new fork. Never a third. If
you say "you decide", it decides and writes the assumption down.

The result is `.penny/BRIEF.md`: goal, non-goals, 3–6 numbered criteria, labelled
assumptions, and open questions that did not block. It must be **sharper and
shorter** than the conversation that produced it — a brief longer than the
original idea plus your answers is a specification, which is a different and worse
thing.

One guard worth knowing about: refinement is required to **carry your exact
words** for anything you were specific about. If you said "429 with
Retry-After", the brief says that, not "proper rate-limit response". Numbers,
error codes, negations ("without touching the existing API") and things you
rejected ("not Firebase, we tried it") survive verbatim. A tidier brief that says
less is worse than no brief.

Then it re-classifies the sharpened brief and routes it.

---

## 5. The build loop

`/penny-build <ask>`, or reached automatically from the BUILD lane.

Seven phases, one subagent each, a gate between every pair. The orchestrator
never writes feature code — it runs the loop and enforces the gates.

| # | Phase | Agent | Gate to pass |
|---|---|---|---|
| 1 | PLAN | `plan-agent` | file-level tasks + numbered acceptance criteria + a test strategy |
| 2 | TEST | `test-agent` | tests exist, run, and fail **for the stated reason** |
| 3 | IMPLEMENT | `implement-agent` | all phase tests pass |
| 4 | REVIEW | `review-agent` | zero unresolved blocking findings |
| 5 | VERIFY | `verify-agent` | full suite + lint + typecheck + build + smoke green; every criterion met with evidence |
| 6 | REMEMBER | `remember-agent` | the non-obvious decisions written where your repo already keeps knowledge |
| 7 | IMPROVE | `improve-agent` | retro + ranked backlog; only low-risk quick wins applied |

### How a phase actually runs

1. The orchestrator copies `skills/penny-build/templates/BUILD_STATE.md` to your repo root and fills
   the header: `Status`, `Iteration: 1`, the scenario, and
   **`Baseline: <git rev-parse HEAD>`**. That sha is recorded up front because it
   is the only thing REVIEW and VERIFY can diff against later — if it is not
   captured now, they have nothing.
2. It spawns the phase agent with a ~6-line brief: working repo path, state file
   path, contract file path, phase name. The brief does **not** restate the
   contract — the agent loads that itself from
   `skills/penny-build/references/phase-contracts.md`. Restating it would re-pay
   the same tokens once per phase.
3. The agent runs **in its own context window**. It greps, reads, reasons, runs
   commands, writes its own section of `BUILD_STATE.md`, and returns `PASS` or
   `BLOCKED` plus three lines. Then its context is discarded.
4. The orchestrator reads **only** the section just written, plus the header,
   applies the gate, and advances `Status`.

That step 3 is the entire mechanism. A phase that burned 40k tokens exploring
your codebase costs your main session roughly 50.

### BUILD_STATE.md is the only channel

Every phase reads it for input and writes only its own section. All verbose
evidence — full logs, long diffs, dead ends — lives there rather than in chat.
Past ~1500 lines the orchestrator collapses older `### Iteration N` blocks to
their summary lines, because by iteration 3 reading the file whole costs more
than the phase did.

### Loop-backs are bounded

| Situation | Action |
|---|---|
| REVIEW returns blocking findings | back to IMPLEMENT, `Iteration += 1` |
| VERIFY fails on a code bug | back to IMPLEMENT, `Iteration += 1` |
| VERIFY fails because a *requirement* was wrong | back to PLAN, reset iteration |
| IMPLEMENT finds the test itself is wrong | back to TEST — it may **not** edit the test |
| Iteration hits 4 with no green VERIFY | **stop** and ask you |
| PLAN entered a 3rd time | **stop** — the request is underspecified |

Every loop-back appends a one-line reason to `## Loop log`, which is how IMPROVE
can see where the loop thrashed and propose a fix to the contract that let it.

### Five scenarios, one shape

The loop does not change shape, it changes emphasis: `greenfield` (PLAN picks the
stack and the first vertical slice), `feature` (PLAN maps onto existing modules
first), `bugfix` (TEST writes a failing repro; REVIEW checks the fix is
root-cause, not symptom), `refactor` (TEST writes characterization tests *before*
anything changes; VERIFY diffs behaviour, not just green CI), and `spike` (PLAN →
IMPLEMENT → REMEMBER only, with the waived phases recorded as waived rather than
silently skipped).

### Two rules the agents cannot talk themselves out of

- **IMPLEMENT may never edit a test to make it pass.** It sets `Status: TEST`,
  explains which test and why, and stops. Editing a test to go green destroys the
  only evidence the loop has that the code works.
- **REVIEW and VERIFY may never touch code.** Their write access is the state
  file only — not even an obvious one-line fix. Fixing it themselves hides the
  failure from the loop log and from the retro.

---

## 6. The council

`/penny-council <question>`, or reached from the DECIDE lane. For questions with
real trade-offs: architecture, stack choice, migration strategy, build-vs-buy.

Five **mandates** — not personalities. Each argues its brief honestly and is told
explicitly not to be agreeable.

| Member | Argues about |
|---|---|
| **Architect** | boundaries, coupling, and **what the choice forecloses** — which future options each option deletes |
| **Skeptic** | how it breaks: failure modes with a named trigger, and the unstated assumption underneath |
| **Pragmatist** | the shortest honest path to shipping; what can be deferred; whether the repo already has the pieces |
| **Operator** | the day after: deploy, observe, debug at 3am, roll back, migrate off |
| **Economist** | total cost — build, run, **tokens**, and the maintenance tail nobody counts |

Then `council-referee` adjudicates. It is not a sixth opinion.

### How it runs

**Step 0 — you frame it.** The question must be a choice between **named
options**, with the settled constraints and the ranked decision criteria stated.
A council on a vague question returns five essays. If the question is not
actually contested, the skill says so and refuses.

**Step 1 — round 1, in parallel.** All five spawn in one message. Each writes
**its own file** — `.council/01-architect.md` and so on — capped at 250 words.

> This is not a style choice. Five agents writing one shared file in parallel
> interleave their writes and corrupt it. One file per member, assembled
> afterwards, is the only shape that survives.

Each file contains a position, a case, **the strongest argument against its own
position** (required — a mandate that cannot state the case against itself has
not thought), what would change its mind, and its evidence.

**Step 2 — one rebuttal round.** The orchestrator writes a **~40-line digest**:
one sentence per member plus its single strongest claim. That digest is the only
thing that crosses between members — uncapped, round 2 becomes five full
positions re-sent five times. Each member must then do one of three things
explicitly: concede a named point, rebut a claim with evidence, or name the
measurement that would settle it. Restating round 1 is a failed brief.

Exactly one round. Never two. Round 3 has never changed a verdict and always
costs another five runs.

**Step 3 — the referee.** It reads all five files in full and writes
`## Adjudication`. This is why it is a separate agent rather than the
orchestrator doing it: five full positions in your context defeats the point of
the structure. Its job, ranked:

1. **Separate verified fact from confident assertion.** Five agents writing
   fluent prose all sound equally sure; some checked the code and some did not.
   The referee names the member next to every unverified claim, and goes and
   reads the code when two members disagree about what it does.
2. **Report the real agreement.** Five mandates with different incentives
   converging is the most reliable output of the whole exercise.
3. **Reduce each disagreement to a measurement** that would settle it.
4. Name the load-bearing assumption under each position.

**Step 4 — you decide.** You read the adjudication, not the five files. You may
overrule the referee (say so and why). If the deciding evidence does not exist
yet, you do not decide — you go measure. If the split is about *values* (speed vs
correctness), that is escalated to you rather than resolved.

**Cost, honestly: ~11 agent runs.** Worth it for a decision you will live with
for a year, absurd for one you will revisit next week.

---

## 7. The scout

`/penny-scout <question>`, or used internally by the other skills.

One bounded question, answered in a throwaway context, returning **the answer,
not the files**. `haiku`, read-only — it has no write tool at all.

It follows a strict cheapest-first ladder and stops as soon as it can answer:
search (`rg -n`, names and line numbers) → skeleton (signatures before bodies) →
range read (`sed -n '120,180p'`) → whole file (only under ~200 lines). Every
command capped: `-m 20`, `| head -30`, `--max-columns 200`.

Its report is at most ~15 lines of `path:line — what`, plus what it searched.
"Not found" is a valid and often valuable answer — it is explicitly told to
report absence rather than widen the search until it finds something.

Use it instead of reading three candidate files yourself. Do not use it for one
or two known files: agent startup costs more than a small read.

---

## 8. Model and effort policy

> **One expensive brain, many cheap hands.**

Four coarse tiers. Deliberately four — a fifth is a decision you would have to
make every time, and that costs more than it saves.

### Claude Code

| Tier | Who | Model | Effort |
|---|---|---|---|
| **Orchestrator** | your session | `opus` | `xhigh` |
| **Judgment** | plan, review, architect, skeptic, referee | `sonnet` | `high` |
| **Craft** | test, implement, verify, improve, pragmatist | `sonnet` | `medium` |
| **Hands** | remember, scout, operator, economist | `haiku` | *(unset)* |

### Codex

| Tier | Model | `model_reasoning_effort` |
|---|---|---|
| Orchestrator (parent session) | `gpt-6.2-sol` | `xhigh` |
| Judgment | `gpt-6.2-sol` | `high` |
| Craft | `gpt-6.2-sol` | `medium` |
| Hands | `gpt-6-luna` | `high` |

**No subagent in this kit runs on Opus.** If one seems to need it, the brief was
too vague — tighten the brief, not the tier. Two failed Sonnet attempts still
cost less than one Opus subagent carrying a cold context.

### Four things that look like mistakes but are not

- **`effort` is unset on every Haiku agent.** Effort levels are model-dependent
  and the `haiku` alias has pointed at models that *reject* the parameter at the
  API. Omitting the field lets Claude Code send whatever that model accepts, so
  the agent launches either way. Setting `effort: low` there buys nothing and can
  cost you the spawn.
- **`gpt-6-luna` at `high` *is* the cheap tier.** Effort is not comparable across
  models — OpenAI's own guidance is to start Luna at `high` because its lower
  levels are weaker than Sol's. Read the model+effort *pair*, never the word
  alone.
- **VERIFY sits in Craft, not Hands,** even though its work is mechanical. It
  emits the `RESULT: PASS/FAIL` that gates the loop, and a gate that misreads a
  failure as a pass is the one cheap-tier mistake this design cannot absorb.
- **Codex resolves model and effort *independently*.** An agent file that sets
  only `model` keeps an effort resolved from the `[agents]` default or the parent
  — so a cheap-model agent silently inherits the orchestrator's `xhigh` and stops
  being cheap. Every file here sets **both**.

### Frontmatter that is pure savings

Every agent sets these, and none of them is decoration:

| Field | Why |
|---|---|
| `omitClaudeMd: true` | starts the agent without your CLAUDE.md. A bounded agent gets everything from its brief; loading CLAUDE.md into 14 agents pays for the same tokens 14 times. Kept only on the phase agents that must follow repo conventions. |
| `maxTurns` | a hard stop. An agent that has not finished in its budget is looping, and a looping agent bills every turn at full context. |
| `tools` | **the allowlist is the token budget.** An agent without `Write` cannot write, so it also cannot be asked to. |
| `disallowedTools` | removes inherited tools you forgot to think about. |

### Escalation

Start at the tier in the table; escalate only on evidence. A Craft agent that
fails the same task twice with a clear brief gets re-briefed once, then raised.
If the orchestrator disagrees with Judgment output twice on the same question,
the question is architectural and the orchestrator answers it itself.

Stated plainly: anything where a wrong answer is expensive to discover later —
schema migrations, auth, money movement, data deletion — goes to the orchestrator
directly. Do not delegate those to a cheap tier to save tokens.

Full reasoning: [`skills/penny-kit/references/model-policy.md`](skills/penny-kit/references/model-policy.md).

---

## 9. Where the token savings come from

In order of effect. Model routing is **last** for a reason.

### 1. Isolation (most of it)

Verbose work happens in contexts that are discarded. This is what the loop and
the council are *for*. A subagent's 40k-token test run becomes a three-line
report.

### 2. The output filter hook

`hooks/filter-tool-output.py` runs as a `PreToolUse` hook on `Bash`. It rewrites
the **command** before it executes, so trimmed output is never context and is
never billed. A 10,000-line log becomes ~100 lines.

What it rewrites: test runners keep failures with 5 lines of context; builds and
type checks keep errors; installs keep the tail; linters keep findings; container
and journal logs keep error lines; `git log` gets `--oneline | head -30`;
`git diff` and `git show` are capped; unbounded `find` is capped.

What it deliberately leaves alone: anything already piped or redirected, any
compound command (`&&`, `||`, `;`), and already-bounded forms like
`git diff --stat` — appending a pipe there would change what runs.

**The safety property that matters:** filtered test and build commands end with
`exit ${PIPESTATUS[0]}` and a one-line `[tokenmiser] exit=N` marker, so a
suppressed failure can never read as a pass.

Turn it off for one shell with `TOKENMISER_FILTER_OFF=1`.

### 3. Bounded starts

`omitClaudeMd`, tight `tools`, `maxTurns`, and spawn depth pinned to `1` so no
subagent can start its own fan-out.

### 4. Retrieval discipline

Search → skeleton → range read → whole file, with a cap on every command. Never
`cat` a log, a lockfile, `dist/`, or generated code — one `package-lock.json` is
50k+ tokens and answers nothing.

### 5. Then model routing

A Haiku agent carrying 150k tokens of context costs more than a Sonnet agent
carrying 8k. Fix context size first; `/miser-audit` ranks the sinks.

### Measuring it

Nothing here is real until it shows up in a measurement:

```bash
bash "$AGENT_KIT/scripts/context-report.sh"                      # always-on load
node "$AGENT_KIT/scripts/miser-bench.mjs" report --since 7d      # per-turn cost
node "$AGENT_KIT/scripts/miser-bench.mjs" baseline save pre      # ...change one thing...
node "$AGENT_KIT/scripts/miser-bench.mjs" baseline diff pre post
```

The four numbers that matter:

| Number | Target | If it is off |
|---|---|---|
| **eff input/turn** | trending down | the dominant term; everything else is about shrinking it |
| **cache read share** | >90%; under ~80% is a problem | something mutates the prompt prefix mid-session. Model routing is irrelevant until this is fixed |
| **output/turn** | lower after terse mode | verbosity |
| **thinking share of output** | <~35% on routine work | effort is too high for what you mostly do |

Compare **per-turn** numbers, never totals — a bigger task legitimately costs
more. And usage records are deduplicated by request id, because Claude Code
writes several log lines per response and counting them all inflates a session
2–3×.

---

## 10. The 15 skills

### Playwright Integration

| Skill | Purpose | Use for |
|---|---|---|
| `penny-playwright` | **Browser automation** | Playwright setup, testing patterns, 7 production examples |

Seven working examples cover: basic navigation, form submission, web scraping, API
interception, mobile testing, visual regression, and performance metrics. Copy any
example to your project and customize. Use `/penny-playwright help` to get started.

### The 14 miser skills

Model-invoked — you rarely type these; the agent reaches for them. This is the
[tokenmiser](https://github.com/Srinivasan-78/tokenmiser) toolkit, vendored in.

| Skill | Lever | Fires when |
|---|---|---|
| `miser-help` | index | "what token skills do I have" |
| `miser-audit` | **diagnose** | "why is my context so big" — produces a ranked prune list with token estimates |
| `miser-bench` | **measure** | "did that actually help" — per-session totals, cache share, A/B protocol |
| `miser-speak` | output tokens | terse mode, levels lite/full/ultra |
| `miser-compress` | always-on input | "shrink my CLAUDE.md" |
| `miser-session` | history per turn | `/clear` vs `/compact`, handoff files, cache TTL |
| `miser-read` | file reads | retrieval discipline, repo maps |
| `miser-tools` | tool schemas | "MCP is eating my context" |
| `miser-delegate` | isolation | "should I use a subagent", and the contract that makes it pay |
| `miser-model` | model + thinking | routing, effort, thinking spend |
| `miser-prompt` | scope | "my requests trigger huge scans" |
| `miser-hooks` | pre-context filtering | "logs are blowing up my context" |
| `miser-git` | commit + review | terse commit messages, one-line review findings |
| `miser-api` | your own code | prompt caching, batch, RAG, model routing in an app you are building |

`reference/techniques.md` is the catalog behind them, readable on its own.

---

## 11. Install

### Claude Code — as a plugin (recommended)

```
/plugin marketplace add Srinivasan-78/pennywright
/plugin install pennywright
```

That is it for the skills, agents and commands. This includes Playwright. Then, in order:

```
/penny-setup      # settings.json tiers, the filter hook, context diet, MCP prune, Playwright
/penny-doctor     # confirm it took
```

`/penny-setup` detects which runtimes you have, proposes **every** file write as
a diff first, backs up before writing, and merges into existing config rather
than overwriting. It is idempotent — safe to re-run.

It also measures first and saves a `pre` baseline, so the change can be judged
later rather than assumed.

### Manual install

Copy what you want:

```bash
# skills (Claude Code)
cp -r skills/* ~/.claude/skills/

# skills (Codex, and any agent that reads the ~/.agents convention)
cp -r skills/miser-* ~/.agents/skills/

# agents and commands (Claude Code)
cp agents/*.md    ~/.claude/agents/
cp commands/*.md  ~/.claude/commands/

# Codex agents
mkdir -p ~/.codex/agents && cp codex/agents/*.toml ~/.codex/agents/
```

Then export the package root so the skills can find the bundled scripts:

```bash
export AGENT_KIT="/path/to/pennywright"     # add to ~/.bashrc or ~/.zshrc
```

`$MISER` is still honoured as an alias for anyone coming from a standalone
tokenmiser install.

### The hook, which is two steps

```bash
mkdir -p ~/.claude/hooks
cp "$AGENT_KIT/hooks/filter-tool-output.py" ~/.claude/hooks/
chmod +x ~/.claude/hooks/filter-tool-output.py
python3 ~/.claude/hooks/filter-tool-output.py --selftest    # 14 cases, all must pass
```

Then add the `PreToolUse` entry in §12. **Copying the file is not enough** — a
hook on disk that `settings.json` does not reference does nothing, and nothing
warns you. That is the single most common broken state. `/hooks` in session must
list it.

On Windows the interpreter is `python`, not `python3`.

---

## 12. Configuration reference

What `/penny-setup` writes to `~/.claude/settings.json` (or
`.claude/settings.json` for one repo), and why each line is there.

```json
{
  "model": "opus",
  "effortLevel": "xhigh",
  "crossSessionInbound": "hold",
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "sonnet",
    "CLAUDE_CODE_SUBAGENT_EFFORT": "medium",
    "CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH": "1",
    "CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS": "6",
    "CLAUDE_CODE_GOAL_CHECKIN_MINUTES": "0"
  },
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/filter-tool-output.py" }] }
    ]
  }
}
```

| Key | Why |
|---|---|
| `model: opus` | the orchestrator is the one place Opus earns its price |
| `effortLevel: xhigh` | orchestrator thinking depth. A **default**, not a floor — `/effort` still moves it, and each agent's own `effort:` still wins for that agent |
| `crossSessionInbound: hold` | a message from another session arrives as a new turn, re-sending your whole context. Hold shows a notice instead |
| `CLAUDE_CODE_SUBAGENT_MODEL` | fleet default. Each agent's own `model:` beats it, so the Haiku agents stay Haiku |
| `CLAUDE_CODE_SUBAGENT_EFFORT` | fleet default effort. Needs Claude Code v2.1.315+; harmless and ignored below that |
| `..._MAX_SUBAGENT_SPAWN_DEPTH: 1` | stops a subagent spawning its own. Nested fan-out is the fastest route to a surprise bill, and nothing here needs depth |
| `..._MAX_CONCURRENT_SUBAGENTS: 6` | the council runs 5 plus a referee. The default 20 lets a stray prompt start 20 |
| `..._GOAL_CHECKIN_MINUTES: 0` | check-ins fire full-context turns while background work runs |

### Do NOT set these

- **`CLAUDE_CODE_EFFORT_LEVEL`** — it overrides every agent's own `effort:`,
  flattening four tiers into one. Use the `effortLevel` *setting* above for the
  orchestrator default; that leaves per-agent effort intact. **This is the
  number-one reason the kit stops saving money.**
- **`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`** — the same problem, for models.
- **`MAX_THINKING_TOKENS`** — on adaptive-reasoning models Claude Code ignores
  the number, so it reads as a working budget cap while capping nothing. Effort is
  the real control. If an older tokenmiser install left it set, `/penny-doctor`
  flags it.
- **`ENABLE_TOOL_SEARCH=false`** — MCP tools are deferred by default, and that
  deferral is the saving.

### Honest caveat

`model` and `effortLevel` set the **default for new sessions**. They do not
change a running session, and if you type `/model sonnet` you have overridden
them — correctly.

---

## 13. Codex differences

Same shape, different plumbing. Codex has native subagents, so the design
transfers almost exactly.

| What | Claude Code | Codex |
|---|---|---|
| Agent definitions | `agents/*.md` frontmatter | `~/.codex/agents/*.toml` |
| Instructions | `CLAUDE.md` | `AGENTS.md` |
| Workflow entry | slash commands | trigger phrases in `AGENTS.md` |
| Skills | `~/.claude/skills/` | `~/.agents/skills/` |
| Fleet config | `settings.json` env | `[agents]` in `config.toml` |

Because Codex has no slash commands for these workflows, `AGENTS.md.sample`
carries the routing table, the loop, and the council protocol. A prompt that names
the workflow works:

```
Convene the council on this: should sessions live in Redis or Postgres?
Spawn one agent per role, wait for all five, then have the referee adjudicate.
```

A good delegation prompt states three things: **how to divide the work**,
**whether to wait for all agents**, and **what summary to return**. Leaving any
one out is how a council becomes five essays.

### Three Codex-specific traps

1. **The half-pin.** Covered in §8 — set `model` and `model_reasoning_effort`
   together or neither.
2. **An agent file cannot sandbox.** `sandbox_mode`, `approval_policy`,
   `model_provider` and `mcp_servers` always come from the parent session. A
   "read-only" Codex agent is read-only **by instruction only** — never treat an
   agent file as a security boundary. Set the permission mode on the parent turn
   *before* asking for delegation; subagents inherit it, `--yolo` included.
3. **`hide_agent_reasoning` is cosmetic.** It suppresses reasoning events in the
   TUI and `codex exec`. Reasoning still happens and is still billed. It buys a
   readable transcript, not tokens.

Also worth knowing: subagent workflows on Codex spend **more** tokens than a
single-agent run of the same task, because each subagent does its own model and
tool work. What they buy is a parent thread that stays clean and work that runs
in parallel.

`config.toml` and `AGENTS.md` are **never written automatically** — merging them
wrongly breaks a working setup. `/penny-setup` shows the diff and asks.

---

## 14. Diagnosing it

`/penny-doctor` is read-only and reports rather than fixes. It runs its checks in
severity order, and **section A is the one that matters** — those are the failures
that make the kit look installed while doing nothing:

| Check | Why it is first |
|---|---|
| `CLAUDE_CODE_EFFORT_LEVEL` set | flattens every tier into one |
| `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` | same, for models |
| hook present but not wired (or wired but missing) | the filter is inert and silent |
| `$AGENT_KIT` unset | every script path in every skill breaks |
| half-pinned agents | the unset half inherits an expensive value |
| duplicate skills across roots | you pay for the same skill twice every session |

Then configuration (B/C), then **measured** health (D) — because configuration is
intent and measurement is outcome. If there are no session logs yet it reports
section D as skipped rather than showing zeros as if they were healthy.

It ends with **one** highest-value fix, not a list.

In session, pair it with `/context` (live breakdown), `/usage` (attribution to
skills, subagents, plugins, MCP) and `/cost` (cache hit ratio, misses, and the
likely cause of the last miss) — those see live state the scripts cannot.

---

## 15. Honest limitations

- **The kit is not free.** 18 skills advertise their descriptions every session,
  roughly 1.8k tokens of standing cost. On a small repo with quiet tests it may
  not pay for itself. `miser-bench` is how you find out instead of assuming.
  Delete any skill directory you never fire.
- **A council spends more tokens than deciding yourself.** ~11 agent runs. What
  it buys is a defensible decision and a clean main thread, not a smaller bill.
- **Most of this is instructions, not enforcement.** See §2. The word caps,
  section-ownership rules and "don't read the whole file" discipline are followed
  because the reasoning is given, not because anything checks.
- **`hide_agent_reasoning` saves no tokens.** Display only.
- **`MAX_THINKING_TOKENS` does nothing on current models.** Adaptive models
  ignore the number.
- **Terse mode moves less than you would hope** on coding tasks. Output is a
  small fraction of a turn where input dominates — one benchmark measured +7%
  total. Pair it with the input-side levers; do not expect it to move a big bill
  alone.
- **Model names drift.** The Codex model strings in `config.toml.sample` are
  examples — verify them against what your plan actually serves. `/penny-doctor`
  reads back what is configured rather than assuming.
- **No tests ship with this repo.** It is prose; `AGENTS.md` carries the manual
  consistency checks to run before committing a change.

---

## 16. Security

**`hooks/filter-tool-output.py` executes shell commands with your permissions.
Read it before installing it.** It is 177 lines and worth the five minutes. The
invariant it holds: a rewrite may filter **output**; it may never change **which
command runs**. Anything else is a bug.

The `exit ${PIPESTATUS[0]}` suffix on filtered test and build commands exists so
a suppressed failure can never be mistaken for a pass.

`/penny-setup` will never add a write or network command to a permission
allowlist on your behalf, and proposes every file write as a diff first.

On Codex, see trap 2 in §13: an agent file is not a security boundary.

---

## 17. Extending it

### A new skill

Create `skills/<name>/SKILL.md` with `name` (matching the directory exactly) and
a `description` that **says when to fire**, including trigger phrases. The
description is the only part loaded every session, so it is both your routing
signal and your standing cost.

### A new agent

Create `agents/<name>.md`. Pin `model`, pin `effort` unless the model is Haiku,
set `maxTurns`, and give it a `tools` allowlist. Read
`skills/penny-kit/references/model-policy.md` first and pick an existing tier
rather than inventing one. Mirror it in `codex/agents/<name>.toml` with **both**
`model` and `model_reasoning_effort`.

### A new filter rule

No script edit needed — `~/.claude/tokenmiser-filter.json`:

```json
{ "rules": [["^my-runner\\b", "{cmd} 2>&1 | tail -40"]] }
```

`{cmd}` is the original command, `{args}` everything after the first word. User
rules run after the built-ins.

### Before you commit

```bash
node tools/audit.mjs
```

No dependencies, exits non-zero on a problem. It checks skill frontmatter, the
model policy (including that no subagent is on Opus), agent bounds, Codex pin
pairing and TOML structure, tier agreement between the README and the policy
file, dangling references and links, index completeness, documented counts, and
stale identifiers. `AGENTS.md` lists the full set.

A reference path that does not resolve is the worst failure in this design — the
subagent spawns anyway and runs with no contract at all.

---

## License

MIT — see [`LICENSE`](LICENSE).

`skills/miser-*`, `scripts/`, `hooks/` and `reference/` are vendored from
[tokenmiser](https://github.com/Srinivasan-78/tokenmiser) by the same author.
