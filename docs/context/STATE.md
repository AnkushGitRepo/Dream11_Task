# STATE — project memory (keep < 60 lines; rewrite via /checkpoint)

## Phase / focus
Phase 0 — Setup. Docs and agent config done; app not scaffolded yet.
Next big step: Phase 1 frontend with mock data, following docs/DESIGN_PROMPT.md.

## Done recently
- Product chosen: "Kya Hua?" — AI catch-up + Ask the match, 4 languages, voice (A + G from research).
- Docs written: PRD, ARCHITECTURE, DESIGN, DESIGN_PROMPT, SECURITY, TESTING, PHASES, ROADMAP.
- Agent setup: AGENTS.md (canonical), CLAUDE.md, GEMINI.md, hooks, subagents, commands.

## Next
1. git init + commit docs.
2. Scaffold Vite React TS + SCSS tokens (TODO Phase 0).
3. Start Phase 1: types + mock data + primitives.

## Open issues / blockers
- Demo match CHOSEN: Cricsheet 1298150, PAK v IND, T20 WC 2022, MCG — India chase 160, won by 4 wkts off the last ball (data/raw/1298150.json).
  Featured #2: 1415755, IND v SA, T20 WC 2024 final — India won by 7 runs (data/raw/1415755.json).
- LLM: Gemini (GEMINI_API_KEY, LLM_PROVIDER=gemini).

## Gotchas
- Dart Sass 1.105: use module functions only (`@use 'sass:map'` → map.get, `sass:math` → math.div, `sass:color`). Never global built-ins (map-get, darken…) or `@import` — they print deprecation warnings.
- Latest majors installed: React 19, Vite 8, TS 6, ESLint 10 (flat config), Vitest 5, React Router 7. Check installed versions before using old APIs.
- Deadline Tue 13 Oct 2026 night IST. Frontend first, mock API behind `VITE_USE_MOCK_API`.
- No Tailwind/Bootstrap/CSS-in-JS (guard hook blocks installs). SCSS modules + tokens only.
- No video, no logos, no Dream11 branding, no predictions/betting language.
- Never cat data/matches/*.json or data/raw/*.json — large.
- Demo-match edge cases: 19.3 no-ball (6 off it) → next ball is a FREE HIT (Cricsheet does not flag it; infer: ball after a no-ball, persisting through wides); 19.4 wide; free-hit ball "bowled" for 3 byes is NOT a wicket; 19.5 Karthik stumped; last ball Ashwin wide then single.
- Golden checkpoint 19.0 (IND inn): 144/4, need 16 off 6, Kohli 74 (50), Pandya 40 (36), Nawaz 3-0-29-0, Rauf 4-0-36-2. Final: 160/6, Kohli 82* (53).
