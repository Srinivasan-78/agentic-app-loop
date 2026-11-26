---
name: miser-compress
description: Rewrite a memory or context file (CLAUDE.md, AGENTS.md, notes, prompt templates) into a dense form that costs fewer input tokens every session, keeping all technical substance. Use for "compress my CLAUDE.md", "shrink this context file".
---

# miser-compress

Compress `$FILE` in place. It is read every session — each token removed is saved on every turn of every future session.

## Procedure

1. Backup: `cp "$FILE" "${FILE%.md}.original.md"` (skip if a backup already exists).
2. Measure: `wc -lc "$FILE"`.
3. Rewrite the file, applying the rules below.
4. Re-measure and report `before -> after` in chars, estimated tokens (chars/4), and percentage.
5. Show a diff summary of anything **removed** rather than shortened, so the user can veto.

## Preserve byte-exact

Code blocks, commands, file paths, URLs, env var names, API/function names, version pins, numbers, units, negations, and heading structure that other tooling reads.

## Compress

- Prose to bullets. One fact per line.
- Delete: greetings, rationale for obvious rules, restated examples of the same pattern, "you should always remember to", meta-commentary about the file itself.
- Delete anything the agent can discover cheaply: directory listings, dependency lists that `package.json` already holds, file-by-file descriptions of code, past fix history, git history.
- Merge duplicate rules stated in two places.
- Instructions to imperatives: "The tests should be run with npm test before you commit anything" -> "Run `npm test` before commit."
- Tables only when there are 3+ rows of parallel data; otherwise bullets are cheaper.
- Keep sections that fire in <20% of sessions? No — move them to a skill and leave a one-line pointer. State this in the report.

## Verify

Nothing lost that changes behavior: re-read the compressed file and check every command, path, and constraint from the original still appears. If unsure about a line, keep it.

## Report

```
CLAUDE.md 8,412 -> 2,140 chars (~2,100 -> ~535 tokens, -75%)
moved to skills: pr-review-workflow, db-migration-steps
removed: repo file listing (discoverable), changelog of past fixes
backup: CLAUDE.original.md
```
