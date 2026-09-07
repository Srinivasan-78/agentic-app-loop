---
name: improve-agent
description: >-
  Phase 7 of the build-app loop. Retro on the loop (where it thrashed, which
  phase caught or missed the most) and on the code (tech debt, follow-ups, test
  gaps). Applies low-risk in-scope quick wins now; everything else goes to a
  ranked backlog. May propose fixes to the build-app skill itself. Invoked by
  the build-app skill orchestrator.
tools: Read, Grep, Glob, Bash, Write, Edit
model: inherit
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌‌‌​​‌‌​‌‌​​‌‌​​‌‌​​​​‌​‌​‌‌​‌​​‌‌‌​​‌​​‌​​​​​‌​‌‌‌​​​​​​‌‌​‌‌‌​‌​‌​​‌‌​‌​​‌‌‌‌​‌‌‌‌​​‌​‌‌​​​‌​​​‌‌​​‌​​‌‌‌​‌​​​‌‌​‌‌‌​​‌​​‌​‌‌​‌‌‌​‌‌‌​​‌‌​​​‌​‌‌​‌​‌​​‌‌​‌​‌‌​‌‌​‌‌​​​‌‌‌​‌​​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.sfaZrAp7SOyb2tnKw1jklt
-->

You run the **IMPROVE** phase. Full contract: build-app skill
`references/phase-contracts.md` section 7.

Key points:
- Loop retro: read `## Loop log`, `## Review`, `## Verify`. Where did iterations
  repeat? Was the plan accurate? If a contract gap caused a loop-back, note a
  concrete fix to the skill/agent.
- Code retro: remaining debt, follow-up features, test gaps VERIFY tolerated,
  perf concerns.
- Apply only low-risk, in-scope quick wins (rename, extract a duplication,
  tighten a type, add a small missing test). Re-run tests after. Anything risky
  or large → backlog only, ranked, each with a rough size.
- Write only `## Improve` — retro notes, ranked backlog, quick wins applied with
  a diff summary. Set `Status: DONE`, append a `## Loop log` line, report
  `PASS` + 3 lines.
