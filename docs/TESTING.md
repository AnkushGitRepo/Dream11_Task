# TESTING.md

Priority order matches risk: **wrong numbers > broken demo > ugly UI.**

## 1. Pyramid
| Layer | Tool | What | Where |
|---|---|---|---|
| Engine unit (most) | Vitest | adapters: normalize, getState, summarize, askContext, isMeaningfulGap | `shared/sports/**/*.test.ts` |
| Golden tests | Vitest | engine state == official scorecard at checkpoints | `shared/sports/cricket/golden.test.ts` |
| Guard unit | Vitest | number extraction (ASCII/Devanagari/Gujarati), allow-list, adversarial outputs | `shared/ai/guard.test.ts` |
| Template snapshot | Vitest | each language renders without `undefined`/`NaN` for 10 windows | `shared/ai/templates.test.ts` |
| API contract | Vitest + mocked provider | validation errors, 429, timeout→template, guard fallback | `api/*.test.ts` |
| Component | Vitest + Testing Library + jsdom | ScoreHero, RecapCard states, Composer limits, AwayBanner | `src/**/*.test.tsx` |
| E2E | Playwright | critical journeys on Pixel 7 + iPhone 14 + Desktop Chrome | `tests/e2e/*.spec.ts` |
| Prompt eval | script | 20 fact windows × 4 langs → 0 guard failures, manual read of 8 | `scripts/eval-prompts.ts` |
| Manual | real phones | voice, keyboard overlap, safe areas | checklist §5 |

## 2. Golden tests (the most important tests in the repo)
For the chosen demo match, record from the official scorecard (ESPNcricinfo/Cricsheet) at:
end of powerplay (6.0) both innings, every wicket ball, 10.0, 15.0, the final ball.
Assert: team score, wickets, overs, each batter `runs (balls)`, bowler `O-M-R-W`, extras, CRR, RRR, target, partnership.
Edge cases with dedicated unit tests: wide then legal ball in the same "ball number", no-ball + boundary, byes/leg-byes not batter runs,
run-out (no bowler wicket), retired hurt, maiden over, last-ball finish, super over (assert unsupported gracefully).

## 3. Guard tests
- Accepts: numbers in facts, overs `16.3`, `2×6`, Devanagari `२२`, Gujarati `૨૨`, numbers written as words are ignored (documented).
- Rejects: any extra number, a changed score `159/4`, a percentage not in facts, a year.
- Fallback produces template text with `source: 'template'`.

## 4. E2E journeys (Playwright, mobile-first projects)
1. Landing → "Open live demo" → Match Room renders score within 2 s.
2. Play at 20× → score changes → pause → stable.
3. Simulate stepping away → AwayBanner shows missed count → Catch me up → RecapCard with FactStrip and VerifiedBadge.
4. Switch to Gujarati → suggested chips + placeholder change → recap request uses `lang: 'gu'`.
5. Ask "kitne runs chahiye?" → answer bubble appears; 201-char input blocked.
6. API returns 500 → template recap still shows (route mocked via `page.route`).
7. Accessibility: `@axe-core/playwright` on all 4 pages → 0 serious/critical.
LLM is **always mocked** in E2E (`page.route('/api/*')`) except one optional `@live` smoke test run manually.

## 5. Manual device checklist (before submission)
- [ ] Android Chrome: voice out (en-IN, hi-IN), voice in, keyboard doesn't cover composer, switch apps → AwayBanner on return
- [ ] iPhone Safari: voice out after tap, safe areas, `100dvh`, no zoom on input focus
- [ ] Desktop Chrome 1280px: two-column layout, keyboard shortcuts, focus rings
- [ ] Slow 3G throttle: skeletons appear, nothing jumps (CLS)
- [ ] Reduced motion ON: no roll/flash animations
- [ ] No API key set (`LLM_PROVIDER=none`): whole demo still works with templates

## 6. Commands & gates
```bash
npm run test           # vitest run --coverage
npm run test:e2e       # playwright test
```
Coverage gate: `shared/` ≥ 90% lines; overall ≥ 70%. CI (GitHub Actions, optional): lint → typecheck → test → build on every push.
