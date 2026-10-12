#!/usr/bin/env node
// PostToolUse: format the edited file with the project's local Prettier, if installed. Never fails the turn.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const { tool_input: ti = {} } = JSON.parse(raw);
    const file = ti.file_path;
    const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const prettier = join(root, 'node_modules', '.bin', 'prettier');
    if (!file || !existsSync(prettier)) return;
    if (!/\.(tsx?|jsx?|mjs|scss|css|json|md|html)$/.test(file)) return;
    if (/\/(node_modules|dist|data)\//.test(file)) return;
    spawnSync(prettier, ['--write', '--log-level', 'silent', file], { cwd: root, stdio: 'ignore', timeout: 15000 });
  } catch { /* formatting is best-effort */ }
});
