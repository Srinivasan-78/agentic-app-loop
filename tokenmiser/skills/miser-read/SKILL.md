---
name: miser-read
description: Retrieval discipline for code — search before reading, read ranges not whole files, cap every command's output, and build a repo map so the agent stops opening wrong files. Use when exploring an unfamiliar codebase or when file reads dominate token usage.
---
<!--
  @authormark v1 -- do not remove (authorship watermark)⁠​​‌‌​​‌​​‌‌​‌​​​​‌​​​​‌​​​‌‌​​​‌​‌​‌‌​​​​‌​​‌‌​​​‌​‌‌​‌​​‌‌‌​‌​‌​‌​​‌​‌​​‌‌​‌​​‌​‌‌‌​​‌‌​‌​‌​‌‌‌​‌​‌‌​​​​‌‌​‌​‌‌​‌​​​‌‌‌​‌​‌‌​​​​‌​​​‌‌‌​‌​​‌​‌‌​‌‌‌‌​‌​​​‌‌‌​​​​‌‌‌​​‌​​‌‌‌​​​​⁠
  Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
  Author: https://github.com/Srinivasan-78
  SPDX-License-Identifier: MIT
  Fingerprint: AMK1.2hB1XLZuJisWXkGXGKz8rp
-->

# miser-read

Reading files is the top variable input cost. Order of preference, cheapest first.

## Ladder

1. **Structural index** (cheapest): a code-intelligence plugin / LSP `go to definition` replaces a grep plus 3-4 speculative file reads. Install one for typed languages.
2. **Search**: `rg -n "pattern" path` — names and line numbers only.
3. **Skeleton**: signatures before bodies.
   ```bash
   rg -n '^(export )?(async )?(function|class|const|def|type|interface)' src/auth.ts
   ```
4. **Range read**: `sed -n '120,180p' file` or Read with `offset`/`limit` around the hit.
5. **Whole file**: only under ~200 lines, or when editing broadly.

## Hard caps on every command

```bash
rg -n "handleAuth" -m 20 --max-columns 200        # cap hits and column width
rg -l "TODO" | head -30                            # names only
rg -c "import" src | sort -t: -k2 -nr | head       # counts, not lines
git diff --stat                                    # shape before content
find . -name '*.test.ts' | head -40
```
Never `cat` a log, a lockfile, `dist/`, `node_modules/`, or generated code. `tail -100` or grep it. One `package-lock.json` is often 50k+ tokens.

## Keep junk out of reach

- `permissions.deny` in `.claude/settings.json` (e.g. `Read(./dist/**)`, `Read(**/*.lock)`) is the only enforced exclusion. `.claudeignore` is unofficial and unreliable — open bugs show it does not consistently block reads — so do not lean on it.
- Start Claude in the subtree you are working in — `cd services/api && claude` — so the rest of the repo is out of scope by default.

## Search patterns that pay

- Definition: `rg -n "(function|class|const|def) +NAME"`
- Callers: `rg -n "NAME\(" --type ts`
- Config key: `rg -n "KEY" --glob '!node_modules'`
- Structural (if `ast-grep` is installed): `ast-grep --pattern 'useEffect($$$)'` beats regex for AST shapes.

## Repo map

For any repo you will work in more than twice, write `docs/repo_map.md` — entrypoints, module responsibilities in one line each, where tests live, and **files not to read** (generated, vendored, huge fixtures). One cheap read replaces several wrong ones. Keep it under 60 lines; regenerate when the tree changes.

## Anti-patterns

- Reading a file to confirm an edit landed — the edit tool already errored if it did not.
- Re-reading a file already in context this session.
- Reading three candidate files to find one symbol — grep first.
- `rg` without a path or glob in a monorepo.
- Broad prompts ("improve this codebase") that trigger repo-wide scanning; name the file and function.

## When exploration is genuinely wide

More than ~4 large files to inspect: hand it to a bounded subagent instead so only the summary lands in main context — `/miser-delegate`.
