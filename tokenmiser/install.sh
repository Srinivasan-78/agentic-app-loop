#!/usr/bin/env bash
# Bash installer for tokenmiser — the no-Node path.
#
# Anywhere, in one line (clones into ~/.tokenmiser first):
#   curl -fsSL https://raw.githubusercontent.com/Srinivasan-78/tokenmiser/main/install.sh | bash
#   ... | bash -s -- --hook --copy      pass options after `-s --`
#
#   ./install.sh                 symlink every skill into ~/.claude/skills
#   ./install.sh --project       into ./.claude/skills instead
#   ./install.sh --copy          copy instead of symlink
#   ./install.sh --hook          also install the tool-output filter hook
#   ./install.sh --dry-run       print the plan, write nothing
#   ./install.sh --uninstall     remove installed miser-* skills
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo "$PWD")"
REPO="${TOKENMISER_REPO:-https://github.com/Srinivasan-78/tokenmiser.git}"

# Piped from curl (or otherwise run away from the tree): fetch a checkout, then re-exec
# from it so symlinks point at something that still exists tomorrow.
if [ ! -d "$SRC/skills" ]; then
  HOME_DIR="${TOKENMISER_HOME:-$HOME/.tokenmiser}"
  command -v git >/dev/null 2>&1 || { echo "git is required for the one-line install" >&2; exit 1; }
  if [ -d "$HOME_DIR/.git" ]; then
    echo "updating $HOME_DIR"
    git -C "$HOME_DIR" pull --ff-only --quiet || echo "warning: could not update $HOME_DIR, using it as is" >&2
  else
    echo "cloning tokenmiser into $HOME_DIR"
    git clone --depth 1 --quiet "$REPO" "$HOME_DIR"
  fi
  exec bash "$HOME_DIR/install.sh" "$@"
fi

CLAUDE_HOME="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
DST="$CLAUDE_HOME/skills"
MODE=link; DRY=0; HOOK=0; UNINSTALL=0

for a in "$@"; do
  case "$a" in
    --project|-p) DST="$PWD/.claude/skills" ;;
    --copy) MODE=copy ;;
    --link) MODE=link ;;
    --hook) HOOK=1 ;;
    --dry-run|-n) DRY=1 ;;
    --uninstall) UNINSTALL=1 ;;
    --help|-h) sed -n '2,13p' "$SRC/install.sh" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $a (try --help)" >&2; exit 2 ;;
  esac
done

if [ "$UNINSTALL" -eq 1 ]; then
  found=0
  for d in "$DST"/miser-*; do
    [ -e "$d" ] || continue
    found=1
    if [ "$DRY" -eq 1 ]; then echo "would remove $d"; else rm -rf "$d"; echo "removed $(basename "$d")"; fi
  done
  [ "$found" -eq 0 ] && echo "nothing to remove in $DST"
  echo "The hook and settings.json were left alone."
  exit 0
fi

echo "source: $SRC"
echo "target: $DST  (mode: $MODE)"
echo

mkdir -p "$DST"
for d in "$SRC"/skills/*/; do
  [ -f "$d/SKILL.md" ] || continue
  name=$(basename "$d")
  if [ "$DRY" -eq 1 ]; then echo "would install $name"; continue; fi
  rm -rf "${DST:?}/$name"
  if [ "$MODE" = copy ]; then cp -R "$d" "$DST/$name"; else ln -sfn "${d%/}" "$DST/$name"; fi
  echo "installed $name"
done

if [ "$HOOK" -eq 1 ] && [ "$DRY" -eq 0 ]; then
  mkdir -p "$CLAUDE_HOME/hooks"
  cp "$SRC/hooks/filter-tool-output.py" "$CLAUDE_HOME/hooks/"
  chmod +x "$CLAUDE_HOME/hooks/filter-tool-output.py"
  echo "installed hook: $CLAUDE_HOME/hooks/filter-tool-output.py"
  echo
  echo "Add this to $CLAUDE_HOME/settings.json by hand (this script does not edit your settings):"
  cat <<'JSON'
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [ { "type": "command", "command": "python3 ~/.claude/hooks/filter-tool-output.py" } ] }
    ]
  }
JSON
fi

cat <<EOF

Scripts live in this checkout. Export the root so the skills can find them:
  export MISER="$SRC"        # add to ~/.bashrc or ~/.zshrc

In Claude Code:  /miser-help  then  /miser-setup
Uninstall:       $0 --uninstall
EOF
