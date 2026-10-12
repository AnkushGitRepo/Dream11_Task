# DESIGN.md — Kya Hua? design system

**Direction: Minimal + Bold.** Very few elements per screen, each one confident.
Huge numerals, one accent colour, generous black space, hairline borders, no decoration that doesn't carry information.
Think "stadium scoreboard at night" for the app and "sports newspaper front page" for the landing page.

Principles
1. **The score is the hero.** The biggest thing on any match screen is the score. Nothing competes with it.
2. **One accent, used for action and drama.** Red = the primary CTA and a wicket. Nothing else is red.
3. **Glanceable in 2 seconds.** A fan looking up from the TV must read state without reading sentences.
4. **Thumb zone.** Primary actions live in the bottom third on mobile.
5. **Trust is visible.** AI text always sits next to the computed facts it came from ("Verified stats" badge).
6. **Sport-neutral shell, sport-specific slots.** Chrome, cards, sheets and typography never assume cricket.

---

## 1. Tokens (`src/styles/_tokens.scss` → emitted as CSS custom properties)

### 1.1 Colour — dark theme (app default)
| Token | Value | Use |
|---|---|---|
| `--c-bg` | `#0B0B0D` | page background |
| `--c-surface-1` | `#141417` | cards |
| `--c-surface-2` | `#1C1C21` | raised: sheets, inputs, chips |
| `--c-surface-3` | `#26262D` | pressed / hover |
| `--c-line` | `#2A2A31` | 1px borders, dividers |
| `--c-text` | `#F5F5F7` | primary text |
| `--c-text-2` | `#A1A1AA` | secondary text |
| `--c-text-3` | `#6B6B75` | tertiary, disabled (never for essential info) |
| `--c-accent` | `#E8192C` | primary buttons, wicket bar (white text on it = 4.56:1 ✅) |
| `--c-accent-press` | `#C21424` | pressed state |
| `--c-accent-text` | `#FF5A67` | accent used AS text on dark bg (6.4:1 ✅) |
| `--c-accent-soft` | `rgb(232 25 44 / 0.14)` | away banner bg, selected chip bg |
| `--c-on-accent` | `#FFFFFF` | text on accent |
| `--c-live` | `#22C55E` | live/replay dot only |
| `--c-focus` | `#FFFFFF` | focus ring (2px + 2px offset) |

### 1.2 Colour — light ("paper") theme (landing page always; app when user picks Light)
| Token | Value |
|---|---|
| `--c-bg` | `#F4F2EE` |
| `--c-surface-1` | `#FFFFFF` |
| `--c-surface-2` | `#ECE9E3` |
| `--c-surface-3` | `#E2DED6` |
| `--c-line` | `#D9D5CC` |
| `--c-text` | `#0B0B0D` |
| `--c-text-2` | `#4A4A52` |
| `--c-text-3` | `#7A7A84` |
| `--c-accent` | `#E8192C` |
| `--c-accent-text` | `#C8101F` |
| `--c-focus` | `#0B0B0D` |

### 1.3 Event colours (sport adapters map their events onto these; always paired with a text label)
| Token | Dark | Light | Cricket meaning | Football meaning (future) |
|---|---|---|---|---|
| `--c-ev-major` | `#FF5A67` | `#C8101F` | Wicket | Goal |
| `--c-ev-big` | `#FFB020` | `#A86B00` | Six | Red card |
| `--c-ev-good` | `#34D399` | `#0F7A55` | Four | Shot on target |
| `--c-ev-minor` | `#A1A1AA` | `#4A4A52` | Extra (wd/nb/lb/b) | Yellow card |
| `--c-ev-none` | `#3A3A42` | `#C9C4BA` | Dot ball | — |
Chips with event colour use the colour as **background at 16% + full-colour text**, except wicket/goal which is a solid `--c-accent` chip with white text.

### 1.4 Typography
Load from Google Fonts with `display=swap`; Indic fonts load **only when that language is selected** (dynamic `<link>`).

| Role | Family | Notes |
|---|---|---|
| Display + numerals | **Archivo** (variable, `wght 400–900`, `wdth 62–125`) | Scores at `wdth 112, wght 800`; labels at `wdth 87` condensed. Always `font-variant-numeric: tabular-nums` for changing numbers. |
| UI / body | **Hanken Grotesk** (400, 500, 600, 700) | All paragraphs, buttons, inputs. |
| Hindi | **Noto Sans Devanagari** (400, 600, 700) | `:lang(hi)` |
| Gujarati | **Noto Sans Gujarati** (400, 600, 700) | `:lang(gu)` |

Scale (fluid with `clamp()`; mobile → desktop):
| Token | Size / line-height | Weight | Family | Use |
|---|---|---|---|---|
| `--t-mega` | `clamp(48px, 13vw, 128px)` / 0.9 | 900, wdth 100 | Archivo | Landing headline |
| `--t-score` | `clamp(56px, 16vw, 96px)` / 0.88 | 800, wdth 112 | Archivo | Live score |
| `--t-score-sm` | `28px / 1` | 800, wdth 112 | Archivo | Collapsed score bar, match cards |
| `--t-h1` | `clamp(28px, 6vw, 40px)` / 1.05 | 800 | Archivo | Page titles |
| `--t-h2` | `22px / 1.15` | 700 | Archivo | Section titles |
| `--t-lead` | `20px / 1.35` | 600 | Hanken | Recap lead line |
| `--t-body` | `16px / 1.5` | 400 | Hanken | Body (never smaller on mobile inputs: prevents iOS zoom) |
| `--t-small` | `14px / 1.45` | 500 | Hanken | Meta, secondary |
| `--t-label` | `12px / 1.2`, `letter-spacing: 0.08em`, uppercase | 700, wdth 87 | Archivo | Overlines, chips, badges |
Indic scripts get `line-height` +0.15 (`:lang(hi), :lang(gu) { line-height: 1.65 }`) and no uppercase/letter-spacing.

### 1.5 Space, radius, size
- Space (4pt): `--s-1 4px · --s-2 8px · --s-3 12px · --s-4 16px · --s-5 20px · --s-6 24px · --s-8 32px · --s-10 40px · --s-14 56px · --s-20 80px`
- Page gutter: `16px` mobile, `24px` ≥600, `32px` ≥900. Max content width `1200px`.
- Radius: `--r-sm 8px` (chips) · `--r-md 14px` (inputs, buttons) · `--r-lg 20px` (cards) · `--r-xl 28px` (sheets, hero card) · `--r-pill 999px`
- Hit target: `--hit 44px` minimum (48px for primary CTA).
- Borders: always `1px solid var(--c-line)`. **No drop shadows in dark theme.** Light theme: `--shadow-1: 0 1px 2px rgb(0 0 0 / .06), 0 8px 24px rgb(0 0 0 / .06)`.

### 1.6 Motion
- Durations: `--d-fast 120ms` (press) · `--d-base 220ms` (state) · `--d-slow 420ms` (sheets, score roll)
- Easing: `--e-out cubic-bezier(.2,.8,.2,1)` · `--e-spring cubic-bezier(.34,1.56,.64,1)` (chips popping in only)
- Signature moments:
  - **Score roll:** changed digits slide up 100% and fade (`--d-slow`). Only the digits that changed.
  - **Wicket/goal flash:** a 4px accent bar under the score grows 0→100% width, then fades (600ms). Score text does NOT flash.
  - **New ball chip:** pops in from scale .6 with `--e-spring`; oldest chip slides out left.
  - **Recap reveal:** lines fade-up 8px with 60ms stagger.
- `@media (prefers-reduced-motion: reduce)`: all of the above become instant opacity changes.

### 1.7 Breakpoints (`src/styles/_mixins.scss`)
`sm 600px` · `md 900px` · `lg 1200px` — mobile-first `@mixin up($bp)`. Design at **360×800** first, verify at 390×844, 768×1024, 1280×800, 1440×900.

### 1.8 Elevation / layers
`--z-base 0 · --z-sticky 10 · --z-dock 20 · --z-sheet 40 · --z-toast 50`

---

## 2. Components (generic unless marked [cricket])

| Component | Anatomy & behaviour |
|---|---|
| **AppBar** | 56px. Left: back or wordmark. Centre: title (truncate). Right: `LangChip` + settings IconButton. Transparent until scroll, then `--c-bg` at 88% + `backdrop-filter: blur(12px)` + bottom border. |
| **Wordmark** | "kya hua?" all lowercase, Archivo 900 wdth 112, the `?` in `--c-accent`. Never an image. |
| **Button** | Variants: `primary` (accent bg, white, 48px, `--r-md`, Hanken 700), `secondary` (surface-2 bg, line border), `ghost` (text only). Full-width on mobile when primary. Pressed: scale .98 + `--c-accent-press`. Loading: spinner replaces label, width locked. |
| **IconButton** | 44×44, icon 22px, `--r-pill`, requires `aria-label`. |
| **Chip / FilterChip** | 32px tall (hit area padded to 44), `--r-pill`, `--t-small` 600. Selected = `--c-accent-soft` bg + `--c-accent-text`. |
| **SegmentedControl** | Tabs: 44px, surface-2 track, selected thumb surface-1 (dark) with 220ms slide. `role="tablist"`, arrow-key navigation. |
| **LangChip** | Shows current language in its own script: `EN`, `Hing`, `हिं`, `ગુ`. Opens LanguageSheet. |
| **Card** | surface-1, `--r-lg`, 1px line, padding `--s-4` (mobile) / `--s-6` (md+). |
| **BottomSheet** | Mobile: slides up, `--r-xl` top corners, grab handle, max-height 88dvh, scroll inside, focus-trapped, Esc/drag-down/scrim to close. ≥900: becomes a right side panel 420px. |
| **Skeleton** | surface-2 blocks with a slow shimmer (disabled under reduced motion). Shapes match final content. |
| **Toast** | Bottom-centre above dock, surface-3, auto-dismiss 3s, `role="status"`. |
| **EmptyState / ErrorState** | Big Archivo line + one sentence + one action. Never an illustration. |
| **LiveDot** | 8px `--c-live` dot with a 2s pulse ring + label "REPLAY" / "LIVE". |
| **ScoreHero** [sport slot] | See DESIGN_PROMPT §Match Room. Generic frame: competition line, two team monograms, big score, status line, progress bar, meta pills. Cricket fills it with runs/wkts/overs/target. |
| **TeamMonogram** | 40px circle, surface-2, team short code in Archivo 800 (e.g. `IND`). **No official logos or crests.** Optional 2px ring in a neutral team tint. |
| **BallChip** [cricket] | 32px circle. Text always present: `•` dot, `1`–`3`, `4`, `6`, `W`, `wd`, `nb`, `lb`. Colours per §1.3. `aria-label="Over 16 ball 3: four runs"`. |
| **OverStrip** [cricket] | Horizontal row of last 6–12 BallChips with an over separator `|`. |
| **PlayerLine** | Name (Hanken 600) + stat in Archivo tabular (`42 (27)` / `3-0-24-1`) + small "on strike" marker. |
| **ChaseBar** [cricket] | Thin 6px track; fill = runs scored / target. Label above: "Need 22 off 21". |
| **AwayBanner** | `--c-accent-soft` bg, accent-text icon, "You missed **14 balls**" + primary small button "Catch me up". Slides down from under ScoreHero. Dismissible. `role="status"`. |
| **RecapCard** | Header: overline "SINCE 14.2 · 16 BALLS" + `VerifiedBadge`. Lead line (`--t-lead`). 1–3 body lines. `FactStrip`. Action row: `SpeakButton`, Share, "Ask about this". |
| **VerifiedBadge** | Check-shield icon + "Verified stats" label; tooltip/sheet: "Every number here was computed from the ball-by-ball data, not written by AI." Variant "Template" when the guard fell back. |
| **FactStrip** | Wrap row of compact fact chips: `+31 runs`, `1 wkt`, `2×6`, `RRR 9.4 → 6.3`. Built from engine facts — rendered even if AI fails. |
| **SpeakButton** | Idle: speaker icon "Listen". Playing: animated 5-bar waveform (CSS) + "Stop". Hidden when no voice for the language. |
| **AskThread** | Fan bubbles right (surface-3), answers left (surface-1 with tiny VerifiedBadge). Answers stream in. Max width 85%. |
| **Composer** | 48px input `--r-pill`, placeholder in chosen language, mic IconButton (hidden if unsupported), send IconButton (accent when non-empty). Max 200 chars with counter after 160. Sticks above keyboard (`env(keyboard-inset-height)` / `visualViewport`). |
| **MicListening** | Full-width overlay in composer: pulsing accent ring + live transcript + "Tap to stop". |
| **MomentItem** | Timeline row: clock label (`16.3`) in Archivo, event chip, one-line description. Tap → "Recap from here". |
| **MatchCard** | Featured: 280×168, `--r-xl`, solid surface with big team codes and score; Compact row: monograms, teams, result line, date, format chip, chevron. |
| **SportTabs** | Cricket (active) · Football · Kabaddi — disabled with "SOON" label chip. |
| **ReplayControl** | Compact pill in ScoreHero: play/pause IconButton + speed chip `1× / 5× / 20×` cycle. Long-press speed chip opens Scrubber sheet. |

## 3. Iconography
`lucide-react` with **per-icon imports only**, 1.75px stroke, 22px default, `currentColor`. No emoji in UI chrome (emoji allowed inside AI recap text only if the model writes them; we instruct it not to).

## 4. Writing style (UI copy)
- Talk like a friend on the couch, not a broadcaster. Short. Present tense.
- Numbers as numerals. Overs as `16.3`. "Need 22 off 21".
- Hinglish in Latin script ("Kohli ne 2 chhakke maare"); Hindi in Devanagari; Gujarati in Gujarati script.
- Never predict a result or use betting language ("odds", "sure win", "bet").

## 5. Accessibility contract
- Contrast AA everywhere (the token table above is pre-checked).
- Colour never carries meaning alone (chips have text).
- Score updates: one `aria-live="polite"` region that announces **only** wickets, boundaries and end of over — not every ball.
- `lang` attribute set on recap/answer text (`en`, `hi`, `gu`; Hinglish = `en-IN`).
- Focus trap + restore in sheets. Visible `:focus-visible` ring on everything.
- Desktop shortcuts: `Space` play/pause · `C` catch me up · `/` focus Ask · `L` language.
