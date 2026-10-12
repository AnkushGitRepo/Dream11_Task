#!/usr/bin/env node
// PreToolUse guard. Exit code 2 = block the tool call; stderr is shown to Claude as the reason.
// Blocks: reading/editing env secrets, installing banned styling libraries, writing secrets into client code.
let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const tool = input.tool_name;
  const ti = input.tool_input || {};

  const block = (msg) => { process.stderr.write(`[guard] ${msg}\n`); process.exit(2); };

  // 1. Secrets: never read or edit real env files (.env.example is fine)
  const envFile = /(^|\/)\.env(\.(?!example$)[\w.-]+)?$/;
  if (['Read', 'Edit', 'Write'].includes(tool) && ti.file_path && envFile.test(ti.file_path)) {
    block('Access to env files is blocked. Use .env.example and ask the user to set real values.');
  }

  if (tool === 'Bash') {
    const cmd = String(ti.command || '');
    if (/(cat|less|more|head|tail|grep|sed|awk)\b[^|]*\.env(?!\.example)\b/.test(cmd)) {
      block('Reading env files via shell is blocked.');
    }
    // 2. Banned styling stacks (project rule: SCSS modules + tokens only)
    const banned = /\b(tailwindcss|@tailwindcss\/\S+|bootstrap|react-bootstrap|@mui\/\S+|@chakra-ui\/\S+|styled-components|@emotion\/\S+|antd|daisyui|shadcn)\b/;
    if (/\b(npm|pnpm|yarn|bun)\s+(i|install|add)\b/.test(cmd) && banned.test(cmd)) {
      block('Banned styling dependency. This project uses SCSS modules + design tokens only (AGENTS.md rule 2).');
    }
  }

  // 3. Client code must never contain secret env access
  if (['Edit', 'Write'].includes(tool) && ti.file_path && /\/src\//.test(ti.file_path)) {
    const text = String(ti.content ?? ti.new_string ?? '');
    if (/VITE_[A-Z_]*(KEY|SECRET|TOKEN)/.test(text) || /process\.env\.[A-Z_]*(KEY|SECRET)/.test(text)) {
      block('Secrets must not be referenced in client code (src/). Call the /api route instead.');
    }
    if (/dangerouslySetInnerHTML/.test(text)) {
      block('dangerouslySetInnerHTML is banned. Render AI text as plain text.');
    }
  }
  process.exit(0);
});
