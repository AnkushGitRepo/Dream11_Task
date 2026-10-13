# PHASES.md — build plan to the deadline

Deadline: self-target was Tue 13 Oct; **hard deadline = 5 days after the email (~16–17 Oct)**. Scope is NOT cut.
Rule: each phase ends with `/checkpoint` and a git commit. If a phase overruns by > 1 h, apply its cut list.

| Phase | Window (IST) | Goal | Exit criteria | Cut list if late |
|---|---|---|---|---|
| **0 · Setup** | Mon 17:30–19:00 | Repo, docs, agent config, scaffold | `npm run dev` shows a token-styled blank shell; lint/test scripts run; git initialised | — |
| **1 · Frontend (mock data)** | Mon 19:00–01:30 | All pages per DESIGN_PROMPT using `mockApi` | DESIGN_PROMPT §7 checklist except Lighthouse | Moments filters, scrubber sheet, landing language showcase |
| **2 · Engine + real data** | Tue 08:30–11:30 | Cricsheet → timeline; cricket adapter; golden tests | Golden tests green; Match Room runs on real match JSON | Partnership stat, milestones |
| **3 · AI + API** | Tue 11:30–15:00 | `/api/recap`, `/api/ask`, prompts, guard, templates, rate limit | Real recaps in 4 languages, 0 guard failures in eval, templates when `LLM_PROVIDER=none` | Ask context depth, server cache |
| **3.5 · Natural voice** | after Phase 3 | Gemini TTS `/api/speak` per ARCHITECTURE §7b | Hinglish/Hindi/Gujarati recaps sound human to Ankush; Listen plays < 1 s after recap (pre-fetch) | Sarvam fallback provider |
| **4 · Voice, polish, a11y, perf** | Tue 15:00–18:00 | Voice in/out, AwayBanner on real devices, Lighthouse, axe | TESTING §5 manual checklist; Lighthouse ≥ 90/95/95 | Voice in (F8), Gujarati voice, share |
| **5 · Ship** | Tue 18:00–21:30 | Deploy, security headers, Loom, note, submit | Public URL on phone; `/ship-check` = GO; form submitted | Loom polish |

## Phase details

### Phase 0 — Setup
Vite React TS scaffold · SCSS tokens/themes/mixins/reset · ESLint + Stylelint (`stylelint-config-standard-scss`, rule: `color-no-hex` outside tokens) ·
Prettier · Vitest · Playwright · path alias `@/` · `vercel.json` · `.env.example` · git init + first commit.

### Phase 1 — Frontend first
Order: tokens → primitives (Button, Chip, SegmentedControl, BottomSheet, Skeleton, Toast) → replay store + clock (on mock) →
ScoreHero + BallChip + OverStrip → Match Room shell + tabs → Catch up tab → Ask tab → Moments → AwayBanner + simulate →
sheets → Matches page → Landing (reusing ScoreHero/RecapCard in the phone frame) → Not Found → responsive pass.

### Phase 2 — Engine
Pick match (close chase, India preferred, completed, in Cricsheet) → `preprocess-cricsheet.ts` → `cricket/normalize` →
`state` → `summarize` → `askContext` → golden tests → swap mock timeline for real JSON in `matchService`.

### Phase 3 — AI
Provider interface + Gemini impl → prompts per language (style guide with 2 examples each) → guard → templates →
`/api/recap` → `/api/ask` → rate limit + cache → `aiService` replaces `mockApi` behind `VITE_USE_MOCK_API=false` → eval script.

### Phase 4 — Voice & polish
`useSpeak` voice selection (`gu-IN` → `hi-IN` fallback disallowed; hide instead) · `useListen` · real-device pass · axe · Lighthouse fixes.

### Phase 5 — Ship
Vercel project + env vars → deploy → headers check → test on phone → record 60–90 s Loom (story: TV on, step away, come back, catch up in Hinglish, listen, ask by voice, show "Verified stats") →
write 200-word note (`docs/SUBMISSION.md`) → submit form.
