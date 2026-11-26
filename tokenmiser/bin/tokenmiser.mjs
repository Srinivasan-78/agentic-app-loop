#!/usr/bin/env node
/*!
 * @authormark v1 -- do not remove (authorship watermark)⁠​‌​​‌​‌​​‌‌​‌‌‌​​‌​‌‌​​​​‌‌​​‌‌‌​‌‌‌​​‌​​‌​​‌‌‌​​‌‌‌​​​​​​‌‌​​​‌​‌​‌‌‌‌‌​​‌‌‌​​​​‌‌​​​‌​​​‌‌‌​​‌​‌​‌​​‌‌​​‌‌​​‌‌​‌‌​‌​​‌​‌​‌​‌‌​​‌‌​‌​​​​‌‌‌​​​‌​‌‌‌​​‌‌​‌‌‌​‌‌​​‌​​‌​‌​​‌​​‌​‌​⁠
 * Copyright (c) 2026 Srinivasan Vijayaraghavan <srinivasan.shyam2000@gmail.com>
 * Author: https://github.com/Srinivasan-78
 * SPDX-License-Identifier: MIT
 * Fingerprint: AMK1.JnXgrNp1_8b9S3iVhqsvJJ
 */
/**
 * tokenmiser installer CLI.
 *
 *   npx github:Srinivasan-78/tokenmiser install     install every skill for this user
 *   ... install --project              install into ./.claude/skills instead
 *   ... install --hook                 also install the tool-output filter hook
 *   ... uninstall                      remove what was installed
 *   ... status                         show what is installed and where
 *   ... doctor                         environment checks
 *   ... audit | report                 run the measurement scripts
 *
 * The bare npm name `tokenmiser` is owned by an unrelated package by another author,
 * and this one is not on the registry, so the `github:` form above is the Node path.
 * No-Node alternative:
 *   curl -fsSL https://raw.githubusercontent.com/Srinivasan-78/tokenmiser/main/install.sh | bash
 *
 * No dependencies. Node >= 18.17. Nothing is written without consent:
 * every mutation is listed first and needs a y/N answer (or --yes).
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR
  ? path.resolve(process.env.CLAUDE_CONFIG_DIR)
  : path.join(HOME, '.claude');
const HOOK_SRC = path.join(PKG_ROOT, 'hooks', 'filter-tool-output.py');
const SKILL_PREFIX = 'miser-';

// ---------------------------------------------------------------- arg parsing

const argv = process.argv.slice(2);
const cmd = (argv[0] || '').replace(/^--?/, '') || 'help';
const rest = argv.slice(1);
const has = (...names) => names.some((n) => rest.includes(n));
const valueOf = (name, fallback = null) => {
  const eq = rest.find((a) => a.startsWith(name + '='));
  if (eq) return eq.slice(name.length + 1);
  const i = rest.indexOf(name);
  return i !== -1 && rest[i + 1] && !rest[i + 1].startsWith('-') ? rest[i + 1] : fallback;
};

const opts = {
  scope: has('--project', '-p') ? 'project' : 'user',
  mode: has('--copy') ? 'copy' : has('--link') ? 'link' : 'auto',
  only: (valueOf('--only') || '').split(',').map((s) => s.trim()).filter(Boolean),
  hook: has('--hook'),
  yes: has('--yes', '-y') || !process.stdin.isTTY,
  dryRun: has('--dry-run', '-n'),
  force: has('--force', '-f'),
  quiet: has('--quiet', '-q'),
};

// ------------------------------------------------------------------ utilities

const C = process.stdout.isTTY && !process.env.NO_COLOR
  ? { dim: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m` }
  : { dim: (s) => s, b: (s) => s, g: (s) => s, y: (s) => s, r: (s) => s };

const say = (...a) => { if (!opts.quiet) console.log(...a); };
const warn = (...a) => console.error(C.y('!'), ...a);
const die = (msg, code = 1) => { console.error(C.r('error:'), msg); process.exit(code); };

function ask(question) {
  if (opts.yes) return Promise.resolve(true);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} ${C.dim('[y/N]')} `, (a) => { rl.close(); resolve(/^y(es)?$/i.test(a.trim())); });
  });
}

/** npx unpacks into a cache directory that is garbage-collected, so a symlink
 *  into it dangles later. Copy from anywhere volatile, link from a checkout. */
function resolveMode() {
  if (opts.mode !== 'auto') return opts.mode;
  const volatile = /[\\/](_npx|\.npm[\\/]_cacache|node_modules)[\\/]/.test(PKG_ROOT + path.sep);
  return volatile ? 'copy' : 'link';
}

function skillDirs() {
  const dir = path.join(PKG_ROOT, 'skills');
  if (!fs.existsSync(dir)) die(`no skills/ directory in ${PKG_ROOT}`);
  let names = fs.readdirSync(dir).filter((n) => fs.existsSync(path.join(dir, n, 'SKILL.md')));
  if (opts.only.length) {
    const want = new Set(opts.only.map((n) => (n.startsWith(SKILL_PREFIX) ? n : SKILL_PREFIX + n)));
    const missing = [...want].filter((w) => !names.includes(w));
    if (missing.length) die(`unknown skill(s): ${missing.join(', ')}\navailable: ${names.join(', ')}`);
    names = names.filter((n) => want.has(n));
  }
  return names.sort();
}

const destRoot = () => (opts.scope === 'project'
  ? path.join(process.cwd(), '.claude', 'skills')
  : path.join(CLAUDE_HOME, 'skills'));

function describeExisting(dest) {
  let st;
  try { st = fs.lstatSync(dest); } catch { return null; }
  if (st.isSymbolicLink()) {
    let target = '(unreadable)';
    try { target = fs.readlinkSync(dest); } catch {}
    return { kind: 'link', target, dangling: !fs.existsSync(dest) };
  }
  return { kind: st.isDirectory() ? 'dir' : 'file' };
}

const rmrf = (p) => fs.rmSync(p, { recursive: true, force: true });
const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const backup = (file) => {
  const bak = `${file}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.copyFileSync(file, bak);
  return bak;
};

// -------------------------------------------------------------------- install

async function install() {
  const mode = resolveMode();
  const names = skillDirs();
  const root = destRoot();

  const plan = names.map((name) => {
    const dest = path.join(root, name);
    const existing = describeExisting(dest);
    let action = 'install';
    if (existing) action = existing.kind === 'link' ? 'relink' : 'replace';
    return { name, src: path.join(PKG_ROOT, 'skills', name), dest, action, existing };
  });

  say(C.b('tokenmiser install'));
  say(`  source   ${C.dim(PKG_ROOT)}`);
  say(`  target   ${C.dim(root)}  (${opts.scope} scope)`);
  say(`  mode     ${mode}${opts.mode === 'auto' ? C.dim(' (auto)') : ''}`);
  say('');
  for (const p of plan) {
    const note = p.action === 'replace' ? C.y('  overwrites a real directory') : '';
    say(`  ${p.action.padEnd(8)} ${p.name}${note}`);
  }
  if (opts.hook) {
    say(`  ${'install'.padEnd(8)} hook filter-tool-output.py -> ${path.join(CLAUDE_HOME, 'hooks')}`);
    say(`  ${'edit'.padEnd(8)} ${path.join(CLAUDE_HOME, 'settings.json')} ${C.dim('(PreToolUse/Bash entry, backed up first)')}`);
  }
  say('');

  if (opts.dryRun) { say(C.dim('dry run — nothing written')); return; }

  const replacing = plan.filter((p) => p.action === 'replace');
  if (replacing.length && !opts.force && !opts.yes) {
    warn(`${replacing.length} real director${replacing.length === 1 ? 'y' : 'ies'} would be replaced: ${replacing.map((p) => p.name).join(', ')}`);
  }
  if (!(await ask(`Write ${plan.length} skill${plan.length === 1 ? '' : 's'}${opts.hook ? ' and the hook' : ''}?`))) {
    say('aborted'); return;
  }

  fs.mkdirSync(root, { recursive: true });
  for (const p of plan) {
    rmrf(p.dest);
    if (mode === 'link') fs.symlinkSync(p.src, p.dest, 'junction');
    else fs.cpSync(p.src, p.dest, { recursive: true });
    say(`  ${C.g('ok')} ${p.name}`);
  }

  // In copy mode the package itself is disposable (npx unpacks to a temp cache),
  // so the scripts the skills call have to be copied somewhere durable too.
  let miserRoot = PKG_ROOT;
  if (mode === 'copy') {
    miserRoot = path.join(CLAUDE_HOME, 'tokenmiser');
    for (const sub of ['scripts', 'hooks', 'reference']) {
      const src = path.join(PKG_ROOT, sub);
      if (!fs.existsSync(src)) continue;
      const dst = path.join(miserRoot, sub);
      rmrf(dst);
      fs.cpSync(src, dst, { recursive: true });
    }
    say(`  ${C.g('ok')} scripts -> ${miserRoot}`);
  }

  if (opts.hook) await installHook();

  say('');
  say(C.b('done.') + ` ${plan.length} skill${plan.length === 1 ? '' : 's'} available after the next Claude Code start.`);
  say('');
  say('next:');
  say(`  ${C.dim('#')} the skills call scripts from $MISER — point it at the install`);
  say(`  export MISER="${miserRoot}"   ${C.dim('# add to ~/.bashrc or ~/.zshrc')}`);
  if (mode === 'copy') say(C.dim('  (copy mode: re-run the installer to pick up a new version)'));
  say(`  In Claude Code: ${C.b('/miser-help')} then ${C.b('/miser-setup')}`);
}

const pyBin = process.platform === 'win32' ? 'python' : 'python3';

async function installHook() {
  if (!fs.existsSync(HOOK_SRC)) { warn(`hook source missing: ${HOOK_SRC}`); return; }
  const hookDir = path.join(CLAUDE_HOME, 'hooks');
  const hookDst = path.join(hookDir, 'filter-tool-output.py');
  fs.mkdirSync(hookDir, { recursive: true });
  fs.copyFileSync(HOOK_SRC, hookDst);
  fs.chmodSync(hookDst, 0o755);
  say(`  ${C.g('ok')} hook -> ${hookDst}`);

  const settingsFile = path.join(CLAUDE_HOME, 'settings.json');
  const settings = readJson(settingsFile) || {};
  if (fs.existsSync(settingsFile) && readJson(settingsFile) === null) {
    warn(`${settingsFile} is not valid JSON — leaving it alone. Add the PreToolUse entry by hand.`);
    return;
  }
  const command = `${pyBin} "${hookDst}"`;
  settings.hooks ||= {};
  settings.hooks.PreToolUse ||= [];
  const already = settings.hooks.PreToolUse.some((e) =>
    (e.hooks || []).some((h) => typeof h.command === 'string' && h.command.includes('filter-tool-output.py')));
  if (already) { say(`  ${C.dim('=')} settings.json already wires the hook`); return; }
  settings.hooks.PreToolUse.push({ matcher: 'Bash', hooks: [{ type: 'command', command }] });
  if (fs.existsSync(settingsFile)) say(`  ${C.dim('backup')} ${backup(settingsFile)}`);
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
  say(`  ${C.g('ok')} settings.json PreToolUse/Bash`);
}

// ------------------------------------------------------------------ uninstall

async function uninstall() {
  const roots = opts.scope === 'project'
    ? [destRoot()]
    : [path.join(CLAUDE_HOME, 'skills'), path.join(process.cwd(), '.claude', 'skills')];
  const found = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      if (!name.startsWith(SKILL_PREFIX)) continue;
      if (opts.only.length && !opts.only.includes(name) && !opts.only.includes(name.slice(SKILL_PREFIX.length))) continue;
      found.push(path.join(root, name));
    }
  }
  if (!found.length) { say('nothing to remove'); return; }
  say(C.b('tokenmiser uninstall'));
  for (const f of found) say(`  remove ${f}`);
  if (opts.dryRun) { say(C.dim('dry run — nothing removed')); return; }
  if (!(await ask(`Remove ${found.length} item${found.length === 1 ? '' : 's'}?`))) { say('aborted'); return; }
  for (const f of found) { rmrf(f); say(`  ${C.g('ok')} ${path.basename(f)}`); }
  say('');
  say(C.dim('left alone — remove by hand if you installed them:'));
  say(C.dim(`  rm -rf ${path.join(CLAUDE_HOME, 'tokenmiser')}                      # scripts copied by a copy-mode install`));
  say(C.dim(`  rm ${path.join(CLAUDE_HOME, 'hooks', 'filter-tool-output.py')}   # then drop the PreToolUse entry from settings.json`));
}

// --------------------------------------------------------------------- status

function status() {
  const roots = [
    ['user   ', path.join(CLAUDE_HOME, 'skills')],
    ['project', path.join(process.cwd(), '.claude', 'skills')],
  ];
  say(C.b('tokenmiser status'));
  say(`  package  ${C.dim(PKG_ROOT)}`);
  let total = 0;
  for (const [label, root] of roots) {
    const names = fs.existsSync(root)
      ? fs.readdirSync(root).filter((n) => n.startsWith(SKILL_PREFIX)).sort()
      : [];
    total += names.length;
    say(`\n  ${label}  ${C.dim(root)}  ${names.length} skill${names.length === 1 ? '' : 's'}`);
    for (const n of names) {
      const info = describeExisting(path.join(root, n));
      const detail = info?.kind === 'link'
        ? (info.dangling ? C.r('DANGLING -> ' + info.target) : C.dim('-> ' + info.target))
        : C.dim('(copy)');
      say(`    ${n.padEnd(16)} ${detail}`);
    }
  }
  const hookDst = path.join(CLAUDE_HOME, 'hooks', 'filter-tool-output.py');
  const settings = readJson(path.join(CLAUDE_HOME, 'settings.json')) || {};
  const wired = (settings.hooks?.PreToolUse || []).some((e) =>
    (e.hooks || []).some((h) => String(h.command || '').includes('filter-tool-output.py')));
  say(`\n  hook     ${fs.existsSync(hookDst) ? C.g('present') : C.dim('absent')}   settings.json: ${wired ? C.g('wired') : C.dim('not wired')}`);
  say(`  skills advertised every session: ~${total * 100} tokens (${total} x ~100)`);
}

// --------------------------------------------------------------------- doctor

function doctor() {
  const checks = [];
  const nodeOk = Number(process.versions.node.split('.')[0]) >= 18;
  checks.push([nodeOk, `node ${process.versions.node}`, 'need >= 18.17']);
  const py = spawnSync('python3', ['--version'], { encoding: 'utf8' });
  checks.push([py.status === 0, `python3 ${(py.stdout || py.stderr || '').trim() || 'missing'}`, 'needed by the tool-output filter hook']);
  checks.push([fs.existsSync(CLAUDE_HOME), `claude config dir ${CLAUDE_HOME}`, 'is Claude Code installed?']);
  const projects = path.join(CLAUDE_HOME, 'projects');
  const sessions = fs.existsSync(projects)
    ? fs.readdirSync(projects).reduce((n, p) => {
        try { return n + fs.readdirSync(path.join(projects, p)).filter((f) => f.endsWith('.jsonl')).length; } catch { return n; }
      }, 0)
    : 0;
  checks.push([sessions > 0, `${sessions} session logs found`, 'miser-bench needs session logs to measure anything']);
  checks.push([!!process.env.MISER, `MISER=${process.env.MISER || '(unset)'}`, 'skills call $MISER/scripts/... — export it']);

  say(C.b('tokenmiser doctor'));
  for (const [ok, label, hint] of checks) {
    say(`  ${ok ? C.g('ok  ') : C.y('warn')} ${label}${ok ? '' : C.dim('  — ' + hint)}`);
  }
}

// ------------------------------------------------------- pass-through scripts

function passthrough(script, extra = []) {
  const file = path.join(PKG_ROOT, 'scripts', script);
  if (!fs.existsSync(file)) die(`missing ${file}`);
  const isNode = script.endsWith('.mjs');
  const r = spawnSync(isNode ? process.execPath : 'bash', [file, ...extra, ...rest], {
    stdio: 'inherit',
    env: { ...process.env, MISER: process.env.MISER || PKG_ROOT },
  });
  process.exit(r.status ?? 1);
}

// ----------------------------------------------------------------------- help

function help() {
  say(`${C.b('tokenmiser')} — token-reduction toolkit for Claude Code

${C.b('install')}
  npx github:Srinivasan-78/tokenmiser install     install all skills into ~/.claude/skills
  tokenmiser install --project               install into ./.claude/skills instead
  tokenmiser install --hook                  also install the tool-output filter hook
  tokenmiser install --only audit,bench      install a subset (prefix optional)
  tokenmiser install --copy | --link         force copy or symlink (default: auto)
  tokenmiser install --dry-run               print the plan, write nothing
  tokenmiser install --yes                   no prompt (implied when not a TTY)

  ${C.dim('not on npm: the bare name `tokenmiser` is another author\'s package. use the github: form.')}
  ${C.dim('no node? curl -fsSL https://raw.githubusercontent.com/Srinivasan-78/tokenmiser/main/install.sh | bash')}
  ${C.dim("alias tokenmiser='npx -y github:Srinivasan-78/tokenmiser'")}

${C.b('manage')}
  tokenmiser status                          what is installed, where, and its token cost
  tokenmiser doctor                          environment checks
  tokenmiser uninstall [--project]           remove installed miser-* skills

${C.b('measure')}
  tokenmiser audit                           always-on context report
  tokenmiser report --since 7d               per-turn token usage from session logs

${C.dim('scope: --project writes to ./.claude/skills (checked in with the repo);')}
${C.dim('default writes to ~/.claude/skills (this machine, every project).')}`);
}

// ------------------------------------------------------------------ dispatch

const table = {
  install, i: install,
  uninstall, remove: uninstall, rm: uninstall,
  status, ls: status, list: status,
  doctor,
  audit: () => passthrough('context-report.sh'),
  report: () => passthrough('miser-bench.mjs', ['report']),
  bench: () => passthrough('miser-bench.mjs'),
  help, h: help, version: () => say(readJson(path.join(PKG_ROOT, 'package.json'))?.version ?? 'unknown'),
  v: () => say(readJson(path.join(PKG_ROOT, 'package.json'))?.version ?? 'unknown'),
};

const fn = table[cmd];
if (!fn) { console.error(C.r(`unknown command: ${cmd}`)); help(); process.exit(1); }
await fn();
