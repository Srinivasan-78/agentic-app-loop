<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌​‌​‌‌‌​​‌‌​​‌​​‌‌​​​‌​​‌‌​‌‌​​​‌‌‌​‌‌​​‌​‌‌​​‌​‌‌​​‌‌‌​‌‌​​​‌​​‌​​‌​‌​​‌​‌​‌‌‌​‌‌​​​‌‌​​‌‌​​‌​​‌‌‌​‌‌‌​​‌‌​​‌‌​‌‌‌​​​‌​​‌‌​​‌‌​‌‌‌​‌​‌​‌​​‌​‌‌​‌​​‌​​‌​​‌​‌‌​‌​‌​​‌​‌‌​‌‌‌​​‌‌⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.W2blvYgbJWc2w3q3uKI-Ks
-->
# agentic-app-loop

A Claude Code skill for building and extending **real applications** through a
disciplined 7-phase loop, where **each phase is its own bounded subagent**:

```
PLAN → TEST → IMPLEMENT → REVIEW → VERIFY → REMEMBER → IMPROVE
 │      │        │           │        │         │          │
plan   test   implement   review   verify   remember   improve
-agent -agent -agent      -agent   -agent   -agent     -agent
```

The main skill (`build-app`) is the **orchestrator**. It never writes feature
code itself — it runs the phases, enforces a gate after each one, handles
loop-backs, and keeps its own context small by delegating everything verbose to
a subagent. Phases talk to each other only through a single `BUILD_STATE.md`
file in the target repo.

## Why

Ad-hoc "just build it" runs skip tests, skip review, and forget what they
learned. This loop makes each concern a hard checkpoint with a dedicated agent
and a written contract, so quality is structural rather than optional.

## The phases

| Phase | Agent | Does | Gate |
|-------|-------|------|------|
| **PLAN** | `plan-agent` | Goal/non-goals, stack & layout (greenfield), file-level tasks, **numbered acceptance criteria**, test strategy, risks. Read-only on code. | Plan has tasks + criteria + test strategy |
| **TEST** | `test-agent` | Writes tests encoding the criteria, runs them, confirms they fail **for the right reason**. No implementation. | Tests fail only due to absent implementation |
| **IMPLEMENT** | `implement-agent` | Minimal code, task by task, until the phase tests pass. Reuses existing code/conventions. | All phase tests green |
| **REVIEW** | `review-agent` | Reviews the real diff for correctness, security, test quality, simplification. Ranks findings. Fixes nothing. | 0 unresolved BLOCKING findings |
| **VERIFY** | `verify-agent` | Full suite + lint + typecheck + build + smoke test of the running app; walks each acceptance criterion with evidence. | Everything green, every criterion Met |
| **REMEMBER** | `remember-agent` | Writes the non-obvious knowledge (decisions, gotchas, new patterns) into the project's existing knowledge store. | Notes written |
| **IMPROVE** | `improve-agent` | Retro on loop + code; applies safe quick wins; writes a ranked backlog. | Retro + backlog written |

Loop-backs: REVIEW blocking → IMPLEMENT; VERIFY fail → IMPLEMENT or PLAN; a wrong
test → TEST. After 4 iterations without a green VERIFY, the loop stops and asks
you.

## Scenarios

The loop keeps its shape for every case; the phases adapt:

- **Greenfield app** — PLAN picks the stack and scaffolds; TEST bootstraps the runner.
- **New feature** — PLAN maps onto existing modules/conventions first.
- **Bug fix** — TEST writes a failing regression test; REVIEW checks it's root-cause.
- **Refactor** — TEST adds characterization tests; VERIFY diffs behavior, not just CI.
- **Spike** — PLAN → IMPLEMENT → REMEMBER only, explicitly waiving the rest.

## Install

**With npx (recommended)** — copies the skill, the 7 subagents, and the
`/build-app` command into a Claude Code config dir:

```
# into ./.claude of the current project
npx github:Srinivasan-78/agentic-app-loop

# into ~/.claude (every project on this machine)
npx github:Srinivasan-78/agentic-app-loop --global

# into a specific project
npx github:Srinivasan-78/agentic-app-loop --dir path/to/project

# preview only
npx github:Srinivasan-78/agentic-app-loop --dry-run
```

Flags: `--global`/`-g`, `--dir <path>`, `--force` (overwrite), `--dry-run`,
`--help`. Restart Claude Code afterwards so it discovers the new skill.

**As a plugin:**

```
/plugin marketplace add Srinivasan-78/agentic-app-loop
/plugin install agentic-app-loop@agentic-app-loop
```

**Or manually:** copy `skills/build-app` into `.claude/skills/` and the files in
`agents/` into `.claude/agents/` of your project (or `~/.claude/`).

## Use

```
/build-app add rate limiting to the public API, 100 req/min per key
```

or just ask in natural language — "build me a URL shortener, do it properly with
the loop" — and the skill triggers.

Watch progress in `BUILD_STATE.md` at the root of the repo being built. When the
loop finishes you get a short report: what shipped, verify evidence, what was
remembered, top backlog items.

## Layout

```
bin/
  install.mjs           the `npx` installer (GitHub user Srinivasan-78 baked in)
package.json            exposes the `agentic-app-loop` bin
.claude-plugin/
  plugin.json           plugin manifest
  marketplace.json      so `/plugin marketplace add` works on this repo
skills/build-app/
  SKILL.md              the orchestrator
  references/
    phase-contracts.md  exact per-phase contract each subagent follows
    state-schema.md     shape of BUILD_STATE.md
  templates/
    BUILD_STATE.md      copied into the target repo per run
agents/
  plan-agent.md  test-agent.md  implement-agent.md  review-agent.md
  verify-agent.md  remember-agent.md  improve-agent.md
commands/
  build-app.md          the /build-app slash command
.github/workflows/
  authormark.yml        authorship-watermark check via Srinivasan-78/authormark-watch
```

## Customizing

- Tune a phase by editing its section in `references/phase-contracts.md` — the
  agent files are thin and defer to it.
- Change models per phase in each agent's frontmatter (`plan` and `review`
  default to `opus`, the rest `inherit`).
- Adjust the iteration cap and loop-back rules in `SKILL.md`.

## Authorship

Every source file is watermarked with an `@authormark v1` header and a keyed
fingerprint, sealed in `AUTHORSHIP.json` / `AUTHORSHIP.log`. This repo is run
through the [AuthorMark](https://github.com/Srinivasan-78/authormark-watch)
engine:

- `.github/workflows/authormark.yml` runs a presence check on every push/PR
  (and a full fingerprint verify when `AUTHORMARK_KEY` is set as a secret).
- The account-wide scheduled watch in `authormark-watch` picks this repo up
  automatically for the daily supervision pass.

Do not delete or relocate the header blocks — see [AGENTS.md](AGENTS.md). After
editing a file, refresh its fingerprint with
`node authormark.mjs stamp <file>` from the AuthorMark engine.

## License

MIT — see [LICENSE](LICENSE).
