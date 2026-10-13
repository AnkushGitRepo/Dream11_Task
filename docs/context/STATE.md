# STATE — project memory (keep < 60 lines; rewrite via /checkpoint)

## Phase / focus
Phase 3.5 (natural voice) infrastructure built, UNCOMMITTED, ahead of Phase 2/3 by request. Phase 1 committed (936d5b7).
Remaining before voice is audible end to end: Phase 3 `/api/recap` + `/api/ask` registering speakables, and the sample run.

## Done recently
- Server: shared/ai/{tts,voices}.ts (GeminiTts, Sarvam stub, PCM->WAV), api/speak.ts + api/_lib/{http,rateLimit,cache,speakRegistry},
  Vite dev plugin (/api/speak), vercel.json (CSP media-src 'self' blob:, SPA rewrite), lint rule: no shared/ai or api imports in src/.
- Client: useSpeak plays an <audio> blob (prefetch on arrival, playbackRate = voice speed), browser TTS only as labelled fallback.
- Verified: build, lint, 127 tests; live dev endpoint returns 405/415/400/404/413 correctly (no key needed for those).
- @google/genai ^2.29.0 installed (server-only).

## Next
1. Export GEMINI_API_KEY + TTS_MODEL in your shell, run `node scripts/voice-samples.mjs`; listen to tmp/voice-samples; pick voices in voices.ts.
2. Commit. 3. Phase 2 (preprocess + adapter + golden tests). 4. Phase 3 (providers, prompts, guard incl. `speak`, /api/recap, /api/ask).

## Open issues / blockers
- /api/speak 404s for every id until Phase 3 registers speakables; client then shows the labelled browser fallback (or hides Listen).
- TTS model id + voice names unverified against the live API; Hinglish Devanagari-vs-Latin A/B still to be listened to.
- zod not installed: /api/speak validates by hand; Phase 3 adds zod.
- hi/gu translations are unreviewed by a native speaker. `shared/sports/cricket/snapshot.ts` has an English-only "Need n off b balls".
- MatchRoomView.tsx is ~200 lines (component limit 150): extract a `useMatchRoomModel` hook. state.ts is 254 lines.
- Landing copy is English marketing constants (only the showcase is multilingual). Footer sources are plain domains, no URLs yet.
- Chip hit area is a ::before pad (audit tools that measure the element box flag 32px chips; elementFromPoint confirms the top pad).
- Quick recap windows are "Last 6/12/30 events". Share = coming-soon toast. BottomSheet has no drag-to-close.
- Real mic/voice/visualViewport behaviour untested on a device (headless only). src/services/mockAnswer.ts has cricket keywords (mock only).
- `shared/ai/provider` import restriction + hex-colour stylelint ban still TODO. favicon missing (404 in dev).
- Demo match: Cricsheet 1298150 (PAK v IND, 2022, MCG). Featured #2: 1415755. LLM: Gemini.

## Gotchas
- DEADLINE: **Wed 14 Oct 2026, 18:00 IST** (submit by 17:00). NOTHING is cut: Phase 2, 3, 3.5, 4, 5 all done properly. Deploy to Vercel by Wed 10:00.
- What Ankush heard as 'robotic' on Tue was the BROWSER FALLBACK: /api/speak 404s until Phase 3 registers speakables, and tmp/voice-samples was empty. Gemini TTS has not been heard yet.
- VOICE: browser speechSynthesis sounds robotic — replace with server TTS (Gemini TTS, same GEMINI_API_KEY). See ARCHITECTURE §7b. Browser TTS = last-resort fallback only.
- No Tailwind/Bootstrap/CSS-in-JS (guard hook blocks installs). SCSS modules + tokens only.
- No video, no logos, no Dream11 branding, no predictions/betting language.
- Never cat data/matches/*.json or data/raw/*.json. The guard hook blocks shell commands that name env files.
- Replay `position` = events played (0..n); latest seq = position - 1. Mock starts at 17.0; 12 legal balls = 19.0.
- Default language = hinglish, so component tests asserting English call `updateSettings({ lang: 'en' })`.
- Theme tokens: dark = default, light = `data-theme="paper"`. Chip `selected` undefined = plain action chip.
- Testing-library cleanup is manual (`afterEach(cleanup)`). Headless browser throttles rAF between tool calls.
