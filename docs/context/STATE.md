# STATE — project memory (keep < 60 lines; rewrite via /checkpoint)

## Phase / focus
Phases 1, 2, 3, 3.5 (infra) and 3.6 are built. 1, 2 and 3.6 are committed (35d2d4b); Phase 3 (real recap/ask) is UNCOMMITTED.
Next: Phase 4 (voice in, a11y, perf) and 5 (ship), plus the live-model checks below.

## Done recently
- Phase 3: zod schemas, `/api/recap` + `/api/ask`, `shared/ai/{prompts,promptExamples,templates,askTemplates,pipeline,json,lang}.ts`,
  `api/_lib/{handlerKit,schemas,shared,matchSeq}.ts`, `src/services/aiService.ts`, `npm run eval:prompts`.
- speak/learn moved to zod + the handler kit; one shared rate limiter; provider default model + JSON mode + 1 retry.
- Verified: tsc, eslint, stylelint, build, 548 tests; dev smoke of recap/ask/speak (template path). Mock chunk is absent from real-mode builds.

## Next
1. Commit Phase 3. 2. Export GEMINI_API_KEY (+ TTS_MODEL) in your shell: `npm run eval:prompts`, then `node scripts/voice-samples.mjs`.
3. Set `VITE_USE_MOCK_API=false` in your local env file (the example now says false) so `npm run dev` hits the real routes.
4. Real-JSON `matchService` (retire the `seqBase` bridge). 5. Phase 4 items in TODO.md.

## Open issues / blockers
- FIXED 14 Oct 11:10: quota = AI Studio PREPAY balance was 0 (now topped up; key ...L68w, Tier 1, MarketMitra project). JSON parse failures = Gemini 3.x thinking tokens ate maxOutputTokens → provider now sends thinkingConfig {thinkingLevel: LOW} (MINIMAL rejected), caps raised (recap 900, ask 700, learn 400, default 1024). Live eval EVAL_LIMIT=2: 8/8 AI, 0 guard failures. Run `npm test` — provider.test may need the new thinkingConfig in its expected request.
- (old) LIVE LLM BLOCKED BY QUOTA: eval on 14 Oct got 429 "exceeded your current quota" for gemini-3.8-flash (503 demand spikes earlier) across 4 min of backoff;
  the id itself is valid (Google's 404 for gemini-2.5-flash recommends it). Check plan/billing in AI Studio, then `npm run eval:prompts`.
- (old note) LIVE LLM NEVER RUN: default model `gemini-3.8-flash` (newest non-preview Flash in SDK 2.29.0) is unverified; guard-failure rate unknown
  until `npm run eval:prompts` runs with a key. TTS model id likewise unverified.
- The number guard is set-membership (a number must exist in the facts), not claim verification: a wrong-but-present number can pass.
- hi/gu translations (UI, rulebooks, templates, prompt examples) unreviewed by a native speaker.
- Client replays the mock timeline (seq 0 = real seq 229); `src/mocks/match.mock.test.ts` proves it equals the real events.
- MatchRoomView.tsx ~225 lines (limit 150). state.ts 254 lines. Some cricket-engine functions >40 lines.
- Glossary Listen uses the basic browser voice. LearnCard mobile offset untested on a device.
- Burst 5 is shared by recap, ask, learn and speak: raise `RATE_LIMIT_BURST` if real use trips 429.
- favicon missing; hex-colour stylelint ban TODO. Demo: Cricsheet 1298150; featured #2 1415755.

## Gotchas
- DEADLINE: **Wed 14 Oct 2026, 18:00 IST** (submit by 17:00). NOTHING is cut. Deploy to Vercel by Wed 10:00.
- src/ may import only `@shared/ai/templates` from shared/ai (eslint exception); everything else in shared/ai and api/ is server-only.
- Hooks block shell commands that mention env files, even in comments or heredocs: write such files with the Write tool.
- Every AI endpoint: prompt -> `callModel` (timeout) -> parse -> guard (numbers in prompt facts, banned phrases, script, rule quote) -> template.
- `speak`: Hinglish is shown in Latin and voiced from Devanagari; templates/prompts keep symbols and abbreviations out of it.
- SpeakKind = recap | answer | learn; /api/speak voices only registered ids. Free-hit "bowled" at 19.4 is a curated annotation.
- Learn trigger looks at the newest 2 events only; replay `position` = events played (latest seq = position - 1).
- Default language = hinglish; component tests asserting English call `updateSettings({ lang: 'en' })`. Vitest sets VITE_USE_MOCK_API=true.
- No Tailwind/Bootstrap/CSS-in-JS. No video, logos, Dream11 branding or betting language. Never cat data/*.json.
