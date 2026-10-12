# AGENTS.md — Kya Hua? (canonical instructions for every AI coding agent)

> Single source of truth for Claude Code, Gemini CLI, Codex, Cursor, etc.
> `CLAUDE.md` and `GEMINI.md` import this file. Edit rules HERE, not there.

## 1. What we are building (30-second version)
**Kya Hua?** is a mobile-first, second-screen web app for sports fans.
A fan steps away from a live match (ad break, chai, phone call) and comes back.
One tap → an AI recap of exactly what they missed, in **English, Hinglish, Hindi or Gujarati**,
read aloud on request. They can then **ask the match** questions by text or voice.

- Demo uses **replay mode**: a completed match (Cricsheet ball-by-ball JSON) is played back as if live.
- Cricket ships first. The architecture is **sport-agnostic** (football, kabaddi next) via sport adapters.
- Built for the Dream11 Forward Deployed Engineer intern assessment. Deadline: **Tue 13 Oct 2026, night (IST)**.

Full context lives in `docs/`. Do NOT read all of it. Use the routing table in §4.

## 2. Non-negotiable rules
1. **Numbers come from code, words come from the LLM.** Every score, run, wicket, rate or count shown
   or spoken is computed by the sport engine in `shared/`. The LLM only phrases facts it is given.
   Every LLM response passes the **number guard** (`shared/ai/guard.ts`) before reaching the user.
2. **Styling = SCSS only.** CSS Modules (`*.module.scss`) + global design tokens in `src/styles/`.
   **Banned:** Tailwind, Bootstrap, MUI, Chakra, styled-components, emotion, any CSS-in-JS or UI kit.
   Never hard-code a colour, font size, radius or spacing value in a component: use tokens.
3. **Secrets never reach the client.** LLM keys live only in server env (`/api`). No `VITE_*` secrets.
   Never read, print or commit `.env*` files (except `.env.example`).
4. **Render AI output as plain text.** Never `dangerouslySetInnerHTML`. Never `eval`.
5. **TypeScript strict.** No `any` without a `// reason:` comment. No `@ts-ignore`.
6. **Sport-agnostic core.** Nothing outside `shared/sports/<sport>/` and `src/sports/<sport>/`
   may mention cricket-specific concepts (overs, wickets, innings). Core code talks in
   `TimelineEvent`, `MatchState`, `Facts`.
7. **Mobile first.** Write base styles for 360px, then `@include up(md)` etc. Test at 360×800.
8. **Small units.** Files < 250 lines, components < 150 lines, functions < 40 lines. Split early.
9. **Minimal dependencies.** Ask before adding any runtime dependency. Prefer the platform.
10. **No login, no accounts, no PII.** No analytics that send personal data.

## 3. Commands
```bash
npm run dev          # Vite dev server (frontend) — http://localhost:5173
npm run dev:full     # vercel dev — frontend + /api functions
npm run build        # type-check + production build
npm run lint         # eslint + stylelint
npm run test         # vitest (unit + component)
npm run test:e2e     # playwright (mobile + desktop viewports)
npm run data:build   # scripts/preprocess-cricsheet.ts -> data/matches/*.json
```

## 4. Context routing — read ONLY what the task needs
| If the task touches…                       | Read first                                   |
|--------------------------------------------|----------------------------------------------|
| Anything (always, it's short)              | `docs/context/STATE.md`, top of `TODO.md`    |
| UI, pages, components, SCSS                | `docs/DESIGN.md` (+ `docs/DESIGN_PROMPT.md` for page specs) |
| Data model, APIs, folders, adapters        | `docs/ARCHITECTURE.md`                       |
| Feature scope / acceptance criteria        | `docs/PRD.md`                                |
| `/api`, env, headers, inputs, prompts      | `docs/SECURITY.md`                           |
| Tests                                      | `docs/TESTING.md`                            |
| Planning / what's next                     | `docs/PHASES.md`, `TODO.md`                  |
| Why something was decided                  | `docs/context/DECISIONS.md`                  |

**Context hygiene**
- Never `cat` files in `data/` (match JSON is huge). Use `head -c 2000` or a node one-liner.
- For broad codebase searches, use a search subagent and keep only its conclusion.
- Do not paste large files back into the conversation; reference paths + line numbers.

## 5. Workflow (every task)
1. Read `docs/context/STATE.md` + the next unchecked item in `TODO.md`.
2. State a 3–6 line plan. If it changes architecture or adds a dependency, ask first.
3. Implement in small steps. Run `npm run lint && npm run test` (once they exist).
4. **Checkpoint:** update `docs/context/STATE.md` (keep it under 60 lines), tick `TODO.md`,
   append any decision to `docs/context/DECISIONS.md` (one line each).
5. Commit with Conventional Commits: `feat(ui): add ScoreHero`, `fix(engine): …`, `docs: …`.

## 6. Definition of done
- Works at 360px and 1280px; no horizontal scroll; tap targets ≥ 44px.
- Keyboard accessible; visible focus; contrast AA; `prefers-reduced-motion` respected.
- No console errors. Lint + tests green. No new hard-coded design values.
- Loading, empty and error states exist for anything async.
- STATE.md and TODO.md updated.

## 7. Repository map (target)
```
api/                  Vercel serverless functions (recap.ts, ask.ts) — server only
shared/               Code used by BOTH api and src
  sports/types.ts       SportAdapter, TimelineEvent, MatchState, Facts
  sports/cricket/       normalize, state, summarize, suggested questions
  sports/football/      stub adapter (proves extensibility)
  ai/                   prompts.ts, guard.ts, templates.ts, provider.ts
src/                  React app (Vite)
  pages/                Landing, Matches, MatchRoom, NotFound
  features/             replay/, catchup/, ask/, voice/, away/
  components/           generic UI primitives
  sports/cricket/ui/    cricket-specific UI (ScoreHero, BallChip…)
  styles/               _tokens.scss, _mixins.scss, _reset.scss, _fonts.scss, global.scss
data/matches/         preprocessed match timelines (generated)
scripts/              data preprocessing
tests/                e2e (Playwright); unit tests live next to source as *.test.ts
docs/                 product + engineering docs
```
