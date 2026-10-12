# STATE — project memory (keep < 60 lines; rewrite via /checkpoint)

## Phase / focus
Phase 1 — Frontend (mock data). Chunks 1–2 of 3 done. Chunk 3 = Ask + Moments tabs, sheets, i18n, voice,
Matches / Landing / NotFound, responsive + a11y pass.

## Done recently
- Chunk 1 (committed c92c5b1): types, mock timeline, mockApi, 8 primitives, replay store/clock/control.
- Engine `shared/sports/cricket/state.ts`: getCricketState, windowFacts, countLegalBalls (5 golden tests).
- Cricket UI `src/sports/cricket/ui/`: ScoreHero, ScoreBar, BallChip (FREE HIT), OverStrip, ScoreRoll + wicket bar,
  live announcer, PlayerLine, ChaseBar.
- Match Room: AppBar, sticky ScoreBar via IntersectionObserver, 2-col ≥900px, tabs, bottom dock,
  AwayBanner + useAwayDetector, Catch up tab (skeleton, RecapCard, history, template fallback `?fallback=1`).
- Verified in browser: 19.0 shows 144/4, Need 16 off 6, CRR 7.58, RRR 16.00, P'ship 113, Kohli 74 (50),
  Pandya 40 (36), Nawaz 3-0-29-0; no horizontal scroll at 360 and 1280. Build, lint, 35 tests green.
- Chunk 2 is NOT committed yet.

## Next
1. Commit chunk 2. 2. Ask tab (AskThread, Composer, suggested chips) + Moments tab (timeline, filters, "Recap from here").
3. Sheets (Language, Settings, Verified info, Scrubber), LangChip in AppBar, i18n strings (4 langs).
4. Matches, Landing, NotFound pages; voice out; responsive + a11y pass.

## Open issues / blockers
- Away detection on Page Visibility only tested via "Simulate stepping away" (unit-tested logic, not a real tab switch).
- Quick windows are "Last 6/12/30 events" (events, not overs): replace with sport-aware windows later.
- Listen / Share show "Coming soon" toast. Offline toast not implemented. BottomSheet has no drag-to-close.
- Recap copy is template-style ("Is dauraan: …"); real phrasing arrives with Gemini in Phase 3.
- `shared/ai/provider` import restriction + hex-colour stylelint ban still TODO. favicon missing (404 in dev).
- Mock file match.mock.ts is 556 generated lines (exceeds 250-line rule on purpose).
- Demo match: Cricsheet 1298150 (PAK v IND, 2022, MCG). Featured #2: 1415755. LLM: Gemini.

## Gotchas
- Deadline Tue 13 Oct 2026 night IST. Frontend first, mock API behind `VITE_USE_MOCK_API`.
- No Tailwind/Bootstrap/CSS-in-JS (guard hook blocks installs). SCSS modules + tokens only.
- No video, no logos, no Dream11 branding, no predictions/betting language.
- Never cat data/matches/*.json or data/raw/*.json — large. The guard hook blocks shell commands that name env files.
- Replay `position` = events played (0..n); latest seq = position - 1. 1× = 3 s/ball. Mock starts at 17.0 (position 0).
- Free hit is inferred: `data.freeHit`; 3 byes on the free hit is NOT a wicket. 12 legal balls from 17.0 = position 13 = 19.0.
- Chip `selected` undefined = plain action chip; pass `label` for aria-label.
- Testing-library cleanup is manual (`afterEach(cleanup)`; vitest globals off).
- Headless browser throttles rAF between tool calls: replay catches up on next frame, not a bug.
