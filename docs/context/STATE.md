# STATE — project memory (keep < 60 lines; rewrite via /checkpoint)

## Phase / focus
Phase 1 — Frontend (mock data). Chunk 3a (Ask, Moments, sheets, i18n, voice, shortcuts) built, UNCOMMITTED.
Remaining Phase 1: Matches page, Landing page, responsive + a11y pass (chunk 3b).

## Done recently
- Chunk 1 c92c5b1, chunk 2 7165896 committed. Chunk 3a is working tree only (63 changed files).
- i18n: shared/i18n/{chrome,sheets,catchup,ask,moments}.ts (en/hinglish/hi/gu), `useStrings()`, settings store
  (lang, theme, autoRead, voiceRate), Indic font loaded only for hi/gu, `<html lang>` + `data-theme` sync.
- Ask tab (computed mockAsk via `SportUi.snapshot`, IDK style, error/ratelimit via ?ask=error|ratelimit),
  Composer (200 cap, visualViewport), voice (useSpeak/SpeakButton/useListen), Moments tab (tone filters).
- Sheets: Language, Settings (mic/Google disclosure), Verified info (via VerifiedInfoContext), Scrubber
  (long-press speed chip). Shortcuts Space / C / / / L verified in browser.
- Verified in browser at 390px: Hinglish default, Gujarati switch loads font + lang=gu, Ask answers
  "18 balls mein 48 runs chahiye · RRR 16.00", Moments newest-first, no horizontal scroll. Build, lint, 88 tests green.

## Next
1. Commit chunk 3a. 2. Matches page (featured carousel + list), Landing (paper theme), Not Found polish.
3. Responsive + a11y pass at 360/390/768/1280 (+ reduced motion, focus order, contrast).
4. Then Phase 2: preprocess-cricsheet script, cricket adapter on full data, golden checkpoints.

## Open issues / blockers
- hi/gu translations are unreviewed by a native speaker. `shared/sports/cricket/snapshot.ts` has an English-only "Need n off b balls".
- MatchRoomView.tsx is ~200 lines (component limit 150): extract a `useMatchRoomModel` hook. state.ts is 254 lines.
- Only Match Room is localised; Landing/Matches/PlaceholderPage still English placeholders.
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
