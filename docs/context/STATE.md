# STATE — project memory (keep < 60 lines; rewrite via /checkpoint)

## Phase / focus
Phase 1 — Frontend (mock data) is functionally COMPLETE. Chunk 3b (Matches, Landing, NotFound, a11y pass) is
built and UNCOMMITTED. Next: commit, then Phase 2 (engine + real data).

## Done recently
- Chunks 1, 2, 3a committed (c92c5b1, 7165896, 059bc6d). Chunk 3b = working tree (17 changed paths).
- Matches page (SportTabs, Live-now empty card, featured carousel, All replays, skeleton/error `?matches=error`).
- Landing page (paper theme, scaled live phone demo with real ScoreHero/RecapCard, problem strip, how it works,
  trust band, language showcase, sports row, CTA, footer). NotFound "OUT!".
- a11y/responsive audit at 360/390/768/1280 on all 4 routes via iframes: no horizontal scroll, no contrast
  failures, every focusable has a focus ring. Fixed: /matches page-wide overflow from an sr-only span in the
  carousel (needs position:relative), SegmentedControl 44px hit area, Chip min-width 44, shortcut-hint contrast.
- Build, lint, 102 tests green.

## Next
1. Commit chunk 3b. 2. Phase 2: scripts/preprocess-cricsheet.ts -> data/matches/*.json + index.json.
3. Cricket adapter on the FULL timeline (normalize, getState, summarize, askContext, isMeaningfulGap) + golden tests
   (powerplay + each wicket checkpoints in TODO). 4. Matches/Match Room read from the index instead of mocks.

## Open issues / blockers
- hi/gu translations are unreviewed by a native speaker. `shared/sports/cricket/snapshot.ts` has an English-only "Need n off b balls".
- MatchRoomView.tsx is ~200 lines (component limit 150): extract a `useMatchRoomModel` hook. state.ts is 254 lines.
- Landing copy is English marketing constants (only the showcase is multilingual). Footer sources are plain domains, no URLs yet.
- Chip hit area is a ::before pad (audit tools that measure the element box flag 32px chips; elementFromPoint confirms the top pad).
- Quick recap windows are "Last 6/12/30 events". Share = coming-soon toast. BottomSheet has no drag-to-close.
- Real mic/voice/visualViewport behaviour untested on a device (headless only). src/services/mockAnswer.ts has cricket keywords (mock only).
- `shared/ai/provider` import restriction + hex-colour stylelint ban still TODO. favicon missing (404 in dev).
- Demo match: Cricsheet 1298150 (PAK v IND, 2022, MCG). Featured #2: 1415755. LLM: Gemini.

## Gotchas
- Deadline Tue 13 Oct 2026 night IST. Frontend first, mock API behind `VITE_USE_MOCK_API`.
- No Tailwind/Bootstrap/CSS-in-JS (guard hook blocks installs). SCSS modules + tokens only.
- No video, no logos, no Dream11 branding, no predictions/betting language.
- Never cat data/matches/*.json or data/raw/*.json. The guard hook blocks shell commands that name env files.
- Replay `position` = events played (0..n); latest seq = position - 1. Mock starts at 17.0; 12 legal balls = 19.0.
- Default language = hinglish, so component tests asserting English call `updateSettings({ lang: 'en' })`.
- Theme tokens: dark = default, light = `data-theme="paper"`. Chip `selected` undefined = plain action chip.
- Testing-library cleanup is manual (`afterEach(cleanup)`). Headless browser throttles rAF between tool calls.
