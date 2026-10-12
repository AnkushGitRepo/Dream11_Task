# ROADMAP.md — beyond the assessment

**Now (v1 — assessment, by 13 Oct):** cricket replay, Catch me up, Ask, 4 languages, voice, grounded AI, landing.

**Next (v1.1 — demo round, ~1–2 weeks)**
- Live feed adapter (Sportmonks/Roanuz trial) behind the same `TimelineEvent` contract — replay and live become two sources.
- Personal "since you left" across sessions (remember last seen seq per match, local only).
- Recap length control (10 s / 30 s) and "explain like I'm new" mode (rules: DLS, review, field restrictions).
- Watch-along integration concept: same pipeline generates creator talking points and an over-break poll question.
- Eval dashboard: guard-fallback rate, latency, thumbs up/down per language.

**Later (v2 — product-grade)**
- **Football adapter** (goals, cards, xG-free summaries), then **kabaddi** (raids, all-outs) — UI slots only, core unchanged.
- More languages: Tamil, Telugu, Bengali, Marathi, Kannada (TTS availability check per device; server TTS option).
- Push "you missed a wicket" only when the app is backgrounded and the fan opted in.
- Telegram/WhatsApp bot surface using the same `/api` (group chats are where fans actually talk).
- Server-side TTS for consistent voices; streaming responses.
- Embeddable widget for creators' streams and partner apps (FDE angle: deploy into a partner's surface in a day).

**Guardrails that never change:** numbers from code, no betting/prediction framing, no PII, sport-agnostic core.
