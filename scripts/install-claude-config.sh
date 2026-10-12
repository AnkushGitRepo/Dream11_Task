#!/usr/bin/env bash
# Activates the Claude Code project config (hooks, subagents, slash commands).
# Run once from the project root:  bash scripts/install-claude-config.sh
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -d .claude ]; then echo ".claude already exists — merge manually from _claude/"; exit 1; fi
mv _claude .claude
chmod +x .claude/hooks/*.mjs
echo "✓ .claude installed. Start Claude Code in this folder and run /status."
