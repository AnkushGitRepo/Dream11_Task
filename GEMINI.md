# GEMINI.md

@./AGENTS.md

## Gemini CLI specifics

### Context management
- Gemini CLI loads this file (configured in `.gemini/settings.json`) and the import above.
- At the start of every session, and after `/compress` or `/clear`, run **`/status`** — it loads
  `docs/context/STATE.md` and the next TODO items. Gemini has no SessionStart hook in this repo,
  so this step is manual and mandatory.
- Run **`/checkpoint`** at the end of every TODO item and before `/compress`.
- Use `/memory show` to verify what is loaded. Do not add project facts with `/memory add`;
  put them in `docs/context/STATE.md` or `DECISIONS.md` so every agent sees them.

### Custom commands (`.gemini/commands/`)
`/status` · `/next` · `/checkpoint` · `/review`

### Notes
- Same rules as AGENTS.md: SCSS only, numbers from code, no secrets client-side.
- Never read `.env*` (except `.env.example`). Never install Tailwind/Bootstrap/CSS-in-JS.
