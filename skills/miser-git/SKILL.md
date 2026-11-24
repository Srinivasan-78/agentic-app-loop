---
name: miser-git
description: Terse commit messages and one-line code review comments — dense output for git work, in normal prose since it is read by other humans. Use for "write the commit message", "review this diff", "review my PR".
---

# miser-git

Compression here is about saying it once, not about caveman grammar. Commit and review text is persisted for other people: normal prose, correct grammar, no filler.

## Commit messages

Gather cheaply — never `git diff` in full:

```bash
git status --short && git diff --cached --stat
git diff --cached | head -400        # only if the stat is not enough
```

Format:

```
<type>(<scope>): <what changed, imperative, <=60 chars>

<why, 1-2 lines, only when the diff does not show it>
```
Types: `feat` `fix` `refactor` `perf` `test` `docs` `chore` `build` `ci`.

Rules: no bullet list restating each file (the diff shows it), no "this commit", no summary of the summary. One line is a complete commit message when the change is obvious. Body only for the reason, a breaking change, or an issue link.

## Code review

Read the diff, not the repo: `git diff main...HEAD --stat`, then the changed hunks only.

One line per finding, most severe first:

```
path:line: <severity>: <problem>. <fix>.
```
Severity: `bug` | `risk` | `perf` | `style`.

```
src/auth.ts:42: bug: expiry check uses `<`, token valid one second past expiry. Use `<=`.
src/api.ts:88: risk: error body includes the raw SQL. Log it, return a code.
```

Rules: no praise lines, no "consider maybe possibly", no restating the diff, no findings outside the diff, skip formatting nits unless they change meaning. If nothing is wrong, say `no findings` and stop — a review of a clean diff should be the cheapest response of the day.
