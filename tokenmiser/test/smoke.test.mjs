#!/usr/bin/env node
/*!
 * @authormark v1 -- do not remove (authorship watermark)⁠​‌​‌​‌​​​​‌‌​‌​​​‌​‌‌​‌​​​‌‌‌​​‌​‌‌‌‌​‌​​‌‌​‌‌‌​​‌​​​‌‌​​​‌‌‌​​‌​‌‌‌​​‌‌​‌​‌‌‌‌‌​‌‌​​​‌‌​‌‌​‌​‌​​‌​‌‌​​‌​‌​​​​‌​​‌​‌​‌​​​‌​​​‌​​​‌‌​‌‌‌‌​‌‌‌​​‌​​‌​‌‌‌‌‌​​‌​‌‌​‌​​‌‌‌​​‌​‌​​​​‌​⁠
 * Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
 * Author: https://github.com/Srinivasan-78
 * SPDX-License-Identifier: MIT
 * Fingerprint: AMK1.T4Z9znF9s_cjYBTDor_-9B
 */
/**
 * Smoke tests: no network, no dependencies, no writes outside a temp dir.
 *   node test/smoke.test.mjs
 *
 * Covers the two places a bug is expensive: the session-log accounting
 * (double counting inflates every number) and the Bash filter hook
 * (a bad rewrite changes what actually runs).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokenmiser-test-'));
const fakeHome = path.join(tmp, 'claude');
const projectDir = path.join(fakeHome, 'projects', '-fake-project');
fs.mkdirSync(projectDir, { recursive: true });

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log(`ok   ${name}`); }
  catch (err) { failures.push(name); console.log(`FAIL ${name}\n     ${err.message.split('\n')[0]}`); }
}
const run = (cmd, args, env = {}) =>
  spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: fakeHome, ...env } });

// ------------------------------------------------------------- fixture session

const usage = (over = {}) => ({
  input_tokens: 100, cache_read_input_tokens: 9000, cache_creation_input_tokens: 500,
  output_tokens: 200, output_tokens_details: { thinking_tokens: 50 }, ...over,
});
const lines = [
  { type: 'user', timestamp: '2026-01-01T00:00:00Z', message: { content: 'hello' } },
  // same requestId three times: Claude Code writes one line per content block
  { type: 'assistant', requestId: 'req_1', timestamp: '2026-01-01T00:00:01Z', message: { id: 'm1', model: 'claude-test-1', usage: usage(), content: [{ type: 'tool_use', name: 'Bash' }] } },
  { type: 'assistant', requestId: 'req_1', timestamp: '2026-01-01T00:00:02Z', message: { id: 'm1', model: 'claude-test-1', usage: usage() } },
  { type: 'assistant', requestId: 'req_1', timestamp: '2026-01-01T00:00:03Z', message: { id: 'm1', model: 'claude-test-1', usage: usage() } },
  { type: 'assistant', requestId: 'req_2', timestamp: '2026-01-01T00:00:04Z', message: { id: 'm2', model: 'claude-test-1', usage: usage() } },
  // a subagent turn
  { type: 'assistant', requestId: 'req_3', isSidechain: true, timestamp: '2026-01-01T00:00:05Z', message: { id: 'm3', model: 'claude-test-2', usage: usage() } },
  'not json at all',
  '',
];
fs.writeFileSync(
  path.join(projectDir, 'aaaaaaaa-1111-2222-3333-444444444444.jsonl'),
  lines.map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n'),
);

const bench = (...args) => run(process.execPath, [path.join(ROOT, 'scripts', 'miser-bench.mjs'), ...args]);
const json = (...args) => {
  const r = bench(...args, '--json');
  assert.equal(r.status, 0, `exit ${r.status}: ${r.stderr}`);
  return JSON.parse(r.stdout);
};

test('report deduplicates repeated usage records', () => {
  const [row] = json('report');
  assert.equal(row.turns, 3, 'three distinct requestIds');
  assert.equal(row.dupSkipped, 2, 'two duplicate lines skipped');
});

test('report sums tokens once per request', () => {
  const [row] = json('report');
  assert.equal(row.input, 300);
  assert.equal(row.cacheRead, 27000);
  assert.equal(row.output, 600);
  assert.equal(row.thinking, 150);
});

test('--main-only excludes subagent turns', () => {
  const [row] = json('report', '--main-only');
  assert.equal(row.turns, 2);
  assert.equal(row.sidechainTurns, 1);
});

test('malformed lines do not crash the scan', () => {
  const [row] = json('report');
  assert.equal(row.userMsgs, 1);
});

test('session latest resolves and reports tools', () => {
  const s = json('session', 'latest');
  assert.equal(s.tools.Bash, 1);
  assert.equal(s.models['claude-test-1'], 2);
});

test('compare emits a delta for every metric', () => {
  const c = json('compare', 'aaaaaaaa', 'aaaaaaaa');
  assert.equal(c.delta.total.pct, 0);
  assert.equal(c.delta.effInput.a, c.delta.effInput.b);
});

test('--since rejects a malformed window', () => {
  const r = bench('report', '--since', 'yesterday');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--since expects/);
});

test('unknown command exits non-zero', () => {
  assert.equal(bench('nonsense').status, 2);
});

test('rates: no prices means no $ column, not a crash', () => {
  const r = bench('report');
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.stdout, /\$NaN/);
});

// --------------------------------------------------------------- filter hook

const PYTHON = process.platform === 'win32' ? 'python' : 'python3';
const hook = path.join(ROOT, 'hooks', 'filter-tool-output.py');
const py = (cmdString, env = {}) => {
  const r = spawnSync(PYTHON, [hook], {
    input: JSON.stringify({ tool_input: { command: cmdString } }),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  return out.hookSpecificOutput?.updatedInput?.command ?? null;
};

test('hook selftest passes', () => {
  const r = spawnSync(PYTHON, [hook, '--selftest'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout);
});

test('hook filters a bare test command and preserves exit status', () => {
  const out = py('npm test');
  assert.match(out, /grep -E -A5/);
  assert.match(out, /PIPESTATUS\[0\]/, 'a filtered failure must still exit non-zero');
});

test('hook leaves compound and redirected commands alone', () => {
  assert.equal(py('npm test && npm run build'), null);
  assert.equal(py('npm test > out.txt'), null);
  assert.equal(py('pytest | head -20'), null);
});

test('hook leaves already-bounded git commands alone', () => {
  assert.equal(py('git log --oneline'), null);
  assert.equal(py('git log -1 --format=%H'), null);
  assert.equal(py('git diff --stat'), null);
});

test('hook can be disabled by env var', () => {
  assert.equal(py('npm test', { TOKENMISER_FILTER_OFF: '1' }), null);
});

test('hook emits valid JSON on garbage input', () => {
  const r = spawnSync(PYTHON, [hook], { input: 'not json', encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.deepEqual(JSON.parse(r.stdout), {});
});

// ------------------------------------------------------------------- CLI

test('installer dry run writes nothing', () => {
  const dest = path.join(fakeHome, 'skills');
  const r = run(process.execPath, [path.join(ROOT, 'bin', 'tokenmiser.mjs'), 'install', '--dry-run', '--yes']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /install\s+miser-/);
  assert.equal(fs.existsSync(dest), false, 'dry run must not create the skills directory');
});

test('installer copies skills into a scoped target', () => {
  const r = run(process.execPath, [path.join(ROOT, 'bin', 'tokenmiser.mjs'), 'install', '--yes', '--copy', '--only', 'help,bench']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(fakeHome, 'skills', 'miser-help', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(fakeHome, 'skills', 'miser-bench', 'SKILL.md')));
  assert.equal(fs.existsSync(path.join(fakeHome, 'skills', 'miser-api')), false, '--only must not install everything');
});

test('installer rejects an unknown skill name', () => {
  const r = run(process.execPath, [path.join(ROOT, 'bin', 'tokenmiser.mjs'), 'install', '--yes', '--only', 'nope']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /unknown skill/);
});

test('uninstall removes what install wrote', () => {
  const r = run(process.execPath, [path.join(ROOT, 'bin', 'tokenmiser.mjs'), 'uninstall', '--yes']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.existsSync(path.join(fakeHome, 'skills', 'miser-help')), false);
});

test('every skill has frontmatter with a name and a description', () => {
  for (const dir of fs.readdirSync(path.join(ROOT, 'skills'))) {
    const file = path.join(ROOT, 'skills', dir, 'SKILL.md');
    const text = fs.readFileSync(file, 'utf8');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    assert.ok(m, `${dir}: missing frontmatter`);
    assert.match(m[1], /^name:\s*(.+)$/m, `${dir}: no name`);
    assert.match(m[1], /^description:\s*(.+)$/m, `${dir}: no description`);
    assert.equal(m[1].match(/^name:\s*(.+)$/m)[1].trim(), dir, `${dir}: name does not match directory`);
  }
});

// ----------------------------------------------------------------- teardown

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
