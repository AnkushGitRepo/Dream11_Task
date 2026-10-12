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
