#!/usr/bin/env node
/**
 * Token accounting from Claude Code session logs (~/.claude/projects/<slug>/<id>.jsonl).
 *
 *   node miser-bench.mjs report   [--project <slug|.>] [--since 7d] [--top 10] [--json] [--main-only]
 *   node miser-bench.mjs session  <sessionId|latest> [--json]
 *   node miser-bench.mjs compare  <sessionA> <sessionB> [--json]
 *   node miser-bench.mjs baseline save <label> | baseline diff <labelA> <labelB> | baseline list
 *
 * Rates are optional (scripts/rates.json, or $TOKENMISER_RATES). Tokens are always reported.
 * Every usage record is deduplicated by request id: Claude Code writes several log lines
 * per assistant response, and counting them all inflates a session by 2-3x.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLAUDE_HOME = process.env.CLAUDE_CONFIG_DIR
  ? path.resolve(process.env.CLAUDE_CONFIG_DIR)
  : path.join(os.homedir(), '.claude');
const ROOT = path.join(CLAUDE_HOME, 'projects');
const STATE = path.join(CLAUDE_HOME, 'tokenmiser');
const RATES_FILE = process.env.TOKENMISER_RATES || path.join(HERE, 'rates.json');

// ------------------------------------------------------------------ arguments

const args = process.argv.slice(2);
const cmd = args[0] && !args[0].startsWith('-') ? args[0] : 'report';
const has = (n) => args.includes('--' + n);
function flag(name, fallback = null) {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = args.indexOf('--' + name);
  if (i === -1) return fallback;
  const next = args[i + 1];
  return next && !next.startsWith('--') ? next : fallback;
}
function num(name, fallback) {
  const v = flag(name);
  if (v === null) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) fail(`--${name} expects a number, got "${v}"`);
  return n;
}
const fail = (msg) => { console.error('miser-bench: ' + msg); process.exit(2); };

// ------------------------------------------------------------------- scanning

function slugForCwd() {
  // Claude Code stores each project under a slug of its absolute path.
  return process.cwd().replace(/[/\\:]/g, '-');
}

function parseSince(s) {
  if (!s) return 0;
  const m = String(s).match(/^(\d+)\s*([mhdw])$/i);
  if (!m) fail(`--since expects <n>[m|h|d|w] (e.g. 90m, 24h, 7d, 2w), got "${s}"`);
  const mult = { m: 60e3, h: 3600e3, d: 86400e3, w: 604800e3 }[m[2].toLowerCase()];
  return Date.now() - Number(m[1]) * mult;
}

function listSessions(projectFilter) {
  if (!fs.existsSync(ROOT)) fail(`no session logs at ${ROOT}. Is Claude Code installed?`);
  const out = [];
  for (const proj of safeReaddir(ROOT)) {
    if (projectFilter && !proj.includes(projectFilter)) continue;
    const dir = path.join(ROOT, proj);
    if (!isDir(dir)) continue;
    for (const f of safeReaddir(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const file = path.join(dir, f);
      out.push({ project: proj, id: f.replace(/\.jsonl$/, ''), file, mtime: mtimeOf(file) });
    }
  }
  return out;
}

const safeReaddir = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const mtimeOf = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return 0; } };

function emptyAcc() {
  return {
    turns: 0, input: 0, cacheRead: 0, cacheWrite: 0, output: 0, thinking: 0,
    toolCalls: 0, tools: {}, models: {}, perModel: {}, first: null, last: null,
    userMsgs: 0, sidechainTurns: 0, sidechainTotal: 0, toolResultTokens: 0, dupSkipped: 0,
  };
}

/**
 * One pass over a session log.
 * `mainOnly` drops sidechain entries (subagent turns) from the totals.
 */
function scan(file, { mainOnly = false } = {}) {
  const acc = emptyAcc();
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return acc; }

  const seen = new Set();
  for (const line of raw.split('\n')) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }

    const ts = o.timestamp ? Date.parse(o.timestamp) : null;
    if (Number.isFinite(ts)) {
      acc.first = acc.first === null ? ts : Math.min(acc.first, ts);
      acc.last = acc.last === null ? ts : Math.max(acc.last, ts);
    }

    const msg = o.message;
    const sidechain = o.isSidechain === true;

    if (o.type === 'user' && typeof msg?.content === 'string' && !sidechain) acc.userMsgs++;

    const content = msg?.content;
    if (Array.isArray(content)) {
      for (const c of content) {
        if (c.type === 'tool_use' && !(mainOnly && sidechain)) {
          acc.toolCalls++;
          acc.tools[c.name] = (acc.tools[c.name] || 0) + 1;
        } else if (c.type === 'tool_result') {
          const t = c.content;
          acc.toolResultTokens += Math.ceil((typeof t === 'string' ? t.length : JSON.stringify(t ?? '').length) / 4);
        }
      }
    }

    const u = msg?.usage;
    if (!u) continue;

    // Claude Code appends multiple lines per assistant response (content blocks,
    // retries, resumed replays) carrying the same usage payload. Count each once.
    const key = o.requestId || msg.id || `${o.uuid}`;
    if (key && seen.has(key)) { acc.dupSkipped++; continue; }
    if (key) seen.add(key);

    const rec = {
      input: u.input_tokens || 0,
      cacheRead: u.cache_read_input_tokens || 0,
      cacheWrite: u.cache_creation_input_tokens || 0,
      output: u.output_tokens || 0,
      thinking: u.output_tokens_details?.thinking_tokens || 0,
    };

    if (sidechain) {
      acc.sidechainTurns++;
      acc.sidechainTotal += rec.input + rec.cacheRead + rec.cacheWrite + rec.output;
      if (mainOnly) continue;
    }

    acc.turns++;
    for (const k of ['input', 'cacheRead', 'cacheWrite', 'output', 'thinking']) acc[k] += rec[k];

    const model = msg.model || 'unknown';
    acc.models[model] = (acc.models[model] || 0) + 1;
    const pm = (acc.perModel[model] ||= { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 });
    for (const k of ['input', 'cacheRead', 'cacheWrite', 'output']) pm[k] += rec[k];
  }
  return acc;
}

const effIn = (a) => a.input + a.cacheRead + a.cacheWrite;
const total = (a) => effIn(a) + a.output;
const perTurn = (a) => Math.round(total(a) / Math.max(1, a.turns));

// ---------------------------------------------------------------------- rates

let ratesCache;
function rates() {
  if (ratesCache !== undefined) return ratesCache;
  try { ratesCache = JSON.parse(fs.readFileSync(RATES_FILE, 'utf8')); } catch { ratesCache = {}; }
  return ratesCache;
}
/** Longest-prefix match so "claude-opus-5-20260101" picks up a "claude-opus-5" entry. */
function rateFor(model) {
  const r = rates();
  let best = null;
  for (const [k, v] of Object.entries(r)) {
    if (k.startsWith('_') || k === 'default' || !v) continue;
    if (model.startsWith(k) && (!best || k.length > best.k.length)) best = { k, v };
  }
  return best?.v || r.default || null;
}
/** Per-model cost, so a mixed Haiku/Opus session is not priced at one rate. */
function cost(a) {
  let sum = 0, priced = false;
  for (const [model, u] of Object.entries(a.perModel)) {
    const p = rateFor(model);
    if (!p || !p.input) continue;
    priced = true;
    sum += (u.input * p.input
      + u.cacheRead * (p.cacheRead ?? p.input * 0.1)
      + u.cacheWrite * (p.cacheWrite ?? p.input * 1.25)
      + u.output * p.output) / 1e6;
  }
  return priced ? sum : null;
}

// -------------------------------------------------------------- presentation

const n = (x) => Math.round(x).toLocaleString('en-US');
function k(x) {
  const sign = x < 0 ? '-' : '';
  const v = Math.abs(x);
  if (v >= 1e6) return sign + (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return sign + (v / 1e3).toFixed(1) + 'k';
  return sign + String(Math.round(v));
}
const HEAD = `${'session'.padEnd(38)} ${'total'.padStart(8)} ${'in(eff)'.padStart(8)} ${'cacheRd'.padStart(8)} ${'cacheWr'.padStart(8)} ${'out'.padStart(7)} ${'think'.padStart(7)} ${'turns'.padStart(5)} ${'/turn'.padStart(7)}`;
function fmtRow(label, a) {
  const c = cost(a);
  return `${label.slice(0, 38).padEnd(38)} ${k(total(a)).padStart(8)} ${k(effIn(a)).padStart(8)} ${k(a.cacheRead).padStart(8)} ${k(a.cacheWrite).padStart(8)} ${k(a.output).padStart(7)} ${k(a.thinking).padStart(7)} ${String(a.turns).padStart(5)} ${k(perTurn(a)).padStart(7)}${c === null ? '' : ('  $' + c.toFixed(2)).padStart(9)}`;
}
const label = (s) => `${s.project.replace(/^-/, '').slice(-24)}/${s.id.slice(0, 8)}`;

function sumAcc(list) {
  const s = emptyAcc();
  for (const a of list) {
    for (const key of ['turns', 'input', 'cacheRead', 'cacheWrite', 'output', 'thinking', 'toolCalls', 'userMsgs', 'sidechainTurns', 'sidechainTotal', 'toolResultTokens', 'dupSkipped']) {
      s[key] += a[key] || 0;
    }
    for (const [m, c] of Object.entries(a.models || {})) s.models[m] = (s.models[m] || 0) + c;
    for (const [t, c] of Object.entries(a.tools || {})) s.tools[t] = (s.tools[t] || 0) + c;
    for (const [m, u] of Object.entries(a.perModel || {})) {
      const pm = (s.perModel[m] ||= { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 });
      for (const key of ['input', 'cacheRead', 'cacheWrite', 'output']) pm[key] += u[key];
    }
  }
  return s;
}

function ratios(a) {
  const cacheHit = a.cacheRead / Math.max(1, a.cacheRead + a.cacheWrite + a.input);
  return {
    cacheReadShare: cacheHit,
    outputPerTurn: Math.round(a.output / Math.max(1, a.turns)),
    thinkingShare: a.thinking / Math.max(1, a.output),
    effInputPerTurn: Math.round(effIn(a) / Math.max(1, a.turns)),
  };
}
function printRatios(a) {
  const r = ratios(a);
  console.log(`\ncache read share: ${(r.cacheReadShare * 100).toFixed(1)}%${r.cacheReadShare < 0.8 ? '  <- under 80%: cache misses, see /miser-session' : ''}`);
  console.log(`output/turn: ${n(r.outputPerTurn)}  |  thinking share of output: ${(r.thinkingShare * 100).toFixed(1)}%${r.thinkingShare > 0.35 ? '  <- over 35%, see /miser-model' : ''}`);
  console.log(`eff input/turn: ${n(r.effInputPerTurn)}  <- primary knob: context size per turn`);
  if (a.sidechainTurns) console.log(`subagent turns: ${a.sidechainTurns} (${k(a.sidechainTotal)} tokens; --main-only excludes them)`);
}

// ------------------------------------------------------------------ commands

function report() {
  let proj = flag('project');
  if (proj === '.') proj = slugForCwd();
  const since = parseSince(flag('since'));
  const top = num('top', 10);
  const mainOnly = has('main-only');

  const rows = listSessions(proj)
    .filter((s) => !since || s.mtime >= since)          // cheap pre-filter on mtime
    .map((s) => ({ ...s, acc: scan(s.file, { mainOnly }) }))
    .filter((s) => s.acc.turns > 0 && (!since || (s.acc.last ?? s.mtime) >= since))
    .sort((a, b) => total(b.acc) - total(a.acc));

  if (!rows.length) {
    console.log(`no sessions matched${proj ? ` project "${proj}"` : ''}${since ? ` since ${flag('since')}` : ''}.`);
    return;
  }
  if (has('json')) {
    console.log(JSON.stringify(rows.map((r) => ({ project: r.project, id: r.id, ...r.acc })), null, 2));
    return;
  }
  const sum = sumAcc(rows.map((r) => r.acc));
  console.log(HEAD);
  for (const r of rows.slice(0, top)) console.log(fmtRow(label(r), r.acc));
  if (rows.length > top) console.log(`${`... ${rows.length - top} more`.padEnd(38)}`);
  console.log('-'.repeat(HEAD.length));
  console.log(fmtRow(`TOTAL (${rows.length} sessions)`, sum));
  printRatios(sum);
  if (cost(sum) === null) console.log(`\n(no prices in ${path.basename(RATES_FILE)} — tokens only. Fill it in for $ columns.)`);
}

function sessionCmd() {
  const q = args[1] && !args[1].startsWith('--') ? args[1] : 'latest';
  const all = listSessions(null);
  let s;
  if (q === 'latest') {
    for (const cand of all.sort((a, b) => b.mtime - a.mtime)) {
      const acc = scan(cand.file);
      if (acc.turns > 0) { s = { ...cand, acc }; break; }
    }
  } else {
    const match = all.find((x) => x.id.startsWith(q));
    if (match) s = { ...match, acc: scan(match.file) };
  }
  if (!s) fail(`session not found: ${q}`);

  if (has('json')) { console.log(JSON.stringify({ project: s.project, id: s.id, file: s.file, ...s.acc }, null, 2)); return; }
  console.log(HEAD);
  console.log(fmtRow(label(s), s.acc));
  const tools = Object.entries(s.acc.tools).sort((a, b) => b[1] - a[1]);
  console.log('\nsession id: ' + s.id);
  console.log('tool calls: ' + (tools.map(([t, c]) => `${t}=${c}`).join(' ') || 'none'));
  console.log('models: ' + (Object.entries(s.acc.models).map(([m, c]) => `${m}=${c}`).join(' ') || 'none'));
  console.log(`user messages: ${s.acc.userMsgs}  |  tool results: ~${k(s.acc.toolResultTokens)} tokens`);
  if (s.acc.dupSkipped) console.log(`deduplicated usage records: ${s.acc.dupSkipped}`);
  printRatios(s.acc);
}

function compare() {
  const [qa, qb] = [args[1], args[2]];
  if (!qa || !qb) fail('usage: compare <sessionA> <sessionB>');
  const all = listSessions(null);
  const find = (q) => {
    const m = all.find((x) => x.id.startsWith(q));
    if (!m) fail(`session not found: ${q}`);
    return { ...m, acc: scan(m.file) };
  };
  const A = find(qa), B = find(qb);
  const metrics = {
    total: total, effInput: effIn, output: (a) => a.output,
    thinking: (a) => a.thinking, perTurn: perTurn,
    outputPerTurn: (a) => Math.round(a.output / Math.max(1, a.turns)),
  };
  if (has('json')) {
    const out = { a: { id: A.id, ...A.acc }, b: { id: B.id, ...B.acc }, delta: {} };
    for (const [name, f] of Object.entries(metrics)) {
      const x = f(A.acc), y = f(B.acc);
      out.delta[name] = { a: x, b: y, pct: x === 0 ? null : (100 * (y - x)) / x };
    }
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  console.log(HEAD);
  console.log(fmtRow('A ' + label(A), A.acc));
  console.log(fmtRow('B ' + label(B), B.acc));
  console.log('');
  for (const [name, f] of Object.entries(metrics)) {
    const x = f(A.acc), y = f(B.acc);
    const pct = x === 0 ? 0 : (100 * (y - x)) / x;
    const verdict = Math.abs(pct) < 2 ? 'noise' : pct < 0 ? 'B cheaper' : 'B costlier';
    console.log(`${name.padEnd(14)} ${k(x).padStart(8)} -> ${k(y).padStart(8)}  ${(pct >= 0 ? '+' : '') + pct.toFixed(1)}%  ${verdict}`);
  }
  console.log('\nOne variable per run, fresh session each side. Record the result — including whether the task still succeeded — in bench/results.md.');
}

function baseline() {
  fs.mkdirSync(STATE, { recursive: true });
  const sub = args[1];
  const file = (l) => path.join(STATE, `baseline-${String(l).replace(/[^\w.-]/g, '_')}.json`);

  if (sub === 'save') {
    const lbl = args[2];
    if (!lbl) fail('usage: baseline save <label>');
    const rows = listSessions(null).map((s) => ({ project: s.project, id: s.id, ...scan(s.file) })).filter((r) => r.turns > 0);
    fs.writeFileSync(file(lbl), JSON.stringify({ at: Date.now(), label: lbl, rows }, null, 2));
    const agg = sumAcc(rows);
    console.log(`saved ${rows.length} sessions to ${file(lbl)}`);
    console.log(HEAD); console.log(fmtRow(lbl, agg));
    return;
  }
  if (sub === 'list') {
    const files = safeReaddir(STATE).filter((f) => f.startsWith('baseline-'));
    if (!files.length) { console.log(`no baselines in ${STATE}`); return; }
    for (const f of files) {
      const d = JSON.parse(fs.readFileSync(path.join(STATE, f), 'utf8'));
      console.log(`${(d.label || f).padEnd(20)} ${new Date(d.at).toISOString().slice(0, 16)}  ${d.rows.length} sessions`);
    }
    return;
  }
  if (sub === 'diff') {
    const [la, lb] = [args[2], args[3]];
    if (!la || !lb) fail('usage: baseline diff <labelA> <labelB>');
    const load = (l) => {
      try { return JSON.parse(fs.readFileSync(file(l), 'utf8')); } catch { fail(`no baseline "${l}" (see: baseline list)`); }
    };
    const A = load(la), B = load(lb);
    const a = sumAcc(A.rows), b = sumAcc(B.rows);
    console.log(HEAD); console.log(fmtRow(la, a)); console.log(fmtRow(lb, b));
    const pct = (x, y) => `${(100 * (y - x)) / Math.max(1, x) >= 0 ? '+' : ''}${((100 * (y - x)) / Math.max(1, x)).toFixed(1)}%`;
    console.log(`\nper-turn total: ${k(perTurn(a))} -> ${k(perTurn(b))} (${pct(perTurn(a), perTurn(b))})`);
    console.log(`eff input/turn: ${k(ratios(a).effInputPerTurn)} -> ${k(ratios(b).effInputPerTurn)} (${pct(ratios(a).effInputPerTurn, ratios(b).effInputPerTurn)})`);
    console.log(`output/turn:    ${k(ratios(a).outputPerTurn)} -> ${k(ratios(b).outputPerTurn)} (${pct(ratios(a).outputPerTurn, ratios(b).outputPerTurn)})`);
    console.log('\nBaselines cover every session in the window, so a change of workload moves these too. Trust `compare` on a repeated task more.');
    return;
  }
  fail('usage: baseline save <label> | baseline diff <a> <b> | baseline list');
}

function help() {
  console.log(`miser-bench — token accounting from Claude Code session logs

  report   [--project <slug|.>] [--since 7d] [--top 10] [--json] [--main-only]
  session  <sessionId|latest> [--json]
  compare  <sessionA> <sessionB> [--json]
  baseline save <label> | baseline diff <a> <b> | baseline list

logs:  ${ROOT}
rates: ${RATES_FILE} ${fs.existsSync(RATES_FILE) ? '' : '(missing — tokens only)'}

The number that matters is eff input/turn: the context sent with every request.`);
}

const table = { report, session: sessionCmd, compare, baseline, help };
if (has('help') || cmd === 'help' || cmd === '-h') { help(); process.exit(0); }
if (!table[cmd]) fail(`unknown command: ${cmd} (try --help)`);
table[cmd]();
