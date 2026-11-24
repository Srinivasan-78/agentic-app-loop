---
description: Verify the agent kit — tiers, hook wiring, context health. Read-only.
---

Invoke the `penny-kit` skill and run its **Doctor** section (§2), following
`skills/penny-kit/references/doctor-checks.md`.

Read-only. Do not fix anything — report, and offer `/penny-setup` for what is
wrong.

Run section A first and in full. Those are the checks that make the kit look
installed while doing nothing: a forced effort level that flattens every tier, a
hook wired to a file that is gone, half-pinned agents, duplicate skills.

Print one line per check (`ok` / `warn` / `fail` / `skip`), then the single
highest-value fix. One fix, not a list. Skip a runtime that is not installed by
saying so, not by omitting the row.

If there are no session logs yet, report section D as skipped rather than
reporting zeros as if they were healthy.
