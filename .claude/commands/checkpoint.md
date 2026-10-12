---
description: Save progress to project memory (STATE.md, TODO.md, DECISIONS.md) so the next session or post-compaction context picks up cleanly.
---
Update project memory now. Be terse.

1. Rewrite `docs/context/STATE.md` using its existing headings. Hard limit: 60 lines.
   - **Phase / focus**: current phase from docs/PHASES.md and what is in progress.
   - **Done recently**: last 3–6 completed items (drop older ones; git log has history).
   - **Next**: the next 3 concrete steps.
   - **Open issues / blockers**: anything broken or undecided.
   - **Gotchas**: non-obvious facts a fresh agent must know (keep only still-relevant ones).
2. Tick finished items in `TODO.md` (`- [x]`). Add newly discovered tasks under the right phase.
3. For each decision made this session, append ONE line to `docs/context/DECISIONS.md`:
   `YYYY-MM-DD — decision — why`.
4. Reply with a 3-line summary of what changed. $ARGUMENTS
