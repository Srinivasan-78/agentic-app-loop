---
description: Build or extend an app through the PLAN→TEST→IMPLEMENT→REVIEW→VERIFY→REMEMBER→IMPROVE loop
argument-hint: <what to build / feature / bug / refactor>
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​‌​‌​‌​​​‌​​‌​‌​​‌​​​‌‌‌​‌‌​‌​​‌​​‌‌​​​‌​‌‌​​‌​‌​‌‌‌​‌​​​‌​‌​​​​​​‌‌​‌‌‌​‌‌​​‌​‌​‌‌‌​​​‌​​‌‌​‌​​​‌‌​‌‌‌​​‌‌‌‌​‌​​‌‌‌‌​​‌​‌‌​‌‌‌‌​‌​‌​‌​​​‌​​‌​‌‌​‌‌‌​‌‌​​‌​​​‌​‌​‌‌​​‌‌‌​‌​‌​‌​​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.TJGi1etP7eq4nzyoTKvEgT
-->

Invoke the `build-app` skill to handle this request through its 7-phase loop,
running each phase as its own subagent:

$ARGUMENTS

Follow the skill's SKILL.md: set up `BUILD_STATE.md` in the working repo, detect
the scenario, then run PLAN → TEST → IMPLEMENT → REVIEW → VERIFY → REMEMBER →
IMPROVE, enforcing the gate after each phase and applying the loop-back rules.
Report back only the final summary, not the whole state file.
