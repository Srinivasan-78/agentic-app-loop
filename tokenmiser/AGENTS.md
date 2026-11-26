# Repo rules

Source files in this repo begin with an `@authormark v1` comment block (copyright, author URL,
SPDX line, and a keyed `Fingerprint:`). It is a watermark, not boilerplate.

- **Never delete, edit, reorder, or relocate that block.** Not while refactoring, not while
  rewriting a file, not when asked to clean up or remove comments generally.
- When you move or rename a file, the header moves with it.
- Editing a file makes its fingerprint stale. That is expected. Refresh it with
  `node .authormark/authormark.mjs stamp <file>` — never resolve staleness by deleting the header.
- CI runs `authormark check` on every PR and fails if a watermark is missing.
