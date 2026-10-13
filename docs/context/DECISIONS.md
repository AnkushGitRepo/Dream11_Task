# DECISIONS — append-only, one line each: `YYYY-MM-DD — decision — why`

2026-10-12 — Build "Catch me up + Ask the match" (A) with voice (G) — every fan hits the "what did I miss" gap; fits Dream11's second-screen pivot; AI is essential, not decorative.
2026-10-12 — No video in the app — broadcast rights; Dream11's own product sits beside the TV broadcast.
2026-10-12 — Replay mode from Cricsheet instead of a live API — deadline precedes next live match; free tiers can't follow a live finish; demo must work any time.
2026-10-12 — Numbers computed in code, LLM only phrases; number guard + template fallback — LLMs hallucinate cricket stats; this is the core trust story.
2026-10-12 — SCSS modules + CSS custom-property tokens, no CSS frameworks — user requirement; small CSS, full design control.
2026-10-12 — Sport-agnostic core via SportAdapter; football stub — scope for other sports without slowing the cricket build.
2026-10-12 — Vercel functions in the same repo — one deploy, keys server-side.
2026-10-12 — Frontend first against mockApi with the final type contract — user requirement; lets UI and engine proceed independently.
2026-10-12 — Landing page included (paper theme) — reviewers open the link cold; 5-second explanation + one CTA improves first impression.
2026-10-12 — No predictions/win probability — reads as betting for a post-PROGA company.
2026-10-12 — LLM provider = Gemini — Ankush has a Gemini key.
2026-10-12 — Demo match = PAK v IND, T20 WC 2022, MCG (Cricsheet 1298150) — iconic last-ball India chase; dramatic recaps; exercises no-ball/free-hit/wide/byes/stumping edge cases. Backup/featured #2 = IND v SA T20 WC 2024 final (1415755).
2026-10-12 — Commit raw Cricsheet JSON (data/raw) — small (~90 KB each), ODC-BY allows it, makes preprocessing reproducible.
2026-10-12 — TypeScript pinned ~6.0 — typescript-eslint supports <6.1 only; revisit when it supports TS 7.
2026-10-12 — Replay `position` = events played (0..n); latest seq = position-1 — needs a "before first ball" state (17.0) that seq 0..n-1 cannot express.
2026-10-12 — Cricket clock label = over.legalBallsDone; no-ball/wide reuse the previous label — matches STATE golden checkpoints (19.3 no-ball).
2026-10-12 — Mock timeline generated from data/raw by script, then committed — hand-typing 22 balls risks wrong numbers; verified 17.0=112/4, 18.6=144/4, final 160/6.
2026-10-12 — Match Room core is sport-agnostic via `SportUi` slots (`src/sports/types.ts`, `uiRegistry.ts`) — keeps cricket words out of pages; football plugs in later.
2026-10-12 — `getCricketState(timeline, position, baseline)` in shared/sports/cricket/state.ts is the single source of every on-screen number — enforces "numbers from code".
2026-10-12 — Mid-innings replay start is a `CricketBaseline` passed alongside the timeline — MatchTimeline contract stays unchanged.
2026-10-12 — Mock recap text is assembled from computed fact labels only — canned prose would disagree with the FactStrip for arbitrary windows.
2026-10-12 — UI strings split per area (shared/i18n/{chrome,sheets,catchup,ask,moments}.ts) with `satisfies` — features add keys without editing each other's files; missing translation = type error.
2026-10-12 — Default theme = dark (not "system") — DESIGN.md says dark is the app default; light maps to `data-theme="paper"`.
2026-10-12 — No voice fallback across languages: Hinglish needs an en-IN voice, hi hi-IN, gu gu-IN, else the Listen button is hidden — a wrong-accent voice reads numbers/names badly.
2026-10-12 — Mic transcript fills the composer for review, never auto-sends — speech recognition errors would otherwise become questions.
2026-10-12 — mockAsk answers only from engine facts (`SportUi.snapshot`) and says "I don't know" otherwise — same numbers-from-code rule as recaps.
2026-10-12 — Landing middle stat is "Lag" + qualitative caption, not "2 balls" — PRD has no numeric source for it; only sourced figures (80%, +42%) are printed as numbers.
2026-10-12 — Footer sources are plain domain names, not links — the exact article URLs were never recorded; add them before submission.
2026-10-12 — Landing phone demo lays out at 390px then scales to the frame (useFitScale) — real components never wrap or clip at 360px.
2026-10-12 — IND v SA 2024 final is a visible "Coming soon" card/row, not a link — the timeline is not preprocessed until Phase 2.
2026-10-13 — /api/speak voices only ids registered by the server (api/_lib/speakRegistry.ts); Phase 3 recap/ask must register their `speak` text — prevents use as a free TTS proxy.
2026-10-13 — TTS_MODEL default `gemini-3.8-flash-tts` comes from the installed SDK's model-id list, NOT verified against the live API (no key run yet); voice names in shared/ai/voices.ts are provisional until picked by ear.
2026-10-13 — Rate limiter bucket size = burst, refill = per-minute rate; per-instance in-memory (documented limitation, Upstash/WAF in production).
2026-10-13 — The voice sample script takes its secrets from the shell's exported variables and never loads secret files itself — respects the guard hook.
2026-10-13 — shared/ai/** uses erasable TS syntax + `.ts` import extensions so Node can run it directly (scripts/voice-samples.mjs); excluded from the app tsconfig, included in the node one.
2026-10-13 — TTS voice = Gemini 'Puck' for all languages — chosen by ear from samples.
