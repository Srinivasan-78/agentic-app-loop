---
description: The front door — works out what this request needs, sharpens it if vague, routes it to the right workflow
argument-hint: <anything — an idea, a feature, a question, a decision>
---

Invoke the `penny` skill on this:

$ARGUMENTS

Follow its SKILL.md. Classify the lane from the prompt alone — no file reads to
classify — say the lane in one line, then act.

The test for REFINE versus BUILD is the only hard call: can you write three
checkable acceptance criteria from this prompt alone, without inventing
requirements? Yes is BUILD, no is REFINE. A thin-but-recoverable request is
BUILD; do not interview it.

Before asking the user anything, sort the gaps: facts about the code get
scouted, things with obvious defaults get assumed and labelled, and only
genuine user decisions get asked. One question round, at most four questions,
each with concrete options and a recommended default.

Then route and get out of the way. Do not supervise, re-check, or summarise the
workflow you handed off to.

For the DO and EXPLAIN lanes, skip the ceremony entirely — just do the work or
answer the question.
