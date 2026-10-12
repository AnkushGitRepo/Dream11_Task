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
- [ ] Ask tab: suggested chips, AskThread, Composer (200 cap), states
- [ ] Moments tab: timeline + filters + "Recap from here"
- [x] AwayBanner + `useAwayDetector`
- [ ] Sheets: Language, Settings, Verified info, Replay scrubber
- [ ] i18n strings (en, hinglish, hi, gu) + lazy Indic fonts
- [ ] Voice out (`useSpeak` + SpeakButton waveform); mic button hidden when unsupported
- [ ] Matches page
- [ ] Landing page (paper theme, phone-frame live demo)
- [ ] Not Found page
- [ ] Responsive + a11y pass (360 / 390 / 768 / 1280)

## Phase 2 — Engine + real data
- [x] Choose demo match → 1298150 PAK v IND T20 WC 2022 (+ 1415755 IND v SA 2024 final)
- [ ] Record official scorecard checkpoints (19.0 + final already in STATE.md; add powerplay + each wicket)
- [ ] `scripts/preprocess-cricsheet.ts` → `data/matches/<id>.json` + `index.json`
- [ ] cricket adapter: normalize, getState, summarize, askContext, isMeaningfulGap, suggestedQuestions
- [ ] Golden + edge-case tests green
- [ ] Football stub adapter (types compile, one test)
- [ ] `matchService` loads real JSON (async, cached)

## Phase 3 — AI + API
- [ ] `shared/ai/provider.ts` (gemini, anthropic, none)
- [ ] `prompts.ts` with language style guides + `templates.ts`
- [ ] `guard.ts` + adversarial tests
- [ ] `api/_lib`: http, zod schemas, rateLimit, cache, matches allow-list
- [ ] `api/recap.ts`, `api/ask.ts` + contract tests
- [ ] `aiService` replaces mockApi (`VITE_USE_MOCK_API=false`)
- [ ] `scripts/eval-prompts.ts` → 0 guard failures

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
