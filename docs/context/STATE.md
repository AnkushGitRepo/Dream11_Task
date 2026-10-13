# STATE — project memory (keep < 60 lines; rewrite via /checkpoint)

## Phase / focus
Phases 1, 2, 3.5 (infra) and 3.6 (Learn mode) are built; Phase 1 committed (936d5b7), everything since is UNCOMMITTED.
Next phase: 3 (`/api/recap`, `/api/ask`, prompts, full guard) then 4 (voice in, a11y, perf) and 5 (ship).

## Done recently
- Phase 3.6 Learn mode: rulebooks (cricket 15 / football 10 / kabaddi 8 x 4 langs, `shared/sports/*/rules.ts`, helpers in `shared/sports/rules.ts`),
  `SportAdapter.teachables()`, `/api/learn`, `shared/ai/{guard,provider,learnMoment}.ts`, `features/learn/*`, Matches "More sports" cards, landing row.
- Phase 2 engine: preprocess -> `data/matches/*.json`, cricket adapter, independent golden tests, football stub, registry.
- Verified: tsc, eslint, stylelint, `npm run build`, 369 tests (52 files), live dev `/api/learn` (template path; no key set).

## Next
1. Commit (Phase 2 + 3.6 are a large uncommitted tree; suggest 2-3 conventional commits).
2. Phase 3: `/api/recap` + `/api/ask` using `shared/ai/{guard,provider}`, `lookupRule`/`askContextWithRule`, register speakables, add zod.
3. Export GEMINI_API_KEY, LLM_MODEL, TTS_MODEL; run `node scripts/voice-samples.mjs`; hear Learn cards end to end.

## Open issues / blockers
- hi/gu translations (UI + rulebooks) unreviewed by a native speaker. Rule entries I am least sure of: LBW wording, DRS review counts
  (kept generic), kabaddi baulk-line/empty-raid and bonus-line details (PKL conventions), football extra-time.
- TTS and LLM model ids unverified against the live API (`TTS_MODEL`, `LLM_MODEL`); without them /api/learn serves the template moment.
- `/api/ask` does not exist: Ask is still the client mock (`src/services/mockApi.ts`); rule questions are answered from the rulebook there.
- Glossary Listen uses the basic browser voice. LearnCard dock offset on mobile is untested on a device.
- MatchRoomView.tsx is ~220 lines (limit 150): extract `useMatchRoomModel`. state.ts 254 lines. Functions >40 lines remain in the cricket engine.
- zod not installed: /api/speak and /api/learn validate by hand. favicon missing. hex-colour stylelint ban + `shared/ai/provider` import ban TODO.
- Demo match: Cricsheet 1298150 (PAK v IND, 2022, MCG). Featured #2: 1415755. LLM: Gemini.

## Gotchas
- DEADLINE: **Wed 14 Oct 2026, 18:00 IST** (submit by 17:00). NOTHING is cut. Deploy to Vercel by Wed 10:00.
- Cricsheet has NO record of the free-hit "bowled, not out" at 19.4 (seq 247 = `byes:3`). It comes from a curated annotation in
  `scripts/preprocess-cricsheet.ts` (`data.annotation/annotationNote/annotationSource`); re-run `npm run data:build` after editing it.
- Learn moment numbers: the guard allows only numbers shown to the model in the prompt (+ clock parts), not the whole scorecard.
- Learn trigger looks at the newest 2 events only (`MAX_LOOKBACK`); seeking with Learn off raises nothing.
- SpeakKind is `recap | answer | learn`; /api/speak voices only registered ids. Hinglish is voiced from Devanagari text.
- `data/matches` is read server-side via `api/_lib/matchStore.ts` (allow-list from index.json; vercel.json includeFiles for api/learn.ts).
- Replay `position` = events played (0..n); latest seq = position - 1.
- Default language = hinglish, so component tests asserting English call `updateSettings({ lang: 'en' })`.
- Theme tokens: dark = default, light = `data-theme="paper"`. Chip `selected` undefined = plain action chip.
- No Tailwind/Bootstrap/CSS-in-JS. No video, logos, Dream11 branding or betting language. Never cat data/*.json.
- Testing-library cleanup is manual (`afterEach(cleanup)`). Headless browser throttles rAF between tool calls.
