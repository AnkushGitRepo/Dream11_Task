# TODO.md

> Agents: work top-down within the current phase. Tick with `- [x]`. Add new tasks under the right phase.
> Current phase is recorded in `docs/context/STATE.md`.

## Phase 0 — Setup
- [x] Docs + agent configuration (AGENTS/CLAUDE/GEMINI, hooks, subagents, commands)
- [x] Run `bash scripts/install-claude-config.sh` (moves `_claude/` → `.claude/`)
- [x] `git init` + first commit of docs
- [x] Scaffold Vite React TS at repo root (`npm create vite@latest . -- --template react-ts`), Node 20 (`.nvmrc`)
- [x] Add deps: `react-router-dom`, `lucide-react`; dev: `sass`, `vitest`, `@testing-library/react`, `jsdom`, `@playwright/test`, `eslint`, `stylelint`, `stylelint-config-standard-scss`, `prettier` (Playwright deferred to Phase 4, zod to Phase 3)
- [x] Path alias `@/` → `src/`, `@shared/` → `shared/` (vite + tsconfig)
- [x] `src/styles/`: `_tokens.scss`, `_themes.scss`, `_mixins.scss` (`up()`), `_reset.scss`, `_fonts.scss`, `global.scss` per DESIGN.md
- [ ] ESLint `no-restricted-imports` for `shared/ai/provider` in `src/`; Stylelint bans hex colours outside `_tokens.scss`/`_themes.scss`
- [x] npm scripts: dev, dev:full, build, lint, test, test:e2e, data:build
- [ ] `vercel.json` with headers from SECURITY.md §4 (production only)

## Phase 1 — Frontend (mock data)
- [x] `shared/sports/types.ts` (contract from ARCHITECTURE §4) + `src/mocks/match.mock.ts` + `src/services/mockApi.ts`
- [x] Primitives: Button, IconButton, Chip, SegmentedControl, BottomSheet, Skeleton, Toast, LiveDot
- [x] Primitives: EmptyState, ErrorState
- [x] Replay store + `useReplayClock` (time-based) + ReplayControl
- [x] Cricket UI: ScoreHero (incl. collapsed bar), BallChip, OverStrip, PlayerLine, ChaseBar
- [x] Match Room shell: AppBar, layout mobile/desktop, tabs, bottom action area
- [x] Catch up tab: empty tip + Simulate stepping away, skeleton, RecapCard, FactStrip, VerifiedBadge, history
- [x] Ask tab: suggested chips, AskThread, Composer (200 cap), states
- [x] Moments tab: timeline + filters + "Recap from here"
- [x] AwayBanner + `useAwayDetector`
- [x] Sheets: Language, Settings, Verified info, Replay scrubber
- [x] i18n strings (en, hinglish, hi, gu) + lazy Indic fonts
- [x] Voice out (`useSpeak` + SpeakButton waveform); mic button hidden when unsupported
- [x] Matches page
- [x] Landing page (paper theme, phone-frame live demo)
- [x] Not Found page
- [x] Responsive + a11y pass (360 / 390 / 768 / 1280)

## Phase 2 — Engine + real data
- [x] Choose demo match → 1298150 PAK v IND T20 WC 2022 (+ 1415755 IND v SA 2024 final)
- [x] Record official scorecard checkpoints (19.0 + final already in STATE.md; add powerplay + each wicket)
- [x] `scripts/preprocess-cricsheet.ts` → `data/matches/<id>.json` + `index.json`
- [x] cricket adapter: normalize, getState, summarize, askContext, isMeaningfulGap, suggestedQuestions
- [x] Golden + edge-case tests green
- [x] Football stub adapter (types compile, one test)
- [ ] `matchService` loads real JSON (async, cached)

## Phase 3 — AI + API
- [ ] `shared/ai/provider.ts` (gemini, anthropic, none) — minimal Gemini `TextProvider` exists (built for /api/learn); extend
- [ ] `prompts.ts` with language style guides + `templates.ts`
- [ ] `guard.ts` + adversarial tests — number guard exists (ASCII/Devanagari/Gujarati digits + English words); add recap/ask adversarial cases
- [ ] `api/_lib`: http, zod schemas, rateLimit, cache, matches allow-list
- [ ] `api/recap.ts`, `api/ask.ts` + contract tests
- [ ] `aiService` replaces mockApi (`VITE_USE_MOCK_API=false`)
- [ ] `scripts/eval-prompts.ts` → 0 guard failures

## Phase 3.5 — Natural voice (server TTS)
- [x] `shared/ai/tts.ts` TtsProvider (gemini; sarvam stub) + `voices.ts` (voice + style prompt per lang)
- [ ] Recap/answer JSON gets `speak` field (Devanagari for Hinglish); guard checks it — blocked on Phase 3 (`/api/recap`, `/api/ask`); they must call `registerSpeakable(kind, id, {text, lang})` from api/_lib/speakRegistry.ts
- [x] `api/speak.ts` (id-based, no free text, LRU audio cache, rate limit)
- [x] `useSpeak` → `<audio>` playback, pre-fetch after recap, playbackRate = voice speed; browser TTS fallback only on error
- [ ] Run `node scripts/voice-samples.mjs` with GEMINI_API_KEY and TTS_MODEL exported in the shell, then Ankush listens to EN / Hinglish / HI / GU samples and picks voices

## Phase 3.6 — Learn mode (rules coach)
- [x] `shared/sports/cricket/rules.ts` (15) + football (10) + kabaddi (8) rulebooks × 4 langs + completeness/length-cap tests
- [x] `teachables()` in cricket adapter (free-hit-bowled-not-out at 19.4 via curated annotation) + tests
- [x] `/api/learn` (rulebook short + guarded Gemini moment + speak registration, kind `learn`) + contract tests
- [x] Ask: rule lookup ("what is X / X kya hota hai / X shu che") feeds the facts (mock Ask wired; `askContextWithRule` ready for `/api/ask`)
- [x] `features/learn/`: LearnToggle, LearnCard, useLearnTrigger, learnStore, glossary sheet, teachable dots
- [x] Matches "Learn the rules" (Football/Kabaddi cards) + landing feature row
- [ ] Ankush reviews Hindi/Gujarati rule text by ear (`shared/sports/*/rules.ts`, `shared/i18n/learn.ts`)
- [ ] Phase 3: `/api/ask` must call `lookupRule` + `askContextWithRule` and register `speak` kind `answer`
- [ ] Glossary "Listen" uses the basic browser voice (rule text is not server-registered); decide if natural voice is worth an endpoint
- [ ] Real-device pass of the LearnCard position (mobile dock offset is a token estimate, desktop = fixed top-right)

## Phase 4 — Voice, polish, a11y, perf
- [ ] Voice in (`useListen`) with transcript UI
- [ ] Real-device checklist (TESTING §5)
- [ ] axe 0 serious; Lighthouse mobile ≥ 90/95/95
- [ ] Playwright journeys 1–7 green

## Phase 5 — Ship
- [ ] Vercel deploy + env vars + headers verified
- [ ] `/ship-check` = GO
- [ ] Loom 60–90 s
- [ ] Final 200-word note in `docs/SUBMISSION.md`
- [ ] Submit form
