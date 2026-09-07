#!/usr/bin/env node
/*!
 * @authormark v1 -- do not remove (authorship watermark)⁠​‌​‌‌‌‌‌​‌‌‌‌​​‌​‌‌‌​‌​​​‌‌​​‌‌​​‌‌​‌​‌​​‌‌​​​‌​​‌‌​​‌‌‌​‌​​‌​‌‌​‌‌​‌‌​‌​‌​​‌​​​​‌‌​‌​​‌​‌‌‌‌​‌​​‌‌‌‌​‌​​‌​‌​‌​​​​‌​‌‌​‌​‌​‌‌​​​​‌‌​‌‌‌‌​‌‌‌​‌‌‌​‌​‌‌​​​​​‌‌​‌‌‌​‌‌‌‌​‌​​​‌‌​​‌​⁠
 * Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
 * Author: https://github.com/Srinivasan-78
 * SPDX-License-Identifier: MIT
 * Fingerprint: AMK1._ytfjbgKmHizzT-XowX7z2
 */
/**
 * agentic-app-loop installer
 *
 *   npx github:Srinivasan-78/agentic-app-loop            # into ./.claude
 *   npx github:Srinivasan-78/agentic-app-loop --global   # into ~/.claude
 *   npx github:Srinivasan-78/agentic-app-loop --dir path # into <path>/.claude
 *
 * Copies the build-app skill, its 7 phase subagents, and the /build-app command
 * into a Claude Code config directory. Zero dependencies, Node >= 18.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const GH_USER = 'Srinivasan-78';
const REPO = 'agentic-app-loop';
const REPO_URL = `https://github.com/${GH_USER}/${REPO}`;

const args = process.argv.slice(2);
const has = (...names) => names.some((n) => args.includes(n));

if (has('-h', '--help')) {
  process.stdout.write(`
${REPO} — install the build-app agentic loop for Claude Code
${REPO_URL}

Usage:
  npx github:${GH_USER}/${REPO} [options]

Options:
  -g, --global        install into ~/.claude (available in every project)
      --dir <path>    install into <path>/.claude
      --force         overwrite existing files
      --dry-run       show what would be copied, write nothing
  -h, --help          this help

Default target: <current directory>/.claude
`);
  process.exit(0);
}

const FORCE = has('--force');
const DRY = has('--dry-run', '--dry');

function targetRoot() {
  const di = args.indexOf('--dir');
  if (di !== -1) {
    const p = args[di + 1];
    if (!p) fail('--dir needs a path');
    return path.resolve(p);
  }
  if (has('-g', '--global')) return os.homedir();
  return process.cwd();
}

function fail(msg) {
  process.stderr.write(`\x1b[31m✗ ${msg}\x1b[0m\n`);
  process.exit(1);
}

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

/**
 * Locate the package payload. When run via `npx github:...` or a published
 * tarball, the files sit next to this script (../). If that ever fails, clone
 * the pinned repo into a temp dir as a fallback.
 */
function sourceRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const local = path.resolve(here, '..');
  if (fs.existsSync(path.join(local, 'skills', 'build-app', 'SKILL.md'))) return local;

  log(`• payload not found locally, cloning ${REPO_URL} …`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `${REPO}-`));
  execFileSync('git', ['clone', '--depth', '1', `${REPO_URL}.git`, tmp], { stdio: 'inherit' });
  return tmp;
}

function copyDir(src, dest) {
  if (!DRY) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      copyFile(s, d);
    }
  }
}

let copied = 0;
let skipped = 0;

function copyFile(src, dest) {
  const rel = path.relative(TARGET, dest);
  if (fs.existsSync(dest) && !FORCE) {
    log(`  \x1b[33mskip\x1b[0m ${rel} (exists — pass --force to overwrite)`);
    skipped++;
    return;
  }
  if (DRY) {
    log(`  \x1b[36mwould write\x1b[0m ${rel}`);
    copied++;
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  log(`  \x1b[32mwrite\x1b[0m ${rel}`);
  copied++;
}

const SRC = sourceRoot();
const TARGET = path.join(targetRoot(), '.claude');

log(`\n${REPO} → ${TARGET}${DRY ? '  (dry run)' : ''}\n`);

// 1. the skill (whole directory tree, incl. references/ and templates/)
copyDir(path.join(SRC, 'skills', 'build-app'), path.join(TARGET, 'skills', 'build-app'));

// 2. the 7 phase subagents
const agentsSrc = path.join(SRC, 'agents');
for (const f of fs.readdirSync(agentsSrc)) {
  if (f.endsWith('.md')) copyFile(path.join(agentsSrc, f), path.join(TARGET, 'agents', f));
}

// 3. the slash command
copyFile(
  path.join(SRC, 'commands', 'build-app.md'),
  path.join(TARGET, 'commands', 'build-app.md'),
);

log(`\n${DRY ? 'Would copy' : 'Copied'} ${copied} file(s), skipped ${skipped}.`);
log(`
Next:
  • Restart Claude Code (or run /doctor) so it picks up the new skill & agents.
  • Kick off a build:  /build-app add rate limiting to the public API
  • Or just ask:       "build me a URL shortener, use the loop"

Docs: ${REPO_URL}#readme
`);
