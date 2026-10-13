# DESIGN_PROMPT.md — Frontend build prompt (Phase 1)

> **How to use:** paste everything between the two `=====` lines into Claude Code / Gemini CLI
> in this repo (it already knows AGENTS.md + DESIGN.md), or into a design tool such as
> Claude Design, v0 or Stitch. For a design tool, skip §A "Tech constraints".
> Build pages in this order: **Match Room → Matches → Landing → Not Found**. The Match Room is the product; the rest frames it.

=====

# Build the frontend for "Kya Hua?" — an AI catch-up buddy for live sports

## Product in one breath
A fan is watching a live match on TV. They step away — an ad break, chai, a phone call — and come back.
**Kya Hua?** ("what happened?") tells them exactly what they missed in 10 seconds, in **English, Hinglish,
Hindi or Gujarati**, and can read it aloud. They can then ask the match questions by text or voice
("Kitne runs chahiye?", "How many overs does Rauf have left?"). It's a **second screen**: there is
**no video** in the app. Cricket first; football and kabaddi later, so the shell must be sport-neutral.
For the demo, a completed match is **replayed ball-by-ball as if live**. No login, no accounts.

## Visual direction: Minimal + Bold
- Stadium-at-night app: near-black background `#0B0B0D`, hairline borders `#2A2A31`, white text, **one accent red `#E8192C`**
  used only for the primary action and for a wicket. Huge numerals. Lots of empty space. No gradients, no glassmorphism
  except the blurred sticky app bar, no drop shadows in dark mode, no illustrations, no stock photos, no emoji in chrome.
- Landing page uses the **light "paper" theme** (`#F4F2EE` bg, `#0B0B0D` ink, same red) — like the front page of a sports paper.
- Type: **Archivo** variable (scores and headlines at weight 800–900, width 112 — wide, heavy, tabular numerals)
  + **Hanken Grotesk** for UI/body. Noto Sans Devanagari / Gujarati for Indic text.
- Rounded but not bubbly: cards 20px radius, sheets 28px, chips pill-shaped.
- Reference mood: modern sports-score app — big score card at the top, details stacked below,
  a "commentary" waveform for audio. Keep it far more minimal than typical score apps: max 5 elements visible per viewport.
- **Never** use real team logos, league logos, broadcaster or Dream11 branding. Teams appear as text monograms (`IND`, `WI`).
- Full token list, component anatomy, motion and a11y rules: `docs/DESIGN.md` (source of truth).

## A. Tech constraints (code agents only)
- React 18 + TypeScript strict + Vite + React Router. **SCSS modules only** (`Component.module.scss`) using tokens
  from `src/styles/_tokens.scss` exposed as CSS custom properties. **No Tailwind, Bootstrap, UI kits or CSS-in-JS.**
- Icons: `lucide-react`, per-icon imports. No other UI dependencies.
- Mobile-first SCSS: base = 360px, then `@include up(sm|md|lg)` at 600 / 900 / 1200px.
- Routes are lazy-loaded (`React.lazy`) so the landing page doesn't ship the match room code.
- **Frontend-first with mock data:** use `src/mocks/match.mock.ts` (shape below) and a mock service
  `src/services/mockApi.ts` that returns canned recaps/answers after 700–1200ms. Real APIs plug in later behind the same interface.
- Sport-specific UI lives in `src/sports/cricket/ui/`; the page shell only renders slots from the sport registry.

## B. Pages & routes
| Route | Page | Purpose |
|---|---|---|
| `/` | Landing | Explain the problem + product in 5 seconds; one CTA into the demo |
| `/matches` | Matches | Pick a sport and a match to replay |
| `/match/:matchId` | Match Room | The product: live scoreboard, Catch up, Ask, Moments |
| `*` | Not Found | One line + way back |
Sheets (not routes): Language, Settings, Verified-stats info, Replay scrubber, Share.

---

## 1. Match Room — `/match/:matchId` (build first)

### 1.1 Mobile layout (design at 360×800, top → bottom)
**a) AppBar (56px, sticky):** back chevron · title "IND vs PAK" with sub-line "T20 World Cup · MCG" (14px, text-2) ·
`LangChip` (shows `Hing`) · settings icon. Transparent at top; after 8px scroll gets 88% bg + blur + bottom hairline.

**b) ScoreHero card (the hero, ~300px tall, full-bleed card with 28px radius, 16px side margin):**
- Row 1: `LiveDot` + "REPLAY" label (12px uppercase, green dot) on the left; `ReplayControl` pill on the right
  (play/pause icon button + speed chip `5×`).
- Row 2: batting team monogram `IND` (40px circle) + team name; small "chasing 160" in text-2.
- Row 3 — **the score**: `144/4` in Archivo 800 wdth 112 at ~84px, tabular numerals; to its right, baseline-aligned,
  `19.0 ov` in 20px text-2. When runs change, only the changed digits roll up (420ms). On a wicket, a 4px red bar
  sweeps under the score and fades (600ms).
- Row 4: status line in 18px semibold: **"Need 16 off 6"**.
- Row 5: `ChaseBar` — 6px track, fill = 144/160, red fill.
- Row 6: meta pills, small: `CRR 7.58` · `RRR 16.00` · `P'ship 113`.
- Row 7: `OverStrip` — last 6 balls as 32px chips with text: `1 · 1 · • · 1 · 6 · 6` (colours per DESIGN.md §1.3).
- Row 8: players, two columns of `PlayerLine`: left "Kohli 74 (50)", "Hardik 40 (36)"; right "Bowler · Nawaz 3-0-29-0".
  Mark the striker with a small red dot, not an asterisk.
- On scroll past the hero, it **collapses into a 56px sticky score bar** under the AppBar:
  `IND 144/4 · 19.0 · Need 16 off 6` + LiveDot. Smooth 220ms transition.

**c) AwayBanner (conditional, sits right under the hero):** appears when the fan returns after missing ≥ 6 legal balls
(page was hidden) or after the "Simulate stepping away" demo action. Content: accent-soft background, icon, text
**"You missed 12 balls · 2 overs"** and a small primary button **"Catch me up"**. Close (×) icon. Slides down 220ms.

**d) SegmentedControl tabs:** `Catch up` · `Ask` · `Moments` (sticky below the collapsed score bar).

**e) Tab content** (see 1.3–1.5).

**f) Bottom action area (fixed, thumb zone, safe-area aware, bg fades from transparent to `--c-bg`):**
- On *Catch up* tab: primary full-width button **"Catch me up"** (48px) + row of 3 quick chips above it:
  `Last over` · `Last 2 overs` · `Last 5 overs`.
- On *Ask* tab: `Composer` (input + mic + send) with suggested-question chips scrolling horizontally above it.
- On *Moments* tab: nothing fixed.

### 1.2 Desktop / tablet layout
- **≥900px:** two columns inside a 1200px container. Left column (5/12, sticky top 72px): ScoreHero (never collapses),
  players, `OverStrip` showing the full current over and previous over. Right column (7/12): AwayBanner, tabs, tab content.
  The "Catch me up" button and Composer live **inside** the right column (not fixed to the viewport).
- **600–899px:** single column like mobile, but ScoreHero shows players in one row and content max-width 640px centred.
- Keyboard: `Space` play/pause · `C` catch up · `/` focus Ask · `L` language sheet. Show a tiny "?" shortcut hint in the footer of the right column.

### 1.3 Tab: Catch up
- **Empty/first state:** big Archivo line "Stepped away?" + text-2 sentence
  "Tap Catch me up when you're back. We'll tell you only what you missed." + a one-time tip card:
  "Tip: switch apps or lock your phone — when you return we'll know what you missed." with a ghost button
  **"Simulate stepping away"** (jumps the replay 2 overs and triggers the AwayBanner — vital for reviewers on desktop).
- **Loading:** RecapCard skeleton (overline bar, 2 thick lines, 2 thin lines, 4 chip pills). Never a spinner alone.
- **RecapCard (result):**
  - Overline: `SINCE 17.0 · 12 BALLS` + `VerifiedBadge` ("✓ Verified stats", tappable → info sheet).
  - Lead line 20px semibold, e.g. Hinglish: **"Kohli ne Rauf ko lagataar 2 chhakke maare — ab 6 balls mein 16 chahiye!"**
  - Body 16px, 1–2 lines: "Shaheen ke over mein 17 runs aaye, phir Rauf ki last 2 balls pe Kohli ke back-to-back chhakke. Kohli 74* (50), Hardik 40* (36)."
  - `FactStrip`: `+32 runs` `0 wkts` `2×6` `3×4` `Need 48 off 18 → 16 off 6` — chips built from computed facts.
  - Action row: `SpeakButton` ("Listen" → animated 5-bar waveform + "Stop" while speaking) · Share · "Ask about this" (switches to Ask tab with context).
  - Lines fade up with 60ms stagger.
- **History:** previous recaps stack below as collapsed rows ("Since 10.1 · 24 balls · 2 wkts") — tap to expand. Newest on top.
- **Nothing missed** state: "You're all caught up." + the current status line.
- **AI unavailable** state: RecapCard still renders using the template text and badge variant "Template" — never a dead end.

### 1.4 Tab: Ask
- **Empty state:** "Ask the match." + 4 suggested chips in the current language, e.g. Hinglish:
  `Kitne runs chahiye?` · `Top scorer kaun?` · `Rauf ke kitne overs bache?` · `Last wicket kaise gira?`
- Thread: fan bubble right (surface-3, 16px), answer bubble left (surface-1, hairline border) with tiny VerifiedBadge
  and a SpeakButton icon. Answers appear with a 3-dot typing indicator, then text fades in.
- "I don't know" answers are styled the same, honest: "Ye info abhi mere paas nahi hai — main sirf is match ka data dekh sakta hoon."
- Composer: 48px pill input, placeholder "Kuch bhi poocho…" (per language), char counter appears after 160/200.
  Mic button → **listening state**: composer turns into a red pulsing ring + live transcript text + "Tap to stop".
  If speech recognition isn't supported, the mic button is not rendered at all (no disabled ghost).
- Errors: inline under the bubble "Couldn't reach the AI. Retry" (retry link). Rate-limited: "Easy, captain — try again in a few seconds."

### 1.5 Tab: Moments
- Vertical timeline (`<ol>`), newest first, only key events: wickets, sixes, fours (toggle chips: `All` `Wickets` `Boundaries`),
  milestones (50s, 100s), over summaries every 5 overs.
- Each row: clock `16.3` in Archivo 700 · event chip · one line ("V Kohli — SIX off Haris Rauf" — description comes from the data, not AI)
  · trailing link "Recap from here" (runs Catch up from that ball).
- Long list uses `content-visibility: auto`.

### 1.6 Sheets
- **Language sheet:** 4 large radio rows showing the language in its own script with an English sub-label:
  `English`, `Hinglish — Hindi in English letters`, `हिंदी — Hindi`, `ગુજરાતી — Gujarati`. A small note under Gujarati/Hindi
  if no voice is installed: "Voice not available on this device — text only."
- **Settings sheet:** Theme (System / Dark / Light segmented) · Auto-read recaps (toggle) · Voice speed (0.8× 1× 1.2×) ·
  Replay speed (1× 5× 20×) · "Restart replay" · "About this demo" (data from Cricsheet, AI is grounded, no data stored).
- **Verified info sheet:** headline "Numbers by code. Words by AI." + 3-step mini diagram:
  `Ball-by-ball data → Stats engine → AI writes the sentence → Number check` + one line: "If the AI writes a number that isn't in the stats, we replace its text with a safe template."
- **Replay scrubber sheet** (long-press speed chip): slider over the whole match with innings marker and wicket ticks; "Jump" button.

### 1.7 Match Room states to design
Loading (full skeleton of hero + tabs) · Match not found (→ Not Found) · Data failed to load (ErrorState + Retry) ·
Replay finished (hero shows result line "IND won by 4 wickets" + "Replay again" button; Catch up still works) · Offline (toast "You're offline — replay continues, AI needs internet").

---

## 2. Matches — `/matches`
- AppBar: wordmark `kya hua?` (left) · settings (right).
- H1 "Pick a match." + text-2 sub "Replays play ball-by-ball, just like live."
- `SportTabs`: **Cricket** (active) · Football `SOON` · Kabaddi `SOON` (disabled, still visible — shows the multi-sport vision).
- **Live now** section: honest empty state card — "No live feed in this demo. Try a replay below." (keeps the live concept visible).
- **Featured replays** — horizontal snap carousel of 1–3 big cards (280×168, 28px radius). Card: competition overline
  (`T20I · 2026`), two big monograms `IND` vs `WI`, final scores in Archivo 800, a one-line hook ("Last-over thriller"),
  and a "Replay ▶" pill. First card uses a solid accent background with white text (the single bold red moment on this page);
  others surface-1.
- **All replays** list: rows with monograms, "India vs Pakistan", "T20 World Cup · MCG · 23 Oct 2022", result line, format chip, chevron.
- Desktop ≥900: featured cards become a 3-column grid; list in a 2-column grid.
- States: skeleton rows; error with retry.

---

## 3. Landing — `/` (paper theme, one long scroll, fast)
Purpose: a reviewer opening the link understands the problem and the product in 5 seconds and taps into the demo.

1. **Nav (sticky, 64px):** wordmark left; right: text link "How it works" + primary button **"Try the demo"**.
2. **Hero:**
   - Overline: `SECOND-SCREEN AI FOR LIVE SPORTS`
   - Headline (mega, 2–3 lines, Archivo 900): **"Missed two overs?"** / line 2 in accent red: **"Kya hua? Just ask."**
   - Sub (20px, max 34ch): "An AI match buddy that catches you up in 10 seconds — in English, Hinglish, हिंदी or ગુજરાતી. Every number verified."
   - CTAs: primary **"Open live demo →"** (→ `/match/<featured>`), secondary ghost "Pick a match" (→ `/matches`).
   - Visual (right on desktop, below on mobile): a **real, live-rendered phone frame** (CSS only, 9:19.5, 36px radius,
     dark theme inside) containing the actual `ScoreHero` + `RecapCard` components running a muted auto-demo: score ticks,
     the AwayBanner slides in, the recap types itself. Pause the loop when off-screen (IntersectionObserver) and under reduced motion.
3. **Problem strip** (3 big-number columns, numbers in Archivo 900 72px, captions 14px with source in text-3):
   `80%` "of fans already use a second screen during matches" — `2 balls` "streams can lag behind the real match" —
   `+42%` "growth in regional-language cricket watch-time". (Sources listed in footer.)
4. **How it works** — 3 numbered steps, huge outlined numerals `1 2 3`: "Step away" → "Come back, tap once" →
   "Ask anything — by voice". Each with a 1-line description.
5. **Trust section** (dark band for contrast): headline "Numbers by code. Words by AI." + the 4-node pipeline diagram
   (pure CSS/SVG boxes and arrows) + one sentence on the number guard.
6. **Language showcase:** segmented control EN / Hing / हिं / ગુ switching the same recap text live.
7. **Every sport, next:** row of sport chips — Cricket (live) · Football · Kabaddi · Hockey (soon) — "One engine, any sport: each sport is a plug-in."
8. **Final CTA band:** "The match won't wait. Your catch-up can." + primary button.
9. **Footer:** "Prototype by Ankush" · "Ball-by-ball data: Cricsheet (ODC-BY)" · source links for the stats · "No login. Nothing stored."
- Mobile: everything single column, hero phone frame scaled to 86% width below the CTAs.
- Performance: no images except the favicon; the phone demo is real DOM. LCP target < 1.8s on mid-range Android.

---

## 4. Not Found — `*`
Huge Archivo 900 "**OUT!**" (accent) + "This page was caught at slip." + button "Back to matches". Paper or dark theme follows the user's theme.

---

## 5. Global behaviour
- **Theme:** app follows system, default dark; Settings overrides; landing always paper. Tokens swap via `[data-theme]` on `<html>`.
- **Language:** stored in `localStorage` (try/catch), default from `navigator.language` (`gu*`→Gujarati, `hi*`→Hinglish, else English).
  Changing language re-renders suggested chips and placeholders instantly; existing recaps keep their original language with a "Translate" link.
- **Away detection:** Page Visibility API. On return, if ≥ 6 legal balls passed, show AwayBanner. Replay clock is time-based so
  the match keeps moving while the tab is hidden.
- **Toasts** for: copied share link, offline/online, voice not available.
- **Safe areas:** `env(safe-area-inset-*)` on AppBar and bottom action area. Use `100dvh`, never `100vh`.
- **PWA polish:** theme-color `#0B0B0D`, apple-touch icon = wordmark `?` on red, standalone display.

## 6. Mock data contract (frontend-first)
```ts
// src/mocks/match.mock.ts — matches shared/sports/types.ts
// Demo match: Cricsheet 1298150 — Pakistan v India, T20 World Cup, MCG, 23 Oct 2022 (India won by 4 wkts, last ball).
// Phase 1 may hand-write ~30 events from the last 3 overs; Phase 2 replaces this with the full preprocessed timeline.
export const mockMatch = {
  id: 'pak-ind-2022-t20wc-mcg', sport: 'cricket',
  meta: { title: 'IND vs PAK', subtitle: 'T20 World Cup · MCG', format: 'T20I', date: '2022-10-23',
          teams: [{ code: 'PAK', name: 'Pakistan' }, { code: 'IND', name: 'India' }], target: 160 },
  // TimelineEvent[] — one per delivery; 'clock' is the display label
  events: [
    { seq: 0, clock: '0.1', inn: 1, kind: 'dot', batter: 'Mohammad Rizwan', bowler: 'Bhuvneshwar Kumar', runs: 0, extras: 0, legal: true, score: 0, wkts: 0, text: 'Dot ball' },
    // …generate ~240 plausible events for both innings in the mock
  ],
};
// mockApi.recap({ fromSeq, toSeq, lang }) -> { text: { lead, body }, facts: FactChip[], grounded: true, source: 'ai' | 'template' }
// mockApi.ask({ seq, question, lang }) -> { answer, grounded, source }
```

## 7. Acceptance checklist for this phase
- [ ] All 4 pages + 4 sheets built, mobile 360px and desktop 1280px, no horizontal scroll.
- [ ] Replay runs from mock data with play/pause/speed; score roll + wicket bar animations; reduced-motion respected.
- [ ] AwayBanner triggers on tab hide/return and via "Simulate stepping away".
- [ ] Catch up / Ask / Moments work end-to-end against `mockApi` incl. loading, error, empty states.
- [ ] Language switch changes UI strings and Indic fonts load lazily.
- [ ] Voice: SpeakButton works in Chrome/Safari; mic hidden where unsupported.
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- [ ] Zero hard-coded colours/sizes outside `_tokens.scss`.

=====


---

## 8. Learn mode (added Tue 13 Oct) — see PRD F12, ARCHITECTURE §7c
- **LearnToggle:** pill in the AppBar right cluster (before LangChip): graduation-cap icon + "Learn". Off = surface-2 outline; On = `--c-accent-soft` bg, `--c-accent-text` label, icon filled. First time it's turned on: toast "Learn mode on — I'll explain rules as they happen."
- **Teachable chips:** when Learn is on, BallChips/MomentItems carrying a teachable event get a tiny 6px dot (`--c-accent-text`) top-right; tapping explains it. `aria-label` adds "— tap to learn: Free hit".
- **LearnCard** (appears when a teachable event happens live; mobile: slides up above the bottom action area, full width minus gutter; ≥900: top of right column):
  - Overline `LEARN · FREE HIT` (label style) + close ×.
  - Title = the term in the fan's language, Archivo 800 22px.
  - `short` rule line (16px, text) — from the rulebook.
  - `moment` line (16px, text-2) prefixed with a small "In this match" label — e.g. "Kohli bowled on a free hit, so NOT out. Ball was live, so they ran 3 byes."
  - Actions: SpeakButton (auto-plays if Auto-read is on) · "Got it" (marks learned, dismiss) · "More" (opens Ask with "Explain <term> more").
  - Never covers the score; never more than one card at a time; queued cards collapse into "+2 more to learn" chip.
  - Reduced motion: fade only.
- **Glossary sheet** (from Settings and from a "Learned 4 rules" chip in the Learn card footer): list of learned + not-yet-learned rules for this sport, each expandable with `detail` and Listen.
- **Matches page:** Football/Kabaddi "SOON" cards gain a secondary action "Learn the rules" → glossary sheet for that sport (works without match data — shows multi-sport readiness).
- **Landing:** add one feature row "New to a sport? Turn on Learn." with a mini LearnCard mock (free-hit example).
- States: loading (card skeleton with title shown immediately from rulebook), AI failure (template moment), offline (rulebook text only).
