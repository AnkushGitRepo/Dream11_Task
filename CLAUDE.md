# CLAUDE.md

@AGENTS.md

## Claude Code specifics

### Automatic context management (already wired — don't fight it)
- **SessionStart hook** (`.claude/hooks/session-context.mjs`) injects `docs/context/STATE.md`,
  the next open TODO items and `git status` at startup, resume, `/clear` and after compaction.
  So: after a `/compact` or `/clear` you do NOT need to re-read STATE.md — it is already in context.
- **PreToolUse guard** (`.claude/hooks/guard.mjs`) blocks reading `.env` files and installing
  banned styling libraries (Tailwind, Bootstrap, CSS-in-JS, UI kits). If blocked, follow the message.
- **PostToolUse formatter** (`.claude/hooks/format.mjs`) runs Prettier on files you edit (once installed).
- Run `/checkpoint` at the end of every TODO item and **before** any `/compact`.
- Between phases: `/checkpoint` → `/clear`. STATE.md carries the memory, not the chat.

### Subagents (`.claude/agents/`)
| Agent              | Use it for                                                       |
|--------------------|------------------------------------------------------------------|
| `ui-builder`       | Pages/components/SCSS exactly per `docs/DESIGN.md`               |
| `engine-builder`   | Sport adapters, stats engine, number guard — test-first          |
| `reviewer`         | Read-only security + a11y + performance review of the diff       |
| `test-runner`      | Write/run Vitest + Playwright, report failures concisely         |
Delegate broad searches and reviews to subagents so the main context stays small.

### Slash commands (`.claude/commands/`)
`/status` · `/next` · `/checkpoint` · `/review` · `/ship-check`

### Model guidance
- Plan mode for anything touching `shared/sports/types.ts` or `/api` contracts.
- Prefer `Edit` over full-file `Write` for existing files.
