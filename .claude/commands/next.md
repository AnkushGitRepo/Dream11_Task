---
description: Pick the next open TODO item in the current phase, plan it, build it, test it, checkpoint.
---
1. Take the first unchecked item in the current phase of `TODO.md` (or the item named here: $ARGUMENTS).
2. Read only the docs the AGENTS.md §4 routing table says this item needs.
3. Post a plan of 3–6 bullets. If it changes `shared/sports/types.ts`, an `/api` contract, or adds a
   dependency, stop and ask for approval.
4. Implement. Delegate to `ui-builder` / `engine-builder` subagents when the item is large.
5. Run lint and tests for the touched area. Fix failures.
6. Run `/checkpoint`.
