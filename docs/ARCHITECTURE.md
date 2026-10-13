# ARCHITECTURE.md

## 1. Overview
```
┌───────────────────────────── Browser (React SPA, mobile-first) ─────────────────────────────┐
│ Routes: / (Landing, lazy) · /matches · /match/:id                                            │
│ ReplayClock (time-based) ──► seq ──► sportAdapter.getState(timeline, seq) ──► ScoreHero UI   │
│ AwayDetector (Page Visibility) ──► lastSeenSeq ──► AwayBanner                                │
│ Voice: speechSynthesis (out) · SpeechRecognition (in)                                        │
│ Services: matchService (static JSON, cached) · aiService (fetch /api/*)                      │
└───────────────┬───────────────────────────────────────────────┬──────────────────────────────┘
                │ GET /data/matches/<id>.json (static, immutable) │ POST /api/recap · /api/ask
                ▼                                                 ▼
┌──────────────── Vercel CDN ───────────────┐     ┌──────────── Vercel Functions (Node 20) ───────────────┐
│ dist/ assets, data/matches/*.json          │     │ validate → rate-limit → load timeline (bundled)       │
└────────────────────────────────────────────┘     │ adapter.summarize / getState → Facts   (numbers)      │
                                                   │ provider.generate(prompt(Facts, lang)) (words)        │
                                                   │ guard(text, Facts) ? text : template(Facts, lang)     │
                                                   │ cache (in-memory LRU) → JSON response                 │
                                                   └───────────────────────────────────────────────────────┘
Data pipeline (offline): Cricsheet JSON → scripts/preprocess-cricsheet.ts → data/matches/<id>.json
```

**Key idea:** the same pure engine in `shared/` runs in the browser (for the scoreboard) and on the server
(for AI facts). The server never trusts numbers from the client — the client sends only `matchId`, sequence numbers, language and question.

## 2. Stack
| Layer | Choice | Why |
|---|---|---|
| UI | React 18, TypeScript strict, Vite, React Router | Fast, familiar, code-splitting |
| Styling | SCSS modules + CSS custom-property tokens (`sass`) | No framework lock-in; themeable; tiny CSS |
| State | Small stores via `useSyncExternalStore` (replay, settings) | No state lib needed |
| Icons | `lucide-react` per-icon imports | Tree-shaken |
| API | Vercel Functions (Node 20), TypeScript | Same repo, one deploy |
| Validation | `zod` (server only) | Strict request schemas |
| LLM | Provider interface: Gemini Flash (`@google/genai`) default, Anthropic Haiku alternative | Fast, cheap, strong Indic output; swappable via `LLM_PROVIDER` |
| Voice | Web Speech API | Free, no keys |
| Tests | Vitest, Testing Library, Playwright | See TESTING.md |
| Data | Cricsheet (ODC-BY) preprocessed to static JSON | No rate limits; replayable forever |

## 3. Folder structure
```
api/
  recap.ts            POST: { matchId, fromSeq, toSeq, lang } → RecapResponse
  ask.ts              POST: { matchId, seq, question, lang } → AskResponse
  _lib/http.ts        method check, JSON parse with size cap, error envelope, security headers
  _lib/rateLimit.ts   token bucket per IP (in-memory; Upstash in prod)
  _lib/cache.ts       LRU (500 entries) keyed `${matchId}:${from}:${to}:${lang}`
  _lib/matches.ts     loads timelines from data/ (bundled with functions), allow-list of ids
shared/
  sports/types.ts     SportAdapter, TimelineEvent, MatchTimeline, MatchState, Facts, Lang
  sports/registry.ts  { cricket: cricketAdapter, football: footballAdapter }
  sports/cricket/     normalize.ts, state.ts, summarize.ts, questions.ts, labels.ts, *.test.ts
  sports/football/    adapter.ts (stub: proves the interface)
  ai/prompts.ts       buildRecapPrompt, buildAskPrompt (per language style guides)
  ai/guard.ts         extractNumbers, isGrounded(text, facts)
  ai/templates.ts     deterministic recap/answer text per language (fallback)
  ai/provider.ts      LLMProvider interface + gemini/anthropic impls (server-only import)
  i18n/strings.ts     UI strings for en, hinglish, hi, gu
src/
  main.tsx, App.tsx, router.tsx
  pages/              Landing/, Matches/, MatchRoom/, NotFound/
  features/replay/    useReplayClock.ts, replayStore.ts, ReplayControl.tsx
  features/away/      useAwayDetector.ts, AwayBanner.tsx
  features/catchup/   CatchUpTab.tsx, RecapCard.tsx, FactStrip.tsx
  features/ask/       AskTab.tsx, AskThread.tsx, Composer.tsx
  features/voice/     useSpeak.ts, useListen.ts, voices.ts
  features/moments/   MomentsTab.tsx
  components/         AppBar, Button, IconButton, Chip, SegmentedControl, BottomSheet, Skeleton, Toast, …
  sports/cricket/ui/  ScoreHero.tsx, BallChip.tsx, OverStrip.tsx, PlayerLine.tsx, ChaseBar.tsx
  sports/uiRegistry.ts  sport → lazy UI slots
  services/           matchService.ts, aiService.ts, mockApi.ts
  mocks/              match.mock.ts
  styles/             _tokens.scss, _themes.scss, _mixins.scss, _reset.scss, _fonts.scss, global.scss
data/matches/         <id>.json (generated) + index.json (list for /matches)
scripts/              preprocess-cricsheet.ts
tests/e2e/            Playwright specs
```
`shared/ai/provider.ts` must never be imported from `src/` (lint rule `no-restricted-imports`).

## 4. Data model (`shared/sports/types.ts`)
```ts
export type SportId = 'cricket' | 'football' | 'kabaddi';
export type Lang = 'en' | 'hinglish' | 'hi' | 'gu';
export type EventTone = 'major' | 'big' | 'good' | 'minor' | 'none';   // maps to --c-ev-* tokens

export interface TimelineEvent {
  seq: number;            // 0..n-1, the only cursor the app uses
  clock: string;          // display label: '16.3' (cricket) | "67'" (football)
  period: number;         // innings / half
  kind: string;           // sport-specific: 'dot'|'run'|'four'|'six'|'wicket'|'wide'… | 'goal'…
  tone: EventTone;
  text: string;           // short factual description from data (not AI)
  data: Record<string, unknown>; // sport-specific payload (typed inside the adapter)
}

export interface MatchMeta {
  id: string; sport: SportId; title: string; subtitle: string; format: string; date: string;
  teams: { code: string; name: string }[]; venue?: string; result?: string; source: string; license: string;
}
export interface MatchTimeline { meta: MatchMeta; events: TimelineEvent[] }

export interface Fact { key: string; value: number | string; label: Record<Lang, string> }
export interface Facts { window: { fromSeq: number; toSeq: number; fromClock: string; toClock: string };
  items: Fact[]; highlights: string[]; numbers: number[] }   // numbers = every number the AI may use

export interface SportAdapter<S = unknown> {
  id: SportId;
  normalize(raw: unknown): MatchTimeline;                  // offline, in scripts/
  getState(tl: MatchTimeline, seq: number): S;             // UI scoreboard + Ask context
  summarize(tl: MatchTimeline, fromSeq: number, toSeq: number): Facts;   // Catch-up facts
  askContext(tl: MatchTimeline, seq: number): Facts;       // compact state + scorecard as facts
  isMeaningfulGap(tl: MatchTimeline, fromSeq: number, toSeq: number): boolean; // e.g. ≥ 6 legal balls
  suggestedQuestions(lang: Lang, state: S): string[];
}
```
Cricket event `data`: `{ inn, over, ball, batter, bowler, nonStriker, runsBat, extras, extraType, legal, wicket?, score, wkts }`
— cumulative `score`/`wkts` precomputed so `getState` is O(1) for score and O(over) for strips.

## 5. Replay clock
`seq = clamp(floor(baseSeq + (now - startedAt) * speed / BALL_MS), 0, n-1)` with `BALL_MS = 3000` (1× ≈ a ball every 3 s,
a compressed real pace). Pausing stores `baseSeq`; speed changes rebase. Ticks via `requestAnimationFrame` while visible and
a recompute on `visibilitychange` — so hidden tabs (throttled timers) still land on the correct ball on return.

## 6. API contracts
```
POST /api/recap   body ≤ 1 KB
{ "matchId": "ind-wi-…", "fromSeq": 120, "toSeq": 136, "lang": "hinglish" }
→ 200 { "lead": string, "body": string, "facts": FactChip[], "source": "ai"|"template", "window": {...} }

POST /api/ask     body ≤ 2 KB
{ "matchId": "…", "seq": 136, "question": "kitne runs chahiye?", "lang": "hinglish" }
→ 200 { "answer": string, "source": "ai"|"template"|"unknown" }

Errors: 400 {code:'BAD_REQUEST'} · 404 {code:'MATCH_NOT_FOUND'} · 405 · 413 · 429 {code:'RATE_LIMITED', retryAfter} · 500 {code:'INTERNAL'}
```
Server rules: `toSeq - fromSeq ≤ 120`; `seq` within timeline; `lang` enum; `matchId` must be in the allow-list.

## 7. AI pipeline
1. **Facts** — adapter computes facts + the `numbers[]` allow-list (also includes derived forms: overs like `16.3`, ratios).
2. **Prompt** — system prompt (role, language style guide, "use ONLY numbers in FACTS", "no predictions/betting language",
   "if not in DATA say you don't know", output JSON `{lead, body}`), then `<facts>` JSON, then for Ask the user text inside `<question>` tags.
3. **Generate** — temperature 0.3, max 220 output tokens, 6 s timeout, 1 retry on 5xx.
4. **Guard** — parse JSON; extract all numerals (incl. Devanagari `०-९` and Gujarati `૦-૯` digits, normalised); every number must be in
   `facts.numbers` (± formatting). Fail → `templates.ts` output, `source: 'template'`.
5. **Cache** — LRU on server, `sessionStorage` on client.

## 8. Sport extensibility
Adding football = `shared/sports/football/` adapter (normalize from an events feed; `getState` → score, minute, cards; `summarize` → goals, shots, cards)
+ `src/sports/football/ui/ScoreHero` slot + tone mapping. Core pages, replay, catch-up, ask, voice, guard are unchanged.

## 9. Performance budgets
Initial JS (match route) ≤ 120 KB gz · landing ≤ 70 KB gz · CSS ≤ 25 KB gz · match JSON loaded async, `Cache-Control: immutable` ·
fonts: 2 families + lazy Indic, `preload` Archivo · LCP < 2.0 s (Moto G-class, 4G) · INP < 200 ms · CLS < 0.05.

## 10. Environments
| Var | Where | Purpose |
|---|---|---|
| `LLM_PROVIDER` | server | `gemini` (default) \| `anthropic` \| `none` (templates only) |
| `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` | server | provider key |
| `LLM_MODEL` | server | override model id |
| `RATE_LIMIT_PER_MIN` | server | default 20 per IP |
| `VITE_USE_MOCK_API` | client | `true` in Phase 1 |

## 7b. Natural voice (server TTS) — replaces browser speechSynthesis as the primary voice
- Provider: **Gemini TTS via the Gemini API** (same `GEMINI_API_KEY`). Model from `TTS_MODEL` (verify current id in the SDK/docs; flash TTS tier).
  Supports Hindi and Gujarati; English. Style prompt per language, e.g. *"Speak like an excited Indian cricket fan catching a friend up — warm, quick, natural, not a news anchor."*
- Voice per language: one fixed voice name per lang (pick by ear, store in `shared/ai/voices.ts`).
- **Hinglish:** the recap/answer JSON gets an extra `speak` field — the same content written in Devanagari for TTS (display stays Latin). Guard checks `speak` too. A/B by ear vs. feeding Latin Hinglish directly; keep the better one.
- Endpoint: `POST /api/speak { kind: 'recap'|'answer', id }` → `audio/wav` (or mp3). **Never accepts free text** — the server only voices text it generated itself (looked up by id in the recap/answer cache). This prevents the API being used as a free TTS proxy.
- Cache audio in an LRU keyed by `id:lang` (server) and as a Blob URL (client). Pre-fetch audio right after a recap arrives so "Listen" plays instantly.
- Rate limit shared with /api/recap. Timeout 12 s. On failure: show "Voice unavailable" toast; browser speechSynthesis only as an explicit fallback.
- Client: `<audio>` element driven by `useSpeak`; SpeakButton waveform reflects play/pause/ended; respects voice speed via `playbackRate`.
- Fallback provider option (if Gemini voice quality for Gujarati/Hinglish is poor): Sarvam AI Bulbul v3 (Indian languages incl. Gujarati, native Hinglish code-mixing) behind the same `TtsProvider` interface, `TTS_PROVIDER=gemini|sarvam`.
