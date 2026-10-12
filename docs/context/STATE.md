# STATE — project memory (keep < 60 lines; rewrite via /checkpoint)

## Phase / focus
Phase 1 — Frontend (mock data). Chunk 1 of 3 done (types, mock, primitives, replay).
Chunk 2 next: Cricket UI (ScoreHero, BallChip, OverStrip, PlayerLine, ChaseBar) + Match Room shell.

## Done recently
- Phase 0 scaffold: Vite 8 + React 19 + TS 6, SCSS tokens/themes/mixins, eslint/stylelint, vitest. Build, lint, 16 tests green.
- `shared/sports/types.ts` per ARCHITECTURE §4 (unchanged contract).
- `src/mocks/match.mock.ts`: last 3 overs of IND chase (22 events, seq 0 = 17.1), `MOCK_START` = 17.0, 112/4, target 160.
- `src/services/mockApi.ts`: mockRecap / mockAsk, canned 4-language text, 700–1200 ms delay.
- Primitives in `src/components/*`: Button, IconButton, Chip, SegmentedControl, BottomSheet, Skeleton, Toast, LiveDot.
- Replay: `src/features/replay/` replayStore (pure, tested), useReplayClock (rAF + visibilitychange), ReplayControl.
- `/match/pak-ind-2022-t20wc-mcg` raw debug view verified in browser: 112/4 (17.0) → 160/6 (19.6, "India won by 4 wickets") at 20×.

## Next
1. Cricket UI components (`src/sports/cricket/ui/`) reading `event.data` (score, wkts, over, ball, batter…).
2. Match Room shell: AppBar, ScoreHero layout mobile/desktop, tabs, bottom action area (replace debug view).
3. EmptyState + ErrorState primitives, then Catch up tab with mockApi.

## Open issues / blockers
- Mock `event.data` has no per-batter/bowler tallies (Kohli 74 etc.); derive in Phase 2 engine or add to mock for PlayerLine.
- Mock file is 556 lines (data, generated); exceeds the 250-line rule on purpose.
- BottomSheet has no drag-to-close yet (Esc + scrim only). lucide per-icon import path unverified (named imports used).
- `shared/ai/provider` import restriction + hex-colour stylelint ban still TODO. favicon missing (404 in dev).
- Demo match: Cricsheet 1298150 (PAK v IND, 2022, MCG). Featured #2: 1415755. LLM: Gemini.

## Gotchas
- Deadline Tue 13 Oct 2026 night IST. Frontend first, mock API behind `VITE_USE_MOCK_API`.
- No Tailwind/Bootstrap/CSS-in-JS (guard hook blocks installs). SCSS modules + tokens only.
- No video, no logos, no Dream11 branding, no predictions/betting language.
- Never cat data/matches/*.json or data/raw/*.json — large.
- Replay `position` = events played (0..n); latest seq = position - 1. 1× = 3 s/ball.
- Free hit is inferred (Cricsheet doesn't flag it): `data.freeHit`; 3 byes on the free hit is NOT a wicket.
- Chip `selected` undefined = plain action chip (no aria-pressed); pass `label` for aria-label.
- Testing-library cleanup is manual (`afterEach(cleanup)`; vitest globals off).
