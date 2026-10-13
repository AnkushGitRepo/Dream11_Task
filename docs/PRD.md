# PRD — Kya Hua? (v1, assessment build)

| | |
|---|---|
| Owner | Ankush |
| Status | Approved for build |
| Deadline | Tue 13 Oct 2026, night IST (submission form) |
| Context | Dream11 FDE Intern assessment: "one AI-powered artifact that solves a real problem fans face during a live match" |

## 1. Problem
Fans watching live sport constantly lose the thread: an ad break, a chai run, a phone call, a stream lagging
behind the real match, or joining mid-innings. Today they piece the gap together by switching between a score app,
social media and group chats — in English, while a fast-growing share of fans watch in their own language.

Evidence (see Sources):
- 80% of sports fans already use a second screen during live matches (Dream11 public materials).
- Fans complain streams run balls behind the real match; score apps reveal moments before the video shows them.
- Regional-language cricket watch-time grew ~42% in IPL 2026 vs the previous edition (JioStar).
- Dream11 itself pivoted to second-screen engagement; its CEO calls switching between score apps, social and chats a "broken experience".

## 2. Target users
| Persona | Situation | Need |
|---|---|---|
| **Returning fan** (primary) | Watching on TV/Hotstar, stepped away 2–10 min | "What did I miss?" in < 10 s, without scrolling ball-by-ball |
| **Regional fan** | Comfortable in Hindi/Gujarati/Hinglish, not English stats | The same catch-up in their language, optionally spoken |
| **Can't-watch fan** | Commuting, at work, hands busy | Ask by voice, hear the answer |
| **Watch-along viewer** (secondary) | In a creator stream / group chat | A trustworthy fact to settle the argument |

## 3. Goals & non-goals
**Goals**
- G1 Catch a returning fan up in one tap, under 3 s, with zero wrong numbers.
- G2 Support 4 languages (EN, Hinglish, HI, GU) for text, voice where the device allows.
- G3 Let fans ask grounded questions about the current match state.
- G4 Prove the design generalises to other sports (adapter architecture + football stub).
- G5 Help new fans understand a sport's rules in the moment (Learn mode) — the barrier that stops Indians enjoying football, kabaddi etc.

**Non-goals (v1)** — video/streaming, login/accounts, real live data feed, predictions/win probability or anything
resembling betting, fantasy team features, push notifications, social/chat features.

## 4. Features & acceptance criteria
| ID | Feature | Acceptance criteria |
|---|---|---|
| F1 | Replay engine | Plays a completed match ball-by-ball; play/pause; 1×/5×/20×; time-based clock keeps advancing while the tab is hidden; restart & scrub. |
| F2 | Live scoreboard | Score, overs, target, need X off Y, CRR/RRR, partnership, batters, bowler, last 6 balls — equal to the official scorecard at every ball (golden tests). |
| F3 | Catch me up | One tap recaps from the last seen ball to now; quick ranges (1/2/5 overs); 3–4 lines lead-first; FactStrip; p95 < 3 s; cached repeats < 200 ms. |
| F4 | Away detection | Returning after ≥ 6 legal balls shows AwayBanner with the missed count; "Simulate stepping away" for desktop demos. |
| F5 | Languages | EN / Hinglish / Hindi / Gujarati for recap, answers, UI chrome strings; correct `lang` attributes and fonts. |
| F6 | Voice out (natural) | Listen/Stop on any recap/answer using server TTS (Gemini TTS) with a warm, conversational style per language; first audio < 3 s (pre-fetched); must not sound robotic. Browser TTS only as fallback. |
| F7 | Ask the match | Text question (≤ 200 chars) answered only from match data; says "I don't know" otherwise; suggested chips per language. |
| F8 | Voice in | Mic → speech recognition (`hi-IN` / `en-IN` / `gu-IN`) → fills composer; hidden where unsupported. |
| F9 | Grounding & guard | Every number in AI text exists in the facts; on violation the template text is shown with a "Template" badge. Zero ungrounded numbers in the eval set. |
| F10 | Moments | Timeline of wickets, boundaries, milestones; "Recap from here". |
| F11 | Landing + Matches | Landing explains the product; matches list with sport tabs (others "Soon"). |
| F12 | **Learn mode** (rules coach) | Toggle "Learn". When a teachable event happens (cricket: no-ball, free hit, wide, bye/leg-bye, run-out, stumped, LBW, DRS/review, maiden, powerplay…; football: offside, penalty, VAR, cards…; kabaddi: raid, bonus line, super tackle, all-out…) a LearnCard explains the rule in 1–2 spoken sentences + what it meant in THIS moment, in the fan's language, with Puck voice. Each term explained once (remembered locally). Tapping any ball chip / asking "what is X?" also explains. Definitions come from a curated, hand-checked rulebook per sport — the AI only adapts wording and connects it to the moment; it never invents a rule. Demo hook: 19.4 free-hit — Kohli bowled but NOT out, 3 byes counted. |
| Stretch | Share recap | Native share / WhatsApp link with recap text. |

## 5. UX principles
Score is the hero · one accent · glanceable in 2 s · thumb-zone actions · trust is visible (see DESIGN.md).

## 6. Success metrics
| Metric | Target (demo) | Would track in production |
|---|---|---|
| Catch-up latency p95 | < 3 s | same |
| Ungrounded-number rate | 0% on eval set | guard-fallback rate per 1k recaps |
| Recap usefulness | reviewer understands state from recap alone | thumbs up/down per recap |
| Return-after-away engagement | — | % of away-returns that tap Catch me up |
| Language mix | — | share of non-English recaps |

## 7. Risks
| Risk | Mitigation |
|---|---|
| LLM invents numbers | Facts computed in code + number guard + template fallback |
| LLM slow/down/no key during review | Template recaps work offline of AI; cache; fast model |
| Gujarati voice missing on devices | Detect voices; text-only fallback with notice |
| Prompt injection via Ask | Delimited user input, strict system rules, length limit, output guard, no tools |
| Reviewer on desktop never "steps away" | "Simulate stepping away" button + onboarding tip |
| Rights/branding | No video, no logos, no Dream11 branding; Cricsheet attribution |

## 8. Release plan
See `docs/PHASES.md` (build) and `docs/ROADMAP.md` (beyond the assessment).

## Sources
- Dream11 pivot & "80% second screen": analyticsinsight.net, storyboard18.com, respawn.outlookindia.com (Dec 2025)
- Stream lag complaints: m9.news (Mar 2025); cricket app 1-star review analysis: unstar.app (2026)
- Regional watch-time +42%: deccanherald.com (IPL 2026)
