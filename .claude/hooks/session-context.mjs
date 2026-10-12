#!/usr/bin/env node
// SessionStart hook: re-injects project memory at startup, resume, /clear and after compaction.
// Whatever this prints to stdout is added to Claude's context. Keep output small (< ~120 lines).
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const out = [];

const read = (rel) => {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
};

const state = read('docs/context/STATE.md');
out.push('## Project memory (auto-injected by SessionStart hook)');
out.push(state ? state.trim() : '_docs/context/STATE.md missing — create it with /checkpoint._');

const todo = read('TODO.md');
if (todo) {
  const open = todo.split('\n').filter((l) => /^\s*- \[ \]/.test(l)).slice(0, 8);
  out.push('\n## Next open TODO items');
  out.push(open.length ? open.join('\n') : '_All TODO items are done._');
}

try {
  const status = execSync('git status --short --branch', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .split('\n')
    .slice(0, 15)
    .join('\n');
  out.push('\n## git status\n```\n' + status.trim() + '\n```');
} catch {
  out.push('\n_(not a git repository yet)_');
}

out.push('\nRules: see AGENTS.md. Run /checkpoint after each TODO item and before /compact.');
process.stdout.write(out.join('\n') + '\n');
