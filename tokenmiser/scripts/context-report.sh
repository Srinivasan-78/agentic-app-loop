#!/usr/bin/env bash
# What loads into EVERY session before you type anything.
# Estimates are chars/4 — good enough to rank sinks; cross-check with /context in session.
#
#   bash context-report.sh            human-readable, ranked
#   bash context-report.sh --json     machine-readable (for scripts and CI)
#   bash context-report.sh --quiet    totals only
set -uo pipefail

JSON=0; QUIET=0
for a in "$@"; do
  case "$a" in
    --json) JSON=1 ;;
    --quiet|-q) QUIET=1 ;;
    --help|-h) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done

CLAUDE_HOME="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
TOTAL=0
ROWS=()   # "tokens<TAB>label<TAB>note"

est()  { local b; b=$(wc -c < "$1" 2>/dev/null || echo 0); echo $(( b / 4 )); }
tilde() { printf '%s' "${1/#$HOME/\~}"; }
add()  { # tokens label note
  TOTAL=$(( TOTAL + $1 ))
  ROWS+=("$1	$2	${3:-}")
}

# ---------------------------------------------------------------- memory files

SEEN=""
for f in "$CLAUDE_HOME/CLAUDE.md" "$CLAUDE_HOME/claude.md" "$PWD/CLAUDE.md" "$PWD/.claude/CLAUDE.md" "$PWD/AGENTS.md" "$PWD/.cursorrules"; do
  [ -f "$f" ] || continue
  real=$(readlink -f "$f" 2>/dev/null || printf '%s' "$f")
  case " $SEEN " in *" $real "*) continue ;; esac   # same file twice (case-insensitive FS)
  SEEN="$SEEN $real"
  t=$(est "$f"); lines=$(wc -l < "$f")
  note="${lines} lines"
  [ "$lines" -gt 200 ] && note="$note — OVER the 200-line guideline; run /miser-compress"
  add "$t" "$(tilde "$f")" "$note"
done

# @path imports pulled in by a CLAUDE.md
for f in "$CLAUDE_HOME/CLAUDE.md" "$PWD/CLAUDE.md"; do
  [ -f "$f" ] || continue
  while read -r imp; do
    [ -n "$imp" ] || continue
    p="${imp/#\~/$HOME}"
    [ -f "$p" ] && add "$(est "$p")" "  import: $imp" "loaded with its parent"
  done < <(grep -oE '^@[^ ]+' "$f" 2>/dev/null | sed 's/^@//')
done

# per-project memory index
SLUG=$(printf '%s' "$PWD" | tr '/' '-')
MEM="$CLAUDE_HOME/projects/$SLUG/memory"
if [ -f "$MEM/MEMORY.md" ]; then
  files=$(find "$MEM" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l)
  add "$(est "$MEM/MEMORY.md")" "memory/MEMORY.md (index, always loaded)" "$files memory files on disk"
fi

# settings
for f in "$CLAUDE_HOME/settings.json" "$PWD/.claude/settings.json" "$PWD/.claude/settings.local.json"; do
  [ -f "$f" ] && add "$(est "$f")" "$(tilde "$f")" ""
done

# ------------------------------------------------- skills / agents / commands
# Only the frontmatter block (name + description) is loaded until a skill fires.

count_frontmatter() { # dir glob -> "count<TAB>tokens"
  local count=0 chars=0 f
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    count=$(( count + 1 ))
    chars=$(( chars + $(awk '/^---[[:space:]]*$/{n++; next} n==1' "$f" | wc -c) ))
  done < <(find $1 -name "$2" -not -path '*/node_modules/*' 2>/dev/null)
  printf '%s\t%s\n' "$count" "$(( chars / 4 ))"
}

read -r SK_N SK_T < <(count_frontmatter "$CLAUDE_HOME/skills $CLAUDE_HOME/plugins $PWD/.claude/skills" "SKILL.md")
[ "${SK_N:-0}" -gt 0 ] && add "$SK_T" "$SK_N skills advertised" "~$(( SK_T / SK_N )) tokens each — delete the ones you never fire"

read -r AG_N AG_T < <(count_frontmatter "$CLAUDE_HOME/agents $PWD/.claude/agents" "*.md")
[ "${AG_N:-0}" -gt 0 ] && add "$AG_T" "$AG_N subagent definitions" "name + description listed every session"

CMD_N=$(find "$CLAUDE_HOME/commands" "$PWD/.claude/commands" -name '*.md' 2>/dev/null | wc -l)
[ "${CMD_N:-0}" -gt 0 ] && add $(( CMD_N * 15 )) "$CMD_N slash commands" "rough estimate, ~15 tokens of listing each"

# ------------------------------------------------------------------ mcp servers

MCP_LIST=$(for f in "$HOME/.claude.json" "$PWD/.mcp.json"; do
  [ -f "$f" ] || continue
  python3 - "$f" <<'PY' 2>/dev/null
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    sys.exit(0)
servers = d.get("mcpServers") or {}
for k, v in servers.items():
    print("%s\t%s" % (k, (v.get("command") or v.get("url") or "")))
PY
done)
MCP_N=$(printf '%s' "$MCP_LIST" | grep -c . || true)

# ---------------------------------------------------------------------- output

if [ "$JSON" -eq 1 ]; then
  printf '{\n  "estimatedAlwaysOnTokens": %s,\n  "mcpServers": %s,\n  "rows": [\n' "$TOTAL" "${MCP_N:-0}"
  first=1
  for r in "${ROWS[@]}"; do
    IFS=$'\t' read -r t l note <<<"$r"
    [ $first -eq 1 ] || printf ',\n'; first=0
    printf '    {"tokens": %s, "source": "%s", "note": "%s"}' "$t" "${l//\"/\\\"}" "${note//\"/\\\"}"
  done
  printf '\n  ]\n}\n'
  exit 0
fi

if [ "$QUIET" -eq 0 ]; then
  echo "=== always-on context (estimate, chars/4) ==="
  printf '%8s  %-52s %s\n' "tokens" "source" "note"
  printf '%s\n' "${ROWS[@]}" | sort -t$'\t' -k1 -nr | while IFS=$'\t' read -r t l note; do
    printf '%8s  %-52s %s\n' "$t" "$l" "$note"
  done

  echo
  echo "=== MCP servers (schemas are deferred by default, but each one still costs on first use) ==="
  if [ "${MCP_N:-0}" -eq 0 ]; then
    echo "  none"
  else
    printf '%s\n' "$MCP_LIST" | while IFS=$'\t' read -r name cmd; do
      [ -n "$name" ] && printf '  %-24s %s\n' "$name" "$cmd"
    done
    echo "  a large server costs 10-17k tokens of tool definitions; disable unused ones with /mcp"
  fi
  echo
fi

printf '%8s  %s\n' "$TOTAL" "ESTIMATED ALWAYS-ON TOKENS (excludes the system prompt and built-in tools)"
echo
echo "Cross-check in session with /context and /usage."
echo "Per-turn cost = this + conversation history + tool results + output."
echo "Next: node \"\${MISER:-.}/scripts/miser-bench.mjs\" report --since 7d"
